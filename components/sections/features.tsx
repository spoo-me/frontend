"use client"

import { lazy, Suspense, useEffect, useState } from "react"
import {
  ArrowUpRight,
  FileDown,
  Globe2,
  ListChecks,
  Lock,
  MousePointerClick,
  QrCode,
  SmilePlus,
  Timer,
  Webhook,
} from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"

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
import { BrandIcons } from "@/components/icons/brand-icons"
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

  useEffect(() => {
    if (reduced || manual) return
    const t = setTimeout(
      () => setBi((i) => (i + 1) % BRANDS.length),
      DOMAIN_CYCLE_MS
    )
    return () => clearTimeout(t)
  }, [bi, manual, reduced])

  const brand = BRANDS[bi]

  return (
    <div className="absolute inset-0 overflow-hidden">
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

/* One link, unfurled the way each platform actually renders it. X leads;
   the switcher cycles until touched, then the spotlight is sticky (the
   section's shared grammar). Tag chips above say "you set these". */
const OG_TITLE = "Spring launch, everything new"
const OG_DESC = "Release notes, demos, and the changelog."

function OgImage({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden bg-neutral-200/70 dark:bg-neutral-800",
        className
      )}
    >
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
  )
}

/* X's summary_large_image anatomy: the image is the card, the title rides
   it as a bottom-left pill, the source sits under in gray. */
function XUnfurl() {
  return (
    <div className="w-64">
      <div className="relative overflow-hidden rounded-xl border border-border/60 shadow-float">
        <OgImage className="h-32" />
        <span className="absolute bottom-2 left-2 rounded-[4px] bg-black/70 px-1.5 py-0.5 text-[10px] text-white">
          {OG_TITLE}
        </span>
      </div>
      <p className="mt-1.5 text-[10px] text-neutral-500">From spoo.me</p>
    </div>
  )
}

/* Discord's embed anatomy: theme-color bar, dark panel, link-blue title. */
function DiscordUnfurl() {
  return (
    <div className="flex w-64 overflow-hidden rounded-[4px] bg-[#f2f3f5] shadow-float dark:bg-[#2b2d31]">
      <div className="w-1 shrink-0 bg-brand" />
      <div className="min-w-0 flex-1 space-y-1 p-2.5 pl-2">
        <p className="text-[9px] text-neutral-500 dark:text-neutral-400">
          spoo.me
        </p>
        <p className="truncate font-semibold text-[#006ce7] text-[11px] dark:text-[#00a8fc]">
          {OG_TITLE}
        </p>
        <p className="line-clamp-1 text-[10px] text-neutral-700 dark:text-neutral-300">
          {OG_DESC}
        </p>
        <OgImage className="h-16 rounded" />
      </div>
    </div>
  )
}

/* Slack's unfurl anatomy: gray gutter bar, favicon + source row, link-blue
   title, description, image below. */
function SlackUnfurl() {
  return (
    <div className="flex w-64 gap-2 rounded-lg border border-border/60 bg-white p-2.5 shadow-float dark:bg-[#1a1d21]">
      <div className="w-1 shrink-0 rounded-full bg-neutral-300 dark:bg-neutral-600" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-bold text-[10px] text-neutral-800 dark:text-neutral-200">
          spoo.me
        </p>
        <p className="truncate font-semibold text-[#1264a3] text-[11px] dark:text-[#1d9bd1]">
          {OG_TITLE}
        </p>
        <p className="line-clamp-1 text-[10px] text-neutral-600 dark:text-neutral-400">
          {OG_DESC}
        </p>
        <OgImage className="h-16 rounded" />
      </div>
    </div>
  )
}

const PLATFORMS = [
  { id: "x", icon: BrandIcons.x, unfurl: <XUnfurl /> },
  { id: "discord", icon: BrandIcons.discord, unfurl: <DiscordUnfurl /> },
  { id: "slack", icon: BrandIcons.slack, unfurl: <SlackUnfurl /> },
]

const UNFURL_CYCLE_MS = 2800

