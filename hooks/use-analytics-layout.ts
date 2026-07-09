"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  DEFAULT_LAYOUT,
  layoutsEqual,
  normalizeLayout,
  reorderVisible,
  withBlockConfig,
  withBlockReset,
  withHeroView,
  withHidden,
  withSpan,
  type AnalyticsLayout,
  type BlockConfig,
  type BlockId,
  type BlockSpan,
  type HeroView,
} from "@/lib/analytics-layout"
import { deletePageLayout, getPageLayout, putPageLayout } from "@/lib/api"

/**
 * Layout store: localStorage is the committed truth's local mirror (instant
 * paint, cross-tab via the storage event), the server doc wins over the
 * mirror once per mount, and structural edits live in a per-tab draft until
 * the save bar commits them. Pref-only changes (view/metric) skip the draft
 * and persist silently.
 */

const KEY = "spoo:layout:analytics"
const CHANGE_EVENT = "spoo:layout-analytics-change"
const PAGE = "analytics"
const PUT_DEBOUNCE_MS = 800

/* ---------- module-level localStorage store (use-auto-refresh pattern) ---------- */

// useSyncExternalStore needs referentially stable snapshots: re-parse only
// when the raw string actually changed.
let cache: { raw: string | null; value: AnalyticsLayout } | null = null

function readSaved(): AnalyticsLayout {
  const raw = localStorage.getItem(KEY)
  if (cache && cache.raw === raw) return cache.value
  let value: AnalyticsLayout
  if (raw == null) {
    value = DEFAULT_LAYOUT
  } else {
    try {
      value = normalizeLayout(JSON.parse(raw))
    } catch {
      value = DEFAULT_LAYOUT
    }
  }
  cache = { raw, value }
  return value
}

function writeSaved(next: AnalyticsLayout) {
  const raw = JSON.stringify(next)
  localStorage.setItem(KEY, raw)
  cache = { raw, value: next } // seed before notifying so snapshots are stable
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function clearSaved() {
  localStorage.removeItem(KEY)
  cache = { raw: null, value: DEFAULT_LAYOUT }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb) // other tabs
  window.addEventListener(CHANGE_EVENT, cb) // this tab
  return () => {
    window.removeEventListener("storage", cb)
    window.removeEventListener(CHANGE_EVENT, cb)
  }
}

export function useAnalyticsLayout() {
  const queryClient = useQueryClient()
  const saved = React.useSyncExternalStore(subscribe, readSaved, () => DEFAULT_LAYOUT)
  const [draft, setDraft] = React.useState<AnalyticsLayout | null>(null)
  const draftRef = React.useRef<AnalyticsLayout | null>(null)
  React.useEffect(() => {
    draftRef.current = draft
  })

  const layout = draft ?? saved
  const dirty = draft !== null

  /* ---------- server reconcile: once per mount, server wins over mirror ---------- */
  const serverQ = useQuery({
    queryKey: ["layout", PAGE],
    queryFn: () => getPageLayout(PAGE),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 1,
  })
  React.useEffect(() => {
    if (!serverQ.isSuccess || draftRef.current) return
    const server =
      serverQ.data.layout == null
        ? DEFAULT_LAYOUT
        : normalizeLayout(serverQ.data.layout)
    if (!layoutsEqual(server, readSaved())) writeSaved(server)
  }, [serverQ.isSuccess, serverQ.data])

  /* ---------- structural ops → draft ---------- */
  const applyStructural = React.useCallback(
    (op: (l: AnalyticsLayout) => AnalyticsLayout) => {
      setDraft((d) => {
        const base = readSaved()
        const next = op(d ?? base)
        // Landing back where you started (drag out and back, hide then
        // re-show) means there is nothing to save — the bar melts away.
        return layoutsEqual(next, base) ? null : next
      })
    },
    [],
  )

  /* ---------- pref ops → committed when clean, ride the draft when dirty ---------- */
  // If the silent PUT fails we keep the local mirror; the next mount's
  // server-wins reconcile may revert the pref. Accepted v1 tradeoff.
  const putTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const queuePut = React.useCallback((doc: AnalyticsLayout) => {
    clearTimeout(putTimer.current)
    putTimer.current = setTimeout(() => {
      putTimer.current = undefined
      putPageLayout(PAGE, doc)
        .then(() => queryClient.setQueryData(["layout", PAGE], { layout: doc }))
        .catch(() => {})
    }, PUT_DEBOUNCE_MS)
  }, [queryClient])
  React.useEffect(
    () => () => {
      // Flush a pending silent PUT when navigating away.
      if (putTimer.current !== undefined) {
        clearTimeout(putTimer.current)
        putPageLayout(PAGE, readSaved()).catch(() => {})
      }
    },
    [],
  )
  const applyPref = React.useCallback(
    (op: (l: AnalyticsLayout) => AnalyticsLayout) => {
      if (draftRef.current) {
        setDraft((d) => (d ? op(d) : d))
        return
      }
      const next = op(readSaved())
      writeSaved(next)
      queuePut(next)
    },
    [queuePut],
  )

  /* ---------- lifecycle ---------- */
  const saveMut = useMutation({
    mutationFn: (doc: AnalyticsLayout) => putPageLayout(PAGE, doc),
    onSuccess: (_res, doc) => {
      writeSaved(doc)
      setDraft(null)
      queryClient.setQueryData(["layout", PAGE], { layout: doc })
    },
    onError: () =>
      toast.error("Couldn't save the layout", {
        description: "Your changes are still here, try again.",
      }),
  })
  const resetMut = useMutation({
    mutationFn: () => deletePageLayout(PAGE),
    onSuccess: () => {
      clearSaved()
      setDraft(null)
      queryClient.setQueryData(["layout", PAGE], { layout: null })
      toast.success("Layout reset to default")
    },
    onError: () => toast.error("Couldn't reset the layout"),
  })

  const save = React.useCallback(() => {
    if (draftRef.current) saveMut.mutate(draftRef.current)
  }, [saveMut])
  const discard = React.useCallback(() => setDraft(null), [])
  const resetAll = React.useCallback(() => resetMut.mutate(), [resetMut])

  return {
    layout,
    saved,
    dirty,
    saving: saveMut.isPending || resetMut.isPending,
    // structural
    moveBlock: React.useCallback(
      (activeId: string, overId: string) =>
        applyStructural((l) => reorderVisible(l, activeId, overId)),
      [applyStructural],
    ),
    setSpan: React.useCallback(
      (id: BlockId, span: BlockSpan) => applyStructural((l) => withSpan(l, id, span)),
      [applyStructural],
    ),
    setHidden: React.useCallback(
      (id: BlockId, hidden: boolean) =>
        applyStructural((l) => withHidden(l, id, hidden)),
      [applyStructural],
    ),
    resetBlock: React.useCallback(
      (id: BlockId) => applyStructural((l) => withBlockReset(l, id)),
      [applyStructural],
    ),
    // prefs
    setBlockConfig: React.useCallback(
      (id: BlockId, patch: Partial<BlockConfig>) =>
        applyPref((l) => withBlockConfig(l, id, patch)),
      [applyPref],
    ),
    setHeroView: React.useCallback(
      (view: HeroView) => applyPref((l) => withHeroView(l, view)),
      [applyPref],
    ),
    // lifecycle
    save,
    discard,
    resetAll,
  }
}
