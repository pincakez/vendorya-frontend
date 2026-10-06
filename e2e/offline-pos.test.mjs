// Regression test — offline POS branch bug.
// Bug: switching to POS while offline popped a dead-end "Select Branch" modal,
//      even though a branch was already active/persisted this session.
// Fix: POS reuses the persisted branch when /api/core/branches/ is unreachable.
//
// The whole offline part is a real in-app SPA navigation (clicking the sidebar
// POS button) — NOT a page reload — because a reload re-runs the auth bootstrap,
// which itself needs the network and would bounce us to /login offline.
import { readFileSync, existsSync } from 'node:fs'
import pw from '/home/ubuntu/vendorya-dev/vendorya-frontend/node_modules/playwright/index.js'
const { chromium } = pw

const BASE = 'http://localhost:4173'
// CASHIER @ GATES. Password: env E2E_CASHIER_PASSWORD, else read from the gitignored dev backend .env
const USER = 'alexcashier'
const PASS = process.env.E2E_CASHIER_PASSWORD ||
  (readFileSync(new URL('../../vendorya-backend/.env', import.meta.url), 'utf8').match(/^E2E_CASHIER_PASSWORD=(.*)$/m) || [])[1]
if (!PASS) throw new Error('E2E_CASHIER_PASSWORD missing — set it in vendorya-backend/.env')

const log = (m) => console.log(m)
let failed = false
const check = (cond, name) => { log(`${cond ? '  ✅ PASS' : '  ❌ FAIL'}  ${name}`); if (!cond) failed = true }

// The workshop has no Playwright-bundled Chromium (version mismatch) — use the real Chrome when it exists
const CHROME = process.env.CHROME_PATH || (existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined)
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })
const ctx = await browser.newContext({ baseURL: BASE, serviceWorkers: 'allow' })
const page = await ctx.newPage()

try {
  // 1. Login online
  log('\n1) Login online as ' + USER)
  await page.goto('/login')
  await page.fill('input[autocomplete="username"]', USER)
  await page.fill('input[autocomplete="current-password"]', PASS)
  await page.click('button[type="submit"]')
  await page.waitForTimeout(2500)
  check(!page.url().includes('/login'), 'authenticated (left /login)')

  // Land on a sidebar page (online full-load is fine).
  await page.goto('/dashboard')
  await page.waitForSelector('.nsb-pos-main', { timeout: 8000 })

  // 2. Enter POS online (SPA) — single GATES branch auto-selects + persists.
  log('\n2) Enter POS online (auto-selects + persists branch)')
  await page.click('.nsb-pos-main')
  await page.waitForTimeout(2500)
  const chipOnline = await page.locator('.pos-branch-chip').first().isVisible().catch(() => false)
  check(chipOnline, 'branch chip visible online (branch auto-selected)')
  const persisted = await page.evaluate(() => localStorage.getItem('vendorya_pos_branch'))
  log('   localStorage vendorya_pos_branch = ' + persisted)
  check(!!persisted && persisted.includes('name'), 'branch persisted to localStorage')

  // 3. Exit POS (SPA), go offline, switch back to POS (SPA) — no reload.
  log('\n3) Exit → go OFFLINE → switch back to POS (in-app, no reload)')
  await page.click('.pos-exit-badge')
  await page.waitForSelector('.nsb-pos-main', { timeout: 8000 })
  await ctx.setOffline(true)
  const apiFails = await page.evaluate(async () => {
    try { await fetch('/api/core/branches/'); return false } catch { return true }
  })
  check(apiFails, 'branches API unreachable while offline (bug precondition)')
  await page.click('.nsb-pos-main')
  await page.waitForTimeout(2500)

  // 4. Assertions: NO dead-end picker, branch chip still shown.
  log('\n4) Verify no dead-end picker offline')
  const pickerShown = await page.locator('.bpm-body').isVisible().catch(() => false)
  const chipOffline = await page.locator('.pos-branch-chip').first().isVisible().catch(() => false)
  const url = new URL(page.url()).pathname
  log('   url=' + url + '  picker=' + pickerShown + '  chip=' + chipOffline)
  check(url === '/pos', 'still on /pos offline (not bounced to login)')
  check(!pickerShown, 'branch picker modal NOT shown offline (bug is fixed)')
  check(chipOffline, 'branch chip still visible offline (reused persisted branch)')

  await page.screenshot({ path: './e2e/pos-offline.png' })
} catch (e) {
  log('\n💥 ERROR: ' + e.message.split('\n')[0]); failed = true
} finally {
  await browser.close()
  log('\n' + (failed ? '❌ TEST FAILED' : '✅ ALL CHECKS PASSED'))
  process.exit(failed ? 1 : 0)
}
