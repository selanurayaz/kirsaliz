import { REQUEST_LIMITS } from '@/lib/service-request-config'

export interface RequestTextErrors {
  title?: string
  description?: string
  address?: string
}

/** Talep metin alanlarını (baştaki/sondaki boşluklar yok sayılarak) sınırlara göre doğrular. */
export function validateRequestText(input: { title: string; description: string; address: string }): RequestTextErrors {
  const errors: RequestTextErrors = {}
  const title = input.title.trim()
  const description = input.description.trim()

  if (title.length < REQUEST_LIMITS.titleMin) {
    errors.title = `Başlık en az ${REQUEST_LIMITS.titleMin} karakter olmalıdır.`
  } else if (title.length > REQUEST_LIMITS.titleMax) {
    errors.title = `Başlık en fazla ${REQUEST_LIMITS.titleMax} karakter olabilir.`
  }

  if (description.length < REQUEST_LIMITS.descriptionMin) {
    errors.description = `Açıklama en az ${REQUEST_LIMITS.descriptionMin} karakter olmalıdır.`
  } else if (description.length > REQUEST_LIMITS.descriptionMax) {
    errors.description = `Açıklama en fazla ${REQUEST_LIMITS.descriptionMax} karakter olabilir.`
  }

  if (input.address.trim().length > REQUEST_LIMITS.addressMax) {
    errors.address = `Adres en fazla ${REQUEST_LIMITS.addressMax} karakter olabilir.`
  }
  return errors
}
