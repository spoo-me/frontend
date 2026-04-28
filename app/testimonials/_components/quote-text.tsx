import * as React from "react"

import type { QuoteSegment } from "@/lib/testimonials"

export function QuoteText({ segments }: { segments: QuoteSegment[] }) {
  return (
    <>
      {segments.map((s, i) =>
        typeof s === "string" ? (
          <React.Fragment key={i}>{s}</React.Fragment>
        ) : (
          <em
            key={i}
            className="text-foreground [font-family:var(--font-serif)] font-normal italic"
          >
            {s.em}
          </em>
        ),
      )}
    </>
  )
}
