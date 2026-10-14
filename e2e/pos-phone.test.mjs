// The till on a phone (s167, Yakot's pick "cart first + pay bar"), in a real browser.
// Below 768px: the left panel (top selling / favourites) is hidden, the CART takes the full width,
// TOTAL + PAY sit in a bar at the bottom, and the keypad + the 6 action buttons live in a bottom
// sheet opened by the bar's handle (Esc / backdrop / handle close it). At 1440px the 3-column till
// is unchanged (left ≈ 220px, right ≈ 268px — both drawn at the till's 0.78 scale).
// Read-only: it opens the till and the sheet, never rings up a sale.
// Runs against the DEV app (Vite :4456 → Django :8001). Never point it at prod.
//   node e2e/pos-phone.test.mjs            (BASE / E2E_TILL_USER / CHROME_PATH optional)
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import pw from '/home/ubuntu/vendorya-dev/vendorya-frontend/node_modules/playwright/index.js'
const { chromium } = pw

const BASE = process.env.BASE || 'http://localhost:4456'
const USER = process.env.E2E_TILL_USER || 'alexcashier'            // CASHIER @ GATES (dev only)
const PASS = process.env.E2E_CASHIER_PASSWORD ||
  (readFileSync('/home/ubuntu/vendorya-dev/vendorya-backend/.env', 'utf8').match(/^E2E_CASHIER_PASSWORD=(.*)$/m) || [])[1]
const SHOTS = process.env.SHOTS || '/tmp/vendorya-e2e'
mkdirSync(SHOTS, { recursive: true })
const CHROME = process.env.CHROME_PATH || (existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined)

let failed = 0
const check = (ok, msg) => { console.log(`  ${ok ? '✅ PASS' : '❌ FAIL'}  ${msg}`); if (!ok) failed++ }
const near = (a, b, tol = 4) => Math.abs(a - b) <= tol
const box = async sel => {
  const loc = page.locator(sel).first()
  return (await loc.count()) && (await loc.isVisible()) ? await loc.boundingBox() : null
}

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
const pageErrors = []
page.on('pageerror', e => pageErrors.push(String(e)))

