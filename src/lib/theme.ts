const KEY = 'abTheme'

export function getTheme(): 'light' | 'dark' {
  return (localStorage.getItem(KEY) as 'light' | 'dark') ?? 'light'
}

export function applyTheme(theme: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  localStorage.setItem(KEY, theme)
}

export function toggleTheme(): 'light' | 'dark' {
  const next = getTheme() === 'dark' ? 'light' : 'dark'
  applyTheme(next)
  return next
}

export function initTheme() {
  applyTheme(getTheme())
}
