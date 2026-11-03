import { ROLE_LABELS } from '@/lib/constants'
import type { UserRole } from '@/types/database'

const STYLES: Record<UserRole, string> = {
  citizen: 'bg-page text-slate-700 ring-line-strong',
  field_personnel: 'bg-navy-100 text-navy ring-navy-300',
  department_officer: 'bg-navy-50 text-navy-700 ring-navy-200',
  admin: 'bg-primary text-white ring-primary-hover',
}

export function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset ${STYLES[role]}`}
    >
      {ROLE_LABELS[role]}
    </span>
  )
}
