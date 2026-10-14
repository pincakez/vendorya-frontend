// §MB-TWIN — Memory Base autocomplete source + twin ranking, in a real browser (s166, laptops edition).
// Khodair + its drugs are off dev, so this uses the GATES shop's 18 MEMORY_BASE laptop rows, each of
// which also has a received STORE twin with the same name.
//   (a) source = Memory Base  → type a laptop family → every GATES laptop is owned, so ONLY its STORE
//                                rows appear (s166, Yakot: "hide the copy" — the MB twin is no longer listed)
//   (b) a received laptop     → exactly ONE row, the STORE one (picking it fills the real SKU)
//   (c) source = Store History → only STORE products; 0 results → the faint "not in your history" hint
//
// Runs against the DEV app (Vite :4456 → Django :8001). Never point it at prod.
// Login: GATES has no test owner password in .env, so the test MINTS a short-lived access token for
// the shop owner (default `ehab`, override E2E_AS) through the dev Django shell — no password is read,
// set or printed, and nothing is written to the DB. The browser gets it through the app's own
// refresh endpoint (intercepted). The ONLY write: StoreSettings.autocomplete_source is switched to
// store_history for step (c) through PATCH /api/core/settings/ (owner) and ALWAYS restored after.
//   node e2e/mb-twin.test.mjs        (BASE / API / CHROME_PATH / SHOTS / E2E_AS / DEV_BACKEND optional)
import { existsSync, mkdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import pw from '/home/ubuntu/vendorya-dev/vendorya-frontend/node_modules/playwright/index.js'
const { chromium } = pw

const BASE = process.env.BASE || 'http://localhost:4456'
const API = process.env.API || 'http://localhost:8001'
const AS = process.env.E2E_AS || 'ehab'                       // GATES OWNER on dev
const BACKEND = process.env.DEV_BACKEND || '/home/ubuntu/vendorya-dev/vendorya-backend'
const SHOTS = process.env.SHOTS || '/tmp/claude-1000/mbtwin-shots'
mkdirSync(SHOTS, { recursive: true })
const CHROME = process.env.CHROME_PATH || (existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined)
if (/vendorya\.gates-tech\.com|v\.gates-tech\.com/.test(BASE + API)) throw new Error('refusing to run against prod')

let failed = 0
const check = (ok, msg) => { console.log(`  ${ok ? '✅ PASS' : '❌ FAIL'}  ${msg}`); if (!ok) failed++ }

// --- auth: mint an access token for the dev shop owner (never printed) ----------------------
function mintAccess(username) {
  const code = `from rest_framework_simplejwt.tokens import AccessToken\nfrom users.models import User\n` +
               `print('TOK=' + str(AccessToken.for_user(User.objects.get(username=${JSON.stringify(username)}))))`
  const out = execFileSync(`${BACKEND}/venv/bin/python`, ['manage.py', 'shell', '-c', code],
    { cwd: BACKEND, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  const m = out.match(/^TOK=(\S+)$/m)
  if (!m) throw new Error('could not mint a dev access token')
  return m[1]
}
const TOK = mintAccess(AS)
async function api(method, path, body) {
  const r = await fetch(`${API}${path}`, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOK}` }, body: body ? JSON.stringify(body) : undefined })
  let data = null; try { data = await r.json() } catch { /* empty */ }
  return { status: r.status, data }
}
const ac = async (q) => (await api('GET', `/api/inventory/products/autocomplete/?q=${encodeURIComponent(q)}`)).data
const countOf = (d) => (Array.isArray(d) ? d.length : d?.count)
const setSource = (v) => api('PATCH', '/api/core/settings/', { autocomplete_source: v })

// --- browser helpers ------------------------------------------------------------------------
async function openNewPurchase(page) {
  await page.goto(BASE + '/inventory/purchases')
  await page.locator('.page-header .btn-primary').click()
  await page.locator('.pm-arrow').click()                     // reveal the items panel
  const input = page.locator('.cell-name input').first()
  await input.waitFor({ timeout: 10000 })
  return input
}
// Type a query into the first item row; resolve with the autocomplete response the UI received.
async function typeQuery(page, input, q) {
  await input.fill('')
  const resp = page.waitForResponse(r => r.url().includes('/api/inventory/products/autocomplete/') &&
    new URL(r.url()).searchParams.get('q') === q, { timeout: 10000 })
  await input.pressSequentially(q, { delay: 20 })
  const data = await (await resp).json()
  await page.waitForTimeout(300)                               // let Vue paint the dropdown
  return data
}
const dropdownNames = (page) => page.locator('.ac-dropdown .ac-item .ac-name').allTextContents()

let original = null
const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] })
try {
  // ---- 0) API facts first, so the UI asserts real data ----------------------------------------
  console.log('0) API facts (GATES on dev)')
  const me = await api('GET', '/api/auth/me/')
  check(me.status === 200 && /GATES/i.test(JSON.stringify(me.data?.store ?? me.data)), `signed in as ${AS} (${me.data?.role}) @ GATES`)
  var purchasesBefore = countOf((await api('GET', '/api/finance/purchases/')).data)
  const s0 = await api('GET', '/api/core/settings/')
  original = s0.data?.autocomplete_source
  console.log(`     autocomplete_source BEFORE = ${original}`)
  if (original !== 'memory_base') {
    const r = await setSource('memory_base'); check(r.status === 200, `switched to memory_base for (a)/(b) (${r.status})`)
  }
  const famQ = 'ZBook', twinQ = 'Latitude 5480', emptyQ = 'Qwzx Notebook'
  const famApi = await ac(famQ)
  const famMb = famApi.results.filter(r => r.source === 'MEMORY_BASE').length
  const famStore = famApi.results.filter(r => r.source === 'STORE').length
  check(famMb === 0 && famStore > 0, `API "${famQ}": ${famStore} STORE + ${famMb} MEMORY_BASE rows (owned → MB copies hidden)`)
  const twinApi = await ac(twinQ)
  check(twinApi.results[0]?.source === 'STORE', `API "${twinQ}": row 1 = ${twinApi.results[0]?.source} (want STORE)`)
  check(twinApi.results.length === 1,
    `API "${twinQ}": ${twinApi.results.length} row(s) — the STORE row only, MB twin hidden (${twinApi.results.map(r => r.source).join(', ')})`)

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  await ctx.addInitScript(([u]) => { try { localStorage.setItem('vendorya_user', u) } catch { /* noop */ } }, [JSON.stringify(me.data)])
  await ctx.route('**/api/auth/token/refresh/', r => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ access: TOK }) }))
  await ctx.route('**/api/auth/logout/**', r => r.fulfill({ status: 200, body: '{}' }))   // never blacklist anything
  const page = await ctx.newPage()
  const pageErrors = []
  page.on('pageerror', e => pageErrors.push(e.message))

  // ---- (a) Memory Base: MB rows appear ----------------------------------------------------------
  console.log('a) source = Memory Base → type a laptop family → owned laptops show once (STORE)')
  let input = await openNewPurchase(page)
  const aData = await typeQuery(page, input, famQ)
  const aNames = await dropdownNames(page)
  const aMb = aData.results.filter(r => r.source === 'MEMORY_BASE' && r.default_variant_id).length
  check(aMb === 0, `the UI's response carries ${aMb} MEMORY_BASE rows (copies of owned laptops hidden)`)
  check(aNames.length === aData.results.filter(r => r.default_variant_id).length && aNames.length === famApi.results.length,
    `dropdown shows ${aNames.length} rows (= ${famStore} STORE + ${famMb} MB)`)
  check(aNames.every(n => /ZBook/i.test(n)), 'every row is a ZBook')
  await page.screenshot({ path: `${SHOTS}/mbtwin-a-memory-base.png` })

  // ---- (b) received laptop: STORE row on top ----------------------------------------------------
  console.log(`b) a received laptop ("${twinQ}") → its STORE row is on top`)
  const bData = await typeQuery(page, input, twinQ)
  const bNames = await dropdownNames(page)
  check(bData.results[0]?.source === 'STORE', `row 1 in the UI response = ${bData.results[0]?.source}`)
  check(bNames.length === 1 && bNames[0].trim() === `Dell ${twinQ}`,
    `dropdown: ${bNames.length} row named "Dell ${twinQ}" (the MB twin is hidden — s166)`)
  await page.screenshot({ path: `${SHOTS}/mbtwin-b-twin-dropdown.png` })
  await page.locator('.ac-dropdown .ac-item').first().dispatchEvent('mousedown')
  const sku = page.locator('.cell-sku .sku-val').first()
  const gotSku = await sku.waitFor({ timeout: 5000 }).then(() => sku.textContent()).catch(() => '')
  const storeSku = bData.results[0]?.default_sku || bData.results[0]?.sku || bData.results[0]?.variants?.[0]?.sku
  check(!!gotSku.trim(), `picking row 1 fills the real STORE SKU "${gotSku.trim()}"${storeSku ? ` (API: ${storeSku})` : ''}`)
  await page.screenshot({ path: `${SHOTS}/mbtwin-b-picked-store.png` })

  // ---- (c) Store History: STORE only + empty hint -----------------------------------------------
  console.log('c) source = Store History → only STORE products; 0 results → faint hint')
  const sw = await setSource('store_history')
  check(sw.status === 200 && sw.data?.autocomplete_source === 'store_history', `PATCH autocomplete_source = store_history (${sw.status})`)
  const famHist = await ac(famQ)
  check(famHist.results.length === famStore && famHist.results.every(r => r.source === 'STORE'),
    `API "${famQ}": ${famHist.results.length} rows, all STORE`)
  input = await openNewPurchase(page)
  const cData = await typeQuery(page, input, famQ)
  const cNames = await dropdownNames(page)
  check(cData.results.every(r => r.source === 'STORE') && cNames.length === famStore,
    `dropdown shows ${cNames.length} rows, all STORE (was ${aNames.length} in Memory Base mode)`)
  const cTwin = await typeQuery(page, input, twinQ)
  const cTwinNames = await dropdownNames(page)
  check(cTwin.results.length === 1 && cTwinNames.length === 1, `"${twinQ}" now appears ONCE (${cTwinNames.length} row)`)
  await page.screenshot({ path: `${SHOTS}/mbtwin-c-store-history.png` })
  const eData = await typeQuery(page, input, emptyQ)
  check(eData.results.length === 0 && eData.no_history === true, `"${emptyQ}": 0 results, no_history=${eData.no_history}`)
  const hint = page.locator('.ac-no-history')
  const hintOk = await hint.waitFor({ timeout: 5000 }).then(() => true).catch(() => false)
  const hintText = hintOk ? (await hint.textContent()).trim() : ''
  check(hintOk && /Not in your history/i.test(hintText), `hint shown: "${hintText.slice(0, 60)}…"`)
  check(await page.locator('.ac-dropdown').count() === 0, 'no dropdown rows under the hint')
  await page.screenshot({ path: `${SHOTS}/mbtwin-c-no-history-hint.png` })

  check(pageErrors.length === 0, `no page errors (${pageErrors.length}${pageErrors.length ? ': ' + pageErrors[0] : ''})`)
} catch (e) {
  console.error('  💥', e.message); failed++
} finally {
  if (original) {
    const r = await setSource(original)
    const after = (await api('GET', '/api/core/settings/')).data?.autocomplete_source
    check(r.status === 200 && after === original, `autocomplete_source restored: before=${original} after=${after}`)
  }
  await browser.close()
  const purchasesAfter = countOf((await api('GET', '/api/finance/purchases/')).data)
  check(purchasesAfter === purchasesBefore, `no purchase was saved (${purchasesBefore} → ${purchasesAfter})`)
}
console.log(failed ? `\n❌ ${failed} check(s) failed` : '\n✅ all checks passed')
process.exit(failed ? 1 : 0)
