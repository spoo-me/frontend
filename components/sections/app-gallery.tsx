"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

export function AppGallery({
  gallery,
  appName,
  natural = false,
}: {
  gallery?: string[]
  appName: string
  /**
   * Row of uniform height with each image at its own aspect, for sets
   * mixing portrait phone shots with landscape group pages. Cropping
   * them to one tile aspect would cut either kind to a strip.
   */
  natural?: boolean
}) {
  const [index, setIndex] = React.useState<number | null>(null)
  const has = gallery && gallery.length > 0
  const total = gallery?.length ?? 0
  const tile = natural
    ? "h-[300px] sm:h-[360px] lg:h-[420px]"
    : "aspect-[4/3] w-[78%] sm:w-[60%] md:w-[44%] lg:w-[32%]"

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
        <h2 className="font-semibold text-foreground text-lg tracking-tight">
          Gallery
        </h2>
        {!has && (
          <span className="text-muted-foreground text-xs">Coming soon</span>
        )}
      </div>
      {has ? (
        <div className="-mx-4 mt-3 sm:-mx-6">
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-3 [scrollbar-width:thin] sm:px-6">
            {gallery!.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setIndex(i)}
                className={`group relative ${tile} shrink-0 snap-start overflow-hidden rounded-xl border border-border/60 bg-card/40 shadow-card transition hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:shadow-none`}
                aria-label={`Expand ${appName} screenshot`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={`${appName} screenshot`}
                  className={`h-full transition duration-300 group-hover:scale-[1.02] ${natural ? "w-auto" : "w-full object-cover"}`}
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div
          className={`mt-3 grid gap-3 ${natural ? "grid-cols-3 sm:grid-cols-4 lg:grid-cols-5" : "sm:grid-cols-2 lg:grid-cols-3"}`}
        >
          {[0, 1, 2].map((i) => (
            <Skeleton
              key={i}
              className={`w-full rounded-xl ${natural ? "aspect-[9/20]" : "aspect-[4/3]"}`}
            />
          ))}
        </div>
      )}

      <Dialog open={index !== null} onOpenChange={(v) => !v && setIndex(null)}>
        <DialogContent
          showCloseButton
          className="w-[95vw] max-w-5xl bg-background p-2 sm:max-w-5xl"
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
                    className="absolute top-1/2 left-2 -translate-y-1/2 bg-background/70 backdrop-blur hover:bg-background"
                  >
                    <ChevronLeft className="size-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={next}
                    aria-label="Next"
                    className="absolute top-1/2 right-2 -translate-y-1/2 bg-background/70 backdrop-blur hover:bg-background"
                  >
                    <ChevronRight className="size-5" />
                  </Button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-background/70 px-2.5 py-1 font-mono text-[11px] text-muted-foreground backdrop-blur">
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
