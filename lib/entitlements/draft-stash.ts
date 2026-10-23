import type { ComposerDraft } from "@/components/dashboard/links/composer"
import type { LinkDraft } from "@/components/dashboard/links/link-settings-form"

/**
 * A form's draft, parked in sessionStorage while the user goes to pay, so
 * landing back on the dashboard picks up where they were. One slot: the
 * newest stash wins, and taking it clears it.
 */
const KEY = "spoo:upsell:draft"

export type StashedDraft =
  | { kind: "composer"; draft: ComposerDraft }
  | { kind: "link"; id: string; draft: LinkDraft }

export function stashDraft(d: StashedDraft): void {
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(d))
  } catch {
    // No storage: the user re-enters the draft after paying.
  }
}

export function clearDraft(): void {
  try {
    window.sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

function read(): StashedDraft | null {
  try {
    const raw = window.sessionStorage.getItem(KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null || !("kind" in parsed))
      return null
    return parsed as StashedDraft
  } catch {
    return null
  }
}

export function takeComposerDraft(): ComposerDraft | null {
  const d = read()
  if (d?.kind !== "composer") return null
  clearDraft()
  return d.draft
}

export function takeLinkDraft(id: string): LinkDraft | null {
  const d = read()
  if (d?.kind !== "link" || d.id !== id) return null
  clearDraft()
  return d.draft
}
