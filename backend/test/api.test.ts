import { emptyProfileContent, type CreatedUser, type Profile } from '@tapbusiness/shared'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { ADMIN, multipart, sessionCookie, setupApp, tinyPng, tokenFrom } from './helpers'

let ctx: Awaited<ReturnType<typeof setupApp>>
let admin: Record<string, string>

beforeAll(async () => {
  ctx = await setupApp()
  admin = await ctx.login(ADMIN.email, ADMIN.password)
})
afterAll(() => ctx.close())

async function createCustomer(overrides: Record<string, unknown> = {}) {
  const res = await ctx.app.inject({
    method: 'POST',
    url: '/api/admin/users',
    cookies: admin,
    payload: { role: 'customer', name: 'Budi Santoso', email: 'budi@example.com', locale: 'id', username: 'budi', cardId: 'tb-0001', ...overrides },
  })
  return res
}

/** Create a customer and accept the invite; returns the customer's session cookie. */
async function activeCustomer(overrides: Record<string, unknown>, password = 'customer-pass') {
  const res = await createCustomer(overrides)
  expect(res.statusCode).toBe(200)
  const { links, user } = res.json<CreatedUser>()
  const accept = await ctx.app.inject({ method: 'POST', url: `/api/auth/tokens/${tokenFrom(links.actionUrl)}`, payload: { password } })
  expect(accept.statusCode).toBe(200)
  return { cookies: sessionCookie(accept), user }
}

describe('auth', () => {
  it('rejects wrong passwords and unknown emails the same way', async () => {
    for (const payload of [
      { email: ADMIN.email, password: 'nope' },
      { email: 'ghost@example.com', password: 'nope' },
    ]) {
      const res = await ctx.app.inject({ method: 'POST', url: '/api/auth/login', payload })
      expect(res.statusCode).toBe(401)
      expect(res.json().error.code).toBe('INVALID_CREDENTIALS')
    }
  })

  it('returns the signed-in user and logs out', async () => {
    const cookies = await ctx.login(ADMIN.email, ADMIN.password)
    const me = await ctx.app.inject({ url: '/api/auth/me', cookies })
    expect(me.json().user).toMatchObject({ email: ADMIN.email, role: 'admin' })

    await ctx.app.inject({ method: 'POST', url: '/api/auth/logout', cookies })
    expect((await ctx.app.inject({ url: '/api/auth/me', cookies })).statusCode).toBe(401)
  })

  it('blocks state-changing requests from other origins', async () => {
    const res = await ctx.app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      cookies: admin,
      headers: { origin: 'https://evil.example' },
    })
    expect(res.statusCode).toBe(403)
  })
})

describe('customer onboarding', () => {
  it('admin creates a customer, who activates via the invite link and edits their profile', async () => {
    const res = await createCustomer()
    expect(res.statusCode).toBe(200)
    const created = res.json<CreatedUser>()
    expect(created.user).toMatchObject({ status: 'pending', username: 'budi', cardId: 'TB-0001', role: 'customer' })
    expect(created.links.actionUrl).toMatch(/^http:\/\/localhost:5173\/activate\//)

    const token = tokenFrom(created.links.actionUrl)
    const info = await ctx.app.inject({ url: `/api/auth/tokens/${token}` })
    expect(info.json()).toEqual({ type: 'invite', email: 'budi@example.com', name: 'Budi Santoso' })

    // a pending account has no password yet
    const early = await ctx.app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'budi@example.com', password: 'whatever1' } })
    expect(early.statusCode).toBe(401)

    const accept = await ctx.app.inject({ method: 'POST', url: `/api/auth/tokens/${token}`, payload: { password: 'budi-secret' } })
    expect(accept.statusCode).toBe(200)
    const budi = sessionCookie(accept)

    // links are single use
    const again = await ctx.app.inject({ method: 'POST', url: `/api/auth/tokens/${token}`, payload: { password: 'another-one' } })
    expect(again.json().error.code).toBe('INVALID_TOKEN')

    const profile = (await ctx.app.inject({ url: '/api/me/profile', cookies: budi })).json<Profile>()
    expect(profile).toMatchObject({ name: 'Budi Santoso', username: 'budi', cardId: 'TB-0001', published: true })

    const content = {
      ...emptyProfileContent('Budi Santoso'),
      title: 'Founder',
      themeId: 'malam',
      sections: [{ id: 's1', type: 'links', title: 'Links', visible: true, links: [{ id: 'l1', label: 'Shop', url: 'shop.example.com' }] }],
    }
    const save = await ctx.app.inject({ method: 'PUT', url: '/api/me/profile', cookies: budi, payload: content })
    expect(save.statusCode).toBe(200)

    const pub = await ctx.app.inject({ url: '/api/public/profiles/budi' })
    expect(pub.statusCode).toBe(200)
    expect(pub.json()).toMatchObject({ username: 'budi', title: 'Founder', themeId: 'malam' })
    expect(pub.json()).not.toHaveProperty('cardId')

    // tapping the card redirects to the profile and is counted
    const tap = await ctx.app.inject({ url: '/c/tb-0001' })
    expect(tap.statusCode).toBe(302)
    expect(tap.headers.location).toBe('/u/budi')

    const click = await ctx.app.inject({ method: 'POST', url: '/api/public/profiles/budi/events', payload: { type: 'click', target: 'Shop' } })
    expect(click.statusCode).toBe(204)

    const stats = (await ctx.app.inject({ url: '/api/me/analytics?days=7', cookies: budi })).json()
    expect(stats.totals).toEqual({ view: 1, tap: 1, click: 1, vcard: 0 })
    expect(stats.daily).toHaveLength(7)
    expect(stats.topLinks).toEqual([{ target: 'Shop', count: 1 }])

    // customers can't reach admin endpoints
    expect((await ctx.app.inject({ url: '/api/admin/users', cookies: budi })).statusCode).toBe(403)
  })

  it('rejects duplicate email, username and card id', async () => {
    const cases = [
      [{ username: 'other1', cardId: 'TB-0101' }, 'EMAIL_TAKEN'],
      [{ email: 'x1@example.com', cardId: 'TB-0102' }, 'USERNAME_TAKEN'],
      [{ email: 'x2@example.com', username: 'other2' }, 'CARD_ID_TAKEN'],
    ] as const
    for (const [overrides, code] of cases) {
      const res = await createCustomer(overrides)
      expect(res.statusCode).toBe(409)
      expect(res.json().error.code).toBe(code)
    }
  })

  it('validates usernames', async () => {
    const reserved = await createCustomer({ email: 'r@example.com', username: 'admin', cardId: '' })
    expect(reserved.json().error).toMatchObject({ code: 'VALIDATION', message: 'USERNAME_RESERVED', field: 'username' })
    const invalid = await createCustomer({ email: 'r@example.com', username: 'no spaces', cardId: '' })
    expect(invalid.json().error.message).toBe('INVALID_USERNAME')
  })

  it('suggests the next card id', async () => {
    const res = await ctx.app.inject({ url: '/api/admin/next-card-id', cookies: admin })
    expect(res.json()).toEqual({ cardId: 'TB-0002' })
  })

  it('unknown cards redirect to the unregistered-card page', async () => {
    const res = await ctx.app.inject({ url: '/c/TB-9999' })
    expect(res.headers.location).toBe('/card/TB-9999')
  })
})

