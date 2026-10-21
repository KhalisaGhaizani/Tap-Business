import type { PublicProfile } from '@tapbusiness/shared'
import { and, eq, ne } from 'drizzle-orm'
import type { FastifyInstance } from 'fastify'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { z } from 'zod'
import { profiles, users } from '../db/schema'
import { recordEvent } from '../lib/analytics'
import { notFound, parse } from '../lib/errors'
import type { ProfileRow } from '../lib/profiles'
import { buildVCard } from '../lib/vcard'

const usernameParams = z.object({ username: z.string().trim().toLowerCase().max(100) })
const eventBody = z.object({ type: z.literal('click'), target: z.string().trim().min(1).max(300) })

export async function publicRoutes(app: FastifyInstance) {
  /** A profile anyone may see: published, and its owner not disabled. */
  async function findVisible(where: ReturnType<typeof eq>) {
    const [row] = await app.db
      .select({ profile: profiles })
      .from(profiles)
      .innerJoin(users, eq(users.id, profiles.userId))
      .where(and(where, eq(profiles.published, true), ne(users.status, 'disabled')))
    return row?.profile ?? null
  }

  const toPublic = (row: ProfileRow): PublicProfile => ({ ...row.content, username: row.username })

  app.get('/api/public/profiles/:username', async (request, reply) => {
    const { username } = parse(usernameParams, request.params)
    const row = await findVisible(eq(profiles.username, username))
    if (!row) throw notFound()
    await recordEvent(app.db, row.id, 'view')
    reply.header('cache-control', 'no-store')
    return toPublic(row)
  })

  app.post(
    '/api/public/profiles/:username/events',
    { config: { rateLimit: { max: 60, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const { username } = parse(usernameParams, request.params)
      const { type, target } = parse(eventBody, request.body)
      const row = await findVisible(eq(profiles.username, username))
      if (!row) throw notFound()
      await recordEvent(app.db, row.id, type, target)
      return reply.status(204).send()
    },
  )

  app.get('/api/public/profiles/:username/vcard', async (request, reply) => {
    const { username } = parse(usernameParams, request.params)
    const row = await findVisible(eq(profiles.username, username))
    if (!row) throw notFound()

    let photo: Parameters<typeof buildVCard>[2]
    const avatar = row.content.avatar.replace('/uploads/', '')
    if (avatar && !avatar.endsWith('.webp')) {
      const data = await readFile(path.join(app.config.UPLOAD_DIR, path.basename(avatar))).catch(() => null)
      if (data) photo = { data, type: avatar.endsWith('.png') ? 'PNG' : 'JPEG' }
    }

    await recordEvent(app.db, row.id, 'vcard')
    const vcard = buildVCard(toPublic(row), `${app.config.APP_URL}/u/${row.username}`, photo)
    return reply
      .header('content-type', 'text/vcard; charset=utf-8')
      .header('content-disposition', `attachment; filename="${row.username}.vcf"`)
      .send(vcard)
  })

  // The URL written onto the NFC chip. It points at the card, not the username,
  // so customers can rename their profile without reprogramming the card.
  app.get('/c/:cardId', async (request, reply) => {
    const { cardId } = parse(z.object({ cardId: z.string().trim().toUpperCase().max(100) }), request.params)
    const row = await findVisible(eq(profiles.cardId, cardId))
    if (!row) return reply.redirect(`/card/${encodeURIComponent(cardId)}`, 302)
    await recordEvent(app.db, row.id, 'tap')
    return reply.redirect(`/u/${row.username}`, 302)
  })
}
