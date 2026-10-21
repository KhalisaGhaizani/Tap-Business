import type { Locale, Role, UserStatus } from './constants'

/** Every error response from the API has this shape; `code` is translated on the client. */
export interface ApiErrorBody {
  error: { code: ErrorCode; message: string; field?: string }
}

export type ErrorCode =
  | 'BAD_REQUEST'
  | 'VALIDATION'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'RATE_LIMITED'
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_DISABLED'
  | 'ACCOUNT_PENDING'
  | 'INVALID_TOKEN'
  | 'WRONG_PASSWORD'
  | 'EMAIL_TAKEN'
  | 'USERNAME_TAKEN'
  | 'CARD_ID_TAKEN'
  | 'CANNOT_MODIFY_SELF'
  | 'UPLOAD_INVALID'
  | 'UPLOAD_TOO_LARGE'
  | 'UPLOAD_QUOTA'
  | 'INTERNAL'

export interface SessionUser {
  id: string
  email: string
  name: string
  role: Role
  locale: Locale
}

export interface AdminUserSummary {
  id: string
  email: string
  name: string
  role: Role
  status: UserStatus
  locale: Locale
  username: string | null
  cardId: string | null
  published: boolean | null
  createdAt: string
  lastLoginAt: string | null
}

export interface AdminUserDetail extends AdminUserSummary {
  activatedAt: string | null
  profileUpdatedAt: string | null
}

export interface UserList {
  items: AdminUserSummary[]
  total: number
  page: number
  pageSize: number
}

export interface AccessLinks {
  /** Link the customer opens to set a password (invite) or reset it. */
  actionUrl: string
  expiresAt: string
  emailSent: boolean
}

export interface CreatedUser {
  user: AdminUserDetail
  links: AccessLinks
}

export const eventTypes = ['view', 'tap', 'click', 'vcard'] as const
export type EventType = (typeof eventTypes)[number]

export interface Analytics {
  days: number
  totals: Record<EventType, number>
  daily: ({ date: string } & Record<EventType, number>)[]
  topLinks: { target: string; count: number }[]
}

export interface AdminStats {
  users: Record<UserStatus, number>
  customers: number
  last30Days: Record<EventType, number>
}

export interface TokenInfo {
  type: 'invite' | 'reset'
  email: string
  name: string
}
