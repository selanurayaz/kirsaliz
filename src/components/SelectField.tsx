import type { ReactNode, SelectHTMLAttributes } from 'react'

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  id: string
  label: string
  error?: string
  hint?: string
  children: ReactNode
}

export const FIELD_CLASS =
  'block w-full rounded-md border bg-white px-3 py-2 text-sm text-navy-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500'

export function SelectField({ id, label, error, hint, className = '', children, ...props }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-navy-800">
        {label}
      </label>
      <select
        id={id}
        name={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`${FIELD_CLASS} ${error ? 'border-red-400' : 'border-slate-300'} ${className}`}
        {...props}
      >
        {children}
      </select>
      {hint && !error && (
        <p id={`${id}-hint`} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}
