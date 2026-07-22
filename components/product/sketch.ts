import { Caveat } from "next/font/google"

/** The annotation hand — the Excalidraw register for sketch notes. */
export const sketchFont = Caveat({
  subsets: ["latin"],
  weight: ["500"],
  variable: "--font-sketch",
})
