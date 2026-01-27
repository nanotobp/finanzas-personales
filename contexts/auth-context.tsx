'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { setCachedUser } from '@/lib/auth/user-cache'

interface AuthState {
  user: User | null
  userId: string | null
  loading: boolean
}

const AuthContext = createContext<AuthState>({
  user: null,
  userId: null,
  loading: true,
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    const loadSession = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (!mounted) return
      const nextUser = error ? null : (data.session?.user ?? null)
      setUser(nextUser)
      setCachedUser(nextUser)
      setLoading(false)
    }

    loadSession()

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      const nextUser = session?.user ?? null
      setUser(nextUser)
      setCachedUser(nextUser)
    })

    return () => {
      mounted = false
      data.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthState>(() => ({
    user,
    userId: user?.id ?? null,
    loading,
  }), [user, loading])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  return useContext(AuthContext)
}
