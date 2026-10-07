// Screen sweep (s156, Yakot): open EVERY screen — the admin area as `sudo`, then every shop screen as a REAL shop
// account (s163 §PRIVACY-SUDO: sudo can no longer "Enter store") — at desktop AND mobile width, and record per screen:
// console errors · API calls that failed (≥400) · sideways overflow (page wider than the screen) · a screenshot.
// Runs against DEV only. Navigation is in-app (router.push), like a person clicking — no full reloads.
//
//   node e2e/screen-sweep.mjs                         # headless real Chrome
//   xvfb-run -a node e2e/screen-sweep.mjs --headed    # real Chrome on a virtual screen
// env: BASE (default http://localhost:4456) · SHOP_USER + SHOP_PASS (a shop account for the shop screens — an OWNER
//      sees them all; default = the e2e cashier, who sees only cashier screens) · IDS (JSON of ids for detail screens)
//      SHOTS (screenshot folder) · ONLY (comma list of route substrings to limit the run)
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import pw from '/home/ubuntu/vendorya-dev/vendorya-frontend/node_modules/playwright/index.js'
const { chromium } = pw

const BASE = process.env.BASE || 'http://localhost:4456'
const HEADED = process.argv.includes('--headed')
const SHOTS = (process.env.SHOTS || '/tmp/vendorya-sweep') + (HEADED ? '/headed' : '/headless')
mkdirSync(SHOTS, { recursive: true })
const env = readFileSync(new URL('../../vendorya-backend/.env', import.meta.url), 'utf8')
const PASS = process.env.DEV_SUDO_PASSWORD || (env.match(/^DEV_SUDO_PASSWORD=(.*)$/m) || [])[1]
const SHOP_USER = process.env.SHOP_USER || 'alexcashier'
const SHOP_PASS = process.env.SHOP_PASS || process.env.E2E_CASHIER_PASSWORD || (env.match(/^E2E_CASHIER_PASSWORD=(.*)$/m) || [])[1]
const IDS = JSON.parse(process.env.IDS || '{}')
const ONLY = (process.env.ONLY || '').split(',').filter(Boolean)
const CHROME = process.env.CHROME_PATH || (existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined)

// Every route in src/router/index.js (s156). `:x` = filled from IDS; missing id → skipped as "no data".
const ADMIN = ['admin', 'admin/dashboard', 'admin/stores', 'admin/branches', 'admin/users', 'admin/activity-log',
  'admin/plans', 'admin/subscriptions', 'admin/billing-settings', 'admin/auth-settings', 'admin/alerts', 'admin/trash',
  'admin/widget-gallery', 'admin/component-gallery', 'admin/isolation-check', 'admin/usage', 'admin/commands']
const SHOP = ['dashboard', 'inventory/products', 'inventory/products/:product', 'inventory/purchases', 'inventory/adjustments',
  'inventory/transfers', 'inventory/memory-base', 'inventory/categories', 'inventory/attributes', 'inventory/reports',
  'inventory/import-export', 'inventory/storage', 'finance/invoices', 'finance/invoices/:invoice', 'finance/returns',
  'finance/expenses', 'finance/shifts', 'finance/shifts/:shift', 'finance/cash-drawer', 'reports/sales', 'reports/profit',
  'reports/ar-aging', 'reports/ap-aging', 'reports/pnl', 'reports/expenses', 'reports/stock-ledger', 'reports/cashiers',
  'reports/tax', 'reports/storage-aging', 'reports/storage-value', 'reports/storage-movements',
  'reports/storage-reconciliation', 'reports/expiry', 'people/customers', 'people/customers/:customer', 'people/suppliers',
  'people/suppliers/:supplier', 'people/staff', 'services', 'activity-log', 'settings', 'settings/branches/:branch',
  'settings/capabilities', 'settings/taxes', 'settings/profile', 'settings/security', 'settings/changelog',
  'settings/billing', 'settings/billing/invoices/:billinv', 'settings/notifications', 'settings/pos', 'settings/lockscreen',
  'settings/pos/favorites', 'settings/pos/top-selling', 'settings/pos/ux', 'pos', 'inbox', 'change-password',
  'finance/invoices/:invoice/print', 'inventory/purchases/:purchase/print', 'print/labels']
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } }

