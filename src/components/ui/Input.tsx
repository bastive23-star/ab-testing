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

const inputBase = 'bg-white border border-[#E8E6E0] rounded-xl px-4 py-3 text-sm text-[#111110] placeholder:text-[#C0BEB8] outline-none transition-all focus:border-[#C8302A] focus:ring-2 focus:ring-[#C8302A]/15'

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-xs font-semibold uppercase tracking-wider text-[#9B9894]">{label}</span>}
      <input
        className={cn(inputBase, error && 'border-red-300 focus:ring-red-200', className)}
        {...props}
      />
      {error && <span className="text-xs text-[#C8302A]">{error}</span>}
    </label>
  )
}

export function Textarea({ label, error, className, ...props }: TextareaProps) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="text-xs font-semibold uppercase tracking-wider text-[#9B9894]">{label}</span>}
      <textarea
        className={cn(inputBase, 'resize-none', error && 'border-red-300 focus:ring-red-200', className)}
        {...props}
      />
      {error && <span className="text-xs text-[#C8302A]">{error}</span>}
    </label>
  )
}
