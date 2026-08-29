import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageFrame, Section } from "@/components/shared/section-shell"
import { Button } from "@/components/ui/button"
import { ToolFaq } from "@/components/tools/faq"
import { LinkPreviewChecker } from "@/components/tools/link-preview"
import { tools } from "@/lib/tools-data"
import { socialCard } from "@/lib/og"

const tool = tools.find((t) => t.slug === "link-preview")!

export const metadata: Metadata = {
  title: tool.seoTitle,
  description: tool.description,
  ...socialCard({
    title: tool.seoTitle,
    description: tool.description,
    image: "/og/tools/link-preview.jpg",
    alt: "spoo.me link preview checker",
  }),
}

const FAQ = [
  {
    q: "Why is my link preview not showing?",
    a: "Usually a missing og:image or og:title tag. Platforms also cache previews aggressively, so a page fixed five minutes ago can still unfurl with the old card. Check the tag audit here to see what the page actually serves.",
  },
  {
    q: "What size should an og:image be?",
    a: "1200 by 630 pixels, a 1.91:1 ratio. Keep it under 5 MB and use PNG or JPEG. Most platforms crop to that ratio, so anything else gets cut unpredictably.",
  },
  {
    q: "Which meta tags do link previews use?",
    a: "og:title, og:description, and og:image cover nearly everything. X reads twitter:card to pick the card layout, Discord tints its embed with theme-color, and Slack shows the favicon and site name.",
  },
  {
    q: "How do I refresh a cached preview?",
    a: "Facebook and LinkedIn have debugger tools that refetch on demand. Discord and WhatsApp cache by exact URL, so appending a throwaway query string like ?v=2 forces a fresh card. X refetches on its own schedule.",
  },
  {
    q: "Why does a preview fail here but work on X or Discord?",
    a: "Bot protection. Many sites allow only the big platform crawlers through and refuse everyone else, including this tool's fetcher. So a page we can't read can still unfurl fine on X, Discord, or Slack, whose crawlers are on the allowlist.",
  },
  {
    q: "Why does the preview look different on each platform?",
    a: "Each platform reads a slightly different tag set and renders its own layout. X prefers twitter:* tags over og:*, WhatsApp shows a compact card, and Discord respects theme-color. That is why this page shows all of them side by side.",
  },
]

export default function LinkPreviewPage() {
  return (
    <>
      <Header />
      <main className="overflow-x-clip pt-20">
        <PageFrame>
          <Section>
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl flex-col justify-center px-5 py-16 text-center sm:px-9">
              <h1 className="text-balance font-semibold text-4xl text-foreground tracking-tight sm:text-5xl">
                Link preview checker
              </h1>
              <p className="mt-4 text-balance text-lg text-muted-foreground">
                See the exact card X, Discord, Slack, WhatsApp, and LinkedIn
                will render, and the tags behind it.
              </p>
              <div className="mt-10 text-left">
                <LinkPreviewChecker />
              </div>
            </div>
          </Section>

          <Section>
            <ToolFaq
              items={FAQ}
              intro="Short answers about social cards and why previews break."
            />
          </Section>

          <Section>
            <div className="mx-auto max-w-2xl px-5 py-20 text-center sm:px-9">
              <h2 className="text-balance font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
                Now watch who{" "}
                <span className="font-normal font-serif text-muted-foreground italic">
                  clicks.
                </span>
              </h2>
              <p className="mt-4 text-muted-foreground">
                Every link you shorten on spoo.me has a live stats page: clicks,
                countries, referrers, devices.
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
