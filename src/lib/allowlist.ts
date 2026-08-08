export const ALLOWED_EMAILS = [
  'bastive23@gmail.com',
  'wagner.andreas83@gmail.com',
]

export function isAllowed(email: string): boolean {
  return ALLOWED_EMAILS.includes(email.trim().toLowerCase())
}
