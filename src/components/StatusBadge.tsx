import { STATUS_LABELS, URGENCY_LABELS } from '@/lib/service-request-config'
import type { RequestUrgency, ServiceRequestStatus } from '@/types/database'

const STATUS_STYLES: Record<ServiceRequestStatus, string> = {
  submitted: 'bg-page text-slate-700 ring-line-strong',
  under_review: 'bg-navy-50 text-navy-700 ring-navy-200',
  assigned: 'bg-navy-100 text-navy ring-navy-300',
  in_progress: 'bg-primary-soft text-primary ring-primary-border',
  resolved: 'bg-primary text-white ring-primary-hover',
  rejected: 'bg-destructive-soft text-destructive-hover ring-destructive-border',
  cancelled: 'bg-destructive-soft text-destructive-hover ring-destructive-border',
}

const URGENCY_STYLES: Record<RequestUrgency, string> = {
  low: 'bg-page text-slate-700 ring-line-strong',
  normal: 'bg-navy-50 text-navy-700 ring-navy-200',
  high: 'bg-primary-soft text-primary-dark ring-primary',
}

const BASE = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap'

export function StatusBadge({ status }: { status: ServiceRequestStatus }) {
  return <span className={`${BASE} ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>
}

export function UrgencyBadge({ urgency }: { urgency: RequestUrgency }) {
  return <span className={`${BASE} ${URGENCY_STYLES[urgency]}`}>Aciliyet: {URGENCY_LABELS[urgency]}</span>
}
