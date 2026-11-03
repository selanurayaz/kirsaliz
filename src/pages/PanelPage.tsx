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
    <div className="card border-l-4 border-l-primary p-4">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className={`mt-1 text-3xl font-bold ${accent}`}>{value}</dd>
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
    <section className="px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="rounded-xl border-b-4 border-primary bg-primary-dark p-6 text-white shadow-sm sm:p-8">
          <p className="text-sm text-primary-border">Hoş geldiniz</p>
          <h1 className="mt-1 text-2xl font-bold break-words sm:text-3xl">{displayName}</h1>
          <p className="mt-2 text-sm text-primary-soft">Köyünüzdeki sorunları bildirin, taleplerinizin durumunu izleyin.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link to={ROUTES.newRequest} className="btn bg-white text-primary-dark hover:bg-primary-soft focus-visible:ring-white focus-visible:ring-offset-primary-dark">
              Yeni Talep Oluştur
            </Link>
            <Link
              to={ROUTES.myRequests}
              className="btn border-white/40 text-white hover:bg-white/10 focus-visible:ring-white focus-visible:ring-offset-primary-dark"
            >
              Taleplerim
            </Link>
          </div>
        </div>

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
            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Talep özeti">
              <SummaryCard label="Toplam talep" value={summary.total} accent="text-navy" />
              <SummaryCard label="Alındı / İnceleniyor" value={summary.pending} accent="text-navy-soft" />
              <SummaryCard label="İşlemde" value={summary.inProgress} accent="text-primary" />
              <SummaryCard label="Çözüldü" value={summary.resolved} accent="text-primary-dark" />
            </dl>

            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-navy-800">Son Talepler</h2>
                {requests.length > 0 && (
                  <Link to={ROUTES.myRequests} className="text-sm font-semibold text-primary hover:text-primary-dark">
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
                      <Link to={ROUTES.newRequest} className="btn bg-white text-primary-dark hover:bg-primary-soft focus-visible:ring-white focus-visible:ring-offset-primary-dark">
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
