"use client"

import * as React from "react"
import HCaptcha from "@hcaptcha/react-hcaptcha"
import { useTheme } from "next-themes"

import { HCAPTCHA_SITEKEY } from "@/lib/flags"

/**
 * Invisible hCaptcha for the public intake forms — one challenge per
 * SUBMISSION (a bulk report of 25 links solves one captcha, not 25).
 *
 * Mirrors the backend's configured/unconfigured semantics: without
 * NEXT_PUBLIC_HCAPTCHA_SITEKEY (mock mode, self-hosters) `challenge()`
 * resolves to undefined, no script ever loads, and the form submits
 * without a token — exactly what an hcaptcha-less backend expects.
 *
 * Usage: render `element` inside the form (it's invisible), then await
 * `challenge()` in the submit handler and pass the token on the wire.
 * Tokens are one-time use; the hook resets the widget on each call.
 */
export function useCaptcha() {
  const ref = React.useRef<HCaptcha>(null)
  const { resolvedTheme } = useTheme()
  const enabled = Boolean(HCAPTCHA_SITEKEY)

  const challenge = React.useCallback(async (): Promise<string | undefined> => {
    if (!HCAPTCHA_SITEKEY) return undefined
    const captcha = ref.current
    if (!captcha) throw new CaptchaError("captcha widget not mounted")
    try {
      const { response } = await captcha.execute({ async: true })
      return response
    } catch {
      // Closed or timed-out challenge — the caller shows the quiet retry.
      throw new CaptchaError("challenge not completed")
    } finally {
      // Passcodes are single-use; a stale one would 403 the next submit.
      captcha.resetCaptcha()
    }
  }, [])

  const element = HCAPTCHA_SITEKEY ? (
    <HCaptcha
      ref={ref}
      sitekey={HCAPTCHA_SITEKEY}
      size="invisible"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      reCaptchaCompat={false}
    />
  ) : null

  return { enabled, challenge, element }
}

export class CaptchaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CaptchaError"
  }
}
