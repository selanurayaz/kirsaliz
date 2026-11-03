import { formatDateTime } from '@/lib/format'
import { STATUS_LABELS } from '@/lib/service-request-config'
import type { ServiceRequestHistory } from '@/types/database'

/** Talep durum geçmişi — dikey zaman çizelgesi. */
export function StatusTimeline({ history }: { history: ServiceRequestHistory[] }) {
  return (
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
  )
}
