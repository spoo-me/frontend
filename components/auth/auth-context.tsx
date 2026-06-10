"use client"

import * as React from "react"

import { logout as apiLogout, me, type AuthUser } from "@/lib/spoo-api"

type AuthState = {
  user: AuthUser | null
  /** True until the first /auth/me round-trip settles. */
  loading: boolean
  /** Re-fetch the session (e.g. after verification flips a claim). */
  refresh: () => Promise<AuthUser | null>
  /** Optimistically seed the session after login/register responses. */
  setUser: (user: AuthUser | null) => void
  signOut: () => Promise<void>
}

const AuthContext = React.createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null)
  const [loading, setLoading] = React.useState(true)

  const refresh = React.useCallback(async () => {
    try {
      const { user } = await me()
      setUser(user)
      return user
    } catch {
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void refresh()
  }, [refresh])

  const signOut = React.useCallback(async () => {
    await apiLogout().catch(() => undefined)
    setUser(null)
  }, [])

  const value = React.useMemo(
    () => ({ user, loading, refresh, setUser, signOut }),
    [user, loading, refresh, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>")
  return ctx
}
