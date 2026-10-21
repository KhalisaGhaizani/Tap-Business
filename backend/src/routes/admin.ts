import {
  cardIdSchema,
  createUserSchema,
  emailSchema,
  emptyProfileContent,
  roles,
  updateUserSchema,
  usernameSchema,
  userStatuses,
  type AccessLinks,
  type AdminStats,
  type AdminUserDetail,
  type CreatedUser,
  type UserList,
} from '@tapbusiness/shared'
import { and, count, desc, eq, ilike, ne, or, sql, type SQL } from 'drizzle-orm'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { profiles, uploads, users } from '../db/schema'
import { totalsSince } from '../lib/analytics'
import { createAuthToken, currentUser, requireUser, revokeSessions } from '../lib/auth'
import { HttpError, notFound, parse } from '../lib/errors'
import { accessLinkEmail } from '../lib/mailer'
import { isCardIdAvailable, isUsernameAvailable, profileConflict } from '../lib/profiles'
import { deleteFiles } from '../lib/uploads'
import { profileEditorRoutes } from './profileEditor'

const idParams = z.object({ id: z.uuid() })
const listQuery = z.object({
  q: z.string().trim().max(100).optional(),
  status: z.enum(userStatuses).optional(),
  role: z.enum(roles).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})
const availabilityQuery = z.object({
  username: z.string().max(100).optional(),
  cardId: z.string().max(100).optional(),
  email: z.string().max(200).optional(),
  excludeUserId: z.uuid().optional(),
})

const userColumns = {
  id: users.id,
  email: users.email,
  name: users.name,
  role: users.role,
  status: users.status,
  locale: users.locale,
  username: profiles.username,
  cardId: profiles.cardId,
  published: profiles.published,
  createdAt: users.createdAt,
  lastLoginAt: users.lastLoginAt,
  activatedAt: users.activatedAt,
  profileUpdatedAt: profiles.updatedAt,
}

const iso = (d: Date | null) => d?.toISOString() ?? null
const escapeLike = (s: string) => s.replace(/[\\%_]/g, (c) => `\\${c}`)

