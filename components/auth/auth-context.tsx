"use client"

import * as React from "react"
import { hashKey, useQuery, useQueryClient } from "@tanstack/react-query"

import { identifyUser, resetUser } from "@/lib/analytics"
import { logout as apiLogout, me, type AuthUser } from "@/lib/api"

/**
 * Session state lives in TanStack Query (single source of truth, focus
 * revalidation for free); this context is the ergonomic wrapper every
 * surface consumes via useAuth().
 */

export const SESSION_KEY = ["session", "me"] as const

/** Cross-tab session sync — sign-out in one tab flips the others. */
const SESSION_CHANNEL = "spoo:session"

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

  // Post through the SAME channel object that listens: BroadcastChannel
  // skips only the posting instance, so a throwaway sender channel would
  // echo the message back into this very tab's listener.
  const channelRef = React.useRef<BroadcastChannel | null>(null)

  const broadcast = React.useCallback((event: "signed-in" | "signed-out") => {
    try {
      channelRef.current?.postMessage(event)
    } catch {
      // BroadcastChannel unavailable — cross-tab sync degrades gracefully
    }
  }, [])

  const setUser = React.useCallback(
    (user: AuthUser | null) => {
      queryClient.setQueryData(SESSION_KEY, user)
      if (user) broadcast("signed-in")
    },
    [queryClient, broadcast]
  )

  const signOut = React.useCallback(async () => {
    await apiLogout().catch(() => undefined)
    // A /auth/me that departed while cookies were still valid must not land
    // after we flip to signed-out and resurrect the session.
    await queryClient.cancelQueries({ queryKey: SESSION_KEY })
    // Flip the LIVE session query to null. (Never clear()/remove it: the
    // active observer stays subscribed to the orphaned query object and a
    // later setQueryData writes to a NEW cache entry it can't see — the
    // header keeps rendering the old user until a hard refresh.)
    queryClient.setQueryData(SESSION_KEY, null)
    // Drop everything else cached — never leak one account's data into the
    // next. Signed-out views unmount, so orphaning their observers is fine.
    queryClient.removeQueries({
      predicate: (q) => q.queryHash !== hashKey(SESSION_KEY),
    })
    // The pre-hydration auth hint must not survive sign-out (the dashboard
    // gate effect also drops it, but it isn't mounted when signing out from
    // marketing pages).
    try {
      localStorage.removeItem("spoo:authed")
      document.documentElement.classList.remove("authed")
    } catch {
      // ignore — worst case the gate flashes optimistically once
    }
    broadcast("signed-out")
  }, [queryClient, broadcast])

  // Cross-tab: another tab signed in/out — re-sync this tab's session.
  React.useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return
    const ch = new BroadcastChannel(SESSION_CHANNEL)
    channelRef.current = ch
    ch.onmessage = (e: MessageEvent) => {
      if (e.data === "signed-out") queryClient.setQueryData(SESSION_KEY, null)
      void queryClient.invalidateQueries({ queryKey: SESSION_KEY })
    }
    return () => {
      channelRef.current = null
      ch.close()
    }
  }, [queryClient])

  // Analytics identity follows the session query — the one place that sees
  // every path in and out (password login, OAuth completion, cookie-session
  // reload, sign-out, cross-tab sign-out, expiry). Reset only on a real
  // identified → signed-out transition: resetting an anonymous session
  // would rotate its distinct id on every visit.
  const identifiedRef = React.useRef(false)
  const user = data ?? null
  React.useEffect(() => {
    if (user) {
      identifyUser(user)
      identifiedRef.current = true
    } else if (identifiedRef.current) {
      resetUser()
      identifiedRef.current = false
    }
  }, [user])

  // bfcache: a back/forward restore replays the old DOM without re-running
  // effects or fetches — re-check the session so a stale header can't stick.
  React.useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted)
        void queryClient.invalidateQueries({ queryKey: SESSION_KEY })
    }
    window.addEventListener("pageshow", onPageShow)
    return () => window.removeEventListener("pageshow", onPageShow)
  }, [queryClient])

  const value = React.useMemo(
    () => ({
      user: data ?? null,
      loading: isPending,
      refresh,
      setUser,
      signOut,
    }),
    [data, isPending, refresh, setUser, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>")
  return ctx
}
