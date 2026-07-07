"use client"

import * as React from "react"
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import {
  parseAsInteger,
  parseAsIsoDateTime,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from "nuqs"
import {
  ArrowDown,
  ArrowUp,
  Bot,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Gauge,
  KeyRound,
  ListFilter,
  Plus,
  Search,
  Timer,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  listUrls,
  type UrlListFilter,
  type UrlListItem,
  type UrlStatus,
} from "@/lib/api"
import { displayUrl, domainOf, formatCount, formatWhen } from "@/lib/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Panel } from "@/components/dashboard/section"
import { StatusPill } from "@/components/dashboard/status-pill"
import { CopyButton } from "@/components/dashboard/copy-button"
import { LinkActions, shortUrlOf } from "@/components/dashboard/links/link-actions"
import { LinkSheet } from "@/components/dashboard/links/link-sheet"
import { openLinkComposer } from "@/components/dashboard/links/composer"
import { TimeRangePicker } from "@/components/dashboard/analytics/time-range-picker"

const STATUSES = ["ACTIVE", "INACTIVE", "EXPIRED", "BLOCKED"] as const
const SORTS = ["created_at", "last_click", "total_clicks"] as const
const PAGE_SIZE = 15

function Favicon({ url }: { url: string | null }) {
  const domain = domainOf(url)
  const [failed, setFailed] = React.useState(false)
  return (
    <span className="border-border/60 bg-muted/30 flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md border">
      {domain && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-4"
        />
      ) : (
        <Search className="text-muted-foreground/50 size-3.5" />
      )}
    </span>
  )
}

