import { describe, expect, it } from 'vitest'
import type { AuthError } from '@supabase/supabase-js'
import { translateAuthError } from '@/lib/auth-errors'

function authError(code: string | undefined, message: string): AuthError {
  return Object.assign(new Error(message), { code }) as unknown as AuthError
}

describe('translateAuthError', () => {
  it('hatalı giriş bilgisini çevirir', () => {
    expect(translateAuthError(authError('invalid_credentials', 'Invalid login credentials'))).toBe(
      'E-posta adresi veya şifre hatalı.',
    )
  })

  it('kod yoksa mesaj metninden çevirir', () => {
    expect(translateAuthError(authError(undefined, 'User already registered'))).toContain('zaten var')
  })

  it('ağ hatasını çevirir', () => {
    expect(translateAuthError(new Error('Failed to fetch'))).toContain('Sunucuya bağlanılamadı')
  })

  it('bilinmeyen hatada ham mesajı göstermez', () => {
    const message = translateAuthError(authError('weird', 'internal stack secret'))
    expect(message).toBe('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.')
  })
})
