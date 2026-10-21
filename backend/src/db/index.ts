import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import * as schema from './schema'

export function createDb(url: string) {
  const client = postgres(url, { max: 10, onnotice: () => {} })
  const db = drizzle(client, { schema })
  return { db, client }
}

export type Db = ReturnType<typeof createDb>['db']

export const runMigrations = (db: Db, migrationsFolder: string) => migrate(db, { migrationsFolder })

export { schema }
