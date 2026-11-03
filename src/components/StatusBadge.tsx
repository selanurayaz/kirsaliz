import { STATUS_LABELS, URGENCY_LABELS } from '@/lib/service-request-config'
import type { RequestUrgency, ServiceRequestStatus } from '@/types/database'

const STATUS_STYLES: Record<ServiceRequestStatus, string> = {
  submitted: 'bg-slate-100 text-slate-700 ring-slate-200',
  under_review: 'bg-navy-50 text-navy-700 ring-navy-200',
  assigned: 'bg-navy-100 text-navy-800 ring-navy-200',
  in_progress: 'bg-amber-50 text-amber-800 ring-amber-200',
  resolved: 'bg-brand-50 text-brand-800 ring-brand-200',
  rejected: 'bg-red-50 text-red-700 ring-red-200',
  cancelled: 'bg-slate-100 text-slate-500 ring-slate-200',
}

const URGENCY_STYLES: Record<RequestUrgency, string> = {
  low: 'bg-slate-100 text-slate-600 ring-slate-200',
  normal: 'bg-navy-50 text-navy-700 ring-navy-200',
  high: 'bg-red-50 text-red-700 ring-red-200',
}

const BASE = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap'

export function StatusBadge({ status }: { status: ServiceRequestStatus }) {
  return <span className={`${BASE} ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>
}

export function UrgencyBadge({ urgency }: { urgency: RequestUrgency }) {
  return <span className={`${BASE} ${URGENCY_STYLES[urgency]}`}>Aciliyet: {URGENCY_LABELS[urgency]}</span>
}
