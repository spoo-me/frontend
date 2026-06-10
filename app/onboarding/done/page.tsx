"use client"

import * as React from "react"

import { DoneStep } from "@/components/onboarding/steps/done-step"
import { useOnboarding } from "@/components/onboarding/use-onboarding"
import { loadStash, saveStash, type OnboardingStash } from "@/lib/onboarding"

export default function DonePage() {
  const { complete } = useOnboarding()
  const [stash, setStash] = React.useState<OnboardingStash>({})

  // localStorage read after mount — keeps the page prerender-safe.
  React.useEffect(() => setStash(loadStash()), [])

  return (
    <DoneStep
      stash={stash}
      onFinish={(heardFrom) => {
        if (heardFrom) saveStash({ heardFrom })
        complete()
      }}
    />
  )
}
