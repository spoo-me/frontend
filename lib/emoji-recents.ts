/**
 * Recently-picked emoji, persisted client-side only (localStorage). Pure
 * helpers so the merge/cap/intersect logic is unit-testable; the read/write
 * wrappers are the only impure edges. Stores raw picked characters; the
 * acceptance policy still lives on the server, so recents are re-validated
 * against the live accepted set on load and stale entries are dropped.
 */

export const RECENTS_KEY = "spoo:emoji-recent"
export const RECENTS_CAP = 24

/** Push `picked` to the front, dedupe, cap. Most-recent-first. */
export function mergeRecent(
  existing: readonly string[],
  picked: string,
  cap = RECENTS_CAP
): string[] {
  const next = [picked, ...existing.filter((e) => e !== picked)]
  return next.slice(0, cap)
}

/**
 * Keep only stored recents that are still in the accepted set (policy may
 * shrink between deploys), deduped and capped, order preserved.
 */
export function validRecents(
  stored: readonly string[],
  valid: Iterable<string>,
  cap = RECENTS_CAP
): string[] {
  const allowed = valid instanceof Set ? valid : new Set(valid)
  const seen = new Set<string>()
  const out: string[] = []
  for (const e of stored) {
    if (allowed.has(e) && !seen.has(e)) {
      seen.add(e)
      out.push(e)
      if (out.length >= cap) break
    }
  }
  return out
}

export function loadRecents(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(RECENTS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((x) => typeof x === "string")
      : []
  } catch {
    return []
  }
}

export function saveRecents(list: readonly string[]): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(RECENTS_KEY, JSON.stringify(list))
  } catch {
    /* quota or privacy mode — recents are best-effort */
  }
}
