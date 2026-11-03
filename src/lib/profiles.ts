import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'

/** Oturumdaki kullanıcının profili. Profil yoksa null döner; sorgu hatası fırlatılır. */
export async function fetchMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw error
  return data
}
