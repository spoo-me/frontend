"use client"

import * as React from "react"
import Link from "next/link"
import { useInView } from "motion/react"
import { ArrowUpRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { SectionHeading } from "@/components/shared/section-heading"
import { Band } from "@/components/shared/section-shell"
import { BrandIcons, type BrandIconKey } from "@/components/icons/brand-icons"
import { connectedApps } from "@/lib/apps-data"
import styles from "./connected-apps.module.css"

type Variant = "default" | "dark" | "signal" | "brand"
type Size = "sm" | "md" | "lg" | "xl"

type Placement = {
  slug: string
  x: number
  y: number
  size: Size
  variant?: Variant
  rot: number
}

const placements: Placement[] = [
  // top arc
  {
    slug: "spoo-raycast",
    x: 14,
    y: 18,
    size: "lg",
    variant: "signal",
    rot: -8,
  },
  { slug: "sdk-rust", x: 32, y: 16, size: "md", rot: 6 },
  { slug: "sdk-typescript", x: 46, y: 8, size: "sm", rot: -4 },
  { slug: "spoo-discord", x: 60, y: 12, size: "md", variant: "brand", rot: 5 },
  { slug: "spoo-desktop", x: 78, y: 18, size: "lg", rot: 10 },
  { slug: "spoo-slack", x: 90, y: 32, size: "md", variant: "brand", rot: -6 },
  // left edge
  { slug: "sdk-go", x: 6, y: 36, size: "md", rot: 12 },
  { slug: "apple", x: 18, y: 50, size: "xl", variant: "dark", rot: -5 },
  { slug: "spoo-telegram", x: 8, y: 64, size: "md", rot: 8 },
  { slug: "sdk-kotlin", x: 6, y: 80, size: "sm", rot: -7 },
  // right edge
  { slug: "android", x: 82, y: 50, size: "xl", rot: 7 },
  { slug: "sdk-cpp", x: 94, y: 62, size: "sm", rot: -10 },
  // bottom arc
  { slug: "spoo-snap", x: 22, y: 82, size: "md", variant: "brand", rot: -9 },
  { slug: "spoo-cli", x: 38, y: 90, size: "lg", variant: "dark", rot: 5 },
  { slug: "sdk-python", x: 56, y: 88, size: "md", rot: -3 },
  { slug: "n8n", x: 72, y: 84, size: "lg", rot: 7 },
  { slug: "spoo-zapier", x: 86, y: 84, size: "md", variant: "brand", rot: -6 },
]

export function ConnectedApps() {
  const ref = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.2 })

  return (
    <>
      {/* Header band */}
      <Band className="px-5 py-24 sm:px-9 sm:py-32">
        <SectionHeading
          title={
            <>
              spoo lives{" "}
              <span className="font-normal font-serif text-muted-foreground italic">
                wherever you do.
              </span>
            </>
          }
          description="Not a website you bookmark. A constellation of clients on every desktop, browser, and chat platform, all orbiting the same core API."
        />
      </Band>

      {/* Constellation band — chips spread across the full cell */}
      <Band rule className="px-2 sm:px-4">
        <div
          className={styles.scatter}
          ref={ref}
          data-in-view={inView ? "true" : undefined}
        >
          <div className={styles.inner}>
            {placements.map((p) => {
              const app = connectedApps.find((a) => a.slug === p.slug)
              if (!app) return null
              const Icon = BrandIcons[app.iconKey as BrandIconKey] ?? null
              const isBrand = p.variant === "brand"
              const dist = Math.hypot(p.x - 50, p.y - 50)
              const delay = Math.round(dist * 8)
              return (
                <Link
                  key={p.slug}
                  href={`/apps/${app.slug}`}
                  aria-label={app.name}
                  className={[
                    styles.chip,
                    styles[p.size],
                    p.variant === "dark" && styles.dark,
                    p.variant === "signal" && styles.signal,
                    isBrand && styles.brand,
                    p.slug === "n8n" && styles.n8n,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  style={
                    {
                      left: `${p.x}%`,
                      top: `${p.y}%`,
                      ["--rot" as never]: `${p.rot}deg`,
                      animationDelay: `${delay}ms`,
                      ...(isBrand
                        ? { ["--accent" as never]: app.color }
                        : null),
                    } as React.CSSProperties
                  }
                >
                  {Icon ? <Icon /> : null}
                  <span className={styles.tooltip}>{app.name}</span>
                </Link>
              )
            })}

            {/* Center anchor */}
            <div className={styles.anchor}>
              <h3 className="text-balance font-semibold text-3xl text-foreground tracking-tight sm:text-5xl">
                One core,
                <br />
                <span className="font-normal font-serif text-muted-foreground italic">
                  everywhere
                </span>
                <span className="text-brand">.</span>
              </h3>
              <p className="mx-auto mt-4 max-w-sm text-muted-foreground text-sm leading-relaxed">
                Sixteen official and community clients, all speaking the same
                REST API. Pick your surface and stay in flow.
              </p>
            </div>
          </div>
        </div>
      </Band>

      {/* Table-footer row */}
      <Band rule className="flex items-center justify-end px-5 py-4 sm:px-9">
        <Button asChild variant="outline" size="sm">
          <Link href="/apps">
            Browse all apps
            <ArrowUpRight className="size-3.5" data-icon="inline-end" />
          </Link>
        </Button>
      </Band>
    </>
  )
}
