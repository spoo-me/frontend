"use client"

import * as React from "react"
import { motion } from "motion/react"
import { ArrowUpRight } from "lucide-react"

import { NumberTicker } from "@/components/ui/number-ticker"
import { SectionHeading } from "@/components/shared/section-heading"
import { Band } from "@/components/shared/section-shell"
import { Globe } from "@/components/magicui/globe"
import { siteConfig, stats } from "@/lib/site-config"

type Item = {
  value: number
  suffix: string
  decimals?: number
  label: string
  sub: string
  href?: string
}

const supporting: Item[] = [
  {
    value: stats.links / 1_000_000,
    suffix: "M+",
    decimals: 1,
    label: "links shortened",
    sub: "and counting",
  },
  {
    value: stats.stars,
    suffix: "",
    label: "github stars",
    sub: "open source, forever",
    href: siteConfig.links.github,
  },
]

export function Stats() {
  return (
    <>
      {/* Header band */}
      <Band className="px-5 py-24 sm:px-9 sm:py-32">
        <div
          aria-hidden
          className="pattern-dots pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_60%_80%_at_50%_50%,black,transparent)]"
        />
        <SectionHeading
          title={
            <>
              Trusted at scale,{" "}
              <span className="font-normal font-serif text-muted-foreground italic">
                proven in production.
              </span>
            </>
          }
          description="Real traffic, real numbers, real community. The metrics that make spoo dependable."
        />
      </Band>

      {/* Stat lattice — globe cell + giant-number cells, edge-to-rail.
          No gutter hatch here: the CTA band directly below carries it. */}
      <Band rule>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr]"
        >
          {/* Hero stat: clicks served — globe backdrop */}
          <div className="relative flex min-h-[28rem] flex-col justify-end overflow-hidden p-8 sm:p-10 lg:min-h-[32rem]">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative aspect-square w-[110%] max-w-[36rem] translate-y-[-4%]">
                <Globe className="size-full" />
              </div>
            </div>

            {/* bottom gradient for text legibility */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background via-background/85 to-transparent"
            />

            <div className="relative">
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-7xl text-foreground tabular-nums tracking-tight sm:text-8xl">
                  <NumberTicker
                    value={stats.clicks / 1_000_000}
                    className="text-foreground"
                  />
                </span>
                <span className="font-medium text-3xl text-muted-foreground/70 sm:text-4xl">
                  M+
                </span>
              </div>
              <div className="label-mono mt-3 text-foreground">
                clicks served
              </div>
              <div className="mt-1 text-muted-foreground text-sm">
                for creators everywhere
              </div>
            </div>
          </div>

          {/* Supporting stats */}
          <ul className="grid grid-cols-1 grid-rows-2 border-border border-t bg-background lg:border-t-0 lg:border-l">
            {supporting.map((item, i) => {
              const numberBlock = (
                <div className="flex items-baseline">
                  <span className="font-semibold text-6xl text-foreground tabular-nums leading-none tracking-tight sm:text-7xl">
                    <NumberTicker
                      value={item.value}
                      decimalPlaces={item.decimals ?? 0}
                      className="text-foreground"
                    />
                  </span>
                  {item.suffix && (
                    <span className="ml-0.5 font-medium text-muted-foreground/70 text-xl sm:text-2xl">
                      {item.suffix}
                    </span>
                  )}
                </div>
              )

              const labelBlock = (
                <div>
                  <div className="label-mono text-foreground">{item.label}</div>
                  <div className="mt-1 text-muted-foreground text-xs">
                    {item.sub}
                  </div>
                </div>
              )

              const className =
                "group relative flex items-center justify-between gap-6 px-7 py-6 sm:px-10 " +
                (i > 0 ? "border-border border-t " : "") +
                (item.href ? "hover:bg-muted/30 transition-colors " : "")

              if (item.href) {
                return (
                  <li key={item.label} className="contents">
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noreferrer"
                      className={className}
                    >
                      {labelBlock}
                      <div className="flex items-baseline gap-2">
                        {numberBlock}
                        <ArrowUpRight className="size-4 text-muted-foreground/60 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
                      </div>
                    </a>
                  </li>
                )
              }

              return (
                <li key={item.label} className={className}>
                  {labelBlock}
                  {numberBlock}
                </li>
              )
            })}
          </ul>
        </motion.div>
      </Band>
    </>
  )
}
