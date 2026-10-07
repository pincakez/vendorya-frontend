// MustTest §SKU-SETUP + §SKU2 in a real browser (s160 — Sam ran Yakot's checklist himself).
// Makes a fresh THROWAWAY shop each run ("SKU Test <id>") because step 8 disables SKU2 FOR GOOD — remove them afterwards.
// Runs against the DEV app (Vite :4456 → Django :8001). Never point it at prod.
//   node e2e/sku-setup.test.mjs        (BASE / API / CHROME_PATH / SKU_SHOP / SKU_OWNER optional)
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import pw from '/home/ubuntu/vendorya-dev/vendorya-frontend/node_modules/playwright/index.js'
const { chromium } = pw

const BASE = process.env.BASE || 'http://localhost:4456'
const API = process.env.API || 'http://localhost:8001'
const env = readFileSync(new URL('../../vendorya-backend/.env', import.meta.url), 'utf8')
const envVal = (k) => (env.match(new RegExp(`^${k}=(.*)$`, 'm')) || [])[1]
const SUDO_PASS = process.env.DEV_SUDO_PASSWORD || envVal('DEV_SUDO_PASSWORD')
// A fresh throwaway shop per run (SKU2 is one-way, so a used shop can't be re-tested). Remove them after.
const RUN = Date.now().toString(36)
const SHOP = `SKU Test ${RUN}`
const OWNER = `skut${RUN}`
const OWNER_PASS = 'SkuTest-2026!'
const SHOTS = process.env.SHOTS || '/tmp/vendorya-e2e'
mkdirSync(SHOTS, { recursive: true })
const CHROME = process.env.CHROME_PATH || (existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined)

let failed = 0
const check = (ok, msg) => { console.log(`  ${ok ? '✅ PASS' : '❌ FAIL'}  ${msg}`); if (!ok) failed++ }

