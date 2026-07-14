"use client"

import * as React from "react"

import { checkAlias, type CheckAliasReason } from "@/lib/api"
import {
  countGraphemes,
  findUnsupportedGraphemes,
  isEmojiCandidate,
} from "@/lib/emoji-alias"

/** The one alias state machine, shared by the composer, the settings form and
    onboarding. `unknown` = the check could not complete (404 / network /
    non-2xx); it is deliberately non-blocking, since the backend re-validates
    on create. */
export type AliasVerdict =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "available" }
  | { state: "unknown" }
  | { state: "problem"; reason: CheckAliasReason; message: string }

/** What a completed check-alias round trip cached, keyed to the exact input
    (alias + domain). `kind: "fail"` records that the request errored so the
    machine can leave "checking" instead of spinning forever. */
type CachedVerdict =
  | {
      key: string
      kind: "ok"
      available: boolean
      reason: CheckAliasReason | null
    }
  | { key: string; kind: "fail" }

/** The identity of a verdict: alias AND domain, so a cached answer never
    survives a domain switch. */
export function aliasVerdictKey(alias: string, domain?: string): string {
  return `${alias} ${domain ?? ""}`
}

/** Policy cap, mirrored only to skip a doomed round trip; the server counts
    the same graphemes and has the final say. */
export const MAX_EMOJI_GRAPHEMES = 15
const MIN_ALNUM = 3
const MAX_ALNUM = 16
const DEBOUNCE_MS = 350

/** Accurate generic emoji-policy copy, used when the specific offender cannot
    be pinpointed client-side (set not loaded, or nothing flagged locally). No
    flags/keycaps/joined list — it misleads for the common VS16 case. */
export const EMOJI_POLICY_GENERIC =
  "Some of those emoji won't work in a link address. Solid emoji and skin tones work."

/**
 * Reason → hint copy (muted register, used by the composer and settings form).
 * The alnum and emoji lanes phrase `length` differently; everything else is
 * shared. Onboarding does not use this map — it renders terse forms keyed on
 * the reason itself. `emoji_policy` returns the generic message; callers with
 * the accepted set should prefer `emojiPolicyHint` to name the offender.
 */
export function aliasHintMessage(
  reason: CheckAliasReason,
  isEmoji: boolean
): string {
  switch (reason) {
    case "format":
      return "Letters, numbers, - and _, or emoji. Not both."
    case "length":
      return isEmoji
        ? `Up to ${MAX_EMOJI_GRAPHEMES} emoji.`
        : "3-16 characters: letters, numbers, - and _"
    case "emoji_policy":
      return EMOJI_POLICY_GENERIC
    case "reserved":
      return "That alias is reserved."
    case "taken":
      return "That alias is taken, try another."
  }
}

/**
 * Emoji-policy hint that NAMES the offending grapheme(s) using the fetched
 * accepted set. Falls back to the accurate generic message when the set is
 * unavailable or nothing is flagged locally (so it never blocks on the set and
 * never misstates the cause). For the message only; the server stays
 * authoritative.
 */
export function emojiPolicyHint(
  alias: string,
  accepted: Set<string> | null | undefined
): string {
  if (!accepted || accepted.size === 0) return EMOJI_POLICY_GENERIC
  const offenders = findUnsupportedGraphemes(alias, accepted)
  if (offenders.length === 0) return EMOJI_POLICY_GENERIC
  if (offenders.length === 1)
    return `${offenders[0]} won't work in a link address, try another.`
  const others = offenders.length - 1
  return `${offenders[0]} and ${others} other${others === 1 ? "" : "s"} won't work in a link address.`
}

/** Is this input locally gated (no server round trip needed / possible)? */
function isGatedLocally(alias: string, enabled: boolean): boolean {
  if (!enabled || !alias) return true
  if (isEmojiCandidate(alias))
    return countGraphemes(alias) > MAX_EMOJI_GRAPHEMES
  return alias.length < MIN_ALNUM || alias.length > MAX_ALNUM
}

/**
 * Pure state derivation, so the failure path is unit-testable without a
 * renderer. Coarse local gates first (alnum length; emoji grapheme count and
 * empty); then the cached server answer if it matches the current input; a
 * failed request resolves to `unknown` (non-blocking); otherwise `checking`.
 */
export function resolveAliasVerdict(
  alias: string,
  domain: string | undefined,
  enabled: boolean,
  cached: CachedVerdict | null
): AliasVerdict {
  if (!enabled || !alias) return { state: "idle" }
  const isEmoji = isEmojiCandidate(alias)
  const graphemes = isEmoji ? countGraphemes(alias) : alias.length
  if (isEmoji && graphemes > MAX_EMOJI_GRAPHEMES)
    return {
      state: "problem",
      reason: "length",
      message: aliasHintMessage("length", true),
    }
  if (!isEmoji && (alias.length < MIN_ALNUM || alias.length > MAX_ALNUM))
    return {
      state: "problem",
      reason: "length",
      message: aliasHintMessage("length", false),
    }
  if (cached?.key === aliasVerdictKey(alias, domain)) {
    if (cached.kind === "fail") return { state: "unknown" }
    if (cached.available) return { state: "available" }
    const reason = cached.reason ?? "taken"
    return {
      state: "problem",
      reason,
      message: aliasHintMessage(reason, isEmoji),
    }
  }
  return { state: "checking" }
}

/**
 * Live alias availability. Coarse local gates only: the alnum lane keeps its
 * 3-16 length pre-gate; the emoji lane locally gates just grapheme count and
 * empty input. Everything else (mixed, policy, reserved, taken) defers to the
 * server after a 350ms debounce keyed to the exact input AND domain, so a
 * verdict never survives a domain switch. A failed request resolves to
 * `unknown` rather than hanging in `checking`.
 *
 * Pass `domain` only for a CUSTOM domain; omit it for the system default (the
 * backend's check-alias treats a supplied non-default domain as a tenant probe
 * and 404s when it is not an owned custom domain).
 */
export function useAliasCheck({
  alias,
  domain,
  enabled = true,
}: {
  alias: string
  domain?: string
  /** When false the machine sits idle (e.g. the settings form only checks a
      CHANGED alias). */
  enabled?: boolean
}): AliasVerdict {
  const key = aliasVerdictKey(alias, domain)
  const gatedLocally = isGatedLocally(alias, enabled)
  const [cached, setCached] = React.useState<CachedVerdict | null>(null)

  React.useEffect(() => {
    if (gatedLocally) return
    const t = setTimeout(() => {
      checkAlias(alias, domain)
        .then((r) =>
          setCached({
            key,
            kind: "ok",
            available: r.available,
            reason: r.reason,
          })
        )
        // 404 / network / non-2xx: resolve to a non-blocking `unknown` so the
        // spinner always terminates and submit is not hard-blocked.
        .catch(() => setCached({ key, kind: "fail" }))
    }, DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [alias, domain, key, gatedLocally])

  return resolveAliasVerdict(alias, domain, enabled, cached)
}
