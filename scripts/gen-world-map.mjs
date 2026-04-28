/* Pre-renders the dotted world map to static SVG assets so the runtime
   doesn't need to import `dotted-map` (heavy + duplicated per theme).
   Run: `node scripts/gen-world-map.mjs` */
import DottedMap from "dotted-map"
import fs from "node:fs"

const map = new DottedMap({ height: 100, grid: "diagonal" })

const variants = [
  { file: "public/brand/world-map-light.svg", color: "#00000040" },
  { file: "public/brand/world-map-dark.svg",  color: "#FFFFFF40" },
]

for (const v of variants) {
  const svg = map.getSVG({
    radius: 0.22,
    color: v.color,
    shape: "circle",
    backgroundColor: "transparent",
  })
  fs.writeFileSync(v.file, svg)
  console.log(v.file, "→", (svg.length / 1024).toFixed(1), "KB")
}
