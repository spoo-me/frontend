"use client"

import * as React from "react"
import { ArrowRight, Check, Copy } from "@/components/icons"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"
import {
  MarkBolt,
  MarkClover,
  MarkPlay,
  MarkRing,
  MarkVenn,
} from "@/components/shared/brand-marks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createCustomDomain, SpooApiError, type CustomDomain } from "@/lib/api"

const FQDN_RE =
  /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i

type Choice = "custom" | "default"

/* Stage illustrations — two different scenes, not two pills. Ownership is
   a cluster of branded domain pills, each wearing its own "company" mark
   (hand-drawn, deliberately unalike); instant is one clean spoo pill. */

const DOMAIN_PILLS = [
  {
    host: "forma.io",
    mark: MarkVenn,
    idle: "-rotate-3",
    focused: "rotate-0 -translate-x-1.5 -translate-y-0.5",
  },
  {
    host: "boltlab.co",
    mark: MarkBolt,
    idle: "rotate-2",
    focused: "rotate-0 translate-x-1.5 -translate-y-0.5",
  },
  {
    host: "vega.tv",
    mark: MarkPlay,
    idle: "-rotate-1",
    focused: "rotate-0 -translate-y-1",
  },
  {
    host: "clove.app",
    mark: MarkClover,
    idle: "rotate-3",
    focused: "rotate-0 -translate-x-1.5 translate-y-0.5",
  },
  {
    host: "lumen.fm",
    mark: MarkRing,
    idle: "-rotate-2",
    focused: "rotate-0 translate-x-1.5 translate-y-0.5",
  },
]

function DomainPill({
  pill,
  active,
}: {
  pill: (typeof DOMAIN_PILLS)[number]
  active: boolean
}) {
  const Mark = pill.mark
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-full border border-border/70 bg-card px-3.5 py-1.5 font-mono text-[11px] shadow-float transition-transform duration-500",
        active ? pill.focused : pill.idle
      )}
    >
      <Mark />
      <span className="whitespace-nowrap text-foreground/90">{pill.host}</span>
    </div>
  )
}

function CustomDomainIllustration({ active }: { active: boolean }) {
  const [a, b, c, d, e] = DOMAIN_PILLS
  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="flex justify-center gap-2.5">
        <DomainPill pill={a} active={active} />
        <DomainPill pill={b} active={active} />
      </div>
      <DomainPill pill={c} active={active} />
      <div className="flex justify-center gap-2.5">
        <DomainPill pill={d} active={active} />
        <DomainPill pill={e} active={active} />
      </div>
    </div>
  )
}

/* Deliberately quiet — the custom-domain card is the one being sold, so
   this scene carries no positive signals (no emerald, no benefit chips). */
function DefaultDomainIllustration({ active }: { active: boolean }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className={cn(
          "flex items-center gap-2.5 rounded-full border border-border/60 bg-card py-2.5 pr-5 pl-4 shadow-card transition-transform duration-500",
          active && "-translate-y-0.5"
        )}
      >
        {/* Bland mark — mono in both themes */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo-black.png"
          alt=""
          className="size-4 shrink-0 object-contain dark:hidden"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo-white.png"
          alt=""
          className="hidden size-4 shrink-0 object-contain dark:block"
        />
        <span className="font-mono text-sm">
          <span className="text-foreground/80">spoo.me</span>
          <span className="text-muted-foreground">/launch</span>
        </span>
      </div>
      <span className="label-mono text-[9px] text-muted-foreground/60">
        the default · switch any time
      </span>
    </div>
  )
}

