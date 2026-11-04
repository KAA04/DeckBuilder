import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'

import { api } from '../services/api'
import { supabase } from '../services/supabase'
import type { Profile } from '../types'

interface AuthContextValue {
  session: Session | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async () => {
    try {
      const response = await api.get('/auth/me')
      setProfile(response.data.profile)
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) void loadProfile()
      else setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (nextSession) void loadProfile()
      else {
        setProfile(null)
        setLoading(false)
      }
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session && profile) setLoading(false)
  }, [session, profile])

  const signOut = async () => { await supabase.auth.signOut() }
  return <AuthContext.Provider value={{ session, profile, loading, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
