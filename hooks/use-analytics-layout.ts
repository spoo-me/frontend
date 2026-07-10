"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"

import {
  applyGridChange,
  DEFAULT_LAYOUT,
  layoutsEqual,
  newWidgetId,
  normalizeLayout,
  withWidgetAdded,
  withWidgetConfig,
  withWidgetDuplicated,
  withWidgetRemoved,
  withWidgetReset,
  type AnalyticsLayout,
  type WidgetConfigPatch,
  type WidgetKind,
} from "@/lib/analytics-layout"
import { trackBoardLayoutReset, trackWidgetAdded } from "@/lib/analytics"
import { deletePageLayout, getPageLayout, putPageLayout } from "@/lib/api"

/**
 * Layout store: every edit commits immediately — localStorage mirror for
 * instant paint and cross-tab sync, a debounced PUT for the server. Safety
 * comes from a session-scoped undo/redo history (docs are tiny and every op
 * is a pure function), not from a draft/save ceremony.
 */

const KEY = "spoo:layout:analytics"
const CHANGE_EVENT = "spoo:layout-analytics-change"
const PAGE = "analytics"
const PUT_DEBOUNCE_MS = 800
const HISTORY_LIMIT = 50

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
  const layout = React.useSyncExternalStore(subscribe, readSaved, () => DEFAULT_LAYOUT)

  /* ---------- server reconcile: once per mount, server wins over mirror ---------- */
  const serverQ = useQuery({
    queryKey: ["layout", PAGE],
    queryFn: () => getPageLayout(PAGE),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 1,
  })
  React.useEffect(() => {
    if (!serverQ.isSuccess) return
    const server =
      serverQ.data.layout == null
        ? DEFAULT_LAYOUT
        : normalizeLayout(serverQ.data.layout)
    if (!layoutsEqual(server, readSaved())) writeSaved(server)
  }, [serverQ.isSuccess, serverQ.data])

  /* ---------- debounced write-behind ---------- */
  // If a PUT fails we keep the local mirror; the next mount's server-wins
  // reconcile may revert. Accepted tradeoff, same as before.
  const putTimer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const queuePut = React.useCallback(
    (doc: AnalyticsLayout) => {
      clearTimeout(putTimer.current)
      putTimer.current = setTimeout(() => {
        putTimer.current = undefined
        putPageLayout(PAGE, doc)
          .then(() => queryClient.setQueryData(["layout", PAGE], { layout: doc }))
          .catch(() => {})
      }, PUT_DEBOUNCE_MS)
    },
    [queryClient],
  )
  React.useEffect(
    () => () => {
      // Flush a pending PUT when navigating away.
      if (putTimer.current !== undefined) {
        clearTimeout(putTimer.current)
        putPageLayout(PAGE, readSaved()).catch(() => {})
      }
    },
    [],
  )

  /* ---------- history ---------- */
  const undoStack = React.useRef<AnalyticsLayout[]>([])
  const redoStack = React.useRef<AnalyticsLayout[]>([])
  // Mirrored into state so render never reads the refs directly.
  const [history, setHistory] = React.useState({ canUndo: false, canRedo: false })
  const bumpHistory = React.useCallback(() => {
    setHistory({
      canUndo: undoStack.current.length > 0,
      canRedo: redoStack.current.length > 0,
    })
  }, [])

  const apply = React.useCallback(
    (op: (l: AnalyticsLayout) => AnalyticsLayout) => {
      const cur = readSaved()
      const next = op(cur)
      if (layoutsEqual(next, cur)) return
      undoStack.current.push(cur)
      if (undoStack.current.length > HISTORY_LIMIT) undoStack.current.shift()
      redoStack.current = []
      bumpHistory()
      writeSaved(next)
      queuePut(next)
    },
    [queuePut, bumpHistory],
  )

  const undo = React.useCallback(() => {
    const prev = undoStack.current.pop()
    if (!prev) return
    redoStack.current.push(readSaved())
    bumpHistory()
    writeSaved(prev)
    queuePut(prev)
  }, [queuePut, bumpHistory])

  const redo = React.useCallback(() => {
    const next = redoStack.current.pop()
    if (!next) return
    undoStack.current.push(readSaved())
    bumpHistory()
    writeSaved(next)
    queuePut(next)
  }, [queuePut, bumpHistory])

  /* ---------- reset (the one op behind a confirmation) ---------- */
  const resetMut = useMutation({
    mutationFn: () => deletePageLayout(PAGE),
    onMutate: () => {
      // Reset is undoable too: the previous doc restores via a normal PUT.
      undoStack.current.push(readSaved())
      redoStack.current = []
      bumpHistory()
    },
    onSuccess: () => {
      trackBoardLayoutReset(PAGE)
      clearSaved()
      queryClient.setQueryData(["layout", PAGE], { layout: null })
      toast.success("Layout reset to default")
    },
    onError: () => toast.error("Couldn't reset the layout"),
  })

  return {
    layout,
    saving: resetMut.isPending,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    undo,
    redo,
    applyGridChange: React.useCallback(
      (items: ReadonlyArray<{ i: string; x: number; y: number; w: number; h: number }>) =>
        apply((l) => applyGridChange(l, items)),
      [apply],
    ),
    addWidget: React.useCallback(
      (kind: WidgetKind, seed?: WidgetConfigPatch) => {
        const id = newWidgetId()
        apply((l) => withWidgetAdded(l, kind, id, seed))
        trackWidgetAdded(kind, PAGE)
        return id
      },
      [apply],
    ),
    removeWidget: React.useCallback(
      (id: string) => apply((l) => withWidgetRemoved(l, id)),
      [apply],
    ),
    duplicateWidget: React.useCallback(
      (id: string) => {
        const nid = newWidgetId()
        apply((l) => withWidgetDuplicated(l, id, nid))
        return nid
      },
      [apply],
    ),
    resetWidget: React.useCallback(
      (id: string) => apply((l) => withWidgetReset(l, id)),
      [apply],
    ),
    updateWidgetConfig: React.useCallback(
      (id: string, patch: WidgetConfigPatch) =>
        apply((l) => withWidgetConfig(l, id, patch)),
      [apply],
    ),
    /** Import a whole doc (export/import); runs through normalize. */
    replaceLayout: React.useCallback(
      (doc: unknown) => apply(() => normalizeLayout(doc)),
      [apply],
    ),
    resetAll: React.useCallback(() => resetMut.mutate(), [resetMut]),
  }
}
