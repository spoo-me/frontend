import type { Metadata } from "next"
import type { LucideIcon } from "lucide-react"
import { ArrowUpRight, ChartLine, Code2, ShieldCheck } from "lucide-react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { PageFrame, Section, Band } from "@/components/shared/section-shell"
import { ProductPageHero } from "@/components/product/page-hero"
import { AnnotatedDashboard } from "@/components/product/annotated-dashboard"
import { WidgetGallery } from "@/components/product/widget-gallery"
import { Dimensions } from "@/components/product/dimensions"
import { AnalyticsQueryDemo } from "@/components/sections/analytics-query-demo"
import { CTA } from "@/components/sections/cta"
import { siteConfig } from "@/lib/site-config"

export const metadata: Metadata = {
  title: "Link analytics",
  description:
    "A real analytics board included with every short link: time series, geography, referrers, devices. No tags, no third-party scripts, no cookie banners.",
}

/* Everything on the page is shipped behavior: the preview, the query
   demo, and the claim cells are the same product-real components the
   landing composes. */
export default function AnalyticsProductPage() {
  return (
    <>
      <Header />
      <main className="overflow-hidden">
        <PageFrame>
          <Section>
            <ProductPageHero
              title={
                <>
                  Every click,{" "}
                  <span className="font-normal text-muted-foreground italic [font-family:var(--font-serif)]">
                    accounted for.
                  </span>
                </>
              }
              description="Time series, geography, referrers, browsers, devices. A real analytics board included with every short link, with no tags to install and no cookie banners to apologize for."
              secondaryCta={
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="h-10 px-4"
                >
                  <a
                    href={siteConfig.app.dashboard}
                    target="_blank"
                    rel="noreferrer"
                  >
                    See the live demo
                    <ArrowUpRight className="size-4" data-icon="inline-end" />
                  </a>
                </Button>
              }
            />
            <AnnotatedDashboard />
          </Section>

          <Section>
            <WidgetGallery />
          </Section>

          <Section>
            <Dimensions />
            <AnalyticsQueryDemo />
          </Section>

          {/* The reach beyond the board: where the numbers travel */}
          <Section>
            <Band rule>
              <div className="grid grid-cols-1 gap-px bg-border lg:grid-cols-3">
                {REACH.map((r) => (
                  <div
                    key={r.title}
                    className="flex flex-col gap-4 bg-background p-7 sm:p-9"
                  >
                    <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/60 bg-muted/30 text-foreground">
                      <r.icon className="size-4" strokeWidth={1.75} />
                    </span>
                    <div className="flex-1">
                      <h3 className="font-semibold text-base text-foreground tracking-tight">
                        {r.title}
                      </h3>
                      <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
                        {r.body}
                      </p>
                    </div>
                    {r.link && (
                      <a
                        href={r.link.href}
                        target="_blank"
                        rel="noreferrer"
                        className="group inline-flex items-center gap-1 font-medium text-muted-foreground text-xs transition-colors hover:text-foreground"
                      >
                        {r.link.label}
                        <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </Band>
          </Section>

          <Section>
            <CTA />
          </Section>
        </PageFrame>
      </main>
      <Footer />
    </>
  )
}

type ReachItem = {
  icon: LucideIcon
  title: string
  body: string
  link?: { label: string; href: string }
}

const REACH: ReachItem[] = [
  {
    icon: ChartLine,
    title: "Public stats pages",
    body: "Every short link carries a shareable stats page. Send a client or a teammate the live numbers: charts, countries, referrers. No account needed on their end.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    body: "Analytics run first-party on spoo's own infrastructure. No third-party scripts on your visitors, no cookie banners, and the whole stack is open source if you'd rather run it yourself.",
  },
  {
    icon: Code2,
    title: "Every number, by API",
    body: "Anything the board shows, the API returns. Pull stats into your own dashboards, reports, or cron jobs with a single call.",
    link: {
      label: "Read the API reference",
      href: "https://docs.spoo.me",
    },
  },
]
