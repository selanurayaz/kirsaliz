import { supabase } from '@/lib/supabase'
import { logError } from '@/lib/errors'
import type { Profile } from '@/types/database'

/** Oturumdaki kullanıcının profili. Okunamazsa null döner (karşılama alanı e-postaya düşer). */
export async function getMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) {
    logError('Profil yüklenemedi', error)
    return null
  }
  return data
}
