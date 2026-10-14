// The till's payment window with split payment (s167, PROLINE-PARITY Upgrades 1 + 5), in a real browser.
// Opens the window on a one-item cart and checks the fast path (one line, full amount, Enter-ready), then
// splits it: 600 typed → Enter opens a 2nd line for the rest → Alt+2 picks the 2nd method → nothing left;
// an over-paid cash line shows change; Ajel shows "the rest on account". Desktop (1440) + phone (390).
// Read-only: checkout calls are BLOCKED by the test; the draft it made is voided at the end.
// Runs against DEV (Vite → Django :8001). Never point it at prod.
//   BASE=http://localhost:4462 node e2e/split-payment-window.test.mjs
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import pw from '/home/ubuntu/vendorya-dev/vendorya-frontend/node_modules/playwright/index.js'
const { chromium } = pw

const BASE = process.env.BASE || 'http://localhost:4456'
const USER = process.env.E2E_TILL_USER || 'alexcashier'            // CASHIER @ GATES (dev only)
const PASS = process.env.E2E_CASHIER_PASSWORD ||
  (readFileSync('/home/ubuntu/vendorya-dev/vendorya-backend/.env', 'utf8').match(/^E2E_CASHIER_PASSWORD=(.*)$/m) || [])[1]
const SHOTS = process.env.SHOTS || '/tmp/vendorya-e2e'
const QUERY = process.env.E2E_PRODUCT || 'dell'
const CUSTOMER = process.env.E2E_CUSTOMER || 'ahmed'
mkdirSync(SHOTS, { recursive: true })
const CHROME = process.env.CHROME_PATH || (existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined)

let failed = 0
const check = (ok, msg) => { console.log(`  ${ok ? '✅ PASS' : '❌ FAIL'}  ${msg}`); if (!ok) failed++ }
const num = s => parseFloat(String(s).replace(/[^0-9.\-]/g, ''))

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })
const drafts = new Set()
let auth = null

