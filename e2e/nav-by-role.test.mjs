// The menu offers each role only the pages the server lets it open (s167).
// One source: each store route's meta.minRole in src/router/index.js → sidebar, header page-search, router guard.
// For CASHIER, MANAGER, ADMIN, OWNER the test:
//   1. logs in, collects every sidebar page link (+ Dashboard / POS / Services from the top buttons)
//   2. opens EACH one and fails on any 403 from /api/ during that page load, or a bounce to another page
// then, as CASHIER only:
//   3. opens 3 hidden pages by typing the address → expects the dashboard + the "This page is for …" note
//   4. the header page-search does not offer Purchases
// The role is switched on the DEV database for the test user and ALWAYS put back to CASHIER (finally).
// Runs against the DEV app only. Never point it at prod.
//   node e2e/nav-by-role.test.mjs        (BASE / E2E_USER / ROLES / CHROME_PATH optional)
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import pw from '/home/ubuntu/vendorya-dev/vendorya-frontend/node_modules/playwright/index.js'
const { chromium } = pw

const BACKEND = '/home/ubuntu/vendorya-dev/vendorya-backend'
const BASE = process.env.BASE || 'http://localhost:4456'
const USER = process.env.E2E_USER || 'alexcashier'                // CASHIER @ GATES (dev)
const PASS = process.env.E2E_PASSWORD || process.env.E2E_CASHIER_PASSWORD ||
  (readFileSync(`${BACKEND}/.env`, 'utf8').match(/^E2E_CASHIER_PASSWORD=(.*)$/m) || [])[1]
const ROLES = (process.env.ROLES || 'CASHIER,MANAGER,ADMIN,OWNER').split(',')
const SHOTS = process.env.SHOTS || '/tmp/vendorya-e2e'
mkdirSync(SHOTS, { recursive: true })
const CHROME = process.env.CHROME_PATH || (existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined)
// 403s that are expected and harmless (none today) — 'METHOD /api/path/' → why.
const KNOWN_HARMLESS = {}
// Hidden from a cashier — typed into the address bar, each must bounce to the dashboard with this note.
const CASHIER_DEEP_LINKS = {
  '/inventory/purchases': 'This page is for managers',
  '/reports/sales':       'This page is for managers',
  '/settings/billing/invoices/0': 'This page is for the shop owner',   // s176: /settings/billing is a tab of the one Settings page now
}

let failed = 0
const check = (ok, msg) => { console.log(`  ${ok ? '✅ PASS' : '❌ FAIL'}  ${msg}`); if (!ok) failed++ }
const setRole = role => {
  if (!/^(CASHIER|MANAGER|ADMIN|OWNER)$/.test(role) || !/^[\w.@-]+$/.test(USER)) throw new Error('bad role/user')
  execFileSync(`${BACKEND}/venv/bin/python`, [`${BACKEND}/manage.py`, 'shell', '-c',
    `from users.models import User; User.objects.filter(username='${USER}').update(role='${role}')`],
    { stdio: 'ignore' })
}

const summary = []
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })
try {
  for (const role of ROLES) {
    console.log(`\n=== ${role} ===`)
    setRole(role)
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const page = await ctx.newPage()
    let current = null
    const forbidden = []
    page.on('response', r => {
      if (!current || !r.url().includes('/api/') || r.status() !== 403) return
      const key = `${r.request().method()} ${r.url().replace(/^https?:\/\/[^/]+/, '').replace(/\?.*$/, '')}`
      if (!KNOWN_HARMLESS[key]) forbidden.push(`${current} → ${key}`)
    })
    try {
      await page.goto(BASE + '/login')
      await page.fill('input[autocomplete="username"]', USER)
      await page.fill('input[autocomplete="current-password"]', PASS)
      await page.keyboard.press('Enter')
      await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 15000 })
      const seen = await page.evaluate(() => JSON.parse(localStorage.getItem('vendorya_user') || '{}').role)
      check(seen === role, `logged in as ${USER} with role ${role}`)
      await page.waitForSelector('aside.nsb [data-to]', { state: 'attached', timeout: 15000 })
      const links = await page.$$eval('aside.nsb [data-to]', els => [...new Set(els.map(e => e.dataset.to))])
      const pages = ['/dashboard', '/pos', '/services', ...links.filter(l => !['/dashboard', '/pos', '/services'].includes(l))]
      console.log(`  sidebar: ${links.length} page links`)

      const before = forbidden.length
      let bounced = 0
      for (const p of pages) {
        current = p
        await page.goto(BASE + p)
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {})
        await page.waitForTimeout(300)
        const landed = new URL(page.url()).pathname
        if (landed !== p) { bounced++; check(false, `${p} opened (landed on ${landed})`) }
      }
      current = null
      const found = forbidden.length - before
      check(bounced === 0, `all ${pages.length} pages opened without a bounce`)
      check(found === 0, `no 403 from /api/ on any of them${found ? ':\n      ' + forbidden.slice(before).join('\n      ') : ''}`)
      summary.push(`${role.padEnd(8)} ${String(links.length).padStart(2)} sidebar links · ${pages.length} pages visited · ${found} 403s · ${bounced} bounces`)

      if (role === 'CASHIER') {
        console.log('  hidden pages by address:')
        for (const [p, note] of Object.entries(CASHIER_DEEP_LINKS)) {
          await page.goto(BASE + p)
          // The guard runs after the app boots (token refresh) — poll the address for up to 10 s.
          let landed = p, toast = 0
          for (let i = 0; i < 40 && !(landed === '/dashboard' && toast); i++) {
            await page.waitForTimeout(250)
            landed = new URL(page.url()).pathname
            toast = await page.locator('.app-toast').filter({ hasText: note }).count()
          }
          check(landed === '/dashboard' && toast > 0, `${p} → ${landed} with note "${note}"`)
        }
        check(!links.some(l => Object.keys(CASHIER_DEEP_LINKS).includes(l)), 'none of them is in the sidebar')
        await page.screenshot({ path: `${SHOTS}/nav-by-role-cashier.png` })
        await page.fill('.nhdr-search-input', 'purchase')
        await page.waitForTimeout(900)
        const hits = await page.$$eval('.nhdr-result', els => els.map(e => e.textContent))
        check(!hits.some(h => /Purchases/.test(h)), `header search "purchase" does not offer Purchases (${hits.length} results)`)
        await page.fill('.nhdr-search-input', 'products')            // control: the search itself still works
        await page.waitForTimeout(900)
        const ok = await page.$$eval('.nhdr-result', els => els.map(e => e.textContent))
        check(ok.some(h => /Products/.test(h)), `header search "products" still offers Products (${ok.length} results)`)
      }
    } finally {
      await ctx.close()
    }
  }
} catch (e) {
  console.log('  ❌ FAIL  crashed:', e.message)
  failed++
} finally {
  await browser.close()
  try { setRole('CASHIER'); console.log('\n(role put back to CASHIER)') } catch (e) { console.log('⚠️  could not restore CASHIER:', e.message); failed++ }
}
console.log('\n' + summary.join('\n'))
console.log(failed ? `\n${failed} FAILED` : '\nALL PASS')
process.exit(failed ? 1 : 0)
