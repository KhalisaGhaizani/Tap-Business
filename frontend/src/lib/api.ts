import type {
  AccessLinks,
  AdminStats,
  AdminUserDetail,
  Analytics,
  ApiErrorBody,
  CreatedUser,
  CreateUserInput,
  ErrorCode,
  Locale,
  Profile,
  ProfileContent,
  PublicProfile,
  SessionUser,
  TokenInfo,
  UpdateUserInput,
  UserList,
} from '@tapbusiness/shared'

export class ApiError extends Error {
  readonly status: number
  readonly code: ErrorCode | 'NETWORK'
  readonly field?: string

  constructor(status: number, code: ErrorCode | 'NETWORK', message: string, field?: string) {
    super(message)
    this.status = status
    this.code = code
    this.field = field
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const isForm = body instanceof FormData
  let res: Response
  try {
    res = await fetch(path, {
      method,
      credentials: 'same-origin',
      headers: body === undefined || isForm ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'NETWORK', 'Network error')
  }
  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const err = (data as ApiErrorBody | null)?.error
    throw new ApiError(res.status, err?.code ?? 'INTERNAL', err?.message ?? res.statusText, err?.field)
  }
  return data as T
}

const get = <T>(path: string) => request<T>('GET', path)
const send = <T>(method: string) => (path: string, body?: unknown) => request<T>(method, path, body ?? {})

const query = (params: Record<string, string | number | undefined>) => {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') q.set(k, String(v))
  const s = q.toString()
  return s ? `?${s}` : ''
}

export type AnalyticsDays = 7 | 30 | 90
export type Availability = { available: boolean; reason?: string }

export const authApi = {
  me: () => get<{ user: SessionUser }>('/api/auth/me'),
  login: (email: string, password: string) => send<{ user: SessionUser }>('POST')('/api/auth/login', { email, password }),
  logout: () => send<void>('POST')('/api/auth/logout'),
  tokenInfo: (token: string) => get<TokenInfo>(`/api/auth/tokens/${encodeURIComponent(token)}`),
  useToken: (token: string, password: string) =>
    send<{ user: SessionUser }>('POST')(`/api/auth/tokens/${encodeURIComponent(token)}`, { password }),
  forgotPassword: (email: string) => send<void>('POST')('/api/auth/forgot-password', { email }),
}

export const meApi = {
  updateAccount: (changes: { name?: string; locale?: Locale }) => send<{ user: SessionUser }>('PATCH')('/api/me/account', changes),
  changePassword: (currentPassword: string, newPassword: string) =>
    send<void>('POST')('/api/me/password', { currentPassword, newPassword }),
  usernameAvailability: (username: string) => get<Availability>(`/api/me/username-availability${query({ username })}`),
  changeUsername: (username: string) => send<{ username: string }>('PATCH')('/api/me/username', { username }),
}

/** Profile editing endpoints; `base` is /api/me or /api/admin/users/:id. */
export const profileApi = (base: string) => ({
  get: () => get<Profile>(`${base}/profile`),
  save: (content: ProfileContent & { published?: boolean }) => send<{ updatedAt: string }>('PUT')(`${base}/profile`, content),
  upload: (file: Blob) => {
    const form = new FormData()
    form.append('file', file, 'image.jpg')
    return request<{ url: string }>('POST', `${base}/uploads`, form)
  },
  analytics: (days: AnalyticsDays) => get<Analytics>(`${base}/analytics${query({ days })}`),
})

export const adminApi = {
  stats: () => get<AdminStats>('/api/admin/stats'),
  config: () => get<{ emailEnabled: boolean }>('/api/admin/config'),
  users: (params: { q?: string; status?: string; role?: string; page?: number; pageSize?: number }) =>
    get<UserList>(`/api/admin/users${query(params)}`),
  user: (id: string) => get<AdminUserDetail>(`/api/admin/users/${id}`),
  createUser: (input: CreateUserInput) => send<CreatedUser>('POST')('/api/admin/users', input),
  updateUser: (id: string, changes: UpdateUserInput) => send<AdminUserDetail>('PATCH')(`/api/admin/users/${id}`, changes),
  deleteUser: (id: string) => request<void>('DELETE', `/api/admin/users/${id}`),
  accessLink: (id: string, sendEmail: boolean) => send<AccessLinks>('POST')(`/api/admin/users/${id}/access-link`, { sendEmail }),
  nextCardId: () => get<{ cardId: string }>('/api/admin/next-card-id'),
  availability: (params: { username?: string; cardId?: string; email?: string; excludeUserId?: string }) =>
    get<Partial<Record<'username' | 'cardId' | 'email', Availability>>>(`/api/admin/availability${query(params)}`),
}

export const publicApi = {
  profile: (username: string) => get<PublicProfile>(`/api/public/profiles/${encodeURIComponent(username)}`),
  vcardUrl: (username: string) => `/api/public/profiles/${encodeURIComponent(username)}/vcard`,
  trackClick: (username: string, target: string) => {
    // keepalive lets the request finish even though the click navigates away
    fetch(`/api/public/profiles/${encodeURIComponent(username)}/events`, {
      method: 'POST',
      keepalive: true,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'click', target }),
    }).catch(() => {})
  },
}