describe('account management', () => {
  it('disabling a customer signs them out and hides their profile', async () => {
    const { cookies, user } = await activeCustomer({ email: 'dina@example.com', username: 'dina', cardId: 'TB-0200' }, 'dina-pass-1')

    const patch = await ctx.app.inject({ method: 'PATCH', url: `/api/admin/users/${user.id}`, cookies: admin, payload: { disabled: true } })
    expect(patch.json().status).toBe('disabled')

    expect((await ctx.app.inject({ url: '/api/auth/me', cookies })).statusCode).toBe(401)
    expect((await ctx.app.inject({ url: '/api/public/profiles/dina' })).statusCode).toBe(404)
    const login = await ctx.app.inject({ method: 'POST', url: '/api/auth/login', payload: { email: 'dina@example.com', password: 'dina-pass-1' } })
    expect(login.json().error.code).toBe('ACCOUNT_DISABLED')

    const enable = await ctx.app.inject({ method: 'PATCH', url: `/api/admin/users/${user.id}`, cookies: admin, payload: { disabled: false } })
    expect(enable.json().status).toBe('active')
  })

  it('admin cannot disable or delete themselves', async () => {
    const me = (await ctx.app.inject({ url: '/api/auth/me', cookies: admin })).json().user
    const res = await ctx.app.inject({ method: 'DELETE', url: `/api/admin/users/${me.id}`, cookies: admin })
    expect(res.json().error.code).toBe('CANNOT_MODIFY_SELF')
  })

  it('forgot-password emails a reset link that works', async () => {
    await activeCustomer({ email: 'eka@example.com', username: 'eka', cardId: 'TB-0300' }, 'eka-pass-1')
    ctx.mailer.sent.length = 0

    const res = await ctx.app.inject({ method: 'POST', url: '/api/auth/forgot-password', payload: { email: 'EKA@example.com' } })
    expect(res.statusCode).toBe(204)
    expect(ctx.mailer.sent).toHaveLength(1)
    expect(ctx.mailer.sent[0].subject).toContain('kata sandi')
    const url = ctx.mailer.sent[0].text.match(/http\S+reset-password\/\S+/)![0]

    const reset = await ctx.app.inject({ method: 'POST', url: `/api/auth/tokens/${tokenFrom(url)}`, payload: { password: 'eka-new-pass' } })
    expect(reset.statusCode).toBe(200)
    await ctx.login('eka@example.com', 'eka-new-pass')

    // unknown emails get the same answer and no mail
    const unknown = await ctx.app.inject({ method: 'POST', url: '/api/auth/forgot-password', payload: { email: 'nobody@example.com' } })
    expect(unknown.statusCode).toBe(204)
    expect(ctx.mailer.sent).toHaveLength(1)
  })

  it('changing password requires the current one', async () => {
    const { cookies } = await activeCustomer({ email: 'fajar@example.com', username: 'fajar', cardId: '' }, 'fajar-pass-1')
    const wrong = await ctx.app.inject({ method: 'POST', url: '/api/me/password', cookies, payload: { currentPassword: 'nope', newPassword: 'fajar-pass-2' } })
    expect(wrong.json().error.code).toBe('WRONG_PASSWORD')
    const ok = await ctx.app.inject({ method: 'POST', url: '/api/me/password', cookies, payload: { currentPassword: 'fajar-pass-1', newPassword: 'fajar-pass-2' } })
    expect(ok.statusCode).toBe(204)
    // the current session survives
    expect((await ctx.app.inject({ url: '/api/auth/me', cookies })).statusCode).toBe(200)
  })

  it('customers can rename their profile; the card keeps working', async () => {
    const { cookies } = await activeCustomer({ email: 'gita@example.com', username: 'gita', cardId: 'TB-0400' })
    const avail = await ctx.app.inject({ url: '/api/me/username-availability?username=budi', cookies })
    expect(avail.json()).toEqual({ available: false })

    const res = await ctx.app.inject({ method: 'PATCH', url: '/api/me/username', cookies, payload: { username: 'Gita-Design' } })
    expect(res.json()).toEqual({ username: 'gita-design' })
    expect((await ctx.app.inject({ url: '/c/TB-0400' })).headers.location).toBe('/u/gita-design')
  })

  it('lists and searches users', async () => {
    const res = await ctx.app.inject({ url: '/api/admin/users?q=gita&role=customer', cookies: admin })
    const list = res.json()
    expect(list.total).toBe(1)
    expect(list.items[0]).toMatchObject({ username: 'gita-design', status: 'active' })
  })

  it('issues a reset link for an active user', async () => {
    const list = (await ctx.app.inject({ url: '/api/admin/users?q=gita', cookies: admin })).json()
    const res = await ctx.app.inject({ method: 'POST', url: `/api/admin/users/${list.items[0].id}/access-link`, cookies: admin, payload: {} })
    expect(res.json().actionUrl).toContain('/reset-password/')
    expect(res.json().emailSent).toBe(false)
  })
})

