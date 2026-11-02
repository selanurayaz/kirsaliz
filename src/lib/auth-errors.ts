import type { AuthError } from '@supabase/supabase-js'

/** Supabase Auth hatalarını kullanıcıya gösterilecek Türkçe mesajlara çevirir. */
export function translateAuthError(error: AuthError | Error): string {
  const code = 'code' in error ? (error as AuthError).code : undefined
  const message = error.message.toLowerCase()

  switch (code) {
    case 'invalid_credentials':
      return 'E-posta adresi veya şifre hatalı.'
    case 'email_not_confirmed':
      return 'E-posta adresiniz henüz doğrulanmamış. Lütfen gelen kutunuzdaki doğrulama bağlantısına tıklayın.'
    case 'user_already_exists':
    case 'email_exists':
      return 'Bu e-posta adresiyle kayıtlı bir hesap zaten var.'
    case 'weak_password':
      return 'Şifre yeterince güçlü değil. Daha uzun ve karmaşık bir şifre deneyin.'
    case 'email_address_invalid':
      return 'Geçerli bir e-posta adresi girin.'
    case 'signup_disabled':
      return 'Yeni kayıtlar şu anda kapalı.'
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
      return 'Çok fazla deneme yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.'
  }

  if (message.includes('invalid login credentials')) return 'E-posta adresi veya şifre hatalı.'
  if (message.includes('email not confirmed'))
    return 'E-posta adresiniz henüz doğrulanmamış. Lütfen gelen kutunuzdaki doğrulama bağlantısına tıklayın.'
  if (message.includes('already registered')) return 'Bu e-posta adresiyle kayıtlı bir hesap zaten var.'
  if (message.includes('password')) return 'Şifre gereksinimleri karşılanmıyor. En az 8 karakterli bir şifre girin.'
  if (message.includes('failed to fetch') || message.includes('network'))
    return 'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.'

  return 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.'
}
