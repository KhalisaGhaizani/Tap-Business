import { and, inArray, lt, sql } from 'drizzle-orm'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import path from 'node:path'
import type { ProfileContent } from '@tapbusiness/shared'
import type { Db } from '../db'
import { uploads } from '../db/schema'

const signatures: { ext: 'jpg' | 'png' | 'webp'; test: (b: Buffer) => boolean }[] = [
  { ext: 'jpg', test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: 'png', test: (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) },
  { ext: 'webp', test: (b) => b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP' },
]

/** Detect the image type from its bytes; the client-supplied mimetype is not trusted. */
export const detectImage = (data: Buffer) => signatures.find((s) => s.test(data))?.ext ?? null

export async function saveUpload(db: Db, dir: string, userId: string, data: Buffer, ext: string) {
  const fileName = `${randomUUID()}.${ext}`
  await mkdir(dir, { recursive: true })
  await writeFile(path.join(dir, fileName), data)
  await db.insert(uploads).values({ userId, fileName, bytes: data.length })
  return `/uploads/${fileName}`
}

export async function deleteFiles(dir: string, fileNames: string[]) {
  await Promise.all(fileNames.map((f) => unlink(path.join(dir, path.basename(f))).catch(() => {})))
}

/** Every /uploads/... URL a profile refers to. */
export function referencedImages(content: ProfileContent) {
  const urls = [content.avatar, content.cover, ...content.sections.flatMap((s) => (s.type === 'gallery' ? s.images : []))]
  return urls.filter(Boolean).map((u) => u.replace('/uploads/', ''))
}

/**
 * Delete uploads that no profile refers to anymore. Fresh uploads are kept for a
 * day because the editor saves the profile a moment after uploading.
 */
export async function purgeUnusedUploads(db: Db, dir: string) {
  const rows = await db.execute<{ id: string; file_name: string }>(sql`
    select u.id, u.file_name from uploads u
    left join profiles p on p.user_id = u.user_id
    where u.created_at < now() - interval '1 day'
      and (p.id is null or position(u.file_name in p.content::text) = 0)`)
  if (!rows.length) return 0
  await deleteFiles(dir, rows.map((r) => r.file_name))
  await db.delete(uploads).where(and(inArray(uploads.id, rows.map((r) => r.id)), lt(uploads.createdAt, sql`now() - interval '1 day'`)))
  return rows.length
}
