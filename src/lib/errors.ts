/** Kullanıcıya olduğu gibi gösterilebilecek (Türkçe) hata. Teknik ayrıntı içermez. */
export class UserFacingError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'UserFacingError'
  }
}

export const SESSION_EXPIRED_MESSAGE = 'Oturumunuzun süresi doldu. Lütfen tekrar giriş yapın.'
export const NETWORK_ERROR_MESSAGE =
  'Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.'

/** Geliştirme sırasında teknik ayrıntıyı konsola yazar; arayüze asla sızdırmaz. */
export function logError(context: string, error: unknown): void {
  if (import.meta.env.DEV) console.error(`[KırsalİZ] ${context}`, error)
}

function readField(error: unknown, field: string): string {
  if (typeof error === 'object' && error !== null && field in error) {
    const value = (error as Record<string, unknown>)[field]
    return typeof value === 'string' ? value : ''
  }
  return ''
}

/** Herhangi bir hatayı güvenli, Türkçe bir kullanıcı mesajına çevirir. */
export function toUserMessage(error: unknown, fallback: string): string {
  if (error instanceof UserFacingError) return error.message

  const code = readField(error, 'code')
  const message = readField(error, 'message').toLowerCase()
  const status = typeof error === 'object' && error !== null ? (error as { status?: unknown }).status : undefined

  if (code === 'PGRST301' || code === 'PGRST303' || status === 401 || message.includes('jwt')) {
    return SESSION_EXPIRED_MESSAGE
  }
  if (message.includes('failed to fetch') || message.includes('networkerror') || message.includes('network request failed')) {
    return NETWORK_ERROR_MESSAGE
  }
  return fallback
}
