"use client"

import * as React from "react"
import { motion } from "motion/react"
import { useTheme } from "next-themes"

type Point = { x: number; y: number }

type Dot = {
  start: { lat: number; lng: number; label?: string }
  end: { lat: number; lng: number; label?: string }
}

interface WorldMapProps {
  dots?: Dot[]
  lineColor?: string
}

function projectPoint(lat: number, lng: number): Point {
  return { x: (lng + 180) * (800 / 360), y: (90 - lat) * (400 / 180) }
}

function curve(start: Point, end: Point): string {
  const midX = (start.x + end.x) / 2
  const midY = Math.min(start.y, end.y) - 50
  return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`
}

export default function WorldMap({
  dots = [],
  lineColor = "#0ea5e9",
}: WorldMapProps) {
  const { resolvedTheme } = useTheme()
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [visible, setVisible] = React.useState(false)

  // Don't load the 578KB SVG asset or run animations until in view.
  React.useEffect(() => {
    if (!containerRef.current || visible) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true)
          io.disconnect()
        }
      },
      { rootMargin: "200px" },
    )
    io.observe(containerRef.current)
    return () => io.disconnect()
  }, [visible])

  const mapSrc =
    resolvedTheme === "light"
      ? "/brand/world-map-light.svg"
      : "/brand/world-map-dark.svg"

  const projected = React.useMemo(
    () =>
      dots.map((d) => ({
        start: projectPoint(d.start.lat, d.start.lng),
        end: projectPoint(d.end.lat, d.end.lng),
      })),
    [dots],
  )

  return (
    <div
      ref={containerRef}
      className="w-full aspect-[2/1] rounded-lg relative font-sans"
    >
      {visible && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={mapSrc}
            alt=""
            aria-hidden
            loading="lazy"
            decoding="async"
            width={1056}
            height={495}
            className="h-full w-full [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)] pointer-events-none select-none"
            draggable={false}
          />
          <svg
            viewBox="0 0 800 400"
            className="w-full h-full absolute inset-0 pointer-events-none select-none"
          >
            <defs>
              <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="white" stopOpacity="0" />
                <stop offset="5%" stopColor={lineColor} stopOpacity="1" />
                <stop offset="95%" stopColor={lineColor} stopOpacity="1" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>

            {projected.map(({ start, end }, i) => (
              <motion.path
                key={`p-${i}`}
                d={curve(start, end)}
                fill="none"
                stroke="url(#path-gradient)"
                strokeWidth="1"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.4 * i, ease: "easeOut" }}
              />
            ))}

            {projected.flatMap(({ start, end }, i) => [
              <Pulse key={`s-${i}`} cx={start.x} cy={start.y} color={lineColor} />,
              <Pulse key={`e-${i}`} cx={end.x} cy={end.y} color={lineColor} />,
            ])}
          </svg>
        </>
      )}
    </div>
  )
}

function Pulse({ cx, cy, color }: { cx: number; cy: number; color: string }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r="2" fill={color} />
      <circle cx={cx} cy={cy} r="2" fill={color} opacity="0.5">
        <animate attributeName="r" from="2" to="8" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.5" to="0" dur="1.5s" repeatCount="indefinite" />
      </circle>
    </g>
  )
}
