import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useMyServiceRequests } from '@/hooks/useMyServiceRequests'
import { RequestCard } from '@/components/RequestCard'
import { EmptyState } from '@/components/EmptyState'
import { FullPageSpinner } from '@/components/FullPageSpinner'
import { StatusMessage } from '@/components/StatusMessage'
import { FIELD_CLASS } from '@/components/SelectField'
import { ROUTES } from '@/lib/constants'
import { STATUS_LABELS, STATUS_ORDER } from '@/lib/service-request-config'
import type { ServiceRequestStatus } from '@/types/database'

const PRIMARY_LINK =
  'btn btn-primary'

export function MyRequestsPage() {
  const { requests, loading, error, reload } = useMyServiceRequests()
  const [statusFilter, setStatusFilter] = useState<ServiceRequestStatus | 'all'>('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('tr-TR')
    return requests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      if (!needle) return true
      return (
        r.tracking_code.toLocaleLowerCase('tr-TR').includes(needle) ||
        r.title.toLocaleLowerCase('tr-TR').includes(needle)
      )
    })
  }, [requests, statusFilter, query])

  const filtering = statusFilter !== 'all' || query.trim() !== ''

  return (
    <section className="bg-page px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-navy-800">Taleplerim</h1>
            <p className="mt-1 text-sm text-muted">Oluşturduğunuz taleplerin durumunu buradan izleyebilirsiniz.</p>
          </div>
          <Link to={ROUTES.newRequest} className={PRIMARY_LINK}>
            Yeni Talep Oluştur
          </Link>
        </div>

        {loading ? (
          <FullPageSpinner label="Talepleriniz yükleniyor…" />
        ) : error ? (
          <div className="mt-6 card p-6">
            <StatusMessage status={{ type: 'error', message: error }} />
            <button
              type="button"
              onClick={reload}
              className="btn btn-primary mt-4"
            >
              Tekrar Dene
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="Henüz bir talebiniz yok"
              description="Köyünüzdeki bir sorunu bildirmek için ilk talebinizi oluşturun."
              action={
                <Link to={ROUTES.newRequest} className={PRIMARY_LINK}>
                  Yeni Talep Oluştur
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-6 grid gap-3 card p-4 sm:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-2">
                <label htmlFor="arama" className="block text-sm font-medium text-navy-800">
                  Ara
                </label>
                <input
                  id="arama"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Takip kodu veya başlık"
                  className={`${FIELD_CLASS} border-line-strong`}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="durum" className="block text-sm font-medium text-navy-800">
                  Durum
                </label>
                <select
                  id="durum"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as ServiceRequestStatus | 'all')}
                  className={`${FIELD_CLASS} border-line-strong`}
                >
                  <option value="all">Tüm durumlar</option>
                  {STATUS_ORDER.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <p className="mt-4 text-sm text-muted" role="status">
              {filtered.length} talep gösteriliyor
            </p>

            {filtered.length === 0 ? (
              <div className="mt-3">
                <EmptyState
                  title="Eşleşen talep bulunamadı"
                  description="Arama veya durum filtresini değiştirmeyi deneyin."
                  action={
                    filtering ? (
                      <button
                        type="button"
                        onClick={() => {
                          setQuery('')
                          setStatusFilter('all')
                        }}
                        className="btn btn-neutral"
                      >
                        Filtreleri Temizle
                      </button>
                    ) : undefined
                  }
                />
              </div>
            ) : (
              <ul className="mt-3 space-y-3">
                {filtered.map((request) => (
                  <li key={request.id}>
                    <RequestCard request={request} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </section>
  )
}
