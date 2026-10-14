// Products + product detail show only the buttons the server lets this role use (s167).
// Server rule (inventory ProductViewSet.role_map): list/retrieve = CASHIER, add/edit/ghost/photos = MANAGER+.
// The test reads the logged-in role, then expects:
//   CASHIER  → no Add, no ghost/edit column, Ctrl+N opens nothing, no Edit / photo buttons on the detail page
//   MANAGER+ → all of those present
// and, for every role, no 403 from /api/ on either page.
// Runs against the DEV app (Vite :4456 → Django :8001). Never point it at prod.
//   node e2e/products-by-role.test.mjs        (BASE / E2E_USER / CHROME_PATH optional)
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import pw from '/home/ubuntu/vendorya-dev/vendorya-frontend/node_modules/playwright/index.js'
const { chromium } = pw

const BASE = process.env.BASE || 'http://localhost:4456'
const USER = process.env.E2E_USER || 'alexcashier'                // CASHIER @ GATES (dev)
const PASS = process.env.E2E_PASSWORD || process.env.E2E_CASHIER_PASSWORD ||
  (readFileSync(new URL('../../vendorya-backend/.env', import.meta.url), 'utf8').match(/^E2E_CASHIER_PASSWORD=(.*)$/m) || [])[1]
const SHOTS = process.env.SHOTS || '/tmp/vendorya-e2e'
mkdirSync(SHOTS, { recursive: true })
const CHROME = process.env.CHROME_PATH || (existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined)

let failed = 0
const check = (ok, msg) => { console.log(`  ${ok ? '✅ PASS' : '❌ FAIL'}  ${msg}`); if (!ok) failed++ }

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const forbidden = []
page.on('response', r => {
  if (r.url().includes('/api/') && r.status() === 403) forbidden.push(`${r.request().method()} ${r.url().replace(/^https?:\/\/[^/]+/, '')}`)
})

try {
  await page.goto(BASE + '/login')
  await page.fill('input[autocomplete="username"]', USER)
  await page.fill('input[autocomplete="current-password"]', PASS)
  await page.keyboard.press('Enter')
  await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 15000 })
  const role = await page.evaluate(() => JSON.parse(localStorage.getItem('vendorya_user') || '{}').role)
  const manager = role && role !== 'CASHIER'
  console.log(`Logged in as ${USER} (${role}) → expecting ${manager ? 'write buttons' : 'NO write buttons'}`)

  console.log('1) Products list')
  await page.goto(BASE + '/inventory/products')
  await page.waitForSelector('.dt-row', { timeout: 15000 })
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.screenshot({ path: `${SHOTS}/products-${role}.png` })
  check((await page.locator('.dt-add').count() > 0) === manager, `Add Product button ${manager ? 'shown' : 'hidden'}`)
  check((await page.locator('.dt-actcol').count() > 0) === manager, `ghost / edit column ${manager ? 'shown' : 'hidden'}`)
  await page.locator('.inv-title').click()           // focus OUTSIDE a text box — the shortcut ignores keys typed in inputs
  await page.keyboard.press('Control+n')
  await page.waitForTimeout(400)
  const modalOpen = await page.locator('.modal-backdrop').filter({ visible: true }).count() > 0
  check(modalOpen === manager, `Ctrl+N ${manager ? 'opens' : 'does not open'} the new-product window`)
  if (modalOpen) await page.keyboard.press('Escape')

  console.log('2) Product detail')
  await page.goto(BASE + '/inventory/products')
  await page.waitForSelector('.dt-row', { timeout: 15000 })
  await page.locator('.dt-row').first().click()
  await page.waitForURL(/\/inventory\/products\/[0-9a-f-]{36}/, { timeout: 15000 })
  await page.waitForSelector('.showcase-layout', { timeout: 15000 })
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.screenshot({ path: `${SHOTS}/product-detail-${role}.png` })
  check((await page.locator('.edit-prod-btn').count() > 0) === manager, `Edit Product button ${manager ? 'shown' : 'hidden'}`)
  check((await page.locator('.sc-add').count() > 0) === manager, `add photo / video buttons ${manager ? 'shown' : 'hidden'}`)
  check((await page.locator('.sc-settings').count() > 0) === manager, `showcase settings ${manager ? 'shown' : 'hidden'}`)

  check(forbidden.length === 0, `no 403 from the server on either page${forbidden.length ? ': ' + forbidden.join(' · ') : ''}`)
} catch (e) {
  console.log('  ❌ FAIL  crashed:', e.message)
  failed++
} finally {
  await browser.close()
}
console.log(failed ? `\n${failed} FAILED` : '\nALL PASS')
process.exit(failed ? 1 : 0)
