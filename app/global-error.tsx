"use client"

import * as Sentry from "@sentry/nextjs"
import NextError from "next/error"
import { useEffect } from "react"

// Last-resort boundary for render errors that escape the root layout.
// It replaces the whole document, so it renders its own <html>/<body>.
// captureException is a no-op until the browser client has a DSN.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    // This boundary replaces the whole document, and most people who land
    // here close the tab. Sentry batches, so without an explicit flush the
    // report leaves with them and the crash never shows up at all.
    Sentry.captureException(error)
    void Sentry.flush(2000)
  }, [error])

  return (
    <html lang="en">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  )
}
