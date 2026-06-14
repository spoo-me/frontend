import confetti from "canvas-confetti"

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

export function celebrate(from?: HTMLElement | null) {
  const origin = originFor(from ?? null)
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
