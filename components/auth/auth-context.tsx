"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { logout as apiLogout, me, type AuthUser } from "@/lib/api"

/**
 * Session state lives in TanStack Query (single source of truth, focus
 * revalidation for free); this context is the ergonomic wrapper every
 * surface consumes via useAuth().
 */

export const SESSION_KEY = ["session", "me"] as const

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
  const queryClient = useQueryClient()

  const { data, isPending, refetch } = useQuery({
    queryKey: SESSION_KEY,
    queryFn: async () => {
      try {
        const { user } = await me()
        return user
      } catch {
        return null // signed out is data, not an error — keeps retries off
      }
    },
    staleTime: 5 * 60_000,
  })

  const refresh = React.useCallback(async () => {
    const { data } = await refetch()
    return data ?? null
  }, [refetch])

  const setUser = React.useCallback(
    (user: AuthUser | null) => {
      queryClient.setQueryData(SESSION_KEY, user)
    },
    [queryClient],
  )

  const signOut = React.useCallback(async () => {
    await apiLogout().catch(() => undefined)
    // Drop EVERYTHING cached — never leak one account's data into the next.
    queryClient.clear()
    queryClient.setQueryData(SESSION_KEY, null)
  }, [queryClient])

  const value = React.useMemo(
    () => ({
      user: data ?? null,
      loading: isPending,
      refresh,
      setUser,
      signOut,
    }),
    [data, isPending, refresh, setUser, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>")
  return ctx
}
