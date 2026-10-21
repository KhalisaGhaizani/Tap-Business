import { changePasswordSchema, changeUsernameSchema, updateAccountSchema, usernameSchema } from '@tapbusiness/shared'
import { eq } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { profiles, users } from '../db/schema'
import { currentUser, requireUser, revokeSessions, toSessionUser } from '../lib/auth'
import { hashPassword, verifyPassword } from '../lib/crypto'
import { HttpError, notFound, parse } from '../lib/errors'
import { isUsernameAvailable, profileConflict } from '../lib/profiles'
import { profileEditorRoutes } from './profileEditor'

export async function meRoutes(app: FastifyInstance) {
  app.addHook('onRequest', requireUser())

  app.patch('/account', async (request) => {
    const changes = parse(updateAccountSchema, request.body)
    const [user] = await app.db.update(users).set(changes).where(eq(users.id, currentUser(request).id)).returning()
    return { user: toSessionUser(user) }
  })

  app.post('/password', { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } }, async (request, reply) => {
    const { currentPassword, newPassword } = parse(changePasswordSchema, request.body)
    const { id } = currentUser(request)
    const [user] = await app.db.select().from(users).where(eq(users.id, id))
    if (!(await verifyPassword(currentPassword, user.passwordHash))) throw new HttpError(400, 'WRONG_PASSWORD', undefined, 'currentPassword')

    await app.db.update(users).set({ passwordHash: await hashPassword(newPassword) }).where(eq(users.id, id))
    await revokeSessions(app.db, id, request.sessionId)
    return reply.status(204).send()
  })

  // Everything below is about the customer's own profile.
  await app.register(async (customer) => {
    customer.addHook('onRequest', requireUser('customer'))

    await customer.register(profileEditorRoutes(async (request) => currentUser(request).id))

    customer.get('/username-availability', async (request) => {
      const { username: raw } = parse(z.object({ username: z.string().max(100) }), request.query)
      const parsed = usernameSchema.safeParse(raw)
      if (!parsed.success) return { available: false, reason: parsed.error.issues[0]?.message }
      return { available: await isUsernameAvailable(app.db, parsed.data, currentUser(request).id) }
    })

    customer.patch('/username', async (request) => {
      const { username } = parse(changeUsernameSchema, request.body)
      const [row] = await app.db
        .update(profiles)
        .set({ username, updatedAt: new Date() })
        .where(eq(profiles.userId, currentUser(request).id))
        .returning()
        .catch(profileConflict)
      if (!row) throw notFound()
      return { username: row.username }
    })
  })
}
