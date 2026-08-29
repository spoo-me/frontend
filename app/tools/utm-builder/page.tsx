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

const FAQ = [
  {
    q: "What are UTM parameters?",
    a: "Tags added to a URL's query string (utm_source, utm_medium, utm_campaign, utm_term, utm_content) that analytics tools read to attribute a visit to a campaign.",
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
