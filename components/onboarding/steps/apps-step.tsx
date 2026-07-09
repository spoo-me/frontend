"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowRight, ArrowUpRight } from "lucide-react"
import { motion } from "motion/react"

import { connectedApps, integrations, sdks } from "@/lib/apps-data"
import { Button } from "@/components/ui/button"
import { BrandIcons, type BrandIconKey } from "@/components/icons/brand-icons"

/** The fan — most iconic clients first, ordered for visual rhythm. */
const FEATURED = [
  "slack",
  "chrome",
  "raycast",
  "discord",
  "telegram",
  "apple",
  "android",
] as const

/** Tilt per tile, degrees — a loose hand of cards, straightest at center. */
const TILTS = [-12, -8, -4, 0, 4, 8, 12]

export function AppsStep({ onDone }: { onDone: () => void }) {
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter") {
        e.preventDefault()
        onDone()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onDone])

  const featured = FEATURED.map((slug) =>
    connectedApps.find((a) => a.slug === slug),
  ).filter((a): a is NonNullable<typeof a> => !!a)

  return (
    <div className="flex w-full flex-col items-center text-center">
      <h1 className="text-foreground text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        spoo.me lives{" "}
        <span className="text-muted-foreground italic font-serif font-normal">
          wherever you do
        </span>
      </h1>
      <p className="text-muted-foreground mt-3 max-w-md text-sm leading-relaxed">
        Shorten from Raycast, your browser, Slack, or a bot in your group chat;
        every client talks to the same account you just set up.
      </p>

      {/* The deck — tilted, overlapping, spreads on hover. Named group:
          the unnamed `group` lives on each tile so dual icons (mono → color
          devicon) swap on THEIR hover, not when the whole deck is hovered. */}
      <div className="group/deck mt-12 flex items-center justify-center px-4 py-3">
        {featured.map((app, i) => {
          const Icon = BrandIcons[app.iconKey as BrandIconKey] ?? null
          return (
            <motion.div
              key={app.slug}
              initial={{ opacity: 0, y: 28, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                delay: 0.08 + i * 0.06,
                type: "spring",
                stiffness: 320,
                damping: 24,
              }}
              className="-ml-3 transition-[margin] duration-300 first:ml-0 group-hover/deck:-ml-1 sm:-ml-4"
              style={{ zIndex: i <= 3 ? i + 1 : featured.length - i }}
            >
              <Link
                href={`/apps/${app.slug}`}
                target="_blank"
                rel="noopener"
                aria-label={`${app.name} (opens in a new tab)`}
                title={app.name}
                style={{ "--tilt": `${TILTS[i]}deg` } as React.CSSProperties}
                className="group group/tile border-border/70 bg-card shadow-card hover:border-ring hover:ring-ring/30 flex size-16 rotate-(--tilt) items-center justify-center rounded-2xl border transition-all duration-300 group-hover/deck:rotate-0 hover:z-20 hover:-translate-y-2 hover:scale-105 hover:ring-2 sm:size-19"
              >
                {Icon ? (
                  /* Mono deck, identity on hover: the brightness/invert filter
                     crushes every mark (multicolor or currentColor) to ink;
                     hovering lifts the filter and the brand color blooms. */
                  <span
                    style={{ color: app.color }}
                    className="flex items-center justify-center opacity-90 transition-[filter,opacity] duration-300 [filter:brightness(0)] group-hover/tile:opacity-100 group-hover/tile:[filter:none] dark:[filter:brightness(0)_invert(1)] dark:group-hover/tile:[filter:none]"
                  >
                    <Icon className="size-7 sm:size-8" />
                  </span>
                ) : null}
              </Link>
            </motion.div>
          )
        })}
      </div>

      <p className="label-mono text-muted-foreground/60 mt-6 text-[10px] tabular-nums">
        {integrations.length} integrations · {sdks.length} SDKs · one API
      </p>

      <div className="mt-10 flex flex-col items-center gap-3">
        <Button onClick={onDone} className="h-10 min-w-48">
          Continue
          <ArrowRight className="size-4" data-icon="inline-end" />
        </Button>
        <Link
          href="/apps"
          target="_blank"
          rel="noopener"
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-0.5 text-xs font-medium transition-colors"
        >
          Browse all apps <ArrowUpRight className="size-3" />
        </Link>
      </div>
    </div>
  )
}
