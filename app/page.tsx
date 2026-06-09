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
          <Section num="01" caption="Analytics" id="analytics">
            <DashboardPreview />
          </Section>
          <Section num="02" caption="Features" id="features">
            <Features />
          </Section>
          <Section num="03" caption="Ecosystem" id="apps">
            <ConnectedApps />
          </Section>
          <Section num="04" caption="Developers" id="developers">
            <Developer />
          </Section>
          <Section num="05" caption="Builders">
            <Testimonials />
          </Section>
          <Section num="06" caption="Self-host" id="self-host">
            <SelfHost />
          </Section>
          <Section num="07" caption="Scale">
            <Stats />
          </Section>
          <Section num="08" caption="Get started">
            <CTA />
          </Section>
        </PageFrame>
      </main>
      <Footer />
    </>
  )
}
