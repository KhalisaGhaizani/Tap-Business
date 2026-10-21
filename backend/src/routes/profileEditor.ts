import { profileContentSchema } from '@tapbusiness/shared'
import { count, eq } from 'drizzle-orm'
import type { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import { uploads } from '../db/schema'
import { getAnalytics } from '../lib/analytics'
import { HttpError, parse } from '../lib/errors'
import { getProfileByUser, saveProfile, toProfile } from '../lib/profiles'
import { detectImage, saveUpload } from '../lib/uploads'

const saveBody = profileContentSchema.extend({ published: z.boolean().optional() })
const analyticsQuery = z.object({ days: z.coerce.number().int().pipe(z.union([z.literal(7), z.literal(30), z.literal(90)])).default(30) })

/**
 * Editing a customer's profile. Mounted at /api/me for the customer and at
 * /api/admin/users/:id for admins setting a profile up on someone's behalf.
 */
export function profileEditorRoutes(resolveUserId: (request: FastifyRequest) => Promise<string>) {
  return async (app: FastifyInstance) => {
    app.get('/profile', async (request) => toProfile(await getProfileByUser(app.db, await resolveUserId(request))))

    app.put('/profile', async (request) => {
      const { published, ...content } = parse(saveBody, request.body)
      const row = await saveProfile(app.db, await resolveUserId(request), content, published)
      return { updatedAt: row.updatedAt.toISOString() }
    })

    app.post('/uploads', { config: { rateLimit: { max: 30, timeWindow: '1 minute' } } }, async (request) => {
      const userId = await resolveUserId(request)
      const [{ n }] = await app.db.select({ n: count() }).from(uploads).where(eq(uploads.userId, userId))
      if (n >= app.config.UPLOAD_QUOTA_FILES) throw new HttpError(409, 'UPLOAD_QUOTA')

      const file = await request.file()
      if (!file) throw new HttpError(400, 'UPLOAD_INVALID')
      const data = await file.toBuffer()
      const ext = detectImage(data)
      if (!ext) throw new HttpError(400, 'UPLOAD_INVALID')
      return { url: await saveUpload(app.db, app.config.UPLOAD_DIR, userId, data, ext) }
    })

    app.get('/analytics', async (request) => {
      const { days } = parse(analyticsQuery, request.query)
      const profile = await getProfileByUser(app.db, await resolveUserId(request))
      return getAnalytics(app.db, profile.id, days, app.config.TIMEZONE)
    })
  }
}
