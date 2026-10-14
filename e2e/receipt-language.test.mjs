// The sales receipt prints in the SHOP's language, not the cashier's screen language (s167, Upgrade 12).
// Opens an EXISTING posted sale's print page (never creates a sale). The shop's language is NOT changed
// on the server: the print-data response is fetched for real, then its store.default_language is
// overridden with page.route — so the test is safe for the shared dev shop.
// For each shop language it sets the cashier's SCREEN to the OPPOSITE language, then checks:
//   · receipt labels are in the shop language (toolbar stays in the screen language)
//   · every digit on the receipt is Western 0-9 (no Arabic-Indic digits)
//   · nothing overflows at 80 mm and 58 mm paper widths (print media)
// Runs against the DEV app. Never point it at prod.
//   BASE=http://localhost:4464 node e2e/receipt-language.test.mjs   (E2E_USER / CHROME_PATH / SHOTS optional)
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import pw from '/home/ubuntu/vendorya-dev/vendorya-frontend/node_modules/playwright/index.js'
const { chromium } = pw

const BASE = process.env.BASE || 'http://localhost:4456'
const USER = process.env.E2E_USER || 'alexcashier'                // CASHIER @ GATES (dev)
const PASS = process.env.E2E_PASSWORD || process.env.E2E_CASHIER_PASSWORD ||
  (readFileSync('/home/ubuntu/vendorya-dev/vendorya-backend/.env', 'utf8').match(/^E2E_CASHIER_PASSWORD=(.*)$/m) || [])[1]
const SHOTS = process.env.SHOTS || '/tmp/agent-arreceipt-shots'
mkdirSync(SHOTS, { recursive: true })
const CHROME = process.env.CHROME_PATH || (existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined)

let failed = 0
const check = (ok, msg) => { console.log(`  ${ok ? '✅ PASS' : '❌ FAIL'}  ${msg}`); if (!ok) failed++ }

const EXPECT = {
  en: { title: 'INVOICE', item: 'Item', grand: 'Grand Total', billed: 'Billed To', toolbarPrint: 'طباعة' },
  ar: { title: 'فاتورة', item: 'الصنف', grand: 'الإجمالي النهائي', billed: 'العميل', toolbarPrint: 'Print' },
}
const PAPER = { '80mm': 302, '58mm': 219 }   // CSS px at 96 dpi

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

let shopLang = 'en'
let screenLang = null
// The app re-applies the user's saved language on every load (/api/auth/me/) — override it in the
// RESPONSE only, so the cashier's screen language is the opposite of the shop's (nothing saved).
await page.route('**/api/auth/me/', async (route) => {
  const res = await route.fetch()
  if (!screenLang) return route.fulfill({ response: res })
  const body = await res.json()
  await route.fulfill({ response: res, json: { ...body, language: screenLang } })
})
await page.route('**/api/finance/invoices/*/print-data/**', async (route) => {
  const res = await route.fetch()
  const body = await res.json()
  body.store = { ...(body.store || {}), default_language: shopLang }
  await route.fulfill({ response: res, json: body })
})

