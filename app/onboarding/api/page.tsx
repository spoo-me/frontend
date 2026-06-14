import { getOnboardingCurlHtml } from "@/lib/code-samples"
import { ApiPageClient } from "./api-page-client"

export default async function ApiPage() {
  // Highlight the curl template (vesper) on the server; the client swaps in
  // the real token at runtime.
  const curlHtml = await getOnboardingCurlHtml()
  return <ApiPageClient curlHtml={curlHtml} />
}
