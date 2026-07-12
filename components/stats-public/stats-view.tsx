"use client"

import * as React from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Bot, ChartLine, Lock } from "lucide-react"

import { SpooApiError } from "@/lib/api/client"
import { getPublicStats, type PublicStats } from "@/lib/api/public-stats"
import {
  dimensionRowsOf,
  timeSeriesOf,
  type StatsDimension,
} from "@/lib/api/stats"
import {
  displayUrl,
  formatCount,
  formatDate,
  formatPercent,
  formatWhen,
} from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Panel } from "@/components/dashboard/section"
import { KpiCard } from "@/components/dashboard/kpi"
import { WidgetShell } from "@/components/dashboard/analytics/widget-shell"
import { CopyButton } from "@/components/dashboard/copy-button"
import { PasswordInput } from "@/components/dashboard/password-input"
import {
  ClicksChart,
  type ChartMetric,
} from "@/components/dashboard/clicks-chart"
import {
  AdaptiveSegmented,
  HeaderControls,
  MetricControl,
} from "@/components/dashboard/analytics/metric-control"
import { DIMENSION_META } from "@/components/dashboard/analytics/widget-meta"
import { BreakdownSection } from "@/components/stats-public/breakdown-section"

const RANGES = [
  { label: "24h", days: 1, phrase: "last 24 hours" },
  { label: "7d", days: 7, phrase: "last 7 days" },
  { label: "30d", days: 30, phrase: "last 30 days" },
  { label: "90d", days: 90, phrase: "last 90 days" },
] as const

/** The breakdown grid — countries map included — takes the grey ramp;
    clicks-over-time is the page's one brand-accent moment. */
const NEUTRAL_ACCENT = {
  "--chart-accent": "var(--chart-neutral)",
} as React.CSSProperties

const EXPORT_FORMATS = ["json", "csv", "xlsx", "xml"] as const

