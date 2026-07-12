import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageFrame, Section } from "@/components/shared/section-shell"

/**
 * Shared chrome for every /_error page: the marketing lattice with the
 * status code as a giant watermark behind the content (the footer
 * wordmark recipe, quieter). Bodies own everything inside.
 */
export function ErrorShell({
  status,
  caption,
  children,
}: {
  status: string
  caption: string
  children: React.ReactNode
}) {
  return (
    <>
      <Header />
      <main className="overflow-hidden pt-20">
        <PageFrame>
          <Section caption={caption}>
            <div className="relative min-h-[60dvh] px-5 py-24 sm:px-9 sm:py-28">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 flex select-none items-center justify-center overflow-hidden"
              >
                <span
                  className="whitespace-nowrap font-semibold text-foreground/[0.04] leading-none tracking-[-0.06em]"
                  style={{ fontSize: "clamp(10rem, 28vw, 22rem)" }}
                >
                  {status}
                </span>
              </div>
              <div className="relative mx-auto w-full max-w-2xl">
                {children}
              </div>
            </div>
          </Section>
        </PageFrame>
      </main>
      <Footer />
    </>
  )
}
