import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { SENTRY_APPLICATION_KEY } from "./sentry.application-key.mjs"

/**
 * The filter in instrumentation-client.ts is only meaningful while the build
 * actually stamps our bundle. Unwire `applicationKey` and nothing breaks
 * loudly: the client keeps filtering, every frame now looks third-party, and
 * once the behaviour is switched from tagging to dropping that silently
 * throws away every browser error we have.
 *
 * These assert the source rather than the exported config because
 * withSentryConfig consumes `applicationKey` internally and does not put it
 * on the object it returns, and the Turbopack loader rule it produces is not
 * attached until the build itself runs. Both halves reading the same
 * constant is the property worth pinning, so read the two files and check.
 */
describe("sentry application key", () => {
  it("is a non-empty string", () => {
    expect(SENTRY_APPLICATION_KEY).toBeTruthy()
    expect(typeof SENTRY_APPLICATION_KEY).toBe("string")
  })

  it("is handed to the build so first-party modules get stamped", () => {
    const config = readFileSync("next.config.mjs", "utf8")

    expect(config).toContain(
      'import { SENTRY_APPLICATION_KEY } from "./sentry.application-key.mjs"'
    )
    expect(config).toMatch(/applicationKey:\s*SENTRY_APPLICATION_KEY/)
  })

  it("is the same key the browser filter matches against", () => {
    const client = readFileSync("instrumentation-client.ts", "utf8")

    expect(client).toContain(
      'import { SENTRY_APPLICATION_KEY } from "./sentry.application-key.mjs"'
    )
    expect(client).toMatch(/filterKeys:\s*\[SENTRY_APPLICATION_KEY\]/)
  })
})
