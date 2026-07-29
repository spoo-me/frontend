"use client"

import * as React from "react"
import Script from "next/script"

import { CLARITY_ID } from "@/lib/flags"

/**
 * Microsoft Clarity, site-wide (landing and dashboard), matching the old
 * frontend so the year of scroll-depth and heatmap baseline continues
 * through the redesign. Content masking is governed by the Clarity
 * project's masking mode, not here.
 *
 * The script only loads on spoo.me: beta and self-hosted deploys share
 * this image, and the baseline should not absorb their test sessions.
 */
function isProductionHost() {
  const host = window.location.hostname
  return host === "spoo.me" || host === "www.spoo.me"
}

export function Clarity() {
  const [load, setLoad] = React.useState(false)

  React.useEffect(() => {
    if (CLARITY_ID && isProductionHost()) setLoad(true)
  }, [])

  if (!load) return null
  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${CLARITY_ID}");`}
    </Script>
  )
}
