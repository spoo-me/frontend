"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useTheme } from "next-themes"
import { Globe } from "lucide-react"

import { AnimatedBeam } from "@/components/magicui/animated-beam"

type DeployNode = {
  id: string
  name: string
  href: string
  /** devicon slug + variant — yields the CDN SVG */
  iconSlug?: string
  iconVariant?: string
  /** optional inline SVG icon, used when no CDN slug fits (e.g. custom domain) */
  CustomIcon?: React.ComponentType<{ className?: string }>
  /** brand color — used for beam tint */
  accent: string
  oneClick?: boolean
}

const deps: DeployNode[] = [
  {
    id: "mongo",
    name: "MongoDB",
    href: "https://github.com/spoo-me/spoo#mongodb",
    iconSlug: "mongodb",
    accent: "#00ED64",
  },
  {
    id: "redis",
    name: "Redis",
    href: "https://github.com/spoo-me/spoo#redis",
    iconSlug: "redis",
    accent: "#FF4438",
  },
  {
    id: "domain",
    name: "Your domain",
    href: "https://github.com/spoo-me/spoo#custom-domain",
    CustomIcon: Globe,
    accent: "#8B5CF6",
  },
]

const targets: DeployNode[] = [
  {
    id: "vercel",
    name: "Vercel",
    href: "https://vercel.com/new/clone?repository-url=https://github.com/spoo-me/spoo",
    iconSlug: "vercel",
    accent: "#ffffff",
    oneClick: true,
  },
  {
    id: "render",
    name: "Render",
    href: "https://render.com/deploy?repo=https://github.com/spoo-me/spoo",
    iconSlug: "render",
    accent: "#46E3B7",
    oneClick: true,
  },
  {
    id: "fly",
    name: "Fly.io",
    href: "https://fly.io/docs/launch/",
    iconSlug: "fly",
    accent: "#8B5CF6",
    oneClick: true,
  },
  {
    id: "railway",
    name: "Railway",
    href: "https://railway.app/template/spoo",
    iconSlug: "railway",
    accent: "#9333EA",
    oneClick: true,
  },
  {
    id: "docker",
    name: "Docker",
    href: "https://github.com/spoo-me/spoo#docker",
    iconSlug: "docker",
    accent: "#2496ED",
  },
]

const ICON_OVERRIDES: Record<string, string> = {
  fly: "https://cdn.simpleicons.org/flydotio/8B5CF6",
  render: "https://cdn.simpleicons.org/render/46E3B7",
  railway: "https://cdn.simpleicons.org/railway/9333EA",
}

function iconUrl(node: DeployNode, isDark: boolean): string | null {
  if (node.id === "vercel") {
    return `https://cdn.simpleicons.org/vercel/${isDark ? "white" : "black"}`
  }
  if (!node.iconSlug) return null
  if (ICON_OVERRIDES[node.id]) return ICON_OVERRIDES[node.id]
  const variant = node.iconVariant ?? "original"
  return `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${node.iconSlug}/${node.iconSlug}-${variant}.svg`
}

const IconTile = React.forwardRef<HTMLDivElement, { node: DeployNode }>(
  ({ node }, ref) => {
    const { resolvedTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => setMounted(true), [])
    const isDark = !mounted || resolvedTheme !== "light"
    const url = iconUrl(node, isDark)
    return (
      <div
        ref={ref}
        style={{ ["--accent" as string]: node.accent } as React.CSSProperties}
        className="relative z-10 flex size-12 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background shadow-sm transition-all group-hover:scale-105 group-hover:border-foreground/40"
      >
        {url ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={url}
            alt={node.name}
            className="size-6"
            loading="lazy"
            decoding="async"
          />
        ) : node.CustomIcon ? (
          <node.CustomIcon className="size-6 text-muted-foreground" />
        ) : null}
        {node.oneClick && (
          <span
            aria-hidden
            className="absolute -top-1.5 -right-1.5 rounded-full bg-emerald-500 px-1 font-bold font-mono text-[8px] text-background uppercase leading-tight"
          >
            1·click
          </span>
        )}
      </div>
    )
  }
)
IconTile.displayName = "IconTile"

