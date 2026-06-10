"use client"

import { ApiStep } from "@/components/onboarding/steps/api-step"
import { useOnboarding } from "@/components/onboarding/use-onboarding"
import { saveStash } from "@/lib/onboarding"

export default function ApiPage() {
  const { advance } = useOnboarding()
  return (
    <ApiStep
      onDone={(key) => {
        saveStash({
          artifact: {
            kind: "key",
            name: key.name,
            tokenPrefix: key.token_prefix ?? key.token.slice(0, 9),
          },
        })
        advance("domain")
      }}
      onSkip={() => advance("domain")}
    />
  )
}
