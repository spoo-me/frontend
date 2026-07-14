// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Controllable checkAlias: each call parks a resolver keyed by alias so the
// test can decide the resolution ORDER.
const { resolvers } = vi.hoisted(() => ({
  resolvers: new Map<
    string,
    (v: { available: boolean; reason: string | null }) => void
  >(),
}))

vi.mock("@/lib/api", () => ({
  checkAlias: (alias: string) =>
    new Promise((resolve) => {
      resolvers.set(alias, resolve)
    }),
}))

import { useAliasCheck } from "./use-alias-check"

const DEBOUNCE_MS = 350

describe("useAliasCheck stale-response race", () => {
  beforeEach(() => {
    resolvers.clear()
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("a stale older response landing LAST does not wedge the spinner", async () => {
    const { result, rerender } = renderHook(
      ({ alias }) => useAliasCheck({ alias }),
      { initialProps: { alias: "aaa" } }
    )

    // Fire the request for "aaa" (debounce elapses; request is now in flight).
    await act(async () => {
      vi.advanceTimersByTime(DEBOUNCE_MS)
    })

    // Input changes to "bbb"; its request fires too. "aaa" is still in flight.
    rerender({ alias: "bbb" })
    await act(async () => {
      vi.advanceTimersByTime(DEBOUNCE_MS)
    })

    expect(resolvers.has("aaa")).toBe(true)
    expect(resolvers.has("bbb")).toBe(true)

    // Fresh response (bbb) lands first...
    await act(async () => {
      resolvers.get("bbb")?.({ available: true, reason: null })
    })
    // ...then the STALE older response (aaa) lands last.
    await act(async () => {
      resolvers.get("aaa")?.({ available: false, reason: "taken" })
    })

    // Must reflect bbb (available) and never be stuck "checking".
    expect(result.current.state).toBe("available")
  })
})
