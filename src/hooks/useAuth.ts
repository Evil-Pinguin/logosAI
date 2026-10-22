import { useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Profile } from '@/lib/types'

/* ------------------------------------------------------------------ */
/* Демо-режим (работа без реального Supabase)                         */
/* ------------------------------------------------------------------ */
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001'
const DEMO_EMAIL = 'test'
const DEMO_PASSWORD = 'test'
const DEMO_PROFILE: Profile = {
  id: DEMO_USER_ID,
  updatedAt: new Date().toISOString(),
  fullName: 'Тестовый логопед',
  role: 'speech_therapist',
}

export function useAuth() {
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const demoMode = !isSupabaseConfigured

  const fetchProfile = useCallback(async (uid: string | undefined) => {
    if (!uid) {
      setProfile(null)
      return
    }
    // Демо-профиль без запроса к Supabase
    if (demoMode && uid === DEMO_USER_ID) {
      setProfile(DEMO_PROFILE)
      return
    }
    if (!isSupabaseConfigured) {
      setProfile(null)
      return
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single()
    if (!error && data) setProfile(data as Profile)
    else setProfile(null)
  }, [])

  useEffect(() => {
    setLoading(true)
    if (demoMode) {
      // В демо-режиме сессия отсутствует до ручного входа
      setSession(null)
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      fetchProfile(data.session?.user.id)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      await fetchProfile(session?.user.id)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [fetchProfile, demoMode])

  const signIn = async (email: string, password: string) => {
    // Демо-вход: test / test
    if (demoMode) {
      if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
        const mockSession = {
          user: {
            id: DEMO_USER_ID,
            email: DEMO_EMAIL,
          },
          access_token: 'demo-token',
        }
        setSession(mockSession)
        setProfile(DEMO_PROFILE)
        localStorage.setItem('logosai_demo_session', JSON.stringify(mockSession))
        return null
      }
      return new Error('Неверный логин или пароль (для демо введите test / test)')
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return error
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    if (demoMode) {
      return new Error('Регистрация недоступна в демо-режиме. Используйте test / test для входа.')
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    })
    return error
  }

  const signInWithGithub = async () => {
    if (demoMode) {
      return new Error('GitHub OAuth недоступен в демо-режиме.')
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    })
    return error
  }

  const signOut = async () => {
    if (demoMode) {
      localStorage.removeItem('logosai_demo_session')
      setSession(null)
      setProfile(null)
      return null
    }
    const { error } = await supabase.auth.signOut()
    return error
  }

  return {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    demoMode,
    signIn,
    signUp,
    signInWithGithub,
    signOut,
    isAuthenticated: !!session,
    isTherapist: profile?.role === 'speech_therapist',
  }
}
