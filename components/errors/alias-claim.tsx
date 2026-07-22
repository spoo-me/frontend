"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "motion/react"
import {
  ArrowUpRight,
  ChartColumn,
  Check,
  Copy,
  Link2,
  Loader2,
} from "lucide-react"

import { apiFetch, jsonInit, parse } from "@/lib/api/client"
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
      const res = await apiFetch(
        "/api/v1/shorten",
        jsonInit("POST", alias ? { url: wire, alias } : { url: wire })
      )
      const data = await parse<{ short_url?: string }>(res)
      if (!data.short_url) throw new Error("That didn't work. Try again.")
      setState({ kind: "claimed", short: data.short_url })
      trackUiAction("error_alias_claimed", alias ? "alias" : "freeform")
      celebrate(buttonRef.current)
      // The fisherman's scene listens for this: something just bit.
      window.dispatchEvent(new CustomEvent("spoo:alias-claimed"))
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
    // The link itself already headlines the page; what's left is what you
    // DO with it. Stats first among the quiet ones — that page is the
    // product making its own case.
    const aliasPath = (() => {
      try {
        return new URL(state.short).pathname.replace(/^\//, "")
      } catch {
        return ""
      }
    })()
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="lg"
          onClick={async () => {
            await navigator.clipboard.writeText(state.short)
            setCopied(true)
            setTimeout(() => setCopied(false), 1600)
          }}
        >
          {copied ? (
            <Check data-icon="inline-start" className="size-3.5 text-live" />
          ) : (
            <Copy data-icon="inline-start" className="size-3.5" />
          )}
          {copied ? "Copied" : "Copy link"}
        </Button>
        {aliasPath && (
          <Button asChild variant="outline" size="lg">
            <Link href={`/stats/${aliasPath}`}>
              <ChartColumn data-icon="inline-start" className="size-3.5" />
              Live stats
            </Link>
          </Button>
        )}
        <Button
          asChild
          variant="ghost"
          size="lg"
          className="text-muted-foreground hover:text-foreground"
        >
          <a href={state.short} target="_blank" rel="noreferrer">
            Open
            <ArrowUpRight data-icon="inline-end" className="size-3.5" />
          </a>
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="rounded-xl border border-border/60 bg-background/45 p-1 shadow-soft">
        <motion.form
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
      </div>
      {/* Fixed-height slot: the error appearing must not move the page. */}
      <p className="mt-1.5 h-4 px-1 text-destructive text-xs">
        {state.kind === "failed" ? state.message : ""}
      </p>
    </div>
  )
}
