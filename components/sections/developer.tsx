import { getHighlightedSamples } from "@/lib/code-samples"
import { DeveloperClient } from "./developer-client"

export async function Developer() {
  const samples = await getHighlightedSamples()
  return <DeveloperClient samples={samples} />
}
