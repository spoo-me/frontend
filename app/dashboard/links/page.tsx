"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
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
  CalendarDays,
  Globe,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Gauge,
  KeyRound,
  Check,
  Download,
  Ellipsis,
  ListFilter,
  Pause,
  Play,
  Plus,
  Search,
  Timer,
  Trash2,
  X,
} from "lucide-react"

import { AnimatePresence, motion } from "motion/react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import {
  type BulkOperationResult,
  bulkDeleteUrls,
  bulkMoveUrlDomain,
  bulkSetUrlExpiry,
  bulkSetUrlStatus,
  getUrl,
  listCustomDomains,
  listUrls,
  reconcileDeletedNotFound,
  SpooApiError,
  summarizeBulkFailures,
  type UrlListFilter,
  type UrlListItem,
  type UrlStatus,
} from "@/lib/api"
import {
  detailDomainOf,
  linkSheetParam,
  parseLinkSheetParam,
} from "@/lib/link-detail"
import { trackLinksBulkAction, trackUiAction } from "@/lib/analytics"
import { displayUrl, domainOf, formatCount, formatWhen } from "@/lib/format"
import { faviconUrl } from "@/lib/favicon"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DateTimeField } from "@/components/dashboard/date-time-field"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Panel } from "@/components/dashboard/section"
import { StatusPill } from "@/components/dashboard/status-pill"
import { CopyButton } from "@/components/dashboard/copy-button"
import {
  LinkActions,
  shortUrlOf,
} from "@/components/dashboard/links/link-actions"
import { LinkSheet } from "@/components/dashboard/links/link-sheet"
import { FilterChip } from "@/components/dashboard/filter-chip"
import { openLinkComposer } from "@/components/dashboard/links/composer"
import { TimeRangePicker } from "@/components/dashboard/analytics/time-range-picker"
import { RefreshControl } from "@/components/dashboard/refresh-control"
import { useAutoRefreshPref } from "@/hooks/use-auto-refresh"

const STATUSES = ["ACTIVE", "INACTIVE", "EXPIRED", "BLOCKED"] as const
const SORTS = ["created_at", "last_click", "total_clicks"] as const
const PAGE_SIZE = 15

