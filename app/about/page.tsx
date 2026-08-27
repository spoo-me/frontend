import type { Metadata } from "next"
import { ArrowUpRight, Building2 } from "lucide-react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageFrame } from "@/components/shared/section-shell"
import { SectionHeading } from "@/components/shared/section-heading"
import { Button } from "@/components/ui/button"
import { BrandIcons } from "@/components/icons/brand-icons"
import { siteConfig, stats } from "@/lib/site-config"

export const metadata: Metadata = {
  title: "About: the link platform that proves every click",
  description:
    "spoo.me is an open-source link management platform: analytics-led, API-first, self-hostable, and free of dark patterns.",
  openGraph: { images: [{ url: "/og/company/about.jpg", width: 2400, height: 1260, alt: "About spoo.me, an open-source link platform" }] },
  twitter: { card: "summary_large_image", images: ["/og/company/about.jpg"] },
}

const pillars = [
  {
    title: "Open by default",
    body: "Every component of the platform is open source: the link service and dashboard under AGPL-3.0, the SDKs and native apps under permissive licenses. Read the source, fork it, run it.",
  },
  {
    title: "Generous by default",
    body: "No ads, no selling click data, no dark patterns. The platform is funded by the people it serves, not by your data.",
  },
  {
    title: "API-first",
    body: "Every dashboard surface is backed by a documented public API. Six SDKs ship alongside the core platform. spoo is a building block, not a destination.",
  },
  {
    title: "Yours to host",
    body: "The entire stack runs on your own infrastructure with one command. Full feature parity, your domain, your database, no telemetry.",
  },
]

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="overflow-hidden pt-20">
        <PageFrame>
          {/* Hero */}
          <section className="pt-28 pb-12 sm:pt-32 sm:pb-16">
            <div className="mx-auto w-full max-w-4xl px-4 sm:px-6">
              <SectionHeading
                eyebrow={
                  <>
                    <Building2 className="size-3" /> About spoo
                  </>
                }
                title={
                  <>
                    A link platform,{" "}
                    <span className="font-normal font-serif text-muted-foreground italic">
                      built in the open.
                    </span>
                  </>
                }
                description="spoo.me is open-source link infrastructure. Every component, every endpoint, every native client is free to read, run, and self-host. This is what we&apos;re building, and why."
              />
            </div>
          </section>

          {/* What spoo is */}
          <section className="py-16 sm:py-20">
            <div className="mx-auto max-w-4xl px-4 sm:px-6">
              <div className="flex flex-col gap-6 text-base text-muted-foreground leading-relaxed sm:text-lg">
                <p className="font-semibold text-2xl text-foreground tracking-tight sm:text-3xl">
                  What spoo is.
                </p>
                <p>
                  spoo.me is a complete link management stack: a high-throughput
                  redirect service, a dashboard for managing campaigns, a public
                  API for automation, and an ecosystem of native clients across
                  browser, desktop, mobile shortcuts, Discord, and Telegram. All
                  of it open source.
                </p>
                <p>
                  The platform has served over 100 million clicks across every
                  region, and is used by independent developers, indie teams,
                  and organizations that need link infrastructure without the
                  lock-in of a SaaS vendor.
                </p>
              </div>
            </div>
          </section>

          {/* Why it exists */}
          <section className="border-border/40 border-y bg-card/20 py-20 sm:py-24">
            <div className="mx-auto max-w-4xl px-4 sm:px-6">
              <div className="flex flex-col gap-6 text-base text-muted-foreground leading-relaxed sm:text-lg">
                <p className="font-semibold text-2xl text-foreground tracking-tight sm:text-3xl">
                  Why it exists.
                </p>
                <p>
                  Link shorteners follow a predictable pattern: your redirects
                  live on someone else&apos;s infrastructure, on someone
                  else&apos;s terms, with a quiet erosion of ownership over your
                  own redirect data. spoo was built to flip that pattern.
                </p>
                <p>
                  The entire stack (analytics, custom domains, API access, every
                  native client) is open source and self-hostable, so the option
                  to leave is always one command away. Link infrastructure
                  should behave like a public utility: transparent, portable,
                  and never holding your data hostage.
                </p>
              </div>
            </div>
          </section>

          {/* Pillars */}
          <section className="py-20 sm:py-24">
            <div className="mx-auto max-w-6xl px-4 sm:px-6">
              <SectionHeading
                title={
                  <>
                    What spoo stands{" "}
                    <span className="font-normal font-serif text-muted-foreground italic">
                      for.
                    </span>
                  </>
                }
                description="The principles that shape every release of the platform."
              />
              <div className="mt-12 grid gap-3 sm:grid-cols-2">
                {pillars.map((p) => (
                  <div
                    key={p.title}
                    className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/40 p-7"
                  >
                    <div className="font-semibold text-base text-foreground leading-tight">
                      {p.title}
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {p.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Who builds it */}
          <section className="py-20 sm:py-24">
            <div className="mx-auto max-w-4xl px-4 sm:px-6">
              <h2 className="font-semibold text-3xl text-foreground tracking-tight sm:text-4xl md:text-5xl">
                Built by{" "}
                <span className="font-normal font-serif text-muted-foreground italic">
                  one person.
                </span>
              </h2>

              <div className="mt-12 flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="https://github.com/zingzy.png?size=200"
                  alt="Zingzy"
                  className="size-16 rounded-full border border-border/60 object-cover"
                />
                <div>
                  <div className="font-semibold text-foreground text-sm leading-tight">
                    Zingzy
                  </div>
                  <div className="mt-1 text-muted-foreground text-xs">
                    Founder &amp; maintainer
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-6 text-base text-muted-foreground leading-relaxed">
                <p>
                  spoo is not a company with departments. Every service in the
                  ecosystem (the redirect core, the dashboard, the SDKs, the
                  native apps, and this site) is designed, built, and operated
                  by one developer.
                </p>
                <p>
                  It is not built alone, though. {stats.contributors}{" "}
                  contributors have landed fixes and features across the
                  open-source repos, and the community on Discord shapes what
                  ships next.
                </p>
              </div>

              <div className="mt-12 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" variant="outline" className="h-10">
                  <a
                    href={siteConfig.links.github}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <BrandIcons.github
                      className="size-4"
                      data-icon="inline-start"
                    />
                    Contribute on GitHub
                    <ArrowUpRight className="size-3.5" data-icon="inline-end" />
                  </a>
                </Button>
                <Button asChild size="lg" variant="ghost" className="h-10">
                  <a
                    href="https://github.com/sponsors/spoo-me"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Sponsor the project
                    <ArrowUpRight className="size-3.5" data-icon="inline-end" />
                  </a>
                </Button>
              </div>
            </div>
          </section>
        </PageFrame>
      </main>
      <Footer />
    </>
  )
}
