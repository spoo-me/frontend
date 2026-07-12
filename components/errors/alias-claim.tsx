"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { Check, Copy, Link2, Loader2 } from "lucide-react"

import { celebrate } from "@/lib/confetti"
import { trackUiAction } from "@/lib/analytics"
import { normalizeUrl, urlProblem, validDestinationUrl } from "@/lib/validation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type State =
  | { kind: "idle" }
  | { kind: "claiming" }
  | { kind: "claimed"; short: string }
  | { kind: "failed"; message: string }

/**
 * The shorten box the error pages carry: with `alias` it claims that exact
 * alias (the 404's whole trick), without it it's a plain shortener (the
 * 410's create-your-own CTA). Anonymous on purpose; /api/v1/shorten takes
 * optional auth on the real backend and the mock mirrors it.
 */
export function AliasClaim({
  alias,
  onClaimed,
}: {
  alias?: string
  onClaimed?: () => void
}) {
  const [url, setUrl] = React.useState("")
  const [state, setState] = React.useState<State>({ kind: "idle" })
  const [copied, setCopied] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    const wire = normalizeUrl(url)
    if (!wire) return
    const problem =
      urlProblem(url) ??
      (validDestinationUrl(wire) ? null : "That URL can't be shortened.")
    if (problem) {
      setState({ kind: "failed", message: problem })
      return
    }
    setState({ kind: "claiming" })
    try {
      const res = await fetch("/api/v1/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alias ? { url: wire, alias } : { url: wire }),
      })
      const data = (await res.json().catch(() => null)) as {
        short_url?: string
        error?: string
      } | null
      if (!res.ok || !data?.short_url)
        throw new Error(data?.error ?? "That didn't work. Try again.")
      setState({ kind: "claimed", short: data.short_url })
      trackUiAction("error_alias_claimed", alias ? "alias" : "freeform")
      celebrate(buttonRef.current)
      onClaimed?.()
    } catch (err) {
      setState({
        kind: "failed",
        message:
          err instanceof Error ? err.message : "That didn't work. Try again.",
      })
    }
  }

  if (state.kind === "claimed") {
    return (
      <div className="flex items-center gap-2">
        {/* Crop-mark frame: the house "you made an artifact" motif. */}
        <div className="relative px-5 py-3">
          <span
            aria-hidden
            className="absolute top-0 left-0 size-3 border-foreground/50 border-t border-l"
          />
          <span
            aria-hidden
            className="absolute top-0 right-0 size-3 border-foreground/50 border-t border-r"
          />
          <span
            aria-hidden
            className="absolute bottom-0 left-0 size-3 border-foreground/50 border-b border-l"
          />
          <span
            aria-hidden
            className="absolute right-0 bottom-0 size-3 border-foreground/50 border-r border-b"
          />
          <a
            href={state.short}
            target="_blank"
            rel="noreferrer"
            className="font-mono font-semibold text-foreground text-xl tracking-tight transition-colors duration-150 hover:text-foreground/80"
          >
            {state.short.replace(/^https?:\/\//, "")}
          </a>
        </div>
        <button
          type="button"
          aria-label={copied ? "Copied" : "Copy short link"}
          onClick={async () => {
            await navigator.clipboard.writeText(state.short)
            setCopied(true)
            setTimeout(() => setCopied(false), 1600)
          }}
          className={
            copied
              ? "flex size-7 shrink-0 items-center justify-center rounded-md text-live"
              : "flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground/60 transition-colors duration-150 hover:bg-accent/60 hover:text-foreground"
          }
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="rounded-xl border border-border/60 bg-background/45 p-1 shadow-soft">
        <AnimatePresence mode="wait">
          <motion.form
            key="form"
            onSubmit={onSubmit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex h-10 items-center gap-2 pl-2"
          >
            <span className="flex h-full shrink-0 items-center">
              <Link2 className="size-4 text-muted-foreground" />
            </span>
            <Input
              type="text"
              inputMode="url"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value)
                if (state.kind === "failed") setState({ kind: "idle" })
              }}
              placeholder="Paste a long URL…"
              className="h-10 border-0 bg-transparent px-2 text-sm shadow-none focus-visible:border-transparent focus-visible:ring-0"
              autoComplete="off"
              spellCheck={false}
              required
              disabled={state.kind === "claiming"}
            />
            <Button
              ref={buttonRef}
              type="submit"
              size="sm"
              className="h-9 px-3"
              disabled={state.kind === "claiming" || !url.trim()}
            >
              {state.kind === "claiming" ? (
                <>
                  <Loader2
                    className="size-3.5 animate-spin"
                    data-icon="inline-start"
                  />
                  {alias ? "Claiming" : "Shortening"}
                </>
              ) : alias ? (
                `Claim /${alias}`
              ) : (
                "Shorten"
              )}
            </Button>
          </motion.form>
        </AnimatePresence>
      </div>
      {/* Fixed-height slot: the error appearing must not move the page. */}
      <p className="mt-1.5 h-4 px-1 text-destructive text-xs">
        {state.kind === "failed" ? state.message : ""}
      </p>
    </div>
  )
}
