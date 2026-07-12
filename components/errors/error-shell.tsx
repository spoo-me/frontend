import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"

/**
 * Shared chrome for every /_error page: deliberately NO lattice frame —
 * an error page is a moment, not a chapter. Header, the status code as a
 * giant watermark, vertically centered body, footer.
 */
export function ErrorShell({
  status,
  children,
}: {
  status: string
  children: React.ReactNode
}) {
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
            <span
              className="whitespace-nowrap font-semibold text-foreground/[0.04] leading-none tracking-[-0.06em]"
              style={{ fontSize: "clamp(12rem, 32vw, 26rem)" }}
            >
              {status}
            </span>
          </div>
          <div className="relative mx-auto w-full max-w-3xl">{children}</div>
        </div>
      </main>
      <Footer />
    </>
  )
}
