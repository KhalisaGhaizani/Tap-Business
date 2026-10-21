import type { Profile, ProfileContent } from '@tapbusiness/shared'
import { and, eq, inArray, ne } from 'drizzle-orm'
import type { Db } from '../db'
import { profiles, uploads } from '../db/schema'
import { HttpError, isUniqueViolation, notFound } from './errors'
import { referencedImages } from './uploads'

export type ProfileRow = typeof profiles.$inferSelect

export const toProfile = (row: ProfileRow): Profile => ({
  ...row.content,
  username: row.username,
  cardId: row.cardId,
  published: row.published,
})

export async function getProfileByUser(db: Db, userId: string) {
  const [row] = await db.select().from(profiles).where(eq(profiles.userId, userId))
  if (!row) throw notFound()
  return row
}

export async function saveProfile(db: Db, userId: string, content: ProfileContent, published?: boolean) {
  // only allow images this user uploaded, so profiles can't hotlink each other's files
  const images = [...new Set(referencedImages(content))]
  if (images.length) {
    const owned = await db
      .select({ fileName: uploads.fileName })
      .from(uploads)
      .where(and(eq(uploads.userId, userId), inArray(uploads.fileName, images)))
    if (owned.length !== images.length) throw new HttpError(400, 'VALIDATION', 'INVALID_IMAGE')
  }
  const [row] = await db
    .update(profiles)
    .set({ content, updatedAt: new Date(), ...(published === undefined ? {} : { published }) })
    .where(eq(profiles.userId, userId))
    .returning()
  if (!row) throw notFound()
  return row
}

export async function isUsernameAvailable(db: Db, username: string, exceptUserId?: string) {
  const conds = [eq(profiles.username, username)]
  if (exceptUserId) conds.push(ne(profiles.userId, exceptUserId))
  const [taken] = await db.select({ id: profiles.id }).from(profiles).where(and(...conds))
  return !taken
}

export async function isCardIdAvailable(db: Db, cardId: string, exceptUserId?: string) {
  const conds = [eq(profiles.cardId, cardId)]
  if (exceptUserId) conds.push(ne(profiles.userId, exceptUserId))
  const [taken] = await db.select({ id: profiles.id }).from(profiles).where(and(...conds))
  return !taken
}

/** Map a unique violation on profiles to a friendly 409. */
export function profileConflict(err: unknown): never {
  if (isUniqueViolation(err, 'profiles_username_unique')) throw new HttpError(409, 'USERNAME_TAKEN', undefined, 'username')
  if (isUniqueViolation(err, 'profiles_card_id_unique')) throw new HttpError(409, 'CARD_ID_TAKEN', undefined, 'cardId')
  if (isUniqueViolation(err, 'users_email_unique')) throw new HttpError(409, 'EMAIL_TAKEN', undefined, 'email')
  throw err
}
