import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowUpRight, Building2, MapPin } from "lucide-react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/lib/site-config"
import { flattenQuote, getTestimonial, testimonials } from "@/lib/testimonials"
import { TestimonialAvatar } from "../_components/avatar"
import { QuoteText } from "../_components/quote-text"

type Params = { slug: string }

export function generateStaticParams() {
  return testimonials.map((t) => ({ slug: t.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  const { slug } = await params
  const t = getTestimonial(slug)
  if (!t) return {}
  return {
    title: `${t.person.name}, ${t.company.name} — customer story`,
    description: flattenQuote(t.shortQuote),
  }
}

export default async function TestimonialDetailPage({
  params,
}: {
  params: Promise<Params>
}) {
  const { slug } = await params
  const t = getTestimonial(slug)
  if (!t) notFound()

  const others = testimonials.filter((x) => x.slug !== t.slug).slice(0, 2)

  return (
    <>
      <Header />
      <main className="overflow-hidden">
        {/* Hero pull quote */}
        <section className="relative pt-28 pb-24 sm:pt-36 sm:pb-32">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 [background-image:radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] [background-size:28px_28px] opacity-30 [mask-image:radial-gradient(ellipse_70%_50%_at_50%_30%,black,transparent)]"
          />
          {/* Brand-color glow anchor */}
          <span
            aria-hidden
            className="pointer-events-none absolute right-[-10%] top-[20%] -z-10 size-[36rem] rounded-full opacity-20 blur-[140px]"
            style={{ backgroundColor: t.accent }}
          />

          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <Link
              href="/testimonials"
              className="text-muted-foreground hover:text-foreground group inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
            >
              <ArrowLeft className="size-3.5 transition group-hover:-translate-x-0.5" />
              All stories
            </Link>

            <div className="mt-10">
              <span className="text-foreground/80 font-mono text-[11px] font-semibold uppercase tracking-[0.18em]">
                {t.company.name}
              </span>
            </div>

            <blockquote className="text-foreground/80 mt-8 text-balance text-3xl font-normal leading-[1.3] tracking-tight sm:text-4xl md:text-[2.75rem]">
              <span aria-hidden className="text-muted-foreground/50">“</span>
              <QuoteText segments={t.fullQuote} />
              <span aria-hidden className="text-muted-foreground/50">”</span>
            </blockquote>

            <div className="mt-12 flex items-center gap-4">
              <TestimonialAvatar
                src={t.person.avatarSrc}
                initials={t.person.initials}
                size="lg"
              />
              <div>
                <div className="text-foreground text-base font-semibold leading-tight">
                  {t.person.name}
                </div>
                <div className="text-muted-foreground mt-1 text-sm">
                  {t.person.role} · {t.company.name}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Metric bar (optional) */}
        {t.metric && (
          <section className="border-border/60 border-t">
            <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6">
              <div className="flex items-baseline gap-3">
                <span
                  className="text-5xl font-semibold tracking-tight sm:text-6xl"
                  style={{ color: t.accent }}
                >
                  {t.metric.value}
                </span>
                <span className="text-muted-foreground text-sm sm:text-base">
                  {t.metric.label}
                </span>
              </div>
            </div>
          </section>
        )}

        {/* About person + company — 2 panels */}
        <section className="py-24 sm:py-32">
          <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:px-6 md:grid-cols-2">
            {/* Person panel */}
            <div className="border-border/60 bg-card/30 flex flex-col rounded-2xl border p-7 sm:p-9">
              <div className="text-muted-foreground font-mono text-[11px] font-semibold uppercase tracking-[0.18em]">
                About the person
              </div>
              <div className="mt-6 flex items-center gap-4">
                <TestimonialAvatar
                  src={t.person.avatarSrc}
                  initials={t.person.initials}
                  size="lg"
                />
                <div>
                  <div className="text-foreground text-lg font-semibold leading-tight">
                    {t.person.name}
                  </div>
                  <div className="text-muted-foreground mt-1 text-sm">
                    {t.person.role}, {t.company.name}
                  </div>
                </div>
              </div>
              {t.person.bio && (
                <p className="text-muted-foreground mt-6 text-pretty text-sm leading-relaxed sm:text-base">
                  {t.person.bio}
                </p>
              )}
              {t.person.links && t.person.links.length > 0 && (
                <ul className="mt-auto flex flex-wrap gap-2 pt-8">
                  {t.person.links.map((l) => (
                    <li key={l.href}>
                      <a
                        href={l.href}
                        target="_blank"
                        rel="noreferrer"
                        className="border-border/60 hover:border-border bg-background hover:bg-muted/40 text-foreground/80 hover:text-foreground inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors"
                      >
                        {l.label}
                        <ArrowUpRight className="size-3" />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Company panel */}
            <div className="border-border/60 bg-card/30 relative flex flex-col overflow-hidden rounded-2xl border p-7 sm:p-9">
              <span
                aria-hidden
                className="pointer-events-none absolute -bottom-20 -right-20 size-56 rounded-full opacity-20 blur-3xl"
                style={{ backgroundColor: t.accent }}
              />
              <div className="text-muted-foreground relative font-mono text-[11px] font-semibold uppercase tracking-[0.18em]">
                About the company
              </div>
              <div className="relative mt-6 flex items-center gap-4">
                {t.company.logoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.company.logoSrc}
                    alt=""
                    className="border-border/60 bg-background size-14 shrink-0 rounded-xl border object-contain p-2"
                  />
                ) : (
                  <div
                    aria-hidden
                    className="border-border/60 bg-background flex size-14 shrink-0 items-center justify-center rounded-xl border"
                  >
                    <Building2 className="text-muted-foreground size-6" />
                  </div>
                )}
                <div>
                  <div className="text-foreground text-lg font-semibold leading-tight">
                    {t.company.name}
                  </div>
                  {t.company.tagline && (
                    <div className="text-muted-foreground mt-1 text-sm">
                      {t.company.tagline}
                    </div>
                  )}
                </div>
              </div>
              {t.company.description && (
                <p className="text-muted-foreground relative mt-6 text-pretty text-sm leading-relaxed sm:text-base">
                  {t.company.description}
                </p>
              )}
              <dl className="text-muted-foreground relative mt-6 flex flex-wrap gap-x-8 gap-y-3 text-xs">
                {t.company.industry && (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="size-3.5" />
                    <dt className="sr-only">Industry</dt>
                    <dd>{t.company.industry}</dd>
                  </div>
                )}
                {t.company.location && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="size-3.5" />
                    <dt className="sr-only">Location</dt>
                    <dd>{t.company.location}</dd>
                  </div>
                )}
              </dl>
              {t.company.url && (
                <a
                  href={t.company.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-foreground/80 hover:text-foreground group relative mt-6 inline-flex items-center gap-1.5 text-xs font-semibold"
                >
                  Visit {new URL(t.company.url).hostname.replace("www.", "")}
                  <ArrowUpRight className="size-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              )}
            </div>
          </div>
        </section>

        {/* Photos strip */}
        {t.photos && t.photos.length > 0 && (
          <section className="pb-24 sm:pb-32">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <div className="grid gap-4 md:grid-cols-3">
                {t.photos.map((p, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <figure key={i} className="space-y-2">
                    <img
                      src={p.src}
                      alt={p.alt}
                      loading="lazy"
                      decoding="async"
                      className="border-border/60 aspect-[4/3] w-full rounded-xl border object-cover"
                    />
                    {p.caption && (
                      <figcaption className="text-muted-foreground text-xs">
                        {p.caption}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* More stories */}
        {others.length > 0 && (
          <section className="border-border/60 border-t py-24 sm:py-32">
            <div className="mx-auto max-w-5xl px-4 sm:px-6">
              <div className="text-muted-foreground font-mono text-[11px] font-semibold uppercase tracking-[0.18em]">
                More stories
              </div>
              <div className="mt-8 grid gap-5 md:grid-cols-2">
                {others.map((o) => (
                  <Link
                    key={o.slug}
                    href={`/testimonials/${o.slug}`}
                    className="border-border/60 bg-card/30 hover:border-border/90 group relative flex flex-col gap-5 overflow-hidden rounded-2xl border p-7 transition-colors"
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -bottom-20 -right-20 size-56 rounded-full opacity-20 blur-3xl"
                      style={{ backgroundColor: o.accent }}
                    />
                    <div className="relative flex items-center gap-3">
                      <TestimonialAvatar
                        src={o.person.avatarSrc}
                        initials={o.person.initials}
                      />
                      <div>
                        <div className="text-foreground text-sm font-semibold leading-tight">
                          {o.person.name}
                        </div>
                        <div className="text-muted-foreground mt-0.5 text-xs">
                          {o.company.name}
                        </div>
                      </div>
                    </div>
                    <p className="text-foreground/80 relative line-clamp-3 text-base leading-relaxed">
                      “<QuoteText segments={o.shortQuote} />”
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="relative py-24 sm:py-32">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
            <h2 className="text-foreground text-balance text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
              Ship your links the{" "}
              <span className="text-muted-foreground italic font-serif font-normal">
                spoo way.
              </span>
            </h2>
            <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-balance text-base sm:text-lg">
              Free, open source, and built to grow with you.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" className="h-11 px-5">
                <Link href="/signup">
                  Get started free
                  <ArrowUpRight className="size-4" data-icon="inline-end" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-11 px-5">
                <a href={siteConfig.links.docs} target="_blank" rel="noreferrer">
                  Read the docs
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