export async function adminRoutes(app: FastifyInstance) {
  app.addHook('onRequest', requireUser('admin'))

  const selectUsers = () => app.db.select(userColumns).from(users).leftJoin(profiles, eq(profiles.userId, users.id))

  async function getDetail(id: string): Promise<AdminUserDetail> {
    const [row] = await selectUsers().where(eq(users.id, id))
    if (!row) throw notFound()
    return {
      ...row,
      createdAt: row.createdAt.toISOString(),
      lastLoginAt: iso(row.lastLoginAt),
      activatedAt: iso(row.activatedAt),
      profileUpdatedAt: iso(row.profileUpdatedAt),
    }
  }

  async function issueAccessLink(user: AdminUserDetail, sendEmail = false): Promise<AccessLinks> {
    if (user.status === 'disabled') throw new HttpError(409, 'ACCOUNT_DISABLED')
    const type = user.status === 'pending' ? 'invite' : 'reset'
    const link = await createAuthToken(app, user.id, type)
    const emailSent =
      sendEmail &&
      (await app.mailer.send(
        accessLinkEmail({ to: user.email, name: user.name, locale: user.locale, type, ...link, timeZone: app.config.TIMEZONE }),
      ))
    return { actionUrl: link.url, expiresAt: link.expiresAt.toISOString(), emailSent }
  }

  app.get('/config', async () => ({ emailEnabled: app.mailer.enabled }))

  app.get('/stats', async (): Promise<AdminStats> => {
    const rows = await app.db
      .select({ status: users.status, n: count() })
      .from(users)
      .where(eq(users.role, 'customer'))
      .groupBy(users.status)
    const byStatus = { pending: 0, active: 0, disabled: 0 }
    for (const r of rows) byStatus[r.status] = r.n
    return {
      users: byStatus,
      customers: byStatus.pending + byStatus.active + byStatus.disabled,
      last30Days: await totalsSince(app.db, 30),
    }
  })

  app.get('/users', async (request): Promise<UserList> => {
    const { q, status, role, page, pageSize } = parse(listQuery, request.query)
    const conds: (SQL | undefined)[] = []
    if (q) {
      const pattern = `%${escapeLike(q)}%`
      conds.push(or(ilike(users.email, pattern), ilike(users.name, pattern), ilike(profiles.username, pattern), ilike(profiles.cardId, pattern)))
    }
    if (status) conds.push(eq(users.status, status))
    if (role) conds.push(eq(users.role, role))
    const where = and(...conds)

    const [rows, [{ total }]] = await Promise.all([
      selectUsers().where(where).orderBy(desc(users.createdAt)).limit(pageSize).offset((page - 1) * pageSize),
      app.db.select({ total: count() }).from(users).leftJoin(profiles, eq(profiles.userId, users.id)).where(where),
    ])
    const items = rows.map(({ activatedAt: _a, profileUpdatedAt: _p, ...r }) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      lastLoginAt: iso(r.lastLoginAt),
    }))
    return { items, total, page, pageSize }
  })

  app.post('/users', async (request): Promise<CreatedUser> => {
    const input = parse(createUserSchema, request.body)
    const id = await app.db
      .transaction(async (tx) => {
        const [user] = await tx
          .insert(users)
          .values({ email: input.email, name: input.name, role: input.role, locale: input.locale })
          .returning({ id: users.id })
        if (input.role === 'customer') {
          await tx.insert(profiles).values({
            userId: user.id,
            username: input.username,
            cardId: input.cardId || null,
            content: emptyProfileContent(input.name),
          })
        }
        return user.id
      })
      .catch(profileConflict)

    const user = await getDetail(id)
    return { user, links: await issueAccessLink(user, input.sendEmail) }
  })

  app.get('/users/:id', async (request) => getDetail(parse(idParams, request.params).id))

  app.patch('/users/:id', async (request) => {
    const { id } = parse(idParams, request.params)
    const input = parse(updateUserSchema, request.body)
    const target = await getDetail(id)
    if (id === currentUser(request).id && input.disabled) throw new HttpError(400, 'CANNOT_MODIFY_SELF')

    await app.db
      .transaction(async (tx) => {
        const userChanges: Partial<typeof users.$inferInsert> = {}
        if (input.name !== undefined) userChanges.name = input.name
        if (input.email !== undefined) userChanges.email = input.email
        if (input.locale !== undefined) userChanges.locale = input.locale
        if (input.disabled === true) userChanges.status = 'disabled'
        if (input.disabled === false && target.status === 'disabled') {
          const [{ hasPassword }] = await tx
            .select({ hasPassword: sql<boolean>`${users.passwordHash} is not null` })
            .from(users)
            .where(eq(users.id, id))
          userChanges.status = hasPassword ? 'active' : 'pending'
        }
        if (Object.keys(userChanges).length) await tx.update(users).set(userChanges).where(eq(users.id, id))

        if (target.role === 'customer' && (input.username !== undefined || input.cardId !== undefined)) {
          await tx
            .update(profiles)
            .set({
              ...(input.username !== undefined && { username: input.username }),
              ...(input.cardId !== undefined && { cardId: input.cardId || null }),
              updatedAt: new Date(),
            })
            .where(eq(profiles.userId, id))
        }
      })
      .catch(profileConflict)

    if (input.disabled) await revokeSessions(app.db, id)
    return getDetail(id)
  })

  app.post('/users/:id/access-link', async (request) => {
    const { id } = parse(idParams, request.params)
    const { sendEmail } = parse(z.object({ sendEmail: z.boolean().optional() }), request.body)
    return issueAccessLink(await getDetail(id), sendEmail)
  })

  app.delete('/users/:id', async (request, reply) => {
    const { id } = parse(idParams, request.params)
    if (id === currentUser(request).id) throw new HttpError(400, 'CANNOT_MODIFY_SELF')
    const files = await app.db.select({ fileName: uploads.fileName }).from(uploads).where(eq(uploads.userId, id))
    const deleted = await app.db.delete(users).where(eq(users.id, id)).returning({ id: users.id })
    if (!deleted.length) throw notFound()
    await deleteFiles(app.config.UPLOAD_DIR, files.map((f) => f.fileName))
    return reply.status(204).send()
  })

  app.get('/next-card-id', async () => {
    const [row] = await app.db.execute<{ n: number | null }>(
      sql`select max(substring(card_id from '^TB-(\\d+)$')::int) as n from profiles`,
    )
    return { cardId: `TB-${String((row?.n ?? 0) + 1).padStart(4, '0')}` }
  })

  // Live checks for the admin forms; each field is optional and checked independently.
  app.get('/availability', async (request) => {
    const q = parse(availabilityQuery, request.query)
    const result: Record<string, { available: boolean; reason?: string }> = {}
    const check = async <T>(key: string, raw: string | undefined, schema: z.ZodType<T>, isFree: (v: T) => Promise<boolean>) => {
      if (raw === undefined) return
      const parsed = schema.safeParse(raw)
      result[key] = parsed.success ? { available: await isFree(parsed.data) } : { available: false, reason: parsed.error.issues[0]?.message }
    }
    await check('username', q.username, usernameSchema, (v) => isUsernameAvailable(app.db, v, q.excludeUserId))
    await check('cardId', q.cardId, cardIdSchema, (v) => isCardIdAvailable(app.db, v, q.excludeUserId))
    await check('email', q.email, emailSchema, async (v) => {
      const conds = [eq(users.email, v)]
      if (q.excludeUserId) conds.push(ne(users.id, q.excludeUserId))
      const [taken] = await app.db.select({ id: users.id }).from(users).where(and(...conds))
      return !taken
    })
    return result
  })

  // Admins can set up a customer's profile for them, using the same editor endpoints.
  await app.register(
    profileEditorRoutes(async (request: FastifyRequest) => parse(idParams, request.params).id),
    { prefix: '/users/:id' },
  )
}
