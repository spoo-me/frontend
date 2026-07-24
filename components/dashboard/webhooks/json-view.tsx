"use client"

import * as React from "react"

/** Shiki-highlighted JSON in the repo's dual theme, for dynamic payloads
    (delivery bodies). lib/code-samples' helper is server-only, so this
    client version calls shiki itself — same themes, and defaultColor
    false so BOTH theme variables land in the output (the .shiki-host
    CSS reads --shiki-light and --shiki-dark). Highlights in an effect;
    the plain text renders immediately so nothing pops in. */
export function JsonView({ json }: { json: string }) {
  const [html, setHtml] = React.useState<string | null>(null)

  React.useEffect(() => {
    let alive = true
    import("shiki")
      .then((shiki) =>
        shiki.codeToHtml(json, {
          lang: "json",
          themes: { light: "vitesse-light", dark: "vesper" },
          defaultColor: false,
        })
      )
      .then((out) => {
        if (alive) setHtml(out)
      })
      .catch(() => {
        /* highlighting is decoration; the plain text stays */
      })
    return () => {
      alive = false
    }
  }, [json])

  if (!html)
    return (
      <pre className="whitespace-pre font-mono text-[11px] leading-relaxed">
        {json}
      </pre>
    )
  return (
    <div
      className="shiki-host text-[11px] leading-relaxed [&_pre]:whitespace-pre"
      // shiki output over locally stringified JSON, same as the other hosts
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