export function DomainStep({ onDone }: { onDone: () => void }) {
  const [focus, setFocus] = React.useState<Choice>("custom")
  const [connecting, setConnecting] = React.useState(false)
  const [fqdn, setFqdn] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const [notice, setNotice] = React.useState<{
    tone: "info" | "error"
    text: string
  } | null>(null)
  const [created, setCreated] = React.useState<CustomDomain | null>(null)
  const [copied, setCopied] = React.useState<number | null>(null)

  const valid = FQDN_RE.test(fqdn.trim())

  // Arrow keys swap the focused card; Enter activates it. Inside the form
  // the listener stands down — Enter submits there.
  React.useEffect(() => {
    if (connecting || created) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        e.preventDefault()
        setFocus((f) => (f === "custom" ? "default" : "custom"))
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (focus === "custom") setConnecting(true)
        else onDone()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [connecting, created, focus, onDone])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid || pending) return
    setPending(true)
    setNotice(null)
    try {
      setCreated(await createCustomDomain(fqdn.trim().toLowerCase()))
    } catch (err) {
      if (
        err instanceof SpooApiError &&
        // The create endpoint answers 404 while the feature flag is off for
        // this account (it deliberately doesn't leak feature existence).
        (err.status === 404 || err.status === 403)
      ) {
        setNotice({
          tone: "info",
          text: "Custom domains are rolling out gradually. Your account isn't in the wave yet. Skip for now; we'll email you.",
        })
      } else if (err instanceof SpooApiError && err.status === 409) {
        setNotice({ tone: "error", text: "That domain is already registered." })
      } else if (err instanceof SpooApiError && err.isRateLimit) {
        setNotice({
          tone: "error",
          text: "Domain limit reached for today. Finish this one from the dashboard later.",
        })
      } else if (err instanceof SpooApiError) {
        setNotice({ tone: "error", text: err.message })
      } else {
        setNotice({
          tone: "error",
          text: "Can't reach the server. Check your connection and try again.",
        })
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex w-full flex-col items-center text-center">
      <h1 className="text-balance font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
        Make the link{" "}
        <span className="font-normal font-serif text-muted-foreground italic">
          yours
        </span>
      </h1>
      <p className="mt-3 max-w-sm text-muted-foreground text-sm leading-relaxed">
        Branded short links earn more clicks. Connect your domain now, or stay
        on spoo.me and switch any time.
      </p>

      <AnimatePresence mode="wait" initial={false}>
        {created ? (
          /* ── DNS instructions after registration ─────────────────────── */
          <motion.div
            key="dns"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 w-full max-w-xl text-left"
          >
            <div className="rounded-2xl border border-border/60 bg-card/40 p-7">
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-full border border-live/30 bg-live/10 text-live">
                  <Check className="size-4" />
                </span>
                <div>
                  <p className="font-medium font-mono text-foreground text-sm">
                    {created.fqdn}
                  </p>
                  <p className="label-mono mt-0.5 text-[9px] text-muted-foreground/70">
                    registered · awaiting DNS
                  </p>
                </div>
              </div>

              <p className="mt-5 text-muted-foreground text-xs leading-relaxed">
                Add{" "}
                {created.dns_records.length === 1
                  ? "this record"
                  : "these records"}{" "}
                at your DNS provider.{" "}
                {created.verification_method === "cf_http_dcv"
                  ? "The CNAME routes traffic and the TXT proves ownership; verification and TLS complete automatically once they resolve. No need to wait here."
                  : "Verification runs automatically once they propagate; no need to wait here."}
              </p>

              <div className="mt-4 divide-y rounded-xl border border-border/60 font-mono text-[11px]">
                {created.dns_records.map((r, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className="label-mono w-12 shrink-0 text-[9px] text-muted-foreground">
                        {r.type}
                      </span>
                      <span className="w-24 shrink-0 truncate text-foreground/90">
                        {r.name}
                      </span>
                      <span className="flex-1 truncate text-muted-foreground">
                        {r.value}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard.writeText(r.value)
                          setCopied(i)
                          setTimeout(() => setCopied(null), 1500)
                        }}
                        aria-label={`Copy ${r.type} value`}
                        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {copied === i ? (
                          <Check className="size-3.5 text-live" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </button>
                    </div>
                    {r.purpose && (
                      <p className="mt-1 text-[10px] text-muted-foreground/50">
                        {r.purpose}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {created.setup_notes.length > 0 && (
                <ul className="mt-4 space-y-1 text-muted-foreground/80 text-xs">
                  {created.setup_notes.map((n) => (
                    <li key={n}>· {n}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-7 flex flex-col items-center">
              <Button onClick={onDone} className="h-10 min-w-48">
                Continue
                <ArrowRight className="size-4" data-icon="inline-end" />
              </Button>
            </div>
          </motion.div>
        ) : connecting ? (
          /* ── Inline connect form ──────────────────────────────────────── */
          <motion.form
            key="form"
            onSubmit={submit}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 w-full max-w-md text-left"
          >
            <label
              htmlFor="fqdn"
              className="font-medium text-foreground text-sm"
            >
              Your domain
            </label>
            <div className="mt-1.5 flex gap-2">
              <Input
                id="fqdn"
                value={fqdn}
                onChange={(e) => {
                  setFqdn(e.target.value)
                  setNotice(null)
                }}
                placeholder="go.acme.com"
                autoComplete="off"
                autoFocus
                spellCheck={false}
                className="h-10 font-mono text-sm"
              />
              <Button
                type="submit"
                disabled={!valid || pending}
                className="h-10 shrink-0"
              >
                {pending ? "Registering…" : "Connect"}
              </Button>
            </div>
            <p className="mt-2 text-muted-foreground/70 text-xs">
              A subdomain like <span className="font-mono">go.acme.com</span> is
              the usual pick; apex domains work too.
            </p>
            {notice &&
              // Flag-off is informational, not a failure — stay quiet.
              (notice.tone === "info" ? (
                <p role="status" className="mt-3 text-muted-foreground text-sm">
                  {notice.text}
                </p>
              ) : (
                <p role="alert" className="mt-3 text-destructive text-sm">
                  {notice.text}
                </p>
              ))}
            <button
              type="button"
              onClick={() => setConnecting(false)}
              className="mt-5 text-muted-foreground text-xs underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              ← Back
            </button>
          </motion.form>
        ) : (
          /* ── The fork ─────────────────────────────────────────────────── */
          <motion.div
            key="cards"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 grid w-full max-w-4xl gap-5 sm:grid-cols-2"
          >
            <div
              onMouseEnter={() => setFocus("custom")}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-card/40 p-7 transition-colors duration-300",
                focus === "custom" ? "border-ring/60" : "border-border/60"
              )}
            >
              <div className="relative flex h-44 items-center justify-center rounded-xl">
                <div
                  aria-hidden
                  className={cn(
                    "absolute size-32 rounded-full bg-brand/10 blur-2xl transition-opacity duration-500",
                    focus === "custom" ? "opacity-100" : "opacity-0"
                  )}
                />
                <div
                  className={cn(
                    "relative transition-transform duration-500",
                    focus === "custom" && "-translate-y-1"
                  )}
                >
                  <CustomDomainIllustration active={focus === "custom"} />
                </div>
              </div>
              <h2 className="mt-6 font-semibold text-base text-foreground">
                Connect a custom domain
              </h2>
              <p className="mx-auto mt-2 max-w-60 flex-1 text-[13px] text-muted-foreground leading-relaxed">
                Already have a domain? Links on it build trust, and earn the
                clicks to prove it.
              </p>
              {/* Always the primary action — hierarchy doesn't follow the mouse */}
              <Button
                onClick={() => setConnecting(true)}
                className="mt-6 h-10 w-full"
              >
                Connect domain
                <ArrowRight className="size-4" data-icon="inline-end" />
              </Button>
            </div>

            <div
              onMouseEnter={() => setFocus("default")}
              className={cn(
                "flex flex-col rounded-2xl border bg-card/40 p-7 transition-colors duration-300",
                focus === "default" ? "border-ring/60" : "border-border/60"
              )}
            >
              <div className="relative flex h-44 items-center justify-center rounded-xl">
                {/* Neutral glow — no value signal on the option we're not selling */}
                <div
                  aria-hidden
                  className={cn(
                    "absolute size-32 rounded-full bg-foreground/5 blur-2xl transition-opacity duration-500",
                    focus === "default" ? "opacity-100" : "opacity-0"
                  )}
                />
                <div
                  className={cn(
                    "relative transition-transform duration-500",
                    focus === "default" && "-translate-y-1"
                  )}
                >
                  <DefaultDomainIllustration active={focus === "default"} />
                </div>
              </div>
              <h2 className="mt-6 font-semibold text-base text-foreground">
                Stay on spoo.me
              </h2>
              <p className="mx-auto mt-2 max-w-60 flex-1 text-[13px] text-muted-foreground leading-relaxed">
                Links work on spoo.me from day one. Bring your own domain
                whenever you&apos;re ready.
              </p>
              {/* Always secondary — keeping the default is the quiet path */}
              <Button
                onClick={onDone}
                variant="outline"
                className="mt-6 h-10 w-full"
              >
                Keep spoo.me
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!created && !connecting && (
        <button
          type="button"
          onClick={onDone}
          className="mt-8 text-muted-foreground text-sm transition-colors hover:text-foreground"
        >
          I&apos;ll do this later
        </button>
      )}
    </div>
  )
}