try {
  console.log('1) Login as cashier, open the till on a 390px phone')
  await page.goto(BASE + '/login')
  await page.fill('input[autocomplete="username"]', USER)
  await page.fill('input[autocomplete="current-password"]', PASS)
  await page.keyboard.press('Enter')
  await page.waitForURL(u => !u.toString().includes('/login'), { timeout: 15000 })
  await page.goto(BASE + '/pos')
  await page.waitForSelector('.pos-search', { timeout: 15000 })
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(1000)
  await page.screenshot({ path: `${SHOTS}/pos-phone-1-cart.png` })

  const cart = await box('.pos-center')
  check(!!cart && cart.width >= 300, `the cart is ≥ 300px wide (${cart ? Math.round(cart.width) : 'hidden'}px)`)
  check(!(await page.locator('.pos-left').isVisible()), 'the left panel (top selling / favourites) is hidden')
  check(!(await page.locator('.pos-right').isVisible()), 'the keypad / actions sheet starts closed')
  const pay = await box('.pos-paybar .pos-pay-btn')
  check(!!pay && pay.y + pay.height <= 844 && pay.y > 844 * 0.75, `PAY is visible in the bottom bar (y ${pay ? Math.round(pay.y) : '–'})`)
  check(await page.locator('.pos-pay-btn').count() === 1, 'only ONE PAY button on a phone (the bar\'s)')
  check(!!cart && !!pay && cart.y + cart.height <= pay.y, 'the pay bar does not cover the cart')
  check(!(await page.locator('.pos-foot-hint').first().isVisible()), 'the keyboard hints in the status strip are hidden')

  console.log('2) Open the sheet — keypad + all 6 action buttons')
  await page.click('.pos-paybar-handle')
  await page.waitForTimeout(450)
  await page.screenshot({ path: `${SHOTS}/pos-phone-2-sheet.png` })
  check(await page.locator('.pos-right').isVisible(), 'the sheet opens from the handle')
  check(await page.locator('.pos-paybar-handle').getAttribute('aria-expanded') === 'true', 'the handle says it is open (aria-expanded)')
  check(await page.locator('.pos-right .numpad').isVisible(), 'the keypad is in the sheet')
  const acts = page.locator('.pos-right .pac')
  let visibleActs = 0
  for (let i = 0; i < await acts.count(); i++) {
    const b = await acts.nth(i).boundingBox()
    if (b && b.y >= 0 && b.y + b.height <= 844) visibleActs++
  }
  check(visibleActs === 6, `all 6 action buttons are on screen (${visibleActs})`)
  check(await page.locator('.pos-right .pos-summary').isVisible(), 'subtotal / total lines are in the sheet')
  const pay2 = await box('.pos-paybar .pos-pay-btn')
  check(!!pay2, 'PAY stays visible while the sheet is open')

  console.log('3) Esc closes it; backdrop tap closes it; the handle toggles it')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(450)
  check(!(await page.locator('.pos-right').isVisible()), 'Esc closes the sheet')
  await page.click('.pos-paybar-handle'); await page.waitForTimeout(450)
  await page.mouse.click(195, 120)                    // the dimmed cart area above the sheet
  await page.waitForTimeout(450)
  check(!(await page.locator('.pos-right').isVisible()), 'a backdrop tap closes the sheet')
  await page.click('.pos-paybar-handle'); await page.waitForTimeout(450)
  await page.click('.pos-paybar-handle'); await page.waitForTimeout(450)
  check(!(await page.locator('.pos-right').isVisible()), 'the handle closes the sheet again')

  console.log('4) An action that opens a modal closes the sheet (Discount)')
  await page.click('.pos-paybar-handle'); await page.waitForTimeout(450)
  await page.locator('.pos-right .pac').nth(1).click()
  await page.waitForTimeout(450)
  check(!(await page.locator('.pos-right').isVisible()), 'the sheet closed when Discount opened its window')
  await page.keyboard.press('Escape'); await page.waitForTimeout(300)

  console.log('5) 360px phone')
  await page.setViewportSize({ width: 360, height: 740 })
  await page.waitForTimeout(500)
  const cart360 = await box('.pos-center')
  check(!!cart360 && cart360.width >= 300, `360px: the cart is ≥ 300px wide (${cart360 ? Math.round(cart360.width) : 'hidden'}px)`)
  const pay360 = await box('.pos-paybar .pos-pay-btn')
  check(!!pay360 && pay360.x + pay360.width <= 360, '360px: PAY fits on screen')
  const sw = await page.evaluate(() => document.documentElement.scrollWidth)
  check(sw <= 360, `360px: no sideways scroll (page ${sw}px)`)

  console.log('6) 1440px desktop — the 3-column till as before')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${SHOTS}/pos-phone-3-desktop.png` })
  const left = await box('.pos-left'), right = await box('.pos-right')
  // 220 / 268 CSS px, drawn at the till's 0.78 scale
  check(!!left && near(left.width, 220 * 0.78), `left panel ≈ 220 (×0.78 = ${left ? left.width.toFixed(1) : 'hidden'})`)
  check(!!right && near(right.width, 268 * 0.78), `right panel ≈ 268 (×0.78 = ${right ? right.width.toFixed(1) : 'hidden'})`)
  check(await page.locator('.pos-paybar').count() === 0, 'no pay bar on desktop')
  check(await page.locator('.pos-right .pos-pay-btn').isVisible(), 'PAY is back in the right panel')
  check(await page.locator('.pos-foot-hint').first().isVisible(), 'the keyboard hints are back in the status strip')

  console.log('7) 768px tablet — still the 3 columns')
  await page.setViewportSize({ width: 768, height: 1024 })
  await page.waitForTimeout(500)
  check(await page.locator('.pos-left').isVisible() && await page.locator('.pos-paybar').count() === 0, '768px: left panel shown, no pay bar')

  check(pageErrors.length === 0, `no page errors (${pageErrors.length})${pageErrors.length ? ': ' + pageErrors.join(' | ') : ''}`)
} catch (e) {
  console.log('  ❌ CRASH', e.message)
  failed++
} finally {
  await browser.close()
}
console.log(failed ? `\n${failed} check(s) FAILED` : '\nALL PASS')
process.exit(failed ? 1 : 0)
