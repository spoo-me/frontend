"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { SectionHeading } from "@/components/shared/section-heading"
import { Band, GutterHatch } from "@/components/shared/section-shell"
import {
  TESTIMONIALS_LIVE,
  testimonials,
  type Testimonial,
} from "@/lib/testimonials"
import { QuoteText } from "@/app/testimonials/_components/quote-text"

export function Testimonials() {
  const featured = testimonials.slice(0, 1)

  if (!TESTIMONIALS_LIVE) return null

  return (
    <>
      {/* Header band */}
      <Band className="px-5 py-24 sm:px-9 sm:py-32">
        <SectionHeading
          title={
            <>
              Real teams, shipping with{" "}
              <span className="font-normal font-serif text-muted-foreground italic">
                spoo.
              </span>
            </>
          }
          description="A small, growing chorus of operators, founders, and engineers using spoo in production."
        />
      </Band>

      {/* Quote band — breakout: the card spans the viewport minus fixed
          5rem hatch flanks, riding z-20 above the rails so no lines cross
          it. The overlay hairline draws the top rule across the breakout
          span at the same border/60 weight as every other band rule. */}
      <Band rule>
        <GutterHatch area="outer" />
        <div className="relative z-20 grid grid-cols-1 gap-px bg-border min-[1400px]:mx-[calc(50%-50vw+5rem)]">
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-border/60"
          />
          {featured.map((t) => (
            <QuoteCard key={t.slug} item={t} />
          ))}
        </div>
      </Band>

      {/* Table-footer row — recruitment as a quiet affordance */}
      <Band
        rule
        className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-9"
      >
        <span className="text-muted-foreground text-xs">
          Using spoo in production?
        </span>
        <div className="flex items-center gap-5">
          {testimonials.length > 1 && (
            <Link
              href="/testimonials"
              className="group inline-flex items-center gap-1.5 font-medium text-muted-foreground text-xs transition-colors hover:text-foreground"
            >
              Read all stories
              <ArrowUpRight className="size-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          )}
          <a
            href="mailto:hi@spoo.me?subject=spoo.me%20testimonial"
            className="group inline-flex items-center gap-1.5 font-medium text-muted-foreground text-xs transition-colors hover:text-foreground"
          >
            Submit a testimonial
            <ArrowUpRight className="size-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </Band>
    </>
  )
}

function QuoteCard({ item }: { item: Testimonial }) {
  return (
    <div className="bg-background">
      <Link
        href={`/testimonials/${item.slug}`}
        className="group relative flex h-full flex-col gap-7 overflow-hidden p-7 transition-colors hover:bg-foreground/[0.02] sm:p-9"
      >
        {/* Brand-color radial glow — bottom-right inner glow */}
        <span
          aria-hidden
          className="pointer-events-none absolute -right-24 -bottom-24 size-72 rounded-full opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
          style={{ backgroundColor: item.accent }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-0 bottom-0 size-40 rounded-full opacity-[0.12] blur-2xl"
          style={{ backgroundColor: item.accent }}
        />

        <header className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar item={item} />
            <div className="min-w-0">
              <div className="font-semibold text-foreground text-sm leading-tight">
                {item.person.name}
              </div>
              <div className="mt-0.5 text-muted-foreground text-xs">
                {item.person.role}
              </div>
            </div>
          </div>
          <div
            className="label-mono max-w-[55%] truncate text-right text-foreground/70"
            title={item.company.name}
          >
            {item.company.name}
          </div>
        </header>

        <blockquote className="relative max-w-3xl text-pretty text-foreground/90 text-xl leading-relaxed sm:text-2xl">
          <span aria-hidden className="text-muted-foreground/70">
            “
          </span>
          <QuoteText segments={item.shortQuote} />
          <span aria-hidden className="text-muted-foreground/70">
            ”
          </span>
        </blockquote>

        <div className="relative mt-auto inline-flex items-center gap-1.5 font-medium text-muted-foreground text-xs opacity-0 transition-all duration-200 group-hover:text-foreground group-hover:opacity-100">
          Read the full story
          <ArrowUpRight className="size-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </Link>
    </div>
  )
}

function Avatar({ item }: { item: Testimonial }) {
  const [errored, setErrored] = React.useState(false)
  if (item.person.avatarSrc && !errored) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.person.avatarSrc}
        alt=""
        width={40}
        height={40}
        loading="lazy"
        decoding="async"
        onError={() => setErrored(true)}
        className="size-10 shrink-0 rounded-full border border-border/60 object-cover"
      />
    )
  }
  return (
    <div
      aria-hidden
      className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border/60 bg-muted font-mono font-semibold text-muted-foreground text-xs"
    >
      {item.person.initials}
    </div>
  )
}
