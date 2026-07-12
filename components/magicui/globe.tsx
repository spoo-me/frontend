"use client"

import * as React from "react"
import createGlobe from "cobe"
import {
  BookOpen,
  Briefcase,
  CalendarCheck,
  Presentation,
  Rocket,
  ShoppingBag,
  Ticket,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"

// The globe carries custom-domain links, not numbers. Each chip is a demo
// artifact in the features section's fictional-brand grammar (go.acme.dev
// school): the ccTLD/city TLD carries the locale honestly, the path carries
// the use case, and the set mixes apex domains with go./l. subdomains —
// both of which the product supports. The figure reads as adoption breadth:
// people everywhere run their own branded links on spoo. Deliberately NOT
// analytics — no counts, no cities, no deltas; spoo's own traffic breakdown
// is dashboard content, and per-region numbers on marketing were either
// internal stats nobody cares about or infra claims the product doesn't make.
// Collision rule: northern/equatorial latitudes only — with theta fixed, a
// marker's screen height tracks its latitude, so chips never drift into the
// stat block pinned to the cell's bottom-left.
type LinkChip = {
  id: string
  domain: string
  path: string
  /** use-case glyph — neutral ink only (accent lock), never colored */
  icon: LucideIcon
  location: [number, number]
}

const LINK_CHIPS: LinkChip[] = [
  {
    id: "sf",
    domain: "go.acme.dev",
    path: "/launch",
    icon: Rocket,
    location: [37.7749, -122.4194],
  },
  {
    id: "nyc",
    domain: "loft.nyc",
    path: "/rsvp",
    icon: CalendarCheck,
    location: [40.7128, -74.006],
  },
  {
    id: "ldn",
    domain: "spoo.me",
    path: "/gig",
    icon: Ticket,
    location: [51.5074, -0.1278],
  },
  {
    id: "berlin",
    domain: "spoo.me",
    path: "/menu",
    icon: UtensilsCrossed,
    location: [52.52, 13.405],
  },
  {
    id: "dubai",
    domain: "spoo.me",
    path: "/deck",
    icon: Presentation,
    location: [25.2048, 55.2708],
  },
  {
    id: "delhi",
    domain: "dilli.in",
    path: "/portfolio",
    icon: Briefcase,
    location: [28.6139, 77.209],
  },
  {
    id: "sgp",
    domain: "kopi.sg",
    path: "/docs",
    icon: BookOpen,
    location: [1.3521, 103.8198],
  },
  {
    id: "tokyo",
    domain: "mono.tokyo",
    path: "/drop",
    icon: ShoppingBag,
    location: [35.6762, 139.6503],
  },
]

export function Globe({ className }: { className?: string }) {
  const { resolvedTheme } = useTheme()
  const containerRef = React.useRef<HTMLDivElement>(null)
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const phiRef = React.useRef(0)
  const rRef = React.useRef(0)
  const widthRef = React.useRef(0)
  const pointerInteractingRef = React.useRef<number | null>(null)
  const pointerMovementRef = React.useRef(0)
  const [mounted, setMounted] = React.useState(false)

  // Lazy mount: don't init WebGL until container scrolled into view.
  React.useEffect(() => {
    if (mounted || !containerRef.current) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setMounted(true)
          io.disconnect()
        }
      },
      { rootMargin: "200px" }
    )
    io.observe(containerRef.current)
    return () => io.disconnect()
  }, [mounted])

  React.useEffect(() => {
    if (!mounted || !canvasRef.current || !containerRef.current) return

    const onResize = () => {
      if (canvasRef.current) widthRef.current = canvasRef.current.offsetWidth
    }
    window.addEventListener("resize", onResize)
    onResize()

    const isDark = resolvedTheme === "dark"
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5)

    const globe = createGlobe(canvasRef.current, {
      devicePixelRatio: dpr,
      width: widthRef.current * dpr,
      height: widthRef.current * dpr,
      phi: 0,
      theta: 0.25,
      dark: isDark ? 1 : 0,
      diffuse: isDark ? 1.2 : 1.4,
      mapSamples: 16000,
      mapBrightness: isDark ? 8 : 7,
      mapBaseBrightness: isDark ? 0 : 0.06,
      baseColor: isDark ? [0.18, 0.18, 0.22] : [1, 1, 1],
      // Anchor ticks under the chips — neutral ink, small; the chip is the
      // content, the dot just grounds it to the earth.
      markerColor: isDark ? [0.62, 0.62, 0.68] : [0.45, 0.45, 0.5],
      glowColor: isDark ? [0.11, 0.11, 0.14] : [0.92, 0.92, 0.96],
      markers: LINK_CHIPS.map((m) => ({
        location: m.location,
        size: 0.04,
        id: m.id,
      })),
      markerElevation: 0.01,
    })

    // Visibility / off-screen gating — pauses the rAF loop entirely
    // when globe scrolled out of view OR tab backgrounded.
    let inView = true
    let pageVisible = !document.hidden
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) inView = e.isIntersecting
        if (inView && pageVisible && raf === 0) startLoop()
      },
      { rootMargin: "0px" }
    )
    io.observe(containerRef.current)

    const onVisibility = () => {
      pageVisible = !document.hidden
      if (pageVisible && inView && raf === 0) startLoop()
    }
    document.addEventListener("visibilitychange", onVisibility)

    let raf = 0
    const step = () => {
      if (!inView || !pageVisible) {
        raf = 0
        return
      }
      if (pointerInteractingRef.current === null && !reducedMotion) {
        phiRef.current += 0.0022
      }
      globe.update({
        phi: phiRef.current + rRef.current,
        width: widthRef.current * dpr,
        height: widthRef.current * dpr,
      })
      raf = requestAnimationFrame(step)
    }
    const startLoop = () => {
      if (raf === 0) raf = requestAnimationFrame(step)
    }
    startLoop()

    setTimeout(() => {
      if (canvasRef.current) canvasRef.current.style.opacity = "1"
    }, 50)

    return () => {
      if (raf) cancelAnimationFrame(raf)
      io.disconnect()
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("resize", onResize)
      globe.destroy()
    }
  }, [mounted, resolvedTheme])

  return (
    <div
      ref={containerRef}
      className={cn("relative mx-auto aspect-square w-full", className)}
    >
      <canvas
        ref={canvasRef}
        className="size-full cursor-grab opacity-0 transition-opacity duration-700"
        onPointerDown={(e) => {
          pointerInteractingRef.current = e.clientX - pointerMovementRef.current
          if (canvasRef.current) canvasRef.current.style.cursor = "grabbing"
        }}
        onPointerUp={() => {
          pointerInteractingRef.current = null
          if (canvasRef.current) canvasRef.current.style.cursor = "grab"
        }}
        onPointerOut={() => {
          pointerInteractingRef.current = null
          if (canvasRef.current) canvasRef.current.style.cursor = "grab"
        }}
        onMouseMove={(e) => {
          if (pointerInteractingRef.current !== null) {
            const delta = e.clientX - pointerInteractingRef.current
            pointerMovementRef.current = delta
            rRef.current = delta / 200
          }
        }}
        onTouchMove={(e) => {
          if (pointerInteractingRef.current !== null && e.touches[0]) {
            const delta = e.touches[0].clientX - pointerInteractingRef.current
            pointerMovementRef.current = delta
            rRef.current = delta / 100
          }
        }}
      />
      {/* Link chips — anchored to cobe's marker anchors (`--cobe-{id}`),
          shown only while their point faces front (`--cobe-visible-{id}`).
          House chip skin, product-artifact grammar (features' link cards). */}
      {mounted &&
        LINK_CHIPS.map((m) => (
          <div
            key={m.id}
            aria-hidden
            style={
              {
                position: "absolute",
                positionAnchor: `--cobe-${m.id}`,
                bottom: "anchor(top)",
                left: "anchor(center)",
                translate: "-50% -10px",
                opacity: `var(--cobe-visible-${m.id}, 0)`,
              } as React.CSSProperties
            }
            className="pointer-events-none z-10 flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border/60 bg-card px-2 py-1 font-mono text-[10px] shadow-card transition-opacity duration-300"
          >
            <m.icon
              className="size-3 shrink-0 text-muted-foreground/70"
              strokeWidth={1.75}
            />
            {/* The part the user chose is the star: custom domains carry
                the brand (foreground host, muted path — features grammar);
                spoo.me links carry the alias (muted host, foreground path) */}
            {m.domain === "spoo.me" ? (
              <span>
                <span className="text-muted-foreground">{m.domain}</span>
                <span className="font-medium text-foreground">{m.path}</span>
              </span>
            ) : (
              <span>
                <span className="font-medium text-foreground">{m.domain}</span>
                <span className="text-muted-foreground">{m.path}</span>
              </span>
            )}
          </div>
        ))}
    </div>
  )
}
