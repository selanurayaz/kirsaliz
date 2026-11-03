import { createContext } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import type { Profile, UserRole } from '@/types/database'

export interface AuthContextValue {
  user: User | null
  session: Session | null
  /** Oturum geri yükleniyor mu? */
  loading: boolean
  /** Oturum açık ve profil henüz yüklenmedi mi? */
  profileLoading: boolean
  profile: Profile | null
  /** Profil yüklenemediyse true (rol bilinmiyor; en düşük yetki varsayılır). */
  profileError: boolean
  role: UserRole | null
  refreshProfile: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
