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

const ABOUT = [
  {
    term: "Redirect chain",
    lead: "Every hop with its HTTP status,",
    rest: "from the link you pasted to the last stop, including chains that bounce through several shorteners.",
  },
  {
    term: "Final destination",
    lead: "The page the chain lands on,",
    rest: "shown with its own title, description, and preview image where the site provides them.",
  },
  {
    term: "Domain age",
    lead: "When the domain was registered,",
    rest: "straight from the registry. Days-old domains are the classic phishing tell.",
  },
  {
    term: "TLS certificate",
    lead: "Who issued the certificate",
    rest: "and when it expires, from the destination's own handshake.",
  },
  {
    term: "DNS records",
    lead: "The A, MX, and NS records",
    rest: "behind the destination host, as currently served.",
  },
  {
    term: "Safety checks",
    lead: "spoo.me's abuse blocklist and Google Web Risk,",
    rest: "with the result stated plainly, and links to VirusTotal, Safe Browsing, and the Wayback Machine for second opinions.",
  },
]

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
    q: "Why does domain age matter?",
    a: "Phishing domains are usually registered days before the campaign and thrown away after. An established registration date doesn't prove a site is safe, but a domain registered last week pretending to be your bank is a strong tell. The records panel shows the age whenever the registry answers.",
  },
  {
    q: "Do you store the links I expand?",
    a: "Results are cached briefly on our servers so repeat checks of the same link are instant, and domain records for about a day. Nothing is published, and nothing is tied to you.",
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
            <div className="mx-auto max-w-3xl px-5 py-20 sm:px-9 sm:py-24">
              <h2 className="font-semibold text-3xl text-foreground tracking-tight">
                What the expander{" "}
                <span className="font-normal font-serif text-muted-foreground italic">
                  shows.
                </span>
              </h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                One paste unrolls the link and pulls the public records of
                wherever it lands.
              </p>
              <dl className="mt-10 grid gap-x-10 gap-y-7 sm:grid-cols-2">
                {ABOUT.map((item) => (
                  <div key={item.term}>
                    <dt className="label-mono text-muted-foreground">
                      {item.term}
                    </dt>
                    <dd className="mt-1.5 text-muted-foreground text-sm leading-relaxed">
                      <span className="text-foreground">{item.lead}</span>{" "}
                      {item.rest}
                    </dd>
                  </div>
                ))}
              </dl>
              <h3 className="mt-14 font-semibold text-foreground text-xl tracking-tight">
                How it works
              </h3>
              <ol className="mt-4 max-w-2xl list-decimal space-y-3 pl-5 text-muted-foreground text-sm leading-relaxed">
                <li>
                  Paste any short link. Plain http is fine, and so are chains
                  that pass through several shorteners on the way.
                </li>
                <li>
                  Our server follows the redirects hop by hop, reading only
                  status codes and Location headers. Nothing loads in your
                  browser and no page content is fetched.
                </li>
                <li>
                  You get the full chain, the destination's own preview, the
                  domain's public records from the registry's RDAP server, the
                  DNS, and its TLS handshake, and the safety checks, all before
                  you decide to click.
                </li>
              </ol>

              <h3 className="mt-14 font-semibold text-foreground text-xl tracking-tight">
                Unshorten a link before you click it
              </h3>
              <p className="mt-4 max-w-2xl text-muted-foreground text-sm leading-relaxed">
                A short link hides its destination by design. The same
                bit.ly-style code can lead to an article, an affiliate wrapper,
                or a login page that isn't your bank's. Unshortening it first
                shows the real URL, who registered the domain, and how old it
                is, so the decision to open it is made with the facts in hand
                instead of after the page has already loaded.
              </p>

              <h3 className="mt-14 font-semibold text-foreground text-xl tracking-tight">
                One tool, several names
              </h3>
              <p className="mt-4 max-w-2xl text-muted-foreground text-sm leading-relaxed">
                URL expander, link unshortener, redirect checker, redirect
                tracer: different searches, the same job. This page does all of
                it in one pass. It expands the short URL, traces every redirect
                in the chain with its status code, and pulls the destination's
                records so a safety read is possible without visiting anything.
              </p>

              <h3 className="mt-14 font-semibold text-foreground text-xl tracking-tight">
                When to reach for it
              </h3>
              <ul className="mt-4 max-w-2xl list-disc space-y-3 pl-5 text-muted-foreground text-sm leading-relaxed">
                <li>
                  A link from an email or SMS you didn't expect, before it gets
                  a click.
                </li>
                <li>
                  Investigating a suspicious or phishing link without ever
                  loading it.
                </li>
                <li>
                  Redirect audits during SEO work, where a stray 302 or a long
                  chain of hops quietly leaks ranking signal.
                </li>
                <li>
                  Unwrapping t.co, lnkd.in, or amzn.to wrappers to see the real
                  article or product page.
                </li>
              </ul>

              <p className="mt-14 max-w-2xl text-muted-foreground text-sm leading-relaxed">
                Checking how your own page unfurls instead? That's the{" "}
                <Link
                  href="/tools/link-preview"
                  className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
                >
                  link preview checker
                </Link>
                . Putting a link on something printed? The{" "}
                <Link
                  href="/tools/qr-code"
                  className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
                >
                  QR code generator
                </Link>{" "}
                encodes any link, and a shortened one counts its scans.
              </p>
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