function Favicon({ url }: { url: string | null }) {
  const domain = domainOf(url)
  const [failed, setFailed] = React.useState(false)
  return (
    <span className="flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/60 bg-muted/30">
      {domain && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={faviconUrl(domain)}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-4"
        />
      ) : (
        <Globe
          className="size-3.5 text-muted-foreground/60"
          strokeWidth={1.75}
        />
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
        <span className="flex size-5 items-center justify-center text-muted-foreground/60">
          <Icon className="size-3.5" strokeWidth={1.75} />
        </span>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export default function LinksPage() {
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""))
  const [status, setStatus] = useQueryState(
    "status",
    parseAsStringLiteral(STATUSES)
  )
  const [protectedOnly, setProtectedOnly] = useQueryState(
    "protected",
    parseAsString
  )
  const [limitedOnly, setLimitedOnly] = useQueryState("limited", parseAsString)
  const [sortBy, setSortBy] = useQueryState(
    "sort",
    parseAsStringLiteral(SORTS).withDefault("created_at")
  )
  const [sortDir, setSortDir] = useQueryState(
    "dir",
    parseAsStringLiteral(["asc", "desc"] as const).withDefault("desc")
  )
  const [after, setAfter] = useQueryState("after", parseAsIsoDateTime)
  const [before, setBefore] = useQueryState("before", parseAsIsoDateTime)
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1))
  const [selected, setSelected] = useQueryState("link", parseAsString)

  const [searchDraft, setSearchDraft] = React.useState(q)
  React.useEffect(() => {
    const t = setTimeout(() => {
      if (searchDraft !== q) {
        if (searchDraft) trackUiAction("links_searched")
        setQ(searchDraft || null)
        setPage(null)
      }
    }, 300)
    return () => clearTimeout(t)
  }, [searchDraft, q, setQ, setPage])

  // Sort is a lasting preference, not a filter: remembered across sessions.
  // An explicit sort in the URL still wins (shared links stay faithful).
  // Restored via router.replace so nuqs state and URL move together.
  const router = useRouter()
  const sortRestored = React.useRef(false)
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.has("sort") && !params.has("dir")) {
      const saved = localStorage.getItem("spoo:links-sort")
      const [s, d] = saved?.split(":") ?? []
      if ((SORTS as readonly string[]).includes(s) && s !== "created_at")
        params.set("sort", s)
      if (d === "asc") params.set("dir", d)
      if (params.size)
        router.replace(`${window.location.pathname}?${params}`, {
          scroll: false,
        })
    }
    sortRestored.current = true
  }, [router])
  React.useEffect(() => {
    if (!sortRestored.current) return
    localStorage.setItem("spoo:links-sort", `${sortBy}:${sortDir}`)
  }, [sortBy, sortDir])

  const filter: UrlListFilter = {
    ...(q ? { search: q } : {}),
    ...(status ? { status: status as UrlStatus } : {}),
    ...(protectedOnly ? { passwordSet: protectedOnly === "yes" } : {}),
    ...(limitedOnly ? { maxClicksSet: limitedOnly === "yes" } : {}),
    ...(after ? { createdAfter: after.toISOString() } : {}),
    ...(before ? { createdBefore: before.toISOString() } : {}),
  }

  // Filter/sort usage — one emission per change, skipping the initial
  // mount so a shared URL with filters baked in doesn't count as a use.
  const filterKeys = [
    status && `status:${status}`,
    protectedOnly && `protected:${protectedOnly}`,
    limitedOnly && `limited:${limitedOnly}`,
    (after || before) && "created",
  ]
    .filter(Boolean)
    .join(",")
  const mountedRef = React.useRef(false)
  React.useEffect(() => {
    if (!mountedRef.current) return
    if (filterKeys) trackUiAction("links_filtered", filterKeys)
  }, [filterKeys])
  React.useEffect(() => {
    if (mountedRef.current)
      trackUiAction("links_sorted", `${sortBy}:${sortDir}`)
  }, [sortBy, sortDir])
  React.useEffect(() => {
    mountedRef.current = true
  }, [])

  // Bulk selection: ephemeral (not URL state), survives page flips so a
  // selection can span pages. Esc clears it unless a dialog owns the key.
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set())
  const [refreshEvery, setRefreshEvery] = useAutoRefreshPref()

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
    // Auto-refresh: silent poll at the user's cadence, paused while the
    // user is mid-flow (rows selected, sheet open) so rows can't reorder
    // under their hands. React Query pauses it while the tab is hidden.
    refetchInterval: selected || selectedIds.size ? false : refreshEvery,
  })

  // Instant page flips: warm the neighbors' caches while the user reads
  // this page (the answer to "should this be infinite scroll" is no — the
  // table keeps URL-addressable pages, prefetch removes the latency).
  const prefetchClient = useQueryClient()
  const totalForPrefetch = urls.data?.total ?? 0
  React.useEffect(() => {
    if (!urls.data) return
    const pages = Math.max(1, Math.ceil(totalForPrefetch / PAGE_SIZE))
    for (const p of [page + 1, page - 1]) {
      if (p < 1 || p > pages) continue
      prefetchClient.prefetchQuery({
        queryKey: ["urls", { page: p, sortBy, sortDir, filter }],
        queryFn: () =>
          listUrls({
            page: p,
            pageSize: PAGE_SIZE,
            sortBy,
            sortOrder: sortDir,
            filter,
          }),
        staleTime: 30_000,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urls.data, page, sortBy, sortDir, JSON.stringify(filter)])

  const items = urls.data?.items ?? []
  const selectedRef = selected === null ? null : parseLinkSheetParam(selected)
  const selectedInPage = selectedRef
    ? (items.find(
        (l) =>
          l.alias === selectedRef.alias &&
          (l.domain ?? null) === selectedRef.domain
      ) ?? null)
    : null
  // The sheet is URL-addressable from anywhere — links that aren't on the
  // current page resolve through the single-resource endpoint. A 404 there
  // is an answer (deleted or foreign), not something to retry.
  const lookup = useQuery({
    queryKey: ["url", selectedRef?.domain ?? null, selectedRef?.alias],
    queryFn: () =>
      getUrl(detailDomainOf(selectedRef!.domain), selectedRef!.alias),
    enabled: selectedRef !== null && !selectedInPage && !urls.isPending,
    retry: (count, error) =>
      !(error instanceof SpooApiError && error.status === 404) && count < 3,
  })
  const selectedLink = selectedInPage ?? lookup.data ?? null
  const total = urls.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const activeFilterCount =
    (status ? 1 : 0) + (protectedOnly ? 1 : 0) + (limitedOnly ? 1 : 0)

  const queryClient = useQueryClient()
  const [bulkConfirm, setBulkConfirm] = React.useState(false)
  const [bulkConfirmText, setBulkConfirmText] = React.useState("")
  const [moveOpen, setMoveOpen] = React.useState(false)
  const [moveTarget, setMoveTarget] = React.useState<string | null>(null)
  const [expiryOpen, setExpiryOpen] = React.useState(false)
  const [bulkExpiry, setBulkExpiry] = React.useState("")
  const domains = useQuery({
    queryKey: ["domains"],
    queryFn: listCustomDomains,
  })
  const domainOptions = [
    "spoo.me",
    ...(domains.data?.items ?? [])
      .filter((d) => d.status === "ACTIVE")
      .map((d) => d.fqdn),
  ]
  const pageIds = items.map((l) => l.id)
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id))

  const toggleId = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const togglePage = () =>
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allPageSelected) pageIds.forEach((id) => next.delete(id))
      else pageIds.forEach((id) => next.add(id))
      return next
    })
  const clearSelection = () => setSelectedIds(new Set())

  React.useEffect(() => {
    if (!selectedIds.size) return
    const onKey = (e: KeyboardEvent) => {
      const dialogOpen = document.querySelector(
        "[role=dialog][data-state=open], [role=alertdialog][data-state=open]"
      )
      if (e.key === "Escape" && !dialogOpen) clearSelection()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [selectedIds.size])

  // Page keys: arrows flip pages, mod+A selects the visible page.
  const hasNextRef = urls.data?.hasNext
  React.useEffect(() => {
    const typing = (el: EventTarget | null) =>
      el instanceof HTMLElement &&
      (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))
    const onKey = (e: KeyboardEvent) => {
      if (typing(e.target)) return
      const dialogOpen = document.querySelector(
        "[role=dialog][data-state=open], [role=alertdialog][data-state=open]"
      )
      if (dialogOpen) return
      if ((e.metaKey || e.ctrlKey) && (e.key === "a" || e.key === "A")) {
        e.preventDefault()
        setSelectedIds((prev) => {
          const next = new Set(prev)
          items.forEach((l) => next.add(l.id))
          return next
        })
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === "ArrowLeft" && page > 1)
        setPage(page - 1 <= 1 ? null : page - 1)
      if (e.key === "ArrowRight" && hasNextRef) setPage(page + 1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [page, hasNextRef, items, setPage])

  // One bulk request per user intent (POST /api/v1/urls/bulk/*), which
  // returns a per-item report: every id gets a verdict, so partial failure
  // is surfaced honestly rather than guessed. All four actions (status,
  // delete, expiry, domain) go through one bulk call and one shared
  // partial-failure code path.
  const bulk = useMutation({
    mutationFn: async ({
      ids,
      action,
      domain,
      expireAfter,
    }: {
      ids: string[]
      action: "ACTIVE" | "INACTIVE" | "DELETE" | "DOMAIN" | "EXPIRY"
      domain?: string
      expireAfter?: number | null
    }): Promise<{
      result: BulkOperationResult
      action: typeof action
      domain?: string
      expireAfter?: number | null
    }> => {
      const result =
        action === "DELETE"
          ? await bulkDeleteUrls(ids)
          : action === "DOMAIN"
            ? await bulkMoveUrlDomain(ids, domain ?? null)
            : action === "EXPIRY"
              ? await bulkSetUrlExpiry(ids, expireAfter ?? null)
              : await bulkSetUrlStatus(ids, action)
      return { result, action, domain, expireAfter }
    },
    onSuccess: ({ result, action, domain, expireAfter }) => {
      // For delete, an already-gone id reports not_found, which is
      // success-equivalent; fold those into successes so retries converge
      // and gone ids do not stay selected.
      const report =
        action === "DELETE" ? reconcileDeletedNotFound(result) : result
      const { total, succeeded, failed } = report.summary
      trackLinksBulkAction(action, total, failed)
      queryClient.invalidateQueries({ queryKey: ["urls"] })
      queryClient.invalidateQueries({ queryKey: ["stats"] })
      const verb =
        action === "DELETE"
          ? "deleted"
          : action === "ACTIVE"
            ? "activated"
            : action === "INACTIVE"
              ? "deactivated"
              : action === "EXPIRY"
                ? expireAfter == null
                  ? "expiry cleared"
                  : "set to expire"
                : `moved to ${domain}`

      // The action ran, so its dialog is done regardless of outcome — the
      // selection bar and the toast carry the result, so no modal lingers.
      setBulkConfirm(false)
      setBulkConfirmText("")
      setMoveOpen(false)
      setMoveTarget(null)
      setExpiryOpen(false)
      setBulkExpiry("")

      if (failed === 0) {
        clearSelection()
        toast.success(`${total} link${total === 1 ? "" : "s"} ${verb}`)
        return
      }

      // Partial (or total) failure: narrow the selection down to exactly the
      // links that failed so the user can inspect or retry that subset from
      // the selection bar, and report which — no false "all done".
      const failedIds = report.results.filter((r) => !r.ok).map((r) => r.id)
      setSelectedIds(new Set(failedIds))
      const breakdown = summarizeBulkFailures(report.results)
      const message =
        succeeded > 0
          ? `${succeeded} ${verb}, ${failed} failed`
          : `${failed} failed`
      toast.warning(message, {
        description: breakdown
          ? `${breakdown}. Still selected to retry.`
          : "Still selected to retry.",
      })
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Bulk action failed"),
  })

  // Export is a read, not a mutation: resolve the selected rows (which may
  // span pages) and hand back a CSV. Selection survives an export.
  const [exporting, setExporting] = React.useState(false)
  const exportCsv = async () => {
    setExporting(true)
    try {
      const wanted = new Set(selectedIds)
      const rows: UrlListItem[] = []
      let p = 1
      while (rows.length < wanted.size && p <= 10) {
        const res = await listUrls({ page: p, pageSize: 100 })
        for (const it of res.items) if (wanted.has(it.id)) rows.push(it)
        if (!res.hasNext) break
        p++
      }
      const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`
      const head = [
        "short_url",
        "long_url",
        "status",
        "total_clicks",
        "last_click",
        "created_at",
      ]
      const csv = [
        head.join(","),
        ...rows.map((r) =>
          [
            shortUrlOf(r),
            r.long_url,
            r.status,
            r.total_clicks,
            r.last_click,
            r.created_at,
          ]
            .map(esc)
            .join(",")
        ),
      ].join("\n")
      const a = document.createElement("a")
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }))
      a.download = `spoo-links-${new Date().toISOString().slice(0, 10)}.csv`
      a.click()
      URL.revokeObjectURL(a.href)
      toast.success(
        `Exported ${rows.length} link${rows.length === 1 ? "" : "s"}`
      )
    } finally {
      setExporting(false)
    }
  }

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
        "flex items-center gap-1 transition-colors duration-150 hover:text-foreground",
        sortBy === key ? "text-foreground" : ""
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
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <Input
            data-page-search
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
            placeholder="Search links…"
            spellCheck={false}
            className="h-8 w-56 pl-8 text-[13px]"
          />
        </div>

        {/* Non-modal: clicking a sibling control while this menu is open
            should act on the first click, not eat it. */}
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <ListFilter data-icon="inline-start" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 rounded-full bg-brand/10 px-1.5 font-mono text-[10px] text-brand tabular-nums">
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
                    s === "BLOCKED" && "bg-destructive"
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
              <KeyRound
                className="size-3.5 text-muted-foreground"
                strokeWidth={1.75}
              />
              Password protected
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={limitedOnly === "yes"}
              onCheckedChange={(v) => {
                setLimitedOnly(v ? "yes" : null)
                setPage(null)
              }}
            >
              <Gauge
                className="size-3.5 text-muted-foreground"
                strokeWidth={1.75}
              />
              Click-limited
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <TimeRangePicker
          value={after && before ? { from: after, to: before } : null}
          placeholder="All time"
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

        {/* Metadata, not an action: recedes below the filter controls. The
            visible range doubles as a "more pages exist" signal, since the
            paginator itself lives below the fold. */}
        <span className="ml-auto font-mono text-[11px] text-muted-foreground/60 tabular-nums">
          {urls.isPending
            ? "…"
            : totalPages > 1
              ? `Showing ${(page - 1) * PAGE_SIZE + 1}-${Math.min(page * PAGE_SIZE, total)} of ${formatCount(total)}`
              : `${formatCount(total)} link${total === 1 ? "" : "s"}`}
        </span>
        <RefreshControl
          className="ml-1"
          intervalMs={refreshEvery}
          onIntervalChange={setRefreshEvery}
          onRefresh={() =>
            queryClient.invalidateQueries({ queryKey: ["urls"] })
          }
          refreshing={urls.isFetching}
        />
      </div>

      {/* Applied filter chips — always visible, dismissible (SPEC §7) */}
      {(status || protectedOnly || limitedOnly || q || (after && before)) && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {q && (
            <FilterChip
              label="Search"
              icon={<Search className="size-3 text-muted-foreground" />}
              value={q}
              onClear={() => {
                setSearchDraft("")
                setQ(null)
                setPage(null)
              }}
            />
          )}
          {status && (
            <FilterChip
              label="Status"
              icon={
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    status === "ACTIVE" && "bg-live",
                    status === "INACTIVE" && "bg-muted-foreground/50",
                    status === "EXPIRED" && "bg-amber-500",
                    status === "BLOCKED" && "bg-destructive"
                  )}
                />
              }
              value={status.toLowerCase()}
              onClear={() => {
                setStatus(null)
                setPage(null)
              }}
            />
          )}
          {protectedOnly && (
            <FilterChip
              label="Password"
              icon={<KeyRound className="size-3 text-muted-foreground" />}
              value="set"
              onClear={() => {
                setProtectedOnly(null)
                setPage(null)
              }}
            />
          )}
          {after && before && (
            <FilterChip
              label="Created"
              icon={<CalendarDays className="size-3 text-muted-foreground" />}
              value={`${after.toLocaleDateString("en", { month: "short", day: "numeric" })} to ${before.toLocaleDateString("en", { month: "short", day: "numeric" })}`}
              onClear={() => {
                setAfter(null)
                setBefore(null)
                setPage(null)
              }}
            />
          )}
          {limitedOnly && (
            <FilterChip
              label="Max clicks"
              icon={<Gauge className="size-3 text-muted-foreground" />}
              value="set"
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
              className="text-muted-foreground text-xs underline underline-offset-4 transition-colors duration-150 hover:text-foreground"
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
            <tr className="border-border/60 border-b bg-muted text-left text-muted-foreground dark:bg-muted/40">
              <th className="label-mono relative h-9 w-full px-4 font-medium text-[10px]">
                {/* Same swap grammar as rows: label at rest, select-all on
                      header hover or while a selection exists. */}
                <span
                  className={cn(
                    "transition-opacity duration-150",
                    selectedIds.size > 0
                      ? "opacity-0"
                      : "[thead:hover_&]:opacity-0"
                  )}
                >
                  Link
                </span>
                <span
                  className={cn(
                    "absolute inset-y-0 left-4 flex w-7 items-center justify-center transition-opacity duration-150",
                    selectedIds.size > 0
                      ? "opacity-100"
                      : "opacity-0 [thead:hover_&]:opacity-100"
                  )}
                >
                  <Checkbox
                    checked={allPageSelected}
                    onCheckedChange={togglePage}
                    aria-label="Select all on this page"
                  />
                </span>
              </th>
              <th className="label-mono hidden h-9 px-3 font-medium text-[10px] sm:table-cell">
                Status
              </th>
              <th className="label-mono h-9 px-3 font-medium text-[10px]">
                <span className="flex justify-end">
                  {sortHeader("total_clicks", "Clicks")}
                </span>
              </th>
              <th className="label-mono hidden h-9 whitespace-nowrap px-3 font-medium text-[10px] md:table-cell">
                {sortHeader("last_click", "Last click")}
              </th>
              <th className="label-mono hidden h-9 whitespace-nowrap px-3 font-medium text-[10px] lg:table-cell">
                {sortHeader("created_at", "Created")}
              </th>
              <th className="h-9 w-10 px-2" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
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
                    <span className="rounded-lg border border-border border-dashed px-3 py-1.5 font-mono text-[11px] text-muted-foreground/70">
                      {q || activeFilterCount
                        ? "Nothing matches these filters"
                        : "No links yet"}
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
                onOpen={() => setSelected(linkSheetParam(link))}
                rowSelected={selectedIds.has(link.id)}
                onToggleSelect={() => toggleId(link.id)}
              />
            ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex h-11 items-center justify-between border-border/60 border-t bg-muted/30 px-4">
            <span className="font-mono text-muted-foreground text-xs tabular-nums">
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

      {/* Selection bar: the one floating element, earned by transience —
          exists only while a selection does, Esc dismisses. */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none sticky bottom-8 z-20 mt-auto flex justify-center pt-4"
          >
            <div className="pointer-events-auto flex items-center gap-1 rounded-full border border-border/60 bg-popover/95 p-1.5 pl-3.5 shadow-[0_4px_12px_rgba(0,0,0,0.06),0_18px_45px_-10px_rgba(0,0,0,0.22)] backdrop-blur-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.3),0_18px_45px_-10px_rgba(0,0,0,0.65)]">
              <span className="mr-1 font-mono text-foreground text-xs tabular-nums">
                {selectedIds.size} selected
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={bulk.isPending}
                onClick={() =>
                  bulk.mutate({ ids: [...selectedIds], action: "ACTIVE" })
                }
              >
                <Play data-icon="inline-start" />
                Activate
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={bulk.isPending}
                onClick={() =>
                  bulk.mutate({ ids: [...selectedIds], action: "INACTIVE" })
                }
              >
                <Pause data-icon="inline-start" />
                Deactivate
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="px-2.5"
                    aria-label="More bulk actions"
                    disabled={bulk.isPending}
                  >
                    <Ellipsis />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="center"
                  side="top"
                  className="w-auto"
                >
                  <DropdownMenuItem onSelect={() => setMoveOpen(true)}>
                    <Globe />
                    Move to domain…
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setExpiryOpen(true)}>
                    <Timer />
                    Set expiry…
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    disabled={exporting}
                    onSelect={() => exportCsv()}
                  >
                    <Download />
                    Export CSV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="destructive"
                size="sm"
                disabled={bulk.isPending}
                onClick={() => setBulkConfirm(true)}
              >
                <Trash2 data-icon="inline-start" />
                Delete
              </Button>
              <span
                aria-hidden
                className="-mr-0.5 ml-1 h-4 w-px bg-border/60"
              />
              <Button
                variant="ghost"
                size="icon-sm"
                className="rounded-full"
                aria-label="Clear selection"
                onClick={clearSelection}
              >
                <X />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog
        open={bulkConfirm}
        onOpenChange={(v) => {
          setBulkConfirm(v)
          if (!v) setBulkConfirmText("")
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {selectedIds.size} link{selectedIds.size === 1 ? "" : "s"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The short links stop working immediately and their analytics are
              deleted. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <p className="text-muted-foreground text-xs">
              Type <span className="font-mono text-foreground">delete</span> to
              confirm.
            </p>
            <Input
              value={bulkConfirmText}
              onChange={(e) => setBulkConfirmText(e.target.value)}
              placeholder="delete"
              spellCheck={false}
              autoComplete="off"
              className="h-9 font-mono text-xs"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={
                bulkConfirmText.trim().toLowerCase() !== "delete" ||
                bulk.isPending
              }
              onClick={() =>
                bulk.mutate({ ids: [...selectedIds], action: "DELETE" })
              }
            >
              Delete {selectedIds.size} link{selectedIds.size === 1 ? "" : "s"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk: move to domain */}
      <Dialog
        open={moveOpen}
        onOpenChange={(v) => {
          setMoveOpen(v)
          if (!v) setMoveTarget(null)
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Move {selectedIds.size} link{selectedIds.size === 1 ? "" : "s"} to
              a domain
            </DialogTitle>
            <DialogDescription>
              Aliases are preserved. If an alias already exists on the target
              domain, that link is skipped while the remaining links continue
              moving.
            </DialogDescription>
          </DialogHeader>
          <div className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60">
            {domainOptions.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setMoveTarget(d)}
                className="flex h-9 w-full items-center px-3 text-left transition-colors duration-150 hover:bg-accent/40"
              >
                <span className="flex-1 font-mono text-foreground text-xs">
                  {d}
                </span>
                {moveTarget === d && (
                  <Check className="size-3.5 text-foreground" />
                )}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button
              size="sm"
              disabled={!moveTarget || bulk.isPending}
              onClick={() =>
                bulk.mutate({
                  ids: [...selectedIds],
                  action: "DOMAIN",
                  domain: moveTarget!,
                })
              }
            >
              {bulk.isPending
                ? "Moving…"
                : `Move ${selectedIds.size} link${selectedIds.size === 1 ? "" : "s"}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk: set / clear expiry */}
      <Dialog
        open={expiryOpen}
        onOpenChange={(v) => {
          setExpiryOpen(v)
          if (!v) setBulkExpiry("")
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              Set expiry for {selectedIds.size} link
              {selectedIds.size === 1 ? "" : "s"}
            </DialogTitle>
            <DialogDescription>
              Each link stops redirecting after this moment. Existing expiry
              dates are overwritten.
            </DialogDescription>
          </DialogHeader>
          <DateTimeField
            value={bulkExpiry}
            onChange={setBulkExpiry}
            placeholder="Pick date and time"
            className="w-full"
          />
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              disabled={bulk.isPending}
              onClick={() =>
                bulk.mutate({
                  ids: [...selectedIds],
                  action: "EXPIRY",
                  expireAfter: null,
                })
              }
            >
              Remove expiry
            </Button>
            <Button
              size="sm"
              disabled={!bulkExpiry || bulk.isPending}
              onClick={() =>
                bulk.mutate({
                  ids: [...selectedIds],
                  action: "EXPIRY",
                  expireAfter: Math.floor(
                    new Date(bulkExpiry).getTime() / 1000
                  ),
                })
              }
            >
              {bulk.isPending ? "Applying…" : "Apply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LinkSheet
        link={selectedLink}
        open={selected !== null}
        onOpenChange={(open) => setSelected(open ? selected : null)}
      />
    </div>
  )
}

function LinkRow({
  link,
  onOpen,
  rowSelected,
  onToggleSelect,
}: {
  link: UrlListItem
  onOpen: () => void
  rowSelected: boolean
  onToggleSelect: () => void
}) {
  return (
    <tr
      onClick={onOpen}
      className={cn(
        "group cursor-pointer transition-colors duration-150",
        rowSelected
          ? "bg-brand/8 hover:bg-brand/10"
          : "even:bg-muted/40 hover:bg-accent/40 dark:even:bg-transparent"
      )}
    >
      <td className="w-full max-w-0 px-4 py-2.5">
        <div className="flex items-center gap-3">
          {/* Favicon <-> checkbox swap: no dedicated column, no dead gutter.
              Identity at rest, selection affordance on hover. */}
          <span
            className="relative size-7 shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <span
              className={cn(
                "absolute inset-0 transition-opacity duration-150",
                rowSelected ? "opacity-0" : "group-hover:opacity-0"
              )}
            >
              <Favicon url={link.long_url} />
            </span>
            <span
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-opacity duration-150",
                rowSelected
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100"
              )}
            >
              <Checkbox
                checked={rowSelected}
                onCheckedChange={onToggleSelect}
                aria-label={`Select ${link.alias}`}
              />
            </span>
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <span className="truncate font-medium font-mono text-[13px] text-foreground">
                {(link.domain ?? "spoo.me") + "/" + link.alias}
              </span>
              <CopyButton
                value={shortUrlOf(link)}
                trackAs="copy_short_link"
                className="opacity-0 transition-opacity duration-150 [tr:hover_&]:opacity-100"
              />
            </div>
            <div className="ph-no-capture truncate text-muted-foreground text-xs">
              {displayUrl(link.long_url)}
            </div>
          </div>
          <span className="ml-auto hidden shrink-0 items-center gap-0.5 sm:flex">
            {link.password_set && (
              <PropIcon
                icon={KeyRound}
                label="Visitors need a password to reach the destination."
              />
            )}
            {link.expire_after != null && (
              <PropIcon
                icon={Timer}
                label="Stops redirecting at a set moment."
              />
            )}
            {link.max_clicks != null && (
              <PropIcon
                icon={Gauge}
                label="Deactivates after a set number of clicks."
              />
            )}
            {link.private_stats && (
              <PropIcon
                icon={EyeOff}
                label="Only you can see this link's analytics."
              />
            )}
            {link.block_bots && (
              <PropIcon
                icon={Bot}
                label="Crawlers get a preview page, not the redirect."
              />
            )}
          </span>
        </div>
      </td>
      <td className="hidden whitespace-nowrap px-3 py-2.5 sm:table-cell">
        <StatusPill status={link.status} />
      </td>
      <td className="whitespace-nowrap px-3 py-2.5 text-right">
        <span className="font-medium font-mono text-[13px] text-foreground tabular-nums">
          {formatCount(link.total_clicks)}
        </span>
      </td>
      <td className="hidden whitespace-nowrap px-3 py-2.5 text-muted-foreground text-xs md:table-cell">
        {formatWhen(link.last_click)}
      </td>
      <td className="hidden whitespace-nowrap px-3 py-2.5 text-muted-foreground text-xs lg:table-cell">
        {formatWhen(link.created_at)}
      </td>
      <td className="px-2 py-2.5 text-right">
        <LinkActions link={link} />
      </td>
    </tr>
  )
}
