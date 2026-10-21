import cookie from '@fastify/cookie'
import helmet from '@fastify/helmet'
import multipart from '@fastify/multipart'
import rateLimit from '@fastify/rate-limit'
import fastifyStatic from '@fastify/static'
import { LIMITS, type ApiErrorBody, type SessionUser } from '@tapbusiness/shared'
import Fastify, { type FastifyError, type FastifyServerOptions } from 'fastify'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { ZodError } from 'zod'
import type { Config } from './config'
import type { Db } from './db'
import { loadSession } from './lib/auth'
import { HttpError } from './lib/errors'
import { createMailer, type Mailer } from './lib/mailer'
import { adminRoutes } from './routes/admin'
import { authRoutes } from './routes/auth'
import { meRoutes } from './routes/me'
import { publicRoutes } from './routes/public'

declare module 'fastify' {
  interface FastifyInstance {
    config: Config
    db: Db
    mailer: Mailer
  }
  interface FastifyRequest {
    user: SessionUser | null
    sessionId: string | null
  }
}

export interface AppDeps {
  config: Config
  db: Db
  mailer?: Mailer
  logger?: FastifyServerOptions['logger']
}

export async function buildApp({ config, db, mailer, logger }: AppDeps) {
  const app = Fastify({
    logger: logger ?? defaultLogger(config),
    trustProxy: config.TRUST_PROXY,
    bodyLimit: 1024 * 1024,
  })

  app.decorate('config', config)
  app.decorate('db', db)
  app.decorate('mailer', mailer ?? createMailer(config.SMTP_URL, config.MAIL_FROM, app.log))
  app.decorateRequest('user', null)
  app.decorateRequest('sessionId', null)

  await app.register(helmet, { contentSecurityPolicy: false })
  await app.register(cookie)
  await app.register(multipart, { limits: { fileSize: LIMITS.uploadBytes, files: 1 } })
  await app.register(rateLimit, { global: false })

  const uploadDir = path.resolve(config.UPLOAD_DIR)
  mkdirSync(uploadDir, { recursive: true })
  await app.register(fastifyStatic, {
    root: uploadDir,
    prefix: '/uploads/',
    decorateReply: false,
    immutable: true,
    maxAge: '365d',
    index: false,
  })

  // Cookies are SameSite=Lax; also reject state-changing requests sent from other sites.
  const allowedOrigin = new URL(config.APP_URL).origin
  app.addHook('onRequest', async (request) => {
    const origin = request.headers.origin
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && origin && origin !== allowedOrigin) {
      throw new HttpError(403, 'FORBIDDEN', 'Cross-origin request blocked')
    }
    if (!request.url.startsWith('/uploads/')) await loadSession(app, request)
  })

  app.setErrorHandler((err: FastifyError | Error, request, reply) => {
    const send = (status: number, error: ApiErrorBody['error']) => reply.status(status).send({ error })

    if (err instanceof HttpError) return send(err.status, { code: err.code, message: err.message, field: err.field })
    if (err instanceof ZodError) {
      const issue = err.issues[0]
      return send(400, { code: 'VALIDATION', message: issue?.message ?? 'Invalid input', field: issue?.path.join('.') })
    }
    const fe = err as FastifyError
    if (fe.code === 'FST_REQ_FILE_TOO_LARGE') return send(413, { code: 'UPLOAD_TOO_LARGE', message: fe.message })
    if (fe.statusCode === 429) return send(429, { code: 'RATE_LIMITED', message: fe.message })
    if (fe.statusCode && fe.statusCode < 500) return send(fe.statusCode, { code: 'BAD_REQUEST', message: fe.message })

    request.log.error({ err }, 'unhandled error')
    return send(500, { code: 'INTERNAL', message: 'Something went wrong' })
  })

  app.setNotFoundHandler((_request, reply) => reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Not found' } }))

  app.get('/api/health', async () => {
    await db.execute('select 1')
    return { ok: true }
  })

  await app.register(authRoutes, { prefix: '/api/auth' })
  await app.register(meRoutes, { prefix: '/api/me' })
  await app.register(adminRoutes, { prefix: '/api/admin' })
  await app.register(publicRoutes)

  return app
}

function defaultLogger(config: Config): FastifyServerOptions['logger'] {
  if (config.NODE_ENV === 'test') return false
  if (config.NODE_ENV === 'development') {
    return { level: 'info', transport: { target: 'pino-pretty', options: { translateTime: 'HH:MM:ss', ignore: 'pid,hostname' } } }
  }
  return { level: 'info', redact: ['req.headers.cookie', 'req.headers.authorization'] }
}
