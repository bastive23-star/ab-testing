import { motion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'
import { cn } from '../../lib/utils'

interface GlassCardProps extends HTMLMotionProps<'div'> {
  variant?: 'default' | 'strong' | 'subtle'
  hover?: boolean
}

export function GlassCard({ variant = 'default', hover = false, className, children, ...props }: GlassCardProps) {
  const base = variant === 'strong' ? 'glass-strong' : variant === 'subtle' ? 'glass-subtle' : 'glass'
  return (
    <motion.div
      className={cn('rounded-[20px] overflow-hidden relative', base, className)}
      whileHover={hover ? { scale: 1.01, y: -2 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      {...props}
    >
      {children}
    </motion.div>
  )
}
