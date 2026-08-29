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
                Classic and gradient QR codes for any link, rendered live as you
                type.
              </p>
              <div className="mt-10 text-left">
                <QrGenerator />
              </div>
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
