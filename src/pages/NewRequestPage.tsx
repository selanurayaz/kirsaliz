import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '@/hooks/useAuth'
import { FormField } from '@/components/FormField'
import { SelectField } from '@/components/SelectField'
import { TextAreaField } from '@/components/TextAreaField'
import { ImageUploader } from '@/components/ImageUploader'
import { StatusMessage, type StatusState } from '@/components/StatusMessage'
import { FullPageSpinner } from '@/components/FullPageSpinner'
import { fetchActiveDistricts, fetchActiveRequestCategories, fetchVillagesByDistrict } from '@/lib/reference-data'
import { createServiceRequest, uploadRequestImages } from '@/lib/service-requests'
import { REQUEST_LIMITS, URGENCY_LABELS, URGENCY_ORDER } from '@/lib/service-request-config'
import { logError, toUserMessage } from '@/lib/errors'
import { ROUTES, requestDetailPath } from '@/lib/constants'
import type { District, RequestCategory, RequestUrgency, Village } from '@/types/database'
import type { RequestCreatedState } from '@/types/navigation'

type FieldName = 'district' | 'village' | 'category' | 'title' | 'description' | 'address'
type FieldErrors = Partial<Record<FieldName, string>>

interface Coordinates {
  latitude: number
  longitude: number
}

const REFERENCE_ERROR = 'Form verileri yüklenemedi. Lütfen sayfayı yenileyip tekrar deneyin.'
const VILLAGE_ERROR = 'Köy listesi yüklenemedi. Lütfen ilçeyi yeniden seçin.'

const URGENCY_HINTS: Record<RequestUrgency, string> = {
  low: 'Acil değil, zamanla çözülebilir.',
  normal: 'Olağan bir sorun.',
  high: 'Kısa sürede müdahale gerekiyor.',
}

function geolocationMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Konum izni verilmedi. İsterseniz adres alanına konumu yazarak devam edebilirsiniz.'
    case error.POSITION_UNAVAILABLE:
      return 'Konumunuz belirlenemedi. Adres alanına konumu yazarak devam edebilirsiniz.'
    case error.TIMEOUT:
      return 'Konum alınırken zaman aşımı oluştu. Lütfen tekrar deneyin.'
    default:
      return 'Konum alınamadı. Lütfen tekrar deneyin.'
  }
}

