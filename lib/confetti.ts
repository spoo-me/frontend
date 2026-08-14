import type { Options as ConfettiOptions } from "canvas-confetti"

/** Lazy-loaded so importing this seam never grows a chunk: canvas-confetti
    only ships once a burst actually fires. A failed chunk load (offline,
    ad-blocked) just skips the celebration. */
async function loadConfetti() {
  try {
    return (await import("canvas-confetti")).default
  } catch {
    return null
  }
}

/**
 * One tasteful burst for "you just made a thing" moments (first link, first
 * key). Palette stays on-system: brand violet + live emerald + a soft blue
 * + paper white. Respects prefers-reduced-motion automatically.
 */
const COLORS = ["#8B5CF6", "#34D399", "#60A5FA", "#F5F5F5"]

/** Origin as window fractions, centered on an element (defaults to upper-center). */
function originFor(el: HTMLElement | null): { x: number; y: number } {
  if (!el || typeof window === "undefined") return { x: 0.5, y: 0.32 }
  const r = el.getBoundingClientRect()
  return {
    x: (r.left + r.width / 2) / window.innerWidth,
    y: (r.top + r.height / 2) / window.innerHeight,
  }
}

export async function celebrate(from?: HTMLElement | null) {
  const origin = originFor(from ?? null)
  const confetti = await loadConfetti()
  if (!confetti) return
  confetti({
    particleCount: 64,
    spread: 72,
    startVelocity: 36,
    gravity: 0.9,
    decay: 0.92,
    scalar: 0.85,
    ticks: 160,
    colors: COLORS,
    origin,
    disableForReducedMotion: true,
  })
}

/** celebrate's restrained sibling for small in-place wins (the create toast,
    the hero shortener's result card): few brand-and-zinc particles, quick
    decay. Deliberately quieter than a milestone. */
const SMALL_COLORS = ["#8B5CF6", "#A78BFA", "#D4D4D8", "#71717A"]

/** Burst from the top edge of an element (yOffset px below it). The rect is
    measured up front so the burst starts where the element stood; if it left
    the DOM while the chunk loaded, nothing fires. */
export async function smallBurst(
  el: HTMLElement,
  { yOffset = 8, ...opts }: ConfettiOptions & { yOffset?: number } = {}
) {
  if (typeof window === "undefined") return
  const r = el.getBoundingClientRect()
  const confetti = await loadConfetti()
  if (!confetti || !el.isConnected) return
  confetti({
    particleCount: 18,
    spread: 55,
    startVelocity: 14,
    gravity: 1.2,
    ticks: 80,
    scalar: 0.6,
    colors: SMALL_COLORS,
    disableForReducedMotion: true,
    origin: {
      x: (r.left + r.width / 2) / window.innerWidth,
      y: (r.top + yOffset) / window.innerHeight,
    },
    ...opts,
  })
}
