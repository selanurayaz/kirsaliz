import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { EmptyState } from '@/components/EmptyState'
import { FullPageSpinner } from '@/components/FullPageSpinner'
import { RoleBadge } from '@/components/RoleBadge'
import { FIELD_CLASS } from '@/components/SelectField'
import { StatusMessage, type StatusState } from '@/components/StatusMessage'
import { UserAccessEditor } from '@/components/UserAccessEditor'
import { getAccessHistory, getAdminUsers, updateUserAccess } from '@/lib/admin-users'
import { ROLE_LABELS } from '@/lib/constants'
import { logError, toUserMessage } from '@/lib/errors'
import { formatDate, formatDateTime } from '@/lib/format'
import { fetchActiveDepartments } from '@/lib/reference-data'
import type {
  AccessUpdatePayload,
  AdminUserListItem,
  Department,
  ProfileAccessHistory,
  UserRole,
} from '@/types/database'

const ROLE_FILTERS: UserRole[] = ['citizen', 'field_personnel', 'department_officer', 'admin']

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
        active ? 'bg-navy-50 text-navy ring-navy-200' : 'bg-destructive-soft text-destructive-hover ring-destructive-border'
      }`}
    >
      {active ? '● Aktif' : '○ Pasif'}
    </span>
  )
}

export function AdminUsersPage() {
  const { user: currentUser, refreshProfile } = useAuth()
  const [users, setUsers] = useState<AdminUserListItem[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [history, setHistory] = useState<ProfileAccessHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const [editing, setEditing] = useState<AdminUserListItem | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [flash, setFlash] = useState<StatusState>(null)

  useEffect(() => {
    let alive = true
    // eslint-disable-next-line react-hooks/set-state-in-effect -- veri yüklemesi başlarken yükleme durumu sıfırlanır
    setLoading(true)
    setError(null)
    Promise.all([getAdminUsers(), fetchActiveDepartments()])
      .then(([u, d]) => {
        if (!alive) return
        setUsers(u)
        setDepartments(d)
      })
      .catch((err: unknown) => {
        logError('Kullanıcılar yüklenemedi', err)
        if (alive) setError(toUserMessage(err, 'Kullanıcılar yüklenemedi. Lütfen daha sonra tekrar deneyin.'))
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    // Denetim kaydı yüklenemese de sayfa çalışır.
    getAccessHistory(10)
      .then((h) => {
        if (alive) setHistory(h)
      })
      .catch((err: unknown) => logError('Erişim geçmişi yüklenemedi', err))
    return () => {
      alive = false
    }
  }, [reloadKey])

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('tr-TR')
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (activeFilter === 'active' && !u.is_active) return false
      if (activeFilter === 'inactive' && u.is_active) return false
      if (!needle) return true
      return (
        (u.full_name ?? '').toLocaleLowerCase('tr-TR').includes(needle) ||
        u.email.toLocaleLowerCase('tr-TR').includes(needle)
      )
    })
  }, [users, query, roleFilter, activeFilter])

  const usersById = useMemo(() => new Map(users.map((u) => [u.id, u])), [users])
  const departmentNames = useMemo(() => new Map(departments.map((d) => [d.id, d.name])), [departments])

  function userLabel(id: string | null): string {
    if (!id) return 'Silinmiş kullanıcı'
    const u = usersById.get(id)
    return u ? u.full_name?.trim() || u.email : 'Bilinmeyen kullanıcı'
  }

  async function handleSave(payload: AccessUpdatePayload) {
    if (saving) return
    setSaving(true)
    setSaveError(null)
    try {
      await updateUserAccess(payload)
      setEditing(null)
      setFlash({ type: 'success', message: 'Kullanıcı erişimi güncellendi.' })
      if (payload.userId === currentUser?.id) await refreshProfile()
      setReloadKey((k) => k + 1)
    } catch (err) {
      setSaveError(toUserMessage(err, 'Kullanıcı erişimi güncellenemedi. Lütfen tekrar deneyin.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="page-section">
      <div className="page-container space-y-6">
        <div>
          <h1 className="page-title">Kullanıcı Yönetimi</h1>
          <p className="page-subtitle">
            Kayıtlı kullanıcıların rol, birim ve hesap durumunu yönetin. Yeni personel önce normal kayıt olur, ardından
            buradan yetkilendirilir.
          </p>
        </div>

        <StatusMessage status={flash} />

        {loading ? (
          <FullPageSpinner label="Kullanıcılar yükleniyor…" />
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
        ) : (
          <>
            <div className="grid gap-3 card p-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <label htmlFor="kullanici-arama" className="field-label">
                  Ad veya e-posta ara
                </label>
                <input
                  id="kullanici-arama"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className={`${FIELD_CLASS} border-line-strong`}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="kullanici-rol-filtre" className="field-label">
                  Rol
                </label>
                <select
                  id="kullanici-rol-filtre"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                  className={`${FIELD_CLASS} border-line-strong`}
                >
                  <option value="all">Tüm roller</option>
                  {ROLE_FILTERS.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="kullanici-durum-filtre" className="field-label">
                  Hesap durumu
                </label>
                <select
                  id="kullanici-durum-filtre"
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  className={`${FIELD_CLASS} border-line-strong`}
                >
                  <option value="all">Tümü</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                </select>
              </div>
            </div>

            <p className="text-sm text-muted" role="status">
              {filtered.length} kullanıcı gösteriliyor
            </p>

            {filtered.length === 0 ? (
              <EmptyState title="Kullanıcı bulunamadı" description="Arama veya filtreleri değiştirmeyi deneyin." />
            ) : (
              <ul className="space-y-3">
                {filtered.map((u) => {
                  const isSelf = u.id === currentUser?.id
                  return (
                    <li key={u.id} className="card p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold break-words text-navy">
                            {u.full_name?.trim() || 'Adsız kullanıcı'}
                            {isSelf && <span className="ml-2 text-xs font-medium text-muted">(Siz)</span>}
                          </p>
                          <p className="text-sm break-all text-navy-muted">{u.email}</p>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          <RoleBadge role={u.role} />
                          <ActiveBadge active={u.is_active} />
                        </div>
                      </div>
                      <dl className="mt-3 grid gap-x-6 gap-y-1 text-sm text-navy-muted sm:grid-cols-3">
                        <div>
                          <dt className="text-xs text-muted">Birim</dt>
                          <dd>{u.department_name ?? '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-muted">Kayıt tarihi</dt>
                          <dd>{formatDate(u.created_at)}</dd>
                        </div>
                      </dl>
                      <div className="mt-3">
                        {isSelf ? (
                          <p className="text-xs text-muted">Kendi rolünüzü ve hesap durumunuzu değiştiremezsiniz.</p>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSaveError(null)
                              setFlash(null)
                              setEditing(u)
                            }}
                            aria-label={`${u.full_name?.trim() || u.email} kullanıcısının erişimini düzenle`}
                            className="btn btn-neutral btn-sm"
                          >
                            Düzenle
                          </button>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            {history.length > 0 && (
              <section aria-labelledby="erisim-gecmisi" className="card p-5">
                <h2 id="erisim-gecmisi" className="section-title">
                  Son Erişim Değişiklikleri
                </h2>
                <ul className="mt-3 divide-y divide-line text-sm">
                  {history.map((h) => (
                    <li key={h.id} className="py-2 text-navy-muted">
                      <span className="font-medium">{userLabel(h.target_user_id)}</span>:{' '}
                      {ROLE_LABELS[h.old_role]} → {ROLE_LABELS[h.new_role]}
                      {h.new_department_id && ` (${departmentNames.get(h.new_department_id) ?? 'Birim'})`}
                      {h.old_is_active !== h.new_is_active && (h.new_is_active ? ' · Aktifleştirildi' : ' · Pasifleştirildi')}
                      <span className="block text-xs text-muted">
                        {userLabel(h.changed_by)} · {formatDateTime(h.created_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}
      </div>

      {editing && (
        <UserAccessEditor
          key={editing.id}
          user={editing}
          departments={departments}
          saving={saving}
          error={saveError}
          onSave={(payload) => void handleSave(payload)}
          onClose={() => setEditing(null)}
        />
      )}
    </section>
  )
}
