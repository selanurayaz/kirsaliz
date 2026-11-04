import { useEffect, useRef, useState, type FormEvent } from 'react'
import { FormField } from '@/components/FormField'
import { SelectField } from '@/components/SelectField'
import { StatusMessage, type StatusState } from '@/components/StatusMessage'
import { fetchActiveDistricts, fetchVillagesByDistrict } from '@/lib/reference-data'
import { toUserMessage, UserFacingError, logError } from '@/lib/errors'
import {
  FULL_NAME_MAX_LENGTH,
  PHONE_MAX_LENGTH,
  updateMyProfile,
  validateProfileForm,
  type ProfileDetails,
} from '@/lib/user-profile'
import type { District, Village } from '@/types/database'

interface PersonalInfoFormProps {
  details: ProfileDetails
  /** Güncelleme başarılı olduğunda AuthProvider profilini ve sayfa verisini yeniler. */
  onSaved: () => Promise<void>
}

/** Ad soyad, telefon ve (yalnızca vatandaşlar için) ilçe/köy düzenleme formu. */
export function PersonalInfoForm({ details, onSaved }: PersonalInfoFormProps) {
  const { profile } = details
  const isCitizen = profile.role === 'citizen'

  const [fullName, setFullName] = useState(profile.full_name ?? '')
  const [phone, setPhone] = useState(profile.phone ?? '')
  const [districtId, setDistrictId] = useState(details.districtId ?? '')
  const [villageId, setVillageId] = useState(profile.village_id ?? '')
  const [districts, setDistricts] = useState<District[]>([])
  const [villages, setVillages] = useState<Village[]>([])
  const [referenceError, setReferenceError] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<{ fullName?: string; phone?: string }>({})
  const [status, setStatus] = useState<StatusState>(null)
  const [saving, setSaving] = useState(false)
  const submitLock = useRef(false)

  useEffect(() => {
    if (!isCitizen) return
    let active = true
    fetchActiveDistricts()
      .then((data) => {
        if (active) setDistricts(data)
      })
      .catch((err: unknown) => {
        logError('İlçeler yüklenemedi', err)
        if (active) setReferenceError(true)
      })
    return () => {
      active = false
    }
  }, [isCitizen])

  useEffect(() => {
    if (!isCitizen || !districtId) return
    let active = true
    fetchVillagesByDistrict(districtId)
      .then((data) => {
        if (active) setVillages(data)
      })
      .catch((err: unknown) => {
        logError('Köyler yüklenemedi', err)
        if (active) setReferenceError(true)
      })
    return () => {
      active = false
    }
  }, [isCitizen, districtId])

  function handleDistrictChange(nextDistrictId: string) {
    setDistrictId(nextDistrictId)
    // Köy seçimi yeni ilçeye ait olmayabilir; sıfırlanır.
    setVillageId('')
    setVillages([])
  }

  // Kayıtlı köy pasif/demo ise listede yoktur; değiştirilmediği sürece olduğu gibi korunur.
  const unchangedVillageMissing =
    Boolean(profile.village_id) &&
    villageId === profile.village_id &&
    districtId === (details.districtId ?? '') &&
    !villages.some((v) => v.id === profile.village_id)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitLock.current) return
    setStatus(null)

    const errors = validateProfileForm({ fullName, phone })
    setFieldErrors(errors ?? {})
    if (errors) {
      setStatus({ type: 'error', message: 'Lütfen işaretli alanları düzeltin.' })
      return
    }

    submitLock.current = true
    setSaving(true)
    try {
      await updateMyProfile({
        fullName,
        phone,
        ...(isCitizen ? { villageId: villageId || null } : {}),
      })
      await onSaved()
      setStatus({ type: 'success', message: 'Bilgileriniz güncellendi.' })
    } catch (err) {
      const message =
        err instanceof UserFacingError
          ? err.message
          : toUserMessage(err, 'Bilgileriniz güncellenemedi. Lütfen tekrar deneyin.')
      setStatus({ type: 'error', message })
    } finally {
      submitLock.current = false
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-busy={saving}
      aria-labelledby="kisisel-baslik"
      className="card card-body space-y-4"
    >
      <div>
        <h2 id="kisisel-baslik" className="section-title">
          Kişisel Bilgiler
        </h2>
        <p className="field-hint mt-1">* ile işaretli alanlar zorunludur.</p>
      </div>

      <FormField
        id="fullName"
        label="Ad Soyad *"
        type="text"
        autoComplete="name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        maxLength={FULL_NAME_MAX_LENGTH}
        required
        disabled={saving}
        aria-invalid={fieldErrors.fullName ? true : undefined}
        aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined}
      />
      {fieldErrors.fullName && (
        <p id="fullName-error" className="field-error -mt-2">
          {fieldErrors.fullName}
        </p>
      )}

      <FormField
        id="phone"
        label="Telefon (isteğe bağlı)"
        type="tel"
        autoComplete="tel"
        placeholder="05xx xxx xx xx"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        maxLength={PHONE_MAX_LENGTH}
        disabled={saving}
        aria-invalid={fieldErrors.phone ? true : undefined}
        aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
      />
      {fieldErrors.phone && (
        <p id="phone-error" className="field-error -mt-2">
          {fieldErrors.phone}
        </p>
      )}

      {isCitizen && (
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            id="district"
            label="İlçe (isteğe bağlı)"
            value={districtId}
            onChange={(e) => handleDistrictChange(e.target.value)}
            disabled={saving}
          >
            <option value="">İlçe seçin</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </SelectField>
          <SelectField
            id="village"
            label="Köy (isteğe bağlı)"
            value={villageId}
            onChange={(e) => setVillageId(e.target.value)}
            disabled={saving || !districtId}
            hint={!districtId ? 'Önce ilçe seçin.' : undefined}
          >
            <option value="">Köy seçin</option>
            {unchangedVillageMissing && profile.village_id && (
              <option value={profile.village_id}>{details.villageName ?? 'Kayıtlı köyünüz'} (mevcut)</option>
            )}
            {villages.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </SelectField>
        </div>
      )}
      {referenceError && (
        <StatusMessage
          status={{ type: 'error', message: 'İlçe ve köy listesi yüklenemedi. Sayfayı yenileyip tekrar deneyin.' }}
        />
      )}

      <StatusMessage status={status} />

      <button type="submit" disabled={saving} className="btn btn-primary w-full sm:w-auto sm:min-w-48">
        {saving ? 'Kaydediliyor…' : 'Değişiklikleri Kaydet'}
      </button>
    </form>
  )
}
