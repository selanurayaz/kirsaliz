import { useEffect, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { EmptyState } from '@/components/EmptyState'
import { FullPageSpinner } from '@/components/FullPageSpinner'
import { ImageGallery } from '@/components/ImageGallery'
import { RequestActionPanel } from '@/components/RequestActionPanel'
import { StatusBadge, UrgencyBadge } from '@/components/StatusBadge'
import { StatusMessage, type StatusState } from '@/components/StatusMessage'
import { StatusTimeline } from '@/components/StatusTimeline'
import { ROUTES } from '@/lib/constants'
import { toUserMessage } from '@/lib/errors'
import { formatDateTime } from '@/lib/format'
import {
  createSignedImageUrls,
  getRequestAttachments,
  getRequestHistory,
} from '@/lib/service-requests'
import { getStaffRequestById } from '@/lib/staff-requests'
import type {
  ServiceRequestAttachment,
  ServiceRequestHistory,
  StaffRequestDetail,
} from '@/types/database'

type LoadState =
  | { kind: 'loading' }
  | { kind: 'not-found' }
  | { kind: 'error'; message: string }
  | {
      kind: 'ready'
      request: StaffRequestDetail
      history: ServiceRequestHistory[]
      attachments: ServiceRequestAttachment[]
      imageUrls: Map<string, string>
      imageError: string | null
    }

const LOAD_ERROR = 'Talep bilgileri yüklenemedi. Lütfen daha sonra tekrar deneyin.'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium tracking-wide text-slate-500 uppercase">{label}</dt>
      <dd className="mt-0.5 text-sm break-words text-navy-900">{children}</dd>
    </div>
  )
}

export function StaffRequestDetailPage() {
  const { id = '' } = useParams()
  const { profile } = useAuth()
  const profileId = profile?.id
  const role = profile?.role
  const departmentId = profile?.department_id ?? null
  const [state, setState] = useState<LoadState>({ kind: 'loading' })
  const [reloadKey, setReloadKey] = useState(0)
  const [flash, setFlash] = useState<StatusState>(null)

  useEffect(() => {
    if (!profileId || !role) return
    let active = true

    async function load(scopeId: string, scopeRole: NonNullable<typeof role>) {
      try {
        const request = await getStaffRequestById(id, { id: scopeId, role: scopeRole, department_id: departmentId })
        if (!request) {
          if (active) setState({ kind: 'not-found' })
          return
        }
        const [history, attachments] = await Promise.all([getRequestHistory(request.id), getRequestAttachments(request.id)])

        let imageUrls = new Map<string, string>()
        let imageError: string | null = null
        try {
          imageUrls = await createSignedImageUrls(attachments.map((a) => a.storage_path))
        } catch (err) {
          imageError = toUserMessage(err, 'Fotoğraflar yüklenemedi.')
        }
        if (active) setState({ kind: 'ready', request, history, attachments, imageUrls, imageError })
      } catch (err) {
        if (active) setState({ kind: 'error', message: toUserMessage(err, LOAD_ERROR) })
      }
    }

    void load(profileId, role)
    return () => {
      active = false
    }
  }, [id, profileId, role, departmentId, reloadKey])

  const backLink = (
    <Link
      to={ROUTES.staffDashboard}
      className="text-sm font-medium text-slate-600 hover:text-navy-800 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
    >
      ← Kurum Paneli
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
              onClick={() => {
                setState({ kind: 'loading' })
                setReloadKey((k) => k + 1)
              }}
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

        <StatusMessage status={flash} />

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
            <Field label="Vatandaş">{request.citizen_name?.trim() || 'Belirtilmemiş'}</Field>
            <Field label="Atanan saha personeli">
              {request.assigned_to ? (request.assigned_name?.trim() || 'Adsız personel') : 'Henüz atanmadı'}
            </Field>
            <Field label="Kategori">{request.category?.name ?? '—'}</Field>
            <Field label="Sorumlu birim">{request.department?.name ?? '—'}</Field>
            <Field label="İlçe / Köy">
              {request.village ? `${request.village.district?.name ?? '—'} / ${request.village.name}` : '—'}
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

        {role && profileId && (
          <RequestActionPanel
            request={request}
            role={role}
            userId={profileId}
            onDone={(message) => {
              setFlash({ type: 'success', message })
              setReloadKey((k) => k + 1)
            }}
          />
        )}

        <ImageGallery attachments={attachments} imageUrls={imageUrls} error={imageError} />
        <StatusTimeline history={history} />
      </div>
    </section>
  )
}
