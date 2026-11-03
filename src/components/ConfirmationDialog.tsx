import { useEffect, useId, useRef, type FormEvent, type ReactNode } from 'react'

interface ConfirmationDialogProps {
  open: boolean
  title: string
  description?: string
  confirmLabel: string
  cancelLabel?: string
  tone?: 'primary' | 'danger'
  busy?: boolean
  /** Onay düğmesini devre dışı bırakır (ör. zorunlu alan eksik). */
  confirmDisabled?: boolean
  onConfirm: () => void
  onCancel: () => void
  children?: ReactNode
}

const CONFIRM_STYLES = {
  primary: 'bg-brand-600 hover:bg-brand-700 focus-visible:ring-brand-500',
  danger: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500',
} as const

/**
 * Yerleşik <dialog> öğesiyle erişilebilir onay penceresi:
 * odak hapsi, Esc ile kapatma ve arka plan engelleme tarayıcı tarafından sağlanır.
 */
export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Vazgeç',
  tone = 'primary',
  busy = false,
  confirmDisabled = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmationDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!busy && !confirmDisabled) onConfirm()
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        // Esc: işlem sürerken kapanmasın
        event.preventDefault()
        if (!busy) onCancel()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-slate-200 bg-white p-0 shadow-xl backdrop:bg-navy-950/50"
    >
      {open && (
        <form onSubmit={handleSubmit} className="space-y-4 p-5 sm:p-6">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-navy-800">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-1 text-sm text-slate-600">
                {description}
              </p>
            )}
          </div>

          {children}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-navy-800 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none disabled:opacity-60"
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={busy || confirmDisabled}
              className={`rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 ${CONFIRM_STYLES[tone]}`}
            >
              {busy ? 'İşleniyor…' : confirmLabel}
            </button>
          </div>
        </form>
      )}
    </dialog>
  )
}
