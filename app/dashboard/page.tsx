"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { motion } from "motion/react"
import {
  ArrowUpRight,
  ChartLine,
  Globe2,
  Link2,
  Plus,
  TrendingUp,
} from "lucide-react"

import {
  dimensionRowsOf,
  getStats,
  listApiKeys,
  listAppGrants,
  listCustomDomains,
  listUrls,
  timeSeriesOf,
} from "@/lib/api"
import {formatCount, pctChange } from "@/lib/format"
import { useAuth } from "@/components/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Panel, SectionHeader } from "@/components/dashboard/section"
import { KpiCard } from "@/components/dashboard/kpi"
import { ClicksChart } from "@/components/dashboard/clicks-chart"
import { BreakdownList } from "@/components/dashboard/breakdown-list"
import { openLinkComposer } from "@/components/dashboard/links/composer"

const DAYS = 30

/** Pending state in the exact geometry of the loaded rows (h-9, bar-like
    widths), so data arrival swaps content without reshaping the panel. */
function ListSkeleton() {
  const widths = [92, 78, 64, 55, 43, 36]
  return (
    <div className="space-y-1">
      {widths.map((w, i) => (
        <Skeleton
          key={i}
          className="h-9 rounded-lg"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  )
}

export default function DashboardOverviewPage() {
  const { user } = useAuth()
  const name = user?.user_name?.trim() || user?.email?.split("@")[0] || "there"

  // Lazy init: the window is pinned once per visit (impure clock reads
  // don't belong in render proper).
  const [{ current, previous }] = React.useState(() => {
    const end = Date.now()
    const start = end - DAYS * 86_400_000
    return {
      current: { start: new Date(start), end: new Date(end) },
      previous: {
        start: new Date(start - DAYS * 86_400_000),
        end: new Date(start),
      },
    }
  })

  const stats = useQuery({
    queryKey: ["stats", "overview", DAYS],
    queryFn: () =>
      getStats({
        startDate: current.start,
        endDate: current.end,
        groupBy: ["time", "referrer", "short_code"],
      }),
  })
  const prevStats = useQuery({
    queryKey: ["stats", "overview-prev", DAYS],
    queryFn: () =>
      getStats({
        startDate: previous.start,
        endDate: previous.end,
        groupBy: ["time"],
      }),
  })
  const urls = useQuery({
    queryKey: ["urls", "overview"],
    queryFn: () => listUrls({ pageSize: 1 }),
  })

  // Setup checklist sources (ref 25: weight-graded affordances).
  const domains = useQuery({ queryKey: ["domains"], queryFn: listCustomDomains })
  const keys = useQuery({ queryKey: ["keys"], queryFn: listApiKeys })
  const grants = useQuery({ queryKey: ["apps"], queryFn: listAppGrants })

  const s = stats.data
  const clicksDelta = s && prevStats.data
    ? pctChange(s.summary.total_clicks, prevStats.data.summary.total_clicks)
    : null
  const uniqueDelta = s && prevStats.data
    ? pctChange(s.summary.unique_clicks, prevStats.data.summary.unique_clicks)
    : null

  const topLinks = s ? dimensionRowsOf(s, "short_code").slice(0, 6) : []
  const maxTop = topLinks[0]?.clicks ?? 1

  const checklist = [
    {
      done: (urls.data?.total ?? 0) > 0,
      label: "Create your first link",
      action: () => openLinkComposer(),
      cta: "Create",
    },
    {
      done: (domains.data?.items.filter((d) => d.status === "ACTIVE").length ?? 0) > 0,
      label: "Connect a custom domain",
      href: "/dashboard/domains",
      cta: "Connect",
    },
    {
      done: (keys.data?.items.filter((k) => !k.revoked).length ?? 0) > 0,
      label: "Create an API key",
      href: "/dashboard/developer",
      cta: "Create",
    },
    {
      done: (grants.data?.items.length ?? 0) > 0,
      label: "Install an app or extension",
      href: "/dashboard/apps",
      cta: "Browse",
    },
  ]
  const remaining = checklist.filter((c) => !c.done)
  // Every source must have answered before the checklist may render:
  // pending queries read as "not done" and the block would flash in.
  const checklistReady = Boolean(
    urls.data && domains.data && keys.data && grants.data,
  )

  return (
    <div className="mx-auto w-full max-w-6xl">
      <span className="label-mono text-muted-foreground/60">Overview</span>
      <h1 className="text-foreground mt-2 text-xl font-semibold tracking-tight">
        Welcome back, {name}
      </h1>

      {/* KPI strip */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label={`Clicks · ${DAYS}d`}
          value={s ? formatCount(s.summary.total_clicks) : "–"}
          delta={clicksDelta}
          deltaLabel={`vs previous ${DAYS}d`}
        />
        <KpiCard
          label={`Unique visitors · ${DAYS}d`}
          value={s ? formatCount(s.summary.unique_clicks) : "–"}
          delta={uniqueDelta}
          deltaLabel={`vs previous ${DAYS}d`}
        />
        <KpiCard
          label="Links"
          value={urls.data ? formatCount(urls.data.total) : "–"}
          footer="workspace total"
        />
        <KpiCard
          label="Avg redirect"
          value={s ? `${s.summary.avg_redirection_time}ms` : "–"}
          footer={`average over ${DAYS}d`}
        />
      </div>

      {/* Setup checklist, only while something remains */}
      {checklistReady && remaining.length > 0 && (
        <div className="mt-8">
          <SectionHeader
            icon={TrendingUp}
            title="Finish setting up"
            action={
              <span className="text-muted-foreground font-mono text-xs tabular-nums">
                {checklist.length - remaining.length}/{checklist.length}
              </span>
            }
          />
          <Panel className="divide-border/60 mt-2 divide-y">
            {remaining.map((item) => (
              <div key={item.label} className="flex h-12 items-center gap-3 px-4">
                <span className="border-border/60 size-4 shrink-0 rounded-full border border-dashed" />
                <span className="text-foreground flex-1 text-sm">{item.label}</span>
                {item.href ? (
                  <Button asChild variant="outline" size="sm">
                    <Link href={item.href}>{item.cta}</Link>
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={item.action}>
                    {item.cta}
                  </Button>
                )}
              </div>
            ))}
          </Panel>
        </div>
      )}

      {/* Clicks chart */}
      <div className="border-border/60 bg-shell mt-8 rounded-2xl border p-0.5">
        <SectionHeader
          className="h-9 px-2.5"
          icon={ChartLine}
          title="Clicks over time"
          action={
            <Link
              href="/dashboard/analytics"
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors duration-150"
            >
              Open analytics
              <ArrowUpRight className="size-3" />
            </Link>
          }
        />
        <Panel className="bg-background mt-0 rounded-[14px] p-4">
          {stats.isPending ? (
            <Skeleton className="h-[220px] w-full" />
          ) : (
            <ClicksChart series={s ? timeSeriesOf(s) : []} height={220} />
          )}
        </Panel>
      </div>

      {/* Top links + referrers */}
      <div className="mt-8 grid grid-cols-1 gap-6 pb-8 lg:grid-cols-2">
        <div className="border-border/60 bg-shell rounded-2xl border p-0.5">
          <SectionHeader
            className="h-9 px-2.5"
            icon={Link2}
            title="Top links"
            action={
              <Link
                href="/dashboard/links"
                className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs transition-colors duration-150"
              >
                All links
                <ArrowUpRight className="size-3" />
              </Link>
            }
          />
          <Panel className="bg-background mt-0 rounded-[14px] p-2">
            {stats.isPending ? (
              <ListSkeleton />
            ) : topLinks.length ? (
              <div className="space-y-1">
                {topLinks.map((row, i) => (
                  <Link
                    key={row.value}
                    href={`/dashboard/links/${row.value}`}
                    className="group relative flex h-9 items-center gap-2.5 overflow-hidden rounded-lg px-2.5"
                  >
                    <motion.span
                      aria-hidden
                      className="bg-muted/80 group-hover:bg-accent absolute inset-y-0 left-0 rounded-lg transition-colors duration-150"
                      initial={{ width: "0%" }}
                      animate={{
                        width: `${Math.max((row.clicks / maxTop) * 100, 4)}%`,
                      }}
                      transition={{
                        duration: 0.5,
                        ease: [0.16, 1, 0.3, 1],
                        delay: i * 0.035,
                      }}
                    />
                    <span className="text-foreground relative min-w-0 flex-1 truncate font-mono text-[13px]">
                      /{row.value}
                    </span>
                    <span className="text-muted-foreground relative font-mono text-xs tabular-nums">
                      {formatCount(row.clicks)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="pattern-dots m-2 flex h-48 flex-col items-center justify-center gap-3 rounded-lg">
                <span className="border-border text-muted-foreground/70 rounded-lg border border-dashed px-3 py-1.5 font-mono text-[11px]">
                  no clicks yet
                </span>
                <Button size="sm" onClick={() => openLinkComposer()}>
                  <Plus data-icon="inline-start" />
                  New link
                </Button>
              </div>
            )}
          </Panel>
        </div>
        <div className="border-border/60 bg-shell rounded-2xl border p-0.5">
          <SectionHeader className="h-9 px-2.5" icon={Globe2} title="Referrers" />
          <Panel className="bg-background mt-0 rounded-[14px] p-2">
            {stats.isPending ? (
              <ListSkeleton />
            ) : (
              <BreakdownList
                dimension="referrer"
                rows={s ? dimensionRowsOf(s, "referrer") : []}
                limit={6}
              />
            )}
          </Panel>
        </div>
      </div>
    </div>
  )
}