const fill = r => r.replace(/:(\w+)/g, (_, k) => IDS[k] || `MISSING:${k}`)
const pick = list => ONLY.length ? list.filter(r => ONLY.some(o => r.includes(o))) : list

const browser = await chromium.launch({ executablePath: CHROME, headless: !HEADED, args: ['--no-sandbox'] })
const results = []

for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
  const ctx = await browser.newContext({ viewport: vp, isMobile: vpName === 'mobile', hasTouch: vpName === 'mobile' })
  const page = await ctx.newPage()
  let cur = null
  page.on('console', m => { if (cur && m.type() === 'error') cur.console.push(m.text().slice(0, 200)) })
  page.on('pageerror', e => { if (cur) cur.console.push('PAGE ERROR: ' + String(e.message).slice(0, 200)) })
  page.on('response', r => {
    if (cur && r.url().includes('/api/') && r.status() >= 400)
      cur.api.push(`${r.status()} ${r.request().method()} ${r.url().replace(/^https?:\/\/[^/]+/, '').slice(0, 120)}`)
  })

  async function login(user, pass) {
    await page.goto(BASE + '/login')
    await page.fill('input[autocomplete="username"]', user)
    await page.fill('input[autocomplete="current-password"]', pass)
    await page.keyboard.press('Enter')
    await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 20000 })
    await page.waitForLoadState('networkidle').catch(() => {})
  }
  await login('sudo', PASS)   // admin area first (fresh context per viewport)

  async function visit(route, area) {
    const path = '/' + fill(route)
    const rec = { vp: vpName, area, route, path, console: [], api: [], overflow: 0, shot: '' }
    if (path.includes('MISSING:')) { rec.skipped = 'no data to open on dev'; results.push(rec); return }
    cur = rec
    try {
      await page.evaluate(p => document.querySelector('#app').__vue_app__.config.globalProperties.$router.push(p), path)
      await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {})
      await page.waitForTimeout(700)
      rec.landed = new URL(page.url()).pathname
      rec.overflow = await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - window.innerWidth))
      rec.shot = `${SHOTS}/${vpName}__${route.replace(/[/:]/g, '_') || 'root'}.png`
      await page.screenshot({ path: rec.shot })
    } catch (e) { rec.console.push('SWEEP: ' + e.message.split('\n')[0]) }
    cur = null
    results.push(rec)
  }

  for (const r of pick(ADMIN)) await visit(r, 'admin')
  if (SHOP_PASS) {
    await ctx.clearCookies()
    await page.evaluate(() => localStorage.clear())
    await login(SHOP_USER, SHOP_PASS)   // shop screens as the shop's own staff
    for (const r of pick(SHOP)) await visit(r, 'shop')
  }
  await ctx.close()
}
await browser.close()

writeFileSync(`${SHOTS}/report.json`, JSON.stringify(results, null, 2))
const bad = results.filter(r => !r.skipped && (r.console.length || r.api.length || r.overflow > 2 || (r.landed && r.landed !== r.path)))
console.log(`\n${HEADED ? 'HEADED (Xvfb)' : 'HEADLESS'} real Chrome — ${results.length} screen visits, ${bad.length} with problems, ` +
  `${results.filter(r => r.skipped).length} skipped (no data). Report: ${SHOTS}/report.json`)
for (const r of bad) {
  const bits = []
  if (r.landed && r.landed !== r.path) bits.push(`landed on ${r.landed}`)
  if (r.overflow > 2) bits.push(`${r.overflow}px too wide`)
  if (r.api.length) bits.push(`API: ${[...new Set(r.api)].join(' | ')}`)
  if (r.console.length) bits.push(`console: ${[...new Set(r.console)].slice(0, 2).join(' | ')}`)
  console.log(`  ${r.vp.padEnd(7)} ${r.path.padEnd(44)} ${bits.join(' · ')}`)
}
