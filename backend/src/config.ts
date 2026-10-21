import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const bool = z
  .enum(['true', 'false', '1', '0', ''])
  .optional()
  .transform((v) => v === 'true' || v === '1')

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  HOST: z.string().default('0.0.0.0'),
  PORT: z.coerce.number().int().default(3000),
  DATABASE_URL: z.string().min(1),
  APP_URL: z.url().default('http://localhost:5173').transform((u) => u.replace(/\/+$/, '')),
  UPLOAD_DIR: z.string().default('./uploads'),
  UPLOAD_QUOTA_FILES: z.coerce.number().int().default(100),
  TIMEZONE: z.string().default('Asia/Jakarta'),
  SESSION_DAYS: z.coerce.number().default(30),
  INVITE_DAYS: z.coerce.number().default(7),
  RESET_HOURS: z.coerce.number().default(24),
  TRUST_PROXY: bool,
  SMTP_URL: z.string().optional(),
  MAIL_FROM: z.string().default('TapBusiness <no-reply@tapbusiness.id>'),
  ADMIN_EMAIL: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_NAME: z.string().default('Admin'),
})

export type Config = z.output<typeof schema> & { migrationsDir: string; cookieSecure: boolean }

export function loadConfig(env: Record<string, string | undefined> = process.env): Config {
  const parsed = schema.safeParse(env)
  if (!parsed.success) {
    const problems = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n')
    throw new Error(`Invalid environment:\n${problems}`)
  }
  return {
    ...parsed.data,
    // resolves to backend/drizzle from both src/config.ts and the bundled dist/index.js
    migrationsDir: fileURLToPath(new URL('../drizzle', import.meta.url)),
    cookieSecure: parsed.data.APP_URL.startsWith('https://'),
  }
}

/** Load backend/.env during local development. */
export function loadDotEnv() {
  const file = fileURLToPath(new URL('../.env', import.meta.url))
  if (process.env.NODE_ENV !== 'production' && existsSync(file)) process.loadEnvFile(file)
}
