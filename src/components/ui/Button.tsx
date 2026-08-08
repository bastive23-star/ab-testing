import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'
import type { ReactNode, ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'glass' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children?: ReactNode
}

export function Button({ variant = 'glass', size = 'md', loading, className, children, disabled, onClick, type = 'button', ...rest }: ButtonProps) {
  const variants = {
    primary: 'bg-[#C8302A] text-white border border-[#A52420] hover:bg-[#B82B25]',
    glass: 'bg-white border border-[#E8E6E0] text-[#111110] hover:bg-[#F5F4F0]',
    ghost: 'text-[#5C5B57] hover:bg-[#F2F1ED] hover:text-[#111110]',
    danger: 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100',
  }
  const sizes = {
    sm: 'text-sm px-3 py-1.5 rounded-xl',
    md: 'text-sm px-4 py-2.5 rounded-[14px]',
    lg: 'text-base px-6 py-3.5 rounded-[14px]',
  }

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      disabled={disabled || loading}
      onClick={onClick}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      type={type as any}
      aria-label={rest['aria-label']}
      aria-disabled={rest['aria-disabled']}
      className={cn(
        'relative font-medium cursor-pointer select-none',
        'transition-colors duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'flex items-center gap-2 justify-center',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {loading && (
        <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      )}
      {children}
    </motion.button>
  )
}
