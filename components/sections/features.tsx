"use client"

import { lazy, Suspense } from "react"
import {
  ArrowRight,
  Bell,
  Code,
  Copy,
  Globe,
  Globe2,
  GripVertical,
  LayoutDashboard,
  MapPin,
  Share2,
  Timer,
  TrendingUp,
  Webhook,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { BentoCard, BentoGrid } from "@/components/magicui/bento-grid"
import { AnimatedList } from "@/components/magicui/animated-list"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionHeading } from "@/components/shared/section-heading"
import { Band, GutterHatch } from "@/components/shared/section-shell"

const WorldMap = lazy(() => import("@/components/ui/world-map"))

interface NotificationProps {
  name: string
  description: string
  icon: LucideIcon
  time: string
}

const notifications: NotificationProps[] = [
  {
    name: "clicks.threshold",
    description: "spring/launch crossed 1,000 clicks",
    time: "2m",
    icon: TrendingUp,
  },
  {
    name: "geo.new_country",
    description: "First click from Japan detected",
    time: "1h",
    icon: Globe2,
  },
  {
    name: "webhook.delivered",
    description: "POST /hooks/slack returned 200",
    time: "3h",
    icon: Webhook,
  },
  {
    name: "link.expired",
    description: "spring-promo reached its end date",
    time: "5h",
    icon: Timer,
  },
]

/* Domain detail as a diptych — the setup (DNS records + live status) and the
   payoff (your links, on your domain). The onboarding wizard's grammar. */
