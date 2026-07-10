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
  async rewrites() {
    if (MOCK) {
      return [
        { source: "/auth/:path*", destination: "/api/mock/auth/:path*" },
        { source: "/oauth/:path*", destination: "/api/mock/oauth/:path*" },
        { source: "/api/v1/:path*", destination: "/api/mock/v1/:path*" },
        ...POSTHOG_REWRITES,
      ]
    }
    // Same-origin proxy to the FastAPI backend: keeps the HttpOnly auth
    // cookies first-party and sidesteps CORS entirely (the backend's
    // private CORS policy doesn't need to know about this origin).
    return [
      { source: "/auth/:path*", destination: `${SPOO_API_URL}/auth/:path*` },
      { source: "/oauth/:path*", destination: `${SPOO_API_URL}/oauth/:path*` },
      { source: "/api/v1/:path*", destination: `${SPOO_API_URL}/api/v1/:path*` },
      ...POSTHOG_REWRITES,
    ]
  },
}

export default nextConfig
