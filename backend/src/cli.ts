// Usage: node dist/cli.js create-admin <email> [name]
// Prints a one-time link for the new admin to set their password.
import { buildApp } from './app'
import { loadConfig, loadDotEnv } from './config'
import { createDb, runMigrations } from './db'
import { users } from './db/schema'
import { createAuthToken } from './lib/auth'
import { emailSchema } from '@tapbusiness/shared'

loadDotEnv()
const [command, rawEmail, name = 'Admin'] = process.argv.slice(2)
if (command !== 'create-admin' || !rawEmail) {
  console.error('Usage: cli create-admin <email> [name]')
  process.exit(1)
}

const config = loadConfig()
const { db, client } = createDb(config.DATABASE_URL)
await runMigrations(db, config.migrationsDir)
const app = await buildApp({ config, db, logger: false })

try {
  const email = emailSchema.parse(rawEmail)
  const [user] = await db.insert(users).values({ email, name, role: 'admin', locale: 'en' }).returning()
  const link = await createAuthToken(app, user.id, 'invite')
  console.log(`Admin ${email} created. Set the password here (valid until ${link.expiresAt.toISOString()}):\n${link.url}`)
} finally {
  await app.close()
  await client.end()
}
