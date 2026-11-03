export interface NavItem {
  label: string
  to: string
}

/** Talep oluşturulduktan sonra detay sayfasına router state ile taşınan bilgi. */
export interface RequestCreatedState {
  created: { trackingCode: string; failedUploads: number }
}

export function isRequestCreatedState(value: unknown): value is RequestCreatedState {
  if (typeof value !== 'object' || value === null || !('created' in value)) return false
  const created = (value as { created: unknown }).created
  return (
    typeof created === 'object' &&
    created !== null &&
    typeof (created as { trackingCode?: unknown }).trackingCode === 'string' &&
    typeof (created as { failedUploads?: unknown }).failedUploads === 'number'
  )
}
