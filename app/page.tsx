import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
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
        <Hero />
        <DashboardPreview />
        <Features />
        <ConnectedApps />
        <Developer />
        <Testimonials />
        <SelfHost />
        <Stats />
        <CTA />
      </main>
      <Footer />
    </>
  )
}
