export type StatusState = { type: 'error' | 'info' | 'success'; message: string } | null

const STYLES = {
  error: 'border-destructive-border bg-destructive-soft text-destructive-hover',
  info: 'border-navy-200 bg-navy-50 text-navy',
  success: 'border-primary-border bg-primary-soft text-primary-dark',
} as const

const ICONS = { error: '!', info: 'i', success: '✓' } as const

export function StatusMessage({ status }: { status: StatusState }) {
  if (!status) return null
  return (
    <p
      role={status.type === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${STYLES[status.type]}`}
    >
      <span
        aria-hidden="true"
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-current text-[10px] leading-none font-bold"
      >
        {ICONS[status.type]}
      </span>
      <span className="min-w-0 break-words">{status.message}</span>
    </p>
  )
}
