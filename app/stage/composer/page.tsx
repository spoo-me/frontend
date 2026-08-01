import { notFound } from "next/navigation"

import { ComposerStage } from "./stage"

/**
 * Recording stage, dev-only: the composer panel isolated on the exact
 * background of the band its video lands on. scripts/record-demos.mjs
 * points a browser here — no dashboard chrome, and every dropdown has
 * room to open inside the frame.
 */
export default function ComposerStagePage() {
  if (process.env.NODE_ENV !== "development") notFound()
  return <ComposerStage />
}
