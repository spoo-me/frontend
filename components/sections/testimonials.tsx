"use client"

import * as React from "react"
import Link from "next/link"
import { motion } from "motion/react"
import { ArrowUpRight } from "lucide-react"

import { SectionHeading } from "@/components/shared/section-heading"
import { Band } from "@/components/shared/section-shell"
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
          num="05"
          caption="Builders"
          title={
            <>
              Real teams, shipping with{" "}
              <span className="text-muted-foreground italic [font-family:var(--font-serif)] font-normal">
                spoo.
              </span>
            </>
          }
          description="A small, growing chorus of operators, founders, and engineers using spoo in production."
        />
      </Band>

      {/* Quote mosaic — cells share hairlines on the lattice */}
      <Band rule>
        <div className="bg-border/60 grid grid-cols-1 gap-px lg:grid-cols-12">
          {featured.map((t, i) => (
            <QuoteCard key={t.slug} item={t} delay={0.05 + i * 0.08} />
          ))}
          <PlaceholderCard delay={0.05 + featured.length * 0.08} />
        </div>
      </Band>

      {testimonials.length > 1 && (
        <Band rule className="flex items-center justify-between px-5 py-4 sm:px-9">
          <span className="label-mono text-muted-foreground/60 hidden sm:block">
            From production
          </span>
          <Link
            href="/testimonials"
            className="text-muted-foreground hover:text-foreground group inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
          >
            Read all stories
            <ArrowUpRight className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>
        </Band>
      )}
    </>
  )
}

function QuoteCard({ item, delay }: { item: Testimonial; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay }}
      className="bg-background lg:col-span-7"
    >
      <Link
        href={`/testimonials/${item.slug}`}
        className="hover:bg-foreground/[0.02] group relative flex h-full flex-col gap-7 overflow-hidden p-7 transition-colors sm:p-9"
      >
        {/* Brand-color radial glow — bottom-right inner glow */}
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -right-24 size-72 rounded-full opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
          style={{ backgroundColor: item.accent }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 size-40 rounded-full opacity-[0.12] blur-2xl"
          style={{ backgroundColor: item.accent }}
        />

        <header className="relative flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Avatar item={item} />
            <div className="min-w-0">
              <div className="text-foreground text-sm font-semibold leading-tight">
                {item.person.name}
              </div>
              <div className="text-muted-foreground mt-0.5 text-xs">
                {item.person.role}
              </div>
            </div>
          </div>
          <div
            className="label-mono text-foreground/70 max-w-[55%] truncate text-right"
            title={item.company.name}
          >
            {item.company.name}
          </div>
        </header>

        <blockquote className="text-foreground/90 relative text-pretty text-xl leading-relaxed sm:text-2xl">
          <span aria-hidden className="text-muted-foreground/70">“</span>
          <QuoteText segments={item.shortQuote} />
          <span aria-hidden className="text-muted-foreground/70">”</span>
        </blockquote>

        <div className="text-muted-foreground group-hover:text-foreground relative mt-auto inline-flex items-center gap-1.5 text-xs font-medium opacity-0 transition-all duration-200 group-hover:opacity-100">
          Read the full story
          <ArrowUpRight className="size-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </div>
      </Link>
    </motion.div>
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
        className="border-border/60 size-10 shrink-0 rounded-full border object-cover"
      />
    )
  }
  return (
    <div
      aria-hidden
      className="border-border/60 bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-full border font-mono text-xs font-semibold"
    >
      {item.person.initials}
    </div>
  )
}

function PlaceholderCard({ delay }: { delay: number }) {
  return (
    <motion.a
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, delay }}
      href="mailto:hi@spoo.me?subject=spoo.me%20testimonial"
      className={cn(
        "group bg-background hover:bg-foreground/[0.02] relative flex h-full flex-col gap-7 overflow-hidden p-7 transition-colors sm:p-9 lg:col-span-5",
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
        className="bg-foreground/5 group-hover:bg-foreground/10 pointer-events-none absolute -bottom-24 -left-24 size-72 rounded-full opacity-60 blur-3xl transition-colors duration-500"
      />

      <header className="relative flex items-center gap-3">
        <div
          aria-hidden
          className="border-border/60 text-muted-foreground/70 flex size-10 shrink-0 items-center justify-center rounded-full border border-dashed font-mono text-sm"
        >
          +
        </div>
        <div className="label-mono text-foreground/70">Your team here</div>
      </header>

      <div className="text-muted-foreground relative flex-1 text-pretty text-xl leading-relaxed sm:text-2xl">
        <span aria-hidden className="text-muted-foreground/40">“</span>
        Using spoo in production?{" "}
        <span className="text-foreground/70">
          Tell us how it fits into your stack.
        </span>
        <span aria-hidden className="text-muted-foreground/40">”</span>
      </div>

      {/* Faux brand-name chips — hint at "your logo here" */}
      <div className="relative flex flex-wrap gap-1.5">
        {["YOUR LOGO", "TEAM", "BRAND"].map((label, i) => (
          <span
            key={label}
            className="border-border/60 text-muted-foreground/60 rounded-md border border-dashed px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em]"
            style={{ opacity: 1 - i * 0.25 }}
          >
            {label}
          </span>
        ))}
      </div>

      <div className="relative flex items-center gap-1.5">
        <span className="text-foreground/80 group-hover:text-foreground text-sm font-semibold transition-colors">
          Submit a testimonial
        </span>
        <ArrowUpRight className="text-muted-foreground/60 group-hover:text-foreground size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </div>
    </motion.a>
  )
}
