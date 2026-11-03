import { supabase } from '@/lib/supabase'
import { UserFacingError, logError, toUserMessage, toWorkflowError } from '@/lib/errors'
import { IMAGE_BUCKET, IMAGE_LIMITS } from '@/lib/service-request-config'
import type {
  ServiceRequest,
  ServiceRequestAttachment,
  ServiceRequestHistory,
  ServiceRequestInsert,
  ServiceRequestWithRelations,
} from '@/types/database'

/**
 * Hizmet talebi erişim katmanı.
 * Fırlatılan hatalar kullanıcıya gösterilebilir (UserFacingError); ham veritabanı
 * mesajları arayüze sızdırılmaz, yalnızca geliştirme konsoluna yazılır.
 */

export const REQUEST_SELECT =
  '*, category:request_categories(id,name,slug,icon,color), department:departments(id,name), village:villages(id,name,district:districts(id,name))'

const SIGNED_URL_TTL_SECONDS = 60 * 60

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const CREATE_REQUEST_ERROR = 'Talebiniz oluşturulamadı. Lütfen bilgilerinizi kontrol edip tekrar deneyin.'
export const LOAD_REQUESTS_ERROR = 'Talepleriniz yüklenemedi. Lütfen daha sonra tekrar deneyin.'
export const LOAD_REQUEST_DETAIL_ERROR = 'Talep bilgileri yüklenemedi. Lütfen daha sonra tekrar deneyin.'
export const IMAGE_UPLOAD_ERROR = 'Fotoğraf yüklenemedi. Lütfen tekrar deneyin.'

// ---------------------------------------------------------------------------
// Fotoğraf doğrulama (tarayıcı tarafı)
// ---------------------------------------------------------------------------

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export interface ImageValidationResult {
  accepted: File[]
  errors: string[]
}

/** Yeni seçilen dosyaları tür, boyut ve adet sınırına göre doğrular. */
export function validateImageFiles(current: File[], incoming: File[]): ImageValidationResult {
  const accepted: File[] = []
  const errors: string[] = []

  for (const file of incoming) {
    if (!(IMAGE_LIMITS.mimeTypes as readonly string[]).includes(file.type)) {
      errors.push(`"${file.name}" desteklenmeyen bir dosya türü. Yalnızca JPEG, PNG veya WebP yükleyebilirsiniz.`)
      continue
    }
    if (file.size === 0) {
      errors.push(`"${file.name}" boş bir dosya.`)
      continue
    }
    if (file.size > IMAGE_LIMITS.maxBytes) {
      errors.push(`"${file.name}" çok büyük (${formatFileSize(file.size)}). Her fotoğraf en fazla 5 MB olabilir.`)
      continue
    }
    const duplicate = [...current, ...accepted].some(
      (f) => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified,
    )
    if (duplicate) continue
    if (current.length + accepted.length >= IMAGE_LIMITS.maxCount) {
      errors.push(`En fazla ${IMAGE_LIMITS.maxCount} fotoğraf ekleyebilirsiniz.`)
      break
    }
    accepted.push(file)
  }

  return { accepted, errors }
}

// ---------------------------------------------------------------------------
// Talep oluşturma
// ---------------------------------------------------------------------------

export async function createServiceRequest(input: ServiceRequestInsert): Promise<ServiceRequest> {
  const { data, error } = await supabase.from('service_requests').insert(input).select().single()

  if (error) {
    logError('Talep oluşturulamadı', error)
    if (error.code === '23514') {
      throw new UserFacingError(
        'Seçtiğiniz köy veya kategori şu anda kullanılamıyor ya da girdiğiniz bilgiler geçerli değil. Lütfen formu kontrol edin.',
      )
    }
    throw new UserFacingError(toUserMessage(error, CREATE_REQUEST_ERROR))
  }
  return data
}

export async function deleteUploadedImage(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(IMAGE_BUCKET).remove([storagePath])
  if (error) logError('Yüklenen fotoğraf temizlenemedi', error)
}

export interface ImageUploadFailure {
  fileName: string
  message: string
}

export interface ImageUploadResult {
  attachments: ServiceRequestAttachment[]
  failures: ImageUploadFailure[]
}

/**
 * Fotoğrafları sırayla yükler ve ek kayıtlarını oluşturur. Bir dosya başarısız olursa
 * diğerlerine devam edilir; ek kaydı yazılamazsa yüklenen dosya temizlenir.
 */
