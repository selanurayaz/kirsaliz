const dateFormatter = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium' })
const dateTimeFormatter = new Intl.DateTimeFormat('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })

export function formatDate(value: string): string {
  return dateFormatter.format(new Date(value))
}

export function formatDateTime(value: string): string {
  return dateTimeFormatter.format(new Date(value))
}

/** "Köy, İlçe" biçiminde konum metni; ilişkili veri okunamazsa tire döner. */
export function formatLocation(village: { name: string; district: { name: string } | null } | null): string {
  if (!village) return '—'
  return village.district ? `${village.name}, ${village.district.name}` : village.name
}