const DomainDemo = () => {
  const records = [
    { type: "CNAME", name: "links", value: "spoo.me" },
    { type: "TXT", name: "_spoo", value: "spoo-verify=8f3a…" },
  ]
  const links = [
    { path: "/launch", nudge: "" },
    { path: "/docs", nudge: "ml-4" },
    { path: "/careers", nudge: "ml-1.5" },
  ]
  return (
    <div className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_top,transparent_22%,#000_100%)]">
      <div
        aria-hidden
        className="pattern-dots absolute inset-x-8 top-2 h-48 opacity-70 [mask-image:radial-gradient(ellipse_60%_90%_at_50%_40%,black,transparent)]"
      />
      <div className="relative mx-auto mt-8 flex w-full max-w-xl items-center justify-center gap-5 px-6 transition-transform duration-300 group-hover:-translate-y-1">
        <div className="border-border/70 bg-card w-72 shrink-0 overflow-hidden rounded-xl border shadow-float">
          <div className="border-border/60 flex items-center justify-between border-b px-3.5 py-2.5">
            <span className="text-foreground font-mono text-[11px] font-medium">
              links.acme.dev
            </span>
            <span className="bg-live/10 text-live flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[9px]">
              <span className="bg-live size-1 rounded-full" />
              active
            </span>
          </div>
          <div className="divide-border/60 divide-y">
            {records.map((r) => (
              <div
                key={r.type}
                className="flex items-center gap-3 px-3.5 py-2 font-mono text-[10px]"
              >
                <span className="text-muted-foreground/70 w-11 shrink-0">{r.type}</span>
                <span className="text-foreground/90 w-10 shrink-0">{r.name}</span>
                <span className="text-muted-foreground flex-1 truncate">{r.value}</span>
                <Copy className="text-muted-foreground/40 size-3 shrink-0" strokeWidth={1.75} />
              </div>
            ))}
            <div className="text-muted-foreground/70 flex items-center gap-3 px-3.5 py-2 font-mono text-[10px]">
              <span className="w-11 shrink-0">SSL</span>
              <span>auto · issued mar 12</span>
            </div>
          </div>
        </div>
        <ArrowRight
          className="text-muted-foreground/50 hidden size-4 shrink-0 sm:block"
          strokeWidth={1.75}
        />
        <div className="hidden flex-col gap-1.5 sm:flex">
          {links.map((l) => (
            <div
              key={l.path}
              className={`border-border/70 bg-card w-fit rounded-lg border px-2.5 py-1.5 font-mono text-[10px] shadow-float-sm ${l.nudge}`}
            >
              <span className="text-foreground font-medium">links.acme.dev</span>
              <span className="text-muted-foreground">{l.path}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* The unfurl you control — tag chips above, the resulting Discord-anatomy
   embed below (same anatomy as the dashboard's MetaPreview, fed fixtures). */
const MetaTagsDemo = () => {
  return (
    <div className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_top,transparent_22%,#000_100%)]">
      <div
        aria-hidden
        className="pattern-dots absolute inset-x-6 top-2 h-44 opacity-70 [mask-image:radial-gradient(ellipse_70%_90%_at_50%_35%,black,transparent)]"
      />
      <div className="relative mx-auto mt-7 flex w-fit flex-col items-center gap-2.5 transition-transform duration-300 group-hover:-translate-y-1">
        <div className="flex items-center gap-1.5 font-mono text-[9px]">
          <span className="border-border/60 bg-card text-muted-foreground rounded-md border px-1.5 py-0.5">
            og:title
          </span>
          <span className="border-border/60 bg-card text-muted-foreground rounded-md border px-1.5 py-0.5">
            og:image
          </span>
          <span className="border-border/60 bg-card text-muted-foreground flex items-center gap-1 rounded-md border px-1.5 py-0.5">
            <span className="bg-brand size-1.5 rounded-full" />
            theme
          </span>
        </div>
        <div className="flex w-56 overflow-hidden rounded-[4px] bg-[#f2f3f5] shadow-float dark:bg-[#2b2d31]">
          <div className="bg-brand w-1 shrink-0" />
          <div className="min-w-0 flex-1 space-y-1 p-2.5 pl-2">
            <p className="text-[9px] text-neutral-500 dark:text-neutral-400">spoo.me</p>
            <p className="truncate text-[11px] font-semibold text-[#006ce7] dark:text-[#00a8fc]">
              Spring launch, everything new
            </p>
            <p className="line-clamp-1 text-[10px] text-neutral-700 dark:text-neutral-300">
              Release notes, demos, and the changelog.
            </p>
            {/* og:image — logo-on-field, the shape real brand og images take */}
            <div className="flex h-16 items-center justify-center overflow-hidden rounded bg-neutral-200/70 dark:bg-neutral-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo-black.png"
                alt=""
                className="h-5 w-auto opacity-80 dark:hidden"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo-white.png"
                alt=""
                className="hidden h-5 w-auto opacity-80 dark:block"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* Origins and rules, no journeys — the dotted world as backdrop, the routing
   table as the artifact. The catch-all is spelled out, arrows share a column
   (paths sit in a fixed-width mono slot so every → lands on the same x). */
const GEO_RULES = [
  { code: "FR", flag: "fr", path: "/shop-fr" },
  { code: "US", flag: "us", path: "/shop-us" },
  { code: "DE", flag: "de", path: "/shop-de" },
]

const GeoDemo = () => {
  return (
    <div className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_top,transparent_25%,#000_100%)]">
      <div className="absolute inset-x-2 top-1 opacity-80">
        <Suspense fallback={<Skeleton className="aspect-[2/1] w-full rounded-lg" />}>
          <WorldMap dots={[]} />
        </Suspense>
        {/* origin dots for the rule countries: US, FR, DE */}
        <span
          aria-hidden
          className="bg-foreground/50 absolute top-[28%] left-[23%] size-1.5 rounded-full"
        />
        <span
          aria-hidden
          className="bg-foreground/50 absolute top-[23%] left-[50.5%] size-1.5 rounded-full"
        />
        <span
          aria-hidden
          className="bg-foreground/50 absolute top-[20.5%] left-[54%] size-1.5 rounded-full"
        />
      </div>
      <div className="relative mx-auto mt-16 w-60 max-w-[calc(100%-3rem)]">
        <div className="border-border/70 bg-card overflow-hidden rounded-lg border font-mono text-[10px] shadow-float transition-transform duration-300 group-hover:-translate-y-1">
          <div className="divide-border/60 divide-y">
            {GEO_RULES.map((r) => (
              <div key={r.code} className="flex items-center gap-2 px-3 py-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://flagcdn.com/w40/${r.flag}.png`}
                  alt=""
                  loading="lazy"
                  className="h-2.5 w-3.5 rounded-[2px] object-cover"
                />
                <span className="text-foreground/90">{r.code}</span>
                <span className="ml-auto flex items-center gap-2">
                  <span className="text-muted-foreground/50">→</span>
                  <span className="text-foreground w-[8ch] font-medium">{r.path}</span>
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2 px-3 py-2">
              <Globe2 className="text-muted-foreground size-3.5 shrink-0" strokeWidth={1.75} />
              <span className="text-muted-foreground">everywhere else</span>
              <span className="ml-auto flex items-center gap-2">
                <span className="text-muted-foreground/50">→</span>
                <span className="text-foreground w-[8ch] font-medium">/shop</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* The widget board mid-edit — real tile shapes plus the grid engine's own
   drag grammar: dashed drop target, lifted card. One glance says movable. */
const DashboardDemo = () => {
  const bars = [40, 65, 35, 80, 55, 70]
  return (
    <div className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_top,transparent_22%,#000_100%)]">
      <div
        aria-hidden
        className="pattern-dots absolute inset-x-8 top-2 h-44 opacity-60 [mask-image:radial-gradient(ellipse_55%_90%_at_50%_35%,black,transparent)]"
      />
      <div className="relative mx-auto mt-7 grid w-full max-w-xl auto-rows-[4.25rem] grid-cols-3 gap-2 px-8">
        <div className="border-border/70 bg-card rounded-lg border p-2.5 shadow-float-sm">
          <div className="label-mono text-muted-foreground text-[9px]">clicks</div>
          <div className="text-foreground mt-1.5 font-mono text-lg leading-none font-semibold tracking-tight tabular-nums">
            12.4k
          </div>
        </div>
        <div className="border-border/70 bg-card flex items-end gap-1.5 rounded-lg border p-2.5 shadow-float-sm">
          {bars.map((h, i) => (
            <span
              key={i}
              className={`w-full rounded-[2px] ${i === 3 ? "bg-foreground/45" : "bg-foreground/15"}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="border-border/70 bg-card flex flex-col justify-center gap-1.5 rounded-lg border p-2.5 shadow-float-sm">
          {[
            { w: "78%", label: "chrome" },
            { w: "46%", label: "safari" },
          ].map((row) => (
            <div key={row.label} className="relative h-[18px] overflow-hidden rounded-[3px]">
              <span
                className="bg-muted absolute inset-y-0 left-0 rounded-[3px]"
                style={{ width: row.w }}
              />
              <span className="text-muted-foreground relative block truncate pl-1.5 font-mono text-[9px] leading-[18px]">
                {row.label}
              </span>
            </div>
          ))}
        </div>
        {/* drop target — the grid engine's placeholder, verbatim grammar */}
        <div className="rounded-lg border-[1.5px] border-dashed border-foreground/30 bg-foreground/[0.04]" />
        {/* the tile being dragged — settles square on hover */}
        <div className="border-border/70 bg-card relative translate-x-2 -rotate-2 rounded-lg border p-2.5 shadow-float transition-transform duration-300 group-hover:translate-x-0 group-hover:rotate-0">
          <div className="flex items-center gap-1">
            <GripVertical className="text-muted-foreground/50 size-3" strokeWidth={1.75} />
            <span className="label-mono text-muted-foreground text-[9px]">devices</span>
          </div>
          <div className="mt-2 flex items-end gap-1.5">
            {[55, 30, 70, 45].map((h, i) => (
              <span
                key={i}
                className="bg-foreground/15 w-full rounded-[2px]"
                style={{ height: `${h / 3.5}px` }}
              />
            ))}
          </div>
        </div>
        <div className="border-border/70 bg-card rounded-lg border p-2.5 shadow-float-sm">
          <svg viewBox="0 0 64 24" className="h-full w-full" preserveAspectRatio="none">
            <polyline
              points="0,20 10,16 20,17 30,10 40,12 52,5 64,8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.25"
              className="text-foreground/40"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </div>
    </div>
  )
}

/* Request and response, bare panel — the wire itself, no window chrome. */
const ApiDemo = () => {
  return (
    <div className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_top,transparent_25%,#000_100%)]">
      <div
        aria-hidden
        className="pattern-dots absolute inset-x-8 top-2 h-40 opacity-70 [mask-image:radial-gradient(ellipse_60%_90%_at_50%_35%,black,transparent)]"
      />
      <div className="relative mx-auto mt-8 w-full max-w-[20rem] px-4">
        <div className="border-border/70 bg-card overflow-hidden rounded-xl border font-mono text-[10px] leading-relaxed whitespace-nowrap shadow-float transition-transform duration-300 group-hover:-translate-y-1">
          <div className="px-3.5 py-2.5">
            <div>
              <span className="text-emerald-600/90 dark:text-emerald-400/90">POST</span>
              <span className="text-foreground/90"> /api/shorten</span>
            </div>
            <div className="text-muted-foreground/60">authorization: spoo_8f3a…</div>
            <div className="text-muted-foreground">
              {'{ "url": "https://acme.dev/spring" }'}
            </div>
          </div>
          <div className="border-border/60 bg-muted/30 border-t px-3.5 py-2.5">
            <span className="text-live">200</span>
            <span className="text-muted-foreground"> · </span>
            <span className="text-muted-foreground">{'{ "short_url": "'}</span>
            <span className="text-foreground font-medium">spoo.me/spring</span>
            <span className="text-muted-foreground">{'" }'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

const Notification = ({ name, description, icon: Icon, time }: NotificationProps) => {
  return (
    <figure className="border-border/60 bg-card/80 relative w-full max-w-[300px] cursor-pointer overflow-hidden rounded-xl border p-3 shadow-float-sm backdrop-blur-sm transition-all duration-200 hover:scale-[102%]">
      <div className="flex flex-row items-center gap-3">
        <div className="border-border/60 bg-muted/40 flex size-9 shrink-0 items-center justify-center rounded-lg border">
          <Icon className="text-foreground size-4" />
        </div>
        <div className="flex min-w-0 flex-col overflow-hidden">
          <figcaption className="flex items-baseline gap-2 whitespace-pre">
            <code className="text-foreground font-mono text-xs font-medium">{name}</code>
            <span className="text-muted-foreground/60 font-mono text-[10px]">{time}</span>
          </figcaption>
          <p className="text-muted-foreground truncate text-xs">{description}</p>
        </div>
      </div>
    </figure>
  )
}

const NotificationsList = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center p-4 overflow-hidden scale-90 border-none transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_0%,#000_30%)] group-hover:scale-100">
      <AnimatedList delay={2000}>
        {notifications.map((item, idx) => (
          <Notification key={idx} {...item} />
        ))}
      </AnimatedList>
    </div>
  )
}

export function Features() {
  /* Six cells, three tiers: the flagship pair on the diagonal (Domains,
     Dashboard), their flanks (Meta-Tags, Geo), and a quieter half/half base
     row (API teaser pointing at the developers section, Alerts). Every cell
     is a shipped-or-imminent feature without a dedicated section of its own;
     Analytics and the full API story have their own chapters. */
  const features = [
    {
      Icon: Globe,
      name: "Custom Domains",
      description:
        "Bring your own domain, apex or subdomain. Guided DNS setup, automatic SSL, and every link on your brand.",
      className: "col-span-1 lg:col-span-4",
      background: <DomainDemo />,
    },
    {
      Icon: Share2,
      name: "Custom Meta-Tags",
      description:
        "Control how links unfurl: title, description, image, and theme color. Per link.",
      className: "col-span-1 lg:col-span-2",
      background: <MetaTagsDemo />,
    },
    {
      Icon: MapPin,
      name: "Geo-Targeting",
      description:
        "One link, the right destination. Route visitors by country, with a fallback for everyone else.",
      className: "col-span-1 lg:col-span-2",
      background: <GeoDemo />,
    },
    {
      Icon: LayoutDashboard,
      name: "Customizable Dashboard",
      description:
        "Your analytics, your board. Add, drag, and resize widgets, and pick the metrics and chart inks each one shows.",
      className: "col-span-1 lg:col-span-4",
      background: <DashboardDemo />,
    },
    {
      Icon: Code,
      name: "Developer API",
      description:
        "Everything here is scriptable: one REST API, official SDKs, live code samples below.",
      className: "col-span-1 lg:col-span-3",
      background: <ApiDemo />,
    },
    {
      Icon: Bell,
      name: "Analytics Alerts",
      description:
        "Know the moment a link expires, spikes, or lands its first click from a new country.",
      className: "col-span-1 lg:col-span-3",
      background: <NotificationsList />,
    },
  ]

  return (
    <>
      {/* Header band */}
      <Band className="px-5 py-20 sm:px-9 sm:py-24">
        <SectionHeading
          num="02"
          caption="Features"
          title={
            <>
              Everything you need.{" "}
              <span className="text-muted-foreground italic font-serif font-normal">
                Nothing you don&apos;t.
              </span>
            </>
          }
          description="Built by developers shipping production traffic. Every feature has a reason it exists."
        />
      </Band>

      {/* Bento fused into the lattice — cells share hairlines, edge-to-rail */}
      <Band rule>
        <GutterHatch />
        <BentoGrid className="grid-cols-1 lg:grid-cols-6 auto-rows-[18rem]">
          {features.map((feature, index) => (
            <BentoCard key={index} index={index} {...feature} />
          ))}
        </BentoGrid>
      </Band>
    </>
  )
}
