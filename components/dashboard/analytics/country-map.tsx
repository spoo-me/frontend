"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { geoEqualEarth, geoPath } from "d3-geo"
import { feature } from "topojson-client"
import type { Topology } from "topojson-specification"
import type { Feature, Geometry } from "geojson"
import { alpha2ToNumeric, numericToAlpha2 } from "i18n-iso-countries"

import { cn } from "@/lib/utils"
import type { DimensionRow } from "@/lib/api"
import { formatCount, formatPercent } from "@/lib/format"
import type { BreakdownMetric } from "@/components/dashboard/breakdown-list"
import { DimensionIcon, dimensionLabel } from "@/components/dashboard/dim-icon"
import { Skeleton } from "@/components/ui/skeleton"

/**
 * Choropleth for the Countries card: shapes and hairlines only, no basemap.
 * Cover-fit presses the landmass against the panel glass (no ocean
 * margins); wheel zooms toward the cursor, drag pans, dblclick resets.
 * Countries with traffic ramp the brand tint by sqrt share (click volumes
 * are skewed; a linear ramp leaves everything but #1 invisible), the rest
 * sit on --map-base with background-colored strokes. Hover carries the
 * numbers, click toggles the filter — the same grammar as every other
 * chart row.
 */

const MAX_ZOOM = 8
const PAD = 6

type CountryFeature = Feature<Geometry> & { id?: string | number }
type Transform = { k: number; x: number; y: number }

const IDENTITY: Transform = { k: 1, x: 0, y: 0 }

function useContainerSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = React.useState({ w: 0, h: 0 })
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize((s) =>
        Math.abs(s.w - width) < 1 && Math.abs(s.h - height) < 1
          ? s
          : { w: Math.round(width), h: Math.round(height) }
      )
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return size
}

function useWorldPaths(w: number, h: number) {
  const topo = useQuery({
    queryKey: ["geo", "countries-110m"],
    queryFn: () =>
      fetch("/geo/countries-110m.json").then(
        (r) => r.json() as Promise<Topology>
      ),
    staleTime: Infinity,
    gcTime: Infinity,
  })

  return React.useMemo(() => {
    if (!topo.data || !w || !h) return null
    const features = (
      feature(topo.data, topo.data.objects.countries) as unknown as {
        features: CountryFeature[]
      }
    ).features.filter((f) => String(f.id) !== "010") // Antarctica: dead ink
    const land = { type: "FeatureCollection", features } as Parameters<
      ReturnType<typeof geoEqualEarth>["fitWidth"]
    >[1]
    // Cover-fit, not contain: over-zoom past width-fit so the landmass
    // bleeds off every edge — a wall map pressed against the glass, no
    // ocean margins. The empty Pacific splits the horizontal crop, the
    // populated band (72N to 45S) centers the vertical one, and whatever
    // spills off stays reachable by panning.
    const projection = geoEqualEarth().fitWidth(w - 2 * PAD, land)
    projection.scale(projection.scale() * 1.5)
    const [tx0, ty0] = projection.translate()
    const [[bx0, by0], [bx1, by1]] = geoPath(projection).bounds(land)
    const dx = w / 2 - (bx0 + bx1) / 2
    const yN = projection([0, 72])![1]
    const yS = projection([0, -45])![1]
    const bandH = yS - yN
    const dy =
      by1 - by0 <= h - 2 * PAD
        ? h / 2 - (by0 + by1) / 2 // small panel: center everything
        : PAD + (h - 2 * PAD - bandH) / 2 - yN
    projection.translate([tx0 + dx, ty0 + dy])
    const path = geoPath(projection)
    const bounds = {
      x: [bx0 + dx, bx1 + dx] as [number, number],
      y: [by0 + dy, by1 + dy] as [number, number],
    }
    return {
      bounds,
      countries: features.map((f) => {
        const name = (f.properties as { name?: string })?.name ?? ""
        return {
          id: String(f.id ?? ""),
          // Disputed territories ship without an id; key them by name.
          key: f.id != null ? String(f.id) : name,
          alpha2: f.id != null ? (numericToAlpha2(String(f.id)) ?? null) : null,
          name,
          d: path(f) ?? "",
        }
      }),
    }
  }, [topo.data, w, h])
}

