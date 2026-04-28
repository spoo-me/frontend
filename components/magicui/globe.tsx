"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import createGlobe, { type COBEOptions } from "cobe"
import { useTheme } from "next-themes"

import { cn } from "@/lib/utils"

type LiveMarker = {
  id: string
  city: string
  location: [number, number]
  size?: number
  initial: number
  delta: number
}

const LIVE_MARKERS: LiveMarker[] = [
  { id: "nyc",       city: "New York",  location: [40.7128, -74.006],   initial: 981, delta: 4 },
  { id: "ldn",       city: "London",    location: [51.5074, -0.1278],   initial: 486, delta: -1 },
  { id: "tokyo",     city: "Tokyo",     location: [35.6762, 139.6503],  initial: 305, delta: 15 },
  { id: "delhi",     city: "Delhi",     location: [28.6139, 77.209],    initial: 742, delta: 8 },
  { id: "saopaulo",  city: "São Paulo", location: [-23.5505, -46.6333], initial: 219, delta: 6 },
  { id: "sydney",    city: "Sydney",    location: [-33.8688, 151.2093], initial: 168, delta: 11 },
  { id: "singapore", city: "Singapore", location: [1.3521, 103.8198],   initial: 412, delta: -2 },
]

const FILLER_MARKERS: COBEOptions["markers"] = [
  { location: [37.7749, -122.4194], size: 0.04 },
  { location: [52.52, 13.405], size: 0.04 },
  { location: [-1.2921, 36.8219], size: 0.04 },
  { location: [55.7558, 37.6173], size: 0.04 },
  { location: [19.4326, -99.1332], size: 0.04 },
  { location: [25.2048, 55.2708], size: 0.04 },
  { location: [22.3193, 114.1694], size: 0.04 },
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
  const [tick, setTick] = React.useState(0)
  const [wrapperEl, setWrapperEl] = React.useState<HTMLElement | null>(null)

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
      { rootMargin: "200px" },
    )
    io.observe(containerRef.current)
    return () => io.disconnect()
  }, [mounted])

  // Tooltip ticker — only runs once mounted (and visible).
  React.useEffect(() => {
    if (!mounted) return
    const id = setInterval(() => setTick((t) => t + 1), 3500)
    return () => clearInterval(id)
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
    const liveAsCobe = LIVE_MARKERS.map((m) => ({
      location: m.location,
      size: m.size ?? 0.06,
      id: m.id,
    }))

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
      markerColor: [56 / 255, 199 / 255, 122 / 255],
      glowColor: isDark ? [0.11, 0.11, 0.14] : [0.92, 0.92, 0.96],
      markers: [...liveAsCobe, ...(FILLER_MARKERS ?? [])],
      markerElevation: 0.01,
    })

    if (canvasRef.current.parentElement) {
      setWrapperEl(canvasRef.current.parentElement)
    }

    // Visibility / off-screen gating — pauses the rAF loop entirely
    // when globe scrolled out of view OR tab backgrounded.
    let inView = true
    let pageVisible = !document.hidden
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) inView = e.isIntersecting
        if ((inView && pageVisible) && raf === 0) startLoop()
      },
      { rootMargin: "0px" },
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
      setWrapperEl(null)
    }
  }, [mounted, resolvedTheme])

  const tooltips = LIVE_MARKERS.map((m) => {
    const value = m.initial + ((tick * (m.id.charCodeAt(0) % 7 + 3)) % 53)
    const up = m.delta >= 0
    const style = {
      position: "absolute",
      positionAnchor: `--cobe-${m.id}`,
      bottom: "anchor(top)",
      left: "anchor(center)",
      translate: "-50% -10px",
      opacity: `var(--cobe-visible-${m.id}, 0)`,
    } as React.CSSProperties
    return (
      <div
        key={m.id}
        aria-hidden
        style={style}
        className="pointer-events-none z-10 flex flex-col gap-0.5 rounded-md bg-neutral-900 px-2 py-1.5 whitespace-nowrap text-white shadow-lg ring-1 ring-white/10 transition-opacity duration-300"
      >
        <span className="text-[9px] font-medium uppercase tracking-[0.14em] text-white/50">
          {m.city}
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[11px] tabular-nums leading-none">
          <span className="font-semibold">{value}</span>
          <span className={up ? "text-emerald-400" : "text-rose-400"}>
            {up ? "↑" : "↓"} {Math.abs(m.delta)}%
          </span>
        </span>
      </div>
    )
  })

  return (
    <div
      ref={containerRef}
      className={cn("relative aspect-square w-full mx-auto", className)}
    >
      <canvas
        ref={canvasRef}
        className="size-full opacity-0 transition-opacity duration-700 cursor-grab"
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
      {wrapperEl ? createPortal(tooltips, wrapperEl) : null}
    </div>
  )
}
