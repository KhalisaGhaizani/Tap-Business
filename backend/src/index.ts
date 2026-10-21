import { eq } from 'drizzle-orm'
import { buildApp } from './app'
import { loadConfig, loadDotEnv } from './config'
import { createDb, runMigrations } from './db'
import { users } from './db/schema'
import { purgeExpired } from './lib/auth'
import { hashPassword } from './lib/crypto'
import { purgeUnusedUploads } from './lib/uploads'

loadDotEnv()
const config = loadConfig()
const { db, client } = createDb(config.DATABASE_URL)

await runMigrations(db, config.migrationsDir)
const app = await buildApp({ config, db })

// Bootstrap the first admin from the environment so a fresh deploy can be logged into.
if (config.ADMIN_EMAIL && config.ADMIN_PASSWORD) {
  const email = config.ADMIN_EMAIL.trim().toLowerCase()
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
  if (!existing) {
    await db.insert(users).values({
      email,
      name: config.ADMIN_NAME,
      role: 'admin',
      status: 'active',
      passwordHash: await hashPassword(config.ADMIN_PASSWORD),
      activatedAt: new Date(),
    })
    app.log.info({ email }, 'created initial admin account')
  }
}

async function housekeeping() {
  try {
    await purgeExpired(db)
    const removed = await purgeUnusedUploads(db, config.UPLOAD_DIR)
    if (removed) app.log.info({ removed }, 'deleted unused uploads')
  } catch (err) {
    app.log.error({ err }, 'housekeeping failed')
  }
}
void housekeeping()
const timer = setInterval(housekeeping, 6 * 60 * 60 * 1000)

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, async () => {
    clearInterval(timer)
    await app.close()
    await client.end({ timeout: 5 })
    process.exit(0)
  })
}

await app.listen({ host: config.HOST, port: config.PORT })
