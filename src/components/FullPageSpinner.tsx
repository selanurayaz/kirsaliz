export function FullPageSpinner({ label = 'Yükleniyor…' }: { label?: string }) {
  return (
    <div role="status" className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-500">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
