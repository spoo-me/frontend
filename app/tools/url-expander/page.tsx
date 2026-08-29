import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageFrame, Section } from "@/components/shared/section-shell"
import { Button } from "@/components/ui/button"
import { ToolFaq } from "@/components/tools/faq"
import { UrlExpander } from "@/components/tools/url-expander"
import { tools } from "@/lib/tools-data"
import { socialCard } from "@/lib/og"

const tool = tools.find((t) => t.slug === "url-expander")!

export const metadata: Metadata = {
  title: tool.seoTitle,
  description: tool.description,
  ...socialCard({
    title: tool.seoTitle,
    description: tool.description,
    image: "/og/tools/url-expander.jpg",
    alt: "spoo.me URL expander",
  }),
}

const FAQ = [
  {
    q: "What does a URL expander do?",
    a: "It follows a short link's redirects server-side and shows you every stop and the final page, so you see where a link goes without visiting it yourself.",
  },
  {
    q: "Is it safe to expand a suspicious link here?",
    a: "Yes. The chain is followed from our servers, not your browser, and only each hop's status and address are read. Nothing runs on your device.",
  },
  {
    q: "Which shorteners does it work with?",
    a: "Any of them. bit.ly, t.co, tinyurl, spoo.me, and every other service that redirects with HTTP. Chains through multiple shorteners unroll hop by hop.",
  },
  {
    q: "What does the safety check actually cover?",
    a: "Three things, stated plainly: the full redirect chain, whether every hop uses https, and whether any hop matches the abuse blocklist spoo.me enforces when links are created. It is not a full malware scan.",
  },
  {
    q: "Why did a link fail to expand?",
    a: "Dead links, private or internal addresses, and hosts that refuse non-browser requests all fail. Links that redirect via JavaScript or meta refresh instead of HTTP also can't be followed.",
  },
]

export default function UrlExpanderPage() {
  return (
    <>
      <Header />
      <main className="overflow-x-clip pt-20">
        <PageFrame>
          <Section>
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl flex-col justify-center px-5 py-16 text-center sm:px-9">
              <h1 className="text-balance font-semibold text-4xl text-foreground tracking-tight sm:text-5xl">
                URL expander
              </h1>
              <p className="mt-4 text-balance text-lg text-muted-foreground">
                See every redirect and the final destination of any short link,
                before you click it.
              </p>
              <div className="mt-10 text-left">
                <UrlExpander />
              </div>
            </div>
          </Section>

          <Section>
            <ToolFaq
              items={FAQ}
              intro="Short answers about expanding links and what gets checked."
            />
          </Section>

          <Section>
            <div className="mx-auto max-w-2xl px-5 py-20 text-center sm:px-9">
              <h2 className="text-balance font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
                Links with nothing to{" "}
                <span className="font-normal font-serif text-muted-foreground italic">
                  hide.
                </span>
              </h2>
              <p className="mt-4 text-muted-foreground">
                Every spoo.me link has a public preview page and live stats
                anyone can check.
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