async function run(width, height, tag) {
  const page = await browser.newPage({ viewport: { width, height } })
  const pageErrors = []
  page.on('pageerror', e => pageErrors.push(String(e)))
  // Safety: this test never completes a sale.
  await page.route('**/checkout/**', r => r.abort())
  page.on('request', req => {
    const m = req.url().match(/\/api\/finance\/invoices\/([0-9a-f-]{36})\//)
    if (m && !req.url().includes('/void/')) drafts.add(m[1])
    if (req.headers().authorization) auth = req.headers().authorization
  })
  page.on('response', async res => {
    if (res.request().method() === 'POST' && /\/api\/finance\/invoices\/$/.test(res.url())) {
      try { const j = await res.json(); if (j?.id) drafts.add(j.id) } catch { /* ignore */ }
    }
  })

  console.log(`\n[${tag}] 1) Login as cashier, put one item in the cart, open the payment window`)
  await page.goto(BASE + '/login')
  await page.fill('input[autocomplete="username"]', USER)
  await page.fill('input[autocomplete="current-password"]', PASS)
  await page.keyboard.press('Enter')
  await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 15000 })
  await page.goto(BASE + '/pos')
  await page.waitForSelector('.pos-search', { timeout: 15000 })
  await page.waitForLoadState('networkidle').catch(() => {})
  // A named customer (Ajel + store credit need one). Their store credit is FAKED in the browser only
  // (the GET is rewritten to 250.00) so the Store credit tab can be seen — nothing is written to the DB.
  await page.route('**/api/auth/customers/*/', async r => {
    const res = await r.fetch()
    const j = await res.json()
    await r.fulfill({ response: res, json: { ...j, store_credit: '250.00' } })
  })
  await page.locator('.pos-customer-input, .pos-customer-name').first().click()
  await page.locator('.pos-customer-input').fill(CUSTOMER)
  await page.waitForSelector('.pos-customer-item:not(.pci-add)', { timeout: 10000 })
  await page.locator('.pos-customer-item:not(.pci-add)').first().dispatchEvent('mousedown')
  await page.waitForTimeout(400)
  await page.fill('.pos-search', QUERY)
  await page.waitForSelector('.pos-search-item', { timeout: 10000 })
  await page.locator('.pos-search-item').first().dispatchEvent('mousedown')
  await page.waitForTimeout(1500)
  await page.locator('.pos-pay-btn:not([disabled])').first().click()
  await page.waitForSelector('.pm-body', { timeout: 10000 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${SHOTS}/split-${tag}-1-open.png` })

  const due = num(await page.locator('.pm-total-amount').innerText())
  check(await page.locator('.pm-line').count() === 1, 'opens with ONE payment line (fast path)')
  check(Math.abs(num(await page.locator('.pm-cash-input').first().inputValue()) - due) < 0.01, `the line holds the full amount (${due})`)
  check(await page.evaluate(() => document.activeElement?.classList.contains('pm-cash-input')), 'the amount box has focus — Enter pays')
  check(!(await page.locator('.pm-confirm').isDisabled()), 'Confirm is ready straight away')
  check(await page.locator('.pm-sc-badge').count() === 1, 'a named customer with store credit gets a Store credit tab')

  console.log(`[${tag}] 2) Split: type part, Enter → a 2nd line for the rest`)
  const part = Math.max(Math.floor(due * 0.6), 1)
  await page.keyboard.type(String(part))
  await page.waitForTimeout(150)
  check((await page.locator('.pm-left').innerText()).length > 0, 'shows "Left to pay" while money is still owed')
  check(await page.locator('.pm-confirm').isDisabled(), 'Confirm is blocked while money is still owed (no Ajel)')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(200)
  check(await page.locator('.pm-line').count() === 2, 'Enter with money owed opens a 2nd line')
  const second = num(await page.locator('.pm-cash-input').nth(1).inputValue())
  check(Math.abs(second - (due - part)) < 0.01, `the 2nd line holds the rest (${second})`)
  const methods = await page.locator('.pm-method').count()
  if (methods > 1) {
    await page.keyboard.press('Alt+2')
    await page.waitForTimeout(150)
    check(await page.locator('.pm-method').nth(1).evaluate(el => el.classList.contains('active')), 'Alt+2 picks the 2nd method for the active line')
  }
  check(!(await page.locator('.pm-confirm').isDisabled()), 'nothing left to pay → Confirm is ready')
  await page.screenshot({ path: `${SHOTS}/split-${tag}-2-split.png` })

  console.log(`[${tag}] 3) Over-pay in cash → change; Ajel → the rest on account`)
  await page.locator('.pm-line-x').nth(1).click()
  await page.locator('.pm-method').first().click()                 // line 1 back to the first method (cash)
  await page.locator('.pm-cash-input').first().fill(String(Math.ceil(due) + 50))
  await page.waitForTimeout(150)
  const changeTxt = await page.locator('.pm-change').first().innerText().catch(() => '')
  check(changeTxt.length > 0, `cash over the total shows change ("${changeTxt.trim()}")`)
  await page.screenshot({ path: `${SHOTS}/split-${tag}-3-change.png` })
  const ajelIdx = await page.locator('.pm-method').evaluateAll(els => els.findIndex(e => e.querySelector('.pm-agel-badge')))
  if (ajelIdx >= 0) {
    await page.locator('.pm-cash-input').first().fill(String(part))
    await page.locator('.pm-add').click()
    await page.locator('.pm-method').nth(ajelIdx).click()
    await page.waitForTimeout(150)
    check(await page.locator('.pm-ajel-amount').count() === 1, 'an Ajel line shows the rest (read-only)')
    await page.screenshot({ path: `${SHOTS}/split-${tag}-4-ajel.png` })
  }
  // Store credit: the tab caps the line at what the customer has (250.00 here).
  const scIdx = await page.locator('.pm-method').evaluateAll(els => els.findIndex(e => e.querySelector('.pm-sc-badge')))
  if (scIdx >= 0) {
    await page.locator('.pm-line').first().click()
    await page.locator('.pm-cash-input').first().fill(String(Math.ceil(due)))
    await page.locator('.pm-method').nth(scIdx).click()
    await page.waitForTimeout(150)
    const sc = num(await page.locator('.pm-cash-input').first().inputValue())
    check(sc <= 250 && sc > 0, `a Store credit line is capped at what the customer has (${sc})`)
    await page.screenshot({ path: `${SHOTS}/split-${tag}-5-store-credit.png` })
  }
  check(pageErrors.length === 0, `no page errors (${pageErrors.join(' | ') || 'none'})`)
  await page.close()
}

try {
  await run(1440, 900, 'desktop')
  await run(390, 844, 'phone')
} catch (e) {
  console.log('  ❌ FAIL  ' + e.message)
  failed++
} finally {
  // Void the draft(s) this test made — the shared dev DB keeps no half-sale.
  const ctx = await browser.newContext()
  for (const id of drafts) {
    const r = await ctx.request.post(`${BASE}/api/finance/invoices/${id}/void/`, { headers: { Authorization: auth || '' } })
    console.log(`  (voided draft ${id.slice(0, 8)} → ${r.status()})`)
  }
  await browser.close()
}
console.log(failed ? `\n${failed} check(s) FAILED` : '\nALL PASS')
process.exit(failed ? 1 : 0)
