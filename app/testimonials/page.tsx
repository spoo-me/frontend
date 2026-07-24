import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight } from "@/components/icons"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageFrame } from "@/components/shared/section-shell"
import { SectionHeading } from "@/components/shared/section-heading"
import { testimonials } from "@/lib/testimonials"
import { TestimonialAvatar } from "./_components/avatar"
import { QuoteText } from "./_components/quote-text"

export const metadata: Metadata = {
  title: "Customer stories",
  description:
    "Operators, founders, and engineers share how spoo.me fits into their stack, from quick links to production link infrastructure.",
}

export default function TestimonialsIndexPage() {
  return (
    <>
      <Header />
      <main className="overflow-hidden pt-20">
        <PageFrame>
          <section className="relative pt-28 pb-20 sm:pt-36 sm:pb-28">
            <div
              aria-hidden
              className="pattern-dots pointer-events-none absolute inset-0 -z-10 opacity-30 [mask-image:radial-gradient(ellipse_60%_40%_at_50%_30%,black,transparent)]"
            />

            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <SectionHeading
                title={
                  <>
                    Built by us, shaped by{" "}
                    <span className="font-normal font-serif text-muted-foreground italic">
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
                  className="group relative flex flex-col gap-7 overflow-hidden rounded-2xl border border-border/60 bg-card/30 p-7 transition-colors hover:border-border/90 sm:p-9"
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-24 -bottom-24 size-72 rounded-full opacity-25 blur-3xl transition-opacity duration-500 group-hover:opacity-40"
                    style={{ backgroundColor: t.accent }}
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute right-0 bottom-0 size-40 rounded-full opacity-[0.12] blur-2xl"
                    style={{ backgroundColor: t.accent }}
                  />

                  <header className="relative flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <TestimonialAvatar
                        src={t.person.avatarSrc}
                        initials={t.person.initials}
                      />
                      <div>
                        <div className="font-semibold text-foreground text-sm leading-tight">
                          {t.person.name}
                        </div>
                        <div className="mt-0.5 text-muted-foreground text-xs">
                          {t.person.role}
                        </div>
                      </div>
                    </div>
                    <div className="max-w-[55%] truncate text-right font-mono font-semibold text-[11px] text-foreground/70 uppercase tracking-[0.16em]">
                      {t.company.name}
                    </div>
                  </header>

                  <blockquote className="relative text-pretty text-foreground/90 text-xl leading-relaxed sm:text-[1.35rem]">
                    <span aria-hidden className="text-muted-foreground/70">
                      “
                    </span>
                    <QuoteText segments={t.shortQuote} />
                    <span aria-hidden className="text-muted-foreground/70">
                      ”
                    </span>
                  </blockquote>

                  <div className="relative mt-auto inline-flex items-center gap-1.5 font-medium text-muted-foreground text-xs transition-colors group-hover:text-foreground">
                    Read the full story
                    <ArrowUpRight className="size-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </div>
                </Link>
              ))}

              <a
                href="mailto:hi@spoo.me?subject=spoo.me%20testimonial"
                className="group relative flex flex-col gap-7 rounded-2xl border border-border/50 border-dashed bg-card/10 p-7 transition-colors hover:border-border hover:bg-card/30 sm:p-9"
              >
                <header className="flex items-center gap-3">
                  <div
                    aria-hidden
                    className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border/60 border-dashed font-mono text-muted-foreground/70 text-sm"
                  >
                    +
                  </div>
                  <div className="font-mono font-semibold text-[11px] text-foreground/70 uppercase tracking-[0.16em]">
                    Your team here
                  </div>
                </header>

                <div className="flex-1 text-pretty text-muted-foreground text-xl leading-relaxed sm:text-[1.35rem]">
                  Using spoo in production?{" "}
                  <span className="text-foreground/70">
                    Tell us your story.
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-foreground/80 text-sm transition-colors group-hover:text-foreground">
                    Submit a testimonial
                  </span>
                  <ArrowUpRight className="size-4 text-muted-foreground/60 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-foreground" />
                </div>
              </a>
            </div>
          </section>
        </PageFrame>
      </main>
      <Footer />
    </>
  )
}
