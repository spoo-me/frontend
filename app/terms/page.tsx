import type { Metadata } from "next"

import { LegalDocPage } from "@/components/sections/legal-doc"
import { legalDocs } from "@/lib/legal-content"
import { socialCard } from "@/lib/og"

const doc = legalDocs.find((d) => d.slug === "terms")!

export const metadata: Metadata = {
  title: doc.title,
  description: doc.description,
  ...socialCard({
    title: doc.title,
    description: doc.description,
    image: "/og/legal/terms.jpg",
    alt: "spoo.me Terms of Service",
  }),
}

export default function TermsPage() {
  return <LegalDocPage doc={doc} />
}
