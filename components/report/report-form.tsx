"use client"

import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { Check, Flag } from "lucide-react"

import { useCaptcha } from "@/hooks/use-captcha"
import { trackUiAction } from "@/lib/analytics"
import {
  type IntakeErrorCopy,
  intakeErrorText,
  REPORT_DETAILS_MAX,
  REPORT_ITEM_CAP_ANON,
  REPORT_ITEM_CAP_AUTHED,
  type ReportItemInput,
  type ReportReason,
  type ReportRejectionCode,
  type ReportVector,
  submitReports,
} from "@/lib/api"
import {
  normalizeReportTarget,
  type ReportTarget,
  reportTargetKey,
  reportTargetLabel,
} from "@/lib/report-target"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/auth/auth-context"
import { Panel } from "@/components/dashboard/section"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { NativeSelect } from "@/components/ui/native-select"
import { Textarea } from "@/components/ui/textarea"

/**
 * Report intake form — single link first (the mode 451-page visitors
 * arrive through), bulk as progressive disclosure on the same page for
 * the researchers and abuse desks working a campaign. One wire for both:
 * POST /api/v1/reports (report-contact-intake-trd.md).
 */

const REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: "phishing", label: "Phishing or scam" },
  { value: "malware", label: "Malware or unwanted software" },
  { value: "spam", label: "Spam" },
  { value: "illegal_content", label: "Illegal content" },
  { value: "other", label: "Something else" },
]

const VECTORS: Array<{ value: ReportVector; label: string }> = [
  { value: "sms", label: "Text message (SMS)" },
  { value: "email", label: "Email" },
  { value: "dm", label: "Direct message" },
  { value: "social", label: "Social media" },
  { value: "web", label: "Another website" },
  { value: "other", label: "Somewhere else" },
]

type Mode = "single" | "bulk"

/** One pasted line, judged client-side exactly like the API will. */
type ParsedLine = {
  raw: string
  target: ReportTarget | null
  state: "ready" | "duplicate" | "invalid"
}

function parseLines(text: string): ParsedLine[] {
  const seen = new Set<string>()
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((raw) => {
      const target = normalizeReportTarget(raw)
      if (!target) return { raw, target, state: "invalid" as const }
      const key = reportTargetKey(target)
      if (seen.has(key)) return { raw, target, state: "duplicate" as const }
      seen.add(key)
      return { raw, target, state: "ready" as const }
    })
}

/** Server verdicts land per (domain, code); client-skipped rows keep
    their parse state. */
type Outcome = {
  submissionId: string
  accepted: number
  rejectedCount: number
  byKey: Map<string, "accepted" | ReportRejectionCode>
}

type Status =
  | { kind: "idle" }
  | { kind: "error"; text: string }
  | { kind: "sent-single"; ref: string }
  | { kind: "sent-bulk"; ref: string; accepted: number; rejected: number }

