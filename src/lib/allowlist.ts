export const ALLOWED_EMAILS = [
  'wagner.andreas83@gmail.com',
  'bastive23@gmail.com',
  'basti@vizz.de',
]

export function isAllowed(email: string): boolean {
  return ALLOWED_EMAILS.includes(email.trim().toLowerCase())
}
