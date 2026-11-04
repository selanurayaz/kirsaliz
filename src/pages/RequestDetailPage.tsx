import { useEffect, useState, type ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { FullPageSpinner } from '@/components/FullPageSpinner'
import { StatusBadge, UrgencyBadge } from '@/components/StatusBadge'
import { StatusMessage, type StatusState } from '@/components/StatusMessage'
import { EmptyState } from '@/components/EmptyState'
import { StatusTimeline } from '@/components/StatusTimeline'
import { ImageGallery } from '@/components/ImageGallery'
import { ConfirmationDialog } from '@/components/ConfirmationDialog'
import { TextAreaField } from '@/components/TextAreaField'
import { ROUTES } from '@/lib/constants'
import { formatDateTime, formatLocation } from '@/lib/format'
import { toUserMessage } from '@/lib/errors'
import {
  LOAD_REQUEST_DETAIL_ERROR,
  cancelMyRequest,
  createSignedImageUrls,
  getMyServiceRequestById,
  getRequestAttachments,
  getRequestHistory,
} from '@/lib/service-requests'
import { isRequestCreatedState } from '@/types/navigation'
import type {
  ServiceRequestAttachment,
  ServiceRequestHistory,
  ServiceRequestWithRelations,
} from '@/types/database'

type LoadState =
  | { kind: 'loading' }
  | { kind: 'not-found' }
  | { kind: 'error'; message: string }
  | {
      kind: 'ready'
      request: ServiceRequestWithRelations
      history: ServiceRequestHistory[]
      attachments: ServiceRequestAttachment[]
      imageUrls: Map<string, string>
      imageError: string | null
    }

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm break-words text-navy">{children}</dd>
    </div>
  )
}

