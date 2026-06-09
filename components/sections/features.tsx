"use client"

import { useState, lazy, Suspense } from "react"
import {
  BarChart,
  Code,
  Globe,
  QrCode,
  Timer,
  Bell,
  Settings,
  Tag,
} from "lucide-react"

import { BentoCard, BentoGrid } from "@/components/magicui/bento-grid"
import { AnimatedList } from "@/components/magicui/animated-list"
import { SparklesCore } from "@/components/ui/sparkles"
import { Calendar } from "@/components/ui/calendar"
import { Skeleton } from "@/components/ui/skeleton"
import SimpleQr, { encodeData } from "simple-qrbtf"
import { SectionHeading } from "@/components/shared/section-heading"

const WorldMap = lazy(() => import("@/components/ui/world-map"))

interface NotificationProps {
  name: string
  description: string
  icon: string
  color: string
  time: string
}

const notifications = [
  {
    name: "Link clicked",
    description: "Your link was clicked 100 times",
    time: "15m ago",
    icon: "📈",
    color: "#9C4EFF",
  },
  {
    name: "Threshold reached",
    description: "Your campaign reached 1000 clicks",
    time: "1h ago",
    icon: "🎯",
    color: "#00C9A7",
  },
  {
    name: "New location",
    description: "Traffic from a new country detected",
    time: "3h ago",
    icon: "🌎",
    color: "#FFB800",
  },
  {
    name: "Conversion goal",
    description: "Conversion rate increased by 15%",
    time: "5h ago",
    icon: "🚀",
    color: "#FF3D71",
  },
]

const QRCodeDemo = () => {
  const qrData = encodeData({ text: "https://spoo.me/ga" })
  const qrCodeSvgSolid = SimpleQr.solid({ qrcode: qrData })

  return (
    <div className="absolute left-6 top-[-10px] origin-top scale-90 transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_30%,#000_100%)] group-hover:scale-100">
      <div
        className="border-border/60 bg-muted/40 rounded-lg border p-4"
        dangerouslySetInnerHTML={{ __html: qrCodeSvgSolid }}
      />
    </div>
  )
}

const DomainBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <SparklesCore
        id="tsparticles"
        background="transparent"
        minSize={0.6}
        maxSize={1.4}
        particleDensity={70}
        className="w-full h-full"
        particleColor="#8B5CF6"
      />
    </div>
  )
}

const APIDemo = () => {
  return (
    <div className="absolute right-10 top-10 origin-top scale-90 rounded-md border transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:scale-100">
      <div className="w-full max-w-xs bg-card/60 backdrop-blur-sm p-3 rounded-lg border border-border/60">
        <div className="flex items-center mb-2 gap-1">
          <div className="w-2 h-2 rounded-full bg-red-500/60"></div>
          <div className="w-2 h-2 rounded-full bg-yellow-500/60"></div>
          <div className="w-2 h-2 rounded-full bg-green-500/60"></div>
        </div>
        <div className="text-xs font-mono bg-background/60 p-2 rounded text-muted-foreground">
          <div>
            fetch(<span className="text-brand">&apos;api/shorten&apos;</span>,{"{"}
          </div>
          <div className="pl-4">
            method: <span className="text-foreground/90">&apos;POST&apos;</span>,
          </div>
          <div className="pl-4">body: JSON.stringify({"{"}</div>
          <div className="pl-8">
            url: <span className="text-brand">&apos;https://...&apos;</span>
          </div>
          <div className="pl-4">{"}"})</div>
          <div>{"}"});</div>
        </div>
      </div>
    </div>
  )
}

