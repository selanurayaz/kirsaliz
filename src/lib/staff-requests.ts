import { supabase } from '@/lib/supabase'
import { UserFacingError, logError, toUserMessage, toWorkflowError } from '@/lib/errors'
import { REQUEST_SELECT } from '@/lib/service-requests'
import { STATUS_ORDER } from '@/lib/service-request-config'
import type {
  FieldPersonnelOption,
  Profile,
  RequestUrgency,
  ServiceRequestStatus,
  ServiceRequestWithRelations,
  StaffRequestDetail,
  StaffRequestListItem,
  StaffRequestPeople,
  StaffRequestSummary,
} from '@/types/database'

/**
 * Kurum (admin / birim yetkilisi / saha personeli) iş akışı erişim katmanı.
 * Yetki denetimi veritabanında (RLS + RPC) yapılır; buradaki kapsam filtreleri
 * yalnızca sonuçları role uygun daraltmak içindir.
 */

export const STAFF_PAGE_SIZE = 20

const LOAD_ERROR = 'Talepler yüklenemedi. Lütfen daha sonra tekrar deneyin.'
const ACTION_ERROR = 'İşlem tamamlanamadı. Lütfen tekrar deneyin.'
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type StaffScopeProfile = Pick<Profile, 'id' | 'role' | 'department_id'>

export interface StaffRequestFilters {
  search: string
  status: ServiceRequestStatus | 'all'
  urgency: RequestUrgency | 'all'
  /** Yalnızca admin için anlamlıdır. */
  departmentId: string
}

export interface StaffRequestPage {
  items: StaffRequestListItem[]
  total: number
}

/** PostgREST filtre sözdizimini bozabilecek karakterleri temizler. */
function sanitizeSearch(value: string): string {
  return value.replace(/[,()*%_\\"':]/g, ' ').trim()
}

async function fetchPeople(requestIds: string[]): Promise<Map<string, StaffRequestPeople>> {
  const map = new Map<string, StaffRequestPeople>()
  if (requestIds.length === 0) return map
  const { data, error } = await supabase.rpc('get_staff_request_people', { p_request_ids: requestIds })
  if (error) throw toWorkflowError(error, LOAD_ERROR)
  for (const row of data) map.set(row.request_id, row)
  return map
}

function withPeople(
  requests: ServiceRequestWithRelations[],
  people: Map<string, StaffRequestPeople>,
): StaffRequestListItem[] {
  return requests.map((r) => ({
    ...r,
    assigned_name: people.get(r.id)?.assigned_name ?? null,
    citizen_name: people.get(r.id)?.citizen_name ?? null,
  }))
}

export async function getStaffRequests(
  scope: StaffScopeProfile,
  filters: StaffRequestFilters,
  page: number,
): Promise<StaffRequestPage> {
  let query = supabase.from('service_requests').select(REQUEST_SELECT, { count: 'exact' })

  if (scope.role === 'department_officer') {
    if (!scope.department_id) return { items: [], total: 0 }
    query = query.eq('department_id', scope.department_id)
  } else if (scope.role === 'field_personnel') {
    query = query.eq('assigned_to', scope.id)
  } else if (scope.role === 'admin' && filters.departmentId !== 'all') {
    query = query.eq('department_id', filters.departmentId)
  }

  if (filters.status !== 'all') query = query.eq('status', filters.status)
  if (filters.urgency !== 'all') query = query.eq('urgency', filters.urgency)

  const search = sanitizeSearch(filters.search)
  if (search) query = query.or(`tracking_code.ilike.%${search}%,title.ilike.%${search}%`)

  const from = page * STAFF_PAGE_SIZE
  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, from + STAFF_PAGE_SIZE - 1)
    .overrideTypes<ServiceRequestWithRelations[], { merge: false }>()

  if (error) {
    logError('Kurum talepleri yüklenemedi', error)
    throw new UserFacingError(toUserMessage(error, LOAD_ERROR))
  }

  const people = await fetchPeople(data.map((r) => r.id))
  return { items: withPeople(data, people), total: count ?? data.length }
}

/** Talep yoksa veya bu kullanıcının yönetim kapsamında değilse null döner. */
export async function getStaffRequestById(
  id: string,
  scope: StaffScopeProfile,
): Promise<StaffRequestDetail | null> {
  if (!UUID_PATTERN.test(id)) return null

  const { data, error } = await supabase
    .from('service_requests')
    .select(REQUEST_SELECT)
    .eq('id', id)
    .maybeSingle()
    .overrideTypes<ServiceRequestWithRelations, { merge: false }>()

  if (error) {
    logError('Kurum talep detayı yüklenemedi', error)
    throw new UserFacingError(toUserMessage(error, LOAD_ERROR))
  }
  if (!data) return null

  const inScope =
    scope.role === 'admin' ||
    (scope.role === 'department_officer' && scope.department_id === data.department_id) ||
    (scope.role === 'field_personnel' && data.assigned_to === scope.id)
  if (!inScope) return null

  const people = await fetchPeople([data.id])
  return withPeople([data], people)[0] ?? null
}

export async function getStaffRequestSummary(departmentId: string): Promise<StaffRequestSummary> {
  const { data, error } = await supabase.rpc('get_staff_request_summary', {
    p_department_id: departmentId === 'all' ? null : departmentId,
  })
  if (error) throw toWorkflowError(error, 'Özet bilgiler yüklenemedi.')

  const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, 0])) as Record<ServiceRequestStatus, number>
  let total = 0
  for (const row of data) {
    counts[row.status] = Number(row.total)
    total += Number(row.total)
  }
  return { counts, total }
}

export async function getAvailableFieldPersonnel(departmentId: string): Promise<FieldPersonnelOption[]> {
  const { data, error } = await supabase.rpc('get_available_field_personnel', { p_department_id: departmentId })
  if (error) throw toWorkflowError(error, 'Personel listesi yüklenemedi.')
  return data
}

export async function reviewRequest(requestId: string, note?: string): Promise<void> {
  const { error } = await supabase.rpc('review_service_request', {
    p_request_id: requestId,
    p_note: note?.trim() || null,
  })
  if (error) throw toWorkflowError(error, ACTION_ERROR)
}

export async function assignRequest(requestId: string, fieldPersonnelId: string, note?: string): Promise<void> {
  const { error } = await supabase.rpc('assign_service_request', {
    p_request_id: requestId,
    p_field_personnel_id: fieldPersonnelId,
    p_note: note?.trim() || null,
  })
  if (error) throw toWorkflowError(error, ACTION_ERROR)
}

export async function startRequest(requestId: string, note?: string): Promise<void> {
  const { error } = await supabase.rpc('start_service_request', {
    p_request_id: requestId,
    p_note: note?.trim() || null,
  })
  if (error) throw toWorkflowError(error, ACTION_ERROR)
}

export async function resolveRequest(requestId: string, note: string): Promise<void> {
  const { error } = await supabase.rpc('resolve_service_request', { p_request_id: requestId, p_note: note.trim() })
  if (error) throw toWorkflowError(error, ACTION_ERROR)
}

export async function rejectRequest(requestId: string, note: string): Promise<void> {
  const { error } = await supabase.rpc('reject_service_request', { p_request_id: requestId, p_note: note.trim() })
  if (error) throw toWorkflowError(error, ACTION_ERROR)
}