async function token(username, password) {
  const r = await fetch(`${API}/api/auth/token/`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
  return (await r.json()).access
}
async function api(tok, method, path, body) {
  const r = await fetch(`${API}${path}`, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok}` }, body: body ? JSON.stringify(body) : undefined })
  let data = null; try { data = await r.json() } catch { /* empty */ }
  return { status: r.status, data }
}
async function login(page, u, p) {
  await page.goto(BASE + '/login')
  await page.fill('input[autocomplete="username"]', u)
  await page.fill('input[autocomplete="current-password"]', p)
  await page.keyboard.press('Enter')
  await page.waitForURL(x => !x.toString().includes('/login'), { timeout: 15000 })
}
const toast = (page, re) => page.locator('body').filter({ hasText: re }).first().waitFor({ timeout: 8000 }).then(() => true).catch(() => false)

const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })
const sudo = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
const owner = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage()
const pageErrors = []
for (const p of [sudo, owner]) p.on('pageerror', e => pageErrors.push(e.message))

async function openSkuPage() {
  await sudo.goto(BASE + '/admin/sku')
  const sel = sudo.locator('.store-pick select')
  await sel.waitFor({ timeout: 15000 })
  const opt = await sel.locator('option', { hasText: SHOP }).first().getAttribute('value')
  await sel.selectOption(opt)
  await sudo.locator('.sku-grid').waitFor({ timeout: 10000 })
}
const field = (label) => sudo.locator('.base-select-root', { hasText: label }).locator('select')

try {
  const sudoTok = await token('sudo', SUDO_PASS)
  const made = await api(sudoTok, 'POST', '/api/admin/stores/', {
    owner: { username: OWNER, password: OWNER_PASS },
    store: { name: SHOP, default_language: 'en' },
    branch: { street_1: 'Test street', city: 'Cairo', phone_number: '01000000000', email: 'skutest@example.com' },
  })
  check(made.status === 201, `throwaway shop "${SHOP}" created (${made.status})`)

  console.log('1) SKU Management — a shop with no products: set 4 · 2 · 55 · dashes, preview, save (no password)')
  await login(sudo, 'sudo', SUDO_PASS)
  await openSkuPage()
  check(await sudo.locator('.badge', { hasText: 'No products yet' }).count() === 1, 'badge says "No products yet — free to set"')
  await field('Product digits').selectOption('4')
  await field('Supplier digits').selectOption('2')
  await sudo.locator('input[placeholder*="store code"], input[placeholder="2 digits"]').first().fill('55')
  const dash = sudo.locator('.check-row', { hasText: 'Dashes' }).locator('input')
  if (!(await dash.isChecked())) await dash.check()
  const preview = (await sudo.locator('.preview-code').textContent()).trim()
  check(preview === '0001-10-55', `preview = ${preview} (want 0001-10-55)`)
  await sudo.click('button:has-text("Save SKU setup")')
  check(await toast(sudo, /Saved/), 'saved straight away, no password asked')
  check(!(await sudo.locator('.modal-text', { hasText: 'Type your password' }).isVisible().catch(() => false)), 'no password window')
  await sudo.screenshot({ path: `${SHOTS}/sku-1-setup.png` })

  console.log('2) SKU2 on (one-way warning) + "print on stickers"')
  await sudo.click('button:has-text("Switch SKU2 on")')
  check(await sudo.locator('.modal-text', { hasText: 'Disable for good' }).isVisible(), 'one-way warning shown')
  await sudo.click('button:has-text("Switch on")')
  await sudo.locator('.badge', { hasText: /^\s*On\s*$/ }).waitFor({ timeout: 8000 })
  check(true, 'SKU2 state = On')
  await sudo.locator('.check-row', { hasText: 'Print SKU2 on price stickers' }).locator('input').check()
  await sudo.click('button:has-text("Save SKU2 options")')
  check(await toast(sudo, /Saved/), 'SKU2 options saved')

  console.log('3) New supplier on a 2-digit shop → a 2-digit code is suggested')
  const tok = await token(OWNER, OWNER_PASS)
  check(!!tok, `owner ${OWNER} can sign in`)
  const pre = await api(tok, 'GET', '/api/inventory/suppliers/check-prefix/')
  check(pre.data?.width === 2 && /^\d{2}$/.test(pre.data?.next_free || ''), `server: width ${pre.data?.width}, next free ${pre.data?.next_free}`)
  await login(owner, OWNER, OWNER_PASS)
  await owner.goto(BASE + '/people/suppliers')
  await owner.locator('.dt-add').first().click()
  check(await owner.locator('text=Code prefix auto-assigned').waitFor({ timeout: 8000 }).then(() => true).catch(() => false), 'form says "Code prefix auto-assigned ✓"')
  await owner.locator('text=More details').click()
  const codeInput = owner.locator('input[maxlength="2"]').first()
  await codeInput.waitFor({ timeout: 8000 }).catch(() => {})
  const suggested = await codeInput.inputValue().catch(() => '')
  check(/^\d{2}$/.test(suggested), `the New Supplier form suggests "${suggested}" (2 digits, box takes max 2)`)
  await owner.screenshot({ path: `${SHOTS}/sku-3-supplier.png` })
  await owner.keyboard.press('Escape')
  const sup = await api(tok, 'POST', '/api/inventory/suppliers/', { name: 'SKU Test Supplier', code_prefix: pre.data.next_free })
  check(sup.status === 201, `supplier ${pre.data.next_free} created (${sup.status})`)

  console.log('4) Products with a dashed SKU + two look-alike SKU2 codes')
  const mk = (name, sku2) => api(tok, 'POST', '/api/inventory/products/', { name, supplier: sup.data.id, sell_price: 1000, cost_price: 0, base_price: 0, reorder_level: 0, attributes: [], sku2 })
  const a = await mk('Dash Test Laptop', '12077')
  const b = await mk('Dash Test Twin', '9912077')
  check(a.status === 201 && b.status === 201, `two products created (${a.status}/${b.status} ${a.status !== 201 ? JSON.stringify(a.data) : ''})`)
  const da = await api(tok, 'GET', `/api/inventory/products/${a.data?.id}/`)
  const sku = da.data?.variants?.[0]?.sku || ''
  check(/^\d{4}-\d{2}-55$/.test(sku), `SKU has dashes: ${sku}`)
  const bare = sku.replace(/-/g, '')

  await owner.goto(BASE + '/inventory/products')
  await owner.locator('.dt-search-input').fill(bare)
  await owner.waitForTimeout(1500)
  check(await owner.locator('tr', { hasText: 'Dash Test Laptop' }).count() > 0, `Products search "${bare}" (no dashes) finds it`)
  await owner.screenshot({ path: `${SHOTS}/sku-4-products-search.png` })

  console.log('5) Till: dashed SKU typed without dashes + exact short code first')
  await owner.goto(BASE + '/pos')
  await owner.waitForSelector('.pos-search', { timeout: 15000 })
  const picker = owner.locator('.modal, [role="dialog"]').filter({ hasText: /branch/i })
  if (await picker.count()) {
    await picker.locator('button, .bp-item, li').first().click().catch(() => {})
    await owner.locator('button:has-text("Start"), button:has-text("Confirm"), button:has-text("Select")').first().click().catch(() => {})
  }
  await owner.waitForTimeout(1200)
  async function firstHit(q) {
    await owner.click('.pos-search'); await owner.fill('.pos-search', '')
    await owner.keyboard.type(q, { delay: 40 })
    await owner.waitForSelector('.pos-search-item', { timeout: 10000 }).catch(() => {})
    await owner.waitForTimeout(800)
    return (await owner.locator('.pos-search-item').first().textContent().catch(() => '')) || ''
  }
  check((await firstHit(bare)).includes('Dash Test Laptop'), `till "${bare}" → Dash Test Laptop`)
  const hit = await firstHit('12077')
  check(hit.includes('Dash Test Laptop') && !hit.includes('Twin'), `till "12077" → the exact one first (got: ${hit.trim().slice(0, 60)})`)
  await owner.screenshot({ path: `${SHOTS}/sku-5-till-exact.png` })

  console.log('6) Sticker shows SKU2 under the SKU (browser print view)')
  await owner.evaluate(() => document.querySelector('#app').__vue_app__.config.globalProperties.$router.push('/print/labels'))
  await owner.waitForSelector('.label-page', { timeout: 10000 })
  await owner.evaluate((SHOP) => {
    const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
    pinia._s.get('labels').setJob({
      preset: { width_mm: 50, height_mm: 30, show_store_name: true, show_product_name: true, show_barcode: true, show_sku: true, show_price: true },
      store_name: SHOP,
      items: [{ variant_id: 'x', product_name: 'Dash Test Laptop', sku: '0001-10-55', sku2: '12077', barcode: '0001-10-55', sell_price: '1000', quantity: 1 }],
    })
  }, SHOP)
  await owner.waitForSelector('.label-card', { timeout: 10000 })
  check(await owner.locator('.label-card .lbl-sku', { hasText: '12077' }).count() > 0, 'sticker shows SKU2 12077')
  await owner.screenshot({ path: `${SHOTS}/sku-6-sticker.png` })
  const ld = await api(tok, 'GET', '/api/core/settings/')
  check(ld.status === 200, 'shop settings readable by the owner (label flag lives there)')

  console.log('7) Shop now HAS SKUs → a setup change asks the password (wrong, then right)')
  await openSkuPage()
  await field('Product digits').selectOption('5')
  await sudo.click('button:has-text("Save SKU setup")')
  await sudo.locator('.modal-text', { hasText: 'Type your password' }).waitFor({ timeout: 8000 })
  check(true, 'password window opens ("… already has N SKUs …")')
  await sudo.locator('input[type="password"]').last().fill('wrong-password-123')
  await sudo.click('button:has-text("Continue")')
  check(await sudo.locator('text=Wrong password.').waitFor({ timeout: 8000 }).then(() => true).catch(() => false), 'wrong password → "Wrong password."')
  await sudo.locator('input[type="password"]').last().fill(SUDO_PASS)
  await sudo.click('button:has-text("Continue")')
  check(await toast(sudo, /Saved/), 'right password → saved')
  await sudo.screenshot({ path: `${SHOTS}/sku-7-password.png` })

  console.log('8) SKU2 → Disable for good (password → last warning → I\'m sure)')
  await sudo.click('button:has-text("Disable the secondary SKU2 for good")')
  await sudo.locator('input[type="password"]').last().fill(SUDO_PASS)
  await sudo.click('button:has-text("Continue")')
  await sudo.locator('text=Last warning').waitFor({ timeout: 8000 })
  check(true, 'last warning shown')
  await sudo.click('button:has-text("I\'m sure")')
  await sudo.locator('.badge', { hasText: 'Disabled for good' }).waitFor({ timeout: 8000 })
  check(true, 'badge = Disabled for good')
  check(await sudo.locator('text=keep their SKU2 as history').count() > 0, 'products keep their SKU2 as history')
  const on = await api(tok, 'POST', '/api/inventory/products/', { name: 'After Disable', supplier: sup.data.id, sell_price: 1, attributes: [], sku2: '55555' })
  check(on.status === 400, `a new SKU2 is refused after disable (${on.status})`)
  await sudo.screenshot({ path: `${SHOTS}/sku-8-disabled.png` })

  check(pageErrors.length === 0, `no page errors (${pageErrors.slice(0, 3).join(' | ')})`)
} catch (e) {
  failed++
  console.log('  ❌ CRASH ', e.message.split('\n')[0])
  await sudo.screenshot({ path: `${SHOTS}/sku-crash-sudo.png` }).catch(() => {})
  await owner.screenshot({ path: `${SHOTS}/sku-crash-owner.png` }).catch(() => {})
} finally {
  await browser.close()
}
console.log(failed ? `\n❌ ${failed} check(s) failed — screenshots in ${SHOTS}` : `\n✅ ALL PASS — screenshots in ${SHOTS}`)
process.exit(failed ? 1 : 0)
