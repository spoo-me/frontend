/**
 * Grapheme-aware helpers for emoji aliases.
 *
 * The server (shared/emoji_policy.py) is the ONE validator. Nothing here
 * decides what is or is not an acceptable alias; these are coarse client
 * conveniences for routing and suggestion. Any local gate exists only to
 * avoid a pointless round trip while typing, never to phrase a verdict the
 * server phrases better.
 */

const segmenter =
  typeof Intl !== "undefined" && "Segmenter" in Intl
    ? new Intl.Segmenter(undefined, { granularity: "grapheme" })
    : null

/**
 * Count user-perceived characters, never codepoints. A skin-tone sequence is
 * two codepoints but one grapheme; a ZWJ family is many codepoints but one
 * grapheme. This mirrors the backend's \X counting (emoji_policy.py). Falls
 * back to codepoint counting only on the (unsupported) browsers without
 * Intl.Segmenter.
 */
export function countGraphemes(input: string): number {
  if (!input) return 0
  if (!segmenter) return Array.from(input).length
  let n = 0
  for (const _ of segmenter.segment(input)) n++
  return n
}

/**
 * Routing test only: does this value leave the alphanumeric lane? Any
 * character outside [A-Za-z0-9_-] means "treat as an emoji candidate and let
 * the server judge it", exactly like emoji_policy.is_emoji_candidate. This is
 * NOT a policy check: "abc😀" is a candidate here and the server rejects it as
 * a mixed alias.
 */
export function isEmojiCandidate(input: string): boolean {
  return input !== "" && /[^A-Za-z0-9_-]/.test(input)
}

/**
 * PRE-LOAD FALLBACK ONLY. The server is the single source of truth.
 *
 * Once GET /api/v1/emoji-set has loaded, dice suggestions are drawn from its
 * `gen: true` entries, which match the server's auto-gen pool by construction
 * (so the product never suggests an emoji it then rejects). This curated list
 * is used only before that set has loaded: hand-picked single-codepoint, low
 * Unicode-version emoji that sit comfortably under the accept cap, and every
 * suggestion still round-trips check-alias before it can be submitted.
 */
export const EMOJI_SUGGEST_POOL: readonly string[] = [
  // Smileys
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😅",
  "😂",
  "😊",
  "😍",
  "😘",
  "😎",
  "🤩",
  "🥳",
  "🤗",
  "🤔",
  "🙃",
  // Animals
  "🐶",
  "🐱",
  "🐭",
  "🐰",
  "🦊",
  "🐻",
  "🐼",
  "🐨",
  "🐯",
  "🦁",
  "🐮",
  "🐷",
  "🐸",
  "🐵",
  "🐔",
  "🐧",
  "🦄",
  "🐝",
  "🐢",
  "🐬",
  "🐳",
  "🐙",
  // Food
  "🍎",
  "🍊",
  "🍋",
  "🍌",
  "🍉",
  "🍇",
  "🍓",
  "🍒",
  "🍑",
  "🥝",
  "🍔",
  "🍕",
  "🌮",
  "🍿",
  "🍩",
  "🍪",
  "🍰",
  // Nature and weather
  "🌞",
  "🌈",
  "🌸",
  "🌻",
  "🌵",
  "🌴",
  "🍀",
  "🌊",
  "🔥",
  // Objects
  "🎈",
  "🎁",
  "🎉",
  "🚀",
  "🎸",
  "🎨",
  "💎",
  "🔑",
  "🎯",
]

/** Unbiased crypto-random integer in [0, bound). */
function randInt(bound: number): number {
  const buf = new Uint32Array(1)
  const limit = Math.floor(4294967296 / bound) * bound
  do {
    crypto.getRandomValues(buf)
  } while (buf[0] >= limit)
  return buf[0] % bound
}

/**
 * A short emoji alias suggestion (default 3 graphemes). Callers pass the
 * server's auto-gen pool (the emoji-set `gen` entries) so suggestions match
 * server auto-gen; when that has not loaded, the curated EMOJI_SUGGEST_POOL is
 * the fallback. Picks may repeat, matching how the backend composes; the live
 * check confirms availability before create.
 */
export function suggestEmojiAlias(
  n = 3,
  pool: readonly string[] = EMOJI_SUGGEST_POOL
): string {
  const source = pool.length > 0 ? pool : EMOJI_SUGGEST_POOL
  let out = ""
  for (let i = 0; i < n; i++) {
    out += source[randInt(source.length)]
  }
  return out
}

/** Split a string into its grapheme clusters. */
export function toGraphemes(input: string): string[] {
  if (!input) return []
  if (!segmenter) return Array.from(input)
  const out: string[] = []
  for (const { segment } of segmenter.segment(input)) out.push(segment)
  return out
}

/**
 * Canonicalize a grapheme the same way the backend does before membership:
 * drop U+FE0F (VS16) anywhere, and drop a trailing skin-tone modifier
 * (U+1F3FB..U+1F3FF). The accepted set lists BASE characters, so a skin-toned
 * emoji must be reduced to its base before the check or it false-positives.
 */
export function canonicalEmojiBase(grapheme: string): string {
  let out = ""
  for (const ch of grapheme) {
    const cp = ch.codePointAt(0) ?? 0
    if (cp === 0xfe0f) continue // VS16
    if (cp >= 0x1f3fb && cp <= 0x1f3ff) continue // skin-tone modifier
    out += ch
  }
  return out
}

/**
 * Which graphemes of `alias` are NOT in the accepted set (as TYPED, so they
 * still render for the user). Canonical base membership only; this names the
 * offenders for the message and is never the accept/reject authority — the
 * server's check-alias remains the validator.
 */
export function findUnsupportedGraphemes(
  alias: string,
  accepted: Set<string>
): string[] {
  const out: string[] = []
  for (const g of toGraphemes(alias)) {
    if (!accepted.has(canonicalEmojiBase(g))) out.push(g)
  }
  return out
}
