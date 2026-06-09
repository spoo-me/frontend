import Link from "next/link"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageFrame, Section } from "@/components/shared/section-shell"
import { legalDocs, type LegalDoc } from "@/lib/legal-content"
import { upcomingPolicies } from "@/lib/legal-meta"
import { cn } from "@/lib/utils"

export function LegalDocPage({ doc }: { doc: LegalDoc }) {
  return (
    <>
      <Header />
      {/* No overflow-hidden here — it would break the sticky sidebar */}
      <main className="pt-20">
        <PageFrame className="overflow-visible">
          <Section caption="Legal">
            <div className="lg:divide-border/60 grid lg:grid-cols-[17rem_1fr] lg:divide-x">
              {/* Doc switcher rail */}
              <aside className="hidden px-5 pt-20 sm:px-9 lg:block lg:px-8">
                <div className="sticky top-28">
                  <Link
                    href="/legal"
                    className="text-foreground hover:underline text-base font-semibold tracking-tight underline-offset-4"
                  >
                    Legal
                  </Link>
                  <nav aria-label="Legal documents" className="mt-6">
                    <ul className="flex flex-col gap-3.5">
                      {legalDocs.map((d) => (
                        <li key={d.slug}>
                          <Link
                            href={`/${d.slug}`}
                            aria-current={d.slug === doc.slug ? "page" : undefined}
                            className={cn(
                              "block text-sm leading-snug transition-colors",
                              d.slug === doc.slug
                                ? "text-foreground font-medium"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {d.title}
                          </Link>
                        </li>
                      ))}
                      {upcomingPolicies.map((title) => (
                        <li key={title}>
                          <span className="text-muted-foreground/40 block cursor-default text-sm leading-snug">
                            {title}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              </aside>

              {/* Document */}
              <article className="px-5 pt-20 pb-28 sm:px-9 lg:px-14">
                <nav aria-label="Breadcrumb" className="lg:hidden">
                  <Link
                    href="/legal"
                    className="text-muted-foreground hover:text-foreground text-xs font-medium transition-colors"
                  >
                    ← All legal
                  </Link>
                </nav>
                <header className="mt-6 max-w-3xl lg:mt-0">
                  <h1 className="text-foreground text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
                    {doc.title}
                  </h1>
                  <p className="text-muted-foreground mt-8 text-base">
                    <span className="text-foreground font-medium">Last updated:</span>{" "}
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
