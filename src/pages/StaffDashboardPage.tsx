import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { EmptyState } from '@/components/EmptyState'
import { FullPageSpinner } from '@/components/FullPageSpinner'
import { FIELD_CLASS } from '@/components/SelectField'
import { StaffRequestCard } from '@/components/StaffRequestCard'
import { StatusMessage } from '@/components/StatusMessage'
import { fetchActiveDepartments } from '@/lib/reference-data'
import { logError, toUserMessage } from '@/lib/errors'
import {
  STATUS_LABELS,
  STATUS_ORDER,
  URGENCY_LABELS,
  URGENCY_ORDER,
} from '@/lib/service-request-config'
import {
  STAFF_PAGE_SIZE,
  getStaffRequestSummary,
  getStaffRequests,
  type StaffRequestFilters,
  type StaffRequestPage,
} from '@/lib/staff-requests'
import type { Department, RequestUrgency, ServiceRequestStatus, StaffRequestSummary } from '@/types/database'

const SUMMARY_STATUSES: ServiceRequestStatus[] = [
  'submitted',
  'under_review',
  'assigned',
  'in_progress',
  'resolved',
  'rejected',
]

const TITLES = {
  admin: 'Kurum Paneli',
  department_officer: 'Birim Talepleri',
  field_personnel: 'Görevlerim',
} as const

const DESCRIPTIONS = {
  admin: 'Tüm birimlerdeki talepleri izleyin ve yönetin.',
  department_officer: 'Biriminize gelen talepleri inceleyin, atayın ve sonuçlandırın.',
  field_personnel: 'Size atanan görevleri görüntüleyin ve ilerletin.',
} as const

function SummaryCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="stat">
      <dt className="stat-label">{label}</dt>
      <dd className="stat-value">{value ?? '—'}</dd>
    </div>
  )
}

