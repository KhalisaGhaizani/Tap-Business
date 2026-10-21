import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 }

function derive(password: string, salt: Buffer, N: number, r: number, p: number): Promise<Buffer> {
  return new Promise((resolve, reject) =>
    scrypt(password, salt, SCRYPT.keylen, { N, r, p, maxmem: 64 * 1024 * 1024 }, (err, key) => (err ? reject(err) : resolve(key))),
  )
}

/** Format: scrypt$N$r$p$salt$hash, so parameters can be raised later without breaking old hashes. */
export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const key = await derive(password, salt, SCRYPT.N, SCRYPT.r, SCRYPT.p)
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64'), key.toString('base64')].join('$')
}

export async function verifyPassword(password: string, stored: string | null) {
  const parts = stored?.split('$')
  if (!parts || parts.length !== 6 || parts[0] !== 'scrypt') return false
  const [, N, r, p, salt, hash] = parts
  const expected = Buffer.from(hash, 'base64')
  const actual = await derive(password, Buffer.from(salt, 'base64'), Number(N), Number(r), Number(p))
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export const randomToken = () => randomBytes(32).toString('base64url')
export const sha256 = (value: string) => createHash('sha256').update(value).digest('hex')
