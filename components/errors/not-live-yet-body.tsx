"use client"

import Link from "next/link"

import { Button } from "@/components/ui/button"
import { useScheduledStart } from "@/hooks/use-scheduled-start"
import { formatGoLive } from "@/components/dashboard/links/scheduled-state"

/**
 * A scheduled link visited before its start. The status is a 404 (nothing
 * is reachable yet), but the link exists, so the page says when it opens
 * in the visitor's own timezone; the shell's watermark counts down to it.
 * If the lookup fails the page still stands on its own.
 */
export function NotLiveYetBody({ from }: { from?: string }) {
  const { startsAt } = useScheduledStart(from)

  return (
    <div className="max-w-xl">
      <h1 className="font-semibold text-3xl text-foreground tracking-tight">
        This link isn&apos;t live yet.
      </h1>
      <p className="mt-3 text-muted-foreground text-sm">
        Its owner set a start time. Until then it doesn&apos;t redirect.
      </p>
      {/* Fixed slot: the line exists before the lookup answers so the page
          never jumps when the time arrives. */}
      <p className="mt-6 h-5 font-mono text-[13px] text-muted-foreground tabular-nums">
        {startsAt !== null && `opens ${formatGoLive(startsAt)}`}
      </p>
      <div className="mt-8">
        <Button asChild variant="outline" size="sm">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  )
}
