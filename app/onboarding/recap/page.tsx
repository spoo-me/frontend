"use client"

import * as React from "react"

import { RecapStep } from "@/components/onboarding/steps/recap-step"
import { useOnboarding } from "@/components/onboarding/use-onboarding"
import { loadStash, saveStash, type OnboardingStash } from "@/lib/onboarding"

export default function RecapPage() {
  const { complete } = useOnboarding()
  const [stash, setStash] = React.useState<OnboardingStash>({})
  const [failed, setFailed] = React.useState(false)

  // localStorage read after mount — keeps the page prerender-safe.
  React.useEffect(() => setStash(loadStash()), [])

  return (
    <RecapStep
      stash={stash}
      error={
        failed
          ? "Couldn't finish setting up. Check your connection and retry."
          : null
      }
      onFinish={(heardFrom) => {
        if (heardFrom) saveStash({ heardFrom })
        void complete().then((ok) => setFailed(!ok))
      }}
    />
  )
}
