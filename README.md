# spoo-landing

Marketing site for [spoo.me](https://spoo.me) — the open-source link management platform.

## Stack

- **Next.js 16** with App Router + Turbopack
- **React 19**, TypeScript strict
- **Tailwind CSS v4**
- **shadcn/ui** (radix-nova preset) for primitives
- **Magic UI** + **Aceternity UI** components from the shadcn registry
- **Motion** (Framer Motion v12) for animations
- **next-themes** with dark-mode default

## Develop

```bash
npm install
npm run dev    # → http://localhost:3000
```

## Scripts

| script | purpose |
| --- | --- |
| `npm run dev` | dev server with Turbopack |
| `npm run build` | production build |
| `npm run start` | run built server |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | eslint |
| `npm run format` | prettier write |

## Project layout

```
app/
  (auth)/login         — sign-in page
  (auth)/signup        — sign-up page
  apps                 — ecosystem overview
  apps/[slug]          — per-app detail (raycast, chrome, discord, …)
  pricing              — free-forever pricing
  page.tsx             — landing
components/
  layout/              — header, footer, theme toggle
  sections/            — landing-page sections (hero, stats, features, …)
  shared/              — logo, section heading
  auth/                — auth form + layout
  icons/               — brand SVG set
  ui/                  — shadcn + Magic UI + Aceternity primitives
lib/
  site-config.ts       — site metadata, nav, footer links, stats
  apps-data.ts         — connected apps & SDKs registry
  utils.ts             — cn() helper
public/
  brand/               — spoo.me logos
  demos/               — dashboard screenshots
  icons-3d/            — 3D illustration assets
```

## Adding components

```bash
# shadcn
npx shadcn@latest add <name>

# Magic UI
npx shadcn@latest add "https://magicui.design/r/<name>"

# Aceternity (registry pre-configured in components.json)
npx shadcn@latest add "@aceternity/<name>"
```

## License

Apache 2.0 — same as the [spoo.me main repo](https://github.com/spoo-me/spoo).
