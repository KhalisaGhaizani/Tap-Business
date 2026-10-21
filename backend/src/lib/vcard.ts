import type { PublicProfile } from '@tapbusiness/shared'

// vCard 3.0 is what both iOS and Android contacts import most reliably
const escape = (v: string) => v.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/([,;])/g, '\\$1')

/** Fold lines longer than 75 octets as required by RFC 2425. */
function fold(line: string) {
  const out: string[] = []
  for (let i = 0; i < line.length; i += 74) out.push((i ? ' ' : '') + line.slice(i, i + 74))
  return out.join('\r\n')
}

export function buildVCard(profile: PublicProfile, profileUrl: string, photo?: { data: Buffer; type: 'JPEG' | 'PNG' }) {
  const [first, ...rest] = profile.name.trim().split(/\s+/)
  const lines = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${escape(profile.name || profile.username)}`,
    `N:${escape(rest.join(' '))};${escape(first ?? '')};;;`,
  ]
  if (profile.company) lines.push(`ORG:${escape(profile.company)}`)
  if (profile.title) lines.push(`TITLE:${escape(profile.title)}`)
  if (profile.phone) lines.push(`TEL;TYPE=CELL:${escape(profile.phone)}`)
  if (profile.email) lines.push(`EMAIL;TYPE=INTERNET:${escape(profile.email)}`)
  if (profile.location) lines.push(`ADR;TYPE=WORK:;;;${escape(profile.location)};;;`)
  lines.push(`URL:${escape(profileUrl)}`)
  if (profile.bio) lines.push(`NOTE:${escape(profile.bio)}`)
  if (photo) lines.push(`PHOTO;ENCODING=b;TYPE=${photo.type}:${photo.data.toString('base64')}`)
  lines.push('END:VCARD')
  return lines.map(fold).join('\r\n') + '\r\n'
}
