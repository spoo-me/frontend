"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, ChartLine, Globe2, Settings2 } from "lucide-react"

import {
  dimensionRowsOf,
  getStats,
  getUrl,
  listCustomDomains,
  timeSeriesOf,
} from "@/lib/api"
import { SpooApiError } from "@/lib/api/client"
import { displayUrl, formatCount, formatPercent } from "@/lib/format"
import { useFeature } from "@/hooks/use-features"
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
import { linkDetailPath } from "@/lib/link-detail"

const RANGES = [
  { label: "24h", days: 1 },
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
] as const

export default function LinkDetailPage() {
  const params = useParams<{ domain: string; alias: string }>()
  const router = useRouter()
  const domain = decodeURIComponent(params.domain)
  const alias = decodeURIComponent(params.alias)
  const [rangeDays, setRangeDays] = React.useState<number>(30)
  const [metric, setMetric] = React.useState<ChartMetric>("total")

  // One fetch by natural key. A 404 (missing, or someone else's link) is a
  // first-class answer — it renders the not-found state below, so don't
  // burn retries on it.
  const url = useQuery({
    queryKey: ["url", domain, alias],
    queryFn: () => getUrl(domain, alias),
    retry: (count, error) =>
      !(error instanceof SpooApiError && error.status === 404) && count < 3,
  })
  const link = url.data ?? null

  const range = React.useMemo(() => {
    const end = new Date()
    return { start: new Date(end.getTime() - rangeDays * 86_400_000), end }
  }, [rangeDays])

  const stats = useQuery({
    queryKey: ["stats", { domain, alias, rangeDays }],
    queryFn: () =>
      getStats({
        startDate: range.start,
        endDate: range.end,
        shortCodes: [alias],
        groupBy: ["time", "referrer", "country"],
      }),
    enabled: !!link,
  })

  // Only the settings form's domain picker consumes this, and that picker
  // exists only for accounts with custom domains — so does the fetch.
  const showDomains = useFeature("custom_domains") === "enabled"
  const domains = useQuery({
    queryKey: ["domains"],
    queryFn: listCustomDomains,
    enabled: showDomains,
    staleTime: 60_000,
  })
  const domainOptions = [
    "spoo.me",
    ...(domains.data?.items
      .filter((d) => d.status === "ACTIVE")
      .map((d) => d.fqdn) ?? []),
  ]

  if (!url.isPending && !link) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <div className="pattern-dots flex h-64 flex-col items-center justify-center gap-3 rounded-xl">
          <span className="rounded-lg border border-border border-dashed px-3 py-1.5 font-mono text-[11px] text-muted-foreground/70">
            no link at {domain}/{alias}
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
          <Panel className="mt-2 min-h-[21rem] p-2">
            {stats.isPending ? (
              <Skeleton className="h-80 w-full" />
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
          <Panel className="mt-2 min-h-[21rem] p-2">
            {stats.isPending ? (
              <Skeleton className="h-80 w-full" />
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
      <div className="mt-8 pb-8">
        <SectionHeader icon={Settings2} title="Settings" />
        <Panel className="mt-2 p-5">
          {link ? (
            <LinkSettingsForm
              link={link}
              domains={domainOptions}
              layout="wide"
              // The route IS the link's address, so a rename strands this
              // page on a 404 and leaves the settings panel on a skeleton.
              // replace(), not push(), so Back doesn't return to a dead URL.
              onSaved={(next) => {
                const path = linkDetailPath(next)
                if (path !== window.location.pathname) router.replace(path)
              }}
            />
          ) : (
            <Skeleton className="h-64 w-full" />
          )}
        </Panel>
      </div>
    </div>
  )
}
