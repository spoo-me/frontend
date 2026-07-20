"use client"

import { lazy, Suspense, useState } from "react"
import {
  ArrowRight,
  Copy,
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

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { SectionHeading } from "@/components/shared/section-heading"
import { Band } from "@/components/shared/section-shell"

const WorldMap = lazy(() => import("@/components/ui/world-map"))

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
        <div className="w-72 shrink-0 overflow-hidden rounded-xl border border-border/70 bg-card shadow-float">
          <div className="flex items-center justify-between border-border/60 border-b px-3.5 py-2.5">
            <span className="font-medium font-mono text-[11px] text-foreground">
              links.acme.dev
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-live/10 px-2 py-0.5 font-mono text-[9px] text-live">
              <span className="size-1 rounded-full bg-live" />
              active
            </span>
          </div>
          <div className="divide-y divide-border/60">
            {records.map((r) => (
              <div
                key={r.type}
                className="flex items-center gap-3 px-3.5 py-2 font-mono text-[10px]"
              >
                <span className="w-11 shrink-0 text-muted-foreground/70">
                  {r.type}
                </span>
                <span className="w-10 shrink-0 text-foreground/90">
                  {r.name}
                </span>
                <span className="flex-1 truncate text-muted-foreground">
                  {r.value}
                </span>
                <Copy
                  className="size-3 shrink-0 text-muted-foreground/40"
                  strokeWidth={1.75}
                />
              </div>
            ))}
            <div className="flex items-center gap-3 px-3.5 py-2 font-mono text-[10px] text-muted-foreground/70">
              <span className="w-11 shrink-0">SSL</span>
              <span>auto · issued mar 12</span>
            </div>
          </div>
        </div>
        <ArrowRight
          className="hidden size-4 shrink-0 text-muted-foreground/50 sm:block"
          strokeWidth={1.75}
        />
        <div className="hidden flex-col gap-1.5 sm:flex">
          {links.map((l) => (
            <div
              key={l.path}
              className={`w-fit rounded-lg border border-border/70 bg-card px-2.5 py-1.5 font-mono text-[10px] shadow-float-sm ${l.nudge}`}
            >
              <span className="font-medium text-foreground">
                links.acme.dev
              </span>
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
        <div className="flex w-56 overflow-hidden rounded-[4px] bg-[#f2f3f5] shadow-float dark:bg-[#2b2d31]">
          <div className="w-1 shrink-0 bg-brand" />
          <div className="min-w-0 flex-1 space-y-1 p-2.5 pl-2">
            <p className="text-[9px] text-neutral-500 dark:text-neutral-400">
              spoo.me
            </p>
            <p className="truncate font-semibold text-[#006ce7] text-[11px] dark:text-[#00a8fc]">
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

/* Routing rules as pins on the map itself. One pin is active (sticky),
   hover or tap moves the spotlight; the active pin unfolds to show where
   that country goes. The fallback reads as a quiet line, not a box. */
const GEO_RULES = [
  { code: "DE", flag: "de", path: "/shop-de", top: "20.5%", left: "53%" },
  { code: "US", flag: "us", path: "/shop-us", top: "29%", left: "23%" },
  { code: "JP", flag: "jp", path: "/shop-jp", top: "30%", left: "86%" },
]

const GeoDemo = () => {
  const [active, setActive] = useState("DE")
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-x-2 top-3 [mask-image:linear-gradient(to_top,transparent_4%,#000_45%)]">
        <Suspense
          fallback={<Skeleton className="aspect-[2/1] w-full rounded-lg" />}
        >
          <WorldMap dots={[]} />
        </Suspense>

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
                  "absolute size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full transition-colors duration-200",
                  isActive ? "bg-foreground/70" : "bg-foreground/40"
                )}
              />
              <span
                aria-hidden
                className="absolute -top-[13px] h-2.5 w-px bg-border"
              />
              <span
                className={cn(
                  "absolute -top-[41px] -left-[14px] flex h-7 items-center gap-1.5 overflow-hidden rounded-full border bg-card px-1.5 shadow-float transition-colors duration-200",
                  isActive ? "border-border" : "border-border/60"
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://flagcdn.com/w40/${r.flag}.png`}
                  alt=""
                  loading="lazy"
                  className="size-4 shrink-0 rounded-full object-cover"
                />
                <span
                  className={cn(
                    "overflow-hidden whitespace-nowrap font-mono text-[10px] text-foreground transition-all duration-200",
                    isActive ? "max-w-24 opacity-100" : "max-w-0 opacity-0"
                  )}
                >
                  {"→"} {r.path}
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
      <div className="grid gap-px bg-border lg:grid-cols-2">
        <div
          className={cn(
            "flex flex-col justify-center bg-background p-7 sm:p-9",
            flip && "lg:order-2"
          )}
        >
          <h3 className="text-balance font-semibold text-2xl text-foreground tracking-tight sm:text-3xl">
            {headline}
          </h3>
          <p className="mt-3 max-w-md text-balance text-base text-muted-foreground">
            {body}
          </p>
        </div>
        <div className={cn("group bg-background", flip && "lg:order-1")}>
          <div className="relative h-72 overflow-hidden sm:h-80">{demo}</div>
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
        body="Bring your own domain, apex or subdomain. Guided DNS with copy-ready records, automatic SSL, and links.acme.dev/launch instead of somebody else's name."
        demo={<DomainDemo />}
      />
      <ProofBand
        flip
        headline="Germany sees a different destination."
        body="One short link, routed by country: send the EU to the EU store, the US to yours, and everyone else to the fallback. The rules read like a table because they are one."
        demo={<GeoDemo />}
      />
      <ProofBand
        headline="Look right in every Discord paste."
        body="Custom title, description, image, and theme color, set per link. The unfurl becomes part of the link instead of an accident of the destination."
        demo={<MetaTagsDemo />}
      />

      {/* Manifest row — the rest of the toolbox at index density */}
      <Band rule>
        <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
          {MANIFEST.map((f) => (
            <div key={f.name} className="bg-background p-5 sm:p-6">
              <f.icon
                className="size-4 text-muted-foreground"
                strokeWidth={1.75}
              />
              <div className="label-mono mt-3 text-foreground">{f.name}</div>
              <p className="mt-1.5 text-[13px] text-muted-foreground leading-relaxed">
                {f.text}
              </p>
            </div>
          ))}
        </div>
      </Band>
    </>
  )
}
