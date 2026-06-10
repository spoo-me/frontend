"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, Check, Copy } from "lucide-react"
import { BaseQr, encodeData } from "simple-qrbtf"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { checkAlias, shorten, SpooApiError, type ShortUrl } from "@/lib/api"

type AliasState =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "available" }
  | { kind: "unavailable"; reason: string }

export function LinkStep({
  onDone,
  onSkip,
}: {
  onDone: (link: ShortUrl) => void
  onSkip: () => void
}) {
  const [url, setUrl] = React.useState("")
  const [alias, setAlias] = React.useState("")
  const [aliasState, setAliasState] = React.useState<AliasState>({ kind: "idle" })
  const [pending, setPending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [created, setCreated] = React.useState<ShortUrl | null>(null)
  const [copied, setCopied] = React.useState(false)

  const urlLooksValid = /^https?:\/\/\S+\.\S+/.test(url.trim())

  // Debounced live alias availability — same affordance as the legacy
  // create modal, against the real check-alias endpoint.
  React.useEffect(() => {
    if (!alias) {
      setAliasState({ kind: "idle" })
      return
    }
    if (alias.length < 3) {
      setAliasState({ kind: "unavailable", reason: "3+ characters" })
      return
    }
    setAliasState({ kind: "checking" })
    const t = setTimeout(() => {
      checkAlias(alias)
        .then((r) =>
          setAliasState(
            r.available
              ? { kind: "available" }
              : {
                  kind: "unavailable",
                  reason: r.reason === "taken" ? "already taken" : "invalid format",
                },
          ),
        )
        .catch(() => setAliasState({ kind: "idle" }))
    }, 350)
    return () => clearTimeout(t)
  }, [alias])

  async function submit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!urlLooksValid || pending || created) return
    if (alias && aliasState.kind === "unavailable") return
    setPending(true)
    setError(null)
    try {
      const link = await shorten({
        long_url: url.trim(),
        ...(alias ? { alias } : {}),
      })
      setCreated(link)
    } catch (err) {
      if (err instanceof SpooApiError && err.status === 409) {
        setError("That alias just got taken — try another.")
        setAliasState({ kind: "unavailable", reason: "already taken" })
      } else if (err instanceof SpooApiError && err.needsVerification) {
        setError("Your email needs to be verified before creating links.")
      } else if (err instanceof SpooApiError) {
        setError(err.message)
      } else {
        setError("Can't reach the server. Try again in a moment.")
      }
    } finally {
      setPending(false)
    }
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

  async function copy() {
    if (!created) return
    await navigator.clipboard.writeText(created.short_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <div className="flex w-full flex-col items-center text-center">
      <h1 className="text-foreground text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {created ? "Your first link is live" : "Create your first link"}
      </h1>
      <p className="text-muted-foreground mt-3 max-w-sm text-sm leading-relaxed">
        {created
          ? "Share it anywhere — every click lands in your analytics."
          : "Paste any long URL you actually use. We'll make it short."}
      </p>

      <AnimatePresence mode="wait" initial={false}>
        {created ? (
          <motion.div
            key="created"
            initial={{ opacity: 0, y: 16, filter: "blur(3px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="mt-10 w-full max-w-md"
          >
            <div className="border-border/60 bg-card shadow-card rounded-xl border p-5 dark:shadow-none">
              <div className="flex items-center gap-4">
                <QrTile url={created.short_url} />
                <div className="min-w-0 flex-1 text-left">
                  <div className="label-mono text-muted-foreground text-[10px]">
                    Short link
                  </div>
                  <div className="text-foreground mt-1 truncate font-mono text-sm font-medium">
                    {created.short_url.replace(/^https?:\/\//, "")}
                  </div>
                  <div className="text-muted-foreground/70 mt-1.5 truncate text-xs">
                    → {created.long_url}
                  </div>
                </div>
                <Button
                  onClick={() => void copy()}
                  size="icon-sm"
                  variant="outline"
                  aria-label="Copy short link"
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="text-live size-3.5" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                </Button>
              </div>
            </div>
            <Button onClick={() => onDone(created)} className="mt-8 h-10 min-w-44">
              Continue
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Button>
            <p className="label-mono text-muted-foreground/50 mt-3 text-[10px]">
              press ↵ to continue
            </p>
          </motion.div>
        ) : (
          <motion.form
            key="form"
            onSubmit={submit}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="mt-10 w-full max-w-md space-y-3 text-left"
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor="ob-url" className="text-foreground text-sm font-medium">
                Destination URL
              </label>
              <Input
                id="ob-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/very/long/path?with=params"
                autoFocus
                required
                className="h-10"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between">
                <label htmlFor="ob-alias" className="text-foreground text-sm font-medium">
                  Custom alias
                </label>
                <span className="text-muted-foreground/70 text-xs">optional</span>
              </div>
              <div className="border-input focus-within:border-ring focus-within:ring-ring/30 shadow-soft flex items-center rounded-lg border transition-[box-shadow,border-color] focus-within:ring-2">
                <span className="text-muted-foreground border-border/60 border-r px-3 font-mono text-sm">
                  spoo.me/
                </span>
                <input
                  id="ob-alias"
                  value={alias}
                  onChange={(e) =>
                    setAlias(e.target.value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 16))
                  }
                  placeholder="launch"
                  className="placeholder:text-muted-foreground/50 h-10 min-w-0 flex-1 bg-transparent px-3 font-mono text-sm outline-none"
                />
                <span className="pr-3">
                  <AliasBadge state={aliasState} />
                </span>
              </div>
            </div>

            {error && (
              <p role="alert" className="text-destructive text-sm">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="mt-2 h-10 w-full"
              disabled={
                pending ||
                !urlLooksValid ||
                (alias.length > 0 && aliasState.kind !== "available")
              }
            >
              {pending ? "Shortening…" : "Shorten it"}
              {!pending && <ArrowRight className="size-4" data-icon="inline-end" />}
            </Button>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={onSkip}
                className="text-muted-foreground/70 hover:text-foreground text-xs underline-offset-4 transition-colors hover:underline"
              >
                I&apos;ll do this later
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  )
}

function AliasBadge({ state }: { state: AliasState }) {
  if (state.kind === "idle") return null
  return (
    <span
      className={cn(
        "label-mono text-[9px] whitespace-nowrap",
        state.kind === "available" && "text-live",
        state.kind === "checking" && "text-muted-foreground/60",
        state.kind === "unavailable" && "text-destructive",
      )}
      aria-live="polite"
    >
      {state.kind === "checking"
        ? "checking…"
        : state.kind === "available"
          ? "available"
          : state.reason}
    </span>
  )
}

function QrTile({ url }: { url: string }) {
  const svg = React.useMemo(() => {
    const data = encodeData({ text: url })
    return BaseQr({ qrcode: data, otherColor: "currentColor", posColor: "currentColor" })
  }, [url])
  return (
    <div className="border-border/70 bg-background shrink-0 rounded-lg border p-2">
      <div
        role="img"
        aria-label={`QR code for ${url}`}
        className="text-foreground/90 size-16 [&_svg]:size-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  )
}
