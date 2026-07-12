import type { Metadata } from "next"

import { ErrorShell } from "@/components/errors/error-shell"
import { NotFoundBody } from "@/components/errors/not-found-body"

/** Next-internal unknown routes get the same 404 the edge composes. */

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <ErrorShell status="404">
      <NotFoundBody />
    </ErrorShell>
  )
}
