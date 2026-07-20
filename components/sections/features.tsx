"use client"

import { lazy, Suspense, useEffect, useRef, useState } from "react"
import type { LucideIcon } from "lucide-react"
import {
  ArrowUpRight,
  FlaskConical,
  Globe2,
  Lock,
  Share2,
  Timer,
  TrendingUp,
  Webhook,
} from "lucide-react"
import {
  AnimatePresence,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react"

import { AnimatedList } from "@/components/magicui/animated-list"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionHeading } from "@/components/shared/section-heading"
import { Band } from "@/components/shared/section-shell"
import {
  MarkBolt,
  MarkClover,
  MarkPlay,
  MarkVenn,
} from "@/components/shared/brand-marks"
import { siteConfig } from "@/lib/site-config"

const WorldMap = lazy(() => import("@/components/ui/world-map"))

/* The payoff, not the plumbing: one short link whose brand identity
   rotates — logomark + domain morph while the path stays put. Same
   fictional brand universe as the onboarding wizard (shared marks), so
   the product world stays coherent. Apex domains lead, subdomains follow.
   The roster below uses the geo pins' grammar: hover moves the sticky
   spotlight and stops the auto-cycle. */
const BRANDS = [
  { id: "forma", domain: "forma.io", mark: MarkVenn },
  { id: "vega", domain: "vega.tv", mark: MarkPlay },
  { id: "boltlab", domain: "go.boltlab.co", mark: MarkBolt },
  { id: "clove", domain: "links.clove.app", mark: MarkClover },
]

const DOMAIN_CYCLE_MS = 2800

