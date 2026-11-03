import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { fetchMyProfile } from '@/lib/profiles'
import { logError } from '@/lib/errors'
import { AuthContext, type AuthContextValue } from '@/context/auth-context'
import type { Profile } from '@/types/database'

interface ProfileState {
  userId: string
  profile: Profile | null
  error: boolean
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [profileState, setProfileState] = useState<ProfileState | null>(null)
  const userId = session?.user.id

  useEffect(() => {
    let active = true

    // Mevcut oturumu geri yükle
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })

    // Oturum değişikliklerini dinle (giriş, çıkış, token yenileme)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!active) return
      setSession(newSession)
      setLoading(false)
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [])

  // Profil, kullanıcı değiştiğinde yalnızca bir kez yüklenir (token yenilemeleri tetiklemez).
  useEffect(() => {
    if (!userId) {
      setProfileState(null)
      return
    }
    let active = true
    fetchMyProfile(userId)
      .then((profile) => {
        if (active) setProfileState({ userId, profile, error: false })
      })
      .catch((err: unknown) => {
        logError('Profil yüklenemedi', err)
        if (active) setProfileState({ userId, profile: null, error: true })
      })
    return () => {
      active = false
    }
  }, [userId])

  const refreshProfile = useCallback(async () => {
    if (!userId) return
    try {
      const profile = await fetchMyProfile(userId)
      setProfileState({ userId, profile, error: false })
    } catch (err) {
      logError('Profil yenilenemedi', err)
    }
  }, [userId])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const current = profileState && profileState.userId === userId ? profileState : null
    return {
      user: session?.user ?? null,
      session,
      loading,
      profileLoading: Boolean(userId) && current === null,
      profile: current?.profile ?? null,
      profileError: current?.error ?? false,
      role: current?.profile?.role ?? null,
      refreshProfile,
      signOut,
    }
  }, [session, loading, userId, profileState, refreshProfile, signOut])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
