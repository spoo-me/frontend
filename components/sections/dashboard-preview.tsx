"use client"

import * as React from "react"
import { motion } from "motion/react"
import {
  ArrowUpRight,
  BarChart3,
  Bell,
  Filter,
  Globe2,
  Home,
  Key,
  LineChart,
  Link2,
  QrCode,
  Search,
  Users,
  Webhook,
  Zap,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { SectionHeading } from "@/components/shared/section-heading"
import { Band } from "@/components/shared/section-shell"
import { siteConfig } from "@/lib/site-config"
import { cn } from "@/lib/utils"

export function DashboardPreview() {
  return (
    <>
      {/* Header band */}
      <Band className="px-5 py-20 sm:px-9 sm:py-24">
        <SectionHeading
          num="01"
          caption="Analytics"
          title={
            <>
              Click insights without{" "}
              <span className="text-muted-foreground italic [font-family:var(--font-serif)] font-normal">
                a separate tool.
              </span>
            </>
          }
          description="A real analytics product, included free in every link. No third-party scripts, no cookie banners. Yours by default."
        />
      </Band>

      {/* Mock band — the dashboard pours under the next rule, hard-cropped */}
      <Band rule className="overflow-hidden px-5 pt-10 sm:px-12 sm:pt-14">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative -mb-20 sm:-mb-28"
        >
          <DashboardMock />
        </motion.div>
      </Band>

      <Callouts />
    </>
  )
}

function DashboardMock() {
  return (
    <div className="border-border/70 bg-card/40 shadow-card relative overflow-hidden rounded-2xl border dark:shadow-none dark:[box-shadow:inset_0_1px_0_rgba(255,255,255,0.04)]">
      {/* Browser chrome */}
      <div className="border-border/60 bg-muted/30 flex items-center gap-3 border-b px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-red-500/60" />
          <span className="size-2.5 rounded-full bg-yellow-500/60" />
          <span className="size-2.5 rounded-full bg-green-500/60" />
        </div>
        <div className="border-border/60 bg-background/60 text-muted-foreground ml-3 hidden w-full max-w-md items-center gap-2 rounded-md border px-3 py-1 font-mono text-[11px] sm:flex">
          <span className="text-muted-foreground/60">app.spoo.me</span>
          <span className="text-muted-foreground/40">/</span>
          <span>dashboard</span>
          <span className="text-muted-foreground/40">/</span>
          <span className="text-foreground">launch-campaign</span>
        </div>
        <div className="ml-auto hidden items-center gap-1 sm:flex">
          {["7d", "30d", "all"].map((k, i) => (
            <span
              key={k}
              className={cn(
                "rounded-md px-2 py-0.5 font-mono text-[10px]",
                i === 1
                  ? "bg-foreground text-background"
                  : "border-border/60 text-muted-foreground border",
              )}
            >
              {k}
            </span>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr]">
        <Sidebar />
        <Main />
      </div>
    </div>
  )
}

function Sidebar() {
  const workspace = [
    { icon: Home, label: "Overview" },
    { icon: Link2, label: "Links", count: "1,284", active: true },
    { icon: BarChart3, label: "Analytics" },
    { icon: Users, label: "Audiences" },
    { icon: QrCode, label: "QR codes" },
  ]
  const developer = [
    { icon: Key, label: "API keys" },
    { icon: Webhook, label: "Webhooks" },
    { icon: Filter, label: "Filters" },
  ]
  return (
    <aside className="border-border/60 hidden flex-col gap-6 border-r p-5 lg:flex">
      <NavGroup title="Workspace" items={workspace} />
      <NavGroup title="Developer" items={developer} />
      <div className="mt-auto">
        <div className="border-border/60 flex items-center gap-2 rounded-md border px-2 py-1.5">
          <Search className="text-muted-foreground size-3" />
          <span className="text-muted-foreground/60 font-mono text-[10px]">
            search…
          </span>
          <span className="text-muted-foreground/50 ml-auto rounded bg-muted/60 px-1 font-mono text-[10px]">
            ⌘K
          </span>
        </div>
      </div>
    </aside>
  )
}

function NavGroup({
  title,
  items,
}: {
  title: string
  items: Array<{
    icon: React.ElementType
    label: string
    count?: string
    active?: boolean
  }>
}) {
  return (
    <div>
      <div className="text-muted-foreground/60 mb-2 px-2 font-mono text-[10px] uppercase tracking-[0.18em]">
        {title}
      </div>
      <ul className="flex flex-col gap-0.5">
        {items.map((it) => (
          <li
            key={it.label}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs",
              it.active
                ? "bg-muted/70 text-foreground border-border/60 border"
                : "text-muted-foreground hover:bg-muted/40",
            )}
          >
            <it.icon className="size-3.5" />
            <span>{it.label}</span>
            {it.count && (
              <span className="text-muted-foreground/70 ml-auto tabular-nums">
                · {it.count}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function Main() {
  return (
    <div className="flex flex-col gap-6 p-5 sm:p-7">
      {/* Title row */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
            spring
            <span className="text-muted-foreground italic [font-family:var(--font-serif)] font-normal">
              /launch
            </span>
          </h3>
          <div className="text-muted-foreground/80 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px]">
            <span>spoo.me/spring</span>
            <span className="text-muted-foreground/40">·</span>
            <span>created mar 14</span>
            <span className="text-muted-foreground/40">·</span>
            <span>12 filters active</span>
          </div>
        </div>
        <div className="text-muted-foreground flex items-center gap-2 font-mono text-[11px]">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
          </span>
          live · 3 viewing now
          <Bell className="text-muted-foreground/60 size-3.5" />
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Total clicks" value="142,308" delta="↑ 24.1% vs prev" />
        <Kpi label="Unique visitors" value="98,442" delta="↑ 18.6%" />
        <Kpi label="Avg / day" value="4,743" delta="▲ peak 11.2k" muted />
        <Kpi label="Conversion" value="7.4%" delta="↑ 1.2pp" />
      </div>

      {/* Chart */}
      <Chart />

      {/* Bottom panels */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Panel
          title="Top countries"
          rows={[
            { label: "United States", value: 25_704, pct: 1, flag: "us" },
            { label: "Germany",       value: 17_136, pct: 0.66, flag: "de" },
            { label: "India",         value: 14_688, pct: 0.57, flag: "in" },
            { label: "Brazil",        value: 11_628, pct: 0.45, flag: "br" },
            { label: "Japan",         value: 8_568,  pct: 0.33, flag: "jp" },
          ]}
        />
        <Panel
          title="Referrers"
          rows={[
            { label: "twitter.com",          value: 16_416, pct: 1,    domain: "twitter.com" },
            { label: "news.ycombinator.com", value: 11_664, pct: 0.71, domain: "news.ycombinator.com" },
            { label: "direct",               value: 7_776,  pct: 0.47 },
            { label: "github.com",           value: 4_752,  pct: 0.29, domain: "github.com" },
            { label: "reddit.com",           value: 2_592,  pct: 0.16, domain: "reddit.com" },
          ]}
        />
      </div>
    </div>
  )
}

function Kpi({
  label,
  value,
  delta,
  muted,
}: {
  label: string
  value: string
  delta: string
  muted?: boolean
}) {
  return (
    <div className="border-border/60 bg-background/40 rounded-xl border p-4">
      <div className="text-muted-foreground/70 font-mono text-[10px] uppercase tracking-[0.16em]">
        {label}
      </div>
      <div className="text-foreground mt-2 text-2xl font-semibold tabular-nums sm:text-3xl">
        {value}
      </div>
      <div
        className={cn(
          "mt-1 font-mono text-[11px] tabular-nums",
          muted ? "text-muted-foreground" : "text-emerald-500/90",
        )}
      >
        {delta}
      </div>
    </div>
  )
}

function Chart() {
  // Simulated path: clicks by hour
  const points = [
    8, 6, 7, 12, 10, 14, 18, 22, 30, 36, 44, 52, 58, 60, 66, 72, 80, 88, 92, 86,
    78, 64, 48, 32,
  ]
  const max = Math.max(...points)
  const w = 800
  const h = 220
  const stepX = w / (points.length - 1)
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${i * stepX} ${h - (p / max) * (h - 20)}`)
    .join(" ")
  const area = `${path} L ${w} ${h} L 0 ${h} Z`
  const peakIdx = points.indexOf(max)
  const peakX = peakIdx * stepX
  const peakY = h - (max / max) * (h - 20)

  return (
    <div className="border-border/60 bg-background/40 overflow-hidden rounded-xl border">
      <div className="border-border/60 flex items-center justify-between border-b px-4 py-2.5">
        <h4 className="text-foreground text-sm font-semibold">Clicks by hour</h4>
        <div className="flex items-center gap-1 font-mono text-[10px]">
          {["Clicks", "Unique", "Bots", "Geo"].map((t, i) => (
            <span
              key={t}
              className={cn(
                "rounded-md px-2 py-0.5",
                i === 0
                  ? "bg-muted/70 text-foreground border-border/60 border"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="relative px-4 pt-4 pb-2">
        <svg
          viewBox={`0 0 ${w} ${h + 24}`}
          preserveAspectRatio="none"
          className="h-[180px] w-full sm:h-[220px]"
        >
          <defs>
            <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.16" />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {/* Gridlines */}
          {[0.25, 0.5, 0.75].map((g) => (
            <line
              key={g}
              x1={0}
              x2={w}
              y1={h * g}
              y2={h * g}
              stroke="currentColor"
              className="text-border/40"
              strokeDasharray="3 4"
              strokeWidth={1}
            />
          ))}
          <motion.path
            d={area}
            fill="url(#chartFill)"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
          />
          <motion.path
            d={path}
            fill="none"
            stroke="var(--brand)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.4, ease: "easeInOut" }}
          />
          {/* Peak marker */}
          <circle cx={peakX} cy={peakY} r={4.5} fill="var(--brand)" />
          <circle cx={peakX} cy={peakY} r={9} fill="var(--brand)" opacity={0.2} />
          {/* X axis */}
          {[0, 6, 12, 18, 23].map((hr) => (
            <text
              key={hr}
              x={hr * stepX}
              y={h + 18}
              textAnchor={hr === 0 ? "start" : hr === 23 ? "end" : "middle"}
              className="fill-muted-foreground font-mono"
              fontSize={10}
            >
              {String(hr).padStart(2, "0")}:00
            </text>
          ))}
        </svg>
      </div>
    </div>
  )
}

type PanelRow = {
  label: string
  value: number
  pct: number
  flag?: string
  domain?: string
}

function Panel({
  title,
  rows,
  accent = "foreground",
}: {
  title: string
  rows: PanelRow[]
  accent?: "foreground" | "brand"
}) {
  return (
    <div className="border-border/60 bg-background/40 overflow-hidden rounded-xl border">
      <div className="border-border/60 flex items-center justify-between border-b px-4 py-2.5">
        <h4 className="text-foreground text-sm font-semibold">{title}</h4>
        <a className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-[11px]">
          view all <ArrowUpRight className="size-3" />
        </a>
      </div>
      <ul className="flex flex-col gap-2 p-4">
        {rows.map((r, i) => (
          <li key={r.label} className="flex items-center gap-3 text-xs">
            <RowIcon row={r} />
            <span className="text-muted-foreground w-28 shrink-0 truncate font-mono">
              {r.label}
            </span>
            <div className="bg-muted/40 relative h-1.5 flex-1 overflow-hidden rounded-full">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${r.pct * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: i * 0.07, ease: "easeOut" }}
                className={cn(
                  "h-full rounded-full",
                  accent === "brand" ? "bg-brand/70" : "bg-foreground/80",
                )}
              />
            </div>
            <span className="text-foreground w-14 text-right font-mono tabular-nums">
              {r.value.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function RowIcon({ row }: { row: PanelRow }) {
  if (row.flag) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://flagcdn.com/w40/${row.flag}.png`}
        srcSet={`https://flagcdn.com/w80/${row.flag}.png 2x`}
        alt={row.label}
        loading="lazy"
        className="border-border/60 h-3.5 w-5 shrink-0 rounded-[2px] border object-cover"
      />
    )
  }
  if (row.domain) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`https://www.google.com/s2/favicons?domain=${row.domain}&sz=64`}
        alt=""
        loading="lazy"
        className="bg-background/60 size-4 shrink-0 rounded-sm"
      />
    )
  }
  return (
    <span className="border-border/60 bg-muted/40 inline-flex size-4 shrink-0 items-center justify-center rounded-sm border">
      <span className="bg-muted-foreground/60 size-1 rounded-full" />
    </span>
  )
}

function Callouts() {
  const callouts = [
    {
      icon: LineChart,
      title: "Per-link dashboards",
      description:
        "Open any short link, get a complete time series: clicks, uniques, conversion windows.",
    },
    {
      icon: Filter,
      title: "Slice by anything",
      description:
        "Country, city, device, browser, OS, referrer, UTM. Combine arbitrarily deep.",
    },
    {
      icon: Globe2,
      title: "Geo heatmaps",
      description:
        "World-level click distribution out of the box. Ideal for global launches.",
    },
    {
      icon: Zap,
      title: "Live · sub-second",
      description:
        "Streaming counters, no polling. Hot data warm in seconds, history forever.",
    },
  ]
  return (
    <>
      {/* Callout cells — shared-hairline lattice, one cell per claim */}
      <Band rule>
        <div className="bg-border/60 grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-4">
          {callouts.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className="bg-background flex flex-col gap-3 p-6 sm:p-7"
            >
              <span className="border-border/60 bg-muted/30 text-foreground inline-flex size-8 shrink-0 items-center justify-center rounded-md border">
                <c.icon className="size-3.5" />
              </span>
              <div>
                <h4 className="text-foreground text-sm font-semibold tracking-tight">
                  {c.title}
                </h4>
                <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                  {c.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </Band>

      {/* Table-footer row */}
      <Band rule className="flex items-center justify-between px-5 py-4 sm:px-9">
        <span className="label-mono text-muted-foreground/60 hidden sm:block">
          app.spoo.me
        </span>
        <Button asChild variant="outline" size="sm">
          <a href={siteConfig.app.dashboard} target="_blank" rel="noreferrer">
            See live demo
            <ArrowUpRight className="size-3.5" data-icon="inline-end" />
          </a>
        </Button>
      </Band>
    </>
  )
}
