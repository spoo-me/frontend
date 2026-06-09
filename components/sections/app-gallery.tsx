"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

export function AppGallery({
  gallery,
  appName,
}: {
  gallery?: string[]
  appName: string
}) {
  const [index, setIndex] = React.useState<number | null>(null)
  const has = gallery && gallery.length > 0
  const total = gallery?.length ?? 0

  const next = React.useCallback(() => {
    setIndex((i) => (i === null ? i : (i + 1) % total))
  }, [total])

  const prev = React.useCallback(() => {
    setIndex((i) => (i === null ? i : (i - 1 + total) % total))
  }, [total])

  React.useEffect(() => {
    if (index === null) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") {
        e.preventDefault()
        next()
      } else if (e.key === "ArrowLeft") {
        e.preventDefault()
        prev()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [index, next, prev])

  return (
    <section className="mt-10">
      <div className="flex items-end justify-between">
        <h2 className="text-foreground text-lg font-semibold tracking-tight">
          Gallery
        </h2>
        {!has && <span className="text-muted-foreground text-xs">Coming soon</span>}
      </div>
      {has ? (
        <div className="mt-3 -mx-4 sm:-mx-6">
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 sm:px-6 [scrollbar-width:thin]">
            {gallery!.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setIndex(i)}
                className="group border-border/60 bg-card/40 hover:border-border focus-visible:ring-ring shadow-card relative aspect-[4/3] w-[78%] shrink-0 snap-start overflow-hidden rounded-xl border transition focus-visible:ring-2 focus-visible:outline-none sm:w-[60%] md:w-[44%] lg:w-[32%] dark:shadow-none"
                aria-label={`Expand ${appName} screenshot`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${appName} screenshot`}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
          <Skeleton className="aspect-[4/3] w-full rounded-xl" />
        </div>
      )}

      <Dialog open={index !== null} onOpenChange={(v) => !v && setIndex(null)}>
        <DialogContent
          showCloseButton
          className="bg-background w-[95vw] max-w-5xl p-2 sm:max-w-5xl"
        >
          <DialogTitle className="sr-only">
            {appName} screenshot {index !== null ? index + 1 : ""} of {total}
          </DialogTitle>
          {index !== null && gallery && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={gallery[index]}
                alt={`${appName} screenshot`}
                className="h-auto max-h-[85vh] w-full rounded-lg object-contain"
              />
              {total > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={prev}
                    aria-label="Previous"
                    className="bg-background/70 hover:bg-background absolute top-1/2 left-2 -translate-y-1/2 backdrop-blur"
                  >
                    <ChevronLeft className="size-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={next}
                    aria-label="Next"
                    className="bg-background/70 hover:bg-background absolute top-1/2 right-2 -translate-y-1/2 backdrop-blur"
                  >
                    <ChevronRight className="size-5" />
                  </Button>
                  <div className="bg-background/70 text-muted-foreground absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full px-2.5 py-1 font-mono text-[11px] backdrop-blur">
                    {index + 1} / {total}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
