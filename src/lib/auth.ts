const PASSWORD = 'banhmi26'
const PW_KEY   = 'bmPw'
const NAME_KEY = 'bmName'

export function isUnlocked(): boolean {
  return localStorage.getItem(PW_KEY) === PASSWORD
}

export function unlock(pw: string): boolean {
  if (pw === PASSWORD) { localStorage.setItem(PW_KEY, pw); return true }
  return false
}

export function lock(): void {
  localStorage.removeItem(PW_KEY)
  localStorage.removeItem(NAME_KEY)
}

export function getName(): string {
  return localStorage.getItem(NAME_KEY) ?? ''
}

export function setName(name: string): void {
  localStorage.setItem(NAME_KEY, name)
}
