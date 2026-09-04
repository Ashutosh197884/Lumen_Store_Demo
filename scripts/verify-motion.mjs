// Verifies the CSS animations actually tick in a real rendering browser.
//
//   npm run dev      (client) — first
//   npm install      (in scripts/)
//   npm run verify-motion
//
// Uses playwright-core with your system Chrome. The app's Preview tab can't
// be used for this: its webview doesn't composite, so CSS animations freeze.

import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { chromium } from 'playwright-core'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const BASE = process.env.BASE_URL || 'http://localhost:5173'
const CHROME =
  process.env.CHROME_PATH ||
  'C:/Program Files/Google/Chrome/Application/chrome.exe'

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })

// Admin session so /admin renders logged in
await ctx.addInitScript(() => {
  localStorage.setItem('lumen.token', 'demo-token')
  localStorage.setItem(
    'lumen.session.v1',
    JSON.stringify({ id: 'admin_1', name: 'Store Admin', email: 'admin@lumen.test', role: 'admin' })
  )
})

const page = await ctx.newPage()
const results = []
const check = (name, pass, detail) => {
  results.push({ name, pass, detail })
  console.log(`${pass ? '  ✓' : '  ✗'} ${name}${detail ? ` — ${detail}` : ''}`)
}

try {
  // 1 · Home: CSS animations must advance (hero gradient, blobs, float)
  console.log('home — animation ticking…')
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.text-gradient-animated')
  await page.waitForTimeout(600)
  const tick = await page.evaluate(() => {
    const t = document.querySelector('.text-gradient-animated').getAnimations()
    const blob = document.querySelector('.animate-blob').getAnimations()
    const read = () => ({
      grad: t.length ? Math.round(t[0].currentTime) : null,
      blob: blob.length ? Math.round(blob[0].currentTime) : null,
    })
    const a = read()
    return new Promise((resolve) =>
      setTimeout(() => {
        const b = read()
        resolve({ a, b })
      }, 500)
    )
  })
  check(
    'hero animations advance',
    tick.b.grad > tick.a.grad && tick.b.blob > tick.a.blob,
    `gradient ${tick.a.grad}→${tick.b.grad}ms, blob ${tick.a.blob}→${tick.b.blob}ms`
  )

  // 2 · Home: scroll reveals fire as you scroll
  console.log('home — scroll reveals…')
  const reveals = await page.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms))
    const maxY = document.documentElement.scrollHeight - window.innerHeight
    for (let y = 0; y <= maxY; y += 400) {
      window.scrollTo({ top: y, behavior: 'instant' })
      await wait(90)
    }
    await wait(500)
    const total = document.querySelectorAll('.reveal').length
    const visible = document.querySelectorAll('.reveal.is-visible').length
    window.scrollTo({ top: 0, behavior: 'instant' })
    return { total, visible }
  })
  check('scroll reveals fire', reveals.visible === reveals.total, `${reveals.visible}/${reveals.total} visible`)

  // 3 · Shop: add-to-cart toast + button feedback + badge
  console.log('shop — add-to-cart feedback…')
  await page.goto(`${BASE}/shop`, { waitUntil: 'networkidle' })
  await page.waitForSelector('button[aria-label^="Add "]')
  const addRes = await page.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms))
    const btn = document.querySelector('button[aria-label^="Add "]')
    btn.click()
    await wait(150)
    const toastSeen = !!(document.querySelector('[role=status]') || {}).textContent
    const btnGreen = btn.className.includes('emerald')
    const badgeAnim = (() => {
      const b = document.querySelector('a[aria-label^="Cart,"] span')
      return b ? getComputedStyle(b).animationName : null
    })()
    await wait(2600)
    const toastGone = !document.querySelector('[role=status]')
    return { toastSeen, toastGone, btnGreen, badgeAnim }
  })
  check('toast appears', addRes.toastSeen, '')
  check('toast auto-dismisses', addRes.toastGone, '')
  check('add button flashes added state', addRes.btnGreen, '')
  check('cart badge pops', addRes.badgeAnim === 'pop', `animation ${addRes.badgeAnim}`)

  // 4 · Cart: progress bar must visibly grow toward ~86% of its rail
  console.log('cart — progress bar growth…')
  await page.goto(`${BASE}/cart`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.animate-grow-width')
  const bar = await page.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms))
    const widths = []
    for (let i = 0; i < 8; i++) {
      const el = document.querySelector('.animate-grow-width')
      widths.push(Math.round(parseFloat(getComputedStyle(el).width)))
      await wait(90)
    }
    const rail = document.querySelector('.animate-grow-width').parentElement.getBoundingClientRect().width
    return { widths, rail }
  })
  const w = bar.widths
  const grew = w[w.length - 1] > w[0] + 20 && w[w.length - 1] > 0.74 * bar.rail
  check('free-shipping bar grows to width', grew, `${w.join(' → ')}px of ~${Math.round(bar.rail)}px rail`)

  // 5 · Admin: revenue bars animate up (track the tallest bar through its growth)
  console.log('admin — revenue bars…')
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' })
  await page.waitForSelector('.animate-grow-y', { state: 'attached' })
  const bars = await page.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms))
    // Tallest bar = the one closest to 100% of the zone
    const tallest = [...document.querySelectorAll('.animate-grow-y')].sort(
      (a, b) => parseFloat(b.style.height) - parseFloat(a.style.height)
    )[0]
    const frames = []
    for (let i = 0; i < 12; i++) {
      frames.push(Math.round(tallest.getBoundingClientRect().height))
      await wait(110)
    }
    const zone = tallest.parentElement.getBoundingClientRect().height
    return { frames, zone: Math.round(zone) }
  })
  const h = bars.frames
  const rose = h.some((v, i) => i > 0 && v > h[i - 1] + 15)
  const topped = h[h.length - 1] > bars.zone * 0.85
  check('revenue bars grow up', rose && topped, `heights ${h.join(' → ')}px of ~${bars.zone}px zone`)
} finally {
  await browser.close()
}

const failed = results.filter((r) => !r.pass)
console.log(failed.length === 0 ? '\nAll motion checks passed ✓' : `\n${failed.length} check(s) failed ✗`)
process.exit(failed.length === 0 ? 0 : 1)
