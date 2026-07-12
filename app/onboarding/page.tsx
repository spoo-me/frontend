"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"

import { useAuth } from "@/components/auth/auth-context"
import { getOnboardingState } from "@/lib/api"
import { isOnboardingStep, STEP_ROUTES } from "@/lib/onboarding"

/**
 * Index — resolves where the user left off (server cache) and forwards
 * there. Fresh runs land on the welcome beat.
 */
export default function OnboardingIndexPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  const serverState = useQuery({
    queryKey: ["onboarding"],
    queryFn: getOnboardingState,
    enabled: !loading && !!user,
    staleTime: Infinity,
    retry: false,
  })

  React.useEffect(() => {
    if (loading || (serverState.isPending && !serverState.isError)) return
    if (!user) return // layout handles the login redirect
    const server = serverState.data
    if (user.onboarded_at) return // layout handles the dashboard redirect
    if (server?.step && isOnboardingStep(server.step)) {
      router.replace(STEP_ROUTES[server.step])
    } else {
      router.replace(STEP_ROUTES.welcome)
    }
  }, [loading, user, router, serverState.data, serverState.isPending, serverState.isError])

  return null
}
