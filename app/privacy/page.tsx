import type { Metadata } from "next"

import { LegalDocPage } from "@/components/sections/legal-doc"
import { legalDocs } from "@/lib/legal-content"
import { socialCard } from "@/lib/og"

const doc = legalDocs.find((d) => d.slug === "privacy")!

export const metadata: Metadata = {
  title: doc.title,
  description: doc.description,
  ...socialCard({
    title: doc.title,
    description: doc.description,
    image: "/og/legal/privacy.jpg",
    alt: "spoo.me Privacy Policy",
  }),
}

export default function PrivacyPage() {
  return <LegalDocPage doc={doc} />
}
