/**
 * Mirror of the backend password policy (shared/validators.py) so forms can
 * show live feedback before the server ever sees the value.
 */
export const PASSWORD_RULES = [
  { id: "length", label: "8+ characters", test: (p: string) => p.length >= 8 },
  { id: "upper", label: "One uppercase", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lower", label: "One lowercase", test: (p: string) => /[a-z]/.test(p) },
  { id: "digit", label: "One number", test: (p: string) => /[0-9]/.test(p) },
  {
    id: "special",
    label: "One symbol",
    test: (p: string) => /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(p),
  },
] as const

export function passwordSatisfies(password: string) {
  return PASSWORD_RULES.every((r) => r.test(password))
}

/** Only allow same-app relative redirect targets (no `//evil.com`). */
export function safeNext(raw: string | null): string | null {
  if (!raw) return null
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.includes("\\"))
    return null
  return raw
}

/* ── Destination URL (long_url) mirror ──────────────────────────────────
 *
 * Mirror of the backend's destination-URL checks so the composer and the
 * settings form reject exactly what the API would reject, before the wire:
 *
 *   1. schemas/dto/requests/url.py — long_url max_length 8192 (422)
 *   2. shared/validators.py validate_url() — http(s) scheme, the
 *      `validators` package's URL grammar (registered domain hosts only:
 *      no IPs, no single-label hosts, TLD ends in a letter, port 1-65535,
 *      strict query fields, RFC 3986 path/fragment charsets), and the
 *      self-link host guard (400 "URL is not allowed or invalid")
 *
 * The DB regex blocklist (400 "URL is blocked") stays server-side; forms
 * render that rejection inline when it comes back.
 */

export const LONG_URL_MAX_LENGTH = 8192

/** settings.blocked_self_domains — matched against the destination's host,
    or a subdomain of it (redirect-loop prevention). */
const SELF_DOMAINS = ["spoo.me"]

/** Forgiving URL normalization, same as the links editors: trim, then
    prepend https:// when no scheme. This IS what travels on the wire. */
