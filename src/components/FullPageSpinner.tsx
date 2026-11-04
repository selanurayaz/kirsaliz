export function FullPageSpinner({ label = 'Yükleniyor…' }: { label?: string }) {
  return (
    <div role="status" className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted">
      <span
        className="h-9 w-9 animate-spin rounded-full border-[3px] border-primary-border border-t-primary"
        aria-hidden="true"
      />
      <span className="text-sm font-medium">{label}</span>
    </div>
  )
}
