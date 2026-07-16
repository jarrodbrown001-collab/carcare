import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, cloudEnabled } from './supabaseClient'

const AuthContext = createContext({ user: null, loading: false })

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(cloudEnabled)

  useEffect(() => {
    if (!cloudEnabled) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const value = {
    user: session?.user ?? null,
    loading,
    async signInWithEmail(email) {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: window.location.origin + window.location.pathname },
      })
      if (error) throw error
    },
    async signOut() {
      await supabase.auth.signOut()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
