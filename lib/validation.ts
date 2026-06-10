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
