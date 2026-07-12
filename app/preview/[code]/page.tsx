import type { Metadata } from "next"

import { SpooApiError } from "@/lib/api/client"
import { apiBase } from "@/lib/api/server"
import { getPublicPreview, type PublicPreview } from "@/lib/api/public-preview"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageFrame, Section } from "@/components/shared/section-shell"
import { PreviewView } from "@/components/preview/preview-view"
import { PreviewMissing, PreviewUnavailable } from "@/components/preview/states"

/**
 * Link preview — the Next replacement for the Jinja /{code}+ page
 * (thoughts/link-preview-page.md). The public URL stays exactly /{code}+;
 * next.config rewrites it here. Safety surface first: one SSR fetch,
 * status-agnostic (expired/blocked links still preview), destination
 * withheld for password-protected links.
 */

type Params = { params: Promise<{ code: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const code = decodeURIComponent((await params).code)
  return {
    title: `Preview of /${code}`,
    description: `See where the short link spoo.me/${code} really goes before you open it.`,
    // Matches the legacy preview's stance.
    robots: { index: false, follow: false },
  }
}

export default async function LinkPreviewPage({ params }: Params) {
  const code = decodeURIComponent((await params).code)

  let data: PublicPreview | null = null
  let state: "ok" | "missing" | "unavailable" = "ok"
  try {
    data = await getPublicPreview(code, await apiBase())
  } catch (err) {
    state =
      err instanceof SpooApiError && err.status === 404
        ? "missing"
        : "unavailable"
  }

  return (
    <>
      <Header />
      <main className="overflow-hidden pt-20">
        <PageFrame>
          <Section caption="Link preview">
            <div className="px-5 py-24 sm:px-9 sm:py-32">
              {state === "missing" ? (
                <PreviewMissing code={code} />
              ) : state === "unavailable" || !data ? (
                <PreviewUnavailable />
              ) : (
                <PreviewView data={data} />
              )}
            </div>
          </Section>
        </PageFrame>
      </main>
      <Footer />
    </>
  )
}
