"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, Check, Copy, KeyRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text"
import { celebrate } from "@/lib/confetti"
import { createApiKey, SpooApiError, type ApiKeyCreated } from "@/lib/api"

/**
 * Hand-lit curl — the request is fixed-shape, so we color the tokens
 * directly rather than running Shiki on a one-liner. Same multi-color
 * register as the developer section's code blocks; the live token echoes
 * the hero key in foreground ink inside the auth string.
 */
function CurlBlock({ token }: { token: string }) {
  // Deliberately low-contrast: nothing here is full white — the key above
  // owns that. Syntax tints stay, dialed down so color doesn't pull focus.
  const base = "text-muted-foreground/80"
  const flag = "text-muted-foreground/50"
  const str = "text-amber-200/45"
  const cont = "text-muted-foreground/25"
  return (
    <pre className="overflow-x-auto px-4 pt-1 pb-3.5 text-left font-mono text-[11px] leading-relaxed whitespace-pre [scrollbar-width:thin]">
      <code>
        <span className={base}>curl</span> <span className={flag}>-X</span>{" "}
        <span className="text-emerald-400/55">POST</span>{" "}
        <span className="text-sky-400/55">https://spoo.me/api/v1/shorten</span>{" "}
        <span className={cont}>{"\\"}</span>
        {"\n  "}
        <span className={flag}>-H</span>{" "}
        <span className={str}>
          {'"Authorization: Bearer '}
          <span className="text-foreground/70">{token}</span>
          {'"'}
        </span>{" "}
        <span className={cont}>{"\\"}</span>
        {"\n  "}
        <span className={flag}>-H</span>{" "}
        <span className={str}>{'"Content-Type: application/json"'}</span>{" "}
        <span className={cont}>{"\\"}</span>
        {"\n  "}
        <span className={flag}>-d</span>{" "}
        <span className={str}>
          {"'{"}
          <span className="text-sky-300/45">{'"long_url"'}</span>
          {': "https://example.com"}\''}
        </span>
      </code>
    </pre>
  )
}

