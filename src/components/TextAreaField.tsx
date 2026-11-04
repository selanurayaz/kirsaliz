import type { TextareaHTMLAttributes } from 'react'
import { FIELD_CLASS } from '@/components/SelectField'

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  id: string
  label: string
  error?: string
  hint?: string
}

export function TextAreaField({ id, label, error, hint, className = '', ...props }: TextAreaFieldProps) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <textarea
        id={id}
        name={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`${FIELD_CLASS} ${className}`}
        {...props}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  )
}
