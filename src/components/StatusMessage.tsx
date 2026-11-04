import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

export type StatusState = { type: 'error' | 'info' | 'success'; message: string } | null

const STYLES = {
  error: 'alert-error',
  info: 'alert-info',
  success: 'alert-success',
} as const

const ICONS = { error: AlertCircle, info: Info, success: CheckCircle2 } as const

export function StatusMessage({ status }: { status: StatusState }) {
  if (!status) return null
  const Icon = ICONS[status.type]
  return (
    <p role={status.type === 'error' ? 'alert' : 'status'} className={`alert ${STYLES[status.type]}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0 break-words">{status.message}</span>
    </p>
  )
}
