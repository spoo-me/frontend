/* Brand icons — monochrome, sized via className.
   Sourced from Simple Icons (via react-icons/si) plus a couple of
   in-house SVGs for marks Simple Icons doesn't ship.
*/

import * as React from "react"
import {
  SiAndroid,
  SiApple,
  SiCplusplus,
  SiDiscord,
  SiGithub,
  SiGo,
  SiInstagram,
  SiN8N,
  SiProducthunt,
  SiPython,
  SiRaycast,
  SiRust,
  SiTelegram,
  SiTypescript,
  SiX,
  SiZapier,
} from "react-icons/si"
import { FaLinkedinIn } from "react-icons/fa6"
import { Smartphone, TerminalSquare } from "lucide-react"

type IconProps = React.SVGProps<SVGSVGElement> & { className?: string }

const Windows = (props: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
  </svg>
)

// Official multicolor brand SVGs sourced from devicon (CDN) — ship as <img>.
const deviconImg =
  (slug: string, variant: string = "original") =>
  ({ className }: { className?: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-${variant}.svg`}
      alt=""
      className={className}
    />
  )

const ChromeColor = deviconImg("chrome")
const SlackColor = deviconImg("slack")

// react-icons returns IconType which renders an <svg>; wrap to accept SVGProps cleanly.
const wrap =
  (Cmp: React.ComponentType<{ className?: string }>) =>
  (props: IconProps) => <Cmp className={props.className} />

export const BrandIcons = {
  github:     wrap(SiGithub),
  raycast:    wrap(SiRaycast),
  chrome:     ChromeColor,
  windows:    Windows,
  apple:      wrap(SiApple),
  android:    wrap(SiAndroid),
  slack:      SlackColor,
  discord:    wrap(SiDiscord),
  telegram:   wrap(SiTelegram),
  x:          wrap(SiX),
  instagram:  wrap(SiInstagram),
  linkedin:   wrap(FaLinkedinIn),
  producthunt: wrap(SiProducthunt),
  mobile:     wrap(Smartphone),
  python:     wrap(SiPython),
  typescript: wrap(SiTypescript),
  rust:       wrap(SiRust),
  go:         wrap(SiGo),
  cpp:        wrap(SiCplusplus),
  terminal:   wrap(TerminalSquare),
  n8n:        wrap(SiN8N),
  zapier:     wrap(SiZapier),
} as const

export type BrandIconKey = keyof typeof BrandIcons
