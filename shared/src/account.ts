import { z } from 'zod'
import { locales } from './constants'

const RESERVED_USERNAMES = new Set([
  'admin', 'api', 'app', 'c', 'card', 'edit', 'login', 'logout', 'signup', 'register', 'settings',
  'account', 'activate', 'reset', 'forgot-password', 'uploads', 'static', 'assets', 'u', 'www',
  'tap', 'help', 'support', 'tapbusiness', 'root', 'system', 'null', 'undefined',
])

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9](?:[a-z0-9_-]{1,28})[a-z0-9]$/, 'INVALID_USERNAME')
  .refine((u) => !RESERVED_USERNAMES.has(u), 'USERNAME_RESERVED')

export const cardIdSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9][A-Z0-9-]{1,30}[A-Z0-9]$/, 'INVALID_CARD_ID')

export const emailSchema = z.string().trim().toLowerCase().pipe(z.email('INVALID_EMAIL').max(160))
export const passwordSchema = z.string().min(8, 'PASSWORD_TOO_SHORT').max(200)
export const nameSchema = z.string().trim().min(1).max(80)

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1).max(200) })
export const setPasswordSchema = z.object({ password: passwordSchema })
export const forgotPasswordSchema = z.object({ email: emailSchema })
export const changePasswordSchema = z.object({ currentPassword: z.string().min(1).max(200), newPassword: passwordSchema })
export const updateAccountSchema = z.object({ name: nameSchema.optional(), locale: z.enum(locales).optional() })
export const changeUsernameSchema = z.object({ username: usernameSchema })

export const createUserSchema = z.discriminatedUnion('role', [
  z.object({
    role: z.literal('customer'),
    name: nameSchema,
    email: emailSchema,
    locale: z.enum(locales),
    username: usernameSchema,
    cardId: z.union([cardIdSchema, z.literal('')]).optional(),
    sendEmail: z.boolean().optional(),
  }),
  z.object({
    role: z.literal('admin'),
    name: nameSchema,
    email: emailSchema,
    locale: z.enum(locales),
    sendEmail: z.boolean().optional(),
  }),
])

export const updateUserSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
  locale: z.enum(locales).optional(),
  username: usernameSchema.optional(),
  cardId: z.union([cardIdSchema, z.literal('')]).optional(),
  disabled: z.boolean().optional(),
})

export type CreateUserInput = z.input<typeof createUserSchema>
export type UpdateUserInput = z.input<typeof updateUserSchema>
