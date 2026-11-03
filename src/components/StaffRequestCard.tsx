import { Link } from 'react-router'
import { StatusBadge, UrgencyBadge } from '@/components/StatusBadge'
import { staffRequestDetailPath } from '@/lib/constants'
import { formatDate, formatLocation } from '@/lib/format'
import type { StaffRequestListItem } from '@/types/database'

export function StaffRequestCard({ request }: { request: StaffRequestListItem }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-brand-300 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-mono text-xs font-semibold tracking-wide text-slate-500">{request.tracking_code}</p>
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge status={request.status} />
          <UrgencyBadge urgency={request.urgency} />
        </div>
      </div>

      <h3 className="mt-2 text-base font-semibold break-words text-navy-900">{request.title}</h3>

      <dl className="mt-2 grid gap-x-6 gap-y-1 text-sm text-slate-600 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <dt className="text-xs text-slate-400">Kategori</dt>
          <dd>{request.category?.name ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Birim</dt>
          <dd>{request.department?.name ?? '—'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Konum</dt>
          <dd>{formatLocation(request.village)}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Atanan personel</dt>
          <dd>{request.assigned_to ? (request.assigned_name ?? 'Adsız personel') : 'Atanmadı'}</dd>
        </div>
        <div>
          <dt className="text-xs text-slate-400">Tarih</dt>
          <dd>{formatDate(request.created_at)}</dd>
        </div>
      </dl>

      <div className="mt-3">
        <Link
          to={staffRequestDetailPath(request.id)}
          className="rounded text-sm font-semibold text-brand-700 hover:text-brand-800 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
          aria-label={`${request.title} talebini aç`}
        >
          Talebi aç →
        </Link>
      </div>
    </article>
  )
}
