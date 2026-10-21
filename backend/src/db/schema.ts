import type { ProfileContent } from '@tapbusiness/shared'
import { eventTypes, locales, roles, userStatuses } from '@tapbusiness/shared'
import { bigserial, boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const roleEnum = pgEnum('role', roles)
export const userStatusEnum = pgEnum('user_status', userStatuses)
export const localeEnum = pgEnum('locale', locales)
export const tokenTypeEnum = pgEnum('token_type', ['invite', 'reset'])
export const eventTypeEnum = pgEnum('event_type', eventTypes)

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow()

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: roleEnum('role').notNull(),
  status: userStatusEnum('status').notNull().default('pending'),
  locale: localeEnum('locale').notNull().default('id'),
  passwordHash: text('password_hash'),
  createdAt: createdAt(),
  activatedAt: timestamp('activated_at', { withTimezone: true }),
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
})

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  username: text('username').notNull().unique(),
  cardId: text('card_id').unique(),
  published: boolean('published').notNull().default(true),
  content: jsonb('content').$type<ProfileContent>().notNull(),
  createdAt: createdAt(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const sessions = pgTable(
  'sessions',
  {
    // sha256 of the cookie value, so a database leak doesn't leak live sessions
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => [index('sessions_user_id_idx').on(t.userId)],
)

export const authTokens = pgTable(
  'auth_tokens',
  {
    id: text('id').primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: tokenTypeEnum('type').notNull(),
    createdAt: createdAt(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    usedAt: timestamp('used_at', { withTimezone: true }),
  },
  (t) => [index('auth_tokens_user_id_idx').on(t.userId)],
)

export const uploads = pgTable(
  'uploads',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    fileName: text('file_name').notNull().unique(),
    bytes: integer('bytes').notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('uploads_user_id_idx').on(t.userId)],
)

export const events = pgTable(
  'events',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    type: eventTypeEnum('type').notNull(),
    target: text('target'),
    createdAt: createdAt(),
  },
  (t) => [index('events_profile_created_idx').on(t.profileId, t.createdAt)],
)
