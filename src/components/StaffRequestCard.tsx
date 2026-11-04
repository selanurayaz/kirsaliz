import { Link } from 'react-router'
import { ChevronRight } from 'lucide-react'
import { StatusBadge, UrgencyBadge } from '@/components/StatusBadge'
import { staffRequestDetailPath } from '@/lib/constants'
import { formatDate, formatLocation } from '@/lib/format'
import type { StaffRequestListItem } from '@/types/database'

export function StaffRequestCard({ request }: { request: StaffRequestListItem }) {
  return (
    <article className="card card-interactive p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="rounded bg-page px-2 py-0.5 font-mono text-xs font-semibold tracking-wider text-navy-muted ring-1 ring-line ring-inset">{request.tracking_code}</p>
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge status={request.status} />
          <UrgencyBadge urgency={request.urgency} />
        </div>
      </div>

      <h3 className="mt-3 text-base font-semibold break-words text-navy">{request.title}</h3>

      <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm text-navy-muted sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-xs font-semibold text-muted">Kategori</dt>
          <dd>{request.category?.name ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-muted">Birim</dt>
          <dd>{request.department?.name ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-muted">Konum</dt>
          <dd>{formatLocation(request.village)}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-muted">Atanan personel</dt>
          <dd>{request.assigned_to ? (request.assigned_name ?? 'Adsız personel') : 'Atanmadı'}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold text-muted">Tarih</dt>
          <dd>{formatDate(request.created_at)}</dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-line pt-3">
        <Link
          to={staffRequestDetailPath(request.id)}
          className="link inline-flex items-center gap-1 text-sm"
          aria-label={`${request.title} talebini aç`}
        >
          Talebi aç <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}
