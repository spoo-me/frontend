import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageFrame, Section } from "@/components/shared/section-shell"
import { Button } from "@/components/ui/button"
import { ToolFaq } from "@/components/tools/faq"
import { QrGenerator } from "@/components/tools/qr-code"
import { tools } from "@/lib/tools-data"
import { socialCard } from "@/lib/og"

const tool = tools.find((t) => t.slug === "qr-code")!

export const metadata: Metadata = {
  title: tool.seoTitle,
  description: tool.description,
  ...socialCard({
    title: tool.seoTitle,
    description: tool.description,
    image: "/og/tools/qr-code.jpg",
    alt: "spoo.me QR code generator",
  }),
}

const DETAILS = [
  {
    term: "Instant rendering",
    lead: "Codes are generated in your browser",
    rest: "as you type. Nothing is uploaded anywhere.",
  },
  {
    term: "SVG and PNG exports",
    lead: "Vector SVG for designers,",
    rest: "1024 pixel PNG for everything else, quiet zone included.",
  },
  {
    term: "Error correction H",
    lead: "The highest correction level,",
    rest: "so the center mark and a scuffed print never break a scan.",
  },
  {
    term: "Styles and inks",
    lead: "Three dot styles and any ink color,",
    rest: "with a guard that keeps every choice scannable.",
  },
]

const FAQ = [
  {
    q: "Do QR codes expire?",
    a: "The code itself never expires; it's just the URL drawn as pixels. What can die is the link inside it. Encoding a short link avoids reprints: you can change where it points later without touching the printed code.",
  },
  {
    q: "Can I track how many people scan my QR code?",
    a: "Yes, by encoding a short link. Shorten the URL here first and every scan lands on the spoo.me link, which counts it on a live stats page with countries and devices.",
  },
  {
    q: "Does the logo in the middle break scanning?",
    a: "No. QR codes carry error correction, so a small center mark is well within what scanners tolerate. Keep contrast high and don't shrink the code to a thumbnail.",
  },
]

export default function QrCodePage() {
  return (
    <>
      <Header />
      <main className="overflow-x-clip pt-20">
        <PageFrame>
          <Section>
            <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl flex-col justify-center px-5 py-16 text-center sm:px-9">
              <h1 className="text-balance font-semibold text-4xl text-foreground tracking-tight sm:text-5xl">
                QR code generator
              </h1>
              <p className="mt-4 text-balance text-lg text-muted-foreground">
                Custom QR codes for any link, rendered live as you type and
                ready for print.
              </p>
              <div className="mt-10 text-left">
                <QrGenerator />
              </div>
            </div>
          </Section>

          <Section>
            <div className="mx-auto max-w-3xl px-5 py-20 sm:px-9 sm:py-24">
              <h2 className="font-semibold text-3xl text-foreground tracking-tight">
                What is a QR code?
              </h2>
              <p className="mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
                A QR code is a link drawn as a grid of pixels that phone cameras
                can read. Point a camera at it and the page opens, no typing.
                That makes it the bridge between anything physical, a poster, a
                menu, a business card, and a page on the web.
              </p>
              <h3 className="mt-14 font-semibold text-foreground text-xl tracking-tight">
                Why it matters
              </h3>
              <p className="mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
                The catch is that print is permanent. Whatever URL the code
                carries when it goes to the printer is what it opens forever,
                and a code that's too small, too pale, or missing its border
                simply won't scan. This page handles those details for you and
                renders the code live as you type.
              </p>

              <h3 className="mt-14 font-semibold text-foreground text-xl tracking-tight">
                Made for print
              </h3>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Codes render in your browser, instantly, and export at print
                quality.
              </p>
              <dl className="mt-10 grid gap-x-10 gap-y-7 sm:grid-cols-2">
                {DETAILS.map((item) => (
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
                Why encode a short link
              </h3>
              <p className="mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
                A QR code is just a URL drawn as pixels, and pixels on paper
                can't be edited. Encode the destination directly and a typo, a
                moved page, or a dead campaign means reprinting everything.
                Encode a spoo.me short link instead and the printed code never
                changes: you change where it points, and every scan is counted
                on the link's stats page with countries and devices. Tag the
                destination first with the{" "}
                <Link
                  href="/tools/utm-builder"
                  className="text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground"
                >
                  UTM builder
                </Link>{" "}
                and your analytics will attribute the scans too.
              </p>

              <h3 className="mt-14 font-semibold text-foreground text-xl tracking-tight">
                Print notes
              </h3>
              <p className="mt-4 max-w-2xl text-base text-muted-foreground leading-relaxed">
                Keep the code dark on a light background: cameras want at least
                4 to 1 contrast, and the custom color picker here warns and
                offers to darken anything below it. Print at 2 by 2 cm or larger
                for close-range scanning, and don't worry about the white
                border: the exports bake the full quiet zone in, so the file
                scans even when pasted edge to edge.
              </p>
            </div>
          </Section>

          <Section>
            <ToolFaq
              items={FAQ}
              intro="Short answers about QR codes, scanning, and tracking."
            />
          </Section>

          <Section>
            <div className="mx-auto max-w-2xl px-5 py-20 text-center sm:px-9">
              <h2 className="text-balance font-semibold text-3xl text-foreground tracking-tight sm:text-4xl">
                Print it once. Change it{" "}
                <span className="font-normal font-serif text-muted-foreground italic">
                  anytime.
                </span>
              </h2>
              <p className="mt-4 text-muted-foreground">
                A QR around a spoo.me link keeps working after you change the
                destination, and every scan shows up in your stats.
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
