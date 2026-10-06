// Till as a CASHIER, in a real browser (s156).
// Guards two bugs fixed in s156:
//   1. a cashier's cart changes after the first sync were refused → checkout completed a STALE cart;
//   2. checkout + payment are ONE step; Ajel (credit) on a Walk-in customer is refused with a message.
// 400 = the deliberate Ajel refusal; 401 = one early call after the hard reload of /pos (the app refreshes the
// token and retries — known, harmless, logged in TODO). Both are listed under 'API calls that failed'.
// Runs against the DEV app (Vite :4456 → Django :8001). Never point it at prod.
//   node e2e/till-cashier.test.mjs            (BASE / E2E_TILL_USER / CHROME_PATH optional)
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import pw from '/home/ubuntu/vendorya-dev/vendorya-frontend/node_modules/playwright/index.js'
const { chromium } = pw

const BASE = process.env.BASE || 'http://localhost:4456'
const USER = process.env.E2E_TILL_USER || 's156cashier'          // CASHIER @ Khodair (dev only)
const PASS = process.env.E2E_CASHIER_PASSWORD ||
  (readFileSync(new URL('../../vendorya-backend/.env', import.meta.url), 'utf8').match(/^E2E_CASHIER_PASSWORD=(.*)$/m) || [])[1]
const SHOTS = process.env.SHOTS || '/tmp/vendorya-e2e'
mkdirSync(SHOTS, { recursive: true })
const CHROME = process.env.CHROME_PATH || (existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined)

let failed = 0
const check = (ok, msg) => { console.log(`  ${ok ? '✅ PASS' : '❌ FAIL'}  ${msg}`); if (!ok) failed++ }

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const consoleErrors = []
page.on('console', m => { if (m.type() === 'error' && !/status of (400|401)/.test(m.text())) consoleErrors.push(m.text()) })
const refused = []
const apiErrors = []
page.on('response', r => {
  if (r.url().includes('/api/finance/invoices/') && r.status() === 403) refused.push(r.url())
  if (r.url().includes('/api/') && r.status() >= 400) apiErrors.push(`${r.status()} ${r.request().method()} ${r.url().replace(/^https?:\/\/[^/]+/, '')}  (on ${new URL(page.url()).pathname})`)
})

try {
  console.log('1) Login as cashier')
  await page.goto(BASE + '/login')
  await page.fill('input[autocomplete="username"]', USER)
  await page.fill('input[autocomplete="current-password"]', PASS)
  await page.keyboard.press('Enter')
  await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 15000 })
  check(true, 'logged in')

  console.log('2) Open the till')
  await page.goto(BASE + '/pos')
  await page.waitForSelector('.pos-search', { timeout: 15000 })
  // A branch picker may appear on first use — pick the first branch.
  const picker = page.locator('.modal, [role="dialog"]').filter({ hasText: /branch/i })
  if (await picker.count()) {
    await picker.locator('button, .bp-item, li').first().click().catch(() => {})
    await page.locator('button:has-text("Start"), button:has-text("Confirm"), button:has-text("Select")').first().click().catch(() => {})
  }
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(1000)          // the till finishes its start-up (branch, walk-in, settings)
  await page.screenshot({ path: `${SHOTS}/till-1-open.png` })

  console.log('3) Ring up 3 lines (one item twice) — every change after the first must reach the server')
  async function add(q) {
    // type key by key like a cashier (a one-shot fill() doesn't fire the till's search handler)
    await page.click('.pos-search')
    await page.fill('.pos-search', '')
    await page.keyboard.type(q, { delay: 40 })
    await page.waitForSelector('.pos-search-item', { timeout: 10000 })
    await page.locator('.pos-search-item').first().dispatchEvent('mousedown')
    await page.waitForTimeout(700)
  }
  // The till sells the shop's OWN products only (dev Khodair: conventin / augmentin are STORE products)
  await add('augmentin')
  await add('conventin 400')
  await add('augmentin')                  // same product again → qty 2 on line 1
  await page.waitForTimeout(1200)          // let the debounced cart sync land
  await page.screenshot({ path: `${SHOTS}/till-2-cart.png` })
  check(refused.length === 0, `no cart sync refused (403s: ${refused.length})`)

  console.log('4) Pay cash')
  await page.click('.pos-pay-btn')
  await page.waitForSelector('.pm-method', { timeout: 10000 })
  await page.locator('.pm-method', { hasText: /cash/i }).first().click()
  await page.fill('.pm-body input[type="number"], .pm-body input', '100000')
  await page.screenshot({ path: `${SHOTS}/till-3-pay.png` })
  const [res] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/checkout/'), { timeout: 15000 }),
    page.click('.pm-confirm'),
  ])
  const inv = await res.json()
  check(res.status() === 200, `checkout answered ${res.status()}`)
  check(inv.status === 'POSTED', `invoice is POSTED (${inv.status})`)
  const lines = (inv.items || []).length
  const qty = (inv.items || []).reduce((a, i) => a + Number(i.quantity), 0)
  check(lines === 2 && qty === 3, `server invoice has the WHOLE cart: ${lines} lines / qty ${qty} (want 2 / 3)`)
  check(Number(inv.paid_amount) === Number(inv.grand_total) && Number(inv.grand_total) > 0,
        `paid in the same step: paid ${inv.paid_amount} of ${inv.grand_total}`)
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${SHOTS}/till-4-done.png` })

  console.log('5) New sale → Ajel on Walk-in: blocked up front with a message (the server refuses it too — unit test)')
  await page.keyboard.press('Escape').catch(() => {})
  await page.locator('button:has-text("New Sale"), button:has-text("New sale")').first().click().catch(() => {})
  await page.waitForTimeout(500)
  await add('augmentin')
  await page.waitForTimeout(1000)
  await page.click('.pos-pay-btn')
  await page.waitForSelector('.pm-method', { timeout: 10000 })
  await page.locator('.pm-method', { hasText: /ajel|آجل|credit/i }).first().click()
  await page.waitForTimeout(300)
  check(await page.locator('.pm-confirm').isDisabled(), 'Confirm is disabled for Ajel on Walk-in')
  const shown = await page.locator('.pm-body').innerText()
  check(/named customer/i.test(shown), 'the cashier is told up front to pick a named customer')
  await page.screenshot({ path: `${SHOTS}/till-5-ajel-refused.png` })
} catch (e) {
  check(false, 'crashed: ' + e.message.split('\n')[0])
  await page.screenshot({ path: `${SHOTS}/till-crash.png` }).catch(() => {})
}
check(consoleErrors.length === 0, `no console errors (${consoleErrors.length})${consoleErrors.length ? ': ' + consoleErrors.slice(0, 3).join(' | ') : ''}`)
if (apiErrors.length) console.log('  ℹ️  API calls that failed during the run:\n    ' + [...new Set(apiErrors)].join('\n    '))
await browser.close()
console.log(failed ? `\n❌ ${failed} CHECK(S) FAILED` : '\n✅ ALL CHECKS PASSED')
process.exit(failed ? 1 : 0)
