import type { Metadata } from "next"

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"

export const metadata: Metadata = {
  title: "Welcome",
  description: "Set up your spoo.me workspace",
  robots: { index: false },
}

export default function OnboardingPage() {
  return <OnboardingWizard />
}
