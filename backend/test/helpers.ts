import { sql } from 'drizzle-orm'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { buildApp } from '../src/app'
import { loadConfig } from '../src/config'
import { createDb, runMigrations } from '../src/db'
import { users } from '../src/db/schema'
import { hashPassword } from '../src/lib/crypto'
import { MemoryMailer } from '../src/lib/mailer'

export const ADMIN = { email: 'admin@test.local', password: 'admin-password' }

export async function setupApp() {
  const uploadDir = mkdtempSync(path.join(tmpdir(), 'tb-uploads-'))
  const config = loadConfig({
    NODE_ENV: 'test',
    DATABASE_URL: process.env.TEST_DATABASE_URL ?? 'postgres://localhost:5432/tapbusiness_test',
    APP_URL: 'http://localhost:5173',
    UPLOAD_DIR: uploadDir,
  })
  const { db, client } = createDb(config.DATABASE_URL)
  await runMigrations(db, config.migrationsDir)
  await db.execute(sql`truncate users, profiles, sessions, auth_tokens, uploads, events restart identity cascade`)
  await db.insert(users).values({
    email: ADMIN.email,
    name: 'Test Admin',
    role: 'admin',
    status: 'active',
    passwordHash: await hashPassword(ADMIN.password),
  })

  const mailer = new MemoryMailer()
  const app = await buildApp({ config, db, mailer })

  async function login(email: string, password: string) {
    const res = await app.inject({ method: 'POST', url: '/api/auth/login', payload: { email, password } })
    if (res.statusCode !== 200) throw new Error(`login failed: ${res.body}`)
    return sessionCookie(res)
  }

  async function close() {
    await app.close()
    await client.end()
    rmSync(uploadDir, { recursive: true, force: true })
  }

  return { app, db, mailer, config, login, close }
}

export function sessionCookie(res: { cookies: { name: string; value: string }[] }) {
  const c = res.cookies.find((c) => c.name === 'tb_session')
  if (!c) throw new Error('no session cookie')
  return { tb_session: c.value }
}

/** Token part of an invite / reset URL. */
export const tokenFrom = (url: string) => url.split('/').pop()!

// smallest valid PNG (1x1 transparent)
export const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
)

export function multipart(fileName: string, data: Buffer, contentType = 'image/png') {
  const boundary = '----tbtest' + Math.random().toString(16).slice(2)
  const payload = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${contentType}\r\n\r\n`),
    data,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ])
  return { payload, headers: { 'content-type': `multipart/form-data; boundary=${boundary}` } }
}
