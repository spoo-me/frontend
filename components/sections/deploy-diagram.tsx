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
}

/* Every node lands on its walkthrough in the docs — a considered deploy,
   not a one-click promise the configs can't keep. */
const SELF_HOST_DOCS = "https://docs.spoo.me/self-hosting"

const deps: DeployNode[] = [
  {
    id: "mongo",
    name: "MongoDB",
    href: `${SELF_HOST_DOCS}/setting-up-mongo`,
    iconSlug: "mongodb",
    accent: "#00ED64",
  },
  {
    id: "redis",
    name: "Redis",
    href: `${SELF_HOST_DOCS}/setting-up-redis`,
    iconSlug: "redis",
    accent: "#FF4438",
  },
  {
    id: "domain",
    name: "Your domain",
    href: `${SELF_HOST_DOCS}/introduction`,
    CustomIcon: Globe,
    accent: "#8B5CF6",
  },
]

const targets: DeployNode[] = [
  {
    id: "vercel",
    name: "Vercel",
    href: `${SELF_HOST_DOCS}/cloud-deployment#method-1-vercel-deployment-recommended`,
    iconSlug: "vercel",
    accent: "#ffffff",
  },
  {
    id: "render",
    name: "Render",
    href: `${SELF_HOST_DOCS}/cloud-deployment#method-3-render-deployment`,
    iconSlug: "render",
    accent: "#46E3B7",
  },
  {
    id: "koyeb",
    name: "Koyeb",
    href: `${SELF_HOST_DOCS}/cloud-deployment#method-4-koyeb-deployment`,
    iconSlug: "koyeb",
    accent: "#8B5CF6",
  },
  {
    id: "railway",
    name: "Railway",
    href: `${SELF_HOST_DOCS}/cloud-deployment#method-2-railway-deployment`,
    iconSlug: "railway",
    accent: "#9333EA",
  },
  {
    id: "docker",
    name: "Docker",
    href: `${SELF_HOST_DOCS}/docker-deployment`,
    iconSlug: "docker",
    accent: "#2496ED",
  },
]

const ICON_OVERRIDES: Record<string, string> = {
  render: "https://cdn.simpleicons.org/render/46E3B7",
  railway: "https://cdn.simpleicons.org/railway/9333EA",
}

function iconUrl(node: DeployNode, isDark: boolean): string | null {
  if (node.id === "vercel" || node.id === "koyeb") {
    return `https://cdn.simpleicons.org/${node.iconSlug}/${isDark ? "white" : "black"}`
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
      className="relative mx-auto grid w-full max-w-4xl grid-cols-[1fr_auto_1fr] items-center gap-x-8 px-2 sm:gap-x-32 sm:px-6"
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
            <span className="hidden font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em] transition-colors group-hover:text-foreground sm:inline">
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
              title={t.name}
              className="group flex flex-row-reverse items-center gap-4"
            >
              <IconTile ref={targetRefs.current[i]} node={t} />
              <span className="hidden font-mono text-[11px] text-muted-foreground uppercase tracking-[0.18em] transition-colors group-hover:text-foreground sm:inline">
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