export function StaffDashboardPage() {
  const { profile } = useAuth()
  const role = profile?.role
  const profileId = profile?.id
  const profileDepartment = profile?.department_id ?? null

  const [departments, setDepartments] = useState<Department[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ServiceRequestStatus | 'all'>('all')
  const [urgency, setUrgency] = useState<RequestUrgency | 'all'>('all')
  const [departmentId, setDepartmentId] = useState('all')
  const [pageIndex, setPageIndex] = useState(0)
  const [reloadKey, setReloadKey] = useState(0)

  const [summary, setSummary] = useState<StaffRequestSummary | null>(null)
  const [summaryError, setSummaryError] = useState<string | null>(null)
  const [result, setResult] = useState<StaffRequestPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Arama kutusu için kısa gecikme
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput)
      setPageIndex(0)
    }, 350)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  // Birim filtresi (yalnızca admin)
  useEffect(() => {
    if (role !== 'admin') return
    let alive = true
    fetchActiveDepartments()
      .then((data) => {
        if (alive) setDepartments(data)
      })
      .catch((err: unknown) => logError('Birimler yüklenemedi', err))
    return () => {
      alive = false
    }
  }, [role])

  // Özet kartları
  useEffect(() => {
    if (!role) return
    let alive = true
    // eslint-disable-next-line react-hooks/set-state-in-effect -- veri yüklemesi başlarken yükleme durumu sıfırlanır
    setSummaryError(null)
    getStaffRequestSummary(role === 'admin' ? departmentId : 'all')
      .then((data) => {
        if (alive) setSummary(data)
      })
      .catch((err: unknown) => {
        if (alive) setSummaryError(toUserMessage(err, 'Özet bilgiler yüklenemedi.'))
      })
    return () => {
      alive = false
    }
  }, [role, departmentId, reloadKey])

  // Talep listesi
  useEffect(() => {
    if (!role || !profileId) return
    let alive = true
    // eslint-disable-next-line react-hooks/set-state-in-effect -- veri yüklemesi başlarken yükleme durumu sıfırlanır
    setLoading(true)
    setError(null)
    const filters: StaffRequestFilters = { search, status, urgency, departmentId }
    getStaffRequests({ id: profileId, role, department_id: profileDepartment }, filters, pageIndex)
      .then((data) => {
        if (alive) setResult(data)
      })
      .catch((err: unknown) => {
        if (alive) setError(toUserMessage(err, 'Talepler yüklenemedi. Lütfen daha sonra tekrar deneyin.'))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [role, profileId, profileDepartment, search, status, urgency, departmentId, pageIndex, reloadKey])

  if (!role || role === 'citizen') return null

  const total = result?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / STAFF_PAGE_SIZE))
  const filtering = search.trim() !== '' || status !== 'all' || urgency !== 'all' || departmentId !== 'all'
  const showOfficerWarning = role === 'department_officer' && !profileDepartment

  function resetFilters() {
    setSearchInput('')
    setSearch('')
    setStatus('all')
    setUrgency('all')
    setDepartmentId('all')
    setPageIndex(0)
  }

  return (
    <section className="page-section">
      <div className="page-container space-y-6">
        <div>
          <h1 className="page-title">{TITLES[role]}</h1>
          <p className="page-subtitle">{DESCRIPTIONS[role]}</p>
        </div>

        {showOfficerWarning && (
          <StatusMessage
            status={{
              type: 'error',
              message: 'Hesabınıza henüz bir birim atanmamış. Lütfen sistem yöneticisiyle iletişime geçin.',
            }}
          />
        )}

        {summaryError ? (
          <StatusMessage status={{ type: 'error', message: summaryError }} />
        ) : (
          <dl className="stat-strip grid-cols-2 sm:grid-cols-4 lg:grid-cols-7" aria-label="Talep özeti">
            <SummaryCard label="Toplam" value={summary?.total ?? null} />
            {SUMMARY_STATUSES.map((s) => (
              <SummaryCard key={s} label={STATUS_LABELS[s]} value={summary?.counts[s] ?? null} />
            ))}
          </dl>
        )}

        <div
          id="talepler"
          className="grid gap-3 card p-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <label htmlFor="kurum-arama" className="field-label">
              Ara
            </label>
            <input
              id="kurum-arama"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Takip kodu veya başlık"
              className={`${FIELD_CLASS} border-line-strong`}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="kurum-durum" className="field-label">
              Durum
            </label>
            <select
              id="kurum-durum"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as ServiceRequestStatus | 'all')
                setPageIndex(0)
              }}
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
          <div className="space-y-1.5">
            <label htmlFor="kurum-aciliyet" className="field-label">
              Aciliyet
            </label>
            <select
              id="kurum-aciliyet"
              value={urgency}
              onChange={(e) => {
                setUrgency(e.target.value as RequestUrgency | 'all')
                setPageIndex(0)
              }}
              className={`${FIELD_CLASS} border-line-strong`}
            >
              <option value="all">Tüm düzeyler</option>
              {URGENCY_ORDER.map((u) => (
                <option key={u} value={u}>
                  {URGENCY_LABELS[u]}
                </option>
              ))}
            </select>
          </div>
          {role === 'admin' && (
            <div className="space-y-1.5">
              <label htmlFor="kurum-birim" className="field-label">
                Birim
              </label>
              <select
                id="kurum-birim"
                value={departmentId}
                onChange={(e) => {
                  setDepartmentId(e.target.value)
                  setPageIndex(0)
                }}
                className={`${FIELD_CLASS} border-line-strong`}
              >
                <option value="all">Tüm birimler</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {loading && !result ? (
          <FullPageSpinner label="Talepler yükleniyor…" />
        ) : error ? (
          <div className="card p-6">
            <StatusMessage status={{ type: 'error', message: error }} />
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="btn btn-primary mt-4"
            >
              Tekrar Dene
            </button>
          </div>
        ) : !result || result.items.length === 0 ? (
          <EmptyState
            title={filtering ? 'Eşleşen talep bulunamadı' : 'Henüz talep yok'}
            description={
              filtering
                ? 'Arama veya filtreleri değiştirmeyi deneyin.'
                : role === 'field_personnel'
                  ? 'Size atanmış bir görev bulunmuyor.'
                  : 'Bu kapsamda görüntülenecek talep bulunmuyor.'
            }
            action={
              filtering ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="btn btn-neutral"
                >
                  Filtreleri Temizle
                </button>
              ) : undefined
            }
          />
        ) : (
          <div aria-busy={loading}>
            <p className="text-sm text-muted" role="status">
              {total} talep bulundu · Sayfa {pageIndex + 1}/{pageCount}
            </p>
            <ul className={`mt-3 space-y-3 ${loading ? 'opacity-60' : ''}`}>
              {result.items.map((request) => (
                <li key={request.id}>
                  <StaffRequestCard request={request} />
                </li>
              ))}
            </ul>

            {pageCount > 1 && (
              <nav aria-label="Sayfalama" className="mt-6 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
                  disabled={pageIndex === 0 || loading}
                  className="btn btn-neutral"
                >
                  ← Önceki
                </button>
                <span className="text-sm text-muted">
                  {pageIndex + 1} / {pageCount}
                </span>
                <button
                  type="button"
                  onClick={() => setPageIndex((p) => Math.min(pageCount - 1, p + 1))}
                  disabled={pageIndex >= pageCount - 1 || loading}
                  className="btn btn-neutral"
                >
                  Sonraki →
                </button>
              </nav>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
