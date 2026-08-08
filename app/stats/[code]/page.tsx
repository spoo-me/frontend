import type { Metadata } from "next"

import { SpooApiError } from "@/lib/api/client"
import { apiBase } from "@/lib/api/server"
import { getPublicStats, type PublicStats } from "@/lib/api/public-stats"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageFrame, Section } from "@/components/shared/section-shell"
import { PublicStatsView } from "@/components/stats-public/stats-view"
import { StatsManagePitch } from "@/components/stats-public/manage-pitch"
import {
  StatsMissing,
  StatsUnavailable,
} from "@/components/stats-public/states"

/**
 * Public per-link stats — the Next replacement for the Jinja /stats/{code}
 * page. SSR-first: the default-range payload is one fetch, resolved
 * here; range changes and the password flow happen
 * client-side against the same endpoint. Bare /stats stays on FastAPI.
 */

type Params = { params: Promise<{ code: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const code = decodeURIComponent((await params).code)
  return {
    title: `Link stats for /${code}`,
    description: `Click analytics for the spoo.me short link /${code}: clicks over time, countries, referrers, browsers and platforms.`,
    // Millions of thin pages; OG stays for link sharing, the index doesn't.
    robots: { index: false, follow: true },
  }
}

export default async function PublicStatsPage({ params }: Params) {
  const code = decodeURIComponent((await params).code)

  let initial: PublicStats | null = null
  let state: "ok" | "gated" | "missing" | "unavailable" = "ok"
  try {
    initial = await getPublicStats(code, {}, await apiBase())
  } catch (err) {
    state =
      err instanceof SpooApiError
        ? err.code === "password_required"
          ? "gated"
          : err.status === 404
            ? "missing"
            : "unavailable"
        : "unavailable"
  }

  return (
    <>
      <Header />
      <main className="overflow-hidden pt-20">
        <PageFrame>
          <Section caption="Link stats">
            <div className="px-5 py-16 sm:px-9 sm:py-20">
              {state === "missing" ? (
                <StatsMissing code={code} />
              ) : state === "unavailable" ? (
                <StatsUnavailable />
              ) : (
                <>
                  <PublicStatsView
                    code={code}
                    initial={initial}
                    gated={state === "gated"}
                  />
                  <StatsManagePitch />
                </>
              )}
            </div>
          </Section>
        </PageFrame>
      </main>
      <Footer />
    </>
  )
}
