import type { Metadata } from "next"

import { LegalDocPage } from "@/components/sections/legal-doc"
import { legalDocs } from "@/lib/legal-content"

const doc = legalDocs.find((d) => d.slug === "privacy")!

export const metadata: Metadata = {
  title: doc.title,
  description: doc.description,
}

export default function PrivacyPage() {
  return <LegalDocPage doc={doc} />
}
