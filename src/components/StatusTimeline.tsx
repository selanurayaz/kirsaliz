import { formatDateTime } from '@/lib/format'
import { STATUS_LABELS } from '@/lib/service-request-config'
import type { ServiceRequestHistory } from '@/types/database'

/** Talep durum geçmişi — dikey zaman çizelgesi. */
export function StatusTimeline({ history }: { history: ServiceRequestHistory[] }) {
  return (
    <section aria-labelledby="gecmis" className="card card-body">
      <h2 id="gecmis" className="section-title">
        Durum Geçmişi
      </h2>
      {history.length === 0 ? (
        <p className="mt-3 text-sm text-muted">Henüz geçmiş kaydı yok.</p>
      ) : (
        <ol className="timeline mt-5">
          {history.map((entry, index) => (
            <li key={entry.id} className="timeline-item">
              <span
                aria-hidden="true"
                className={`timeline-dot ${
                  entry.status === 'rejected' || entry.status === 'cancelled'
                    ? 'bg-destructive ring-destructive-border'
                    : index === history.length - 1
                      ? 'bg-primary ring-primary-border'
                      : 'bg-navy-300 ring-line'
                }`}
              />
              <p className="text-sm font-semibold text-navy">{STATUS_LABELS[entry.status]}</p>
              <p className="text-xs text-muted">{formatDateTime(entry.created_at)}</p>
              {entry.note && <p className="mt-1 text-sm text-navy-muted">{entry.note}</p>}
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}
