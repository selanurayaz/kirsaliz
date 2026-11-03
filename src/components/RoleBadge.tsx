import { ROLE_LABELS } from '@/lib/constants'
import type { UserRole } from '@/types/database'

const STYLES: Record<UserRole, string> = {
  citizen: 'bg-slate-100 text-slate-700 ring-slate-200',
  field_personnel: 'bg-amber-50 text-amber-800 ring-amber-200',
  department_officer: 'bg-navy-50 text-navy-700 ring-navy-200',
  admin: 'bg-brand-50 text-brand-800 ring-brand-200',
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
