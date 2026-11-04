import { Link } from 'react-router'
import { CalendarDays, ChevronRight, MapPin, Tag } from 'lucide-react'
import { StatusBadge, UrgencyBadge } from '@/components/StatusBadge'
import { requestDetailPath } from '@/lib/constants'
import { formatDate, formatLocation } from '@/lib/format'
import type { ServiceRequestWithRelations } from '@/types/database'

export function RequestCard({ request }: { request: ServiceRequestWithRelations }) {
  return (
    <article className="card card-interactive p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="rounded bg-page px-2 py-0.5 font-mono text-xs font-semibold tracking-wider text-navy-muted ring-1 ring-line ring-inset">
          {request.tracking_code}
        </p>
        <div className="flex flex-wrap gap-1.5">
          <StatusBadge status={request.status} />
          <UrgencyBadge urgency={request.urgency} />
        </div>
      </div>

      <h3 className="mt-3 text-base font-semibold break-words text-navy sm:text-lg">{request.title}</h3>

      <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-navy-muted">
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Kategori</dt>
          <Tag className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <dd>{request.category?.name ?? '—'}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Konum</dt>
          <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <dd>{formatLocation(request.village)}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Oluşturulma tarihi</dt>
          <CalendarDays className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <dd>{formatDate(request.created_at)}</dd>
        </div>
      </dl>

      <div className="mt-4 border-t border-line pt-3">
        <Link
          to={requestDetailPath(request.id)}
          className="link inline-flex items-center gap-1 text-sm"
          aria-label={`${request.title} talebinin detaylarını gör`}
        >
          Detayları gör <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </article>
  )
}