export function normalizeUrl(raw: string): string {
  const v = raw.trim()
  if (!v) return v
  if (/^https?:\/\//i.test(v)) return v
  return `https://${v}`
}

/* Faithful ports of the `validators` 0.35 regexes the backend runs. */
const PORT_RE =
  /^(?:6553[0-5]|655[0-2][0-9]|65[0-4][0-9]{2}|6[0-4][0-9]{3}|[1-5][0-9]{4}|[1-9][0-9]{0,3})$/
const DOMAIN_RE =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9_-]{0,61}[a-z]$/i
const PATH_RE =
  /^[/a-z0-9\-._~!$&'()*+,;=:@%\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF\u{1F300}-\u{1F5FF}\u{1F600}-\u{1F64F}]+$/iu
const FRAGMENT_RE = /^[0-9a-z?/:@\-._~%!$&'()*+,;=#]*$/i
const USERNAME_RE =
  /^(?:[Ā-ɏ]|[-!#$%&'*+/=?^_`{}|~0-9a-z]+(?:\.[-!#$%&'*+/=?^_`{}|~0-9a-z]+)*$|(?:[\x01-\x08\x0B\x0C\x0E-\x1F!#-[\]-\x7F]|\\[\x09.])*$)/i

/** urllib.parse_qs(strict_parsing=True) run with both "&" and ";"
    separators: every field must be non-empty and carry an "=". */
const strictQueryOk = (query: string) =>
  ["&", ";"].every((sep) =>
    query.split(sep).every((f) => f.length > 0 && f.includes("="))
  )

const validAuthSegment = (auth: string) => {
  if (!auth) return true
  const colons = (auth.match(/:/g) ?? []).length
  if (colons > 1) {
    let decoded = auth
    try {
      decoded = decodeURIComponent(auth)
    } catch {
      /* python's unquote never throws; keep the raw value */
    }
    return USERNAME_RE.test(decoded)
  }
  if (colons < 1) return USERNAME_RE.test(auth)
  const i = auth.lastIndexOf(":")
  return USERNAME_RE.test(auth.slice(0, i)) && !/[/?#@]/.test(auth.slice(i + 1))
}

/** Hostname the way the backend sees it: optional :port peeled off, then
    the domain grammar against the punycoded name. Returns the failing
    part so urlProblem can speak to it. */
function hostFailure(rawHost: string): "port" | "host" | null {
  let host = rawHost
  if ((host.match(/:/g) ?? []).length === 1) {
    const i = host.lastIndexOf(":")
    if (PORT_RE.test(host.slice(i + 1))) host = host.slice(0, i)
    else return "port"
  }
  if (!host || /\s|__/.test(host)) return "host"
  if (/[^\x00-\x7F]/.test(host)) {
    // The backend IDNA-encodes before matching. WHATWG URL punycodes for
    // us but accepts more (emoji hosts) than python's idna codec, so gate
    // non-ASCII hosts to letters/digits/marks first.
    if (!/^[\p{L}\p{M}\p{N}.-]+$/u.test(host)) return "host"
    try {
      host = new URL(`http://${host}`).hostname
    } catch {
      return "host"
    }
  }
  return DOMAIN_RE.test(host) ? null : "host"
}

const URL_MESSAGES = {
  generic: "Enter a full web address, like https://example.com/page.",
  host: "That domain isn't valid. Use a full hostname, like example.com.",
  port: "That port isn't valid. Ports go from 1 to 65535.",
  path: "Some characters in the path need percent-encoding, like %20 for a space.",
  query: "Each query parameter needs a value, like ?key=value.",
  fragment: "Some characters after the # need percent-encoding.",
} as const

/** First format problem with an already-normalized URL, or null. Assumes
    the caller handled emptiness, whitespace and length. */
function urlFormatProblem(url: string): string | null {
  const m =
    /^([a-z][a-z0-9+.-]*):\/\/([^/?#]*)([^?#]*)(?:\?([^#]*))?(?:#([\s\S]*))?$/i.exec(
      url
    )
  if (!m) return URL_MESSAGES.generic
  const [, scheme, netloc, path, query, fragment] = m
  if (!/^https?$/i.test(scheme)) return URL_MESSAGES.generic
  if (!netloc || (netloc.match(/@/g) ?? []).length > 1)
    return URL_MESSAGES.generic
  const at = netloc.lastIndexOf("@")
  const auth = at >= 0 ? netloc.slice(0, at) : ""
  const host = at >= 0 ? netloc.slice(at + 1) : netloc
  const hostFail = hostFailure(host)
  if (hostFail) return URL_MESSAGES[hostFail]
  if (at >= 0 && !validAuthSegment(auth)) return URL_MESSAGES.generic
  if (path && !PATH_RE.test(path)) return URL_MESSAGES.path
  if (query && !strictQueryOk(query)) return URL_MESSAGES.query
  if (fragment && !FRAGMENT_RE.test(fragment)) return URL_MESSAGES.fragment
  return null
}

/** Host of a URL, lowercased with userinfo, port and trailing dot removed —
    null when the string has no parseable authority. Mirrors Python's
    urlparse().hostname, which is what the backend checks against. */
function hostOf(url: string): string | null {
  const m = /^[a-z][a-z0-9+.-]*:\/\/([^/?#]*)/i.exec(url)
  if (!m) return null
  const netloc = m[1]
  const at = netloc.lastIndexOf("@")
  let host = at >= 0 ? netloc.slice(at + 1) : netloc
  // A colon after the last "]" is a port; inside brackets it's an IPv6 literal.
  const colon = host.lastIndexOf(":")
  if (colon > host.lastIndexOf("]")) host = host.slice(0, colon)
  return host.toLowerCase().replace(/\.$/, "") || null
}

/** Mirror of shared/validators.py is_self_referential(). Host-scoped: a
    destination is only a redirect loop when the request would come back to
    us. A foreign URL that merely mentions the name in its path or query
    (an analytics dashboard filtered on spoo.me, say) is somebody else's. */
function selfReferential(url: string): boolean {
  const host = hostOf(url)
  if (!host) return false
  return SELF_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`))
}

/** Boolean mirror of shared/validators.py validate_url() — what the wire
    value must pass to avoid a 400 "URL is not allowed or invalid". The
    mock API enforces exactly this. */
export function validDestinationUrl(url: string): boolean {
  if (!url || /\s/.test(url)) return false
  if (selfReferential(url)) return false
  return urlFormatProblem(url) === null
}

/** First blocking problem with a destination draft, or null — one line in
    the UI voice per rejected case. Normalizes like the forms do, so it
    judges the exact string that would travel. Empty input returns null;
    requiredness is the caller's call. */
export function urlProblem(value: string): string | null {
  const v = normalizeUrl(value)
  if (!v) return null
  if (v.length > LONG_URL_MAX_LENGTH)
    return `That URL is too long (${LONG_URL_MAX_LENGTH.toLocaleString()} characters max).`
  if (/\s/.test(v)) return "URLs can't contain spaces. Encode them as %20."
  if (selfReferential(v)) return "Short links can't point back at spoo.me."
  return urlFormatProblem(v)
}
