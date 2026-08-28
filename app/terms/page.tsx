import type { Metadata } from "next"

import { LegalDocPage } from "@/components/sections/legal-doc"
import { legalDocs } from "@/lib/legal-content"

const doc = legalDocs.find((d) => d.slug === "terms")!

export const metadata: Metadata = {
  title: doc.title,
  description: doc.description,
  openGraph: {
    images: [
      {
        url: "/og/legal/terms.jpg",
        width: 2400,
        height: 1260,
        alt: "spoo.me Terms of Service",
      },
    ],
  },
  twitter: { card: "summary_large_image", images: ["/og/legal/terms.jpg"] },
}

export default function TermsPage() {
  return <LegalDocPage doc={doc} />
}
