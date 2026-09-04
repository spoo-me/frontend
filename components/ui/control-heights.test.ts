import { readdirSync, readFileSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { describe, expect, it } from "vitest"

// Dashboard controls share one height, and only the ui primitives carry it.
// Per-site h-*/size-* overrides are how a 28/32/36px mix crept in before.
const ROOTS = ["app/dashboard", "components/dashboard"]
const TAGS = new Set(["Input", "PasswordInput", "DateTimeField", "Button"])
// Compact tier: labelled actions that sit inside list rows, where a 36px
// button next to two lines of row text reads huge.
const COMPACT_ALLOWED = new Set([
  "app/dashboard/apps/page.tsx",
  "app/dashboard/settings/page.tsx",
])

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (p.endsWith(".tsx")) out.push(p)
  }
  return out
}

/** Attribute text of every <Tag ...> opening tag, brace and quote aware. */
function openingTags(src: string): Array<{ tag: string; attrs: string }> {
  const found: Array<{ tag: string; attrs: string }> = []
  const re = /<([A-Z][A-Za-z]*)(?=[\s/>])/g
  for (let m = re.exec(src); m; m = re.exec(src)) {
    if (!TAGS.has(m[1])) continue
    let i = re.lastIndex
    let depth = 0
    let quote: string | null = null
    for (; i < src.length; i++) {
      const c = src[i]
      if (quote) {
        if (c === quote) quote = null
        continue
      }
      if (c === '"' || c === "'" || c === "`") quote = c
      else if (c === "{") depth++
      else if (c === "}") depth--
      else if (c === ">" && depth === 0) break
    }
    found.push({ tag: m[1], attrs: src.slice(re.lastIndex, i) })
  }
  return found
}

describe("dashboard control heights", () => {
  const files = ROOTS.flatMap((r) => walk(join(process.cwd(), r)))

  it("never overrides the primitive height per site", () => {
    const violations: string[] = []
    for (const file of files) {
      const rel = relative(process.cwd(), file)
      for (const { tag, attrs } of openingTags(readFileSync(file, "utf8"))) {
        const cls = attrs.match(/className=(?:"[^"]*"|\{[^}]*\})/)?.[0] ?? ""
        if (/(?:^|[\s"'`(])(?:h|size)-(?:\d|\[)/.test(cls)) {
          violations.push(`${rel}: <${tag} ${cls}>`)
        }
        const size = attrs.match(/\bsize="(sm|xs)"/)
        if (tag === "Button" && size && !COMPACT_ALLOWED.has(rel)) {
          violations.push(`${rel}: <Button size="${size[1]}">`)
        }
      }
    }
    expect(violations).toEqual([])
  })
})
