import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { PageFrame, Section } from "@/components/shared/section-shell"
import { Hero } from "@/components/sections/hero"
import { Features } from "@/components/sections/features"
import { DashboardPreview } from "@/components/sections/dashboard-preview"
import { ConnectedApps } from "@/components/sections/connected-apps"
import { Developer } from "@/components/sections/developer"
import { Testimonials } from "@/components/sections/testimonials"
import { SelfHost } from "@/components/sections/self-host"
import { Stats } from "@/components/sections/stats"
import { CTA } from "@/components/sections/cta"

export default function HomePage() {
  return (
    <>
      <Header />
      <main className="overflow-hidden">
        <PageFrame>
          <Hero />
          <Section caption="Analytics" id="analytics">
            <DashboardPreview />
          </Section>
          <Section caption="Features" id="features">
            <Features />
          </Section>
          <Section caption="Ecosystem" id="apps">
            <ConnectedApps />
          </Section>
          <Section caption="Developers" id="developers">
            <Developer />
          </Section>
          <Section caption="Builders">
            <Testimonials />
          </Section>
          <Section caption="Self-host" id="self-host">
            <SelfHost />
          </Section>
          <Section caption="Scale">
            <Stats />
          </Section>
          <Section caption="Get started">
            <CTA />
          </Section>
        </PageFrame>
      </main>
      <Footer />
    </>
  )
}
