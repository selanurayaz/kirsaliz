import { useMemo } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { useMyServiceRequests } from '@/hooks/useMyServiceRequests'
import { RequestCard } from '@/components/RequestCard'
import { EmptyState } from '@/components/EmptyState'
import { FullPageSpinner } from '@/components/FullPageSpinner'
import { StatusMessage } from '@/components/StatusMessage'
import { ROUTES } from '@/lib/constants'


function SummaryCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="stat">
      <dt className="stat-label">{label}</dt>
      <dd className={`stat-value ${accent}`}>{value}</dd>
    </div>
  )
}

/** Kurum personeli vatandaş panelini görmez; kurum paneline yönlendirilir. */
export function PanelPage() {
  const { role } = useAuth()
  if (role && role !== 'citizen') return <Navigate to={ROUTES.staffDashboard} replace />
  return <CitizenPanel />
}

/** Vatandaş paneli: karşılama, özet kartları ve son talepler. */
function CitizenPanel() {
  const { user, profile } = useAuth()
  const { requests, loading, error, reload } = useMyServiceRequests()

  const metadataName = typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : ''
  const displayName = profile?.full_name?.trim() || metadataName.trim() || user?.email || ''

  const summary = useMemo(
    () => ({
      total: requests.length,
      pending: requests.filter((r) => r.status === 'submitted' || r.status === 'under_review').length,
      inProgress: requests.filter((r) => r.status === 'assigned' || r.status === 'in_progress').length,
      resolved: requests.filter((r) => r.status === 'resolved').length,
    }),
    [requests],
  )

  return (
    <section className="page-section">
      <div className="page-container space-y-8">
        <header className="flex flex-col gap-5 rounded-xl border border-line border-l-4 border-l-primary bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="min-w-0">
            <p className="eyebrow">Hoş geldiniz</p>
            <h1 className="page-title mt-1 break-words">{displayName}</h1>
            <p className="page-subtitle">Köyünüzdeki sorunları bildirin, taleplerinizin durumunu izleyin.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
            <Link to={ROUTES.newRequest} className="btn btn-primary btn-lg">
              Yeni Talep Oluştur
            </Link>
            <Link to={ROUTES.myRequests} className="btn btn-secondary btn-lg">
              Taleplerim
            </Link>
          </div>
        </header>

        {loading ? (
          <FullPageSpinner label="Talepleriniz yükleniyor…" />
        ) : error ? (
          <div className="card p-6">
            <StatusMessage status={{ type: 'error', message: error }} />
            <button
              type="button"
              onClick={reload}
              className="btn btn-primary mt-4"
            >
              Tekrar Dene
            </button>
          </div>
        ) : (
          <>
            <dl className="stat-strip grid-cols-2 lg:grid-cols-4" aria-label="Talep özeti">
              <SummaryCard label="Toplam talep" value={summary.total} accent="text-navy" />
              <SummaryCard label="Alındı / İnceleniyor" value={summary.pending} accent="text-navy-muted" />
              <SummaryCard label="İşlemde" value={summary.inProgress} accent="text-primary" />
              <SummaryCard label="Çözüldü" value={summary.resolved} accent="text-success" />
            </dl>

            <div>
              <div className="flex items-center justify-between">
                <h2 className="section-title">Son Talepler</h2>
                {requests.length > 0 && (
                  <Link to={ROUTES.myRequests} className="link text-sm">
                    Tümünü gör
                  </Link>
                )}
              </div>
              {requests.length === 0 ? (
                <div className="mt-3">
                  <EmptyState
                    title="Henüz bir talebiniz yok"
                    description="Köyünüzdeki bir sorunu bildirmek için ilk talebinizi oluşturun."
                    action={
                      <Link to={ROUTES.newRequest} className="btn btn-primary">
                        Yeni Talep Oluştur
                      </Link>
                    }
                  />
                </div>
              ) : (
                <ul className="mt-3 space-y-3">
                  {requests.slice(0, 3).map((request) => (
                    <li key={request.id}>
                      <RequestCard request={request} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
