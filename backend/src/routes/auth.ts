import { forgotPasswordSchema, loginSchema, setPasswordSchema, type TokenInfo } from '@tapbusiness/shared'
import { and, eq, isNull } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { authTokens, users } from '../db/schema'
import {
  createAuthToken,
  currentUser,
  endSession,
  findAuthToken,
  requireUser,
  revokeSessions,
  startSession,
  toSessionUser,
} from '../lib/auth'
import { hashPassword, sha256, verifyPassword } from '../lib/crypto'
import { HttpError, parse } from '../lib/errors'
import { accessLinkEmail } from '../lib/mailer'

const tokenParams = z.object({ token: z.string().min(10).max(100) })
const strict = (max: number) => ({ config: { rateLimit: { max, timeWindow: '1 minute' } } })

export async function authRoutes(app: FastifyInstance) {
  app.post('/login', strict(10), async (request, reply) => {
    const { email, password } = parse(loginSchema, request.body)
    const [user] = await app.db.select().from(users).where(eq(users.email, email))
    // verify even when the user is unknown so response timing doesn't reveal which emails exist
    const ok = await verifyPassword(password, user?.passwordHash ?? 'scrypt$16384$8$1$AAAA$AAAA')
    if (!user || !ok) throw new HttpError(401, 'INVALID_CREDENTIALS')
    if (user.status === 'disabled') throw new HttpError(403, 'ACCOUNT_DISABLED')

    await startSession(app, reply, user.id)
    return { user: toSessionUser(user) }
  })

  app.post('/logout', async (request, reply) => {
    await endSession(app, request, reply)
    return reply.status(204).send()
  })

  app.get('/me', { onRequest: requireUser() }, async (request) => ({ user: currentUser(request) }))

  app.get('/tokens/:token', async (request): Promise<TokenInfo> => {
    const { token } = parse(tokenParams, request.params)
    const row = await findAuthToken(app.db, token)
    if (!row) throw new HttpError(404, 'INVALID_TOKEN')
    return { type: row.token.type, email: row.user.email, name: row.user.name }
  })

  // Accepting an invite or a reset link: set the password and sign in.
  app.post('/tokens/:token', strict(10), async (request, reply) => {
    const { token } = parse(tokenParams, request.params)
    const { password } = parse(setPasswordSchema, request.body)
    const row = await findAuthToken(app.db, token)
    if (!row) throw new HttpError(404, 'INVALID_TOKEN')

    const passwordHash = await hashPassword(password)
    const claimed = await app.db.transaction(async (tx) => {
      // mark used first; if another request already did, this updates nothing
      const used = await tx
        .update(authTokens)
        .set({ usedAt: new Date() })
        .where(and(eq(authTokens.id, sha256(token)), isNull(authTokens.usedAt)))
        .returning({ id: authTokens.id })
      if (!used.length) return null
      const [user] = await tx
        .update(users)
        .set({ passwordHash, status: 'active', activatedAt: row.user.activatedAt ?? new Date() })
        .where(eq(users.id, row.user.id))
        .returning()
      return user
    })
    if (!claimed) throw new HttpError(404, 'INVALID_TOKEN')

    await revokeSessions(app.db, claimed.id)
    await startSession(app, reply, claimed.id)
    return { user: toSessionUser(claimed) }
  })

  // Always answers 204 so it can't be used to find out which emails have accounts.
  app.post('/forgot-password', strict(5), async (request, reply) => {
    const { email } = parse(forgotPasswordSchema, request.body)
    const [user] = await app.db.select().from(users).where(eq(users.email, email))
    if (user && user.status !== 'disabled') {
      const type = user.status === 'pending' ? 'invite' : 'reset'
      const link = await createAuthToken(app, user.id, type)
      await app.mailer.send(
        accessLinkEmail({ to: user.email, name: user.name, locale: user.locale, type, ...link, timeZone: app.config.TIMEZONE }),
      )
    }
    return reply.status(204).send()
  })
}
