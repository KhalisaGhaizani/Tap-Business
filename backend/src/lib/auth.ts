import type { Role, SessionUser } from '@tapbusiness/shared'
import { and, eq, gt, isNull, lt, ne } from 'drizzle-orm'
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import type { Db } from '../db'
import { authTokens, sessions, users } from '../db/schema'
import { randomToken, sha256 } from './crypto'
import { HttpError } from './errors'

export const SESSION_COOKIE = 'tb_session'
const DAY = 24 * 60 * 60 * 1000

export const toSessionUser = (u: typeof users.$inferSelect): SessionUser => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role,
  locale: u.locale,
})

export async function startSession(app: FastifyInstance, reply: FastifyReply, userId: string) {
  const token = randomToken()
  const expiresAt = new Date(Date.now() + app.config.SESSION_DAYS * DAY)
  await app.db.insert(sessions).values({ id: sha256(token), userId, expiresAt })
  await app.db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId))
  reply.setCookie(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: app.config.cookieSecure,
    expires: expiresAt,
  })
}

export async function endSession(app: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
  const token = request.cookies[SESSION_COOKIE]
  if (token) await app.db.delete(sessions).where(eq(sessions.id, sha256(token)))
  reply.clearCookie(SESSION_COOKIE, { path: '/' })
}

/** Resolve the session cookie into request.user. Runs on every request; never throws. */
export async function loadSession(app: FastifyInstance, request: FastifyRequest) {
  const token = request.cookies[SESSION_COOKIE]
  if (!token) return
  const id = sha256(token)
  const [row] = await app.db
    .select({ user: users, expiresAt: sessions.expiresAt })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, id), gt(sessions.expiresAt, new Date())))
  if (!row || row.user.status !== 'active') return

  request.user = toSessionUser(row.user)
  request.sessionId = id
  // sliding expiry: extend once the session is past its half-life
  const ttl = app.config.SESSION_DAYS * DAY
  if (row.expiresAt.getTime() - Date.now() < ttl / 2) {
    await app.db.update(sessions).set({ expiresAt: new Date(Date.now() + ttl) }).where(eq(sessions.id, id))
  }
}

export function requireUser(role?: Role) {
  return async (request: FastifyRequest) => {
    if (!request.user) throw new HttpError(401, 'UNAUTHORIZED')
    if (role && request.user.role !== role) throw new HttpError(403, 'FORBIDDEN')
  }
}

/** The signed-in user; only call behind requireUser(). */
export const currentUser = (request: FastifyRequest) => request.user!

export async function revokeSessions(db: Db, userId: string, exceptSessionId?: string | null) {
  const ofUser = eq(sessions.userId, userId)
  await db.delete(sessions).where(exceptSessionId ? and(ofUser, ne(sessions.id, exceptSessionId)) : ofUser)
}

/** Create a one-time invite/reset link. Older unused links for the user stop working. */
export async function createAuthToken(app: FastifyInstance, userId: string, type: 'invite' | 'reset') {
  const token = randomToken()
  const ttl = type === 'invite' ? app.config.INVITE_DAYS * DAY : app.config.RESET_HOURS * 60 * 60 * 1000
  const expiresAt = new Date(Date.now() + ttl)
  await app.db.transaction(async (tx) => {
    await tx.update(authTokens).set({ usedAt: new Date() }).where(and(eq(authTokens.userId, userId), isNull(authTokens.usedAt)))
    await tx.insert(authTokens).values({ id: sha256(token), userId, type, expiresAt })
  })
  const path = type === 'invite' ? 'activate' : 'reset-password'
  return { url: `${app.config.APP_URL}/${path}/${token}`, expiresAt }
}

/** Look up a still-valid invite/reset token together with its user. */
export async function findAuthToken(db: Db, token: string) {
  const [row] = await db
    .select({ token: authTokens, user: users })
    .from(authTokens)
    .innerJoin(users, eq(users.id, authTokens.userId))
    .where(and(eq(authTokens.id, sha256(token)), isNull(authTokens.usedAt), gt(authTokens.expiresAt, new Date())))
  if (!row || row.user.status === 'disabled') return null
  return row
}

export async function purgeExpired(db: Db) {
  const now = new Date()
  await db.delete(sessions).where(lt(sessions.expiresAt, now))
  await db.delete(authTokens).where(lt(authTokens.expiresAt, new Date(now.getTime() - 30 * DAY)))
}
