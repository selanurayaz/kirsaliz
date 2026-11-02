export type StatusState = { type: 'error' | 'info' | 'success'; message: string } | null

const STYLES = {
  error: 'bg-red-50 text-red-700',
  info: 'bg-navy-50 text-navy-700',
  success: 'bg-brand-50 text-brand-800',
} as const

export function StatusMessage({ status }: { status: StatusState }) {
  if (!status) return null
  return (
    <p role={status.type === 'error' ? 'alert' : 'status'} className={`rounded-md px-3 py-2 text-sm ${STYLES[status.type]}`}>
      {status.message}
    </p>
  )
}