export function ReportForm({ initialCode }: { initialCode?: string }) {
  const { user } = useAuth()
  const captcha = useCaptcha()

  const [mode, setMode] = React.useState<Mode>("single")
  const [single, setSingle] = React.useState(initialCode ?? "")
  const [lines, setLines] = React.useState("")
  const [reason, setReason] = React.useState<ReportReason>("phishing")
  const [vector, setVector] = React.useState<ReportVector | "">("")
  const [details, setDetails] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [pending, setPending] = React.useState(false)
  const [status, setStatus] = React.useState<Status>({ kind: "idle" })
  const [outcome, setOutcome] = React.useState<Outcome | null>(null)

  const cap = user ? REPORT_ITEM_CAP_AUTHED : REPORT_ITEM_CAP_ANON
  const parsed = React.useMemo(() => parseLines(lines), [lines])
  const ready = parsed.filter((p) => p.state === "ready")
  const duplicates = parsed.filter((p) => p.state === "duplicate").length
  const invalid = parsed.filter((p) => p.state === "invalid").length
  const overCap = ready.length - cap

  function switchMode(next: Mode) {
    if (next === mode) return
    setMode(next)
    setStatus({ kind: "idle" })
    setOutcome(null)
    // Carry a single draft into bulk — pasting over it is one select-all
    // away, and losing a typed code on a mis-click would sting more.
    if (next === "bulk" && single.trim() && !lines.trim())
      setLines(single.trim())
  }

  function sharedFields(): Pick<
    ReportItemInput,
    "reason" | "details" | "vector"
  > {
    return {
      reason,
      ...(details.trim() ? { details: details.trim() } : {}),
      ...(vector ? { vector } : {}),
    }
  }

  async function submit(items: ReportItemInput[]) {
    // Authenticated submissions skip the captcha entirely; the
    // invisible challenge runs once per submission otherwise.
    const captcha_token = user ? undefined : await captcha.challenge()
    return submitReports({
      items,
      ...(email.trim() ? { reporter_email: email.trim() } : {}),
      ...(captcha_token ? { captcha_token } : {}),
    })
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (pending) return
    if (email.trim() && !/\S+@\S+\.\S+/.test(email.trim())) {
      setStatus({
        kind: "error",
        text: "That follow-up email doesn't look valid.",
      })
      return
    }

    if (mode === "single") {
      const raw = single.trim()
      if (!normalizeReportTarget(raw)) {
        setStatus({
          kind: "error",
          text: raw
            ? "That doesn't look like a spoo.me link or code."
            : "Paste the link or code first.",
        })
        return
      }
      setPending(true)
      setStatus({ kind: "idle" })
      try {
        const res = await submit([{ code_or_url: raw, ...sharedFields() }])
        const rejection = res.rejected[0]
        if (rejection) {
          setStatus({
            kind: "error",
            text:
              rejection.code === "not_found"
                ? "That link doesn't exist on spoo.me. Check the code."
                : "That doesn't look like a spoo.me link or code.",
          })
        } else {
          trackUiAction("report_submitted", "single")
          setStatus({ kind: "sent-single", ref: res.submission_id })
          setSingle("")
          setDetails("")
        }
      } catch (err) {
        setStatus({ kind: "error", text: intakeErrorText(err, ERROR_COPY) })
      } finally {
        setPending(false)
      }
      return
    }

    // Bulk: only lines the preview marked ready travel — duplicates and
    // unparseable lines are already judged, no need to spend cap on them.
    if (ready.length === 0) {
      setStatus({
        kind: "error",
        text: "Paste at least one spoo.me link, one per line.",
      })
      return
    }
    if (overCap > 0) {
      setStatus({
        kind: "error",
        text: `That's ${ready.length} links and the cap is ${cap} per submission. Split the list.`,
      })
      return
    }
    setPending(true)
    setStatus({ kind: "idle" })
    try {
      const res = await submit(
        ready.map((p) => ({ code_or_url: p.raw, ...sharedFields() }))
      )
      const byKey = new Map<string, "accepted" | ReportRejectionCode>()
      for (const p of ready) byKey.set(reportTargetKey(p.target!), "accepted")
      for (const r of res.rejected) {
        const sent = ready[r.index]
        if (sent) byKey.set(reportTargetKey(sent.target!), r.code)
      }
      trackUiAction("report_submitted", "bulk")
      setOutcome({
        submissionId: res.submission_id,
        accepted: res.accepted,
        rejectedCount: res.rejected.length,
        byKey,
      })
      setStatus({
        kind: "sent-bulk",
        ref: res.submission_id,
        accepted: res.accepted,
        rejected: res.rejected.length,
      })
    } catch (err) {
      setStatus({ kind: "error", text: intakeErrorText(err, ERROR_COPY) })
    } finally {
      setPending(false)
    }
  }

  return (
    // noValidate: the status slot below carries validation copy in the
    // house voice — native browser bubbles would race it.
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {/* Header + the quiet mode switch */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-foreground text-lg tracking-tight">
            {mode === "single" ? "Report a link" : "Report a batch"}
          </h2>
          <p className="mt-1 text-muted-foreground text-sm">
            {mode === "single"
              ? "The link and a reason are enough. Everything else is optional."
              : "One link or code per line. The reason below applies to the whole batch."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => switchMode(mode === "single" ? "bulk" : "single")}
          className="mt-1.5 shrink-0 font-mono text-[11px] text-muted-foreground underline-offset-4 transition-colors duration-150 hover:text-foreground hover:underline"
        >
          {mode === "single" ? "switch to bulk" : "switch to single"}
        </button>
      </div>

      {/* Mode-dependent head — the tail fields below are shared, so a
          switch never loses the reason or contact details. */}
      <AnimatePresence mode="wait" initial={false}>
        {mode === "single" ? (
          <motion.div
            key="single"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <Field label="Link or code" htmlFor="report-link">
              <Input
                id="report-link"
                className="h-10 font-mono text-[13px]"
                placeholder="spoo.me/abc123 or abc123"
                autoComplete="off"
                spellCheck={false}
                value={single}
                onChange={(e) => setSingle(e.target.value)}
              />
            </Field>
          </motion.div>
        ) : (
          <motion.div
            key="bulk"
            className="flex flex-col gap-4"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <Field label="Links or codes" htmlFor="report-lines">
              <Textarea
                id="report-lines"
                className="field-sizing-fixed h-40 resize-none font-mono text-[13px] leading-6"
                placeholder={
                  "spoo.me/xk21p\nhttps://spoo.me/q1w2e3\ngo.customer.com/deal"
                }
                spellCheck={false}
                value={lines}
                onChange={(e) => {
                  setLines(e.target.value)
                  // The table's verdicts describe what was SENT — a single
                  // edited character makes them stale.
                  setOutcome(null)
                  if (status.kind !== "idle") setStatus({ kind: "idle" })
                }}
              />
            </Field>
            {/* Tally + table mount together once something parses — the
                empty bulk head keeps single mode's exact rhythm. */}
            {parsed.length > 0 && (
              <>
                <p className="-mt-2 font-mono text-[11px] text-muted-foreground/70 tabular-nums">
                  {ready.length} to report
                  {duplicates > 0 &&
                    ` · ${duplicates} duplicate${duplicates === 1 ? "" : "s"}`}
                  {invalid > 0 &&
                    ` · ${invalid} not spoo link${invalid === 1 ? "" : "s"}`}
                  {overCap > 0 && (
                    <span className="text-destructive">
                      {" "}
                      · {overCap} over the {cap} cap
                    </span>
                  )}
                </p>
                <PreviewTable rows={parsed} outcome={outcome} />
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shared tail */}
      <Field label="Reason" htmlFor="report-reason">
        <NativeSelect
          id="report-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value as ReportReason)}
        >
          {REASONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </NativeSelect>
      </Field>

      <Field label="Details" htmlFor="report-details" optional>
        <Textarea
          id="report-details"
          className="min-h-20 text-sm"
          maxLength={REPORT_DETAILS_MAX}
          placeholder="Anything that helps triage: what the page pretends to be, where it's spreading…"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="How it reached you" htmlFor="report-vector" optional>
          <NativeSelect
            id="report-vector"
            value={vector}
            onChange={(e) => setVector(e.target.value as ReportVector | "")}
          >
            <option value="">Prefer not to say</option>
            {VECTORS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label="Email for follow-up" htmlFor="report-email" optional>
          <Input
            id="report-email"
            type="email"
            className="h-10"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
      </div>

      {/* Fixed-height status slot — errors and receipts swap in place,
          the form never jumps. */}
      <p
        role="status"
        aria-live="polite"
        className="-my-1 h-4 truncate text-xs"
      >
        {status.kind === "error" ? (
          <span className="text-destructive">{status.text}</span>
        ) : status.kind === "sent-single" ? (
          <span className="inline-flex max-w-full items-center gap-1.5 text-muted-foreground">
            <Check aria-hidden className="size-3.5 shrink-0 text-live" />
            Report received ·{" "}
            <span className="truncate font-mono">{status.ref}</span>
          </span>
        ) : status.kind === "sent-bulk" ? (
          <span className="inline-flex max-w-full items-center gap-1.5 text-muted-foreground">
            {status.accepted > 0 && (
              <Check aria-hidden className="size-3.5 shrink-0 text-live" />
            )}
            {status.accepted} accepted
            {status.rejected > 0 && ` · ${status.rejected} rejected`} ·{" "}
            <span className="truncate font-mono">{status.ref}</span>
          </span>
        ) : null}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p className="max-w-[16rem] text-muted-foreground text-xs leading-relaxed">
          Reports are anonymous unless you add an email. We never contact the
          link&apos;s owner about who reported it.
        </p>
        <Button
          type="submit"
          size="lg"
          className="h-10 px-4"
          disabled={pending}
        >
          <Flag className="size-4" data-icon="inline-start" />
          {pending
            ? "Submitting…"
            : mode === "single"
              ? "Submit report"
              : "Submit reports"}
        </Button>
      </div>

      {captcha.element}
    </form>
  )
}

/* ── bulk preview table — same anatomy as the links table ─────────────── */

const ROW_STATES: Record<
  ParsedLine["state"] | "accepted" | ReportRejectionCode,
  { label: string; className: string }
> = {
  ready: { label: "ready", className: "text-muted-foreground/70" },
  duplicate: { label: "duplicate", className: "text-muted-foreground/70" },
  invalid: { label: "not a spoo link", className: "text-destructive" },
  accepted: { label: "accepted", className: "text-live" },
  not_found: { label: "not found", className: "text-muted-foreground/70" },
  duplicate_in_batch: {
    label: "duplicate",
    className: "text-muted-foreground/70",
  },
  invalid_input: { label: "not a spoo link", className: "text-destructive" },
}

function PreviewTable({
  rows,
  outcome,
}: {
  rows: ParsedLine[]
  outcome: Outcome | null
}) {
  return (
    <Panel className="max-h-[19rem] overflow-y-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 z-10">
          <tr className="border-border/60 border-b bg-muted text-left text-muted-foreground dark:bg-muted/40">
            <th className="label-mono h-8 px-3 font-medium text-[10px]">
              Link
            </th>
            <th className="label-mono h-8 px-3 text-right font-medium text-[10px]">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {rows.map((row, i) => {
            const verdict =
              outcome && row.state === "ready"
                ? (outcome.byKey.get(reportTargetKey(row.target!)) ?? "ready")
                : row.state
            const state = ROW_STATES[verdict]
            return (
              <tr
                key={`${i}-${row.raw}`}
                className="even:bg-muted/40 dark:even:bg-transparent"
              >
                <td className="w-full max-w-0 truncate px-3 py-2 font-mono text-[13px] text-foreground">
                  {row.target ? reportTargetLabel(row.target) : row.raw}
                </td>
                <td
                  className={cn(
                    "whitespace-nowrap px-3 py-2 text-right font-mono text-[11px]",
                    state.className
                  )}
                >
                  {state.label}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Panel>
  )
}

/* ── small shared pieces (contact-form recipes, verbatim) ─────────────── */

/** This surface's wording for the shared intake error ladder. */
const ERROR_COPY: IntakeErrorCopy = {
  captchaIncomplete: "The captcha wasn't completed. Try submitting again.",
  captchaRejected: "The captcha didn't verify. Try submitting again.",
  notConfigured:
    "Report intake is down on our side. Try again shortly, or email hello@spoo.me.",
  rateLimited: "Too many reports just now. Wait a minute and try again.",
  network: "Can't reach the server. Check your connection and try again.",
}

function Field({
  label,
  htmlFor,
  optional,
  children,
}: {
  label: string
  htmlFor: string
  optional?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="font-medium text-foreground text-sm">
        {label}
        {optional && (
          <span className="ml-1.5 font-normal text-muted-foreground/70 text-xs">
            (optional)
          </span>
        )}
      </label>
      {children}
    </div>
  )
}
