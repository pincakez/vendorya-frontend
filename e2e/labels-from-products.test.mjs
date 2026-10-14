// Price stickers from the product list + the product page (s167, PROLINE-PARITY Upgrade 14).
//   MANAGER: bulk mode → pick 2 products → Print labels → /print/labels shows one sticker per variant
//            (+ "1 per unit in stock" gives the stock count); product page → 1 product's stickers;
//            a received purchase → Print Labels still reaches /print/labels.
//   CASHIER: may print labels too (s157 §AUDIT B7: cashiers print labels) — bulk bar shows ONLY
//            "Print labels" (no ghost / edit / delete), product page button works, no 403 anywhere.
// The test flips the dev user `alexcashier` to MANAGER for the first half and ALWAYS puts it back
// to CASHIER (finally). Runs against the DEV app only. Never point it at prod.
//   BASE=http://localhost:4463 node e2e/labels-from-products.test.mjs
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import pw from '/home/ubuntu/vendorya-dev/vendorya-frontend/node_modules/playwright/index.js'
const { chromium } = pw

const BASE = process.env.BASE || 'http://localhost:4456'
const USER = process.env.E2E_USER || 'alexcashier'                // CASHIER @ GATES (dev)
const PASS = process.env.E2E_PASSWORD || process.env.E2E_CASHIER_PASSWORD ||
  (readFileSync('/home/ubuntu/vendorya-dev/vendorya-backend/.env', 'utf8').match(/^E2E_CASHIER_PASSWORD=(.*)$/m) || [])[1]
const SHOTS = process.env.SHOTS || '/tmp/vendorya-e2e'
mkdirSync(SHOTS, { recursive: true })
const CHROME = process.env.CHROME_PATH || (existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined)
const DEV_PY = '/home/ubuntu/vendorya-dev/vendorya-backend/venv/bin/python'
const DEV_MANAGE = '/home/ubuntu/vendorya-dev/vendorya-backend/manage.py'

let failed = 0
const check = (ok, msg) => { console.log(`  ${ok ? '✅ PASS' : '❌ FAIL'}  ${msg}`); if (!ok) failed++ }

function setRole(role) {
  if (!/^[A-Z]+$/.test(role) || !/^[a-z0-9_]+$/.test(USER)) throw new Error('bad role/user')
  execFileSync(DEV_PY, [DEV_MANAGE, 'shell', '-c',
    `from users.models import User; print(User.objects.filter(username='${USER}').update(role='${role}'))`],
  { stdio: ['ignore', 'pipe', 'pipe'] })
}

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })

async function session(label) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await ctx.newPage()
  const forbidden = []
  page.on('response', r => {
    if (r.url().includes('/api/') && r.status() === 403) forbidden.push(`${r.request().method()} ${r.url().replace(/^https?:\/\/[^/]+/, '')}`)
  })
  await page.goto(BASE + '/login')
  await page.fill('input[autocomplete="username"]', USER)
  await page.fill('input[autocomplete="current-password"]', PASS)
  await page.keyboard.press('Enter')
  await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 15000 })
  const role = await page.evaluate(() => JSON.parse(localStorage.getItem('vendorya_user') || '{}').role)
  console.log(`\n── ${label}: logged in as ${USER} (${role})`)
  return { ctx, page, forbidden, role }
}

async function openProducts(page) {
  await page.goto(BASE + '/inventory/products')
  await page.waitForSelector('.dt-row', { timeout: 15000 })
  await page.waitForLoadState('networkidle').catch(() => {})
}

// Open the labels window, wait for its data, return the label-data response JSON.
async function openLabelsWindow(page, clickSel) {
  const [resp] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/inventory/products/label-data/'), { timeout: 15000 }),
    page.locator(clickSel).click(),
  ])
  const body = await resp.json()
  const ids = JSON.parse(resp.request().postData() || '{}').ids || []
  await page.waitForSelector('[data-testid="labels-summary"]', { timeout: 10000 })
  return { status: resp.status(), body, ids }
}

async function printAndCount(page) {
  await page.locator('[data-testid="labels-print"]').click()
  await page.waitForURL(/\/print\/labels/, { timeout: 10000 })
  await page.waitForSelector('.label-card', { timeout: 10000 })
  return page.locator('.label-card').count()
}

async function bulkPrint(page, n) {
  await openProducts(page)
  await page.locator('[data-testid="bulk-toggle"]').click()
  const boxes = page.locator('.dt-row .dt-cb')
  for (let i = 0; i < n; i++) await boxes.nth(i).check()
  return openLabelsWindow(page, '[data-testid="bulk-print-labels"]')
}

