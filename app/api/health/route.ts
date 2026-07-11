// Liveness probe for the docker healthcheck (and nothing else) — no
// backend dependency, so a dead FastAPI never cascades into Next restarts.
export const dynamic = "force-dynamic"

export function GET() {
  return new Response("ok", {
    headers: { "cache-control": "no-store" },
  })
}