const CustomizationDemo = () => {
  const [activeColor, setActiveColor] = useState(0)
  const colors = ["#8A63D2", "#3694FF", "#FF7A50", "#00D0BF"]

  return (
    <div className="absolute left-4 top-8 scale-90 transition-all duration-300 ease-out group-hover:scale-100 [mask-image:linear-gradient(to_top,transparent_60%,#000_100%)] inset-0 flex justify-center p-4">
      <div className="flex flex-col items-center">
        <div className="w-40 h-12 bg-card/60 rounded-md mb-3 flex items-center justify-center border border-border/60 relative">
          <div
            className="absolute inset-x-0 -top-1 h-1 rounded-t-md"
            style={{ backgroundColor: colors[activeColor] }}
          ></div>
          <span className="text-sm font-medium">yourlink.co/brand</span>
        </div>
        <div className="flex space-x-2">
          {colors.map((color, index) => (
            <button
              key={index}
              className={`w-6 h-6 rounded-full border-2 transition-all ${activeColor === index ? "scale-110 border-foreground" : "border-transparent"}`}
              style={{ backgroundColor: color }}
              onClick={() => setActiveColor(index)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

const AnalyticsChart = () => {
  return (
    <div className="absolute right-1 top-2 h-[300px] w-full scale-75 border-none transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_10%,#000_100%)] group-hover:scale-90">
      <div className="flex items-end space-x-2">
        <Suspense
          fallback={
            <Skeleton className="h-[300px] w-full bg-card rounded-lg" />
          }
        >
          <WorldMap
            lineColor="#8B5CF6"
            dots={[
              { start: { lat: 64.2008, lng: -149.4937 }, end: { lat: 34.0522, lng: -118.2437 } },
              { start: { lat: 64.2008, lng: -149.4937 }, end: { lat: -15.7975, lng: -47.8919 } },
              { start: { lat: -15.7975, lng: -47.8919 }, end: { lat: 38.7223, lng: -9.1393 } },
              { start: { lat: 51.5074, lng: -0.1278 }, end: { lat: 28.6139, lng: 77.209 } },
              { start: { lat: 28.6139, lng: 77.209 }, end: { lat: 43.1332, lng: 131.9113 } },
              { start: { lat: 28.6139, lng: 77.209 }, end: { lat: -1.2921, lng: 36.8219 } },
            ]}
          />
        </Suspense>
      </div>
    </div>
  )
}

const Notification = ({
  name,
  description,
  icon,
  color,
  time,
}: NotificationProps) => {
  return (
    <figure className="border-border/60 bg-card/60 relative w-full max-w-[300px] cursor-pointer overflow-hidden rounded-xl border p-4 backdrop-blur-sm transition-all duration-200 hover:scale-[102%]">
      <div className="flex flex-row items-center gap-3">
        <div
          className="border-border/60 flex h-10 w-10 items-center justify-center rounded-xl border"
          style={{ backgroundColor: `${color}2e` }}
        >
          <span className="text-lg">{icon}</span>
        </div>
        <div className="flex flex-col overflow-hidden">
          <figcaption className="flex flex-row items-center whitespace-pre text-sm font-medium">
            <span>{name}</span>
            <span className="mx-1">·</span>
            <span className="text-xs text-muted-foreground">{time}</span>
          </figcaption>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </figure>
  )
}

const NotificationsList = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center p-4 overflow-hidden scale-90 border-none transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_0%,#000_30%)] group-hover:scale-100">
      <AnimatedList delay={2000}>
        {notifications.map((item, idx) => (
          <Notification key={idx} {...item} />
        ))}
      </AnimatedList>
    </div>
  )
}

export function Features() {
  const features = [
    {
      Icon: Globe,
      name: "Custom Domains",
      description:
        "Use your own domain for branded short links that build trust and recognition.",
      href: "#",
      cta: "Learn more",
      className: "col-span-3 lg:col-span-1",
      background: <DomainBackground />,
    },
    {
      Icon: QrCode,
      name: "QR Code Generation",
      description:
        "Generate custom QR codes for your shortened links with brand colors and logos.",
      href: "#",
      cta: "Learn more",
      className: "col-span-3 lg:col-span-1",
      background: <QRCodeDemo />,
    },
    {
      Icon: Tag,
      name: "Custom Link Aliases",
      description:
        "Create memorable, branded short links with custom aliases that reflect your brand or campaign.",
      href: "#",
      cta: "Learn more",
      className: "col-span-3 lg:col-span-2",
      background: (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
      ),
    },
    {
      Icon: BarChart,
      name: "Advanced Analytics",
      description:
        "Get detailed insights on clicks, locations, devices, and referrers to optimize your links.",
      href: "#",
      cta: "Learn more",
      className: "col-span-3 lg:col-span-2",
      background: <AnalyticsChart />,
    },
    {
      Icon: Timer,
      name: "Link Expiration",
      description:
        "Set expiration dates for temporary promotions or time-sensitive content.",
      href: "#",
      cta: "Learn more",
      className: "col-span-3 lg:col-span-1",
      background: (
        <Calendar
          mode="single"
          selected={new Date(2022, 4, 11, 12, 0, 0)}
          className="absolute right-0 top-10 origin-top scale-75 rounded-md border transition-all duration-300 ease-out [mask-image:linear-gradient(to_top,transparent_40%,#000_100%)] group-hover:scale-90"
        />
      ),
    },
    {
      Icon: Code,
      name: "Developer API",
      description:
        "Integrate link management into your applications with our RESTful API.",
      href: "#",
      cta: "Learn more",
      className: "col-span-3 lg:col-span-1",
      background: <APIDemo />,
    },
    {
      Icon: Tag,
      name: "UTM Builder",
      description:
        "Create and manage UTM parameters for campaign tracking without the hassle.",
      href: "#",
      cta: "Learn more",
      className: "col-span-3 lg:col-span-1",
      background: (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-50" />
      ),
    },
    {
      Icon: Bell,
      name: "Analytics Alerts",
      description:
        "Get notified when your links reach specific performance thresholds.",
      href: "#",
      cta: "Learn more",
      className: "col-span-3 lg:col-span-2",
      background: <NotificationsList />,
    },
    {
      Icon: Settings,
      name: "Customization",
      description:
        "Personalize link behavior, redirects, and appearance to match your brand.",
      href: "#",
      cta: "Learn more",
      className: "col-span-3 lg:col-span-1",
      background: <CustomizationDemo />,
    },
  ]

  return (
    <div className="relative px-5 py-24 sm:px-9 sm:py-28">
      <div>
        <SectionHeading
          title={
            <>
              Everything you need.{" "}
              <span className="text-muted-foreground italic [font-family:var(--font-serif)] font-normal">
                Nothing you don&apos;t.
              </span>
            </>
          }
          description="Built by developers shipping production traffic. Every feature has a reason it exists."
        />

        <div className="mx-auto mt-12 max-w-6xl">
          <BentoGrid className="grid-cols-1 lg:grid-cols-4 auto-rows-[18rem]">
            {features.map((feature, index) => (
              <BentoCard key={index} index={index} {...feature} />
            ))}
          </BentoGrid>
        </div>
      </div>
    </div>
  )
}
