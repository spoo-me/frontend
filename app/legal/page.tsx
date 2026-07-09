import type { Metadata } from "next"
import Link from "next/link"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageFrame, Section } from "@/components/shared/section-shell"
import { SectionHeading } from "@/components/shared/section-heading"
import { legalDocs } from "@/lib/legal-content"
import { upcomingPolicies } from "@/lib/legal-meta"

export const metadata: Metadata = {
  title: "Legal",
  description: "spoo.me legal documents and policies.",
}

const live = legalDocs.map((d) => ({
  title: d.title,
  meta: `updated ${d.lastUpdated}`,
  href: `/${d.slug}`,
}))

const placeholders = upcomingPolicies.map((title) => ({
  title,
  meta: "coming soon",
  href: null,
}))

// Alphabetical, like a real policy index
const entries = [...live, ...placeholders].sort((a, b) =>
  a.title.localeCompare(b.title),
)

export default function LegalIndexPage() {
  return (
    <>
      <Header />
      <main className="overflow-hidden pt-20">
        <PageFrame>
          <Section caption="Legal">
            <div className="px-5 pt-24 pb-24 sm:px-9">
              <SectionHeading
                title={
                  <>
                    The paperwork,{" "}
                    <span className="text-muted-foreground italic font-serif font-normal">
                      kept honest.
                    </span>
                  </>
                }
                description="Everything that governs your use of spoo.me, in one place."
              />

              <div className="border-border/60 bg-border/60 shadow-card mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-px overflow-hidden rounded-2xl border sm:grid-cols-2 lg:grid-cols-3 dark:shadow-none">
                {entries.map((entry) =>
                  entry.href ? (
                    <Link
                      key={entry.title}
                      href={entry.href}
                      className="group bg-background hover:bg-muted/20 flex flex-col gap-2 p-7 transition-colors duration-300 sm:p-8"
                    >
                      <h2 className="text-foreground text-base font-semibold tracking-tight underline-offset-4 group-hover:underline">
                        {entry.title}
                      </h2>
                      <p className="label-mono text-muted-foreground">{entry.meta}</p>
                    </Link>
                  ) : (
                    <div
                      key={entry.title}
                      className="bg-background flex flex-col gap-2 p-7 sm:p-8"
                      aria-disabled
                    >
                      <h2 className="text-muted-foreground text-base font-semibold tracking-tight">
                        {entry.title}
                      </h2>
                      <p className="label-mono text-muted-foreground/50">{entry.meta}</p>
                    </div>
                  ),
                )}
              </div>
            </div>
          </Section>
        </PageFrame>
      </main>
      <Footer />
    </>
  )
}
