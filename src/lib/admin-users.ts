import { supabase } from '@/lib/supabase'
import { toWorkflowError } from '@/lib/errors'
import type { AccessUpdatePayload, AdminUserListItem, ProfileAccessHistory } from '@/types/database'

/** Admin kullanıcı yönetimi — yalnızca güvenli RPC'ler ve admin'e özel RLS ile. */

export async function getAdminUsers(): Promise<AdminUserListItem[]> {
  const { data, error } = await supabase.rpc('admin_list_users')
  if (error) throw toWorkflowError(error, 'Kullanıcılar yüklenemedi. Lütfen daha sonra tekrar deneyin.')
  return data
}

export async function updateUserAccess(payload: AccessUpdatePayload): Promise<void> {
  const { error } = await supabase.rpc('admin_update_user_access', {
    p_user_id: payload.userId,
    p_role: payload.role,
    p_department_id: payload.departmentId,
    p_is_active: payload.isActive,
  })
  if (error) throw toWorkflowError(error, 'Kullanıcı erişimi güncellenemedi. Lütfen tekrar deneyin.')
}

/** Son erişim değişiklikleri (RLS: yalnızca aktif adminler okuyabilir). */
export async function getAccessHistory(limit = 10): Promise<ProfileAccessHistory[]> {
  const { data, error } = await supabase
    .from('profile_access_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw toWorkflowError(error, 'Erişim geçmişi yüklenemedi.')
  return data
}
