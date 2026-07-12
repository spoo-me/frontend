"use client"

import { AppsStep } from "@/components/onboarding/steps/apps-step"
import { useOnboarding } from "@/components/onboarding/use-onboarding"

export default function AppsPage() {
  const { advance } = useOnboarding()
  return <AppsStep onDone={() => advance("recap")} />
}
