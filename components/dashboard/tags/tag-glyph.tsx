"use client"

import * as React from "react"
import {
  Banknote,
  BarChart3,
  Beaker,
  Bell,
  Bird,
  Book,
  Bookmark,
  Box,
  Briefcase,
  Bug,
  Building,
  Calendar,
  Camera,
  Car,
  Cat,
  Clock,
  Cloud,
  Code,
  Coffee,
  Compass,
  CreditCard,
  Crown,
  Dog,
  FileText,
  Fish,
  Flag,
  Flame,
  FlaskConical,
  Folder,
  Gamepad2,
  Gem,
  Ghost,
  Gift,
  Globe,
  GraduationCap,
  Handshake,
  Hash,
  Heart,
  Home,
  Hourglass,
  Image,
  Key,
  Layers,
  Leaf,
  Lightbulb,
  Link,
  Lock,
  Mail,
  MapPin,
  Megaphone,
  MessageSquare,
  Mic,
  Moon,
  Music,
  Newspaper,
  Package,
  PenLine,
  Phone,
  PieChart,
  Pizza,
  Plane,
  Puzzle,
  Receipt,
  Rocket,
  Send,
  Settings,
  Share2,
  Shield,
  ShoppingCart,
  Smile,
  Sparkles,
  Star,
  Store,
  Sun,
  Tag as TagIcon,
  Target,
  Terminal,
  Timer,
  TrendingUp,
  Trophy,
  Umbrella,
  User,
  Users,
  Video,
  Wallet,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react"

import type { TagColor, TagRef } from "@/lib/api"
import { cn } from "@/lib/utils"

/** The curated set, keyed exactly like the server's shared/tag_icons.py. */
export const TAG_ICONS: Record<string, LucideIcon> = {
  rocket: Rocket,
  megaphone: Megaphone,
  flag: Flag,
  star: Star,
  heart: Heart,
  bookmark: Bookmark,
  tag: TagIcon,
  hash: Hash,
  zap: Zap,
  flame: Flame,
  sparkles: Sparkles,
  trophy: Trophy,
  target: Target,
  crown: Crown,
  gem: Gem,
  gift: Gift,
  calendar: Calendar,
  clock: Clock,
  timer: Timer,
  hourglass: Hourglass,
  briefcase: Briefcase,
  building: Building,
  store: Store,
  "shopping-cart": ShoppingCart,
  "credit-card": CreditCard,
  wallet: Wallet,
  banknote: Banknote,
  receipt: Receipt,
  mail: Mail,
  send: Send,
  bell: Bell,
  "message-square": MessageSquare,
  phone: Phone,
  video: Video,
  camera: Camera,
  image: Image,
  music: Music,
  mic: Mic,
  book: Book,
  newspaper: Newspaper,
  "file-text": FileText,
  folder: Folder,
  "pen-line": PenLine,
  code: Code,
  terminal: Terminal,
  bug: Bug,
  wrench: Wrench,
  settings: Settings,
  "flask-conical": FlaskConical,
  beaker: Beaker,
  lightbulb: Lightbulb,
  "graduation-cap": GraduationCap,
  globe: Globe,
  "map-pin": MapPin,
  compass: Compass,
  plane: Plane,
  car: Car,
  home: Home,
  users: Users,
  user: User,
  handshake: Handshake,
  shield: Shield,
  lock: Lock,
  key: Key,
  link: Link,
  "share-2": Share2,
  "trending-up": TrendingUp,
  "bar-chart-3": BarChart3,
  "pie-chart": PieChart,
  layers: Layers,
  package: Package,
  box: Box,
  puzzle: Puzzle,
  "gamepad-2": Gamepad2,
  coffee: Coffee,
  pizza: Pizza,
  leaf: Leaf,
  sun: Sun,
  moon: Moon,
  cloud: Cloud,
  umbrella: Umbrella,
  smile: Smile,
  ghost: Ghost,
  cat: Cat,
  dog: Dog,
  bird: Bird,
  fish: Fish,
}

/** Muted 400-step hues so a tag reads as a mark, not a badge. */
const TEXT: Record<TagColor, string> = {
  gray: "text-zinc-400",
  red: "text-rose-400",
  orange: "text-orange-400",
  amber: "text-amber-400",
  green: "text-emerald-400",
  teal: "text-teal-400",
  blue: "text-sky-400",
  violet: "text-violet-400",
  pink: "text-pink-400",
}
const BG: Record<TagColor, string> = {
  gray: "bg-zinc-400",
  red: "bg-rose-400",
  orange: "bg-orange-400",
  amber: "bg-amber-400",
  green: "bg-emerald-400",
  teal: "bg-teal-400",
  blue: "bg-sky-400",
  violet: "bg-violet-400",
  pink: "bg-pink-400",
}

/** Dub-style tinted pill: soft fill, hairline border, ink in the hue.
    Both themes: 700-step ink on light (the only step that clears AA at 11px
    over the tinted fill), 300-step on dark, over a 10% fill. */
const CHIP: Record<TagColor, string> = {
  gray: "border-zinc-500/25 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",
  red: "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  orange:
    "border-orange-500/25 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  amber:
    "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  green:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  teal: "border-teal-500/25 bg-teal-500/10 text-teal-700 dark:text-teal-300",
  blue: "border-sky-500/25 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  violet:
    "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  pink: "border-pink-500/25 bg-pink-500/10 text-pink-700 dark:text-pink-300",
}

export function tagChipClass(color: TagColor) {
  return CHIP[color] ?? CHIP.gray
}

/** A tag as a tinted pill: icon and mono name in the tag's hue. */
export function TagChip({
  tag,
  className,
  onClick,
  title,
}: {
  tag: Pick<TagRef, "name" | "color" | "icon">
  className?: string
  onClick?: (e: React.MouseEvent) => void
  title?: string
}) {
  const Icon = TAG_ICONS[tag.icon] ?? TagIcon
  const cls = cn(
    "inline-flex h-6 max-w-40 items-center gap-1.5 rounded-md border px-2 font-mono text-[11px] leading-none",
    tagChipClass(tag.color),
    onClick && "transition-opacity duration-150 hover:opacity-80",
    className
  )
  const body = (
    <>
      <Icon aria-hidden className="size-3 shrink-0" strokeWidth={2} />
      <span className="ph-no-capture truncate">{tag.name}</span>
    </>
  )
  return onClick ? (
    <button type="button" onClick={onClick} title={title} className={cls}>
      {body}
    </button>
  ) : (
    <span title={title} className={cls}>
      {body}
    </span>
  )
}

export function tagTextClass(color: TagColor) {
  return TEXT[color] ?? TEXT.gray
}
export function tagBgClass(color: TagColor) {
  return BG[color] ?? BG.gray
}

/** One glyph per tag: its icon tinted with its colour. Unknown keys (an
    older client, a typo in an API call) fall back to the generic tag. */
export function TagGlyph({
  color,
  icon,
  className,
}: {
  color: TagColor
  icon: string
  className?: string
}) {
  const Icon = TAG_ICONS[icon] ?? TagIcon
  return (
    <Icon
      aria-hidden
      className={cn("size-3.5 shrink-0", tagTextClass(color), className)}
      strokeWidth={2}
    />
  )
}

/** Glyph plus mono name; the one way a tag is written anywhere. */
export function TagLabel({
  tag,
  className,
  nameClassName,
  glyphClassName,
}: {
  tag: Pick<TagRef, "name" | "color" | "icon">
  className?: string
  nameClassName?: string
  glyphClassName?: string
}) {
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-1.5", className)}>
      <TagGlyph color={tag.color} icon={tag.icon} className={glyphClassName} />
      <span
        className={cn(
          "ph-no-capture truncate font-mono text-[11px]",
          nameClassName
        )}
      >
        {tag.name}
      </span>
    </span>
  )
}