const SpooNode = React.forwardRef<HTMLDivElement>((_, ref) => {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  React.useEffect(() => setMounted(true), [])
  const src =
    mounted && resolvedTheme === "light"
      ? "/brand/logo-black.png"
      : "/favicon.png"
  return (
    <div
      ref={ref}
      className="relative z-10 flex size-20 shrink-0 items-center justify-center rounded-2xl border border-border bg-background shadow-md"
    >
      <span
        aria-hidden
        className="absolute -inset-3 -z-10 rounded-3xl bg-[#8B5CF6]/25 blur-2xl"
      />
      <Image
        src={src}
        alt="spoo.me"
        width={48}
        height={48}
        className="size-10"
      />
    </div>
  )
})
SpooNode.displayName = "SpooNode"

export function DeployDiagram({
  onDockerClick,
}: {
  onDockerClick?: () => void
} = {}) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const spooRef = React.useRef<HTMLDivElement>(null)
  const depRefs = React.useRef<Array<React.RefObject<HTMLDivElement | null>>>(
    deps.map(() => React.createRef<HTMLDivElement | null>())
  )
  const targetRefs = React.useRef<
    Array<React.RefObject<HTMLDivElement | null>>
  >(targets.map(() => React.createRef<HTMLDivElement | null>()))

  return (
    <div
      ref={containerRef}
      className="relative mx-auto grid w-full max-w-4xl grid-cols-[1fr_auto_1fr] items-center gap-x-12 px-2 sm:gap-x-32 sm:px-6"
    >
      {/* LEFT — data deps + custom domain, icon outside, label inside */}
      <div className="flex flex-col items-start gap-6">
        {deps.map((d, i) => (
          <Link
            key={d.id}
            href={d.href}
            target="_blank"
            rel="noreferrer"
            title={d.name}
            className="group flex items-center gap-4"
          >
            <IconTile ref={depRefs.current[i]} node={d} />
            <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em] transition-colors group-hover:text-foreground">
              {d.name}
            </span>
          </Link>
        ))}
      </div>

      {/* CENTER */}
      <div className="flex justify-center">
        <SpooNode ref={spooRef} />
      </div>

      {/* RIGHT — deploy targets, label inside, icon outside */}
      <div className="flex flex-col items-end gap-6">
        {targets.map((t, i) => {
          const handlesDocker = t.id === "docker" && onDockerClick
          return (
            <Link
              key={t.id}
              href={t.href}
              target={handlesDocker ? undefined : "_blank"}
              rel={handlesDocker ? undefined : "noreferrer"}
              onClick={
                handlesDocker
                  ? (e) => {
                      e.preventDefault()
                      onDockerClick!()
                    }
                  : undefined
              }
              title={t.name + (t.oneClick ? " · 1-click deploy" : "")}
              className="group flex flex-row-reverse items-center gap-4"
            >
              <IconTile ref={targetRefs.current[i]} node={t} />
              <span className="font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em] transition-colors group-hover:text-foreground">
                {t.name}
              </span>
            </Link>
          )
        })}
      </div>

      {/* Beams: deps → spoo */}
      {deps.map((d, i) => (
        <AnimatedBeam
          key={`d-${d.id}`}
          containerRef={containerRef}
          fromRef={depRefs.current[i]}
          toRef={spooRef}
          duration={3.5}
          delay={i * 0.4}
          gradientStartColor={d.accent}
          gradientStopColor="#8B5CF6"
          pathOpacity={0.2}
        />
      ))}

      {/* Beams: spoo → targets */}
      {targets.map((t, i) => (
        <AnimatedBeam
          key={`t-${t.id}`}
          containerRef={containerRef}
          fromRef={spooRef}
          toRef={targetRefs.current[i]}
          duration={4}
          delay={0.2 + i * 0.18}
          gradientStartColor="#8B5CF6"
          gradientStopColor={t.accent}
          pathOpacity={0.2}
        />
      ))}
    </div>
  )
}
