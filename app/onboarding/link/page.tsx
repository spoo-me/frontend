"use client"

import { LinkStep } from "@/components/onboarding/steps/link-step"
import { useOnboarding } from "@/components/onboarding/use-onboarding"
import { saveStash } from "@/lib/onboarding"

export default function LinkPage() {
  const { advance } = useOnboarding()
  return (
    <LinkStep
      onDone={(link) => {
        saveStash({
          artifact: {
            kind: "link",
            shortUrl: link.short_url,
            alias: link.alias,
          },
        })
        advance("domain")
      }}
      onSkip={() => advance("domain")}
    />
  )
}
