import { describe, expect, it } from "vitest"

import {
  type BulkOperationResult,
  type BulkResultRow,
  BULK_MAX_IDS,
  chunkIds,
  mergeBulkResults,
  summarizeBulkFailures,
} from "./links"

const ok = (id: string): BulkResultRow => ({
  id,
  alias: id,
  ok: true,
  error_code: null,
  error: null,
})
const bad = (id: string, code: BulkResultRow["error_code"]): BulkResultRow => ({
  id,
  alias: null,
  ok: false,
  error_code: code,
  error: `${code} for ${id}`,
})
const part = (results: BulkResultRow[]): BulkOperationResult => ({
  results,
  // Deliberately wrong summary — mergeBulkResults must recompute from rows.
  summary: { total: -1, succeeded: -1, failed: -1 },
})

describe("chunkIds", () => {
  it("returns one chunk when within the cap", () => {
    expect(chunkIds(["a", "b", "c"])).toEqual([["a", "b", "c"]])
  })

  it("splits at the cap boundary, preserving order", () => {
    const ids = Array.from({ length: BULK_MAX_IDS + 5 }, (_, i) => `id${i}`)
    const chunks = chunkIds(ids)
    expect(chunks).toHaveLength(2)
    expect(chunks[0]).toHaveLength(BULK_MAX_IDS)
    expect(chunks[1]).toHaveLength(5)
    expect(chunks.flat()).toEqual(ids)
  })

  it("handles an empty selection", () => {
    expect(chunkIds([])).toEqual([])
  })

  it("respects a custom size", () => {
    expect(chunkIds(["a", "b", "c", "d", "e"], 2)).toEqual([
      ["a", "b"],
      ["c", "d"],
      ["e"],
    ])
  })
})

describe("mergeBulkResults", () => {
  it("concatenates rows and recomputes the summary from them", () => {
    const merged = mergeBulkResults([
      part([ok("1"), bad("2", "forbidden")]),
      part([ok("3"), ok("4"), bad("5", "not_found")]),
    ])
    expect(merged.results.map((r) => r.id)).toEqual(["1", "2", "3", "4", "5"])
    expect(merged.summary).toEqual({ total: 5, succeeded: 3, failed: 2 })
  })

  it("reports all-succeeded", () => {
    const merged = mergeBulkResults([part([ok("1"), ok("2")])])
    expect(merged.summary).toEqual({ total: 2, succeeded: 2, failed: 0 })
  })

  it("reports all-failed", () => {
    const merged = mergeBulkResults([
      part([bad("1", "internal"), bad("2", "conflict")]),
    ])
    expect(merged.summary).toEqual({ total: 2, succeeded: 0, failed: 2 })
  })

  it("returns an empty report for no parts", () => {
    expect(mergeBulkResults([])).toEqual({
      results: [],
      summary: { total: 0, succeeded: 0, failed: 0 },
    })
  })
})

describe("summarizeBulkFailures", () => {
  it("is empty when nothing failed", () => {
    expect(summarizeBulkFailures([ok("1"), ok("2")])).toBe("")
  })

  it("groups failures by cause with human labels", () => {
    const out = summarizeBulkFailures([
      ok("1"),
      bad("2", "forbidden"),
      bad("3", "forbidden"),
      bad("4", "conflict"),
    ])
    expect(out).toBe("2 blocked, 1 alias already taken")
  })

  it("falls back to a generic label for a missing code", () => {
    expect(summarizeBulkFailures([{ ...bad("1", null) }])).toBe("1 errored")
  })

  it("reads a domain-move report: no-op successes, conflicts, blocked", () => {
    // Shape a move-to-domain result: some links move, one alias already
    // exists on the target, one is admin-blocked.
    const report = mergeBulkResults([
      part([ok("1"), ok("2"), bad("3", "conflict"), bad("4", "forbidden")]),
    ])
    expect(report.summary).toEqual({ total: 4, succeeded: 2, failed: 2 })
    expect(summarizeBulkFailures(report.results)).toBe(
      "1 alias already taken, 1 blocked"
    )
  })
})
