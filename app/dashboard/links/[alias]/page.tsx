"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, ChartLine, Globe2, Settings2 } from "lucide-react"

import {
  dimensionRowsOf,
  getStats,
  listCustomDomains,
  listUrls,
  timeSeriesOf,
} from "@/lib/api"
import { displayUrl, formatCount, formatPercent } from "@/lib/format"
import { Skeleton } from "@/components/ui/skeleton"
import { Panel, SectionHeader } from "@/components/dashboard/section"
import { StatusPill } from "@/components/dashboard/status-pill"
import { CopyButton } from "@/components/dashboard/copy-button"
import { KpiCard } from "@/components/dashboard/kpi"
import {
  ClicksChart,
  type ChartMetric,
} from "@/components/dashboard/clicks-chart"
import {
  AdaptiveSegmented,
  HeaderControls,
  MetricControl,
} from "@/components/dashboard/analytics/metric-control"
import { BreakdownList } from "@/components/dashboard/breakdown-list"
import {
  LinkActions,
  shortUrlOf,
} from "@/components/dashboard/links/link-actions"
import { LinkSettingsForm } from "@/components/dashboard/links/link-settings-form"

const RANGES = [
  { label: "24h", days: 1 },
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
] as const

export default function LinkDetailPage() {
  const params = useParams<{ alias: string }>()
  const router = useRouter()
  const alias = decodeURIComponent(params.alias)
  const [rangeDays, setRangeDays] = React.useState<number>(30)
  const [metric, setMetric] = React.useState<ChartMetric>("total")

  // No single-URL GET on the backend — resolve through the list endpoint.
  const urls = useQuery({
    queryKey: ["urls", { search: alias }],
    queryFn: () => listUrls({ pageSize: 100, filter: { search: alias } }),
  })
  const link = urls.data?.items.find((l) => l.alias === alias) ?? null

  const range = React.useMemo(() => {
    const end = new Date()
    return { start: new Date(end.getTime() - rangeDays * 86_400_000), end }
  }, [rangeDays])

  const stats = useQuery({
    queryKey: ["stats", { alias, rangeDays }],
    queryFn: () =>
      getStats({
        startDate: range.start,
        endDate: range.end,
        shortCodes: [alias],
        groupBy: ["time", "referrer", "country"],
      }),
    enabled: !!link,
  })

  const domains = useQuery({
    queryKey: ["domains"],
    queryFn: listCustomDomains,
    staleTime: 60_000,
  })
  const domainOptions = [
    "spoo.me",
    ...(domains.data?.items
      .filter((d) => d.status === "ACTIVE")
      .map((d) => d.fqdn) ?? []),
  ]

  if (!urls.isPending && !link) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <div className="pattern-dots flex h-64 flex-col items-center justify-center gap-3 rounded-xl">
          <span className="rounded-lg border border-border border-dashed px-3 py-1.5 font-mono text-[11px] text-muted-foreground/70">
            no link at spoo.me/{alias}
          </span>
          <Link
            href="/dashboard/links"
            className="text-foreground text-xs underline underline-offset-4"
          >
            Back to links
          </Link>
        </div>
      </div>
    )
  }

  const s = stats.data

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Identity header */}
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={() => router.push("/dashboard/links")}
          aria-label="Back to links"
          className="mt-0.5 flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-150 hover:bg-accent/60 hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          {link ? (
            <>
              <div className="flex items-center gap-2">
                <h1 className="truncate font-mono font-semibold text-foreground text-lg tracking-tight">
                  {(link.domain ?? "spoo.me") + "/" + link.alias}
                </h1>
                <CopyButton
                  value={shortUrlOf(link)}
                  trackAs="copy_short_link"
                />
                <StatusPill status={link.status} />
              </div>
              <a
                href={link.long_url ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="truncate text-muted-foreground text-xs underline-offset-4 transition-colors duration-150 hover:text-foreground hover:underline"
              >
                {displayUrl(link.long_url)}
              </a>
            </>
          ) : (
            <div className="space-y-2">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-3 w-72" />
            </div>
          )}
        </div>
        {link && (
          <LinkActions
            link={link}
            onDeleted={() => router.push("/dashboard/links")}
          />
        )}
      </div>

      {/* KPI strip */}
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Total clicks"
          value={s ? formatCount(s.summary.total_clicks) : "–"}
        />
        <KpiCard
          label="Unique visitors"
          value={s ? formatCount(s.summary.unique_clicks) : "–"}
        />
        <KpiCard
          label="Unique rate"
          value={formatPercent(s?.computed_metrics?.unique_click_rate)}
        />
        <KpiCard
          label="Avg redirect"
          value={
            s?.summary.avg_redirection_time != null
              ? `${s.summary.avg_redirection_time}ms`
              : "–"
          }
        />
      </div>

      {/* Clicks over time */}
      <div className="mt-8">
        <SectionHeader
          icon={ChartLine}
          title="Clicks over time"
          action={
            /* Same fold mechanic as the analytics widget headers: when the
               measured header can't hold the segmented controls next to the
               full title, both fold into compact mono dropdowns. */
            <HeaderControls>
              <MetricControl value={metric} onChange={setMetric} />
              <AdaptiveSegmented
                value={String(rangeDays)}
                onChange={(v) => setRangeDays(Number(v))}
                options={RANGES.map((r) => ({
                  value: String(r.days),
                  label: r.label,
                }))}
                ariaLabel="Range"
              />
            </HeaderControls>
          }
        />
        <Panel className="mt-2 p-4">
          {stats.isPending ? (
            <Skeleton className="h-[240px] w-full" />
          ) : (
            <ClicksChart
              series={s ? timeSeriesOf(s) : []}
              hourly={s?.time_bucket_info.strategy === "hourly"}
              metric={metric}
            />
          )}
        </Panel>
      </div>

      {/* Breakdowns */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <SectionHeader icon={Globe2} title="Referrers" />
          <Panel className="mt-2 p-2">
            {stats.isPending ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <BreakdownList
                dimension="referrer"
                rows={s ? dimensionRowsOf(s, "referrer") : []}
              />
            )}
          </Panel>
        </div>
        <div>
          <SectionHeader icon={Globe2} title="Countries" />
          <Panel className="mt-2 p-2">
            {stats.isPending ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <BreakdownList
                dimension="country"
                rows={s ? dimensionRowsOf(s, "country") : []}
              />
            )}
          </Panel>
        </div>
      </div>

      {/* Settings — the same form the sheet renders */}
      <div className="mt-8 max-w-2xl pb-8">
        <SectionHeader icon={Settings2} title="Settings" />
        <Panel className="mt-2 p-5">
          {link ? (
            <LinkSettingsForm link={link} domains={domainOptions} />
          ) : (
            <Skeleton className="h-64 w-full" />
          )}
        </Panel>
      </div>
    </div>
  )
}
