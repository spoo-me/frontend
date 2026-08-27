import type { Metadata } from "next"

import { LegalDocPage } from "@/components/sections/legal-doc"
import { legalDocs } from "@/lib/legal-content"

const doc = legalDocs.find((d) => d.slug === "privacy")!

export const metadata: Metadata = {
  title: doc.title,
  description: doc.description,
  openGraph: { images: [{ url: "/og/legal/privacy.jpg", width: 2400, height: 1260, alt: "spoo.me Privacy Policy" }] },
  twitter: { card: "summary_large_image", images: ["/og/legal/privacy.jpg"] },
}

export default function PrivacyPage() {
  return <LegalDocPage doc={doc} />
}
