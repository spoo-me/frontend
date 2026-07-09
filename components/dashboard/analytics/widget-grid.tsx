"use client"

import * as React from "react"
// RGL's stylesheet is imported in app/globals.css so our restyles win the cascade.
import ReactGridLayout, {
  useContainerWidth,
  verticalCompactor,
  type Layout,
} from "react-grid-layout"

import { cn } from "@/lib/utils"
import { GRID, WIDGET_SPEC, type Widget } from "@/lib/analytics-layout"

/**
 * The dashboard surface: react-grid-layout positions widgets from the layout
 * doc. Read mode renders a static grid; edit mode enables whole-surface drag,
 * SE resize, and click-to-select. Drafts commit from onDragStop/onResizeStop
 * ONLY — onLayoutChange fires on mount and is deliberately not wired.
 */
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
                      if (interacting.current) return
                      e.stopPropagation()
                      onSelect(w.id)
                    }
                  : undefined
              }
              className={cn(
                "group/widget",
                editing && "cursor-grab active:cursor-grabbing",
                editing &&
                  selectedId === w.id &&
                  "ring-brand/60 ring-offset-background rounded-2xl ring-2 ring-offset-2",
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