export function PublicStatsView({
  code,
  initial,
  gated,
}: {
  code: string
  /** SSR payload for the default range; null when the page loaded gated. */
  initial: PublicStats | null
  gated: boolean
}) {
  const [rangeDays, setRangeDays] = React.useState(30)
  const [metric, setMetric] = React.useState<ChartMetric>("total")
  // The submitted password lives only in memory and only in POST bodies.
  const [password, setPassword] = React.useState("")
  const [draft, setDraft] = React.useState("")
  const [passwordVisible, setPasswordVisible] = React.useState(false)

  const range = React.useMemo(() => {
    const end = new Date()
    return { start: new Date(end.getTime() - rangeDays * 86_400_000), end }
  }, [rangeDays])

  const query = useQuery<PublicStats, Error>({
    queryKey: ["public-stats", code, rangeDays, password],
    queryFn: () =>
      getPublicStats(code, {
        startDate: range.start,
        endDate: range.end,
        password: password || undefined,
      }),
    initialData:
      !gated && !password && rangeDays === 30
        ? (initial ?? undefined)
        : undefined,
    // Keep the previous range's data on screen while the next one loads —
    // the alternative is the whole page collapsing back to the gate.
    placeholderData: (prev) => prev,
    enabled: !gated || password.length > 0,
    retry: false,
    staleTime: 30_000,
  })

  const data = query.data
  if (!data) {
    return gated ? (
      <PasswordGate
        code={code}
        draft={draft}
        onDraftChange={setDraft}
        visible={passwordVisible}
        onVisibleChange={setPasswordVisible}
        busy={query.isFetching}
        error={
          query.error instanceof SpooApiError &&
          query.error.code === "invalid_password"
            ? "That password didn't match. Try again."
            : null
        }
        onSubmit={() => setPassword(draft.trim())}
      />
    ) : (
      <LoadingSkeleton />
    )
  }

  const { link, stats: s, generation } = data
  const rangePhrase =
    RANGES.find((r) => r.days === rangeDays)?.phrase ?? "selected range"
  const extraDimension: {
    key: StatsDimension
    title: string
    icon: React.ElementType
  } =
    generation === "v2"
      ? { key: "city", ...DIMENSION_META.city }
      : { key: "bots", title: "Known bots", icon: Bot }

  return (
    <div>
      {/* Identity */}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-mono font-semibold text-2xl text-foreground tracking-tight">
              {displayUrl(link.short_url)}
            </h1>
            <CopyButton value={link.short_url} label="Copy short link" />
          </div>
          {/* Withheld (null) for non-active links; the status in the mono
              line below is the whole explanation. Plain text, never an
              anchor — an unauthenticated page doesn't hyperlink whatever
              the DB holds (preview-page policy: the destination is there
              to read; navigation goes through the short link). */}
          {link.long_url && (
            <p className="mt-1.5 max-w-xl truncate text-muted-foreground text-sm">
              {displayUrl(link.long_url)}
            </p>
          )}
          <p className="mt-2 font-mono text-[11px] text-muted-foreground/70 tabular-nums">
            created {formatDate(link.created_at)}
            {link.status !== "active" && (
              <>
                {" · "}
                {/* StatusPill's tone map, as plain mono ink: amber for
                    expired, destructive for blocked, muted otherwise. */}
                <span
                  className={
                    link.status === "blocked"
                      ? "text-destructive"
                      : link.status === "expired"
                        ? "text-amber-700 dark:text-amber-400"
                        : undefined
                  }
                >
                  {link.status}
                </span>
              </>
            )}
            {link.max_clicks != null && ` · caps at ${link.max_clicks} clicks`}
            {link.block_bots && " · bots blocked"}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/dashboard/links/${encodeURIComponent(link.alias)}`}>
            Your link? See it in the dashboard
          </Link>
        </Button>
      </div>

      {/* KPI strip */}
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          label="Total clicks"
          value={formatCount(s.summary.total_clicks)}
          footer={`last click ${formatWhen(s.summary.last_click)}`}
        />
        <KpiCard
          label="Unique visitors"
          value={formatCount(s.summary.unique_clicks)}
          footer={`${formatPercent(s.computed_metrics?.unique_click_rate ?? (s.summary.total_clicks ? 0 : null))} of all clicks`}
        />
        <KpiCard
          label="Per visitor"
          value={
            // Absent metrics are "no measurement", never a zero.
            s.computed_metrics
              ? s.computed_metrics.average_clicks_per_visitor.toFixed(2)
              : "–"
          }
          footer={`clicks across the ${rangePhrase}`}
        />
        <KpiCard
          label="Avg redirect"
          value={
            s.summary.avg_redirection_time != null
              ? `${s.summary.avg_redirection_time}ms`
              : "–"
          }
          footer="time to reach the destination"
        />
      </div>

      {/* Clicks over time */}
      <div className="mt-8">
        <WidgetShell
          icon={ChartLine}
          title="Clicks over time"
          panelClassName="p-4"
          quickControls={
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
        >
          <ClicksChart
            series={timeSeriesOf(s)}
            hourly={s.time_bucket_info.strategy === "hourly"}
            metric={metric}
          />
        </WidgetShell>
      </div>

      {/* Breakdowns: the whole supporting grid, map included, on the grey
          ramp — one violet moment per page. */}
      <div
        className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2"
        style={NEUTRAL_ACCENT}
      >
        <BreakdownSection
          dimension="browser"
          title={DIMENSION_META.browser.title}
          icon={DIMENSION_META.browser.icon}
          rows={dimensionRowsOf(s, "browser")}
        />
        <BreakdownSection
          dimension="os"
          title={DIMENSION_META.os.title}
          icon={DIMENSION_META.os.icon}
          rows={dimensionRowsOf(s, "os")}
        />
        <BreakdownSection
          dimension="referrer"
          title={DIMENSION_META.referrer.title}
          icon={DIMENSION_META.referrer.icon}
          rows={dimensionRowsOf(s, "referrer")}
        />
        <BreakdownSection
          dimension={extraDimension.key}
          title={extraDimension.title}
          icon={extraDimension.icon}
          rows={dimensionRowsOf(s, extraDimension.key)}
          hasUnique={extraDimension.key !== "bots"}
        />
        <div className="lg:col-span-2">
          <BreakdownSection
            dimension="country"
            title={DIMENSION_META.country.title}
            icon={DIMENSION_META.country.icon}
            rows={dimensionRowsOf(s, "country")}
            map
            limit={8}
            panelClassName="h-80"
          />
        </div>
      </div>

      {/* Exports + the visitor-shaped CTA */}
      <div className="mt-12 flex flex-col gap-5 border-border/60 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
        <ExportRow
          alias={link.alias}
          generation={generation}
          password={password || null}
          passwordProtected={link.password_protected}
        />
        <Button asChild variant="outline" size="sm">
          <Link href="/">Make your own short link</Link>
        </Button>
      </div>
    </div>
  )
}

/**
 * Export stays on the backend; this row only links to it. Legacy exports
 * accept the password as a form POST — never as a query param. v2 exports
 * ride the public scope=anon API; password-gated v2 links skip the row
 * until the backend grows password support there (thoughts doc §6).
 */
function ExportRow({
  alias,
  generation,
  password,
  passwordProtected,
}: {
  alias: string
  generation: PublicStats["generation"]
  password: string | null
  passwordProtected: boolean
}) {
  if (generation === "v2" && passwordProtected) return <span />
  const linkClass =
    "font-mono text-muted-foreground text-xs uppercase underline-offset-4 transition-colors duration-150 hover:text-foreground hover:underline"
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <span className="label-mono text-muted-foreground/70">export</span>
      {EXPORT_FORMATS.map((fmt) =>
        generation === "v1" ? (
          passwordProtected ? (
            <form
              key={fmt}
              method="POST"
              action={`/export/${encodeURIComponent(alias)}/${fmt}`}
              className="contents"
            >
              <input type="hidden" name="password" value={password ?? ""} />
              <button type="submit" className={linkClass}>
                {fmt}
              </button>
            </form>
          ) : (
            <a
              key={fmt}
              href={`/export/${encodeURIComponent(alias)}/${fmt}`}
              className={linkClass}
            >
              {fmt}
            </a>
          )
        ) : (
          <a
            key={fmt}
            href={`/api/v1/export?scope=anon&short_code=${encodeURIComponent(alias)}&format=${fmt}`}
            className={linkClass}
          >
            {fmt}
          </a>
        )
      )}
    </div>
  )
}

function PasswordGate({
  code,
  draft,
  onDraftChange,
  visible,
  onVisibleChange,
  busy,
  error,
  onSubmit,
}: {
  code: string
  draft: string
  onDraftChange: (v: string) => void
  visible: boolean
  onVisibleChange: (v: boolean) => void
  busy: boolean
  error: string | null
  onSubmit: () => void
}) {
  return (
    <div className="mx-auto max-w-sm py-24">
      <Panel className="p-5">
        <div className="flex items-center gap-2">
          <Lock
            className="size-3.5 text-muted-foreground/70"
            strokeWidth={1.75}
          />
          <span className="label-mono text-muted-foreground">
            password protected
          </span>
        </div>
        <p className="mt-3 text-muted-foreground text-sm">
          Stats for <span className="font-mono text-foreground">/{code}</span>{" "}
          are protected by the link&apos;s password.
        </p>
        <form
          className="mt-4 flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (draft.trim()) onSubmit()
          }}
        >
          <PasswordInput
            value={draft}
            onChange={onDraftChange}
            visible={visible}
            onVisibleChange={onVisibleChange}
            placeholder="link password"
          />
          <Button type="submit" size="sm" disabled={!draft.trim() || busy}>
            View stats
          </Button>
        </form>
        {/* Fixed-height slot: the error appearing must not move the form. */}
        <p className="mt-2 h-4 text-destructive text-xs">{error ?? ""}</p>
      </Panel>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div>
      <Skeleton className="h-8 w-64" />
      <Skeleton className="mt-2 h-4 w-96 max-w-full" />
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
      <Skeleton className="mt-10 h-72 w-full" />
    </div>
  )
}