try {
  await page.goto(BASE + '/login')
  await page.fill('input[autocomplete="username"]', USER)
  await page.fill('input[autocomplete="current-password"]', PASS)
  await page.keyboard.press('Enter')
  await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 15000 })

  // An existing sale of this shop (read-only) — a posted one if there is one, else any (dev may only hold voided ones).
  // INVOICE_ID=<uuid> picks one directly (dev's list can be empty when it only holds voided carts).
  const invId = process.env.INVOICE_ID || await page.evaluate(async () => {
    const r = await fetch('/api/finance/invoices/?page_size=50', { credentials: 'include' })
    const d = await r.json()
    const rows = Array.isArray(d) ? d : (d.results || [])
    const pick = rows.find(x => x.status === 'POSTED') || rows.find(x => x.status !== 'DRAFT') || rows[0]
    return pick?.id || null
  })
  check(!!invId, `found an existing sale to open (${invId || 'none'})`)
  if (!invId) throw new Error('no sale to print')

  for (const lang of ['en', 'ar']) {
    shopLang = lang
    const screen = lang === 'en' ? 'ar' : 'en'
    console.log(`\nShop language ${lang.toUpperCase()} · cashier screen ${screen.toUpperCase()}`)
    screenLang = screen
    await page.evaluate((s) => localStorage.setItem('vendorya_locale', s), screen)
    await page.emulateMedia({ media: 'screen' })
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto(`${BASE}/finance/invoices/${invId}/print`)
    await page.waitForSelector('.invoice-sheet', { timeout: 15000 })
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.screenshot({ path: `${SHOTS}/receipt-${lang}-desktop.png`, fullPage: true })

    const e = EXPECT[lang]
    const txt = (sel) => page.locator(sel).first().textContent().then(s => s.trim())   // textContent: the DOM text, before CSS uppercase
    check(await page.locator('.invoice-sheet').getAttribute('lang') === lang, `sheet lang="${lang}"`)
    check((await txt('.inv-title')) === e.title, `title "${e.title}"`)
    check((await txt('.inv-items th')) === e.item, `first column "${e.item}"`)
    check((await txt('.tot-row.grand span')) === e.grand, `grand total label "${e.grand}"`)
    check((await txt('.inv-parties .party-label')) === e.billed, `customer label "${e.billed}"`)
    const tb = await txt('.print-toolbar .tb-btn.primary')
    check(tb === e.toolbarPrint, `screen toolbar stays in the cashier's language ("${tb}")`)
    check(await page.locator('.print-toolbar .tb-btn.primary').isEnabled(), 'Print button is clickable')
    const sheet = await page.locator('.invoice-sheet').innerText()
    check(!/[٠-٩۰-۹]/.test(sheet), 'numbers are Western (no Arabic-Indic digits)')
    check(/\d/.test(sheet), 'receipt shows numbers')
    if (lang === 'en') check(!/[؀-ۿ]/.test(await txt('.inv-totals')), 'no Arabic in the English totals block')

    // Thermal paper widths through the print dialog: print media, page width = paper width.
    await page.emulateMedia({ media: 'print' })
    for (const [paper, px] of Object.entries(PAPER)) {
      await page.setViewportSize({ width: px, height: 1400 })
      await page.waitForTimeout(150)
      const m = await page.evaluate(() => {
        const s = document.querySelector('.invoice-sheet')
        const over = [...s.querySelectorAll('*')].filter(el => {
          const r = el.getBoundingClientRect()
          return r.width > 0 && (r.right > window.innerWidth + 0.5 || r.left < -0.5)
        }).map(el => el.className || el.tagName).slice(0, 5)
        return { doc: document.documentElement.scrollWidth, win: window.innerWidth, sheet: s.scrollWidth, sheetClient: s.clientWidth, over }
      })
      await page.screenshot({ path: `${SHOTS}/receipt-${lang}-${paper}.png`, fullPage: true })
      check(m.doc <= m.win && m.sheet <= m.sheetClient && m.over.length === 0,
        `${paper}: fits (page ${m.doc}/${m.win}px, sheet ${m.sheet}/${m.sheetClient}px${m.over.length ? ', overflowing: ' + m.over.join(', ') : ''})`)
    }
  }

  // Notifications follow the READER's screen language (bell dropdown). The list is stubbed:
  // one new-style row (payload.i18n key + params) and one old row (no key → stored text as-is).
  console.log('\nNotification bell — reader language')
  const NOTIFS = [
    { id: 'n1', priority: 'WARNING', type: 'LOW_STOCK', title: 'Low stock: Mouse (0012)', body: 'Only 3 left at Main',
      link: '', read_at: null, is_unread: true, created_at: new Date().toISOString(),
      payload: { i18n: { title: 'low_stock.title', body: 'low_stock.body', params: { product: 'Mouse', sku: '0012', qty: '3', branch: 'Main' } } } },
    { id: 'n2', priority: 'INFO', type: 'GENERAL', title: 'Old English row', body: 'kept as stored',
      link: '', read_at: null, is_unread: true, created_at: new Date().toISOString(), payload: {} },
  ]
  await page.route('**/api/notifications/recent/**', r => r.fulfill({ json: NOTIFS }))
  await page.emulateMedia({ media: 'screen' })
  await page.setViewportSize({ width: 1280, height: 900 })
  for (const [screen, want] of [['ar', 'مخزون منخفض: Mouse (0012)'], ['en', 'Low stock: Mouse (0012)']]) {
    screenLang = screen
    await page.evaluate((s) => localStorage.setItem('vendorya_locale', s), screen)
    await page.goto(BASE + '/inbox')
    await page.waitForSelector('.bell-btn', { timeout: 15000 })
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.locator('.bell-btn').first().click()
    await page.waitForSelector('.nd-item-title', { timeout: 10000 })
    const titles = await page.locator('.nd-item-title').allTextContents()
    await page.screenshot({ path: `${SHOTS}/bell-${screen}.png` })
    check(titles.map(s => s.trim()).includes(want), `screen ${screen.toUpperCase()}: keyed row reads "${want}"`)
    check(titles.map(s => s.trim()).includes('Old English row'), `screen ${screen.toUpperCase()}: old row falls back to its stored text`)
  }
} catch (e) {
  console.log('  ❌ FAIL  crashed:', e.message)
  failed++
} finally {
  await browser.close()
}
console.log(failed ? `\n${failed} FAILED` : '\nALL PASS')
process.exit(failed ? 1 : 0)
