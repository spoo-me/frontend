"use client"

import * as Sentry from "@sentry/nextjs"
import { RotateCcw } from "lucide-react"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"

// Segment boundary for the dashboard: a render error in one view degrades to
// this card inside the shell instead of unmounting the whole document
// (global-error.tsx stays the last resort for errors that escape the layout).
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <div className="mx-auto my-auto w-full max-w-md">
      <div className="rounded-2xl border border-border/60 bg-card">
        <div className="pattern-dots m-4 flex h-56 flex-col items-center justify-center gap-3 rounded-lg">
          <span className="rounded-lg border border-border border-dashed px-3 py-1.5 font-mono text-[11px] text-muted-foreground/70">
            this view crashed
          </span>
          <Button size="sm" onClick={reset}>
            <RotateCcw data-icon="inline-start" />
            Try again
          </Button>
          {error.digest && (
            <span className="font-mono text-[10px] text-muted-foreground/50 tabular-nums">
              {error.digest}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
