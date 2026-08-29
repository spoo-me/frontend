import type qrcodegen from "./codegen"

export type Modules = ReturnType<qrcodegen.QrCode["getModules"]>
export type Excavation = { x: number; y: number; w: number; h: number }

export type DotStyle = "square" | "rounded" | "extra-rounded"
export type MarkerBorderStyle = "square" | "rounded-square" | "circle"
export type MarkerCenterStyle = "square" | "circle"

export type ImageSettings = {
  /** data: URI — the renderer never fetches, so downloads stay self-contained. */
  src: string
  height: number
  width: number
  excavate: boolean
}

export type QrRenderProps = {
  value: string
  size: number
  level: "L" | "M" | "Q" | "H"
  bgColor: string
  fgColor: string
  margin: number
  dotStyle: DotStyle
  markerBorderStyle: MarkerBorderStyle
  markerCenterStyle: MarkerCenterStyle
  markerColor?: string
  imageSettings?: ImageSettings
}

/** The persisted, user-editable slice of a QR's look. */
export type QrDesign = {
  v: 1
  fgColor: string
  dotStyle: DotStyle
  markerBorderStyle: MarkerBorderStyle
  markerCenterStyle: MarkerCenterStyle
  /** Schema-ready for a future marker color control; falls back to fgColor. */
  markerColor?: string
}
