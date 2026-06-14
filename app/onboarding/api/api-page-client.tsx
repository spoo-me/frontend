"use client"

import { ApiStep } from "@/components/onboarding/steps/api-step"
import { useOnboarding } from "@/components/onboarding/use-onboarding"
import { saveStash } from "@/lib/onboarding"

export function ApiPageClient({ curlHtml }: { curlHtml: string }) {
  const { advance } = useOnboarding()
  return (
    <ApiStep
      curlHtml={curlHtml}
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
