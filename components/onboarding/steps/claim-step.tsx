"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { AnimatePresence, motion } from "motion/react"
import { ArrowRight, CircleCheck } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { celebrate } from "@/lib/confetti"
import { claimLinks, SpooApiError, type ClaimStatus } from "@/lib/api"
import {
  claimableLinks,
  removeRecentLinks,
  stripClaimTokens,
  type RecentLink,
} from "@/lib/recent-links"
import { STEP_ROUTES } from "@/lib/onboarding"

/** Compact relative age for the row's mono meta ("2h ago", "5d ago"). */
function age(createdAt: number): string {
  const mins = Math.max(1, Math.floor((Date.now() - createdAt) / 60_000))
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return ""
  }
}

type Phase =
  | { kind: "offer" }
  | { kind: "claiming" }
  | { kind: "done"; outcomes: Map<string, ClaimStatus> }

/**
 * The signup adoption moment: links shortened in this browser before the
 * account existed, offered once with explicit consent. The list is the
 * proof — no token appears anywhere in the UI.
 *
 * Unchecking and declining both mean "not now", never "destroy": on a
 * shared computer an unchecked link may belong to the NEXT person to
 * sign up here, so unclaimed tokens survive (bounded by the 30-day
 * offer window). Only an answered claim spends a token.
 */
export function ClaimStep({ onDone }: { onDone: () => void }) {
  const router = useRouter()
  const [links, setLinks] = React.useState<RecentLink[] | null>(null)
  const [checked, setChecked] = React.useState<Set<string>>(new Set())
  const [phase, setPhase] = React.useState<Phase>({ kind: "offer" })
  const [error, setError] = React.useState<string | null>(null)
  const listRef = React.useRef<HTMLUListElement>(null)

  // localStorage is client-only; resolve after mount. Nothing claimable
  // means this step never existed (same move as the flag-gated domain step).
  React.useEffect(() => {
    const found = claimableLinks()
    if (found.length === 0) {
      router.replace(STEP_ROUTES.apps)
      return
    }
    setLinks(found)
    setChecked(new Set(found.map((l) => l.code)))
  }, [router])

  const done = phase.kind === "done"
  const claimedCount = done
    ? [...phase.outcomes.values()].filter((s) => s !== "invalid").length
    : 0
  const failedCount = done ? phase.outcomes.size - claimedCount : 0

  React.useEffect(() => {
    if (!done) return
    // Zero adoptions is not a celebration.
    const t =
      claimedCount > 0
        ? setTimeout(() => celebrate(listRef.current), 120)
        : undefined
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter") {
        e.preventDefault()
        onDone()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      if (t !== undefined) clearTimeout(t)
      window.removeEventListener("keydown", onKey)
    }
  }, [done, claimedCount, onDone])

  if (!links) return null

  const selected = links.filter((l) => checked.has(l.code))

  function toggle(code: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
  }

  async function claim() {
    if (selected.length === 0 || phase.kind === "claiming") return
    setPhase({ kind: "claiming" })
    setError(null)
    try {
      const outcome = await claimLinks(
        selected.map((l) => ({ url_id: l.urlId!, token: l.claimToken! }))
      )
      const outcomes = new Map<string, ClaimStatus>()
      for (const r of outcome.results) {
        const link = selected.find((l) => l.urlId === r.url_id)
        if (link) outcomes.set(link.code, r.status)
      }
      // Claimed links leave the anonymous shelf (they live in the
      // dashboard now); invalid ones stay, minus their spent tokens.
      const claimedCodes = [...outcomes.entries()]
        .filter(([, status]) => status !== "invalid")
        .map(([code]) => code)
      removeRecentLinks(claimedCodes)
      stripClaimTokens(selected.map((l) => l.code))
      setPhase({ kind: "done", outcomes })
    } catch (err) {
      setPhase({ kind: "offer" })
      setError(
        err instanceof SpooApiError
          ? err.message
          : "Can't reach the server. Try again in a moment."
      )
    }
  }

  function decline() {
    onDone()
  }

  return (
    <div className="flex w-full flex-col items-center text-center">
      <h1 className="text-balance font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
        {done
          ? claimedCount > 0
            ? "They're in your dashboard"
            : "Those couldn't be added"
          : "Your links are already here"}
      </h1>
      <p className="mt-3 max-w-sm text-muted-foreground text-sm leading-relaxed">
        {done
          ? failedCount === 0
            ? "They live in your account now like any other link, every click they've collected included."
            : claimedCount > 0
              ? `${claimedCount} added. ${failedCount} couldn't be verified and stayed anonymous.`
              : "None of them could be verified, so they stayed anonymous. They keep working, they just won't appear in your dashboard."
          : links.length === 1
            ? "Shortened here before you signed up, still collecting clicks. Bring it along if it's yours."
            : "Shortened here before you signed up, still collecting clicks. Bring the ones that are yours."}
      </p>

      <ul
        ref={listRef}
        className="mt-10 w-full max-w-md divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60 bg-card/50 text-left"
      >
        {links.map((link) => {
          const outcome = done ? phase.outcomes.get(link.code) : undefined
          const host = hostOf(link.original)
          return (
            <li key={link.code}>
              <label
                className={
                  done
                    ? "flex items-center gap-3 px-4 py-3"
                    : "flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/40"
                }
              >
                {done ? (
                  outcome && outcome !== "invalid" ? (
                    <CircleCheck className="size-4 shrink-0 text-live" />
                  ) : (
                    <span
                      aria-hidden
                      className="size-4 shrink-0 rounded-full border border-border"
                    />
                  )
                ) : (
                  <Checkbox
                    checked={checked.has(link.code)}
                    onCheckedChange={() => toggle(link.code)}
                    aria-label={`Add ${link.short} to your account`}
                  />
                )}
                {host && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`https://www.google.com/s2/favicons?domain=${host}&sz=64`}
                    alt=""
                    className="size-3.5 shrink-0 rounded-[3px]"
                  />
                )}
                <span className="shrink-0 font-mono text-foreground text-sm">
                  {link.short.replace(/^https?:\/\//, "")}
                </span>
                <span className="min-w-0 flex-1 truncate text-muted-foreground/70 text-xs">
                  {link.original}
                </span>
                <span className="shrink-0 font-mono text-[11px] text-muted-foreground/60">
                  {done
                    ? outcome === "already_yours"
                      ? "already added"
                      : outcome === "claimed"
                        ? "added"
                        : "not verified"
                    : age(link.createdAt)}
                </span>
              </label>
            </li>
          )
        })}
      </ul>

      {error && (
        <p role="alert" className="mt-4 text-destructive text-sm">
          {error}
        </p>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.div
            key="continue"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Button onClick={onDone} className="mt-10 h-10 min-w-44">
              Continue
              <ArrowRight className="size-4" data-icon="inline-end" />
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="claim"
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center"
          >
            <Button
              onClick={() => void claim()}
              disabled={selected.length === 0 || phase.kind === "claiming"}
              className="mt-10 h-10 min-w-44"
            >
              {phase.kind === "claiming"
                ? "Adding…"
                : selected.length === 0
                  ? "Add links"
                  : selected.length === 1
                    ? "Add this link"
                    : `Add ${selected.length} links`}
              {phase.kind !== "claiming" && (
                <ArrowRight className="size-4" data-icon="inline-end" />
              )}
            </Button>
            <button
              type="button"
              onClick={decline}
              className="mt-4 text-muted-foreground/70 text-xs underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Leave them anonymous
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
