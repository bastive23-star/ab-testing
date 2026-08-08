import { cn } from '../../lib/utils'

interface AvatarProps {
  name: string
  url?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const colors = [
  '#C8302A', '#E85D04', '#D97706', '#059669', '#0891B2', '#7C3AED', '#DB2777',
]

function hashColor(name: string): string {
  let h = 0
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xFFFF
  return colors[h % colors.length]
}

export function Avatar({ name, url, size = 'md', className }: AvatarProps) {
  const sizes = { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-12 h-12 text-base' }
  const bg = hashColor(name)
  const initials = name.slice(0, 2).toUpperCase()

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={cn('rounded-full object-cover', sizes[size], className)}
      />
    )
  }

  return (
    <div
      className={cn('rounded-full flex items-center justify-center font-semibold text-white', sizes[size], className)}
      style={{ background: bg }}
    >
      {initials}
    </div>
  )
}
