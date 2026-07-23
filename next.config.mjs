// Backend origin the auth/API proxy points at. Local dev = the compose
// server on :8000; override with SPOO_API_URL (e.g. in prod deploys).
const SPOO_API_URL =
  process.env.SPOO_API_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://spoo.me"
    : "http://localhost:8000")

// Walkthrough mode (npm run dev:mock): the proxy targets the in-repo mock
// handlers instead of the FastAPI backend — no backend needed to click
// through signup → onboarding → dashboard.
const MOCK = process.env.SPOO_MOCK === "1"

// PostHog reverse proxy (EU region) — same-origin so events stay first-party
// and clear ad-block hostlists. Bland path on purpose: /analytics, /posthog
// and /ingest are all widely blocklisted. Harmless without a key configured
// (nothing client-side ever calls /relay then).
const POSTHOG_REWRITES = [
  {
    source: "/relay/static/:path*",
    destination: "https://eu-assets.i.posthog.com/static/:path*",
  },
  {
    source: "/relay/array/:path*",
    destination: "https://eu-assets.i.posthog.com/array/:path*",
  },
  { source: "/relay/:path*", destination: "https://eu.i.posthog.com/:path*" },
]

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keeps the dev badge out of recorded demo takes (scripts/record-demos.mjs).
  devIndicators: false,
  // Self-contained server bundle for the Docker image — runtime needs only
  // .next/standalone + .next/static + public, no node_modules install.
  output: "standalone",
  turbopack: {
    root: import.meta.dirname,
  },
  // Separate build dir so dev and dev:mock can run side by side.
  distDir: MOCK ? ".next-mock" : ".next",
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // PostHog API paths break under Next's trailing-slash redirect.
  skipTrailingSlashRedirect: true,
  // Don't advertise the framework (Caddy strips Server the same way).
  poweredByHeader: false,
  // public/ files ship with Next's default max-age=0, so Cloudflare never
  // edge-caches them and every asset request rides to the origin. These are
  // un-hashed filenames — a day of freshness + a week of SWR, not immutable.
  // (CF only auto-caches known static extensions; /geo/*.json additionally
  // needs a CF Cache Rule to become eligible at the edge.)
  async headers() {
    const STATIC_ASSET_CACHE = [
      {
        key: "Cache-Control",
        value: "public, max-age=86400, stale-while-revalidate=604800",
      },
    ]
    return [
      {
        source: "/:all*(svg|png|jpg|jpeg|webp|avif|ico)",
        headers: STATIC_ASSET_CACHE,
      },
      { source: "/geo/:path*", headers: STATIC_ASSET_CACHE },
    ]
  },
  async rewrites() {
    // Caddy composes backend errors as /_error/{status}?from&code — but a
    // literal app/_error folder is a PRIVATE folder to the App Router
    // (underscore prefix never routes), so the public URL rewrites to a
    // routable internal segment instead.
    const ERROR_REWRITE = {
      source: "/_error/:status",
      destination: "/error-pages/:status",
    }
    // The link preview page lives at the exact public URL /{code}+ — a
    // trailing + can't be a route segment, so it rewrites to an internal
    // page. Single decoded segment only; emoji aliases arrive
    // percent-encoded and match too.
    const PREVIEW_REWRITE = {
      source: "/:code\\+",
      destination: "/preview/:code",
    }
    // RFC 9116 canonical home is /.well-known/security.txt; the bare root
    // path is the legacy location scanners still probe.
    const SECURITY_TXT_REWRITE = {
      source: "/security.txt",
      destination: "/.well-known/security.txt",
    }
    if (MOCK) {
      return [
        ERROR_REWRITE,
        PREVIEW_REWRITE,
        SECURITY_TXT_REWRITE,
        { source: "/auth/:path*", destination: "/api/mock/auth/:path*" },
        { source: "/oauth/:path*", destination: "/api/mock/oauth/:path*" },
        { source: "/api/v1/:path*", destination: "/api/mock/v1/:path*" },
        // Anonymous shorten (legacy POST / on the backend root)
        { source: "/shorten", destination: "/api/mock/shorten" },
        ...POSTHOG_REWRITES,
      ]
    }
    // Same-origin proxy to the FastAPI backend: keeps the HttpOnly auth
    // cookies first-party and sidesteps CORS entirely (the backend's
    // private CORS policy doesn't need to know about this origin).
    return [
      ERROR_REWRITE,
      PREVIEW_REWRITE,
      SECURITY_TXT_REWRITE,
      { source: "/auth/:path*", destination: `${SPOO_API_URL}/auth/:path*` },
      { source: "/oauth/:path*", destination: `${SPOO_API_URL}/oauth/:path*` },
      // Anonymous shorten (legacy POST / on the backend root)
      { source: "/shorten", destination: `${SPOO_API_URL}/` },
      {
        source: "/api/v1/:path*",
        destination: `${SPOO_API_URL}/api/v1/:path*`,
      },
      ...POSTHOG_REWRITES,
    ]
  },
}

export default nextConfig
