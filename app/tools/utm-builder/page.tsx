import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageFrame, Section } from "@/components/shared/section-shell"
import { Button } from "@/components/ui/button"
import { ToolFaq } from "@/components/tools/faq"
import { UtmBuilder } from "@/components/tools/utm-builder"
import { tools } from "@/lib/tools-data"
import { socialCard } from "@/lib/og"

const tool = tools.find((t) => t.slug === "utm-builder")!

export const metadata: Metadata = {
  title: tool.seoTitle,
  description: tool.description,
  ...socialCard({
    title: tool.seoTitle,
    description: tool.description,
    image: "/og/tools/utm-builder.jpg",
    alt: "spoo.me UTM builder",
  }),
}

const PARAMS = [
  {
    term: "utm_source",
    lead: "Where the link lives:",
    rest: "newsletter, google, x, a partner's site. The place, not the format.",
  },
  {
    term: "utm_medium",
    lead: "The channel type:",
    rest: "email, social, cpc, referral. A newsletter link is source=newsletter, medium=email.",
  },
  {
    term: "utm_campaign",
    lead: "The push it belongs to:",
    rest: "spring-launch, black-friday. Groups every link of one effort together.",
  },
  {
    term: "utm_term",
    lead: "The paid keyword,",
    rest: "mostly for search ads. Skip it everywhere else.",
  },
  {
    term: "utm_content",
    lead: "Which variant was clicked:",
    rest: "footer-cta versus hero-button. For telling two links in one place apart.",
  },
]

const FAQ = [
  {
    q: "Do UTM parameters work on any website?",
    a: "Yes. They are ordinary query parameters, so every destination accepts them, and any analytics tool on that site can read them. Sites without analytics simply ignore them; the link still works.",
  },
  {
    q: "What is the difference between source and medium?",
    a: "Source is where the link lives, like newsletter or google. Medium is the channel type, like email or social. A link in your newsletter is source=newsletter, medium=email.",
  },
  {
    q: "Are UTM parameters case-sensitive?",
    a: "Yes. google and Google count as two different sources in most analytics tools. Pick lowercase and stay consistent.",
  },
  {
    q: "Do UTM parameters hurt SEO?",
    a: "Tagged URLs can be indexed as duplicates if you use them in your own site navigation. Use them on links you distribute elsewhere, and canonical tags absorb the rest.",
  },
  {
    q: "How do I see clicks on a UTM link?",
    a: "Shorten the tagged link here and the spoo.me stats page shows clicks, countries, referrers, and devices live. No account needed.",
  },
]

export default function UtmBuilderPage() {
  return (
    <>
      <Header />
      <main className="overflow-hidden pt-20">
        <PageFrame>
          <Section>
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl flex-col justify-center px-5 py-16 text-center sm:px-9">
              <h1 className="text-balance font-semibold text-4xl text-foreground tracking-tight sm:text-5xl">
                UTM builder
              </h1>
              <p className="mt-4 text-balance text-lg text-muted-foreground">
                Tag a link with source, medium, and campaign, then shorten it
                and watch the clicks live.
              </p>
              <div className="mt-10 text-left">
                <UtmBuilder />
              </div>
            </div>
          </Section>

          <Section>
            <div className="mx-auto max-w-3xl px-5 py-20 sm:px-9 sm:py-24">
              <h2 className="font-semibold text-3xl text-foreground tracking-tight">
                What are UTM parameters?
              </h2>
              <p className="mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
                When someone visits your site, your analytics can usually see
                that they arrived but not what brought them: the newsletter, the
                tweet, and the ad all collapse into the same anonymous click.
                UTM parameters fix that. They are small labels added to the end
                of a link, like utm_source=newsletter, that travel with every
                click and tell your analytics exactly where it came from.
              </p>
              <h3 className="mt-14 font-semibold text-foreground text-xl tracking-tight">
                Why it matters
              </h3>
              <p className="mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
                Without them, most campaign traffic files itself under direct or
                unknown, and decisions about where to spend time and money get
                made blind. With them, every channel's clicks are separated
                cleanly, in any analytics tool, because the labels ride the URL
                itself. Nothing to install, nothing platform-specific.
              </p>

              <h3 className="mt-14 font-semibold text-foreground text-xl tracking-tight">
                The five parameters
              </h3>
              <p className="mt-3 max-w-xl text-muted-foreground">
                UTM tags are plain query parameters your analytics tool reads to
                attribute a visit. Five exist; most links need three.
              </p>
              <dl className="mt-10 grid gap-x-10 gap-y-7 sm:grid-cols-2">
                {PARAMS.map((param) => (
                  <div key={param.term}>
                    <dt className="label-mono text-muted-foreground">
                      {param.term}
                    </dt>
                    <dd className="mt-1.5 text-[15px] text-muted-foreground leading-relaxed">
                      <span className="text-foreground">{param.lead}</span>{" "}
                      {param.rest}
                    </dd>
                  </div>
                ))}
              </dl>

              <h3 className="mt-14 font-semibold text-foreground text-xl tracking-tight">
                Naming that keeps reports clean
              </h3>
              <p className="mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
                Analytics tools treat google and Google as two different
                sources, so pick lowercase once and never look back. Use hyphens
                instead of spaces, keep a short shared vocabulary for mediums
                (email, social, cpc), and tag only links you distribute
                elsewhere. Tagging your own site's internal navigation
                overwrites the real session source and quietly corrupts every
                report downstream.
              </p>

              <h3 className="mt-14 font-semibold text-foreground text-xl tracking-tight">
                Why shorten the tagged link
              </h3>
              <p className="mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
                A tagged URL is long and reveals your campaign naming to anyone
                who reads it. Shortening it hides the noise, keeps the tags
                intact for your analytics, and adds a live stats page of its
                own: clicks, countries, referrers, and devices, counted from the
                moment you share it. No account needed, and the{" "}
                <Link
                  href="/tools/qr-code"
                  className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
                >
                  QR code generator
                </Link>{" "}
                can put the same short link on anything printed.
              </p>
            </div>
          </Section>

          <Section>
            <ToolFaq
              items={FAQ}
              intro="Short answers about UTM tags and how tracking works here."
            />
          </Section>

          <Section>
            <div className="mx-auto max-w-2xl px-5 py-20 text-center sm:px-9">
              <h2 className="text-balance font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
                Links you can{" "}
                <span className="font-normal font-serif text-muted-foreground italic">
                  prove.
                </span>
              </h2>
              <p className="mt-4 text-muted-foreground">
                Every link you shorten here has a live stats page. An account
                keeps them editable and in one place.
              </p>
              <div className="mt-8 flex items-center justify-center gap-3">
                <Button asChild size="lg">
                  <Link href="/signup">Create your account</Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/tools">
                    All tools
                    <ArrowUpRight className="size-4" data-icon="inline-end" />
                  </Link>
                </Button>
              </div>
            </div>
          </Section>
        </PageFrame>
      </main>
      <Footer />
    </>
  )
}
