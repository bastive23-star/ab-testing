const raw = import.meta.env.VITE_ALLOWED_EMAILS as string ?? ''
export const ALLOWED_EMAILS = raw.split(',').map(e => e.trim().toLowerCase()).filter(Boolean)

export function isAllowed(email: string): boolean {
  return ALLOWED_EMAILS.includes(email.trim().toLowerCase())
}
