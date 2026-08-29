import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageFrame, Section } from "@/components/shared/section-shell"
import { Hero } from "@/components/sections/hero"
import { Features } from "@/components/sections/features"
import { DashboardHero } from "@/components/sections/dashboard-hero"
import { AnalyticsQueryDemo } from "@/components/sections/analytics-query-demo"
import { ConnectedApps } from "@/components/sections/connected-apps"
import { Developer } from "@/components/sections/developer"
import { Testimonials } from "@/components/sections/testimonials"
import { SelfHost } from "@/components/sections/self-host"
import { Stats } from "@/components/sections/stats"
import { Faq } from "@/components/sections/faq"
import { CTA } from "@/components/sections/cta"

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <PageFrame>
          <Hero />
          {/* Chapter captions live inside each section's header band */}
          <Section id="analytics">
            <DashboardHero />
            <AnalyticsQueryDemo />
          </Section>
          <Section id="features">
            <Features />
          </Section>
          <Section id="apps">
            <ConnectedApps />
          </Section>
          <Section id="developers">
            <Developer />
          </Section>
          <Section>
            <Testimonials />
          </Section>
          <Section id="self-host">
            <SelfHost />
          </Section>
          <Section>
            <Stats />
          </Section>
          <Section>
            <Faq />
          </Section>
          <Section>
            <CTA />
          </Section>
        </PageFrame>
      </main>
      <Footer />
    </>
  )
}
