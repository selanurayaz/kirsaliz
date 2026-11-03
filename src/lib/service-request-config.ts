import type { RequestUrgency, ServiceRequestStatus } from '@/types/database'

/** Alan sınırları — supabase/migrations/003_service_requests.sql ile aynı olmalıdır. */
export const REQUEST_LIMITS = {
  titleMin: 5,
  titleMax: 120,
  descriptionMin: 20,
  descriptionMax: 2000,
  addressMax: 300,
} as const

export const IMAGE_LIMITS = {
  maxCount: 3,
  maxBytes: 5 * 1024 * 1024,
  mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
} as const

export const IMAGE_BUCKET = 'service-request-images'

export const STATUS_LABELS: Record<ServiceRequestStatus, string> = {
  submitted: 'Alındı',
  under_review: 'İnceleniyor',
  assigned: 'Atandı',
  in_progress: 'İşlemde',
  resolved: 'Çözüldü',
  rejected: 'Reddedildi',
  cancelled: 'İptal Edildi',
}

export const STATUS_ORDER: ServiceRequestStatus[] = [
  'submitted',
  'under_review',
  'assigned',
  'in_progress',
  'resolved',
  'rejected',
  'cancelled',
]

export const URGENCY_LABELS: Record<RequestUrgency, string> = {
  low: 'Düşük',
  normal: 'Normal',
  high: 'Yüksek',
}

export const URGENCY_ORDER: RequestUrgency[] = ['low', 'normal', 'high']
