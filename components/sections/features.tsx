"use client"

import * as React from "react"
import { motion } from "motion/react"
import { Bell, Check, Timer, Webhook, X } from "lucide-react"
import { BaseQr, encodeData } from "simple-qrbtf"

import { SectionHeading } from "@/components/shared/section-heading"
import { cn } from "@/lib/utils"

export function Features() {
  return (
    <div className="relative px-5 py-24 sm:px-9 sm:py-28">
      <SectionHeading
        title={
          <>
            Everything you need.{" "}
            <span className="text-muted-foreground italic [font-family:var(--font-serif)] font-normal">
              Nothing you don&apos;t.
            </span>
          </>
        }
        description="Built by developers shipping production traffic. Every feature has a reason it exists."
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="border-border/60 bg-border/60 mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border sm:grid-cols-2 lg:grid-cols-3"
      >
        <Cell
          className="sm:col-span-2"
          title="Custom domains"
          description="Branded short links on your own domain. Point a CNAME, verify once, ship go.you.dev links."
        >
          <DomainsDemo />
        </Cell>
        <Cell
          title="QR codes"
          description="Every link ships with a QR code. Brand colors and logo included."
        >
          <QrDemo />
        </Cell>
        <Cell
          title="Link rules"
          description="Passwords, expiry dates, click limits. Set them per link, change them anytime."
        >
          <RulesDemo />
        </Cell>
        <Cell
          title="Alerts & webhooks"
          description="Standard Webhooks events for everything. Get pinged the moment a threshold hits."
        >
          <AlertsDemo />
        </Cell>
        <Cell
          title="Bot protection"
          description="Crawlers are filtered before they pollute your analytics. Real clicks only."
        >
          <BotsDemo />
        </Cell>
      </motion.div>
    </div>
  )
}

function Cell({
  title,
  description,
  children,
  className,
}: {
  title: string
  description: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "group bg-background hover:bg-muted/20 relative flex flex-col justify-between gap-6 p-6 transition-colors duration-300 sm:p-7",
        className,
      )}
    >
      <div className="relative h-40 overflow-hidden">{children}</div>
      <div>
        <h3 className="text-foreground text-sm font-semibold tracking-tight">{title}</h3>
        <p className="text-muted-foreground mt-1 text-sm leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

