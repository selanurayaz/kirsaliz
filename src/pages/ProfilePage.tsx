import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { FullPageSpinner } from '@/components/FullPageSpinner'
import { RoleBadge } from '@/components/RoleBadge'
import { StatusMessage } from '@/components/StatusMessage'
import { PersonalInfoForm } from '@/components/profile/PersonalInfoForm'
import { PasswordChangeForm } from '@/components/profile/PasswordChangeForm'
import { fetchMyProfileDetails, type ProfileDetails } from '@/lib/user-profile'
import { formatDate } from '@/lib/format'
import { logError, toUserMessage } from '@/lib/errors'

function ReadOnlyItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="readonly-field">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

export function ProfilePage() {
  const { user, refreshProfile } = useAuth()
  const userId = user?.id
  const [details, setDetails] = useState<ProfileDetails | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    try {
      const result = await fetchMyProfileDetails(userId)
      if (!result) {
        setError('Profil bilgileriniz bulunamadı.')
      } else {
        setDetails(result)
        setError(null)
      }
    } catch (err) {
      logError('Profil sayfası yüklenemedi', err)
      setError(toUserMessage(err, 'Profil bilgileri yüklenemedi. Lütfen daha sonra tekrar deneyin.'))
    }
  }, [userId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sayfa açılırken veri yüklenir
    void load()
  }, [load])

  const handleSaved = useCallback(async () => {
    await refreshProfile()
    await load()
  }, [refreshProfile, load])

  if (!details) {
    return error ? (
      <section className="px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <StatusMessage status={{ type: 'error', message: error }} />
        </div>
      </section>
    ) : (
      <FullPageSpinner label="Profil yükleniyor…" />
    )
  }

  const { profile } = details
  const isStaff = profile.role !== 'citizen'

  return (
    <section className="page-section">
      <div className="page-container space-y-6">
        <header>
          <h1 className="page-title">Profilim</h1>
          <p className="page-subtitle">Hesap bilgilerinizi görüntüleyin, kişisel bilgilerinizi ve şifrenizi güncelleyin.</p>
        </header>

        <section aria-labelledby="hesap-baslik" className="card card-accent">
          <div className="card-header">
            <h2 id="hesap-baslik" className="section-title">
              Hesap Özeti
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <RoleBadge role={profile.role} />
              <span className={`badge ${profile.is_active ? 'badge-success' : 'badge-neutral'}`}>
                {profile.is_active ? 'Aktif' : 'Pasif'}
              </span>
            </div>
          </div>
          <div className="card-body">
            <p className="mb-4 flex items-start gap-2 text-xs text-muted">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              Bu bilgiler yalnızca görüntülenir; e-posta, rol, birim ve hesap durumu buradan değiştirilemez.
            </p>
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <ReadOnlyItem label="Ad Soyad">{profile.full_name?.trim() || '—'}</ReadOnlyItem>
              <ReadOnlyItem label="E-posta">{user?.email ?? '—'}</ReadOnlyItem>
              <ReadOnlyItem label="Kayıt Tarihi">{formatDate(profile.created_at)}</ReadOnlyItem>
              {isStaff && <ReadOnlyItem label="Birim">{details.departmentName ?? '—'}</ReadOnlyItem>}
              {details.districtName && <ReadOnlyItem label="İlçe">{details.districtName}</ReadOnlyItem>}
              {details.villageName && <ReadOnlyItem label="Köy">{details.villageName}</ReadOnlyItem>}
            </dl>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <PersonalInfoForm details={details} onSaved={handleSaved} />
          {user?.email ? (
            <PasswordChangeForm email={user.email} />
          ) : (
            <StatusMessage status={{ type: 'info', message: 'Bu hesap için şifre değiştirme kullanılamıyor.' }} />
          )}
        </div>
      </div>
    </section>
  )
}