export function CountryMap({
  rows,
  metric,
  onSelect,
}: {
  rows: DimensionRow[]
  metric: BreakdownMetric
  onSelect?: (value: string) => void
}) {
  const wrapRef = React.useRef<HTMLDivElement>(null)
  const svgRef = React.useRef<SVGSVGElement>(null)
  const { w, h } = useContainerSize(wrapRef)
  const world = useWorldPaths(w, h)
  const [hover, setHover] = React.useState<{
    value: string
    x: number
    y: number
  } | null>(null)
  const [t, setT] = React.useState<Transform>(IDENTITY)

  // Pan gesture state: a drag past the threshold pans the zoomed map and
  // swallows the click that would otherwise toggle a country filter.
  const pan = React.useRef<{
    startX: number
    startY: number
    from: Transform
    moved: boolean
  } | null>(null)
  const suppressClick = React.useRef(false)

  /** Keep the land covering the viewport: no blank gutters while panning,
      but the cover-fit overflow stays reachable on both axes at any zoom. */
  const bounds = world?.bounds
  const clamp = React.useCallback(
    (tr: Transform): Transform => {
      const axis = (view: number, b0: number, b1: number, v: number) => {
        const lo = view - tr.k * b1
        const hi = -tr.k * b0
        return lo > hi ? (lo + hi) / 2 : Math.min(hi, Math.max(lo, v))
      }
      const [x0, x1] = bounds?.x ?? [0, w]
      const [y0, y1] = bounds?.y ?? [0, h]
      return {
        k: tr.k,
        x: axis(w, x0, x1, tr.x),
        y: axis(h, y0, y1, tr.y),
      }
    },
    [w, h, bounds]
  )
  const canPan =
    bounds != null &&
    (bounds.x[1] - bounds.x[0] > w + 1 || bounds.y[1] - bounds.y[0] > h + 1)

  /** client px → viewBox units (1:1 with CSS px here, but CTM is exact). */
  const toView = (clientX: number, clientY: number) => {
    const ctm = svgRef.current?.getScreenCTM()
    if (!ctm) return null
    return new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse())
  }

  // Re-run once the topo loads: before that the component renders the
  // skeleton and there is no svg to bind to.
  const ready = world != null
  React.useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    // Native listener: React's wheel handlers are passive, and zooming
    // must preventDefault so the page doesn't scroll underneath.
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const p = toView(e.clientX, e.clientY)
      if (!p) return
      setT((prev) => {
        const k = Math.min(
          MAX_ZOOM,
          Math.max(1, prev.k * Math.exp(-e.deltaY * 0.0015))
        )
        if (k === prev.k) return prev
        return clamp({
          k,
          x: p.x - ((p.x - prev.x) * k) / prev.k,
          y: p.y - ((p.y - prev.y) * k) / prev.k,
        })
      })
    }
    const onUp = () => {
      if (pan.current?.moved) suppressClick.current = true
      pan.current = null
    }
    svg.addEventListener("wheel", onWheel, { passive: false })
    window.addEventListener("mouseup", onUp)
    return () => {
      svg.removeEventListener("wheel", onWheel)
      window.removeEventListener("mouseup", onUp)
    }
  }, [ready, clamp])

  // Rows keyed by numeric id so each <path> resolves its datum in O(1).
  const byNumeric = React.useMemo(() => {
    const m = new Map<string, DimensionRow>()
    for (const r of rows) {
      const num = alpha2ToNumeric(r.value)
      if (num) m.set(num, r)
    }
    return m
  }, [rows])
  const valueOf = React.useCallback(
    (r: DimensionRow) => (metric === "unique" ? r.unique_clicks : r.clicks),
    [metric]
  )
  const max = React.useMemo(
    () => Math.max(...rows.map(valueOf), 0),
    [rows, valueOf]
  )

  const hoverRow = hover ? rows.find((r) => r.value === hover.value) : undefined

  return (
    <div ref={wrapRef} className="relative h-full w-full">
      {/* Empty board: the base map stays as quiet texture, the message
          floats over it — siblings say the same thing in the same words. */}
      {world && !rows.length && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <span className="rounded-lg border border-border border-dashed bg-background/70 px-3 py-1.5 font-mono text-[11px] text-muted-foreground/70">
            No data in this range
          </span>
        </div>
      )}
      {!world ? (
        <Skeleton className="h-full w-full rounded-lg" />
      ) : (
        <svg
          ref={svgRef}
          viewBox={`0 0 ${w} ${h}`}
          className={cn("h-full w-full", (t.k > 1 || canPan) && "cursor-grab")}
          role="img"
          aria-label="Clicks by country"
          onMouseLeave={() => {
            setHover(null)
            pan.current = null
          }}
          onMouseDown={(e) => {
            if (e.button !== 0 || (t.k === 1 && !canPan)) return
            e.preventDefault()
            pan.current = {
              startX: e.clientX,
              startY: e.clientY,
              from: t,
              moved: false,
            }
          }}
          onMouseMove={(e) => {
            const p = pan.current
            if (!p) return
            const a = toView(p.startX, p.startY)
            const b = toView(e.clientX, e.clientY)
            if (!a || !b) return
            if (
              Math.abs(e.clientX - p.startX) + Math.abs(e.clientY - p.startY) >
              3
            ) {
              p.moved = true
              setHover(null)
            }
            if (p.moved)
              setT(
                clamp({
                  k: p.from.k,
                  x: p.from.x + b.x - a.x,
                  y: p.from.y + b.y - a.y,
                })
              )
          }}
          onDoubleClick={() => setT(IDENTITY)}
        >
          <g transform={`translate(${t.x},${t.y}) scale(${t.k})`}>
            {world.countries.map((c) => {
              const row = c.alpha2 ? byNumeric.get(c.id) : undefined
              const v = row ? valueOf(row) : 0
              const hovered = hover?.value === c.alpha2 && c.alpha2 !== null
              return (
                <path
                  key={c.key}
                  d={c.d}
                  className={cn(
                    "transition-[fill-opacity,stroke] duration-150",
                    row && onSelect && "cursor-pointer"
                  )}
                  fill={
                    row
                      ? "var(--chart-accent, var(--brand))"
                      : "var(--map-base)"
                  }
                  fillOpacity={
                    row ? 0.16 + 0.66 * Math.sqrt(max ? v / max : 0) : 1
                  }
                  stroke={
                    hovered
                      ? "var(--chart-accent, var(--brand))"
                      : "var(--background)"
                  }
                  strokeWidth={hovered ? 1.25 : 0.75}
                  vectorEffect="non-scaling-stroke"
                  onMouseMove={(e) => {
                    if (!c.alpha2 || pan.current?.moved) return
                    const box = wrapRef.current?.getBoundingClientRect()
                    if (!box) return
                    setHover({
                      value: c.alpha2,
                      x: Math.min(
                        Math.max(e.clientX - box.left, 84),
                        box.width - 84
                      ),
                      y: e.clientY - box.top,
                    })
                  }}
                  onClick={
                    row && onSelect
                      ? () => {
                          if (suppressClick.current) {
                            suppressClick.current = false
                            return
                          }
                          onSelect(c.alpha2!)
                        }
                      : undefined
                  }
                />
              )
            })}
          </g>
        </svg>
      )}

      {hover && (
        <div
          className="pointer-events-none absolute z-10 min-w-[168px] overflow-hidden rounded-lg border border-border/60 bg-popover shadow-[0_4px_16px_-4px_rgba(0,0,0,0.15)]"
          style={{
            left: hover.x,
            top: hover.y,
            // The panel clips overflow: flip below the cursor near the top.
            transform:
              hover.y < 132
                ? "translate(-50%, 12px)"
                : "translate(-50%, calc(-100% - 12px))",
          }}
        >
          <div className="flex items-center gap-2 border-border/60 border-b bg-muted/40 px-3 py-1.5">
            <DimensionIcon
              dimension="country"
              value={hover.value}
              className="size-3.5"
            />
            <span className="font-medium text-foreground text-xs">
              {dimensionLabel("country", hover.value)}
            </span>
          </div>
          <div className="space-y-1 px-3 py-2">
            {hoverRow ? (
              <>
                <TipRow label="Clicks" value={formatCount(hoverRow.clicks)} />
                <TipRow
                  label="Unique"
                  value={formatCount(hoverRow.unique_clicks)}
                />
                <div className="mt-1.5 border-border/60 border-t pt-1.5">
                  <TipRow
                    label="Share"
                    value={formatPercent(hoverRow.percentage)}
                    muted
                  />
                </div>
              </>
            ) : (
              <span className="text-muted-foreground text-xs">
                no clicks in this range
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function TipRow({
  label,
  value,
  muted,
}: {
  label: string
  value: string
  muted?: boolean
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 text-muted-foreground text-xs">{label}</span>
      <span
        className={cn(
          "font-medium font-mono text-xs tabular-nums",
          muted ? "text-muted-foreground" : "text-foreground"
        )}
      >
        {value}
      </span>
    </div>
  )
}
