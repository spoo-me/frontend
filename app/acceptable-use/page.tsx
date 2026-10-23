import type { Metadata } from "next"

import { LegalDocPage } from "@/components/sections/legal-doc"
import { legalDocs } from "@/lib/legal-content"
import { socialCard } from "@/lib/og"

const doc = legalDocs.find((d) => d.slug === "acceptable-use")!

export const metadata: Metadata = {
  title: doc.title,
  description: doc.description,
  ...socialCard({
    title: doc.title,
    description: doc.description,
    image: "/og/legal/legal.jpg",
    alt: "spoo.me Acceptable Use Policy",
  }),
}

export default function AcceptableUsePage() {
  return <LegalDocPage doc={doc} />
}
