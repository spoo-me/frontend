import { authedFetch, jsonInit, parse } from "./client"

export type AuthProvider = {
  provider: "google" | "github" | "discord"
  email: string | null
  linked_at: string | null
}

export type AuthUser = {
  id: string
  email: string
  email_verified: boolean
  /** When onboarding was completed; null = never. */
  onboarded_at?: string | null
  user_name: string | null
  plan: string
  password_set: boolean
  auth_providers: AuthProvider[]
  pfp: { url: string; source: string } | null
}

export function register(input: {
  email: string
  password: string
  user_name?: string
}) {
  return fetch("/auth/register", jsonInit("POST", input)).then((r) =>
    parse<{
      access_token: string
      user: AuthUser
      requires_verification: boolean
      verification_sent: boolean
    }>(r)
  )
}

export function login(input: { email: string; password: string }) {
  return fetch("/auth/login", jsonInit("POST", input)).then((r) =>
    parse<{ access_token: string; user: AuthUser }>(r)
  )
}

export function logout() {
  return fetch("/auth/logout", { method: "POST" }).then((r) =>
    parse<{ success: boolean }>(r)
  )
}

export function me() {
  return authedFetch("/auth/me", { method: "GET" }).then((r) =>
    parse<{ user: AuthUser }>(r)
  )
}

export function sendVerification() {
  return authedFetch("/auth/send-verification", { method: "POST" }).then((r) =>
    parse<{ success: boolean; expires_in: number }>(r)
  )
}

export function verifyEmail(code: string) {
  return authedFetch("/auth/verify-email", jsonInit("POST", { code })).then(
    (r) => parse<{ success: boolean; email_verified: boolean }>(r)
  )
}

/* ── OAuth provider management + profile pictures ─────────────────────────
   The session (auth_providers, password_set, pfp) is the read model; these
   are the mutations. Linking is a browser navigation, not a fetch: the
   backend 302s to the provider's consent screen. */

export const OAUTH_PROVIDERS = ["google", "github", "discord"] as const
export type OAuthProviderName = (typeof OAUTH_PROVIDERS)[number]

/** href for the link flow — use on an <a>, never fetch it. */
export function oauthLinkHref(provider: OAuthProviderName) {
  return `/oauth/${provider}/link`
}

export function unlinkProvider(provider: OAuthProviderName) {
  return authedFetch(`/oauth/providers/${provider}/unlink`, {
    method: "DELETE",
  }).then((r) => parse<{ success: boolean; message: string }>(r))
}

export type ProfilePicture = {
  id: string
  url: string
  source: string
  is_current: boolean
}

export function listProfilePictures() {
  return authedFetch("/dashboard/profile-pictures", { method: "GET" }).then(
    (r) => parse<{ pictures: ProfilePicture[] }>(r)
  )
}

export function setProfilePicture(pictureId: string) {
  return authedFetch(
    "/dashboard/profile-pictures",
    jsonInit("POST", { picture_id: pictureId })
  ).then((r) => parse<{ message: string }>(r))
}

export function requestPasswordReset(email: string) {
  return fetch(
    "/auth/request-password-reset",
    jsonInit("POST", { email })
  ).then((r) => parse<{ success: boolean }>(r))
}

export function resetPassword(input: {
  email: string
  code: string
  password: string
}) {
  return fetch("/auth/reset-password", jsonInit("POST", input)).then((r) =>
    parse<{ success: boolean }>(r)
  )
}