describe('uploads and vCard', () => {
  it('stores images, only lets the owner use them, and embeds the avatar in the vCard', async () => {
    const { cookies } = await activeCustomer({ email: 'hana@example.com', username: 'hana', cardId: '' })
    const up = await ctx.app.inject({ method: 'POST', url: '/api/me/uploads', cookies, ...multipart('a.png', tinyPng) })
    expect(up.statusCode).toBe(200)
    const { url } = up.json()
    expect(url).toMatch(/^\/uploads\/[\w-]+\.png$/)

    const file = await ctx.app.inject({ url })
    expect(file.statusCode).toBe(200)
    expect(file.rawPayload.equals(tinyPng)).toBe(true)

    const notImage = await ctx.app.inject({ method: 'POST', url: '/api/me/uploads', cookies, ...multipart('x.png', Buffer.from('<svg></svg>')) })
    expect(notImage.json().error.code).toBe('UPLOAD_INVALID')

    const content = { ...emptyProfileContent('Hana Lestari'), phone: '+62 811 111', avatar: url }
    expect((await ctx.app.inject({ method: 'PUT', url: '/api/me/profile', cookies, payload: content })).statusCode).toBe(200)

    // someone else can't reference hana's file
    const other = await activeCustomer({ email: 'indra@example.com', username: 'indra', cardId: '' })
    const steal = await ctx.app.inject({ method: 'PUT', url: '/api/me/profile', cookies: other.cookies, payload: { ...content, name: 'Indra' } })
    expect(steal.json().error).toMatchObject({ code: 'VALIDATION', message: 'INVALID_IMAGE' })

    const vcard = await ctx.app.inject({ url: '/api/public/profiles/hana/vcard' })
    expect(vcard.headers['content-type']).toContain('text/vcard')
    expect(vcard.body).toContain('FN:Hana Lestari')
    expect(vcard.body).toContain('N:Lestari;Hana;;;')
    expect(vcard.body).toContain('TEL;TYPE=CELL:+62 811 111')
    expect(vcard.body).toContain('PHOTO;ENCODING=b;TYPE=PNG:')
  })

  it('admins can edit a customer profile on their behalf', async () => {
    const list = (await ctx.app.inject({ url: '/api/admin/users?q=hana', cookies: admin })).json()
    const id = list.items[0].id
    const profile = (await ctx.app.inject({ url: `/api/admin/users/${id}/profile`, cookies: admin })).json<Profile>()
    const { username: _u, cardId: _c, published: _p, ...content } = profile
    const res = await ctx.app.inject({ method: 'PUT', url: `/api/admin/users/${id}/profile`, cookies: admin, payload: { ...content, bio: 'Set up by admin', published: false } })
    expect(res.statusCode).toBe(200)
    // unpublished profiles are hidden from the public
    expect((await ctx.app.inject({ url: '/api/public/profiles/hana' })).statusCode).toBe(404)
  })
})
