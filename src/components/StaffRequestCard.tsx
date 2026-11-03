import { Link } from 'react-router'
import { StatusBadge, UrgencyBadge } from '@/components/StatusBadge'
import { staffRequestDetailPath } from '@/lib/constants'
import { formatDate, formatLocation } from '@/lib/format'
import type { StaffRequestListItem } from '@/types/database'

export function StaffRequestCard({ request }: { request: StaffRequestListItem }) {
  return (
    <article className="card p-4 transition-colors hover:border-primary-border sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-mono text-xs font-semibold tracking-wide text-muted">{request.tracking_code}</p>
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge status={request.status} />
          <UrgencyBadge urgency={request.urgency} />
        </div>
      </div>

      <h3 className="mt-2 text-base font-semibold break-words text-navy-900">{request.title}</h3>

      <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-xs text-muted">Kategori</dt>
          <dd>{request.category?.name ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Birim</dt>
          <dd>{request.department?.name ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Konum</dt>
          <dd>{formatLocation(request.village)}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Atanan personel</dt>
          <dd>{request.assigned_to ? (request.assigned_name ?? 'Adsız personel') : 'Atanmadı'}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted">Tarih</dt>
          <dd>{formatDate(request.created_at)}</dd>
        </div>
      </dl>

      <div className="mt-3">
        <Link
          to={staffRequestDetailPath(request.id)}
          className="rounded text-sm font-semibold text-primary hover:text-primary-dark focus-visible:ring-2 focus-visible:ring-focus focus-visible:outline-none"
          aria-label={`${request.title} talebini aç`}
        >
          Talebi aç →
        </Link>
      </div>
    </article>
  )
}