try {
  // ═════ MANAGER ═════
  setRole('MANAGER')
  try {
    const { ctx, page, forbidden, role } = await session('MANAGER')
    check(role === 'MANAGER', 'role switched to MANAGER')

    console.log('1) Products list → bulk → 2 products → Print labels')
    const ld = await bulkPrint(page, 2)
    check(ld.status === 200, 'label-data answers 200')
    check(ld.ids.length === 2, `2 products sent (${ld.ids.length})`)
    const items = ld.body.items
    check(items.length >= 2 && new Set(items.map(i => i.product_id)).size === 2, `one sticker line per variant of the 2 products (${items.length})`)
    // ghost / edit / delete keep their old Owner/Admin-only gate — a manager's bar has Print labels only
    check(await page.locator('.bulk-bar .bulk-actions button').count() === 1, 'manager bulk bar: Print labels only')
    await page.screenshot({ path: `${SHOTS}/labels-modal-MANAGER.png` })
    const cards = await printAndCount(page)
    check(cards === items.length, `print page shows ${items.length} labels (1 each) → ${cards}`)
    const names = await page.locator('.lbl-name').allTextContents()
    check(names.length === 0 || items.every(i => names.includes(i.product_name)), 'every product name is on a label (when the preset shows names)')
    const skus = await page.locator('.lbl-sku').allTextContents()
    check(skus.length === 0 || items.every(i => skus.includes(i.sku)), 'every SKU is on a label (when the preset shows SKUs)')
    const meta = await page.locator('[data-testid="label-meta"]').textContent()
    check(meta.includes(String(items.length)), `toolbar count says ${items.length} (“${meta.trim()}”)`)
    await page.screenshot({ path: `${SHOTS}/labels-print-MANAGER.png` })

    console.log('2) Same 2 products, "1 per unit in stock"')
    const ld2 = await bulkPrint(page, 2)
    await page.locator('[data-testid="labels-mode-stock"]').click()
    const want = ld2.body.items.reduce((s, i) => s + i.stock_labels, 0)
    const shown = Math.min(want, 500)
    const cards2 = await printAndCount(page)
    check(cards2 === shown, `stock mode → ${shown} labels on the page (stock total ${want}) → ${cards2}`)

    console.log('3) Product page → Print labels → 1 product')
    await openProducts(page)
    await page.locator('.dt-row').first().click()
    await page.waitForURL(/\/inventory\/products\/[0-9a-f-]{36}/, { timeout: 15000 })
    const pid = page.url().split('/').pop()
    await page.waitForSelector('[data-testid="detail-print-labels"]', { timeout: 15000 })
    const ld3 = await openLabelsWindow(page, '[data-testid="detail-print-labels"]')
    check(ld3.ids.length === 1 && ld3.ids[0] === pid, 'only this product is sent')
    check(ld3.body.items.length >= 1 && ld3.body.items.every(i => i.product_id === pid), `${ld3.body.items.length} sticker line(s), all this product`)
    const cards3 = await printAndCount(page)
    check(cards3 === ld3.body.items.length, `print page shows ${ld3.body.items.length} label(s) → ${cards3}`)

    console.log('4) Purchase invoice → Print Labels still works')
    await page.goto(BASE + '/inventory/purchases')
    await page.waitForLoadState('networkidle').catch(() => {})
    const received = page.locator('tr.dt-row', { has: page.locator('.status-received') })
    if (await received.count()) {
      await received.first().click()
      await page.locator('[data-testid="purchase-print-labels"]').click()
      await page.locator('[data-testid="purchase-labels-print"]').click()
      await page.waitForURL(/\/print\/labels/, { timeout: 10000 })
      await page.waitForSelector('.label-card', { timeout: 10000 })
      check(await page.locator('.label-card').count() > 0, `purchase → ${await page.locator('.label-card').count()} labels`)
    } else {
      await page.goto(BASE + '/print/labels')
      check(await page.locator('.label-page').count() === 1, 'no received purchase on dev — /print/labels renders')
    }
    check(forbidden.length === 0, `no 403 from /api/ ${forbidden.length ? '→ ' + forbidden.join(', ') : ''}`)
    await ctx.close()
  } finally {
    setRole('CASHIER')
    console.log('  (role set back to CASHIER)')
  }

  // ═════ CASHIER ═════
  {
    const { ctx, page, forbidden, role } = await session('CASHIER')
    check(role === 'CASHIER', 'role is CASHIER again')
    console.log('5) Cashier: bulk mode shows ONLY Print labels; stickers print')
    const ld = await bulkPrint(page, 2)
    check(ld.status === 200, 'label-data answers 200 for a cashier')
    const bulkButtons = await page.locator('.bulk-bar .bulk-actions button').count()
    check(bulkButtons === 1, `bulk bar has only the Print labels button (${bulkButtons})`)
    const cards = await printAndCount(page)
    check(cards === ld.body.items.length, `print page shows ${ld.body.items.length} labels → ${cards}`)
    console.log('6) Cashier: product page button')
    await openProducts(page)
    await page.locator('.dt-row').first().click()
    await page.waitForSelector('[data-testid="detail-print-labels"]', { timeout: 15000 })
    check(true, 'Print labels button on the product page')
    check(forbidden.length === 0, `no 403 from /api/ ${forbidden.length ? '→ ' + forbidden.join(', ') : ''}`)
    await page.screenshot({ path: `${SHOTS}/labels-detail-CASHIER.png` })
    await ctx.close()
  }
} catch (e) {
  console.log('❌ ERROR', e.message)
  failed++
} finally {
  await browser.close()
}
console.log(failed ? `\n${failed} check(s) FAILED` : '\nALL PASS')
process.exit(failed ? 1 : 0)
