// Backend origin the auth/API proxy points at. Local dev = the compose
// server on :8000; override with SPOO_API_URL (e.g. in prod deploys).
const SPOO_API_URL =
  process.env.SPOO_API_URL ??
  (process.env.NODE_ENV === "production"
    ? "https://spoo.me"
    : "http://localhost:8000")

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async rewrites() {
    // Same-origin proxy to the FastAPI backend: keeps the HttpOnly auth
    // cookies first-party and sidesteps CORS entirely (the backend's
    // private CORS policy doesn't need to know about this origin).
    return [
      { source: "/auth/:path*", destination: `${SPOO_API_URL}/auth/:path*` },
      { source: "/oauth/:path*", destination: `${SPOO_API_URL}/oauth/:path*` },
      { source: "/api/v1/:path*", destination: `${SPOO_API_URL}/api/v1/:path*` },
    ]
  },
}

export default nextConfig
