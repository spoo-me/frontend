import { NextResponse } from "next/server"

import {
  normalizeReportTarget,
  REPORT_DETAILS_MAX,
  REPORT_ITEM_CAP_ANON,
  REPORT_ITEM_CAP_AUTHED,
  REPORT_REASONS,
  REPORT_VECTORS,
  reportTargetKey,
} from "@/lib/api/reports"
import { PUBLIC_EXTRAS } from "./public-extras"
import { buildLinks } from "./seed"

/**
 * Mock for the report-intake + contact endpoints
 * (POST /api/v1/reports, POST /api/v1/contact —
 * thoughts/report-contact-intake-trd.md, the frozen contract the real
 * backend implements in parallel). Wire shapes byte-exact:
 *  - per-item accepted/rejected breakdown; bad codes don't sink the batch
 *  - status split mirrors the backend (spoo#242): DTO-shape errors (bad
 *    email, bad reason/vector enum, missing fields) are 422; semantic
 *    gates (empty items, over the cap, missing captcha token) are 400 —
 *    both with code "validation_error"
 *  - caps: 25 items anonymous, 100 authenticated
 *  - existence is domain-scoped against the same records the public
 *    surfaces resolve (seeded workspace + PUBLIC_EXTRAS)
 *  - captcha: the mock never fails a token EXCEPT the literal "fail" —
 *    the one testable 403 path (anonymous only; authed skips captcha)
 */

function fail(status: number, code: string, error: string, field?: string) {
  return NextResponse.json(
    { error, code, ...(field ? { field } : {}) },
    { status }
  )
}

const id = () => Math.random().toString(36).slice(2, 10)

/* Same permissive shape pydantic's EmailStr enforces — good enough for
   the walkthrough's happy/sad paths. */
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

const CONTACT_MESSAGE_MAX = 4000

export function handleContact(body: Record<string, unknown>): NextResponse {
  // The real backend 403s when hCaptcha verification rejects the token.
  // The mock accepts any token (and none — mirrors an unconfigured
  // sitekey) so the walkthrough works keyless; "fail" is the escape
  // hatch that makes the 403 path testable.
  if (body.captcha_token === "fail")
    return fail(403, "forbidden", "Invalid captcha, please try again")

  const email = body.email
  if (typeof email !== "string" || !EMAIL_RE.test(email))
    return fail(
      422,
      "validation_error",
      "email: value is not a valid email address",
      "email"
    )
  const message = body.message
  if (typeof message !== "string" || message.length < 1)
    return fail(
      422,
      "validation_error",
      "message: String should have at least 1 character",
      "message"
    )
  if (message.length > CONTACT_MESSAGE_MAX)
    return fail(
      422,
      "validation_error",
      `message: String should have at most ${CONTACT_MESSAGE_MAX} characters`,
      "message"
    )
  // contact_webhook is configured in the mock, so no 503 path here.
  return NextResponse.json({ ok: true })
}

/** Every (domain, code) the public surfaces can resolve — reports check
    existence against the same records, so the two can never disagree. */
function knownTargets(): Set<string> {
  const keys = new Set<string>()
  for (const link of buildLinks())
    keys.add(reportTargetKey({ domain: link.domain, code: link.alias }))
  for (const extra of PUBLIC_EXTRAS)
    keys.add(
      reportTargetKey({ domain: extra.link.domain, code: extra.link.alias })
    )
  return keys
}

const REASON_SET = new Set<string>(REPORT_REASONS)
const VECTOR_SET = new Set<string>(REPORT_VECTORS)

export function handleReports(
  body: Record<string, unknown>,
  authed: boolean
): NextResponse {
  // Anonymous submissions are captcha-gated; authenticated ones skip the
  // check entirely (TRD §2). Same mock semantics as contact: only the
  // literal "fail" fails.
  if (!authed && body.captcha_token === "fail")
    return fail(403, "forbidden", "Invalid captcha, please try again")

  const items = body.items
  if (!Array.isArray(items))
    return fail(
      422,
      "validation_error",
      "items: Input should be a valid list",
      "items"
    )
  if (items.length === 0)
    return fail(
      400,
      "validation_error",
      "items: List should have at least 1 item",
      "items"
    )
  const cap = authed ? REPORT_ITEM_CAP_AUTHED : REPORT_ITEM_CAP_ANON
  // Over-cap is a whole-request 400 — the client knows the cap, and a
  // partial accept would hide it.
  if (items.length > cap)
    return fail(
      400,
      "validation_error",
      `items: List should have at most ${cap} items`,
      "items"
    )

  // DTO-level validation fails the whole request at 422, like pydantic
  // does everywhere else in the API.
  for (const [i, raw] of items.entries()) {
    const item = (raw ?? {}) as Record<string, unknown>
    if (typeof item.code_or_url !== "string" || !item.code_or_url.trim())
      return fail(
        422,
        "validation_error",
        `items.${i}.code_or_url: Field required`,
        `items.${i}.code_or_url`
      )
    if (typeof item.reason !== "string" || !REASON_SET.has(item.reason))
      return fail(
        422,
        "validation_error",
        `items.${i}.reason: Input should be 'phishing', 'malware', 'spam', 'illegal_content' or 'other'`,
        `items.${i}.reason`
      )
    if (item.details != null) {
      if (typeof item.details !== "string")
        return fail(
          422,
          "validation_error",
          `items.${i}.details: Input should be a valid string`,
          `items.${i}.details`
        )
      if (item.details.length > REPORT_DETAILS_MAX)
        return fail(
          422,
          "validation_error",
          `items.${i}.details: String should have at most ${REPORT_DETAILS_MAX} characters`,
          `items.${i}.details`
        )
    }
    if (
      item.vector != null &&
      (typeof item.vector !== "string" || !VECTOR_SET.has(item.vector))
    )
      return fail(
        422,
        "validation_error",
        `items.${i}.vector: Input should be 'sms', 'email', 'dm', 'social', 'web' or 'other'`,
        `items.${i}.vector`
      )
  }
  if (body.reporter_email != null && body.reporter_email !== "") {
    if (
      typeof body.reporter_email !== "string" ||
      !EMAIL_RE.test(body.reporter_email)
    )
      return fail(
        422,
        "validation_error",
        "reporter_email: value is not a valid email address",
        "reporter_email"
      )
  }
  if (body.reporter_org != null && typeof body.reporter_org !== "string")
    return fail(
      422,
      "validation_error",
      "reporter_org: Input should be a valid string",
      "reporter_org"
    )

  // Per-item pipeline: normalize → within-batch dedupe (first occurrence
  // wins, whatever its own fate) → domain-scoped existence check.
  const known = knownTargets()
  const seen = new Set<string>()
  const rejected: Array<{
    index: number
    input: string
    code: "invalid_input" | "not_found" | "duplicate_in_batch"
  }> = []
  let accepted = 0

  items.forEach((raw, index) => {
    const input = String((raw as Record<string, unknown>).code_or_url)
    const target = normalizeReportTarget(input)
    if (!target) {
      rejected.push({ index, input, code: "invalid_input" })
      return
    }
    const key = reportTargetKey(target)
    if (seen.has(key)) {
      rejected.push({ index, input, code: "duplicate_in_batch" })
      return
    }
    seen.add(key)
    if (!known.has(key)) {
      rejected.push({ index, input, code: "not_found" })
      return
    }
    accepted += 1
  })

  // url_report_webhook is configured in the mock, so no 503 path here.
  return NextResponse.json({
    submission_id: `rsub_${id()}`,
    accepted,
    rejected,
  })
}
