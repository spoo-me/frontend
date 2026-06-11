"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, Check, Copy, KeyRound, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { createApiKey, SpooApiError, type ApiKeyCreated } from "@/lib/api"

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
          ? "Run the request below — your first 201 is one paste away."
          : "Scoped to creating links and reading stats. You can rotate or revoke it any time."}
      </p>

      <AnimatePresence mode="wait" initial={false}>
        {created ? (
          <motion.div
            key="created"
            initial={{ opacity: 0, y: 16, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="mt-10 w-full max-w-lg space-y-3 text-left"
          >
            <div className="border-border/60 bg-card shadow-card rounded-xl border p-4 dark:shadow-none">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="label-mono text-muted-foreground text-[10px]">
                    API key · shown once
                  </div>
                  <code className="text-foreground mt-1 block truncate font-mono text-[13px]">
                    {created.token}
                  </code>
                </div>
                <Button
                  onClick={() => void copy("key")}
                  size="icon-sm"
                  variant="outline"
                  aria-label="Copy API key"
                  className="shrink-0"
                >
                  {copied === "key" ? (
                    <Check className="text-live size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </Button>
              </div>
              <p className="text-muted-foreground/80 mt-3 flex items-start gap-1.5 text-xs leading-relaxed">
                <TriangleAlert className="mt-0.5 size-3 shrink-0" aria-hidden />
                Store it somewhere safe — we only show the full key at creation.
              </p>
            </div>

            <div className="border-border/60 relative overflow-hidden rounded-xl border bg-[var(--code-surface)]">
              <div className="border-border/60 flex items-center justify-between border-b px-4 py-2">
                <span className="label-mono text-muted-foreground text-[10px]">
                  Your first request
                </span>
                <Button
                  onClick={() => void copy("curl")}
                  size="icon-xs"
                  variant="ghost"
                  aria-label="Copy curl command"
                  className="text-muted-foreground hover:text-foreground"
                >
                  {copied === "curl" ? (
                    <Check className="text-live size-3" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                </Button>
              </div>
              <pre className="overflow-x-auto px-4 py-3.5 text-left font-mono text-xs leading-relaxed [scrollbar-width:thin]">
                <code className="text-foreground/85">{curl}</code>
              </pre>
            </div>

            <div className="flex flex-col items-center pt-4">
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