const DomainDemo = () => {
  const [bi, setBi] = useState(0)
  const [manual, setManual] = useState(false)
  const reduced = useReducedMotion()
  const rootRef = useRef<HTMLDivElement>(null)
  const inView = useInView(rootRef, { amount: 0.35 })

  useEffect(() => {
    if (reduced || manual || !inView) return
    const t = setTimeout(
      () => setBi((i) => (i + 1) % BRANDS.length),
      DOMAIN_CYCLE_MS
    )
    return () => clearTimeout(t)
  }, [bi, manual, reduced, inView])

  const brand = BRANDS[bi]

  return (
    <div ref={rootRef} className="absolute inset-0 overflow-hidden">
      <div
        aria-hidden
        className="pattern-dots absolute inset-x-8 inset-y-6 opacity-70 [mask-image:radial-gradient(ellipse_65%_80%_at_50%_45%,black,transparent)]"
      />
      <div className="relative flex h-full flex-col items-center justify-center gap-8">
        {/* The link, wearing whoever owns it */}
        <motion.div
          layout
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="flex h-14 items-center rounded-2xl border border-border/70 bg-card px-5 shadow-float"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={brand.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3"
            >
              <brand.mark className="size-5" />
              <span className="font-medium font-mono text-base text-foreground sm:text-lg">
                {brand.domain}
              </span>
            </motion.span>
          </AnimatePresence>
          <span className="font-mono text-base text-muted-foreground sm:text-lg">
            /launch
          </span>
        </motion.div>

        {/* The roster — hover hands over the link */}
        <div className="flex items-center gap-2">
          {BRANDS.map((b, i) => (
            <button
              key={b.id}
              type="button"
              aria-label={`Show ${b.domain}`}
              onMouseEnter={() => {
                setManual(true)
                setBi(i)
              }}
              onFocus={() => {
                setManual(true)
                setBi(i)
              }}
              onClick={() => {
                setManual(true)
                setBi(i)
              }}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-full border bg-card px-2 font-mono text-[11px] transition-colors duration-200",
                i === bi
                  ? "border-border text-foreground"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              )}
            >
              <b.mark className="size-3" />
              {b.id}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* The alerts feed, restored from the bento: real event names, real
   payload shapes, sliding in on the AnimatedList cadence. */
interface NotificationProps {
  name: string
  description: string
  icon: LucideIcon
  time: string
  /* Event-category ink: duotone tile, tinted hairline, colored glyph. */
  tint: string
}

const notifications: NotificationProps[] = [
  {
    name: "clicks.threshold",
    description: "spring/launch crossed 1,000 clicks",
    time: "2m",
    icon: TrendingUp,
    tint: "#10B981",
  },
  {
    name: "geo.new_country",
    description: "First click from Japan detected",
    time: "1h",
    icon: Globe2,
    tint: "#0EA5E9",
  },
  {
    name: "webhook.delivered",
    description: "POST /hooks/slack returned 200",
    time: "3h",
    icon: Webhook,
    tint: "#F59E0B",
  },
  {
    name: "link.expired",
    description: "spring-promo reached its end date",
    time: "5h",
    icon: Timer,
    tint: "#F43F5E",
  },
]

const Notification = ({
  name,
  description,
  icon: Icon,
  time,
  tint,
}: NotificationProps) => {
  return (
    <figure className="relative w-full max-w-[300px] cursor-pointer overflow-hidden rounded-xl border border-border/60 bg-card/80 p-3 shadow-float-sm backdrop-blur-sm transition-all duration-200 hover:scale-[102%]">
      <div className="flex flex-row items-center gap-3">
        <div
          className="flex size-9 shrink-0 items-center justify-center rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
          style={{
            backgroundColor: `color-mix(in oklab, ${tint} 14%, transparent)`,
            border: `1px solid color-mix(in oklab, ${tint} 32%, transparent)`,
          }}
        >
          <Icon className="size-4" style={{ color: tint }} />
        </div>
        <div className="flex min-w-0 flex-col overflow-hidden">
          <figcaption className="flex items-baseline gap-2 whitespace-pre">
            <code className="font-medium font-mono text-foreground text-xs">
              {name}
            </code>
            <span className="font-mono text-[10px] text-muted-foreground/60">
              {time}
            </span>
          </figcaption>
          <p className="truncate text-muted-foreground text-xs">
            {description}
          </p>
        </div>
      </div>
    </figure>
  )
}

const NotificationsList = () => {
  /* The feed holds until it's actually watched — mounting AnimatedList
     early would burn its entrance off-screen. */
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  return (
    <div
      ref={ref}
      className="absolute inset-0 flex scale-90 flex-col items-center overflow-hidden border-none p-4 transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_0%,#000_30%)] group-hover:scale-100"
    >
      {inView ? (
        <AnimatedList delay={2000}>
          {notifications.map((item, idx) => (
            <Notification key={idx} {...item} />
          ))}
        </AnimatedList>
      ) : null}
    </div>
  )
}

/* Routing rules as pins on the map itself. One pin is active (sticky),
   hover or tap moves the spotlight; the active pin unfolds to show where
   that country goes. The fallback reads as a quiet line, not a box. */
/* `opens` flips the unfold direction for pins near the right rail. */
const GEO_RULES = [
  { code: "DE", flag: "de", path: "/shop-de", top: "20.5%", left: "53%" },
  { code: "US", flag: "us", path: "/shop-us", top: "29%", left: "23%" },
  {
    code: "JP",
    flag: "jp",
    path: "/shop-jp",
    top: "30%",
    left: "86%",
    opens: "left" as const,
  },
  { code: "ZA", flag: "za", path: "/shop-za", top: "80%", left: "56%" },
]

const GeoDemo = () => {
  const [active, setActive] = useState("JP")
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-x-2 top-3">
        {/* Mask only the map; pins stay crisp even over the faded south */}
        <div className="[mask-image:linear-gradient(to_top,transparent_4%,#000_45%)]">
          <Suspense
            fallback={<Skeleton className="aspect-[2/1] w-full rounded-lg" />}
          >
            <WorldMap dots={[]} />
          </Suspense>
        </div>

        {GEO_RULES.map((r) => {
          const isActive = active === r.code
          return (
            <button
              key={r.code}
              type="button"
              aria-label={`${r.code} routes to ${r.path}`}
              onMouseEnter={() => setActive(r.code)}
              onFocus={() => setActive(r.code)}
              onClick={() => setActive(r.code)}
              className={cn("absolute", isActive ? "z-10" : "z-0")}
              style={{ top: r.top, left: r.left }}
            >
              {/* Zero-size button parked on the country: the anchor dot
                  never moves, the pill unfolds rightward above it. */}
              <span
                aria-hidden
                className={cn(
                  "absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-200",
                  isActive ? "bg-foreground/70" : "bg-foreground/40"
                )}
              />
              <span
                aria-hidden
                className="absolute -top-[14px] h-2.5 w-px bg-border"
              />
              <span
                className={cn(
                  "absolute -top-[50px] flex h-9 items-center overflow-hidden rounded-full border bg-card px-1.5 shadow-float transition-colors duration-200",
                  r.opens === "left"
                    ? "-right-[18px] flex-row-reverse"
                    : "-left-[18px]",
                  isActive ? "border-border" : "border-border/60"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://flagcdn.com/w40/${r.flag}.png`}
                  alt=""
                  loading="lazy"
                  className="size-6 shrink-0 rounded-full object-cover ring-1 ring-foreground/15"
                />
                <span
                  className={cn(
                    "overflow-hidden whitespace-nowrap font-mono text-[11px] text-foreground transition-all duration-200",
                    isActive
                      ? cn(
                          "max-w-28 opacity-100",
                          r.opens === "left" ? "pr-1.5" : "pl-1.5"
                        )
                      : "max-w-0 opacity-0"
                  )}
                >
                  {/* Arrow always points from the flag toward the path */}
                  {r.opens === "left" ? (
                    <>
                      {r.path} {"←"}
                    </>
                  ) : (
                    <>
                      {"→"} {r.path}
                    </>
                  )}
                </span>
              </span>
            </button>
          )
        })}
      </div>

      {/* The catch-all, spelled out without a box */}
      <div className="absolute inset-x-0 bottom-5 flex justify-center">
        <span className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
          <Globe2 className="size-3" strokeWidth={1.75} />
          everywhere else {"→"}{" "}
          <span className="text-foreground/80">/shop</span>
        </span>
      </div>
    </div>
  )
}

/* One flagship per band: the artifact in its own cell, copy in the other,
   sides alternating down the page. The demos are the bento's survivors —
   product-real artifacts that finally get room. */
function ProofBand({
  flip,
  headline,
  body,
  demo,
}: {
  flip?: boolean
  headline: string
  body: string
  demo: React.ReactNode
}) {
  return (
    <Band rule>
      {/* One hover scope for the whole band: the artifact swells a touch
          and the learn-more affordance fades in. Space is reserved, so
          nothing shifts. */}
      <div className="group grid gap-px bg-border lg:grid-cols-2">
        {/* Phones read the artifact first, the claim second; desktop keeps
            the alternating flip. */}
        <div
          className={cn(
            /* The pb reserve holds the hover Learn-more's floor at sm+;
               phones have no hover, so it collapses. */
            "relative order-2 flex flex-col justify-center bg-background p-7 sm:p-9 sm:pb-24",
            flip ? "lg:order-2" : "lg:order-1"
          )}
        >
          <h3 className="text-balance font-semibold text-2xl text-foreground tracking-tight sm:text-3xl">
            {headline}
          </h3>
          <p className="mt-3 max-w-md text-balance text-base text-muted-foreground">
            {body}
          </p>
          {/* Pinned to the cell floor; fades in with the band, border firms
              up under the cursor. Absolute, so nothing reflows. */}
          <a
            href={siteConfig.links.docs}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-4 left-7 hidden h-6 items-center gap-1 rounded-md border border-border/50 px-2 font-medium text-[11px] text-muted-foreground opacity-0 transition-all duration-200 hover:border-border hover:text-foreground group-hover:opacity-100 sm:inline-flex sm:bottom-5 sm:left-9"
          >
            Learn more
            <ArrowUpRight className="size-2.5" data-icon="inline-end" />
          </a>
        </div>
        <div
          className={cn(
            "order-1 bg-background",
            flip ? "lg:order-1" : "lg:order-2"
          )}
        >
          <div className="relative h-72 overflow-hidden transition-transform duration-300 ease-out group-hover:scale-[1.02] sm:h-80">
            {demo}
          </div>
        </div>
      </div>
    </Band>
  )
}

/* The long tail as a manifest: everything real, nothing demanding a demo. */
/* Five cells, one quiet row at desktop: the completeness receipt, not a
   second features section. QR and the workflow items didn't earn ink. */
const MANIFEST = [
  {
    icon: Share2,
    name: "Social previews",
    text: "Custom title, description, image, and theme color per link.",
  },
  {
    icon: Lock,
    name: "Private links",
    text: "Gate any link behind a passphrase.",
  },
  {
    icon: Timer,
    name: "Self-destruct",
    text: "Cap total clicks or set an end date. The link retires itself.",
  },
  {
    icon: FlaskConical,
    name: "A/B testing",
    text: "Split traffic across destinations by weight, scored by clicks.",
  },
]

export function Features() {
  return (
    <>
      {/* Header band */}
      <Band className="px-5 py-24 sm:px-9 sm:py-32">
        <SectionHeading
          title={
            <>
              Everything you need.{" "}
              <span className="font-normal font-serif text-muted-foreground italic">
                Nothing you don&apos;t.
              </span>
            </>
          }
          description="Built by developers shipping production traffic. Every feature has a reason it exists."
        />
      </Band>

      <ProofBand
        headline="Your brand on every link."
        body="Bring your own domain, apex or subdomain. A guided two-minute setup, and every short link speaks your name instead of ours."
        demo={<DomainDemo />}
      />
      <ProofBand
        flip
        headline="Japan sees a different destination."
        body="One short link, routed by country: send the EU to the EU store, Tokyo to the JP page, and everyone else to the fallback. The rules read like a table because they are one."
        demo={<GeoDemo />}
      />
      <ProofBand
        headline="Know the moment it spikes."
        body="A link crosses a click threshold, lands its first visit from a new country, expires, or delivers a webhook. The feed tells you before anyone asks."
        demo={<NotificationsList />}
      />

      {/* Manifest row — the rest of the toolbox at index density */}
      <Band rule>
        <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
          {MANIFEST.map((f) => (
            <div key={f.name} className="bg-background">
              <a
                href={siteConfig.links.docs}
                target="_blank"
                rel="noreferrer"
                className="group relative flex h-full flex-col p-6 pb-10 transition-colors duration-200 hover:bg-foreground/[0.02] sm:py-8"
              >
                <f.icon
                  className="size-4 text-muted-foreground transition-colors duration-200 group-hover:text-foreground"
                  strokeWidth={1.75}
                />
                <div className="label-mono mt-3 text-foreground">{f.name}</div>
                <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">
                  {f.text}
                </p>
                {/* Overlay in the bottom-right corner, which every cell
                    leaves empty: no reflow, no text collision */}
                <span className="absolute right-3 bottom-2.5 inline-flex h-[22px] items-center gap-1 rounded-md border border-border/50 px-1.5 font-medium text-[10px] text-muted-foreground opacity-0 transition-all duration-200 hover:border-border hover:text-foreground group-hover:opacity-100">
                  Learn more
                  <ArrowUpRight className="size-2.5" />
                </span>
              </a>
            </div>
          ))}
        </div>
      </Band>
    </>
  )
}
