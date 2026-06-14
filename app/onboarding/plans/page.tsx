"use client"

import { PlansStep } from "@/components/onboarding/steps/plans-step"
import { useOnboarding } from "@/components/onboarding/use-onboarding"
import { saveStash } from "@/lib/onboarding"

export default function PlansPage() {
  const { advance } = useOnboarding()
  return (
    <PlansStep
      onChoose={(plan) => {
        saveStash({ plan })
        advance("done")
      }}
    />
  )
}
