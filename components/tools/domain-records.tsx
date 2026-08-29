"use client"

import * as React from "react"
import { ArrowUpRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { fetchDomainIntel, type DomainIntel } from "@/lib/api"

/**
 * Public records of the final destination's host, fetched after the chain
 * renders: registration (age is the phishing tell), TLS certificate, DNS.
 * Facts as fetched; when a lookup doesn't answer, its rows simply aren't
 * there. Below the card, prefilled links to the scanners whose verdicts
 * we won't impersonate.
 */
export function DomainRecords({
  host,
  finalUrl,
}: {
  host: string
  finalUrl: string
}) {
  const [intel, setIntel] = React.useState<DomainIntel | null>(null)
  const [settled, setSettled] = React.useState(false)

  React.useEffect(() => {
    let cancelled = false
    setSettled(false)
    setIntel(null)
    fetchDomainIntel(host)
      .then((data) => {
        if (!cancelled) setIntel(data)
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setSettled(true)
      })
    return () => {
      cancelled = true
    }
  }, [host])

  const checkLinks = [
    {
      label: "VirusTotal",
      href: `https://www.virustotal.com/gui/domain/${encodeURIComponent(host)}`,
    },
    {
      label: "Google Safe Browsing",
      href: `https://transparencyreport.google.com/safe-browsing/search?url=${encodeURIComponent(finalUrl)}`,
    },
    {
      label: "urlscan.io",
      href: `https://urlscan.io/search/#${encodeURIComponent(host)}`,
    },
    {
      label: "Wayback Machine",
      href: `https://web.archive.org/web/*/${finalUrl}`,
    },
  ]

  return (
    <div className="mt-6">
      <span className="label-mono text-muted-foreground">Domain records</span>
      <div className="mt-2.5 rounded-xl border border-border/60 bg-card">
        {!settled && (
          <div className="space-y-3 p-5">
            <Skeleton className="h-3 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        )}
        {settled && !intel && (
          <p className="p-5 text-muted-foreground text-sm">
            No records answered for {host}.
          </p>
        )}
        {intel && (
          <div className="divide-y divide-border/50">
            {intel.whois && (
              <RecordGroup title="registration">
                <Row name="registrar" value={intel.whois.registrar} />
                <Row
                  name="registered"
                  value={fmtDate(intel.whois.created)}
                  suffix={ageSuffix(intel.whois.age_days)}
                  danger={
                    intel.whois.age_days !== null && intel.whois.age_days < 90
                  }
                />
                <Row name="expires" value={fmtDate(intel.whois.expires)} />
              </RecordGroup>
            )}
            {intel.ssl && (
              <RecordGroup title="tls certificate">
                <Row name="issuer" value={intel.ssl.issuer} />
                <Row name="issued to" value={intel.ssl.subject} />
                <Row
                  name="valid until"
                  value={fmtDate(intel.ssl.valid_to)}
                  suffix={
                    intel.ssl.days_left !== null
                      ? `${intel.ssl.days_left} days left`
                      : undefined
                  }
                  danger={
                    intel.ssl.days_left !== null && intel.ssl.days_left < 14
                  }
                />
              </RecordGroup>
            )}
            <RecordGroup title="dns">
              {Object.entries(intel.dns)
                .filter(([, records]) => records.length > 0)
                .map(([type, records]) => (
                  <ListRow key={type} name={type} values={records} />
                ))}
            </RecordGroup>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span className="font-mono text-[11px] text-muted-foreground/70">
          check elsewhere:
        </span>
        {checkLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            {link.label}
            <ArrowUpRight className="size-3" />
          </a>
        ))}
      </div>
    </div>
  )
}

function RecordGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="px-5 py-3.5">
      <div className="font-mono text-[10px] text-muted-foreground/60 uppercase tracking-widest">
        {title}
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

function Row({
  name,
  value,
  suffix,
  danger,
}: {
  name: string
  value: string | null | undefined
  suffix?: string
  danger?: boolean
}) {
  if (!value) return null
  return (
    <div className="flex items-baseline gap-4 py-1">
      <span className="w-24 shrink-0 font-mono text-muted-foreground text-xs">
        {name}
      </span>
      <span
        title={value}
        className="min-w-0 truncate font-mono text-[13px] text-foreground/90"
      >
        {value}
      </span>
      {suffix && (
        <span
          className={cn(
            "shrink-0 font-mono text-[11px]",
            danger ? "text-destructive" : "text-muted-foreground/70"
          )}
        >
          {suffix}
        </span>
      )}
    </div>
  )
}

const LIST_LIMIT = 3

/** Multi-value records render as a list; long sets collapse to the first
    few under a fade with a quiet show-all. */
function ListRow({ name, values }: { name: string; values: string[] }) {
  const [open, setOpen] = React.useState(false)
  const hidden = values.length - LIST_LIMIT
  const shown = open || hidden <= 0 ? values : values.slice(0, LIST_LIMIT)
  return (
    <div className="flex gap-4 py-1">
      <span className="w-24 shrink-0 font-mono text-muted-foreground text-xs leading-6">
        {name}
      </span>
      <div className="min-w-0 flex-1">
        <ul
          className={cn(
            !open &&
              hidden > 0 &&
              "[mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
          )}
        >
          {shown.map((value) => (
            <li
              key={value}
              className="break-all font-mono text-[13px] text-foreground/90 leading-6"
            >
              {value}
            </li>
          ))}
        </ul>
        {hidden > 0 && !open && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            show all {values.length}
          </button>
        )}
      </div>
    </div>
  )
}

function fmtDate(raw: string | null | undefined): string | null {
  if (!raw) return null
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function ageSuffix(ageDays: number | null): string | undefined {
  if (ageDays === null) return undefined
  if (ageDays < 90) return `registered ${ageDays} days ago`
  const years = Math.floor(ageDays / 365)
  return years >= 1 ? `${years}y old` : `${ageDays} days old`
}
