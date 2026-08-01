"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import { DomainStep } from "@/components/onboarding/steps/domain-step"
import { useOnboarding } from "@/components/onboarding/use-onboarding"
import { useFeatures } from "@/hooks/use-features"
import { STEP_ROUTES } from "@/lib/onboarding"

export default function DomainPage() {
  const { advance } = useOnboarding()
  const router = useRouter()
  const { features, settled } = useFeatures()
  const enabled = features?.custom_domains === "enabled"

  // Accounts without custom domains skip this step as if it doesn't exist.
  // router.replace (not advance): a skip is neither a step completion for
  // the funnel nor progress worth writing to the server cache.
  React.useEffect(() => {
    if (settled && !enabled) router.replace(STEP_ROUTES.claim)
  }, [settled, enabled, router])

  if (!enabled) return null
  return <DomainStep onDone={() => advance("claim")} />
}
