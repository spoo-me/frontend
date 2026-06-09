import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageFrame, Section } from "@/components/shared/section-shell"
import { SectionHeading } from "@/components/shared/section-heading"
import { legalDocs } from "@/lib/legal-content"
import { siteConfig } from "@/lib/site-config"

export const metadata: Metadata = {
  title: "Legal",
  description: "spoo.me legal documents: privacy policy, terms of service, and license.",
}

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
                    <span className="text-muted-foreground italic [font-family:var(--font-serif)] font-normal">
                      kept honest.
                    </span>
                  </>
                }
                description="Everything that governs your use of spoo.me. Short list, plain language where the law allows."
              />

              <div className="border-border/60 bg-border/60 shadow-card mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-px overflow-hidden rounded-2xl border sm:grid-cols-3 dark:shadow-none">
                {legalDocs.map((doc) => (
                  <Link
                    key={doc.slug}
                    href={`/${doc.slug}`}
                    className="group bg-background hover:bg-muted/20 flex flex-col gap-2 p-7 transition-colors duration-300 sm:p-8"
                  >
                    <h2 className="text-foreground text-lg font-semibold tracking-tight group-hover:underline underline-offset-4">
                      {doc.title}
                    </h2>
                    <p className="label-mono text-muted-foreground">
                      updated {doc.lastUpdated}
                    </p>
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                      {doc.description}
                    </p>
                  </Link>
                ))}
                <a
                  href={`${siteConfig.links.github}/blob/main/LICENSE`}
                  target="_blank"
                  rel="noreferrer"
                  className="group bg-background hover:bg-muted/20 flex flex-col gap-2 p-7 transition-colors duration-300 sm:p-8"
                >
                  <h2 className="text-foreground inline-flex items-center gap-1.5 text-lg font-semibold tracking-tight group-hover:underline underline-offset-4">
                    License
                    <ArrowUpRight className="text-muted-foreground size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </h2>
                  <p className="label-mono text-muted-foreground">apache 2.0</p>
                  <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                    The entire platform is open source. Read the license on GitHub.
                  </p>
                </a>
              </div>
            </div>
          </Section>
        </PageFrame>
      </main>
      <Footer />
    </>
  )
}
