import "server-only"

import { codeToHtml } from "shiki"

import type { BrandIconKey } from "@/components/icons/brand-icons"
import { CURL_TOKEN_PLACEHOLDER } from "@/lib/onboarding"

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
    code: `import { Spoo } from "spoo.me"

const spoo = new Spoo({ apiKey: process.env.SPOO_KEY! })

const link = await spoo.links.create({
  long_url: "https://example.com/very/long/path",
  alias: "launch",
  max_clicks: 100,
  expire_after: new Date(Date.now() + 7 * 864e5),
})

console.log(link.short_url)`,
  },
  {
    id: "rust",
    label: "Rust",
    lang: "rust",
    iconKey: "rust",
    code: `use spoo_me::client::UrlShortenerClient;
use spoo_me::requests::ShortenRequest;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = UrlShortenerClient::new();

    let request = ShortenRequest::new("https://example.com/very/long/path")
        .alias("launch")
        .max_clicks(100);

    let link = client.shorten(request).await?;
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
    "time"

    spoo "github.com/spoo-me/spoo-go"
)

func main() {
    client := spoo.NewClient(spoo.WithAPIKey(os.Getenv("SPOO_API_KEY")))

    link, err := client.Shorten(context.Background(), spoo.ShortenRequest{
        LongURL:     "https://example.com/very/long/path",
        Alias:       "launch",
        MaxClicks:   100,
        ExpireAfter: time.Now().Add(7 * 24 * time.Hour),
    })
    if err != nil {
        panic(err)
    }
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

export async function highlightCode(
  code: string,
  lang: string
): Promise<string> {
  return codeToHtml(code, {
    lang,
    themes: { light: "vitesse-light", dark: "vesper" },
    defaultColor: false,
  })
}

/**
 * The onboarding "try it now" curl, highlighted once with a placeholder
 * token. The client injects the real key into the rendered HTML.
 */
const ONBOARDING_CURL = `curl -X POST https://spoo.me/api/v1/shorten \\
  -H "Authorization: Bearer ${CURL_TOKEN_PLACEHOLDER}" \\
  -H "Content-Type: application/json" \\
  -d '{"long_url": "https://example.com"}'`

export async function getOnboardingCurlHtml(): Promise<string> {
  return highlightCode(ONBOARDING_CURL, "bash")
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
    }))
  )
}