const MetaTagsDemo = () => {
  const [pi, setPi] = useState(0)
  const [manual, setManual] = useState(false)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (reduced || manual) return
    const t = setTimeout(
      () => setPi((i) => (i + 1) % PLATFORMS.length),
      UNFURL_CYCLE_MS
    )
    return () => clearTimeout(t)
  }, [pi, manual, reduced])

  const platform = PLATFORMS[pi]

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        aria-hidden
        className="pattern-dots absolute inset-x-8 inset-y-6 opacity-70 [mask-image:radial-gradient(ellipse_65%_80%_at_50%_45%,black,transparent)]"
      />
      <div className="relative flex h-full flex-col items-center justify-center gap-5">
        {/* The tags you control */}
        <div className="flex items-center gap-1.5 font-mono text-[9px]">
          <span className="rounded-md border border-border/60 bg-card px-1.5 py-0.5 text-muted-foreground">
            og:title
          </span>
          <span className="rounded-md border border-border/60 bg-card px-1.5 py-0.5 text-muted-foreground">
            og:image
          </span>
          <span className="flex items-center gap-1 rounded-md border border-border/60 bg-card px-1.5 py-0.5 text-muted-foreground">
            <span className="size-1.5 rounded-full bg-brand" />
            theme
          </span>
        </div>

        {/* The unfurl, per platform — fixed slot, nothing reflows */}
        <div className="flex h-44 items-center">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              {platform.unfurl}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Platform switcher — sticky spotlight, X first */}
        <div className="flex items-center gap-2">
          {PLATFORMS.map((pf, i) => (
            <button
              key={pf.id}
              type="button"
              aria-label={`Preview on ${pf.id}`}
              onMouseEnter={() => {
                setManual(true)
                setPi(i)
              }}
              onFocus={() => {
                setManual(true)
                setPi(i)
              }}
              onClick={() => {
                setManual(true)
                setPi(i)
              }}
              className={cn(
                "flex h-7 items-center gap-1.5 rounded-full border bg-card px-2 font-mono text-[11px] transition-colors duration-200",
                i === pi
                  ? "border-border text-foreground"
                  : "border-border/60 text-muted-foreground hover:text-foreground"
              )}
            >
              <pf.icon className="size-3" />
              {pf.id}
            </button>
          ))}
        </div>
      </div>
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
        <div
          className={cn(
            "relative flex flex-col justify-center bg-background p-7 pb-20 sm:p-9 sm:pb-24",
            flip && "lg:order-2"
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
            className="absolute bottom-4 left-7 inline-flex h-6 items-center gap-1 rounded-md border border-border/50 px-2 font-medium text-[11px] text-muted-foreground opacity-0 transition-all duration-200 hover:border-border hover:text-foreground group-hover:opacity-100 sm:bottom-5 sm:left-9"
          >
            Learn more
            <ArrowUpRight className="size-2.5" data-icon="inline-end" />
          </a>
        </div>
        <div className={cn("bg-background", flip && "lg:order-1")}>
          <div className="relative h-72 overflow-hidden transition-transform duration-300 ease-out group-hover:scale-[1.02] sm:h-80">
            {demo}
          </div>
        </div>
      </div>
    </Band>
  )
}

/* The long tail as a manifest: everything real, nothing demanding a demo. */
const MANIFEST = [
  {
    icon: QrCode,
    name: "QR codes",
    text: "Branded QR for every link, logo and colors included.",
  },
  {
    icon: Lock,
    name: "Password locks",
    text: "Gate any link behind a passphrase.",
  },
  {
    icon: MousePointerClick,
    name: "Max clicks",
    text: "Cap total clicks; the link retires itself.",
  },
  {
    icon: Timer,
    name: "Link expiry",
    text: "Set an end date and walk away.",
  },
  {
    icon: SmilePlus,
    name: "Emoji aliases",
    text: "spoo.me/\u{1F680} is a real URL here.",
  },
  {
    icon: ListChecks,
    name: "Bulk actions",
    text: "Edit, move, and retire links hundreds at a time.",
  },
  {
    icon: FileDown,
    name: "Exports",
    text: "Your data leaves as CSV or JSON, any time.",
  },
  {
    icon: Webhook,
    name: "Webhooks",
    text: "Signed events for clicks and lifecycle changes.",
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
        headline="Look right in every timeline."
        body="Custom title, description, image, and theme color, set per link. One URL that unfurls right on X, Discord, and Slack alike."
        demo={<MetaTagsDemo />}
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
                className="group relative flex h-full flex-col p-5 transition-colors duration-200 hover:bg-foreground/[0.02] sm:p-6"
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
