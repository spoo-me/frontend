/**
 * Marker the build stamps onto every module that comes from this repo.
 *
 * `withSentryConfig` passes it to the Turbopack loader, which attaches it as
 * module metadata to each first-party module; the browser SDK then reads it
 * back off stack frames to tell our code apart from scripts that merely run
 * inside our pages (extensions, WebView bridges, injected analytics).
 *
 * Both sides must agree on the string, so it lives here rather than being
 * written out twice: a silent mismatch would make every frame look
 * third-party. Plain .mjs because next.config.mjs has to import it too.
 */
export const SENTRY_APPLICATION_KEY = "spoo-frontend"