export function NewRequestPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const submittingRef = useRef(false)

  const [districts, setDistricts] = useState<District[]>([])
  const [categories, setCategories] = useState<RequestCategory[]>([])
  const [villages, setVillages] = useState<Village[]>([])
  const [referenceLoading, setReferenceLoading] = useState(true)
  const [referenceError, setReferenceError] = useState<string | null>(null)
  const [villagesLoading, setVillagesLoading] = useState(false)

  const [districtId, setDistrictId] = useState('')
  const [villageId, setVillageId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [urgency, setUrgency] = useState<RequestUrgency>('normal')
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
  const [locating, setLocating] = useState(false)
  const [locationMessage, setLocationMessage] = useState<string | null>(null)
  const [files, setFiles] = useState<File[]>([])

  const [errors, setErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<StatusState>(null)
  const [submitting, setSubmitting] = useState(false)

  // Aktif ilçe ve kategorileri yükle
  useEffect(() => {
    let active = true
    Promise.all([fetchActiveDistricts(), fetchActiveRequestCategories()])
      .then(([d, c]) => {
        if (!active) return
        setDistricts(d)
        setCategories(c)
      })
      .catch((err: unknown) => {
        logError('Referans verileri yüklenemedi', err)
        if (active) setReferenceError(toUserMessage(err, REFERENCE_ERROR))
      })
      .finally(() => {
        if (active) setReferenceLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  // Seçilen ilçeye göre köyleri yükle
  useEffect(() => {
    if (!districtId) return
    let active = true
    setVillagesLoading(true)
    fetchVillagesByDistrict(districtId)
      .then((data) => {
        if (active) setVillages(data)
      })
      .catch((err: unknown) => {
        logError('Köyler yüklenemedi', err)
        if (!active) return
        setVillages([])
        setStatus({ type: 'error', message: toUserMessage(err, VILLAGE_ERROR) })
      })
      .finally(() => {
        if (active) setVillagesLoading(false)
      })
    return () => {
      active = false
    }
  }, [districtId])

  function handleDistrictChange(value: string) {
    setDistrictId(value)
    setVillageId('')
    setVillages([])
    setErrors((prev) => ({ ...prev, district: undefined, village: undefined }))
  }

  function clearError(field: FieldName) {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  function requestLocation() {
    if (!('geolocation' in navigator)) {
      setLocationMessage('Tarayıcınız konum özelliğini desteklemiyor. Adres alanına konumu yazabilirsiniz.')
      return
    }
    setLocating(true)
    setLocationMessage(null)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({ latitude: position.coords.latitude, longitude: position.coords.longitude })
        setLocating(false)
      },
      (error) => {
        setCoordinates(null)
        setLocationMessage(geolocationMessage(error))
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    )
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    const trimmedTitle = title.trim()
    const trimmedDescription = description.trim()

    if (!districtId) next.district = 'Lütfen ilçe seçin.'
    if (!villageId) next.village = 'Lütfen köy seçin.'
    if (!categoryId) next.category = 'Lütfen bir talep kategorisi seçin.'

    if (trimmedTitle.length < REQUEST_LIMITS.titleMin) {
      next.title = `Başlık en az ${REQUEST_LIMITS.titleMin} karakter olmalıdır.`
    } else if (trimmedTitle.length > REQUEST_LIMITS.titleMax) {
      next.title = `Başlık en fazla ${REQUEST_LIMITS.titleMax} karakter olabilir.`
    }

    if (trimmedDescription.length < REQUEST_LIMITS.descriptionMin) {
      next.description = `Açıklama en az ${REQUEST_LIMITS.descriptionMin} karakter olmalıdır.`
    } else if (trimmedDescription.length > REQUEST_LIMITS.descriptionMax) {
      next.description = `Açıklama en fazla ${REQUEST_LIMITS.descriptionMax} karakter olabilir.`
    }

    if (address.trim().length > REQUEST_LIMITS.addressMax) {
      next.address = `Adres en fazla ${REQUEST_LIMITS.addressMax} karakter olabilir.`
    }
    return next
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current || !user) return

    const validation = validate()
    setErrors(validation)
    const firstInvalid = (['district', 'village', 'category', 'title', 'description', 'address'] as const).find(
      (field) => validation[field],
    )
    if (firstInvalid) {
      setStatus({ type: 'error', message: 'Lütfen işaretli alanları düzeltip tekrar deneyin.' })
      document.getElementById(firstInvalid)?.focus()
      return
    }

    submittingRef.current = true
    setSubmitting(true)
    setStatus(null)

    try {
      const request = await createServiceRequest({
        village_id: villageId,
        category_id: categoryId,
        title: title.trim(),
        description: description.trim(),
        address: address.trim() || null,
        latitude: coordinates?.latitude ?? null,
        longitude: coordinates?.longitude ?? null,
        urgency,
      })

      let failedUploads = 0
      if (files.length > 0) {
        try {
          const result = await uploadRequestImages(request.id, user.id, files)
          failedUploads = result.failures.length
        } catch (err) {
          // Talep zaten oluşturuldu; yüklenemeyen fotoğraflar kullanıcıya bildirilir.
          logError('Fotoğraf yükleme beklenmeyen şekilde başarısız oldu', err)
          failedUploads = files.length
        }
      }

      const state: RequestCreatedState = { created: { trackingCode: request.tracking_code, failedUploads } }
      navigate(requestDetailPath(request.id), { replace: true, state })
    } catch (err) {
      setStatus({ type: 'error', message: toUserMessage(err, 'Talebiniz oluşturulamadı. Lütfen tekrar deneyin.') })
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  if (referenceLoading) return <FullPageSpinner label="Form hazırlanıyor…" />

  const selectedCategory = categories.find((c) => c.id === categoryId)

  return (
    <section className="bg-slate-100 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link
          to={ROUTES.myRequests}
          className="text-sm font-medium text-slate-600 hover:text-navy-800 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none"
        >
          ← Taleplerim
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-navy-800">Yeni Talep Oluştur</h1>
        <p className="mt-1 text-sm text-slate-500">
          Köyünüzdeki sorunu bildirin; talebiniz ilgili birime iletilir ve takip kodunuzla izleyebilirsiniz.
        </p>

        {referenceError ? (
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <StatusMessage status={{ type: 'error', message: referenceError }} />
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-4 rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700"
            >
              Sayfayı Yenile
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            noValidate
            aria-busy={submitting}
            className="mt-6 space-y-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
          >
            {/* Konum */}
            <fieldset className="space-y-4" disabled={submitting}>
              <legend className="text-base font-semibold text-navy-800">1. Konum</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField
                  id="district"
                  label="İlçe *"
                  value={districtId}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  error={errors.district}
                  required
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
                  label="Köy *"
                  value={villageId}
                  onChange={(e) => {
                    setVillageId(e.target.value)
                    clearError('village')
                  }}
                  disabled={!districtId || villagesLoading}
                  error={errors.village}
                  hint={
                    !districtId
                      ? 'Önce ilçe seçin.'
                      : villagesLoading
                        ? 'Köyler yükleniyor…'
                        : villages.length === 0
                          ? 'Bu ilçede seçilebilir köy bulunamadı.'
                          : undefined
                  }
                  required
                >
                  <option value="">Köy seçin</option>
                  {villages.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </SelectField>
              </div>
            </fieldset>

            {/* Kategori */}
            <fieldset
              id="category"
              tabIndex={-1}
              className="space-y-3 focus:outline-none"
              disabled={submitting}
              aria-describedby={errors.category ? 'category-error' : undefined}
            >
              <legend className="text-base font-semibold text-navy-800">2. Talep kategorisi *</legend>
              {categories.length === 0 ? (
                <p className="text-sm text-slate-500">Şu anda seçilebilir kategori bulunmuyor.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {categories.map((category) => {
                    const inputId = `category-${category.id}`
                    return (
                      <div key={category.id}>
                        <input
                          id={inputId}
                          type="radio"
                          name="category"
                          value={category.id}
                          checked={categoryId === category.id}
                          onChange={() => {
                            setCategoryId(category.id)
                            clearError('category')
                          }}
                          className="peer sr-only"
                        />
                        <label
                          htmlFor={inputId}
                          className="block h-full cursor-pointer rounded-lg border border-slate-300 bg-white p-3 transition-colors hover:border-brand-400 peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-checked:ring-2 peer-checked:ring-brand-600/30 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500"
                        >
                          <span className="block text-sm font-semibold text-navy-800">{category.name}</span>
                          {category.description && (
                            <span className="mt-0.5 block text-xs text-slate-500">{category.description}</span>
                          )}
                        </label>
                      </div>
                    )
                  })}
                </div>
              )}
              {selectedCategory && (
                <p className="text-xs text-slate-500">Seçilen kategoriye göre talebiniz ilgili birime yönlendirilir.</p>
              )}
              {errors.category && (
                <p id="category-error" className="text-xs text-red-600">
                  {errors.category}
                </p>
              )}
            </fieldset>

            {/* Ayrıntılar */}
            <fieldset className="space-y-4" disabled={submitting}>
              <legend className="text-base font-semibold text-navy-800">3. Talep ayrıntıları</legend>
              <div className="space-y-1.5">
                <FormField
                  id="title"
                  label="Başlık *"
                  value={title}
                  maxLength={REQUEST_LIMITS.titleMax}
                  onChange={(e) => {
                    setTitle(e.target.value)
                    clearError('title')
                  }}
                  aria-invalid={errors.title ? true : undefined}
                  aria-describedby={errors.title ? 'title-error' : undefined}
                  placeholder="Örn. Köy girişindeki yolda büyük çukur"
                  required
                />
                {errors.title && (
                  <p id="title-error" className="text-xs text-red-600">
                    {errors.title}
                  </p>
                )}
              </div>
              <TextAreaField
                id="description"
                label="Ayrıntılı açıklama *"
                rows={5}
                value={description}
                maxLength={REQUEST_LIMITS.descriptionMax}
                onChange={(e) => {
                  setDescription(e.target.value)
                  clearError('description')
                }}
                error={errors.description}
                hint={`Sorunu ve konumunu ayrıntılı anlatın (${REQUEST_LIMITS.descriptionMin}-${REQUEST_LIMITS.descriptionMax} karakter). ${description.trim().length}/${REQUEST_LIMITS.descriptionMax}`}
                required
              />
              <TextAreaField
                id="address"
                label="Adres veya konum tarifi"
                rows={2}
                value={address}
                maxLength={REQUEST_LIMITS.addressMax}
                onChange={(e) => {
                  setAddress(e.target.value)
                  clearError('address')
                }}
                error={errors.address}
                hint="Örn. Cami karşısı, okul yolu üzerinde (isteğe bağlı)."
              />

              <div role="radiogroup" aria-labelledby="urgency-label" className="space-y-2">
                <span id="urgency-label" className="block text-sm font-medium text-navy-800">
                  Aciliyet düzeyi
                </span>
                <p className="text-xs text-slate-500">
                  Bu, sizin kendi değerlendirmenizdir; ilgili birim talebi kendi önceliklendirmesine göre ele alır.
                </p>
                <div className="grid gap-2 sm:grid-cols-3">
                  {URGENCY_ORDER.map((value) => (
                    <div key={value}>
                      <input
                        id={`urgency-${value}`}
                        type="radio"
                        name="urgency"
                        value={value}
                        checked={urgency === value}
                        onChange={() => setUrgency(value)}
                        className="peer sr-only"
                      />
                      <label
                        htmlFor={`urgency-${value}`}
                        className="block cursor-pointer rounded-lg border border-slate-300 bg-white p-3 text-sm transition-colors hover:border-brand-400 peer-checked:border-brand-600 peer-checked:bg-brand-50 peer-checked:ring-2 peer-checked:ring-brand-600/30 peer-focus-visible:ring-2 peer-focus-visible:ring-brand-500"
                      >
                        <span className="block font-semibold text-navy-800">{URGENCY_LABELS[value]}</span>
                        <span className="block text-xs text-slate-500">{URGENCY_HINTS[value]}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </fieldset>

            {/* Konum bilgisi */}
            <fieldset className="space-y-3" disabled={submitting}>
              <legend className="text-base font-semibold text-navy-800">4. Cihaz konumu (isteğe bağlı)</legend>
              <p className="text-xs text-slate-500">
                Konumunuz yalnızca aşağıdaki düğmeye bastığınızda ve tarayıcı izin verirse alınır.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={requestLocation}
                  disabled={locating}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-navy-800 shadow-sm hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {locating ? 'Konum alınıyor…' : coordinates ? 'Konumu Yenile' : 'Konumumu Ekle'}
                </button>
                {coordinates && (
                  <button
                    type="button"
                    onClick={() => setCoordinates(null)}
                    className="rounded-md px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:outline-none"
                  >
                    Konumu Temizle
                  </button>
                )}
              </div>
              {coordinates && (
                <p role="status" className="rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-800">
                  Enlem: {coordinates.latitude.toFixed(6)} · Boylam: {coordinates.longitude.toFixed(6)}
                </p>
              )}
              {locationMessage && (
                <p role="alert" className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  {locationMessage}
                </p>
              )}
            </fieldset>

            {/* Fotoğraflar */}
            <ImageUploader files={files} onChange={setFiles} disabled={submitting} />

            <div className="space-y-3 border-t border-slate-100 pt-6">
              <StatusMessage status={status} />
              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Link
                  to={ROUTES.myRequests}
                  className="rounded-md border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-navy-800 hover:bg-slate-50"
                >
                  Vazgeç
                </Link>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (files.length > 0 ? 'Talep ve fotoğraflar gönderiliyor…' : 'Talep gönderiliyor…') : 'Talebi Gönder'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
