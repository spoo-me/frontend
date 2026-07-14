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
 * Suggestions ONLY. The server is the validator.
 *
 * Hand-picked single-codepoint, low Unicode-version, visually distinct emoji
 * (hearts, animals, food, weather, faces, objects) that sit comfortably under
 * an acceptance policy capped at 15.1. This is not the picker's list (that
 * comes from GET /api/v1/emoji-set) and carries no authority: every suggestion
 * round-trips check-alias before it can be submitted, so even if one somehow
 * fell out of policy the server would catch it visibly.
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
 * A short emoji alias suggestion (default 3 graphemes), drawn from
 * EMOJI_SUGGEST_POOL. Picks may repeat, matching how the backend auto-gen
 * pool composes; the live check confirms availability before create.
 */
export function suggestEmojiAlias(n = 3): string {
  let out = ""
  for (let i = 0; i < n; i++) {
    out += EMOJI_SUGGEST_POOL[randInt(EMOJI_SUGGEST_POOL.length)]
  }
  return out
}