function PropIcon({
  icon: Icon,
  label,
}: {
  icon: React.ElementType
  label: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="text-muted-foreground/60 flex size-5 items-center justify-center">
          <Icon className="size-3.5" strokeWidth={1.75} />
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

function FilterChip({
  label,
  onClear,
}: {
  label: string
  onClear: () => void
}) {
  return (
    <span className="border-border/60 bg-card text-foreground flex h-7 items-center gap-1 rounded-full border pr-1 pl-2.5 text-xs">
      {label}
      <button
        type="button"
        onClick={onClear}
        aria-label={`Clear filter ${label}`}
        className="text-muted-foreground hover:text-foreground hover:bg-accent/60 flex size-5 items-center justify-center rounded-full transition-colors duration-150"
      >
        <X className="size-3" />
      </button>
    </span>
  )
}

export default function LinksPage() {
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""))
  const [status, setStatus] = useQueryState(
    "status",
    parseAsStringLiteral(STATUSES),
  )
  const [protectedOnly, setProtectedOnly] = useQueryState("protected", parseAsString)
  const [limitedOnly, setLimitedOnly] = useQueryState("limited", parseAsString)
  const [sortBy, setSortBy] = useQueryState(
    "sort",
    parseAsStringLiteral(SORTS).withDefault("created_at"),
  )
  const [sortDir, setSortDir] = useQueryState(
    "dir",
    parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc"),
  )
  const [after, setAfter] = useQueryState("after", parseAsIsoDateTime)
  const [before, setBefore] = useQueryState("before", parseAsIsoDateTime)
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))
  const [selected, setSelected] = useQueryState("link", parseAsString)

  const [searchDraft, setSearchDraft] = React.useState(q)
  React.useEffect(() => {
    const t = setTimeout(() => {
      if (searchDraft !== q) {
        setQ(searchDraft || null)
        setPage(null)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [searchDraft, q, setQ, setPage])

  const filter: UrlListFilter = {
    ...(q ? { search: q } : {}),
    ...(status ? { status: status as UrlStatus } : {}),
    ...(protectedOnly ? { passwordSet: protectedOnly === "yes" } : {}),
    ...(limitedOnly ? { maxClicksSet: limitedOnly === "yes" } : {}),
    ...(after ? { createdAfter: after.toISOString() } : {}),
    ...(before ? { createdBefore: before.toISOString() } : {}),
  }

  const urls = useQuery({
    queryKey: ["urls", { page, sortBy, sortDir, filter }],
    queryFn: () =>
      listUrls({
        page,
        pageSize: PAGE_SIZE,
        sortBy,
        sortOrder: sortDir,
        filter,
      }),
    placeholderData: keepPreviousData,
  })

  const items = urls.data?.items ?? []
  const selectedLink = items.find((l) => l.alias === selected) ?? null
  const total = urls.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const activeFilterCount =
    (status ? 1 : 0) + (protectedOnly ? 1 : 0) + (limitedOnly ? 1 : 0)

  const sortHeader = (key: (typeof SORTS)[number], label: string) => (
    <button
      type="button"
      onClick={() => {
        if (sortBy === key) setSortDir(sortDir === "desc" ? "asc" : "desc")
        else {
          setSortBy(key)
          setSortDir("desc")
        }
        setPage(null)
      }}
      className={cn(
        "hover:text-foreground flex items-center gap-1 transition-colors duration-150",
        sortBy === key ? "text-foreground" : "",
      )}
    >
      {label}
      {sortBy === key &&
        (sortDir === "desc" ? (
          <ArrowDown className="size-3" />
        ) : (
          <ArrowUp className="size-3" />
        ))}
    </button>
  )

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="text-muted-foreground/60 absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
          <Input
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search links…"
            spellCheck={false}
            className="h-8 w-56 pl-8 text-[13px]"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <ListFilter data-icon="inline-start" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-brand/10 text-brand ml-0.5 rounded-full px-1.5 font-mono text-[10px] tabular-nums">
                  {activeFilterCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-52">
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Status
            </DropdownMenuLabel>
            {STATUSES.map((s) => (
              <DropdownMenuCheckboxItem
                key={s}
                checked={status === s}
                onCheckedChange={(v) => {
                  setStatus(v ? s : null)
                  setPage(null)
                }}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    s === "ACTIVE" && "bg-live",
                    s === "INACTIVE" && "bg-muted-foreground/50",
                    s === "EXPIRED" && "bg-amber-500",
                    s === "BLOCKED" && "bg-destructive",
                  )}
                />
                {s.charAt(0) + s.slice(1).toLowerCase()}
              </DropdownMenuCheckboxItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Protections
            </DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={protectedOnly === "yes"}
              onCheckedChange={(v) => {
                setProtectedOnly(v ? "yes" : null)
                setPage(null)
              }}
            >
              <KeyRound className="text-muted-foreground size-3.5" strokeWidth={1.75} />
              Password protected
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={limitedOnly === "yes"}
              onCheckedChange={(v) => {
                setLimitedOnly(v ? "yes" : null)
                setPage(null)
              }}
            >
              <Gauge className="text-muted-foreground size-3.5" strokeWidth={1.75} />
              Click-limited
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <TimeRangePicker
          value={after && before ? { from: after, to: before } : null}
          placeholder="Created"
          onApply={(r) => {
            setAfter(r.from)
            setBefore(r.to)
            setPage(null)
          }}
          onClear={() => {
            setAfter(null)
            setBefore(null)
            setPage(null)
          }}
        />

        <span className="text-muted-foreground ml-auto font-mono text-xs tabular-nums">
          {urls.isPending ? "…" : `${formatCount(total)} link${total === 1 ? "" : "s"}`}
        </span>
      </div>

      {/* Applied filter chips — always visible, dismissible (SPEC §7) */}
      {(status || protectedOnly || limitedOnly || q || (after && before)) && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {q && (
            <FilterChip
              label={`Search: ${q}`}
              onClear={() => {
                setSearchDraft("")
                setQ(null)
                setPage(null)
              }}
            />
          )}
          {status && (
            <FilterChip
              label={`Status: ${status.toLowerCase()}`}
              onClear={() => {
                setStatus(null)
                setPage(null)
              }}
            />
          )}
          {protectedOnly && (
            <FilterChip
              label="Password: set"
              onClear={() => {
                setProtectedOnly(null)
                setPage(null)
              }}
            />
          )}
          {after && before && (
            <FilterChip
              label={`Created: ${after.toLocaleDateString("en", { month: "short", day: "numeric" })} to ${before.toLocaleDateString("en", { month: "short", day: "numeric" })}`}
              onClear={() => {
                setAfter(null)
                setBefore(null)
                setPage(null)
              }}
            />
          )}
          {limitedOnly && (
            <FilterChip
              label="Max clicks: set"
              onClear={() => {
                setLimitedOnly(null)
                setPage(null)
              }}
            />
          )}
          {activeFilterCount + (q ? 1 : 0) >= 2 && (
            <button
              type="button"
              onClick={() => {
                setSearchDraft("")
                setQ(null)
                setStatus(null)
                setProtectedOnly(null)
                setLimitedOnly(null)
                setPage(null)
              }}
              className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-4 transition-colors duration-150"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <Panel className="mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border/60 text-muted-foreground border-b text-left">
              <th className="label-mono h-9 w-full px-4 text-[10px] font-medium">
                Link
              </th>
              <th className="label-mono hidden h-9 px-3 text-[10px] font-medium sm:table-cell">Status</th>
              <th className="label-mono h-9 px-3 text-[10px] font-medium">
                <span className="flex justify-end">
                  {sortHeader("total_clicks", "Clicks")}
                </span>
              </th>
              <th className="label-mono hidden h-9 px-3 text-[10px] font-medium whitespace-nowrap md:table-cell">
                {sortHeader("last_click", "Last click")}
              </th>
              <th className="label-mono hidden h-9 px-3 text-[10px] font-medium whitespace-nowrap lg:table-cell">
                {sortHeader("created_at", "Created")}
              </th>
              <th className="h-9 w-10 px-2" />
            </tr>
          </thead>
          <tbody className="divide-border/60 divide-y">
            {urls.isPending &&
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-4 py-3" colSpan={6}>
                    <div className="flex items-center gap-3">
                      <Skeleton className="size-7 rounded-md" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-40" />
                        <Skeleton className="h-3 w-64" />
                      </div>
                    </div>
                  </td>
                </tr>
              ))}

            {!urls.isPending && !items.length && (
              <tr>
                <td colSpan={6}>
                  <div className="pattern-dots m-4 flex h-48 flex-col items-center justify-center gap-3 rounded-lg">
                    <span className="border-border text-muted-foreground/70 rounded-lg border border-dashed px-3 py-1.5 font-mono text-[11px]">
                      {q || activeFilterCount
                        ? "nothing matches these filters"
                        : "no links yet"}
                    </span>
                    {!q && !activeFilterCount && (
                      <Button size="sm" onClick={() => openLinkComposer()}>
                        <Plus data-icon="inline-start" />
                        Create your first link
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {items.map((link) => (
              <LinkRow
                key={link.id}
                link={link}
                onOpen={() => setSelected(link.alias)}
              />
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="border-border/60 bg-muted/30 flex h-11 items-center justify-between border-t px-4">
            <span className="text-muted-foreground font-mono text-xs tabular-nums">
              page {page} of {totalPages}
            </span>
            <span className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Previous page"
                disabled={page <= 1}
                onClick={() => setPage(page - 1 <= 1 ? null : page - 1)}
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon-sm"
                aria-label="Next page"
                disabled={!urls.data?.hasNext}
                onClick={() => setPage(page + 1)}
              >
                <ChevronRight />
              </Button>
            </span>
          </div>
        )}
      </Panel>

      <LinkSheet
        link={selectedLink}
        open={selected !== null}
        onOpenChange={(open) => setSelected(open ? selected : null)}
      />
    </div>
  )
}

function LinkRow({ link, onOpen }: { link: UrlListItem; onOpen: () => void }) {
  return (
    <tr
      onClick={onOpen}
      className="hover:bg-accent/40 cursor-pointer transition-colors duration-150"
    >
      <td className="w-full max-w-0 px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Favicon url={link.long_url} />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-foreground truncate font-mono text-[13px] font-medium">
                {(link.domain ?? "spoo.me") + "/" + link.alias}
              </span>
              <CopyButton
                value={shortUrlOf(link)}
                className="opacity-0 transition-opacity duration-150 [tr:hover_&]:opacity-100"
              />
            </div>
            <div className="text-muted-foreground truncate text-xs">
              {displayUrl(link.long_url)}
            </div>
          </div>
          <span className="ml-auto hidden shrink-0 items-center gap-0.5 sm:flex">
            {link.password_set && <PropIcon icon={KeyRound} label="Password protected" />}
            {link.expire_after != null && <PropIcon icon={Timer} label="Has expiry" />}
            {link.max_clicks != null && <PropIcon icon={Gauge} label="Click limit" />}
            {link.private_stats && <PropIcon icon={EyeOff} label="Private stats" />}
            {link.block_bots && <PropIcon icon={Bot} label="Bots blocked" />}
          </span>
        </div>
      </td>
      <td className="hidden px-3 py-2.5 whitespace-nowrap sm:table-cell">
        <StatusPill status={link.status} />
      </td>
      <td className="px-3 py-2.5 text-right whitespace-nowrap">
        <span className="text-foreground font-mono text-[13px] font-medium tabular-nums">
          {formatCount(link.total_clicks)}
        </span>
      </td>
      <td className="text-muted-foreground hidden px-3 py-2.5 text-xs whitespace-nowrap md:table-cell">
        {formatWhen(link.last_click)}
      </td>
      <td className="text-muted-foreground hidden px-3 py-2.5 text-xs whitespace-nowrap lg:table-cell">
        {formatWhen(link.created_at)}
      </td>
      <td className="px-2 py-2.5 text-right">
        <LinkActions link={link} />
      </td>
    </tr>
  )
}
