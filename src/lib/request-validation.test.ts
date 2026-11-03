import { describe, expect, it } from 'vitest'
import { validateRequestText } from '@/lib/request-validation'
import { REQUEST_LIMITS } from '@/lib/service-request-config'

const ok = {
  title: 'a'.repeat(REQUEST_LIMITS.titleMin),
  description: 'b'.repeat(REQUEST_LIMITS.descriptionMin),
  address: '',
}

describe('validateRequestText', () => {
  it('sınır değerlerinde hata vermez', () => {
    expect(validateRequestText(ok)).toEqual({})
    expect(
      validateRequestText({
        title: 'a'.repeat(REQUEST_LIMITS.titleMax),
        description: 'b'.repeat(REQUEST_LIMITS.descriptionMax),
        address: 'c'.repeat(REQUEST_LIMITS.addressMax),
      }),
    ).toEqual({})
  })

  it('başlık alt sınırın altında hata verir', () => {
    const errors = validateRequestText({ ...ok, title: 'a'.repeat(REQUEST_LIMITS.titleMin - 1) })
    expect(errors.title).toContain(`en az ${REQUEST_LIMITS.titleMin}`)
  })

  it('başlık üst sınırı aşınca hata verir', () => {
    const errors = validateRequestText({ ...ok, title: 'a'.repeat(REQUEST_LIMITS.titleMax + 1) })
    expect(errors.title).toContain(`en fazla ${REQUEST_LIMITS.titleMax}`)
  })

  it('açıklama alt ve üst sınırlarını denetler', () => {
    const low = validateRequestText({ ...ok, description: 'b'.repeat(REQUEST_LIMITS.descriptionMin - 1) })
    const high = validateRequestText({ ...ok, description: 'b'.repeat(REQUEST_LIMITS.descriptionMax + 1) })
    expect(low.description).toBeDefined()
    expect(high.description).toBeDefined()
  })

  it('adres üst sınırı aşınca hata verir', () => {
    expect(validateRequestText({ ...ok, address: 'c'.repeat(REQUEST_LIMITS.addressMax + 1) }).address).toBeDefined()
  })

  it('baştaki ve sondaki boşlukları yok sayar', () => {
    const errors = validateRequestText({ ...ok, title: `   ${'a'.repeat(REQUEST_LIMITS.titleMin - 1)}   ` })
    expect(errors.title).toBeDefined()
  })

  it('boş değerler hata verir', () => {
    const errors = validateRequestText({ title: '', description: '', address: '' })
    expect(errors.title).toBeDefined()
    expect(errors.description).toBeDefined()
    expect(errors.address).toBeUndefined()
  })
})
