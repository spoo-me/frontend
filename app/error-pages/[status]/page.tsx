import type { Metadata } from "next"

import { ErrorShell } from "@/components/errors/error-shell"
import { NotFoundBody } from "@/components/errors/not-found-body"
import {
  BlockedBody,
  GoneBody,
  RateLimitBody,
  ServerErrorBody,
} from "@/components/errors/bodies"

/**
 * Edge-composed error pages: Caddy intercepts FastAPI's error statuses and
 * rewrites here as /_error/{status}?from={uri}&code={X-Error-Code slug}.
 * Routing keys on
 * the slug first, then the status family, then fully generic — an unknown
 * slug from a future backend must never break the error page itself.
 * Directly reachable in dev; no Caddy needed to build against.
 */

type View = "404" | "410" | "451" | "429" | "5xx"

const SLUG_VIEWS: Record<string, View> = {
  not_found: "404",
  gone: "410",
  blocked: "451",
  rate_limit_exceeded: "429",
  internal_error: "5xx",
}

const STATUS_VIEWS: Record<string, View> = {
  "404": "404",
  "410": "410",
  "451": "451",
  "429": "429",
  "500": "5xx",
  "502": "5xx",
  "503": "5xx",
}

function resolveView(status: string, code?: string): View {
  if (code && SLUG_VIEWS[code]) return SLUG_VIEWS[code]
  if (STATUS_VIEWS[status]) return STATUS_VIEWS[status]
  return status.startsWith("5") ? "5xx" : "404"
}

const TITLES: Record<View, string> = {
  "404": "Page not found",
  "410": "This link ended",
  "451": "Link blocked",
  "429": "Slow down",
  "5xx": "Something went wrong",
}

type Params = {
  params: Promise<{ status: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({
  params,
  searchParams,
}: Params): Promise<Metadata> {
  const { status } = await params
  const sp = await searchParams
  const code = typeof sp.code === "string" ? sp.code : undefined
  return {
    title: TITLES[resolveView(status, code)],
    robots: { index: false, follow: false },
  }
}

export default async function ErrorPage({ params, searchParams }: Params) {
  const { status } = await params
  const sp = await searchParams
  const code = typeof sp.code === "string" ? sp.code : undefined
  const from = typeof sp.from === "string" ? sp.from : undefined
  const view = resolveView(status, code)

  return (
    <ErrorShell status={status} fisher={view === "404"}>
      {view === "404" ? (
        <NotFoundBody from={from} />
      ) : view === "410" ? (
        <GoneBody />
      ) : view === "451" ? (
        // Deliberately no `from` echo: user-controlled input stays off
        // the scam-awareness page entirely.
        <BlockedBody />
      ) : view === "429" ? (
        <RateLimitBody />
      ) : (
        <ServerErrorBody status={status} />
      )}
    </ErrorShell>
  )
}
