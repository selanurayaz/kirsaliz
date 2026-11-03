import { useEffect, useState, type ReactNode } from 'react'
import { Link, useLocation, useParams } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { FullPageSpinner } from '@/components/FullPageSpinner'
import { StatusBadge, UrgencyBadge } from '@/components/StatusBadge'
import { StatusMessage } from '@/components/StatusMessage'
import { EmptyState } from '@/components/EmptyState'
import { ROUTES } from '@/lib/constants'
import { formatDateTime, formatLocation } from '@/lib/format'
import { STATUS_LABELS } from '@/lib/service-request-config'
import { toUserMessage } from '@/lib/errors'
import {
  LOAD_REQUEST_DETAIL_ERROR,
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
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm break-words text-navy-900">{children}</dd>
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

  const created = isRequestCreatedState(location.state) ? location.state.created : null

  useEffect(() => {
    if (!userId) return
    let active = true
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

  const backLink = (
    <Link
      to={ROUTES.myRequests}
      className="text-sm font-medium text-slate-600 hover:text-navy-800 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
    >
      ← Taleplerim
    </Link>
  )

  if (state.kind === 'loading') return <FullPageSpinner label="Talep yükleniyor…" />

  if (state.kind === 'not-found') {
    return (
      <section className="bg-slate-100 px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-3xl space-y-4">
          {backLink}
          <EmptyState
            title="Talep bulunamadı"
            description="Aradığınız talep mevcut değil veya görüntüleme yetkiniz yok."
            action={
              <Link to={ROUTES.myRequests} className="rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700">
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
      <section className="bg-slate-100 px-4 py-8 sm:py-12">
        <div className="mx-auto max-w-3xl space-y-4">
          {backLink}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <StatusMessage status={{ type: 'error', message: state.message }} />
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="mt-4 rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700"
            >
              Tekrar Dene
            </button>
          </div>
        </div>
      </section>
    )
  }

  const { request, history, attachments, imageUrls, imageError } = state

  return (
    <section className="bg-slate-100 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        {backLink}

        {created && (
          <div role="status" className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
            <p className="font-semibold">Talebiniz alındı.</p>
            <p className="mt-1">
              Takip kodunuz: <span className="font-mono font-bold">{created.trackingCode}</span>
            </p>
            {created.failedUploads > 0 && (
              <p className="mt-2 text-amber-800">
                {created.failedUploads} fotoğraf yüklenemedi. Talebiniz fotoğrafsız olarak kaydedildi.
              </p>
            )}
          </div>
        )}

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-mono text-sm font-semibold tracking-wide text-slate-500">{request.tracking_code}</p>
            <div className="flex flex-wrap gap-1.5">
              <StatusBadge status={request.status} />
              <UrgencyBadge urgency={request.urgency} />
            </div>
          </div>

          <h1 className="mt-3 text-2xl font-bold break-words text-navy-800">{request.title}</h1>
          <p className="mt-3 text-sm leading-relaxed whitespace-pre-line text-slate-700">{request.description}</p>

          <dl className="mt-6 grid gap-4 border-t border-slate-100 pt-6 sm:grid-cols-2">
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
        </article>

        {attachments.length > 0 && (
          <section aria-labelledby="fotograflar" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <h2 id="fotograflar" className="text-lg font-semibold text-navy-800">
              Fotoğraflar
            </h2>
            {imageError && (
              <div className="mt-3">
                <StatusMessage status={{ type: 'error', message: imageError }} />
              </div>
            )}
            <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {attachments.map((attachment) => {
                const url = imageUrls.get(attachment.storage_path)
                return (
                  <li key={attachment.id} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    {url ? (
                      <a href={url} target="_blank" rel="noopener noreferrer" aria-label={`${attachment.original_name} fotoğrafını yeni sekmede aç`}>
                        <img src={url} alt={attachment.original_name} loading="lazy" className="h-40 w-full object-cover" />
                      </a>
                    ) : (
                      <div className="flex h-40 items-center justify-center px-3 text-center text-xs text-slate-500">
                        Fotoğraf görüntülenemiyor
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        <section aria-labelledby="gecmis" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
          <h2 id="gecmis" className="text-lg font-semibold text-navy-800">
            Durum Geçmişi
          </h2>
          {history.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">Henüz geçmiş kaydı yok.</p>
          ) : (
            <ol className="mt-4 border-l-2 border-slate-200">
              {history.map((entry, index) => (
                <li key={entry.id} className="relative pb-6 pl-6 last:pb-0">
                  <span
                    aria-hidden="true"
                    className={`absolute top-1 -left-[7px] h-3 w-3 rounded-full border-2 border-white ring-2 ${
                      index === history.length - 1 ? 'bg-brand-600 ring-brand-300' : 'bg-slate-400 ring-slate-200'
                    }`}
                  />
                  <p className="text-sm font-semibold text-navy-800">{STATUS_LABELS[entry.status]}</p>
                  <p className="text-xs text-slate-500">{formatDateTime(entry.created_at)}</p>
                  {entry.note && <p className="mt-1 text-sm text-slate-600">{entry.note}</p>}
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </section>
  )
}
