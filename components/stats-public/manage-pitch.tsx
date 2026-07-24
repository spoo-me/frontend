"use client"

import Link from "next/link"
import { ArrowUpRight } from "@/components/icons"

import { useAuth } from "@/components/auth/auth-context"
import { trackManagePitchClicked } from "@/lib/analytics"

/**
 * A signed-out visitor on a link's stats page is, more often than not, the
 * link's creator checking on it — the highest-intent manage surface there
 * is (landing-v2-plan §2). Signed-in users manage from the dashboard, so
 * they never see this.
 */
export function StatsManagePitch() {
  const { user, loading } = useAuth()
  if (loading || user) return null

  return (
    <div className="mt-10 flex items-center justify-center gap-2 border-border/40 border-t pt-6 text-xs">
      <span className="text-muted-foreground">Created this link?</span>
      <Link
        href="/signup"
        onClick={() => trackManagePitchClicked()}
        className="inline-flex items-center gap-1 font-medium text-foreground/90 transition-colors hover:text-foreground"
      >
        Sign up to keep and edit it
        <ArrowUpRight className="size-3" />
      </Link>
    </div>
  )
}