export async function uploadRequestImages(
  requestId: string,
  userId: string,
  files: File[],
): Promise<ImageUploadResult> {
  const attachments: ServiceRequestAttachment[] = []
  const failures: ImageUploadFailure[] = []

  for (const file of files.slice(0, IMAGE_LIMITS.maxCount)) {
    const extension = MIME_EXTENSIONS[file.type]
    if (!extension || file.size > IMAGE_LIMITS.maxBytes) {
      failures.push({ fileName: file.name, message: 'Geçersiz dosya türü veya boyutu.' })
      continue
    }

    // {user_id}/{request_id}/{benzersiz_ad} — Storage politikalarıyla uyumlu yapı
    const storagePath = `${userId}/${requestId}/${crypto.randomUUID()}.${extension}`

    const { error: uploadError } = await supabase.storage
      .from(IMAGE_BUCKET)
      .upload(storagePath, file, { contentType: file.type, upsert: false })

    if (uploadError) {
      logError('Fotoğraf yüklenemedi', uploadError)
      failures.push({ fileName: file.name, message: toUserMessage(uploadError, IMAGE_UPLOAD_ERROR) })
      continue
    }

    const { data, error: insertError } = await supabase
      .from('service_request_attachments')
      .insert({
        request_id: requestId,
        storage_path: storagePath,
        original_name: file.name.slice(0, 255),
        mime_type: file.type,
        file_size: file.size,
      })
      .select()
      .single()

    if (insertError) {
      logError('Ek kaydı oluşturulamadı', insertError)
      await deleteUploadedImage(storagePath)
      failures.push({ fileName: file.name, message: toUserMessage(insertError, IMAGE_UPLOAD_ERROR) })
      continue
    }

    attachments.push(data)
  }

  return { attachments, failures }
}

// ---------------------------------------------------------------------------
// Okuma
// ---------------------------------------------------------------------------

export async function getMyServiceRequests(userId: string): Promise<ServiceRequestWithRelations[]> {
  const { data, error } = await supabase
    .from('service_requests')
    .select(REQUEST_SELECT)
    .eq('citizen_id', userId)
    .order('created_at', { ascending: false })
    .limit(500)
    .overrideTypes<ServiceRequestWithRelations[], { merge: false }>()

  if (error) {
    logError('Talepler yüklenemedi', error)
    throw new UserFacingError(toUserMessage(error, LOAD_REQUESTS_ERROR))
  }
  return data
}

/** Talep yoksa veya bu kullanıcıya ait değilse null döner (varlığı sızdırılmaz). */
export async function getMyServiceRequestById(
  id: string,
  userId: string,
): Promise<ServiceRequestWithRelations | null> {
  if (!UUID_PATTERN.test(id)) return null

  const { data, error } = await supabase
    .from('service_requests')
    .select(REQUEST_SELECT)
    .eq('id', id)
    .eq('citizen_id', userId)
    .maybeSingle()
    .overrideTypes<ServiceRequestWithRelations, { merge: false }>()

  if (error) {
    logError('Talep detayı yüklenemedi', error)
    throw new UserFacingError(toUserMessage(error, LOAD_REQUEST_DETAIL_ERROR))
  }
  return data
}

export async function getRequestHistory(requestId: string): Promise<ServiceRequestHistory[]> {
  const { data, error } = await supabase
    .from('service_request_history')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: true })

  if (error) {
    logError('Talep geçmişi yüklenemedi', error)
    throw new UserFacingError(toUserMessage(error, LOAD_REQUEST_DETAIL_ERROR))
  }
  return data
}

export async function getRequestAttachments(requestId: string): Promise<ServiceRequestAttachment[]> {
  const { data, error } = await supabase
    .from('service_request_attachments')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: true })

  if (error) {
    logError('Talep ekleri yüklenemedi', error)
    throw new UserFacingError(toUserMessage(error, LOAD_REQUEST_DETAIL_ERROR))
  }
  return data
}

/** Vatandaşın kendi talebini iptal etmesi (yalnızca güvenli RPC üzerinden). */
export async function cancelMyRequest(requestId: string, note?: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_my_service_request', {
    p_request_id: requestId,
    p_note: note?.trim() || null,
  })
  if (error) throw toWorkflowError(error, 'Talep iptal edilemedi. Lütfen tekrar deneyin.')
}

/** Özel bucket için süreli (imzalı) adresler üretir. Anahtar: storage_path. */
export async function createSignedImageUrls(storagePaths: string[]): Promise<Map<string, string>> {
  const urls = new Map<string, string>()
  if (storagePaths.length === 0) return urls

  const { data, error } = await supabase.storage
    .from(IMAGE_BUCKET)
    .createSignedUrls(storagePaths, SIGNED_URL_TTL_SECONDS)

  if (error) {
    logError('İmzalı adresler üretilemedi', error)
    throw new UserFacingError('Fotoğraflar yüklenemedi.')
  }
  for (const item of data) {
    if (item.path && item.signedUrl && !item.error) urls.set(item.path, item.signedUrl)
  }
  return urls
}
