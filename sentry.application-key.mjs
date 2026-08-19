/**
 * Marker the build stamps onto every module in our bundle.
 *
 * `withSentryConfig` passes it to the Turbopack loader, which attaches it as
 * module metadata; the browser SDK then reads it back off stack frames to
 * tell code we ship apart from scripts that merely run inside our pages
 * (extensions, WebView bridges, injected analytics).
 *
 * "In our bundle" is literal, and includes node_modules: the loader rule
 * carries no `not: "foreign"` condition, so a bundled dependency is stamped
 * too. That is the behaviour we want, since we ship those bytes. Only
 * scripts we never bundled can lack the key.
 *
 * Both sides must agree on the string, so it lives here rather than being
 * written out twice: a silent mismatch would make every frame look
 * third-party. Plain .mjs because next.config.mjs has to import it too.
 */
export const SENTRY_APPLICATION_KEY = "spoo-frontend"
