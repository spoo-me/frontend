import type { Metadata } from "next"

import { LegalDocPage } from "@/components/sections/legal-doc"
import { legalDocs } from "@/lib/legal-content"

const doc = legalDocs.find((d) => d.slug === "terms")!

export const metadata: Metadata = {
  title: doc.title,
  description: doc.description,
}

export default function TermsPage() {
  return <LegalDocPage doc={doc} />
}
