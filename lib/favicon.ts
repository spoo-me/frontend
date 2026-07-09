/**
 * Same-origin favicon proxy (see app/api/favicon/route.ts): real favicons
 * stream through, missing ones become a bodyless 404 so `<img>` onError
 * fires and the UI can draw its own crisp fallback instead of Google's
 * blurry 16px globe.
 */
export const faviconUrl = (domain: string, size = 64) =>
  `/api/favicon?domain=${encodeURIComponent(domain)}&size=${size}`
