import "server-only"

import { codeToHtml } from "shiki"

import type { BrandIconKey } from "@/components/icons/brand-icons"

export type Sample = {
  id: string
  label: string
  lang: string
  code: string
  iconKey?: BrandIconKey
}

export type HighlightedSample = Sample & { html: string }

export const samples: Sample[] = [
  {
    id: "python",
    label: "Python",
    lang: "python",
    iconKey: "python",
    code: `from spoo import Spoo

spoo = Spoo(api_key="spk_live_…")

link = spoo.shorten(
    url="https://example.com/very/long/path",
    alias="launch",
    max_clicks=100,
    expires_in="7d",
)

print(link.short_url)`,
  },
  {
    id: "ts",
    label: "TypeScript",
    lang: "typescript",
    iconKey: "typescript",
    code: `import { Spoo } from "spoo-me"

const spoo = new Spoo({ apiKey: process.env.SPOO_KEY! })

const link = await spoo.shorten({
  url: "https://example.com/very/long/path",
  alias: "launch",
  maxClicks: 100,
  expiresIn: "7d",
})

console.log(link.shortUrl)`,
  },
  {
    id: "rust",
    label: "Rust",
    lang: "rust",
    iconKey: "rust",
    code: `use spoo::Spoo;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let spoo = Spoo::new(std::env::var("SPOO_KEY")?);
    let link = spoo
        .shorten("https://example.com/very/long/path")
        .alias("launch")
        .max_clicks(100)
        .expires_in("7d")
        .send()
        .await?;
    println!("{}", link.short_url);
    Ok(())
}`,
  },
  {
    id: "go",
    label: "Go",
    lang: "go",
    iconKey: "go",
    code: `package main

import (
    "context"
    "fmt"
    "os"

    "github.com/spoo-me/spoo-go"
)

func main() {
    s := spoo.New(os.Getenv("SPOO_KEY"))
    link, _ := s.Shorten(context.Background(), &spoo.Req{
        URL: "https://example.com/very/long/path",
        Alias: "launch", MaxClicks: 100, ExpiresIn: "7d",
    })
    fmt.Println(link.ShortURL)
}`,
  },
  {
    id: "curl",
    label: "cURL",
    lang: "bash",
    iconKey: "terminal",
    code: `curl -X POST https://spoo.me/api \\
  -H "Authorization: Bearer $SPOO_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com/very/long/path",
    "alias": "launch",
    "max_clicks": 100,
    "expires_in": "7d"
  }'`,
  },
]

export async function highlightCode(code: string, lang: string): Promise<string> {
  return codeToHtml(code, {
    lang,
    themes: { light: "vitesse-light", dark: "vesper" },
    defaultColor: false,
  })
}

export async function getHighlightedSamples(): Promise<HighlightedSample[]> {
  return Promise.all(
    samples.map(async (s) => ({
      ...s,
      html: await codeToHtml(s.code, {
        lang: s.lang,
        themes: { light: "vitesse-light", dark: "vesper" },
        defaultColor: false,
      }),
    })),
  )
}
