"use client"

import { ClaimStep } from "@/components/onboarding/steps/claim-step"
import { useOnboarding } from "@/components/onboarding/use-onboarding"

export default function ClaimPage() {
  const { advance } = useOnboarding()
  return <ClaimStep onDone={() => advance("apps")} />
}
