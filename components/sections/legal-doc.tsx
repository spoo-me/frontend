import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageFrame, Section } from "@/components/shared/section-shell"
import { LegalToc } from "@/components/sections/legal-toc"
import type { LegalDoc } from "@/lib/legal-content"

export function LegalDocPage({ doc }: { doc: LegalDoc }) {
  return (
    <>
      <Header />
      {/* No overflow-hidden here — it would break the sticky TOC */}
      <main className="pt-20">
        <PageFrame className="overflow-visible">
          <Section caption="Legal">
            <div className="lg:divide-border/60 grid lg:grid-cols-[17rem_1fr] lg:divide-x">
              {/* TOC rail */}
              <aside className="hidden px-5 pt-14 sm:px-9 lg:block lg:px-7">
                <div className="sticky top-24">
                  <Link
                    href="/legal"
                    className="text-muted-foreground hover:text-foreground group inline-flex items-center gap-1.5 text-xs font-medium transition-colors"
                  >
                    <ArrowLeft className="size-3 transition-transform group-hover:-translate-x-0.5" />
                    All legal
                  </Link>
                  <div className="label-mono text-muted-foreground/70 mt-8 mb-3">
                    On this page
                  </div>
                  <LegalToc toc={doc.toc} />
                </div>
              </aside>

              {/* Document */}
              <article className="px-5 pt-14 pb-24 sm:px-9">
                <Link
                  href="/legal"
                  className="text-muted-foreground hover:text-foreground group inline-flex items-center gap-1.5 text-xs font-medium transition-colors lg:hidden"
                >
                  <ArrowLeft className="size-3" />
                  All legal
                </Link>
                <header className="mt-6 max-w-2xl lg:mt-0">
                  <h1 className="text-foreground text-4xl font-semibold tracking-tight sm:text-5xl">
                    {doc.title}
                  </h1>
                  <p className="label-mono text-muted-foreground mt-3">
                    last updated {doc.lastUpdated}
                  </p>
                </header>
                <div
                  className="legal-prose mt-10 max-w-2xl"
                  dangerouslySetInnerHTML={{ __html: doc.html }}
                />
              </article>
            </div>
          </Section>
        </PageFrame>
      </main>
      <Footer />
    </>
  )
}
