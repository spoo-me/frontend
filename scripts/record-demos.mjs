/**
 * Records product-demo clips by driving the REAL dashboard (mock mode)
 * with Playwright. No CI: `npm run record:demos` with the mock server
 * running on :3005. Output lands in public/demos/.
 *
 * The cursor is an injected overlay (headless Chromium paints no OS
 * pointer); clicks ripple. Motion pacing lives in glide()/pause().
 */
import { execSync } from "node:child_process"
import { mkdirSync, renameSync, rmSync } from "node:fs"
import { chromium } from "playwright"

const BASE = process.env.DEMO_BASE ?? "http://localhost:3005"
const OUT = "public/demos"
const W = 1560
const H = 980

const CURSOR_JS = `
  (() => {
    const c = document.createElement('div')
    c.id = 'pw-cursor'
    c.style.cssText = 'position:fixed;z-index:2147483647;pointer-events:none;top:0;left:0;transition:none'
    c.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="white" stroke="black" stroke-width="1.2" style="filter:drop-shadow(0 1px 3px rgba(0,0,0,.7))"><path d="M4 2l16 11.5-6.5 1.2L17 21l-3.2 1.4-3.4-6.4L5.5 20z"/></svg>'
    const attach = () => document.body && document.body.appendChild(c)
    document.readyState === 'loading'
      ? document.addEventListener('DOMContentLoaded', attach)
      : attach()
    window.addEventListener('mousemove', (e) => {
      c.style.transform = 'translate(' + e.clientX + 'px,' + e.clientY + 'px)'
    }, true)
    window.addEventListener('mousedown', (e) => {
      const r = document.createElement('div')
      r.style.cssText = 'position:fixed;z-index:2147483646;pointer-events:none;width:34px;height:34px;border-radius:50%;border:1.5px solid rgba(255,255,255,.8);left:' + (e.clientX - 17) + 'px;top:' + (e.clientY - 17) + 'px;animation:pwRip .45s ease-out forwards'
      document.body.appendChild(r)
      setTimeout(() => r.remove(), 500)
    }, true)
    const s = document.createElement('style')
    s.textContent = '@keyframes pwRip{from{transform:scale(.4);opacity:.9}to{transform:scale(1.4);opacity:0}}'
    document.head.appendChild(s)
  })()
`

async function glide(page, locator, { dwell = 450 } = {}) {
  const box = await locator.boundingBox()
  if (!box) throw new Error("no box for locator")
  const x = box.x + box.width / 2
  const y = box.y + box.height / 2
  await page.mouse.move(x, y, { steps: 28 })
  await page.waitForTimeout(dwell)
  await page.mouse.down()
  await page.waitForTimeout(90)
  await page.mouse.up()
}

async function pause(page, ms) {
  await page.waitForTimeout(ms)
}

let clipStart = 0
let clipBox = null
let t0 = 0

async function openComposer(page) {
  await page.goto(`${BASE}/dashboard/analytics`)
  await page.getByRole("button", { name: "Edit layout" }).waitFor()
  await pause(page, 1400)
  await glide(page, page.getByRole("button", { name: "Edit layout" }))
  await pause(page, 700)
  await glide(page, page.getByRole("button", { name: "Add widget" }))
  await pause(page, 500)
  await glide(page, page.getByRole("menuitem", { name: /Custom chart/ }))
  await page.getByRole("dialog").waitFor()
  await pause(page, 900)
  // Everything before this instant gets trimmed; everything outside
  // this box gets cropped.
  clipStart = (Date.now() - t0) / 1000
  const box = await page.getByRole("dialog").boundingBox()
  const pad = 10
  clipBox = {
    x: Math.max(0, Math.floor((box.x - pad) / 2) * 2),
    y: Math.max(0, Math.floor((box.y - pad) / 2) * 2),
    w: Math.min(W, Math.ceil((box.width + pad * 2) / 2) * 2),
    h: Math.min(H, Math.ceil((box.height + pad * 2) / 2) * 2),
  }
}

/** The dialog's selects, in DOM order: X axis, Y axis, Chart. */
function combo(page, i) {
  return page.getByRole("dialog").getByRole("combobox").nth(i)
}

async function pick(page, comboIndex, optionName) {
  const option = page
    .getByRole("option", { name: optionName, exact: true })
    .first()
  // Radix toggles on pointer timing; retry the trigger if the list
  // did not open.
  for (let attempt = 0; attempt < 3; attempt++) {
    await glide(page, combo(page, comboIndex))
    try {
      await option.waitFor({ timeout: 2500 })
      break
    } catch {}
  }
  await pause(page, 650)
  await glide(page, option)
  await pause(page, 800)
}

async function record(name, run) {
  mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: W, height: H },
    colorScheme: "dark",
    recordVideo: { dir: OUT, size: { width: W, height: H } },
  })
  await context.addCookies([
    { name: "access_token", value: "demo", url: BASE },
  ])
  await context.addInitScript(CURSOR_JS)
  const page = await context.newPage()
  t0 = Date.now()
  try {
    await run(page)
  } catch (err) {
    await page.screenshot({ path: `${OUT}/${name}-FAILED.png` })
    throw err
  } finally {
    const video = page.video()
    await context.close()
    if (video) {
      const p = await video.path()
      const raw = `${OUT}/${name}-raw.webm`
      renameSync(p, raw)
      if (clipBox) {
        const { x, y, w, h } = clipBox
        execSync(
          `ffmpeg -y -loglevel error -ss ${clipStart.toFixed(2)} -i "${raw}" ` +
            `-vf "crop=${w}:${h}:${x}:${y}" -c:v libvpx-vp9 -b:v 0 -crf 34 ` +
            `"${OUT}/${name}.webm"`
        )
        rmSync(raw)
      } else {
        renameSync(raw, `${OUT}/${name}.webm`)
      }
      console.log(`✓ ${OUT}/${name}.webm`)
    }
    await browser.close()
  }
}

/* ── workflow 1: Instagram's iOS geography, as a map ────────────────── */
await record("composer-geo", async (page) => {
  await openComposer(page)
  await pick(page, 0, "Countries")
  await pick(page, 2, "Map")
  // Scope: referrer
  const dialog = page.getByRole("dialog")
  await glide(page, dialog.getByRole("button", { name: /^Referrer/ }))
  await pause(page, 800)
  const opt = page.getByRole("option").first()
  if (await opt.isVisible().catch(() => false)) {
    await glide(page, opt)
  } else {
    const cb = page.getByRole("menuitemcheckbox").first()
    if (await cb.isVisible().catch(() => false)) await glide(page, cb)
  }
  await page.keyboard.press("Escape")
  await pause(page, 600)
  // Ink: amber
  await glide(page, dialog.getByRole("button", { name: "amber ink" }))
  await pause(page, 2200)
})

console.log("done")
