import { cn } from '../../lib/utils'
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-sm font-medium text-[#1A1714]">{label}</span>}
      <input
        className={cn(
          'glass rounded-[14px] px-4 py-3 text-sm text-[#1A1714] placeholder:text-[#9E9791]',
          'outline-none focus:ring-2 focus:ring-[#C8302A]/30 focus:border-[#C8302A]/50 transition-all',
          error && 'ring-2 ring-red-300',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </label>
  )
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-sm font-medium text-[#1A1714]">{label}</span>}
      <textarea
        className={cn(
          'glass rounded-[14px] px-4 py-3 text-sm text-[#1A1714] placeholder:text-[#9E9791]',
          'outline-none focus:ring-2 focus:ring-[#C8302A]/30 focus:border-[#C8302A]/50 transition-all',
          'resize-none',
          error && 'ring-2 ring-red-300',
          className
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </label>
  )
}
