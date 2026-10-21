import type { Locale } from '@tapbusiness/shared'
import type { FastifyBaseLogger } from 'fastify'
import nodemailer from 'nodemailer'

export interface MailMessage {
  to: string
  subject: string
  text: string
  html: string
}

export interface Mailer {
  /** false when no SMTP server is configured; mails are then only logged. */
  readonly enabled: boolean
  send(message: MailMessage): Promise<boolean>
}

export function createMailer(smtpUrl: string | undefined, from: string, log: FastifyBaseLogger): Mailer {
  if (!smtpUrl) {
    return {
      enabled: false,
      async send(message) {
        log.info({ to: message.to, subject: message.subject, text: message.text }, 'SMTP_URL not set; email not sent')
        return false
      },
    }
  }
  const transport = nodemailer.createTransport(smtpUrl)
  return {
    enabled: true,
    async send(message) {
      try {
        await transport.sendMail({ from, ...message })
        return true
      } catch (err) {
        log.error({ err, to: message.to }, 'failed to send email')
        return false
      }
    },
  }
}

/** Collects mails in memory; used by tests. */
export class MemoryMailer implements Mailer {
  readonly enabled = true
  readonly sent: MailMessage[] = []
  async send(message: MailMessage) {
    this.sent.push(message)
    return true
  }
}

const copy = {
  en: {
    invite: {
      subject: 'Activate your TapBusiness account',
      intro: 'An account has been created for you on TapBusiness. Set your password to start editing the digital profile linked to your NFC card.',
      button: 'Set password',
    },
    reset: {
      subject: 'Reset your TapBusiness password',
      intro: 'We received a request to reset your password. Use the link below to choose a new one.',
      button: 'Reset password',
    },
    greeting: (name: string) => `Hi ${name},`,
    expires: (date: string) => `This link expires on ${date}. If you didn't expect this email, you can ignore it.`,
  },
  id: {
    invite: {
      subject: 'Aktifkan akun TapBusiness Anda',
      intro: 'Akun TapBusiness telah dibuat untuk Anda. Atur kata sandi untuk mulai mengubah profil digital yang terhubung ke kartu NFC Anda.',
      button: 'Atur kata sandi',
    },
    reset: {
      subject: 'Atur ulang kata sandi TapBusiness',
      intro: 'Kami menerima permintaan untuk mengatur ulang kata sandi Anda. Gunakan tautan di bawah untuk membuat kata sandi baru.',
      button: 'Atur ulang kata sandi',
    },
    greeting: (name: string) => `Halo ${name},`,
    expires: (date: string) => `Tautan ini berlaku hingga ${date}. Jika Anda tidak merasa meminta email ini, abaikan saja.`,
  },
} satisfies Record<Locale, unknown>

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

export function accessLinkEmail(opts: {
  to: string
  name: string
  locale: Locale
  type: 'invite' | 'reset'
  url: string
  expiresAt: Date
  timeZone: string
}): MailMessage {
  const c = copy[opts.locale]
  const t = c[opts.type]
  const date = opts.expiresAt.toLocaleString(opts.locale === 'id' ? 'id-ID' : 'en-GB', {
    dateStyle: 'long',
    timeStyle: 'short',
    timeZone: opts.timeZone,
  })
  const text = [c.greeting(opts.name), '', t.intro, '', opts.url, '', c.expires(date)].join('\n')
  const html = `<div style="font-family:Inter,Arial,sans-serif;max-width:480px;color:#0f172a;line-height:1.5">
<p>${escapeHtml(c.greeting(opts.name))}</p>
<p>${escapeHtml(t.intro)}</p>
<p><a href="${escapeHtml(opts.url)}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 20px;border-radius:10px;text-decoration:none;font-weight:600">${escapeHtml(t.button)}</a></p>
<p style="font-size:13px;color:#64748b">${escapeHtml(c.expires(date))}</p>
</div>`
  return { to: opts.to, subject: t.subject, text, html }
}
