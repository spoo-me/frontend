import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, MessageSquareQuote } from "lucide-react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { SectionHeading } from "@/components/shared/section-heading"
import { testimonials } from "@/lib/testimonials"
import { TestimonialAvatar } from "./_components/avatar"
import { QuoteText } from "./_components/quote-text"

export const metadata: Metadata = {
  title: "Customer stories",
  description:
    "Operators, founders, and engineers share how spoo.me fits into their stack — from quick links to production link infrastructure.",
}

export default function TestimonialsIndexPage() {
  return (
    <>
      <Header />
      <main className="overflow-hidden">
        <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 [background-image:radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] [background-size:28px_28px] opacity-30 [mask-image:radial-gradient(ellipse_60%_40%_at_50%_30%,black,transparent)]"
          />

          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <SectionHeading
              eyebrow={
                <>
                  <MessageSquareQuote className="size-3" /> Customer stories
                </>
              }
              title={
                <>
                  Built by us, shaped by{" "}
                  <span className="text-muted-foreground italic [font-family:var(--font-serif)] font-normal">
                    the people using it.
                  </span>
                </>
              }
              description="Honest, unedited stories from teams running spoo.me in production. No paid placements, no marketing fluff."
            />
          </div>
        </section>

        <section className="pb-32 sm:pb-40">
          <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-2">
            {testimonials.map((t) => (
              <Link
                key={t.slug}
                href={`/testimonials/${t.slug}`}
                className="border-border/60 bg-card/30 hover:border-border/90 group relative flex flex-col gap-7 overflow-hidden rounded-2xl border p-7 transition-colors sm:p-9"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -bottom-24 -right-24 size-72 rounded-full opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
                  style={{ backgroundColor: t.accent }}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute bottom-0 right-0 size-40 rounded-full opacity-[0.12] blur-2xl"
                  style={{ backgroundColor: t.accent }}
                />

                <header className="relative flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <TestimonialAvatar
                      src={t.person.avatarSrc}
                      initials={t.person.initials}
                    />
                    <div>
                      <div className="text-foreground text-sm font-semibold leading-tight">
                        {t.person.name}
                      </div>
                      <div className="text-muted-foreground mt-0.5 text-xs">
                        {t.person.role}
                      </div>
                    </div>
                  </div>
                  <div className="text-foreground/70 max-w-[55%] truncate text-right font-mono text-[11px] font-semibold uppercase tracking-[0.16em]">
                    {t.company.name}
                  </div>
                </header>

                <blockquote className="text-foreground/90 relative text-pretty text-xl leading-relaxed sm:text-[1.35rem]">
                  <span aria-hidden className="text-muted-foreground/70">“</span>
                  <QuoteText segments={t.shortQuote} />
                  <span aria-hidden className="text-muted-foreground/70">”</span>
                </blockquote>

                <div className="text-muted-foreground group-hover:text-foreground relative mt-auto inline-flex items-center gap-1.5 text-xs font-medium transition-colors">
                  Read the full story
                  <ArrowUpRight className="size-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}

            <a
              href="mailto:hi@spoo.me?subject=spoo.me%20testimonial"
              className="group border-border/50 hover:border-border bg-card/10 hover:bg-card/30 relative flex flex-col gap-7 rounded-2xl border border-dashed p-7 transition-colors sm:p-9"
            >
              <header className="flex items-center gap-3">
                <div
                  aria-hidden
                  className="border-border/60 text-muted-foreground/70 flex size-10 shrink-0 items-center justify-center rounded-full border border-dashed font-mono text-sm"
                >
                  +
                </div>
                <div className="text-foreground/70 font-mono text-[11px] font-semibold uppercase tracking-[0.16em]">
                  Your team here
                </div>
              </header>

              <div className="text-muted-foreground flex-1 text-pretty text-xl leading-relaxed sm:text-[1.35rem]">
                Using spoo in production?{" "}
                <span className="text-foreground/70">Tell us your story.</span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-foreground/80 group-hover:text-foreground text-sm font-semibold transition-colors">
                  Submit a testimonial
                </span>
                <ArrowUpRight className="text-muted-foreground/60 group-hover:text-foreground size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </div>
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
