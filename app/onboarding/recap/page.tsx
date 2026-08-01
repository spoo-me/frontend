"use client"

import * as React from "react"

import { RecapStep } from "@/components/onboarding/steps/recap-step"
import { useOnboarding } from "@/components/onboarding/use-onboarding"
import { loadStash, saveStash, type OnboardingStash } from "@/lib/onboarding"

export default function RecapPage() {
  const { complete } = useOnboarding()
  const [stash, setStash] = React.useState<OnboardingStash>({})

  // localStorage read after mount — keeps the page prerender-safe.
  React.useEffect(() => setStash(loadStash()), [])

  return (
    <RecapStep
      stash={stash}
      onFinish={(heardFrom) => {
        if (heardFrom) saveStash({ heardFrom })
        void complete()
      }}
    />
  )
}
