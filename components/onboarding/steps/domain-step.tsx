"use client"

import * as React from "react"
import { ArrowRight, Check, Copy, ShieldCheck } from "lucide-react"
import { AnimatePresence, motion } from "motion/react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SpooApiError, type CustomDomain } from "@/lib/api"

const FQDN_RE = /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i

/**
 * MOCKED for now — the custom-domains feature flag is still rolling out, so
 * the real POST answers 404 for fresh accounts. Swap back to
 * `createCustomDomain()` from lib/api once onboarding accounts are in the
 * wave; the success UI below already renders the real response shape.
 */
async function mockCreateDomain(fqdn: string): Promise<CustomDomain> {
  await new Promise((r) => setTimeout(r, 700))
  const sub = fqdn.split(".")[0]
  return {
    id: "mock",
    fqdn,
    status: "pending",
    dns_records: [
      { type: "CNAME", name: sub, value: "cname.spoo.me", purpose: "routing" },
      {
        type: "TXT",
        name: `_spoo-verify.${sub}`,
        value: "spoo-verify=pending-rollout",
        purpose: "ownership",
      },
    ],
    setup_notes: [],
  }
}

type Choice = "custom" | "default"

/* Stage illustrations — the resulting short link, branded vs default. */

function CustomDomainIllustration({ active }: { active: boolean }) {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="border-border/60 bg-card shadow-card flex items-center gap-2.5 rounded-full border py-2.5 pr-5 pl-4">
        <ShieldCheck
          className={cn(
            "size-4 transition-colors duration-500",
            active ? "text-live" : "text-muted-foreground/50",
          )}
        />
        <span className="font-mono text-sm">
          <span
            className={cn(
              "transition-colors duration-500",
              active ? "text-foreground" : "text-foreground/70",
            )}
          >
            go.acme.com
          </span>
          <span className="text-muted-foreground">/launch</span>
        </span>
      </div>
      <span className="label-mono text-muted-foreground/60 text-[9px]">
        your domain · your brand
      </span>
    </div>
  )
}

function DefaultDomainIllustration() {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <div className="border-border/60 bg-card shadow-card flex items-center gap-2.5 rounded-full border py-2.5 pr-5 pl-4">
        <span className="relative flex size-1.5">
          <span className="bg-live relative inline-flex size-1.5 rounded-full" />
        </span>
        <span className="font-mono text-sm">
          <span className="text-foreground/80">spoo.me</span>
          <span className="text-muted-foreground">/launch</span>
        </span>
      </div>
      <span className="label-mono text-muted-foreground/60 text-[9px]">
        live in seconds · zero setup
      </span>
    </div>
  )
}

