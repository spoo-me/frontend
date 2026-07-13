import type { Metadata } from "next"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageFrame, Section } from "@/components/shared/section-shell"
import { StatsLookup } from "@/components/stats-public/lookup"

/**
 * Lookup entry for /stats/{code} — the Next replacement for the Jinja
 * /stats form page. GET only: POST /stats (legacy form handler) and
 * POST /stats/{code} (legacy public JSON API) stay on FastAPI, split
 * by a method-scoped Caddy matcher.
 */

export const metadata: Metadata = {
  title: "Link stats lookup",
  description:
    "Look up click analytics for any spoo.me short link: clicks over time, countries, referrers, browsers and platforms.",
}

export default function StatsLookupPage() {
  return (
    <>
      <Header />
      <main className="overflow-hidden pt-20">
        <PageFrame>
          <Section caption="Link stats">
            <div className="flex flex-col items-center px-5 pt-28 pb-32 text-center sm:px-9">
              <h1 className="max-w-2xl text-balance font-semibold text-4xl text-foreground tracking-tight sm:text-5xl">
                Stats for{" "}
                <span className="font-normal font-serif text-muted-foreground italic">
                  any short link.
                </span>
              </h1>
              <p className="mt-5 max-w-md text-base text-muted-foreground leading-relaxed sm:text-lg">
                Paste a spoo.me link or its code: clicks over time, countries,
                referrers, browsers and platforms, wherever the owner keeps
                stats public.
              </p>

              <div className="mt-10 w-full max-w-md">
                <StatsLookup />
              </div>
            </div>
          </Section>
        </PageFrame>
      </main>
      <Footer />
    </>
  )
}
