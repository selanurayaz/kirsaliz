import { describe, expect, it } from 'vitest'
import { isRequestCreatedState } from '@/types/navigation'

describe('isRequestCreatedState', () => {
  it('geçerli durumu kabul eder', () => {
    expect(isRequestCreatedState({ created: { trackingCode: 'KZ-1', failedUploads: 0 } })).toBe(true)
  })

  it.each([
    null,
    undefined,
    'x',
    {},
    { created: null },
    { created: { trackingCode: 1, failedUploads: 0 } },
    { created: { trackingCode: 'a' } },
  ])('geçersiz değeri reddeder %#', (value) => {
    expect(isRequestCreatedState(value)).toBe(false)
  })
})
