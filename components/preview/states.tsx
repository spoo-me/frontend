import Link from "next/link"
import { TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"

export function PreviewMissing({ code }: { code: string }) {
  return (
    <div className="pattern-dots flex min-h-72 flex-col items-center justify-center gap-3 rounded-xl px-6 py-16 text-center">
      <span className="rounded-lg border border-border border-dashed px-3 py-1.5 font-mono text-[11px] text-muted-foreground/70">
        no link at spoo.me/{code}
      </span>
      <p className="max-w-sm text-muted-foreground text-xs">
        This short link doesn&apos;t exist. Check the address, or claim it for
        yourself.
      </p>
      <Button asChild variant="outline" size="sm" className="mt-1">
        <Link href="/">Shorten your own link</Link>
      </Button>
    </div>
  )
}

export function PreviewUnavailable() {
  return (
    <div className="mx-auto my-16 max-w-md rounded-xl border border-border/60 bg-card p-5">
      <div className="flex items-start gap-3">
        <TriangleAlert
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
          strokeWidth={1.75}
        />
        <div>
          <p className="font-medium text-foreground text-sm">
            The preview is unavailable right now
          </p>
          <p className="mt-1 text-muted-foreground text-sm">
            We couldn&apos;t look this link up. The short link itself keeps
            redirecting; try this page again in a minute.
          </p>
        </div>
      </div>
    </div>
  )
}
