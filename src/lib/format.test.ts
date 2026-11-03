import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, formatLocation } from '@/lib/format'

describe('formatDate / formatDateTime', () => {
  it('tarihi Türkçe biçimde gösterir', () => {
    expect(formatDate('2025-03-15T12:00:00Z')).toMatch(/15\s+Mar\s+2025/)
  })

  it('tarih ve saati birlikte gösterir', () => {
    const value = formatDateTime('2025-03-15T12:00:00Z')
    expect(value).toMatch(/2025/)
    expect(value).toMatch(/\d{2}:\d{2}/)
  })
})

describe('formatLocation', () => {
  it('köy ve ilçeyi birleştirir', () => {
    expect(formatLocation({ name: 'Çamlık', district: { name: 'Merkez' } })).toBe('Çamlık, Merkez')
  })

  it('ilçe yoksa yalnızca köy adını döner', () => {
    expect(formatLocation({ name: 'Çamlık', district: null })).toBe('Çamlık')
  })

  it('köy okunamazsa tire döner', () => {
    expect(formatLocation(null)).toBe('—')
  })
})
