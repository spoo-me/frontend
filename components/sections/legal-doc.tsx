import Link from "next/link"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageFrame, Section } from "@/components/shared/section-shell"
import { LegalSidebar } from "@/components/sections/legal-sidebar"
import { legalDocs, type LegalDoc } from "@/lib/legal-content"
import { upcomingPolicies } from "@/lib/legal-meta"

export function LegalDocPage({ doc }: { doc: LegalDoc }) {
  return (
    <>
      <Header />
      {/* No overflow-hidden here — it would break the sticky sidebar */}
      <main className="pt-20">
        <PageFrame className="overflow-visible">
          <Section caption="Legal">
            <div className="grid lg:grid-cols-[17rem_1fr] lg:divide-x lg:divide-border/60">
              {/* Doc switcher rail */}
              <aside className="hidden px-5 pt-20 sm:px-9 lg:block lg:px-8">
                <div className="sticky top-28">
                  <Link
                    href="/legal"
                    className="font-semibold text-base text-foreground tracking-tight underline-offset-4 hover:underline"
                  >
                    Legal
                  </Link>
                  <div className="mt-6">
                    <LegalSidebar
                      docs={legalDocs.map((d) => ({
                        slug: d.slug,
                        title: d.title,
                      }))}
                      upcoming={upcomingPolicies}
                      activeSlug={doc.slug}
                      toc={doc.toc}
                    />
                  </div>
                </div>
              </aside>

              {/* Document */}
              <article className="px-5 pt-20 pb-28 sm:px-9 lg:px-14">
                <nav aria-label="Breadcrumb" className="lg:hidden">
                  <Link
                    href="/legal"
                    className="font-medium text-muted-foreground text-xs transition-colors hover:text-foreground"
                  >
                    ← All legal
                  </Link>
                </nav>
                <header className="mt-6 max-w-3xl lg:mt-0">
                  <h1 className="text-balance font-semibold text-5xl text-foreground tracking-tight sm:text-6xl lg:text-7xl">
                    {doc.title}
                  </h1>
                  <p className="mt-8 text-base text-muted-foreground">
                    <span className="font-medium text-foreground">
                      Last updated:
                    </span>{" "}
                    {doc.lastUpdated}
                  </p>
                </header>
                <div
                  className="legal-prose mt-16 max-w-3xl"
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
