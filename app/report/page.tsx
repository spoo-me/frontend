import type { Metadata } from "next"
import { CircleCheck } from "lucide-react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageFrame, Section } from "@/components/shared/section-shell"
import { ReportForm } from "@/components/report/report-form"

/**
 * Abuse-report intake (thoughts/contact-report-pages.md §2). Reports are
 * the #1 reputation lever: every minute of reporting friction is added
 * report-to-resolution latency, so the single form stays minimal and the
 * bulk mode exists for the researchers arriving with a whole campaign.
 */

export const metadata: Metadata = {
  title: "Report a malicious link",
  description:
    "Report spoo.me short links used for phishing, malware, spam or illegal content. No account needed, and bulk reporting for researchers working a campaign.",
}

const promises = [
  "No account needed, reports can stay anonymous",
  "A human reviews every report, high-harm first",
  "Confirmed malicious links stop redirecting",
]

export default function ReportPage() {
  return (
    <>
      <Header />
      <main className="overflow-hidden pt-20">
        <PageFrame>
          <Section caption="Report abuse">
            <div className="grid lg:grid-cols-[1fr_1.2fr] lg:divide-x lg:divide-border/60">
              {/* Left — kept deliberately light: the form is the page. */}
              <div className="px-5 pt-28 pb-10 sm:px-9 lg:pb-20">
                <h1 className="text-balance font-semibold text-4xl text-foreground tracking-tight sm:text-5xl">
                  Report a malicious link.
                </h1>
                <p className="mt-5 max-w-md text-base text-muted-foreground leading-relaxed sm:text-lg">
                  Anyone can shorten anything on spoo.me — if a link sent you
                  somewhere harmful, tell us here.
                </p>

                <ul className="mt-8 flex flex-col gap-3">
                  {promises.map((p) => (
                    <li
                      key={p}
                      className="flex items-center gap-2.5 text-foreground/90 text-sm"
                    >
                      <CircleCheck className="size-4 shrink-0 text-live" />
                      {p}
                    </li>
                  ))}
                </ul>

                <p className="mt-10 text-muted-foreground text-sm">
                  Vulnerability in spoo.me itself?{" "}
                  <a
                    href="mailto:security@spoo.me"
                    className="font-medium font-mono text-[13px] text-foreground hover:underline"
                  >
                    security@spoo.me
                  </a>
                </p>
              </div>

              {/* Right — the intake form */}
              <div className="px-5 pb-20 sm:px-9 lg:pt-28">
                <div className="mx-auto max-w-xl">
                  <ReportForm />
                </div>
              </div>
            </div>
          </Section>
        </PageFrame>
      </main>
      <Footer />
    </>
  )
}
