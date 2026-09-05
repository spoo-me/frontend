/**
 * The plan a visitor picked on the pricing page before signing up. It rides
 * in sessionStorage through signup, verification and onboarding, and is
 * consumed once when onboarding finishes so the account lands on /upgrade.
 */
const KEY = "spoo:signup:plan"

type PlanStore = Pick<Storage, "getItem" | "setItem" | "removeItem">

export function planFromSearch(search: string): "pro" | null {
  return new URLSearchParams(search).get("plan") === "pro" ? "pro" : null
}

export function stashSignupPlan(
  plan: "pro" | null,
  store: PlanStore = window.sessionStorage
): void {
  try {
    if (plan) store.setItem(KEY, plan)
  } catch {
    // No storage: the account simply lands on the dashboard.
  }
}

/** Read and clear, so one signup honours the choice exactly once. */
export function takeSignupPlan(
  store: PlanStore = window.sessionStorage
): "pro" | null {
  try {
    const plan = store.getItem(KEY)
    store.removeItem(KEY)
    return plan === "pro" ? "pro" : null
  } catch {
    return null
  }
}
