"use client"

import { useState, lazy, Suspense } from "react"
import {
  BarChart,
  Code,
  Globe,
  Globe2,
  QrCode,
  Timer,
  Bell,
  Settings,
  Tag,
  TrendingUp,
  Webhook,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { BentoCard, BentoGrid } from "@/components/magicui/bento-grid"
import { AnimatedList } from "@/components/magicui/animated-list"
import { Skeleton } from "@/components/ui/skeleton"
import { BaseQr, encodeData } from "simple-qrbtf"
import { SectionHeading } from "@/components/shared/section-heading"
import { Band, GutterHatch } from "@/components/shared/section-shell"

const WorldMap = lazy(() => import("@/components/ui/world-map"))

interface NotificationProps {
  name: string
  description: string
  icon: LucideIcon
  time: string
}

const notifications: NotificationProps[] = [
  {
    name: "clicks.threshold",
    description: "spring/launch crossed 1,000 clicks",
    time: "2m",
    icon: TrendingUp,
  },
  {
    name: "geo.new_country",
    description: "First click from Japan detected",
    time: "1h",
    icon: Globe2,
  },
  {
    name: "webhook.delivered",
    description: "POST /hooks/slack returned 200",
    time: "3h",
    icon: Webhook,
  },
  {
    name: "link.expired",
    description: "spring-promo reached its end date",
    time: "5h",
    icon: Timer,
  },
]

const QRCodeDemo = () => {
  const qrData = encodeData({ text: "https://spoo.me/ga" })
  const svg = BaseQr({
    qrcode: qrData,
    otherColor: "currentColor",
    posColor: "currentColor",
  })

  return (
    <div className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_top,transparent_25%,#000_100%)]">
      <div
        aria-hidden
        className="pattern-dots absolute inset-x-4 top-2 h-44 opacity-70 [mask-image:radial-gradient(ellipse_75%_90%_at_50%_35%,black,transparent)]"
      />
      <div className="relative mt-4 flex justify-center">
        <div className="border-border/70 bg-card -rotate-3 rounded-xl border p-2.5 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.55)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-0">
          <div
            aria-label="QR code for spoo.me/ga"
            role="img"
            className="text-foreground/90 size-16 [&_svg]:size-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <div className="text-muted-foreground mt-1.5 text-center font-mono text-[9px]">
            spoo.me/ga
          </div>
        </div>
      </div>
    </div>
  )
}

/* Fanned mini link-cards on a dotted patch — branded domains as physical artifacts */
const DomainBackground = () => {
  const cards = [
    { host: "go.acme.dev", path: "/launch", rot: "-rotate-6", z: "z-10" },
    { host: "l.berlin.cafe", path: "/menu", rot: "rotate-1", z: "z-20" },
    { host: "spoo.me", path: "/ga", rot: "rotate-6", z: "z-30" },
  ]
  return (
    <div className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_top,transparent_30%,#000_100%)]">
      <div
        aria-hidden
        className="pattern-dots absolute inset-x-4 top-2 h-40 opacity-70 [mask-image:radial-gradient(ellipse_75%_90%_at_50%_35%,black,transparent)]"
      />
      <div className="relative mt-6 flex justify-center [mask-image:linear-gradient(to_right,transparent,black_18%,black_82%,transparent)]">
        {cards.map((c) => (
          <div
            key={c.host}
            className={`border-border/70 bg-card relative -ml-4 w-[7.5rem] origin-bottom rounded-lg border p-3 shadow-[0_12px_32px_-16px_rgba(0,0,0,0.55)] transition-transform duration-300 first:ml-0 group-hover:-translate-y-1 ${c.rot} ${c.z}`}
          >
            <div className="text-foreground truncate font-mono text-[10px] font-medium">
              {c.host}
            </div>
            <div className="text-muted-foreground font-mono text-[10px]">{c.path}</div>
            <div className="bg-brand/50 mt-2.5 h-1 w-3/4 rounded-full" />
            <div className="bg-muted mt-1 h-1 w-1/2 rounded-full" />
          </div>
        ))}
      </div>
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

/* Lifecycle timeline with dashed spine — created → live threshold → expiry */
const ExpiryTimeline = () => {
  const stops = [
    { time: "mar 14", label: "link created", card: false },
    { time: "apr 02", label: "+1,000 clicks", card: true },
    { time: "in 30 days", label: "expires", card: false },
  ]
  return (
    <div className="absolute inset-x-6 top-6 transition-transform duration-300 group-hover:-translate-y-1 [mask-image:linear-gradient(to_top,transparent_25%,#000_100%)]">
      <ul className="border-border/80 ml-1.5 flex flex-col gap-3.5 border-l border-dashed pl-4">
        {stops.map((s) => (
          <li key={s.label} className="relative">
            <span
              aria-hidden
              className={`absolute -left-[21.5px] top-1.5 size-2 rounded-full border ${
                s.card
                  ? "border-brand bg-brand/40"
                  : "border-border bg-background"
              }`}
            />
            <div className="text-muted-foreground/70 font-mono text-[10px]">{s.time}</div>
            {s.card ? (
              <div className="border-border/70 bg-card group-hover:border-border mt-1 inline-flex items-center gap-2 rounded-lg border px-2.5 py-1.5 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.5)] transition-colors duration-300">
                <span className="text-foreground font-mono text-xs font-medium">
                  {s.label}
                </span>
                <span className="bg-live relative inline-flex size-1.5 rounded-full" />
              </div>
            ) : (
              <div className="text-foreground mt-0.5 text-xs font-medium">{s.label}</div>
            )}
          </li>
        ))}
      </ul>
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

const Notification = ({ name, description, icon: Icon, time }: NotificationProps) => {
  return (
    <figure className="border-border/60 bg-card/80 relative w-full max-w-[300px] cursor-pointer overflow-hidden rounded-xl border p-3 shadow-[0_8px_24px_-16px_rgba(0,0,0,0.5)] backdrop-blur-sm transition-all duration-200 hover:scale-[102%]">
      <div className="flex flex-row items-center gap-3">
        <div className="border-border/60 bg-muted/40 flex size-9 shrink-0 items-center justify-center rounded-lg border">
          <Icon className="text-foreground size-4" />
        </div>
        <div className="flex min-w-0 flex-col overflow-hidden">
          <figcaption className="flex items-baseline gap-2 whitespace-pre">
            <code className="text-foreground font-mono text-xs font-medium">{name}</code>
            <span className="text-muted-foreground/60 font-mono text-[10px]">{time}</span>
          </figcaption>
          <p className="text-muted-foreground truncate text-xs">{description}</p>
        </div>
      </div>
    </figure>
  )
}

/* Alias picker — floating input artifact with crop-mark selection + suggestion chips */
const AliasDemo = () => {
  return (
    <div className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_top,transparent_20%,#000_100%)]">
      <div
        aria-hidden
        className="pattern-dots absolute inset-x-10 top-2 h-40 opacity-70 [mask-image:radial-gradient(ellipse_60%_90%_at_50%_30%,black,transparent)]"
      />
      <div className="relative mt-7 flex flex-col items-center gap-2.5">
        <div className="border-border/70 bg-card flex items-center gap-1 rounded-xl border px-4 py-2.5 font-mono text-sm shadow-[0_12px_32px_-16px_rgba(0,0,0,0.55)] transition-transform duration-300 group-hover:-translate-y-0.5">
          <span className="text-muted-foreground/70">spoo.me/</span>
          {/* crop-mark selection frame */}
          <span className="relative px-2 py-0.5">
            <span aria-hidden className="border-foreground/50 absolute top-0 left-0 size-1.5 border-t border-l" />
            <span aria-hidden className="border-foreground/50 absolute top-0 right-0 size-1.5 border-t border-r" />
            <span aria-hidden className="border-foreground/50 absolute bottom-0 left-0 size-1.5 border-b border-l" />
            <span aria-hidden className="border-foreground/50 absolute right-0 bottom-0 size-1.5 border-r border-b" />
            <span className="text-foreground font-medium">spring-launch</span>
          </span>
          <span className="bg-foreground/70 animate-blink-cursor h-4 w-px" />
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px]">
          <span className="border-live/30 text-live bg-live/10 inline-flex items-center gap-1.5 rounded-md border px-2 py-1">
            <span className="bg-live size-1 rounded-full" />
            available
          </span>
          <span className="border-border/60 text-muted-foreground/50 rounded-md border px-2 py-1 line-through">
            launch
          </span>
          <span className="border-border/60 text-muted-foreground/50 rounded-md border px-2 py-1 line-through">
            spring
          </span>
        </div>
      </div>
    </div>
  )
}

/* UTM chips on a hatched patch */
const UtmDemo = () => {
  const params = ["utm_source=launch", "utm_medium=qr", "utm_campaign=spring"]
  return (
    <div className="absolute inset-0 overflow-hidden [mask-image:linear-gradient(to_top,transparent_30%,#000_100%)]">
      <div
        aria-hidden
        className="pattern-hatch absolute inset-x-4 top-2 h-36 opacity-50 [mask-image:radial-gradient(ellipse_80%_90%_at_50%_30%,black,transparent)]"
      />
      <div className="relative mt-7 flex flex-col items-center gap-2">
        {params.map((p, i) => (
          <code
            key={p}
            className={`border-border/70 bg-card text-foreground/90 rounded-md border px-2.5 py-1 font-mono text-[10px] shadow-[0_8px_24px_-16px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:-translate-y-0.5 ${
              i === 1 ? "translate-x-6" : i === 2 ? "-translate-x-4" : ""
            }`}
          >
            {p}
          </code>
        ))}
      </div>
    </div>
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
      className: "col-span-1 lg:col-span-1",
      background: <DomainBackground />,
    },
    {
      Icon: QrCode,
      name: "QR Code Generation",
      description:
        "Generate custom QR codes for your shortened links with brand colors and logos.",
      className: "col-span-1 lg:col-span-1",
      background: <QRCodeDemo />,
    },
    {
      Icon: Tag,
      name: "Custom Link Aliases",
      description:
        "Create memorable, branded short links with custom aliases that reflect your brand or campaign.",
      className: "col-span-1 lg:col-span-2",
      background: <AliasDemo />,
    },
    {
      Icon: BarChart,
      name: "Advanced Analytics",
      description:
        "Get detailed insights on clicks, locations, devices, and referrers to optimize your links.",
      className: "col-span-1 lg:col-span-2",
      background: <AnalyticsChart />,
    },
    {
      Icon: Timer,
      name: "Link Expiration",
      description:
        "Set expiration dates for temporary promotions or time-sensitive content.",
      className: "col-span-1 lg:col-span-1",
      background: <ExpiryTimeline />,
    },
    {
      Icon: Code,
      name: "Developer API",
      description:
        "Integrate link management into your applications with our RESTful API.",
      className: "col-span-1 lg:col-span-1",
      background: <APIDemo />,
    },
    {
      Icon: Tag,
      name: "UTM Builder",
      description:
        "Create and manage UTM parameters for campaign tracking without the hassle.",
      className: "col-span-1 lg:col-span-1",
      background: <UtmDemo />,
    },
    {
      Icon: Bell,
      name: "Analytics Alerts",
      description:
        "Get notified when your links reach specific performance thresholds.",
      className: "col-span-1 lg:col-span-2",
      background: <NotificationsList />,
    },
    {
      Icon: Settings,
      name: "Customization",
      description:
        "Personalize link behavior, redirects, and appearance to match your brand.",
      className: "col-span-1 lg:col-span-1",
      background: <CustomizationDemo />,
    },
  ]

  return (
    <>
      {/* Header band */}
      <Band className="px-5 py-20 sm:px-9 sm:py-24">
        <SectionHeading
          num="02"
          caption="Features"
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
      </Band>

      {/* Bento fused into the lattice — cells share hairlines, edge-to-rail */}
      <Band rule>
        <GutterHatch />
        <BentoGrid className="grid-cols-1 lg:grid-cols-4 auto-rows-[18rem]">
          {features.map((feature, index) => (
            <BentoCard key={index} index={index} {...feature} />
          ))}
        </BentoGrid>
      </Band>
    </>
  )
}
