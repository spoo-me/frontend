"use client"

import { PathStep } from "@/components/onboarding/steps/path-step"
import { useOnboarding } from "@/components/onboarding/use-onboarding"

export default function PathPage() {
  const { advance } = useOnboarding()
  return (
    <PathStep
      onChoose={(path) => advance(path === "links" ? "link" : "api", path)}
    />
  )
}
