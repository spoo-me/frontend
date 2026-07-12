"use client"

import { keepPreviousData, useQuery } from "@tanstack/react-query"

import { getStats, type StatsDimension, type StatsResponse } from "@/lib/api"
import { mergeScope, type Widget } from "@/lib/analytics-layout"
import type { TimeRange } from "@/components/dashboard/analytics/time-range"

/**
 * Per-widget data: unscoped widgets read the board's shared query untouched
 * (zero extra requests); scoped widgets get their own query composed from
 * the global lens AND their scope, requesting only the groupBy they render.
 * Identical scopes dedupe through the query key. A disjoint composition
 * (global US chip x widget scoped to IN) fetches nothing.
 */

export type WidgetStatsCtx = {
  range: TimeRange
  /** The toolbar's global link filter + dimension filters. */
  links: string[]
  filters: Partial<
    Record<"referrer" | "country" | "browser" | "os" | "city", string[]>
  >
  refreshEvery: number | false
  shared: {
    stats?: StatsResponse
    prev?: StatsResponse
    loading: boolean
  }
}

export type WidgetStats = {
  stats?: StatsResponse
  prev?: StatsResponse
  loading: boolean
  /** Scope and board filters exclude each other; nothing was fetched. */
  disjoint: boolean
}

export function useWidgetStats(
  widget: Widget,
  ctx: WidgetStatsCtx
): WidgetStats {
  const scope = widget.config.scope
  const merged = scope ? mergeScope(ctx.links, ctx.filters, scope) : null
  const disjoint = merged === "disjoint"
  const lens = merged !== "disjoint" ? merged : null

  // Stat tiles need their delta; timeseries only when the ghost is on.
  const wantsPrev =
    widget.kind === "stat" ||
    (widget.kind === "timeseries" && widget.config.compare === "previous")

  const groupBy: StatsDimension[] =
    widget.kind === "breakdown" ? [widget.config.dimension] : ["time"]

  const fromMs = ctx.range.from.getTime()
  const toMs = ctx.range.to.getTime()
  const span = toMs - fromMs

  const scopedQ = useQuery({
    queryKey: [
      "stats",
      "widget",
      groupBy,
      fromMs,
      toMs,
      lens?.links ?? null,
      lens?.filters ?? null,
    ],
    queryFn: () =>
      getStats({
        startDate: ctx.range.from,
        endDate: ctx.range.to,
        groupBy,
        shortCodes: lens?.links,
        filters: lens?.filters,
      }),
    enabled: !!scope && !disjoint,
    refetchInterval: ctx.refreshEvery,
    placeholderData: keepPreviousData,
  })

  // Equal-length window immediately before the range, same lens — mirrors
  // the page-level prevStats construction so deltas compare like with like.
  const scopedPrevQ = useQuery({
    queryKey: [
      "stats",
      "widget-prev",
      fromMs,
      toMs,
      lens?.links ?? null,
      lens?.filters ?? null,
    ],
    queryFn: () =>
      getStats({
        startDate: new Date(fromMs - span),
        endDate: ctx.range.from,
        groupBy: ["time"],
        shortCodes: lens?.links,
        filters: lens?.filters,
      }),
    enabled: !!scope && !disjoint && wantsPrev,
    placeholderData: keepPreviousData,
  })

  if (!scope)
    return {
      stats: ctx.shared.stats,
      prev: ctx.shared.prev,
      loading: ctx.shared.loading,
      disjoint: false,
    }
  if (disjoint)
    return { stats: undefined, prev: undefined, loading: false, disjoint: true }
  return {
    stats: scopedQ.data,
    prev: wantsPrev ? scopedPrevQ.data : undefined,
    loading: scopedQ.isPending,
    disjoint: false,
  }
}
