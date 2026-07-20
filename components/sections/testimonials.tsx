"use client"

import * as React from "react"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { SectionHeading } from "@/components/shared/section-heading"
import { Band, GutterHatch } from "@/components/shared/section-shell"
import { cn } from "@/lib/utils"
import { testimonials, type Testimonial } from "@/lib/testimonials"
import { QuoteText } from "@/app/testimonials/_components/quote-text"

export function Testimonials() {
  const featured = testimonials.slice(0, 1)

  return (
    <>
      {/* Header band */}
      <Band className="px-5 py-20 sm:px-9 sm:py-24">
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

      {/* Quote mosaic — breakout band: cards span the viewport minus fixed
          5rem hatch flanks, riding z-20 above the rails so no lines cross
          them. pt-px (not mt-px — margin collapse) lets the container's
          border tint draw the top line across the breakout span. */}
      <Band rule>
        <GutterHatch area="outer" />
        <div className="relative z-20 grid grid-cols-1 gap-px bg-border pt-px lg:grid-cols-12 min-[1400px]:mx-[calc(50%-50vw+5rem)]">
          {featured.map((t) => (
            <QuoteCard key={t.slug} item={t} />
          ))}
          <PlaceholderCard showAllStories={testimonials.length > 1} />
        </div>
      </Band>
    </>
  )
}

function QuoteCard({ item }: { item: Testimonial }) {
  return (
    <div className="bg-background lg:col-span-7">
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

        <blockquote className="relative text-pretty text-foreground/90 text-xl leading-relaxed sm:text-2xl">
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

function PlaceholderCard({ showAllStories }: { showAllStories: boolean }) {
  return (
    <div
      className={cn(
        "relative flex h-full flex-col overflow-hidden bg-background lg:col-span-5"
      )}
    >
      {/* Inner dotted-grid texture — matches site bg pattern */}
      <span
        aria-hidden
        className="pattern-dots pointer-events-none absolute inset-0 opacity-50 [mask-image:radial-gradient(ellipse_80%_70%_at_70%_30%,black,transparent)]"
      />
      {/* Soft cool glow — counterweights the warm yellow card */}
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full bg-foreground/5 opacity-60 blur-3xl"
      />

      <a
        href="mailto:hi@spoo.me?subject=spoo.me%20testimonial"
        className="group relative flex flex-1 flex-col gap-7 p-7 transition-colors hover:bg-foreground/[0.02] sm:p-9 sm:pb-7"
      >
        <header className="relative flex items-center gap-3">
          <div
            aria-hidden
            className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border/60 border-dashed font-mono text-muted-foreground/70 text-sm"
          >
            +
          </div>
          <div className="label-mono text-foreground/70">Your team here</div>
        </header>

        <div className="relative flex-1 text-pretty text-muted-foreground text-xl leading-relaxed sm:text-2xl">
          <span aria-hidden className="text-muted-foreground/40">
            “
          </span>
          Using spoo in production?{" "}
          <span className="text-foreground/70">
            Tell us how it fits into your stack.
          </span>
          <span aria-hidden className="text-muted-foreground/40">
            ”
          </span>
        </div>

        {/* Faux brand-name chips — hint at "your logo here" */}
        <div className="relative flex flex-wrap gap-1.5">
          {["YOUR LOGO", "TEAM", "BRAND"].map((label, i) => (
            <span
              key={label}
              className="rounded-md border border-border/60 border-dashed px-2 py-0.5 font-mono font-semibold text-[10px] text-muted-foreground/60 uppercase tracking-[0.14em]"
              style={{ opacity: 1 - i * 0.25 }}
            >
              {label}
            </span>
          ))}
        </div>

        <div className="relative flex items-center gap-1.5">
          <span className="font-semibold text-foreground/80 text-sm transition-colors group-hover:text-foreground">
            Submit a testimonial
          </span>
          <ArrowUpRight className="size-4 text-muted-foreground/60 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
        </div>
      </a>

      {showAllStories && (
        <Link
          href="/testimonials"
          className="group relative inline-flex items-center gap-1.5 border-border/60 border-t border-dashed px-7 py-3.5 font-medium text-muted-foreground text-xs transition-colors hover:text-foreground sm:px-9"
        >
          Read all stories
          <ArrowUpRight className="size-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>
      )}
    </div>
  )
}
