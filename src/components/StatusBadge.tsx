import { STATUS_LABELS, URGENCY_LABELS } from '@/lib/service-request-config'
import type { RequestUrgency, ServiceRequestStatus } from '@/types/database'

const STATUS_STYLES: Record<ServiceRequestStatus, string> = {
  submitted: 'badge-neutral',
  under_review: 'badge-info',
  assigned: 'badge-info',
  in_progress: 'badge-brand',
  resolved: 'badge-success',
  rejected: 'badge-danger',
  cancelled: 'badge-danger',
}

const URGENCY_STYLES: Record<RequestUrgency, string> = {
  low: 'badge-neutral',
  normal: 'badge-info',
  high: 'badge-danger',
}

export function StatusBadge({ status }: { status: ServiceRequestStatus }) {
  return <span className={`badge ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>
}

export function UrgencyBadge({ urgency }: { urgency: RequestUrgency }) {
  return <span className={`badge ${URGENCY_STYLES[urgency]}`}>Aciliyet: {URGENCY_LABELS[urgency]}</span>
}
