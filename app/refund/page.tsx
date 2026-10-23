import type { Metadata } from "next"

import { LegalDocPage } from "@/components/sections/legal-doc"
import { legalDocs } from "@/lib/legal-content"
import { socialCard } from "@/lib/og"

const doc = legalDocs.find((d) => d.slug === "refund")!

export const metadata: Metadata = {
  title: doc.title,
  description: doc.description,
  ...socialCard({
    title: doc.title,
    description: doc.description,
    image: "/og/legal/legal.jpg",
    alt: "spoo.me Refund Policy",
  }),
}

export default function RefundPage() {
  return <LegalDocPage doc={doc} />
}