export function DomainStep({ onDone }: { onDone: () => void }) {
  const [focus, setFocus] = React.useState<Choice>("custom")
  const [connecting, setConnecting] = React.useState(false)
  const [fqdn, setFqdn] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
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
    setError(null)
    try {
      setCreated(await mockCreateDomain(fqdn.trim().toLowerCase()))
    } catch (err) {
      if (
        err instanceof SpooApiError &&
        // The create endpoint answers 404 while the feature flag is off for
        // this account (it deliberately doesn't leak feature existence).
        (err.status === 404 || err.status === 403)
      ) {
        setError(
          "Custom domains are rolling out gradually — your account isn't in the wave yet. Skip for now; we'll email you.",
        )
      } else if (err instanceof SpooApiError && err.status === 409) {
        setError("That domain is already registered.")
      } else if (err instanceof SpooApiError && err.isRateLimit) {
        setError("Domain limit reached for today — finish this one from the dashboard later.")
      } else if (err instanceof SpooApiError) {
        setError(err.message)
      } else {
        setError("Can't reach the server. Check your connection and try again.")
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex w-full flex-col items-center text-center">
      <h1 className="text-foreground text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        Make the link{" "}
        <span className="text-muted-foreground italic [font-family:var(--font-serif)] font-normal">
          yours
        </span>
      </h1>
      <p className="text-muted-foreground mt-3 max-w-sm text-sm leading-relaxed">
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
            <div className="border-border/60 bg-card/40 rounded-2xl border p-7">
              <div className="flex items-center gap-3">
                <span className="bg-live/10 border-live/30 text-live flex size-8 items-center justify-center rounded-full border">
                  <Check className="size-4" />
                </span>
                <div>
                  <p className="text-foreground font-mono text-sm font-medium">
                    {created.fqdn}
                  </p>
                  <p className="label-mono text-muted-foreground/70 mt-0.5 text-[9px]">
                    registered · awaiting DNS
                  </p>
                </div>
              </div>

              <p className="text-muted-foreground mt-5 text-xs leading-relaxed">
                Add {created.dns_records.length === 1 ? "this record" : "these records"} at
                your DNS provider. Verification runs automatically once it
                propagates — no need to wait here.
              </p>

              <div className="border-border/60 mt-4 divide-y rounded-xl border font-mono text-[11px]">
                {created.dns_records.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <span className="label-mono text-muted-foreground w-12 shrink-0 text-[9px]">
                      {r.type}
                    </span>
                    <span className="text-foreground/90 w-24 shrink-0 truncate">
                      {r.name}
                    </span>
                    <span className="text-muted-foreground flex-1 truncate">
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
                      className="text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                    >
                      {copied === i ? (
                        <Check className="text-live size-3.5" />
                      ) : (
                        <Copy className="size-3.5" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {created.setup_notes.length > 0 && (
                <ul className="text-muted-foreground/80 mt-4 space-y-1 text-xs">
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
            <label htmlFor="fqdn" className="text-foreground text-sm font-medium">
              Your domain
            </label>
            <div className="mt-1.5 flex gap-2">
              <Input
                id="fqdn"
                value={fqdn}
                onChange={(e) => {
                  setFqdn(e.target.value)
                  setError(null)
                }}
                placeholder="go.acme.com"
                autoComplete="off"
                autoFocus
                spellCheck={false}
                className="h-10 font-mono text-sm"
              />
              <Button type="submit" disabled={!valid || pending} className="h-10 shrink-0">
                {pending ? "Registering…" : "Connect"}
              </Button>
            </div>
            <p className="text-muted-foreground/70 mt-2 text-xs">
              A subdomain like <span className="font-mono">go.acme.com</span> is
              the usual pick — apex domains work too.
            </p>
            {error && (
              <p role="alert" className="text-destructive mt-3 text-sm">
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={() => setConnecting(false)}
              className="text-muted-foreground hover:text-foreground mt-5 text-xs underline-offset-4 transition-colors hover:underline"
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
            className="mt-12 grid w-full max-w-3xl gap-4 sm:grid-cols-2"
          >
            <div
              onMouseEnter={() => setFocus("custom")}
              className={cn(
                "bg-card/40 relative flex flex-col rounded-2xl border p-7 transition-colors duration-300",
                focus === "custom" ? "border-ring/60" : "border-border/60",
              )}
            >
              <span className="label-mono border-live/30 bg-live/10 text-live absolute top-4 right-4 rounded-full border px-2 py-0.5 text-[9px]">
                RECOMMENDED
              </span>
              <div className="pattern-dots relative flex h-36 items-center justify-center rounded-xl">
                <div
                  aria-hidden
                  className={cn(
                    "bg-brand/10 absolute size-28 rounded-full blur-2xl transition-opacity duration-500",
                    focus === "custom" ? "opacity-100" : "opacity-0",
                  )}
                />
                <div
                  className={cn(
                    "relative transition-transform duration-500",
                    focus === "custom" && "-translate-y-1",
                  )}
                >
                  <CustomDomainIllustration active={focus === "custom"} />
                </div>
              </div>
              <h2 className="text-foreground mt-6 text-base font-semibold">
                Connect a custom domain
              </h2>
              <p className="text-muted-foreground mx-auto mt-2 max-w-60 flex-1 text-[13px] leading-relaxed">
                Already have a domain? Links on it build trust — and earn the
                clicks to prove it.
              </p>
              <Button
                onClick={() => setConnecting(true)}
                variant={focus === "custom" ? "default" : "outline"}
                className="mt-6 h-10 w-full"
              >
                Connect domain
                <ArrowRight className="size-4" data-icon="inline-end" />
              </Button>
            </div>

            <div
              onMouseEnter={() => setFocus("default")}
              className={cn(
                "bg-card/40 flex flex-col rounded-2xl border p-7 transition-colors duration-300",
                focus === "default" ? "border-ring/60" : "border-border/60",
              )}
            >
              <div className="pattern-dots relative flex h-36 items-center justify-center rounded-xl">
                <div
                  aria-hidden
                  className={cn(
                    "bg-brand/10 absolute size-28 rounded-full blur-2xl transition-opacity duration-500",
                    focus === "default" ? "opacity-100" : "opacity-0",
                  )}
                />
                <div
                  className={cn(
                    "relative transition-transform duration-500",
                    focus === "default" && "-translate-y-1",
                  )}
                >
                  <DefaultDomainIllustration />
                </div>
              </div>
              <h2 className="text-foreground mt-6 text-base font-semibold">
                Stay on spoo.me
              </h2>
              <p className="text-muted-foreground mx-auto mt-2 max-w-60 flex-1 text-[13px] leading-relaxed">
                The default domain, no setup — and you can bring your own
                whenever you&apos;re ready.
              </p>
              <Button
                onClick={onDone}
                variant={focus === "default" ? "default" : "outline"}
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
          className="text-muted-foreground hover:text-foreground mt-8 text-sm transition-colors"
        >
          I&apos;ll do this later
        </button>
      )}
    </div>
  )
}
