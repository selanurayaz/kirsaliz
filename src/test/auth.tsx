import type { ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { AuthContext, type AuthContextValue } from '@/context/auth-context'
import type { Profile, UserRole } from '@/types/database'

export function makeProfile(role: UserRole, overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'user-1',
    full_name: 'Test Kullanıcı',
    role,
    phone: null,
    is_active: true,
    department_id: null,
    village_id: null,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    ...overrides,
  }
}

/** Gerçek Supabase kullanmadan, verilen rolle oturum açmış bir bağlam üretir. */
export function makeAuth(role: UserRole | null, overrides: Partial<AuthContextValue> = {}): AuthContextValue {
  const signedIn = role !== null
  return {
    user: signedIn ? ({ id: 'user-1', email: 'test@example.test' } as User) : null,
    session: null,
    loading: false,
    profileLoading: false,
    profile: role ? makeProfile(role) : null,
    profileError: false,
    role,
    refreshProfile: async () => {},
    signOut: async () => {},
    ...overrides,
  }
}

export function AuthTestProvider({ value, children }: { value: AuthContextValue; children: ReactNode }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
