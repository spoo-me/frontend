/**
 * The anonymous visitor's local link history — the hero shelf's backing
 * store. Links created without an account are fire-and-forget on the
 * server side; this keeps them findable on this device, and it is the
 * seed corpus for auto-claim at signup once the backend issues claim
 * tokens at creation (they'll ride alongside `code` here).
 */

export type RecentLink = {
  code: string
  short: string
  original: string
  createdAt: number
  /** v2 creations carry the backend id + one-time claim token — the
      bearer proof that makes the link claimable at signup. Absent on
      links made before token issuance shipped. */
  urlId?: string
  claimToken?: string
}

const KEY = "spoo.recent_links"
const CAP = 8
const CHANGED = "spoo:recent-links-changed"
/** Only offer recent creations for claiming — bounds the shared-computer
    window. Server tokens never expire; older links stay claimable via API. */
const CLAIM_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

export function readRecentLinks(): RecentLink[] {
  if (typeof window === "undefined") return []
  try {
    const raw = window.localStorage.getItem(KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (l): l is RecentLink =>
        typeof l === "object" &&
        l !== null &&
        typeof (l as RecentLink).code === "string" &&
        typeof (l as RecentLink).short === "string" &&
        typeof (l as RecentLink).original === "string" &&
        typeof (l as RecentLink).createdAt === "number"
    )
  } catch {
    return []
  }
}

export function addRecentLink(link: RecentLink) {
  if (typeof window === "undefined") return
  try {
    const next = [
      link,
      ...readRecentLinks().filter((l) => l.code !== link.code),
    ].slice(0, CAP)
    window.localStorage.setItem(KEY, JSON.stringify(next))
    window.dispatchEvent(new Event(CHANGED))
  } catch {
    /* storage full or blocked — the shelf is a nicety, never an error */
  }
}

/** Links the signup wizard can offer to claim: token-bearing and fresh. */
export function claimableLinks(now = Date.now()): RecentLink[] {
  return readRecentLinks().filter(
    (l) =>
      typeof l.urlId === "string" &&
      typeof l.claimToken === "string" &&
      now - l.createdAt < CLAIM_WINDOW_MS
  )
}

/** Drop stored claim tokens (burned or declined). The links themselves
    stay on the shelf: still anonymous, still working. */
export function stripClaimTokens(codes?: string[]) {
  if (typeof window === "undefined") return
  try {
    const next = readRecentLinks().map((l) =>
      codes === undefined || codes.includes(l.code)
        ? { ...l, claimToken: undefined }
        : l
    )
    window.localStorage.setItem(KEY, JSON.stringify(next))
    window.dispatchEvent(new Event(CHANGED))
  } catch {
    /* storage blocked — worst case the wizard re-offers, claim is idempotent */
  }
}

/** Remove entries outright — for links that joined an account. They live
    in the dashboard now; the anonymous shelf showing them again (to
    whoever is signed out on this device) would be wrong twice over. */
export function removeRecentLinks(codes: string[]) {
  if (typeof window === "undefined") return
  try {
    const next = readRecentLinks().filter((l) => !codes.includes(l.code))
    window.localStorage.setItem(KEY, JSON.stringify(next))
    window.dispatchEvent(new Event(CHANGED))
  } catch {
    /* storage blocked — the shelf is a nicety, never an error */
  }
}

/** Subscribe to shelf changes (same-tab writes + cross-tab storage). */
export function onRecentLinksChanged(cb: () => void) {
  window.addEventListener(CHANGED, cb)
  window.addEventListener("storage", cb)
  return () => {
    window.removeEventListener(CHANGED, cb)
    window.removeEventListener("storage", cb)
  }
}
