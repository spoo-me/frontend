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
    title: `${t.person.name}, ${t.company.name} · customer story`,
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
            className="pointer-events-none absolute inset-0 -z-10 opacity-30 [background-image:radial-gradient(circle_at_1px_1px,var(--color-border)_1px,transparent_0)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_30%,black,transparent)]"
          />
          {/* Brand-color glow anchor */}
          <span
            aria-hidden
            className="pointer-events-none absolute top-[20%] right-[-10%] -z-10 size-[36rem] rounded-full opacity-20 blur-[140px]"
            style={{ backgroundColor: t.accent }}
          />

          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <Link
              href="/testimonials"
              className="group inline-flex items-center gap-1.5 font-medium text-muted-foreground text-xs transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3.5 transition group-hover:-translate-x-0.5" />
              All stories
            </Link>

            <div className="mt-10">
              <span className="font-mono font-semibold text-[11px] text-foreground/80 uppercase tracking-[0.18em]">
                {t.company.name}
              </span>
            </div>

            <blockquote className="mt-8 text-balance font-normal text-3xl text-foreground/80 leading-[1.3] tracking-tight sm:text-4xl md:text-[2.75rem]">
              <span aria-hidden className="text-muted-foreground/50">
                “
              </span>
              <QuoteText segments={t.fullQuote} />
              <span aria-hidden className="text-muted-foreground/50">
                ”
              </span>
            </blockquote>

            <div className="mt-12 flex items-center gap-4">
              <TestimonialAvatar
                src={t.person.avatarSrc}
                initials={t.person.initials}
                size="lg"
              />
              <div>
                <div className="font-semibold text-base text-foreground leading-tight">
                  {t.person.name}
                </div>
                <div className="mt-1 text-muted-foreground text-sm">
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
                  className="font-semibold text-5xl tracking-tight sm:text-6xl"
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
            <div className="flex flex-col rounded-2xl border border-border/60 bg-card/30 p-7 sm:p-9">
              <div className="font-mono font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
                About the person
              </div>
              <div className="mt-6 flex items-center gap-4">
                <TestimonialAvatar
                  src={t.person.avatarSrc}
                  initials={t.person.initials}
                  size="lg"
                />
                <div>
                  <div className="font-semibold text-foreground text-lg leading-tight">
                    {t.person.name}
                  </div>
                  <div className="mt-1 text-muted-foreground text-sm">
                    {t.person.role}, {t.company.name}
                  </div>
                </div>
              </div>
              {t.person.bio && (
                <p className="mt-6 text-pretty text-muted-foreground text-sm leading-relaxed sm:text-base">
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
                        className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background px-3 py-1 font-medium text-foreground/80 text-xs transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground"
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
            <div className="relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card/30 p-7 sm:p-9">
              <span
                aria-hidden
                className="pointer-events-none absolute -right-20 -bottom-20 size-56 rounded-full opacity-20 blur-3xl"
                style={{ backgroundColor: t.accent }}
              />
              <div className="relative font-mono font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
                About the company
              </div>
              <div className="relative mt-6 flex items-center gap-4">
                {t.company.logoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.company.logoSrc}
                    alt=""
                    className="size-14 shrink-0 rounded-xl border border-border/60 bg-background object-contain p-2"
                  />
                ) : (
                  <div
                    aria-hidden
                    className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background"
                  >
                    <Building2 className="size-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <div className="font-semibold text-foreground text-lg leading-tight">
                    {t.company.name}
                  </div>
                  {t.company.tagline && (
                    <div className="mt-1 text-muted-foreground text-sm">
                      {t.company.tagline}
                    </div>
                  )}
                </div>
              </div>
              {t.company.description && (
                <p className="relative mt-6 text-pretty text-muted-foreground text-sm leading-relaxed sm:text-base">
                  {t.company.description}
                </p>
              )}
              <dl className="relative mt-6 flex flex-wrap gap-x-8 gap-y-3 text-muted-foreground text-xs">
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
                  className="group relative mt-6 inline-flex items-center gap-1.5 font-semibold text-foreground/80 text-xs hover:text-foreground"
                >
                  Visit {new URL(t.company.url).hostname.replace("www.", "")}
                  <ArrowUpRight className="size-3.5 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
                      className="aspect-[4/3] w-full rounded-xl border border-border/60 object-cover"
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
              <div className="font-mono font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.18em]">
                More stories
              </div>
              <div className="mt-8 grid gap-5 md:grid-cols-2">
                {others.map((o) => (
                  <Link
                    key={o.slug}
                    href={`/testimonials/${o.slug}`}
                    className="group relative flex flex-col gap-5 overflow-hidden rounded-2xl border border-border/60 bg-card/30 p-7 transition-colors hover:border-border/90"
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -right-20 -bottom-20 size-56 rounded-full opacity-20 blur-3xl"
                      style={{ backgroundColor: o.accent }}
                    />
                    <div className="relative flex items-center gap-3">
                      <TestimonialAvatar
                        src={o.person.avatarSrc}
                        initials={o.person.initials}
                      />
                      <div>
                        <div className="font-semibold text-foreground text-sm leading-tight">
                          {o.person.name}
                        </div>
                        <div className="mt-0.5 text-muted-foreground text-xs">
                          {o.company.name}
                        </div>
                      </div>
                    </div>
                    <p className="relative line-clamp-3 text-base text-foreground/80 leading-relaxed">
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
            <h2 className="text-balance font-semibold text-3xl text-foreground tracking-tight sm:text-4xl md:text-5xl">
              Ship your links the{" "}
              <span className="font-normal font-serif text-muted-foreground italic">
                spoo way.
              </span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
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
                <a
                  href={siteConfig.links.docs}
                  target="_blank"
                  rel="noreferrer"
                >
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
