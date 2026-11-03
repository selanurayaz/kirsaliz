import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { useMyServiceRequests } from '@/hooks/useMyServiceRequests'
import { RequestCard } from '@/components/RequestCard'
import { EmptyState } from '@/components/EmptyState'
import { FullPageSpinner } from '@/components/FullPageSpinner'
import { StatusMessage } from '@/components/StatusMessage'
import { getMyProfile } from '@/lib/profiles'
import { ROUTES } from '@/lib/constants'
import type { Profile } from '@/types/database'

const PRIMARY_LINK =
  'rounded-md bg-brand-600 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none'

function SummaryCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className={`mt-1 text-3xl font-bold ${accent}`}>{value}</dd>
    </div>
  )
}

/** Vatandaş paneli: karşılama, özet kartları ve son talepler. */
export function PanelPage() {
  const { user } = useAuth()
  const { requests, loading, error, reload } = useMyServiceRequests()
  const [profile, setProfile] = useState<Profile | null>(null)
  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    let active = true
    getMyProfile(userId).then((data) => {
      if (active) setProfile(data)
    })
    return () => {
      active = false
    }
  }, [userId])

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
    <section className="bg-slate-100 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="rounded-xl bg-navy-800 p-6 text-white shadow-sm sm:p-8">
          <p className="text-sm text-navy-200">Hoş geldiniz</p>
          <h1 className="mt-1 text-2xl font-bold break-words sm:text-3xl">{displayName}</h1>
          <p className="mt-2 text-sm text-navy-100">Köyünüzdeki sorunları bildirin, taleplerinizin durumunu izleyin.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link to={ROUTES.newRequest} className={PRIMARY_LINK}>
              Yeni Talep Oluştur
            </Link>
            <Link
              to={ROUTES.myRequests}
              className="rounded-md border border-white/30 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white focus-visible:outline-none"
            >
              Taleplerim
            </Link>
          </div>
        </div>

        {loading ? (
          <FullPageSpinner label="Talepleriniz yükleniyor…" />
        ) : error ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <StatusMessage status={{ type: 'error', message: error }} />
            <button
              type="button"
              onClick={reload}
              className="mt-4 rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700"
            >
              Tekrar Dene
            </button>
          </div>
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Talep özeti">
              <SummaryCard label="Toplam talep" value={summary.total} accent="text-navy-800" />
              <SummaryCard label="Alındı / İnceleniyor" value={summary.pending} accent="text-slate-700" />
              <SummaryCard label="İşlemde" value={summary.inProgress} accent="text-amber-700" />
              <SummaryCard label="Çözüldü" value={summary.resolved} accent="text-brand-700" />
            </dl>

            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-navy-800">Son Talepler</h2>
                {requests.length > 0 && (
                  <Link to={ROUTES.myRequests} className="text-sm font-semibold text-brand-700 hover:text-brand-800">
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
                      <Link to={ROUTES.newRequest} className={PRIMARY_LINK}>
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
