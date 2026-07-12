"use client"

import * as React from "react"
import Link from "next/link"
import { AnimatePresence, motion } from "motion/react"
import { Check, Minus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { BrandIcons } from "@/components/icons/brand-icons"
import { siteConfig } from "@/lib/site-config"

type Cadence = "monthly" | "annually"

/* NOTE: plan values are launch placeholders — review before shipping billing. */
const tiers = [
  {
    id: "free",
    name: "Free",
    tagline: "For personal links and side projects.",
    price: { monthly: 0, annually: 0 },
    cta: { label: "Start free", href: "/signup" },
    highlight: false,
    leadIn: "Free includes:",
    features: [
      "100 new links / month",
      "10K tracked clicks / month",
      "90-day analytics retention",
      "1 custom domain",
      "Password, expiry & click limits",
      "QR codes",
      "5 API keys",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "For creators and growing projects.",
    price: { monthly: 9, annually: 7 },
    cta: { label: "Start Pro trial", href: "/signup?plan=pro" },
    highlight: true,
    leadIn: "Everything in Free, plus:",
    features: [
      "Unlimited new links",
      "100K tracked clicks / month",
      "2-year analytics retention",
      "5 custom domains",
      "Webhooks & alerts",
      "Branded QR with logo & colors",
      "Bulk import / export",
      "Priority email support",
    ],
  },
  {
    id: "business",
    name: "Business",
    tagline: "For teams shipping at scale.",
    price: { monthly: 29, annually: 24 },
    cta: { label: "Start Business trial", href: "/signup?plan=business" },
    highlight: false,
    leadIn: "Everything in Pro, plus:",
    features: [
      "1M tracked clicks / month",
      "Unlimited custom domains",
      "Analytics retention forever",
      "10 team seats",
      "Audit log",
      "99.99% uptime SLA",
      "Dedicated support",
    ],
  },
] as const

export function PricingTiers() {
  const [cadence, setCadence] = React.useState<Cadence>("annually")
  // annual = cheaper = digits roll down; monthly = digits roll up
  const dir = cadence === "annually" ? -1 : 1

  return (
    <div>
      {/* Billing toggle — sliding thumb */}
      <div className="flex flex-col items-center gap-2">
        <div
          role="radiogroup"
          aria-label="Billing cadence"
          className="flex items-center rounded-full border border-border/60 bg-muted/30 p-1"
        >
          {(["monthly", "annually"] as const).map((c) => (
            <button
              key={c}
              role="radio"
              aria-checked={cadence === c}
              onClick={() => setCadence(c)}
              className={cn(
                "relative rounded-full px-4 py-1.5 font-medium text-sm capitalize transition-colors",
                cadence === c
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {cadence === c && (
                <motion.span
                  layoutId="cadence-thumb"
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  className="absolute inset-0 rounded-full border border-border/60 bg-background shadow-soft dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                />
              )}
              <span className="relative z-10">{c}</span>
            </button>
          ))}
        </div>
        <p className="font-mono text-[11px] text-muted-foreground">
          save ~20% on annual billing
        </p>
      </div>

      {/* Tier band — flat columns, highlighted tier pops out */}
      <div className="mt-10 grid grid-cols-1 rounded-2xl border border-border/60 lg:grid-cols-3 lg:[&>*:not(:first-child)]:border-l lg:[&>*]:border-border/60">
        {tiers.map((t) => (
          <div
            key={t.id}
            className={cn(
              "relative flex flex-col p-7",
              t.highlight &&
                "lg:!border-l border-border/80 bg-card lg:-my-5 lg:rounded-2xl lg:border lg:shadow-card dark:lg:shadow-[0_24px_64px_-32px_rgba(0,0,0,0.6)]"
            )}
          >
            {t.highlight && (
              <span className="absolute -top-2.5 left-7 rounded-full bg-foreground px-2 py-0.5 font-mono font-semibold text-[10px] text-background uppercase tracking-wider lg:top-3.5">
                Most popular
              </span>
            )}
            <h3
              className={cn(
                "font-semibold text-foreground text-lg tracking-tight",
                t.highlight && "lg:mt-6"
              )}
            >
              {t.name}
            </h3>
            <p className="mt-1 text-muted-foreground text-sm">{t.tagline}</p>
            <div className="mt-6 flex items-baseline gap-1.5">
              <span className="flex items-baseline font-semibold text-4xl text-foreground tabular-nums">
                $
                <span className="inline-block overflow-hidden">
                  <AnimatePresence
                    mode="popLayout"
                    initial={false}
                    custom={dir}
                  >
                    <motion.span
                      key={t.price[cadence]}
                      custom={dir}
                      variants={{
                        enter: (d: number) => ({
                          y: d * 28,
                          opacity: 0,
                          filter: "blur(3px)",
                        }),
                        center: { y: 0, opacity: 1, filter: "blur(0px)" },
                        exit: (d: number) => ({
                          y: d * -28,
                          opacity: 0,
                          filter: "blur(3px)",
                        }),
                      }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 34,
                      }}
                      className="inline-block"
                    >
                      {t.price[cadence]}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </span>
              <span className="text-muted-foreground text-sm">
                / month
                {cadence === "annually" && t.price.annually > 0
                  ? ", billed yearly"
                  : ""}
              </span>
            </div>
            <div className="mt-6">
              <Button
                asChild
                size="lg"
                variant={t.highlight ? "default" : "outline"}
                className="h-10 w-full"
              >
                <Link href={t.cta.href}>{t.cta.label}</Link>
              </Button>
            </div>
            <p className="mt-6 font-medium text-foreground/80 text-xs">
              {t.leadIn}
            </p>
            <ul className="mt-3 space-y-2.5">
              {t.features.map((f) => (
                <li
                  key={f}
                  className="flex items-start gap-2 text-muted-foreground text-sm"
                >
                  <Check className="mt-0.5 size-3.5 shrink-0 text-foreground/70" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Self-host band — the open-source identity stays front and center */}
      <div className="mt-12 flex flex-col items-center gap-4 rounded-2xl border border-border/60 border-dashed bg-muted/20 p-6 text-center sm:flex-row sm:text-left">
        <div className="flex-1">
          <h3 className="font-semibold text-foreground text-sm tracking-tight">
            Or run it yourself, free forever.
          </h3>
          <p className="mt-1 text-muted-foreground text-sm">
            The entire stack is Apache 2.0 with 100% feature parity. Your
            database, your domain, no limits.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <a href={siteConfig.links.github} target="_blank" rel="noreferrer">
            <BrandIcons.github className="size-4" data-icon="inline-start" />
            Self-host from source
          </a>
        </Button>
      </div>
    </div>
  )
}

/* ----------------------------- comparison table ---------------------------- */

type Cell = string | boolean

type Row = { label: string; values: [Cell, Cell, Cell] }
type Group = { title: string; description: string; rows: Row[] }

const groups: Group[] = [
  {
    title: "Links & domains",
    description: "The core of the platform, on every plan.",
    rows: [
      { label: "New links / month", values: ["100", "Unlimited", "Unlimited"] },
      { label: "Custom domains", values: ["1", "5", "Unlimited"] },
      { label: "Password, expiry & click limits", values: [true, true, true] },
      { label: "Branded QR (logo + colors)", values: [false, true, true] },
      { label: "Bulk import / export", values: [false, true, true] },
    ],
  },
  {
    title: "Analytics",
    description: "Click insights without a separate tool.",
    rows: [
      { label: "Tracked clicks / month", values: ["10K", "100K", "1M"] },
      {
        label: "Analytics retention",
        values: ["90 days", "2 years", "Forever"],
      },
      { label: "Geo & referrer breakdowns", values: [true, true, true] },
      { label: "Bot filtering", values: [true, true, true] },
      { label: "CSV export", values: [false, true, true] },
    ],
  },
  {
    title: "Developer",
    description: "API-first, SDKs in every language we ship.",
    rows: [
      { label: "API keys", values: ["5", "20", "Unlimited"] },
      { label: "API rate limit", values: ["60 / min", "600 / min", "Custom"] },
      { label: "Webhooks", values: [false, true, true] },
      { label: "Official SDKs", values: [true, true, true] },
    ],
  },
  {
    title: "Team & support",
    description: "Help when you need it, controls when you grow.",
    rows: [
      { label: "Team seats", values: ["1", "3", "10"] },
      {
        label: "Support",
        values: ["Community", "Priority email", "Dedicated"],
      },
      { label: "Audit log", values: [false, false, true] },
      { label: "Uptime SLA", values: [false, false, "99.99%"] },
    ],
  },
]

function CellValue({ value }: { value: Cell }) {
  if (value === true)
    return (
      <span className="inline-flex size-5 items-center justify-center rounded-full bg-live/15">
        <Check className="size-3 text-live" />
      </span>
    )
  if (value === false)
    return <Minus className="mx-auto size-3.5 text-muted-foreground/40" />
  return (
    <span className="text-foreground/90 text-sm tabular-nums">{value}</span>
  )
}

export function PricingTable() {
  const cols = ["Free", "Pro", "Business"]
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[40rem]">
        {/* header */}
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] border-border/60 border-b">
          <div className="p-4 font-medium text-muted-foreground text-sm">
            Features
          </div>
          {cols.map((c) => (
            <div
              key={c}
              className={cn(
                "p-4 text-center font-semibold text-foreground text-sm",
                c === "Pro" &&
                  "rounded-t-xl border-border/60 border-x border-t bg-card"
              )}
            >
              {c}
            </div>
          ))}
        </div>

        {groups.map((g) => (
          <React.Fragment key={g.title}>
            <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] border-border/40 border-b">
              <div className="px-4 pt-8 pb-3">
                <h4 className="font-semibold text-foreground text-sm tracking-tight">
                  {g.title}
                </h4>
                <p className="mt-0.5 text-muted-foreground text-xs">
                  {g.description}
                </p>
              </div>
              <div />
              <div className="border-border/60 border-x bg-card" />
              <div />
            </div>
            {g.rows.map((row) => (
              <div
                key={row.label}
                className="grid grid-cols-[1.5fr_1fr_1fr_1fr] border-border/40 border-b"
              >
                <div className="p-4 text-muted-foreground text-sm">
                  {row.label}
                </div>
                {row.values.map((v, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center justify-center p-4",
                      i === 1 && "border-border/60 border-x bg-card"
                    )}
                  >
                    <CellValue value={v} />
                  </div>
                ))}
              </div>
            ))}
          </React.Fragment>
        ))}

        {/* CTA footer row */}
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div />
          <div className="p-4">
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/signup">Start free</Link>
            </Button>
          </div>
          <div className="rounded-b-xl border-border/60 border-x border-b bg-card p-4 shadow-card dark:shadow-[0_24px_48px_-32px_rgba(0,0,0,0.6)]">
            <Button asChild size="sm" className="w-full">
              <Link href="/signup?plan=pro">Start Pro trial</Link>
            </Button>
          </div>
          <div className="p-4">
            <Button asChild variant="outline" size="sm" className="w-full">
              <Link href="/signup?plan=business">Start Business</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------------------------------- FAQ ----------------------------------- */

const faqGroups = [
  {
    title: "Plans",
    items: [
      {
        q: "Is the free plan going away?",
        a: "No. Free stays free, with room for personal projects to live comfortably. Paid plans fund the platform so the free tier never has to carry ads or sell data.",
      },
      {
        q: "What happens if I hit my tracked-click limit?",
        a: "Your links never stop redirecting. Once the monthly tracked-click quota is reached, new clicks simply aren't recorded in analytics until the next cycle or an upgrade.",
      },
      {
        q: "Does self-hosting include paid features?",
        a: "Yes. The open-source release has 100% feature parity under Apache 2.0. Paid plans are for the hosted cloud: infrastructure, scale, and support.",
      },
    ],
  },
  {
    title: "Billing",
    items: [
      {
        q: "Can I change or cancel my plan anytime?",
        a: "Yes. Upgrades apply immediately with prorated billing; downgrades and cancellations take effect at the end of the current cycle. No lock-in.",
      },
      {
        q: "Do you offer discounts for open-source projects or students?",
        a: "We do. Reach out from the contact page with a link to your project or institution and we'll set you up.",
      },
    ],
  },
]

export function PricingFaq() {
  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_1.6fr]">
      <div>
        <h2 className="font-semibold text-3xl text-foreground tracking-tight">
          FAQs
        </h2>
        <p className="mt-2 text-muted-foreground text-sm">
          Your questions, answered.
        </p>
        <p className="mt-6 text-muted-foreground text-sm">
          Can&apos;t find what you&apos;re looking for?{" "}
          <Link
            href="/contact"
            className="font-medium text-foreground hover:underline"
          >
            Talk to a human
          </Link>
          .
        </p>
      </div>
      <div className="flex flex-col gap-8">
        {faqGroups.map((g) => (
          <div key={g.title}>
            <h3 className="mb-2 font-semibold text-base text-foreground tracking-tight">
              {g.title}
            </h3>
            <div className="divide-y divide-border/40">
              {g.items.map((item) => (
                <FaqItem key={item.q} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = React.useState(false)
  return (
    <div className="py-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group flex w-full items-center justify-between gap-4 text-left"
      >
        <span className="font-medium text-foreground text-sm">{q}</span>
        <span
          className={cn(
            "text-muted-foreground transition-transform duration-200",
            open && "rotate-45"
          )}
          aria-hidden
        >
          +
        </span>
      </button>
      <div
        className={cn(
          "grid transition-all duration-300 ease-out",
          open
            ? "mt-2 grid-rows-[1fr] opacity-100"
            : "grid-rows-[0fr] opacity-0"
        )}
      >
        <p className="overflow-hidden text-muted-foreground text-sm leading-relaxed">
          {a}
        </p>
      </div>
    </div>
  )
}
