import { useCallback, useEffect, useState, type ReactNode } from 'react'
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
    <div className="rounded-md border border-line bg-page px-3 py-2">
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm break-words text-navy-800">{children}</dd>
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
    <section className="px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-2xl font-bold text-navy-800 sm:text-3xl">Profilim</h1>

        <section aria-labelledby="hesap-baslik" className="card border-l-4 border-l-primary p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="hesap-baslik" className="text-lg font-bold text-navy-800">
              Hesap Özeti
            </h2>
            <RoleBadge role={profile.role} />
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
                profile.is_active
                  ? 'bg-primary-soft text-primary-dark ring-primary-border'
                  : 'bg-page text-slate-700 ring-line-strong'
              }`}
            >
              {profile.is_active ? 'Aktif' : 'Pasif'}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">
            Bu bilgiler yalnızca görüntülenir; e-posta, rol ve hesap durumu buradan değiştirilemez.
          </p>
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <ReadOnlyItem label="Ad Soyad">{profile.full_name?.trim() || '—'}</ReadOnlyItem>
            <ReadOnlyItem label="E-posta">{user?.email ?? '—'}</ReadOnlyItem>
            <ReadOnlyItem label="Kayıt Tarihi">{formatDate(profile.created_at)}</ReadOnlyItem>
            {isStaff && <ReadOnlyItem label="Birim">{details.departmentName ?? '—'}</ReadOnlyItem>}
            {details.districtName && <ReadOnlyItem label="İlçe">{details.districtName}</ReadOnlyItem>}
            {details.villageName && <ReadOnlyItem label="Köy">{details.villageName}</ReadOnlyItem>}
          </dl>
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
