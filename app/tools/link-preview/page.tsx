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

const CHECKED = [
  {
    term: "Open Graph tags",
    lead: "og:title, og:description, og:image,",
    rest: "and og:site_name, the baseline every platform reads.",
  },
  {
    term: "Twitter card tags",
    lead: "twitter:card and friends,",
    rest: "which X reads before falling back to Open Graph.",
  },
  {
    term: "Raw HTML tags",
    lead: "The plain title and meta description,",
    rest: "the fallbacks when social tags are missing.",
  },
  {
    term: "Favicon and theme-color",
    lead: "The icon Slack shows",
    rest: "and the accent Discord tints its embed with.",
  },
  {
    term: "Length limits",
    lead: "Titles clip near 60 characters,",
    rest: "descriptions near 160. Over-length values are flagged inline.",
  },
  {
    term: "Five platform renders",
    lead: "X, Discord, Slack, WhatsApp, LinkedIn,",
    rest: "each drawn with its own real layout and precedence rules.",
  },
]

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
            <div className="mx-auto max-w-3xl px-5 py-20 sm:px-9 sm:py-24">
              <h2 className="font-semibold text-3xl text-foreground tracking-tight">
                What is a link preview?
              </h2>
              <p className="mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
                Paste a link in a chat or a post and the app draws a little card
                for it: a picture, a title, a line of description. That card is
                the link preview, and the page controls it through invisible
                meta tags in its HTML. The platform never looks at what the page
                looks like; it only reads those tags.
              </p>
              <h3 className="mt-14 font-semibold text-foreground text-xl tracking-tight">
                Why it matters
              </h3>
              <p className="mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
                The card is the first thing people see, usually before deciding
                whether to click at all. A link with a real card reads as
                something worth opening; a bare gray URL gets scrolled past, and
                a card with a broken image makes a legitimate page look sketchy.
                This tool shows the exact cards your page produces and the tags
                they were built from, so what people see is a choice instead of
                an accident.
              </p>

              <h3 className="mt-14 font-semibold text-foreground text-xl tracking-tight">
                What gets checked
              </h3>
              <p className="mt-3 max-w-xl text-muted-foreground">
                The checker reads the page the way the platform crawlers do and
                shows both the cards and the tags behind them.
              </p>
              <dl className="mt-10 grid gap-x-10 gap-y-7 sm:grid-cols-2">
                {CHECKED.map((item) => (
                  <div key={item.term}>
                    <dt className="label-mono text-muted-foreground">
                      {item.term}
                    </dt>
                    <dd className="mt-1.5 text-[15px] text-muted-foreground leading-relaxed">
                      <span className="text-foreground">{item.lead}</span>{" "}
                      {item.rest}
                    </dd>
                  </div>
                ))}
              </dl>

              <h3 className="mt-14 font-semibold text-foreground text-xl tracking-tight">
                How platforms build previews
              </h3>
              <p className="mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
                When a link is posted, the platform's crawler fetches the page
                once, reads the meta tags in the head, and caches the result,
                often for days. Open Graph tags are the shared baseline; X
                prefers its own twitter:* tags when both exist, Discord tints
                its embed with theme-color, and Slack adds the favicon and site
                name. Nothing about the visible page matters to the card: only
                the tags do, which is why a beautiful page with missing tags
                unfurls as a bare link.
              </p>

              <h3 className="mt-14 font-semibold text-foreground text-xl tracking-tight">
                Fixing a broken card
              </h3>
              <ol className="mt-4 max-w-2xl list-decimal space-y-3 pl-5 text-base text-muted-foreground leading-relaxed">
                <li>
                  Run the page here and read the tag audit: missing rows and
                  over-length values are marked in place.
                </li>
                <li>
                  Fix the tags at the source: og:title, og:description, and a
                  1200 by 630 og:image cover nearly every platform.
                </li>
                <li>
                  Bust the platform's cache. Facebook and LinkedIn have refetch
                  debuggers; for Discord and WhatsApp, append a throwaway query
                  like ?v=2 to force a fresh card.
                </li>
              </ol>

              <h3 className="mt-14 font-semibold text-foreground text-xl tracking-tight">
                One tool, several names
              </h3>
              <p className="mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
                Open Graph checker, meta tag checker, social card preview,
                Twitter card validator: the searches differ, the job is the
                same. This page renders the cards for five platforms and audits
                the tags they were built from, in one pass. Tracing where a
                short link lands instead? That's the{" "}
                <Link
                  href="/tools/url-expander"
                  className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
                >
                  URL expander
                </Link>
                .
              </p>
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
