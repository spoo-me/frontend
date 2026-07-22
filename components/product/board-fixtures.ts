import type { DimensionRow } from "@/lib/api"

/* Product-page fixtures beyond the landing set — same wire shapes the
   real widgets consume. */

export const browserRows: DimensionRow[] = [
  { value: "Chrome", clicks: 5124, unique_clicks: 3592, percentage: 49.5 },
  { value: "Safari", clicks: 2486, unique_clicks: 1744, percentage: 24.0 },
  { value: "Firefox", clicks: 1296, unique_clicks: 914, percentage: 12.5 },
  { value: "Edge", clicks: 820, unique_clicks: 584, percentage: 7.9 },
  { value: "Opera", clicks: 384, unique_clicks: 266, percentage: 3.7 },
  { value: "Brave", clicks: 250, unique_clicks: 178, percentage: 2.4 },
]

export const osRows: DimensionRow[] = [
  { value: "iOS", clicks: 3940, unique_clicks: 2760, percentage: 38.0 },
  { value: "Android", clicks: 2800, unique_clicks: 1960, percentage: 27.0 },
  { value: "Windows", clicks: 2180, unique_clicks: 1530, percentage: 21.0 },
  { value: "macOS", clicks: 1040, unique_clicks: 730, percentage: 10.0 },
  { value: "Linux", clicks: 415, unique_clicks: 290, percentage: 4.0 },
]

export const cityRows: DimensionRow[] = [
  { value: "Berlin", clicks: 1640, unique_clicks: 1150, percentage: 22 },
  { value: "Tokyo", clicks: 1540, unique_clicks: 1080, percentage: 19 },
  { value: "San Francisco", clicks: 1470, unique_clicks: 1030, percentage: 16 },
  { value: "London", clicks: 1420, unique_clicks: 995, percentage: 15 },
  { value: "Bengaluru", clicks: 1360, unique_clicks: 950, percentage: 12 },
  { value: "São Paulo", clicks: 1280, unique_clicks: 900, percentage: 10 },
]

export const linkRows: DimensionRow[] = [
  { value: "launch", clicks: 2163, unique_clicks: 1510, percentage: 28 },
  { value: "spring-promo", clicks: 1900, unique_clicks: 1330, percentage: 24 },
  { value: "docs", clicks: 986, unique_clicks: 690, percentage: 13 },
  { value: "newsletter", clicks: 772, unique_clicks: 540, percentage: 10 },
  { value: "gig", clicks: 462, unique_clicks: 325, percentage: 6 },
  { value: "drop", clicks: 416, unique_clicks: 292, percentage: 5 },
]
