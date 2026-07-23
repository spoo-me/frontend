/**
 * Records product-demo clips by driving the dev-only recording stage
 * (/stage/*) with Playwright. No CI: `npm run record:demos` with the
 * mock server on :3005. Output lands in public/demos/.
 *
 * The stage puts the component alone on the band's own background, so
 * there is nothing to crop and dropdowns have room inside the frame.
 * The cursor is an injected overlay; clicks ripple.
 */
import { execSync } from "node:child_process"
import { mkdirSync, renameSync, rmSync } from "node:fs"
import { chromium } from "playwright"

const BASE = process.env.DEMO_BASE ?? "http://localhost:3005"
const OUT = "public/demos"
const W = 1072
const H = 880

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
    s.textContent = '@keyframes pwRip{from{transform:scale(.4);opacity:.9}to{transform:scale(1.4);opacity:0}} nextjs-portal{display:none!important}'
    document.head.appendChild(s)
  })()
`

let clipStart = 0
let t0 = 0

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

async function openStage(page, path) {
  await page.goto(`${BASE}${path}`)
  await page.getByRole("combobox").first().waitFor()
  // Let charts and fonts settle before the take starts.
  await pause(page, 2000)
  clipStart = (Date.now() - t0) / 1000
}

/** Stage selects, DOM order: X axis, Y axis, Chart, Chart accent. */
function combo(page, i) {
  return page.getByRole("combobox").nth(i)
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
      execSync(
        `ffmpeg -y -loglevel error -ss ${clipStart.toFixed(2)} -i "${raw}" ` +
          `-c:v libvpx-vp9 -b:v 0 -crf 32 "${OUT}/${name}.webm"`
      )
      rmSync(raw)
      console.log(`✓ ${OUT}/${name}.webm`)
    }
    await browser.close()
  }
}

/* ── workflow 1: Instagram's geography, as an amber map ─────────────── */
await record("composer-geo", async (page) => {
  await openStage(page, "/stage/composer")
  await pick(page, 0, "Countries")
  await pick(page, 2, "Map")
  // Scope: referrer
  await glide(page, page.getByRole("button", { name: /^Referrer/ }))
  await pause(page, 900)
  const opt = page.getByRole("option").first()
  if (await opt.isVisible().catch(() => false)) {
    await glide(page, opt)
  } else {
    const cb = page.getByRole("menuitemcheckbox").first()
    if (await cb.isVisible().catch(() => false)) await glide(page, cb)
  }
  await page.keyboard.press("Escape")
  await pause(page, 600)
  await pick(page, 3, "Amber")
  await pause(page, 2200)
})

console.log("done")