export function RequestDetailPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const location = useLocation()
  const userId = user?.id
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelNote, setCancelNote] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [cancelError, setCancelError] = useState<string | null>(null)
  const [flash, setFlash] = useState<StatusState>(null)

  const created = isRequestCreatedState(location.state) ? location.state.created : null

  useEffect(() => {
    if (!userId) return
    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect -- veri yüklemesi başlarken yükleme durumu sıfırlanır
    setState({ kind: 'loading' })

    async function load(currentUserId: string) {
      try {
        const request = await getMyServiceRequestById(id, currentUserId)
        if (!request) {
          if (active) setState({ kind: 'not-found' })
          return
        }
        const [history, attachments] = await Promise.all([getRequestHistory(request.id), getRequestAttachments(request.id)])

        // Görseller yüklenemese de talep bilgileri gösterilir.
        let imageUrls = new Map<string, string>()
        let imageError: string | null = null
        try {
          imageUrls = await createSignedImageUrls(attachments.map((a) => a.storage_path))
        } catch (err) {
          imageError = toUserMessage(err, 'Fotoğraflar yüklenemedi.')
        }
        if (active) setState({ kind: 'ready', request, history, attachments, imageUrls, imageError })
      } catch (err) {
        if (active) setState({ kind: 'error', message: toUserMessage(err, LOAD_REQUEST_DETAIL_ERROR) })
      }
    }

    void load(userId)
    return () => {
      active = false
    }
  }, [id, userId, reloadKey])

  async function handleCancel() {
    if (cancelling || state.kind !== 'ready') return
    setCancelling(true)
    setCancelError(null)
    try {
      await cancelMyRequest(state.request.id, cancelNote)
      setCancelOpen(false)
      setCancelNote('')
      setFlash({ type: 'success', message: 'Talebiniz iptal edildi.' })
      setReloadKey((k) => k + 1)
    } catch (err) {
      setCancelError(toUserMessage(err, 'Talep iptal edilemedi. Lütfen tekrar deneyin.'))
    } finally {
      setCancelling(false)
    }
  }

  const backLink = (
    <Link
      to={ROUTES.myRequests}
      className="back-link"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Taleplerim
    </Link>
  )

  if (state.kind === 'loading') return <FullPageSpinner label="Talep yükleniyor…" />

  if (state.kind === 'not-found') {
    return (
      <section className="page-section">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 space-y-4">
          {backLink}
          <EmptyState
            title="Talep bulunamadı"
            description="Aradığınız talep mevcut değil veya görüntüleme yetkiniz yok."
            action={
              <Link to={ROUTES.myRequests} className="btn btn-primary">
                Taleplerime Dön
              </Link>
            }
          />
        </div>
      </section>
    )
  }

  if (state.kind === 'error') {
    return (
      <section className="page-section">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 space-y-4">
          {backLink}
          <div className="card p-6">
            <StatusMessage status={{ type: 'error', message: state.message }} />
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="btn btn-primary mt-4"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </section>
    )
  }

  const { request, history, attachments, imageUrls, imageError } = state
  const canCancel = request.status === 'submitted' || request.status === 'under_review'

  return (
    <section className="page-section">
      <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 space-y-6">
        {backLink}

        <StatusMessage status={flash} />

        {created && (
          <div role="status" className="alert alert-success flex-col gap-0 p-4">
            <p className="font-semibold">Talebiniz alındı.</p>
            <p className="mt-1">
              Takip kodunuz: <span className="font-mono font-bold">{created.trackingCode}</span>
            </p>
            {created.failedUploads > 0 && (
              <p className="mt-2 text-warning">
                {created.failedUploads} fotoğraf yüklenemedi. Talebiniz fotoğrafsız olarak kaydedildi.
              </p>
            )}
          </div>
        )}

        <article className="card p-5 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-sm font-semibold tracking-wide text-muted">{request.tracking_code}</p>
            <div className="flex flex-wrap gap-1.5">
              <StatusBadge status={request.status} />
              <UrgencyBadge urgency={request.urgency} />
            </div>
          </div>

          <h1 className="mt-3 text-2xl font-bold break-words text-navy">{request.title}</h1>
          <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-navy-muted">{request.description}</p>

          <dl className="mt-6 grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
            <Field label="Kategori">{request.category?.name ?? '—'}</Field>
            <Field label="Sorumlu birim">{request.department?.name ?? '—'}</Field>
            <Field label="İlçe / Köy">
              {request.village
                ? `${request.village.district?.name ?? '—'} / ${request.village.name}`
                : formatLocation(null)}
            </Field>
            <Field label="Adres">{request.address ?? '—'}</Field>
            {request.latitude !== null && request.longitude !== null && (
              <Field label="Koordinatlar">
                {request.latitude.toFixed(6)}, {request.longitude.toFixed(6)}
              </Field>
            )}
            <Field label="Oluşturulma tarihi">{formatDateTime(request.created_at)}</Field>
            {request.resolved_at && <Field label="Çözüm tarihi">{formatDateTime(request.resolved_at)}</Field>}
          </dl>

          {canCancel && (
            <div className="mt-6 border-t border-line pt-6">
              <button
                type="button"
                onClick={() => {
                  setCancelError(null)
                  setCancelOpen(true)
                }}
                className="btn btn-danger-outline"
              >
                Talebi İptal Et
              </button>
              <p className="mt-2 text-xs text-muted">
                Talep atanmadan veya işleme alınmadan önce iptal edebilirsiniz.
              </p>
            </div>
          )}
        </article>

        <ImageGallery attachments={attachments} imageUrls={imageUrls} error={imageError} />
        <StatusTimeline history={history} />
      </div>

      <ConfirmationDialog
        open={cancelOpen}
        title="Talebi iptal etmek istiyor musunuz?"
        description="İptal edilen talep yeniden açılamaz. İsterseniz kısa bir açıklama ekleyebilirsiniz."
        confirmLabel="Talebi İptal Et"
        cancelLabel="Vazgeç"
        tone="danger"
        busy={cancelling}
        onConfirm={() => void handleCancel()}
        onCancel={() => setCancelOpen(false)}
      >
        <TextAreaField
          id="iptal-notu"
          label="Açıklama (isteğe bağlı)"
          rows={3}
          maxLength={600}
          value={cancelNote}
          onChange={(e) => setCancelNote(e.target.value)}
          disabled={cancelling}
        />
        <StatusMessage status={cancelError ? { type: 'error', message: cancelError } : null} />
      </ConfirmationDialog>
    </section>
  )
}