/* Custom domains — verify flow + branded links, ghost wordmark behind */
function DomainsDemo() {
  return (
    <div className="flex h-full flex-col justify-center gap-3">
      {/* Ghost blueprint — oversized faded domain behind the demo */}
      <span
        aria-hidden
        className="text-foreground/[0.035] pointer-events-none absolute -top-6 -right-2 -rotate-2 font-mono text-[7rem] leading-none font-semibold tracking-tighter select-none"
      >
        go.
      </span>

      <div className="border-border/60 bg-background relative flex max-w-md items-center gap-2 rounded-lg border px-3 py-2 font-mono text-sm">
        <span className="text-muted-foreground/60">https://</span>
        <span className="text-foreground">go.acme.dev</span>
        <span className="bg-foreground/70 animate-blink-cursor h-4 w-px" />
        <span className="text-live ml-auto inline-flex items-center gap-1.5 text-[11px]">
          <Check className="size-3" />
          CNAME verified
        </span>
      </div>

      <ul className="flex max-w-md flex-col gap-1.5 font-mono text-[11px]">
        {[
          { path: "go.acme.dev/launch", clicks: "12,408 clicks" },
          { path: "go.acme.dev/docs", clicks: "3,291 clicks" },
        ].map((row) => (
          <li
            key={row.path}
            className="text-muted-foreground flex items-center justify-between gap-3 px-3"
          >
            <span className="truncate">{row.path}</span>
            <span className="text-muted-foreground/60 shrink-0 tabular-nums">
              {row.clicks}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/* QR — live-rendered, theme-aware via currentColor */
function QrDemo() {
  const svg = React.useMemo(() => {
    const qr = encodeData({ text: "https://spoo.me/ga" })
    return BaseQr({
      qrcode: qr,
      otherColor: "currentColor",
      posColor: "currentColor",
    })
  }, [])

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2.5">
      <div
        aria-label="QR code for spoo.me/ga"
        role="img"
        className="text-foreground/80 group-hover:text-foreground size-28 transition-all duration-300 group-hover:scale-[1.03] [&_svg]:size-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <span className="text-muted-foreground font-mono text-[11px]">spoo.me/ga</span>
    </div>
  )
}

/* Link rules — toggleable switches, the middle one actually works */
function RulesDemo() {
  const [expires, setExpires] = React.useState(true)

  const rules: Array<{
    label: string
    value: string
    on: boolean
    onClick?: () => void
  }> = [
    { label: "password", value: "••••••••", on: true },
    {
      label: "expires",
      value: "in 30 days",
      on: expires,
      onClick: () => setExpires((v) => !v),
    },
    { label: "max clicks", value: "1,000", on: true },
  ]

  return (
    <div className="flex h-full flex-col justify-center gap-2">
      {rules.map((rule) => (
        <button
          key={rule.label}
          type="button"
          onClick={rule.onClick}
          disabled={!rule.onClick}
          aria-pressed={rule.on}
          className={cn(
            "border-border/60 flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors",
            rule.onClick && "hover:border-border cursor-pointer",
          )}
        >
          <span className="label-mono text-muted-foreground w-20 shrink-0">
            {rule.label}
          </span>
          <span
            className={cn(
              "font-mono text-xs tabular-nums transition-colors",
              rule.on ? "text-foreground" : "text-muted-foreground/50 line-through",
            )}
          >
            {rule.value}
          </span>
          <span
            className={cn(
              "relative ml-auto h-4 w-7 rounded-full transition-colors duration-200",
              rule.on ? "bg-foreground" : "bg-muted",
            )}
          >
            <span
              className={cn(
                "bg-background absolute top-0.5 size-3 rounded-full transition-all duration-200",
                rule.on ? "left-3.5" : "left-0.5",
              )}
            />
          </span>
        </button>
      ))}
    </div>
  )
}

/* Alerts — webhook event feed in the product's real event vocabulary */
function AlertsDemo() {
  const events = [
    { icon: Bell, name: "clicks.threshold", meta: "2m" },
    { icon: Webhook, name: "link.created", meta: "1h" },
    { icon: Timer, name: "link.expired", meta: "3h" },
  ]
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      {events.map((e, i) => (
        <motion.div
          key={e.name}
          initial={{ opacity: 0, x: 8 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15 + i * 0.1 }}
          className="border-border/60 flex items-center gap-2.5 rounded-lg border px-3 py-2"
        >
          <span className="border-border/60 bg-muted/40 text-foreground flex size-6 shrink-0 items-center justify-center rounded-md border">
            <e.icon className="size-3" />
          </span>
          <code className="text-foreground/90 font-mono text-[11px]">{e.name}</code>
          <span className="text-muted-foreground/60 ml-auto font-mono text-[11px]">
            {e.meta}
          </span>
        </motion.div>
      ))}
    </div>
  )
}

/* Bot protection — verdict rows */
function BotsDemo() {
  const rows = [
    { ua: "Chrome 126 · macOS", counted: true },
    { ua: "curl/8.4", counted: false },
    { ua: "python-requests", counted: false },
  ]
  return (
    <div className="flex h-full flex-col justify-center gap-2">
      {rows.map((row) => (
        <div
          key={row.ua}
          className="border-border/60 flex items-center justify-between gap-3 rounded-lg border px-3 py-2 font-mono text-[11px]"
        >
          <span className={cn(row.counted ? "text-foreground" : "text-muted-foreground/60")}>
            {row.ua}
          </span>
          {row.counted ? (
            <span className="text-live inline-flex items-center gap-1">
              <Check className="size-3" /> counted
            </span>
          ) : (
            <span className="text-muted-foreground/60 inline-flex items-center gap-1">
              <X className="size-3" /> filtered
            </span>
          )}
        </div>
      ))}
      <p className="text-muted-foreground/70 px-1 font-mono text-[10px] tabular-nums">
        12,408 bots filtered in the last 30 days
      </p>
    </div>
  )
}
