import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { FishermanGlyph } from "@/components/errors/fisherman"

/**
 * Shared chrome for every /_error page: deliberately NO lattice frame —
 * an error page is a moment, not a chapter. Header, the status code as a
 * giant watermark, vertically centered body, one hairline before the
 * footer, footer.
 *
 * The 404 gets the scene treatment: the fisherman replaces the last
 * numeral, his line sinks past the hairline (the waterline) and the hook
 * hangs inside the footer behind a glass band. The blur is water, not
 * decoration — the one place glassmorphism means something.
 */
export function ErrorShell({
  status,
  fisher,
  watermark,
  children,
}: {
  status: string
  /** 404-only: the fisherman-as-glyph scene with the sunken line. */
  fisher?: boolean
  /** Replaces the status numeral in the watermark slot (same faded ink). */
  watermark?: React.ReactNode
  children: React.ReactNode
}) {
  if (!fisher) {
    return (
      <>
        <Header />
        {/* The bottom hairline stands in for the lattice's closing rule —
            without it the footer starts unannounced. */}
        <main className="overflow-hidden border-border/60 border-b pt-20">
          <div className="relative flex min-h-[72dvh] items-center px-5 py-24 sm:px-9">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 flex select-none items-center justify-center overflow-hidden"
            >
              {watermark ?? (
                <span
                  className="whitespace-nowrap font-semibold text-foreground/[0.04] leading-none tracking-[-0.06em]"
                  style={{ fontSize: "clamp(12rem, 32vw, 26rem)" }}
                >
                  {status}
                </span>
              )}
            </div>
            <div className="relative mx-auto w-full max-w-3xl">{children}</div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Header />
      {/* One wrapper spans main + footer so the fishing line can cross the
          waterline; it clips the scene at the page's end. */}
      <div className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 select-none"
        >
          {/* Below sm the scene has no room: the glyph clips off the
              viewport and the line runs through the copy — mobile gets
              the plain numeral instead. */}
          <div
            className="absolute top-[calc(5rem+42dvh)] left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center whitespace-nowrap font-semibold text-foreground/[0.04] leading-none tracking-[-0.06em] sm:hidden"
            style={{ fontSize: "clamp(12rem, 32vw, 26rem)" }}
          >
            <span>404</span>
          </div>
          <div
            className="absolute top-[calc(5rem+36dvh)] left-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center font-semibold text-foreground/[0.04] leading-none tracking-[-0.06em] sm:flex"
            style={{ fontSize: "clamp(12rem, 32vw, 26rem)" }}
          >
            <span>40</span>
            {/* The last numeral's slot; the glyph overflows it downward. */}
            <span className="relative inline-block h-[1em] w-[0.62em]">
              <FishermanGlyph className="absolute top-[0.16em] left-0 w-full text-foreground/15" />
            </span>
          </div>
        </div>
        <main className="relative border-border/60 border-b pt-20">
          <div className="relative flex min-h-[72dvh] items-center px-5 py-24 sm:px-9">
            <div className="relative mx-auto w-full max-w-3xl">{children}</div>
          </div>
        </main>
        <div className="relative">
          {/* The water: a glass band under the footer content, blurring the
              sunken line behind it, fading with depth. sm+ only — water
              without a line above it means nothing. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 hidden h-72 bg-background/30 backdrop-blur-[2px] [mask-image:linear-gradient(to_bottom,black,transparent)] sm:block"
          />
          <Footer />
        </div>
      </div>
    </>
  )
}
