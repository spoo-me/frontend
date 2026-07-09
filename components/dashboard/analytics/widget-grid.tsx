"use client"

import * as React from "react"
// RGL's stylesheet is imported in app/globals.css so our restyles win the cascade.
import ReactGridLayout, {
  useContainerWidth,
  verticalCompactor,
  type Layout,
} from "react-grid-layout"

import { cn } from "@/lib/utils"
import { GRID, heightPx, WIDGET_SPEC, type Widget } from "@/lib/analytics-layout"

/**
 * The dashboard surface: react-grid-layout positions widgets from the layout
 * doc. Read mode renders a static grid; edit mode enables whole-surface drag,
 * SE resize, and click-to-select. Drafts commit from onDragStop/onResizeStop
 * ONLY — onLayoutChange fires on mount and is deliberately not wired.
 */
/** Mobile (<lg): read-only single column in reading order — no grid engine.
    Non-stat widgets keep their configured grid height. */
export function MobileStack({
  widgets,
  expandId,
  renderWidget,
}: {
  widgets: Widget[]
  expandId: string | null
  renderWidget: (w: Widget) => React.ReactNode
}) {
  const visible = expandId ? widgets.filter((w) => w.id === expandId) : widgets
  return (
    <div className="mt-5 flex flex-col gap-6 pb-8">
      {visible.map((w) => (
        <div
          key={w.id}
          style={
            w.kind === "stat" || expandId === w.id
              ? undefined
              : { height: heightPx(w.grid.h) }
          }
        >
          {renderWidget(w)}
        </div>
      ))}
    </div>
  )
}

export function WidgetGrid({
  widgets,
  editing,
  selectedId,
  expandId,
  onSelect,
  onGridChange,
  renderWidget,
}: {
  widgets: Widget[]
  editing: boolean
  /** Selection drives the edit bar's widget state (edit mode only). */
  selectedId: string | null
  /** Read-mode focus (?expand=): CSS hides siblings, un-positions this cell. */
  expandId: string | null
  onSelect: (id: string | null) => void
  onGridChange: (
    items: ReadonlyArray<{ i: string; x: number; y: number; w: number; h: number }>,
  ) => void
  renderWidget: (w: Widget) => React.ReactNode
}) {
  const { width, containerRef, mounted } = useContainerWidth()
  // A drag that ends over the origin still emits a click; this ref swallows it.
  const interacting = React.useRef(false)

  const layout: Layout = React.useMemo(
    () =>
      widgets.map((w) => ({
        i: w.id,
        ...w.grid,
        minW: WIDGET_SPEC[w.kind].minW,
        minH: WIDGET_SPEC[w.kind].minH,
      })),
    [widgets],
  )
  const commit = (l: Layout) =>
    onGridChange(l.map(({ i, x, y, w, h }) => ({ i, x, y, w, h })))

  return (
    <div
      ref={containerRef}
      data-expand={expandId ? "" : undefined}
      className={cn(
        "relative",
        editing && "pattern-dots select-none rounded-2xl",
      )}
    >
      {mounted && (
        <ReactGridLayout
          width={width}
          layout={layout}
          gridConfig={{
            cols: GRID.cols,
            rowHeight: GRID.rowHeight,
            margin: [GRID.marginX, GRID.marginY],
            containerPadding: [0, 0],
          }}
          dragConfig={{ enabled: editing, cancel: "[data-no-drag]", threshold: 4 }}
          resizeConfig={{ enabled: editing, handles: ["se"] }}
          compactor={verticalCompactor}
          onDragStart={() => {
            interacting.current = true
          }}
          onDragStop={(l) => {
            commit(l)
            requestAnimationFrame(() => {
              interacting.current = false
            })
          }}
          onResizeStart={() => {
            interacting.current = true
          }}
          onResizeStop={(l) => {
            commit(l)
            requestAnimationFrame(() => {
              interacting.current = false
            })
          }}
        >
          {widgets.map((w) => (
            <div
              key={w.id}
              data-widget-id={w.id}
              data-expanded={expandId === w.id ? "" : undefined}
              onClickCapture={
                editing
                  ? (e) => {
                      // Swallow only the click that trails a drag/resize so
                      // releasing a drag can't toggle a filter underneath.
                      if (interacting.current) {
                        e.stopPropagation()
                        e.preventDefault()
                        return
                      }
                      // Select without blocking: control clicks still land.
                      onSelect(w.id)
                    }
                  : undefined
              }
              className={cn(
                "group/widget",
                editing && "cursor-grab active:cursor-grabbing",
                editing &&
                  selectedId === w.id &&
                  "ring-foreground/25 ring-offset-background rounded-2xl ring-2 ring-offset-2",
              )}
            >
              {renderWidget(w)}
            </div>
          ))}
        </ReactGridLayout>
      )}
    </div>
  )
}
