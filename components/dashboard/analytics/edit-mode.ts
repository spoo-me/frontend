/**
 * Event bus for entering the analytics layout editor from anywhere (command
 * palette, future shortcuts) — same pattern as openLinkComposer.
 */

const EVENT = "spoo:analytics-edit-layout"

export function requestAnalyticsEditMode() {
  window.dispatchEvent(new Event(EVENT))
}

export function onAnalyticsEditMode(cb: () => void) {
  window.addEventListener(EVENT, cb)
  return () => window.removeEventListener(EVENT, cb)
}
