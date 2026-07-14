"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import { ArrowUpRight, Flame } from "lucide-react"

import { dimensionRowsOf, getStats } from "@/lib/api"
import { formatCount } from "@/lib/format"
import { InfoHint } from "@/components/dashboard/info-hint"
import { Panel, SectionHeader } from "@/components/dashboard/section"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * What's moving RIGHT NOW: top links over roughly the last hour (hourly
 * buckets floor to hour boundaries, so "last hour" is honest-loose).
 * Row background doubles as the proportional bar; refreshed every minute.
 */

export function HotLinks() {
  const hot = useQuery({
    queryKey: ["stats", "hot-hour"],
    queryFn: () =>
      getStats({
        startDate: new Date(Date.now() - 3_600_000),
        endDate: new Date(),
        groupBy: ["short_code"],
      }),
    refetchInterval: 60_000,
  })

  const rows = hot.data
    ? dimensionRowsOf(hot.data, "short_code").slice(0, 5)
    : []
  const max = rows[0]?.clicks ?? 1

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border/60 bg-shell p-0.5">
      <SectionHeader
        className="h-9 px-2.5"
        icon={Flame}
        title="Hot right now"
        badge={
          <InfoHint label="What counts as hot">
            The most clicked links in the last hour, refreshed every minute.
          </InfoHint>
        }
        action={
          <Link
            href="/dashboard/analytics"
            className="flex items-center gap-1 text-muted-foreground text-xs transition-colors duration-150 hover:text-foreground"
          >
            Open analytics
            <ArrowUpRight className="size-3" />
          </Link>
        }
      />
      <Panel className="mt-0 flex-1 rounded-[14px] bg-background p-2">
        {hot.isPending ? (
          <div className="space-y-1">
            {[88, 71, 62, 48, 39].map((w, i) => (
              <Skeleton
                key={i}
                className="h-9 rounded-lg"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        ) : rows.length ? (
          <div className="min-h-40 space-y-1">
            {rows.map((row, i) => (
              <Link
                key={row.value}
                // The stats dimension carries only the short code, not the
                // link's domain, so a custom-domain link can't be deep-linked
                // to its detail route without guessing the domain (and 404ing).
                // Route to the links list filtered by alias instead: the real
                // row there carries the correct domain and never 404s.
                href={`/dashboard/links?q=${encodeURIComponent(row.value)}`}
                className="group relative flex h-9 items-center gap-2.5 overflow-hidden rounded-lg px-2.5"
              >
                <motion.span
                  aria-hidden
                  className="absolute inset-y-0 left-0 rounded-lg bg-muted/80 transition-colors duration-150 group-hover:bg-accent"
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${Math.max((row.clicks / max) * 100, 4)}%`,
                  }}
                  transition={{
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                    delay: i * 0.035,
                  }}
                />
                <span className="relative min-w-0 flex-1 truncate font-mono text-[13px] text-foreground">
                  /{row.value}
                </span>
                <span className="relative font-mono text-muted-foreground text-xs tabular-nums">
                  {formatCount(row.clicks)}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="pattern-dots m-2 flex h-40 min-h-[calc(100%-1rem)] items-center justify-center rounded-lg">
            <span className="rounded-lg border border-border border-dashed px-3 py-1.5 font-mono text-[11px] text-muted-foreground/70">
              A quiet hour
            </span>
          </div>
        )}
      </Panel>
    </div>
  )
}