export function ApiStep({
  onDone,
  onSkip,
}: {
  onDone: (key: ApiKeyCreated) => void
  onSkip: () => void
}) {
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [created, setCreated] = React.useState<ApiKeyCreated | null>(null)
  const [copied, setCopied] = React.useState<"key" | "curl" | null>(null)
  const keyCardRef = React.useRef<HTMLDivElement>(null)

  async function generate() {
    if (pending || created) return
    setPending(true)
    setError(null)
    try {
      const key = await createApiKey({
        name: "Onboarding key",
        description: "Created during onboarding",
        scopes: ["shorten:create", "urls:read", "stats:read"],
      })
      setCreated(key)
    } catch (err) {
      if (err instanceof SpooApiError && err.needsVerification) {
        setError("Your email needs to be verified before creating API keys.")
      } else if (err instanceof SpooApiError && err.isRateLimit) {
        setError("Key creation is rate-limited. Try again in a bit.")
      } else if (err instanceof SpooApiError) {
        setError(err.message)
      } else {
        setError("Can't reach the server. Try again in a moment.")
      }
    } finally {
      setPending(false)
    }
  }

  const curl = created
    ? `curl -X POST https://spoo.me/api/v1/shorten \\
  -H "Authorization: Bearer ${created.token}" \\
  -H "Content-Type: application/json" \\
  -d '{"long_url": "https://example.com"}'`
    : ""

  async function copy(kind: "key" | "curl") {
    if (!created) return
    await navigator.clipboard.writeText(kind === "key" ? created.token : curl)
    setCopied(kind)
    setTimeout(() => setCopied(null), 1600)
  }

  // One celebratory burst when the key lands, sourced from the key card.
  React.useEffect(() => {
    if (!created) return
    const t = setTimeout(() => celebrate(keyCardRef.current), 120)
    return () => clearTimeout(t)
  }, [created])

  // After creation: Enter advances.
  React.useEffect(() => {
    if (!created) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter") {
        e.preventDefault()
        onDone(created!)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [created, onDone])

  return (
    <div className="flex w-full flex-col items-center text-center [--code-surface:var(--card)] dark:[--code-surface:#09090b]">
      <h1 className="text-foreground text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {created ? "Your key is ready" : "Get your API key"}
      </h1>
      <p className="text-muted-foreground mt-3 max-w-sm text-sm leading-relaxed">
        {created
          ? "Copy it now — the full key is shown only this once."
          : "Scoped to creating links and reading stats. You can rotate or revoke it any time."}
      </p>

      <AnimatePresence mode="wait" initial={false}>
        {created ? (
          <motion.div
            key="created"
            initial={{ opacity: 0, y: 16, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="mt-10 w-full max-w-xl text-left"
          >
            {/* Hero — the key, large and isolated. It owns the screen's
                contrast (full white) and size; everything below recedes.
                Crop-mark frame = the landing's alias-selection motif. */}
            <div ref={keyCardRef} className="text-center">
              <div className="flex items-center justify-center gap-2">
                <span className="border-border/60 bg-card text-foreground flex size-6 items-center justify-center rounded-md border">
                  <KeyRound className="size-3.5" aria-hidden />
                </span>
                <span className="label-mono text-muted-foreground/70 text-[10px]">
                  Secret key
                </span>
              </div>

              <div className="mt-6 flex justify-center">
                <div className="relative max-w-full overflow-x-auto px-6 py-4 [scrollbar-width:none]">
                  <span
                    aria-hidden
                    className="border-foreground/50 absolute top-0 left-0 size-3 border-t border-l"
                  />
                  <span
                    aria-hidden
                    className="border-foreground/50 absolute top-0 right-0 size-3 border-t border-r"
                  />
                  <span
                    aria-hidden
                    className="border-foreground/50 absolute bottom-0 left-0 size-3 border-b border-l"
                  />
                  <span
                    aria-hidden
                    className="border-foreground/50 absolute right-0 bottom-0 size-3 border-r border-b"
                  />
                  <AnimatedShinyText
                    shimmerWidth={140}
                    className="text-foreground/80 max-w-none font-mono text-lg font-semibold tracking-tight whitespace-nowrap dark:via-white sm:text-2xl"
                  >
                    {created.token}
                  </AnimatedShinyText>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <Button onClick={() => void copy("key")} size="sm" variant="outline">
                  {copied === "key" ? (
                    <>
                      <Check className="text-live size-3.5" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-3.5" />
                      Copy key
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Footnote — try it. No panel weight: faint border, no header
                divider, low-contrast code. A quiet reference, not a peer. */}
            <div className="border-border/40 relative mt-12 overflow-hidden rounded-lg border bg-[var(--code-surface)]">
              <div className="flex items-center justify-between px-4 pt-2.5">
                <span className="label-mono text-muted-foreground/50 text-[10px]">
                  Try it now
                </span>
                <Button
                  onClick={() => void copy("curl")}
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Copy curl command"
                  className="text-muted-foreground/50 hover:text-foreground"
                >
                  {copied === "curl" ? (
                    <Check className="text-live size-3" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </Button>
              </div>
              <CurlBlock token={created.token} />
            </div>

            <div className="flex flex-col items-center pt-10">
              <Button onClick={() => onDone(created)} className="h-10 min-w-44">
                Continue
                <ArrowRight className="size-4" data-icon="inline-end" />
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="generate"
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-10 flex w-full max-w-md flex-col items-center"
          >
            <div className="border-border/60 bg-card/50 w-full rounded-xl border border-dashed p-6">
              <div className="border-border/60 bg-muted/40 text-muted-foreground mx-auto flex size-10 items-center justify-center rounded-lg border">
                <KeyRound className="size-4" aria-hidden />
              </div>
              <div className="label-mono text-muted-foreground mt-4 text-[10px]">
                scopes
              </div>
              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                {["shorten:create", "urls:read", "stats:read"].map((s) => (
                  <code
                    key={s}
                    className="border-border/60 bg-background text-foreground/80 rounded-md border px-2 py-0.5 font-mono text-[11px]"
                  >
                    {s}
                  </code>
                ))}
              </div>
            </div>

            {error && (
              <p role="alert" className="text-destructive mt-4 text-sm">
                {error}
              </p>
            )}

            <Button
              onClick={() => void generate()}
              className="mt-6 h-10 min-w-44"
              disabled={pending}
            >
              {pending ? "Generating…" : "Generate API key"}
              {!pending && <ArrowRight className="size-4" data-icon="inline-end" />}
            </Button>
            <button
              type="button"
              onClick={onSkip}
              className="text-muted-foreground/70 hover:text-foreground mt-4 text-xs underline-offset-4 transition-colors hover:underline"
            >
              I&apos;ll do this later
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
