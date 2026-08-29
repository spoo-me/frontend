/**
 * @license
 * Derived from qrcode.react (Copyright (c) Paul O'Shannessy, ISC) and the
 * styled-path extensions in dub (dub.co, AGPL-3.0). Matrix generation is
 * Project Nayuki's qrcodegen (MIT), vendored in ./codegen.
 */
import qrcodegen from "./codegen"
import type {
  Excavation,
  ImageSettings,
  MarkerBorderStyle,
  MarkerCenterStyle,
  Modules,
  QrRenderProps,
} from "./types"

const ERROR_LEVEL_MAP: Record<string, qrcodegen.QrCode.Ecc> = {
  L: qrcodegen.QrCode.Ecc.LOW,
  M: qrcodegen.QrCode.Ecc.MEDIUM,
  Q: qrcodegen.QrCode.Ecc.QUARTILE,
  H: qrcodegen.QrCode.Ecc.HIGH,
}

function excavateModules(modules: Modules, excavation: Excavation): Modules {
  return modules.slice().map((row, y) => {
    if (y < excavation.y || y >= excavation.y + excavation.h) return row
    return row.map((cell, x) => {
      if (x < excavation.x || x >= excavation.x + excavation.w) return cell
      return false
    })
  })
}

/** The three 7x7 finder zones are drawn separately from the data dots. */
function isFinderPatternCell(x: number, y: number, numModules: number) {
  return (
    (x < 7 && y < 7) ||
    (x >= numModules - 7 && y < 7) ||
    (x < 7 && y >= numModules - 7)
  )
}

function squareDotPath(modules: Modules, margin: number): string {
  const numModules = modules.length
  const ops: string[] = []
  modules.forEach((row, y) => {
    let start: number | null = null
    row.forEach((cell, x) => {
      const isFinder = isFinderPatternCell(x, y, numModules)
      if ((!cell || isFinder) && start !== null) {
        ops.push(
          `M${start + margin} ${y + margin}h${x - start}v1H${start + margin}z`
        )
        start = null
        return
      }
      if (x === row.length - 1) {
        if (!cell || isFinder) return
        if (start === null) {
          ops.push(`M${x + margin},${y + margin} h1v1H${x + margin}z`)
        } else {
          ops.push(
            `M${start + margin},${y + margin} h${x + 1 - start}v1H${
              start + margin
            }z`
          )
        }
        return
      }
      if (cell && !isFinder && start === null) start = x
    })
  })
  return ops.join("")
}

function roundedDotPath(modules: Modules, margin: number): string {
  const numModules = modules.length
  const r = 0.4
  const ops: string[] = []
  modules.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (!cell || isFinderPatternCell(x, y, numModules)) return
      const cx = x + margin
      const cy = y + margin
      ops.push(
        `M${cx + r},${cy}` +
          `h${1 - 2 * r}` +
          `a${r},${r} 0 0 1 ${r},${r}` +
          `v${1 - 2 * r}` +
          `a${r},${r} 0 0 1 ${-r},${r}` +
          `h${-(1 - 2 * r)}` +
          `a${r},${r} 0 0 1 ${-r},${-r}` +
          `v${-(1 - 2 * r)}` +
          `a${r},${r} 0 0 1 ${r},${-r}` +
          `z`
      )
    })
  })
  return ops.join("")
}

function cornerRoundedRect(
  x: number,
  y: number,
  w: number,
  h: number,
  rTL: number,
  rTR: number,
  rBR: number,
  rBL: number
): string {
  const parts: string[] = [`M${x + rTL},${y}`]
  if (rTR > 0) {
    parts.push(`H${x + w - rTR}`, `A${rTR},${rTR} 0 0 1 ${x + w},${y + rTR}`)
  } else {
    parts.push(`H${x + w}`)
  }
  if (rBR > 0) {
    parts.push(
      `V${y + h - rBR}`,
      `A${rBR},${rBR} 0 0 1 ${x + w - rBR},${y + h}`
    )
  } else {
    parts.push(`V${y + h}`)
  }
  if (rBL > 0) {
    parts.push(`H${x + rBL}`, `A${rBL},${rBL} 0 0 1 ${x},${y + h - rBL}`)
  } else {
    parts.push(`H${x}`)
  }
  if (rTL > 0) {
    parts.push(`V${y + rTL}`, `A${rTL},${rTL} 0 0 1 ${x + rTL},${y}`)
  } else {
    parts.push(`V${y}`)
  }
  parts.push("Z")
  return parts.join("")
}

/** Connected style: corners touching a dark neighbour stay sharp, free
    corners get a full arc, so runs read as pills and blobs, not tiles. */
function extraRoundedDotPath(modules: Modules, margin: number): string {
  const numModules = modules.length
  const r = 0.5
  const ops: string[] = []
  const isDark = (x: number, y: number) =>
    x >= 0 &&
    y >= 0 &&
    x < numModules &&
    y < numModules &&
    !!(modules[y][x] && !isFinderPatternCell(x, y, numModules))

  modules.forEach((row, y) => {
    row.forEach((cell, x) => {
      if (!cell || isFinderPatternCell(x, y, numModules)) return
      const top = isDark(x, y - 1)
      const right = isDark(x + 1, y)
      const bottom = isDark(x, y + 1)
      const left = isDark(x - 1, y)
      ops.push(
        cornerRoundedRect(
          x + margin,
          y + margin,
          1,
          1,
          top || left ? 0 : r,
          top || right ? 0 : r,
          bottom || right ? 0 : r,
          bottom || left ? 0 : r
        )
      )
    })
  })
  return ops.join("")
}

function roundedRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): string {
  return (
    `M${x + r},${y}` +
    `H${x + w - r}` +
    `A${r},${r} 0 0 1 ${x + w},${y + r}` +
    `V${y + h - r}` +
    `A${r},${r} 0 0 1 ${x + w - r},${y + h}` +
    `H${x + r}` +
    `A${r},${r} 0 0 1 ${x},${y + h - r}` +
    `V${y + r}` +
    `A${r},${r} 0 0 1 ${x + r},${y}` +
    `Z`
  )
}

function circlePath(cx: number, cy: number, r: number): string {
  return (
    `M${cx - r},${cy}` +
    `A${r},${r} 0 1 0 ${cx + r},${cy}` +
    `A${r},${r} 0 1 0 ${cx - r},${cy}` +
    `Z`
  )
}

function finderBorderPath(
  x: number,
  y: number,
  style: MarkerBorderStyle
): string {
  const cx = x + 3.5
  const cy = y + 3.5
  if (style === "square") {
    return (
      `M${x},${y}H${x + 7}V${y + 7}H${x}Z ` +
      `M${x + 1},${y + 1}H${x + 6}V${y + 6}H${x + 1}Z`
    )
  }
  if (style === "rounded-square") {
    return (
      roundedRectPath(x, y, 7, 7, 1.5) +
      " " +
      roundedRectPath(x + 1, y + 1, 5, 5, 0.75)
    )
  }
  return circlePath(cx, cy, 3.5) + " " + circlePath(cx, cy, 2.5)
}

function finderPatternMarkup(
  x: number,
  y: number,
  markerColor: string,
  borderStyle: MarkerBorderStyle,
  centerStyle: MarkerCenterStyle
): string {
  const cx = x + 3.5
  const cy = y + 3.5
  // evenodd punches the ring gap transparent, so no background rect is
  // painted and rounded rings never sit on a hard-cornered white square.
  const border = `<path d="${finderBorderPath(x, y, borderStyle)}" fill="${markerColor}" fill-rule="evenodd"></path>`
  const center =
    centerStyle === "square"
      ? `<rect x="${x + 2}" y="${y + 2}" width="3" height="3" fill="${markerColor}" shape-rendering="crispEdges"></rect>`
      : `<circle cx="${cx}" cy="${cy}" r="1.5" fill="${markerColor}"></circle>`
  return `<g>${border}${center}</g>`
}

/**
 * The one rendering path. Preview injects this string inline; downloads
 * serialize or rasterize the same string, so what you see is what you get.
 */
export function qrSvgString(props: QrRenderProps): string {
  const {
    value,
    size,
    level,
    bgColor,
    fgColor,
    margin,
    dotStyle,
    markerBorderStyle,
    markerCenterStyle,
    markerColor,
    imageSettings,
  } = props

  const effectiveMarkerColor = markerColor ?? fgColor

  let cells = qrcodegen.QrCode.encodeText(
    value,
    ERROR_LEVEL_MAP[level]
  ).getModules()

  const numCells = cells.length + margin * 2

  let image = ""
  if (imageSettings) {
    const numModules = cells.length
    const scale = numModules / size
    const w = imageSettings.width * scale
    const h = imageSettings.height * scale
    const x = numModules / 2 - w / 2
    const y = numModules / 2 - h / 2
    if (imageSettings.excavate) {
      const floorX = Math.floor(x)
      const floorY = Math.floor(y)
      cells = excavateModules(cells, {
        x: floorX,
        y: floorY,
        w: Math.ceil(w + x - floorX),
        h: Math.ceil(h + y - floorY),
      })
    }
    image = `<image href="${imageSettings.src}" height="${h}" width="${w}" x="${x + margin}" y="${y + margin}" preserveAspectRatio="none"></image>`
  }

  const fgPath =
    dotStyle === "rounded"
      ? roundedDotPath(cells, margin)
      : dotStyle === "extra-rounded"
        ? extraRoundedDotPath(cells, margin)
        : squareDotPath(cells, margin)

  const numModules = cells.length
  const finders = [
    { x: margin, y: margin },
    { x: numModules - 7 + margin, y: margin },
    { x: margin, y: numModules - 7 + margin },
  ]
    .map((pos) =>
      finderPatternMarkup(
        pos.x,
        pos.y,
        effectiveMarkerColor,
        markerBorderStyle,
        markerCenterStyle
      )
    )
    .join("")

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" height="${size}" width="${size}" viewBox="0 0 ${numCells} ${numCells}">`,
    `<path fill="${bgColor}" d="M0,0 h${numCells}v${numCells}H0z" shape-rendering="crispEdges"></path>`,
    `<path fill="${fgColor}" d="${fgPath}" shape-rendering="crispEdges"></path>`,
    finders,
    image,
    `</svg>`,
  ].join("")
}
