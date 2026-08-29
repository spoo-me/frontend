import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageFrame, Section } from "@/components/shared/section-shell"
import { tools } from "@/lib/tools-data"
import {
  ExpanderDemo,
  PreviewDemo,
  QrDemo,
  UtmDemo,
} from "@/components/tools/hub-demos"
import { socialCard } from "@/lib/og"

const TITLE = "Free link tools"
const DESCRIPTION =
  "Small, fast tools for working with links: build UTM links, check social previews, expand short URLs, and generate QR codes. No account needed."

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  ...socialCard({
    title: TITLE,
    description: DESCRIPTION,
    image: "/og/tools/hub.jpg",
    alt: "spoo.me link tools",
  }),
}

const DEMOS: Record<string, React.ReactNode> = {
  "utm-builder": <UtmDemo />,
  "link-preview": <PreviewDemo />,
  "url-expander": <ExpanderDemo />,
  "qr-code": <QrDemo />,
}

export default function ToolsPage() {
  return (
    <>
      <Header />
      <main className="overflow-hidden pt-20">
        <PageFrame>
          <Section caption="Free tools">
            <div className="px-5 pt-24 pb-16 sm:px-9 sm:pt-28">
              <h1 className="text-balance font-semibold text-4xl text-foreground tracking-tight sm:text-5xl">
                Tools for{" "}
                <span className="font-normal font-serif text-muted-foreground italic">
                  working with links.
                </span>
              </h1>
              <p className="mt-4 max-w-xl text-lg text-muted-foreground">
                Each one works without an account. The links they make come with
                live stats.
              </p>

              <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 sm:grid-cols-2">
                {tools.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/tools/${t.slug}`}
                    className="group flex flex-col bg-background transition-colors duration-300 hover:bg-muted/20"
                  >
                    <div className="p-7 pb-0 sm:p-8 sm:pb-0">
                      <span className="flex items-center gap-1.5 font-semibold text-foreground text-lg tracking-tight">
                        {t.name}
                        <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </span>
                      <span className="mt-1.5 block text-muted-foreground text-sm">
                        {t.blurb}
                      </span>
                    </div>
                    <div className="pointer-events-none mt-auto flex h-48 select-none items-center justify-center px-8 pt-6 pb-8">
                      {DEMOS[t.slug]}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </Section>
        </PageFrame>
      </main>
      <Footer />
    </>
  )
}
