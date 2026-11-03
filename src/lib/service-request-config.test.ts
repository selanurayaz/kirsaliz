import { describe, expect, it } from 'vitest'
import {
  IMAGE_LIMITS,
  STATUS_LABELS,
  STATUS_ORDER,
  URGENCY_LABELS,
  URGENCY_ORDER,
} from '@/lib/service-request-config'

describe('durum ve aciliyet etiketleri', () => {
  it('durum etiketleri Türkçedir', () => {
    expect(STATUS_LABELS).toEqual({
      submitted: 'Alındı',
      under_review: 'İnceleniyor',
      assigned: 'Atandı',
      in_progress: 'İşlemde',
      resolved: 'Çözüldü',
      rejected: 'Reddedildi',
      cancelled: 'İptal Edildi',
    })
  })

  it('STATUS_ORDER her durumu bir kez içerir', () => {
    expect([...STATUS_ORDER].sort()).toEqual(Object.keys(STATUS_LABELS).sort())
  })

  it('aciliyet etiketleri ve sırası tutarlıdır', () => {
    expect(URGENCY_ORDER.map((u) => URGENCY_LABELS[u])).toEqual(['Düşük', 'Normal', 'Yüksek'])
  })
})

describe('IMAGE_LIMITS', () => {
  it('en fazla 3 fotoğraf ve 5 MB sınırı vardır', () => {
    expect(IMAGE_LIMITS.maxCount).toBe(3)
    expect(IMAGE_LIMITS.maxBytes).toBe(5 * 1024 * 1024)
    expect([...IMAGE_LIMITS.mimeTypes]).toEqual(['image/jpeg', 'image/png', 'image/webp'])
  })
})
