// Captures the README screenshots from a running dev server.
//
//   npm run dev   (client)  — first
//   npm install   (in scripts/)
//   npm run capture
//
// Uses playwright-core with your system Chrome/Edge (no browser download).
// Shots are written to ../docs/screenshots/ so the README can reference them.

import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { chromium } from 'playwright-core'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'docs', 'screenshots')
mkdirSync(outDir, { recursive: true })

const BASE = process.env.BASE_URL || 'http://localhost:5173'
const CHROME =
  process.env.CHROME_PATH ||
  'C:/Program Files/Google/Chrome/Application/chrome.exe'

const browser = await chromium.launch({ executablePath: CHROME, headless: true })
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
})

// The admin session must exist before app code runs (AuthContext reads
// localStorage during the initial render).
await ctx.addInitScript(() => {
  localStorage.setItem('lumen.token', 'demo-token')
  localStorage.setItem(
    'lumen.session.v1',
    JSON.stringify({ id: 'admin_1', name: 'Store Admin', email: 'admin@lumen.test', role: 'admin' })
  )
})

const page = await ctx.newPage()
const shot = async (name, fullPage = false) => {
  await page.screenshot({ path: join(outDir, name), fullPage, animations: 'disabled' })
  console.log('  saved', name)
}

try {
  // 1 · Home — hero shot
  console.log('capturing home…')
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await page.waitForSelector('text=Everyday essentials')
  await page.waitForSelector('text=Featured this week')
  await page.waitForTimeout(500)
  await shot('home.png')

  // 2 · Shop — add an item to the cart for the checkout shot later
  console.log('capturing shop…')
  await page.goto(`${BASE}/shop`, { waitUntil: 'networkidle' })
  await page.waitForSelector('h1:has-text("All products")')
  await page.waitForTimeout(600)
  await shot('shop.png', true)
  const addBtn = page.locator('button[aria-label^="Add "]').first()
  await addBtn.click()
  await page.waitForSelector('a[aria-label^="Cart,"]:has-text("1")')
  console.log('  cart now has 1 item')

  // 3 · Checkout — PayPal method selected (proves dual providers)
  console.log('capturing checkout (PayPal)…')
  await page.goto(`${BASE}/checkout`, { waitUntil: 'networkidle' })
  await page.waitForSelector('h1:has-text("Checkout")')
  await page.getByPlaceholder('Sara Mitchell').fill('Sara Mitchell')
  await page.getByPlaceholder('sara@example.com').fill('sara@example.com')
  await page.getByPlaceholder('482 Market St, Apt 9').fill('482 Market St, Apt 9')
  await page.getByPlaceholder('San Francisco').fill('San Francisco')
  await page.getByRole('tab', { name: /PayPal/ }).click()
  await page.waitForSelector('input[placeholder="buyer@demo.test"]')
  await page.waitForTimeout(400)
  await shot('checkout-paypal.png')

  // 4 · Admin dashboard
  console.log('capturing admin dashboard…')
  await page.goto(`${BASE}/admin`, { waitUntil: 'networkidle' })
  await page.waitForSelector('h1:has-text("Dashboard")')
  await page.waitForTimeout(900) // KPI cards + 7-day revenue chart settle
  await shot('admin-dashboard.png')

  // 5 · Admin products — the no-code management proof
  console.log('capturing admin products…')
  await page.goto(`${BASE}/admin/products`, { waitUntil: 'networkidle' })
  await page.waitForSelector('h1:has-text("Products")')
  await page.waitForTimeout(700)
  await shot('admin-products.png', true)
} finally {
  await browser.close()
}

console.log('Done →', outDir)
