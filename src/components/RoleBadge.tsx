import { ROLE_LABELS } from '@/lib/constants'
import type { UserRole } from '@/types/database'

const STYLES: Record<UserRole, string> = {
  citizen: 'badge-neutral',
  field_personnel: 'badge-info',
  department_officer: 'badge-info',
  admin: 'badge-solid',
}

export function RoleBadge({ role }: { role: UserRole }) {
  return <span className={`badge ${STYLES[role]}`}>{ROLE_LABELS[role]}</span>
}
