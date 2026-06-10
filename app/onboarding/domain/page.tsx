"use client"

import { DomainStep } from "@/components/onboarding/steps/domain-step"
import { useOnboarding } from "@/components/onboarding/use-onboarding"

export default function DomainPage() {
  const { advance } = useOnboarding()
  return <DomainStep onDone={() => advance("apps")} />
}
