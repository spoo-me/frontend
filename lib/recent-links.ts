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
}

const KEY = "spoo.recent_links"
const CAP = 8
const CHANGED = "spoo:recent-links-changed"

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

/** Subscribe to shelf changes (same-tab writes + cross-tab storage). */
export function onRecentLinksChanged(cb: () => void) {
  window.addEventListener(CHANGED, cb)
  window.addEventListener("storage", cb)
  return () => {
    window.removeEventListener(CHANGED, cb)
    window.removeEventListener("storage", cb)
  }
}
