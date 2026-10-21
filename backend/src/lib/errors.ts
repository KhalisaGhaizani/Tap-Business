import type { ErrorCode } from '@tapbusiness/shared'
import { z } from 'zod'

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: ErrorCode,
    message?: string,
    readonly field?: string,
  ) {
    super(message ?? code)
  }
}

export const notFound = () => new HttpError(404, 'NOT_FOUND')

/** Validate untrusted input; a ZodError is turned into a 400 by the error handler. */
export function parse<T extends z.ZodType>(schema: T, data: unknown): z.output<T> {
  return schema.parse(data ?? {})
}

/** Postgres unique-violation on the given constraint name. */
export function isUniqueViolation(err: unknown, constraint?: string): boolean {
  const e = err as { code?: string; constraint_name?: string; cause?: unknown }
  if (e?.code === '23505') return !constraint || e.constraint_name === constraint
  return e?.cause ? isUniqueViolation(e.cause, constraint) : false
}
