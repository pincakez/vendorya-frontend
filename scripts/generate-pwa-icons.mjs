/**
 * Rasterize the Vendorya brand mark (public/favicon.svg) into PWA icons.
 * No ImageMagick/sharp on this box, so we use the Playwright chromium that
 * ships with the frontend dev deps to screenshot the mark at exact sizes.
 *
 *   node scripts/generate-pwa-icons.mjs
 */
import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const __dir = dirname(fileURLToPath(import.meta.url))
const pub = resolve(__dir, '../public')
const svg = readFileSync(resolve(pub, 'favicon.svg'), 'utf8')

// size -> { file, scale (mark width as % of canvas), bg }
const targets = [
  { size: 192, file: 'pwa-192x192.png',  scale: 0.60, bg: '#ffffff', radius: 0 },
  { size: 512, file: 'pwa-512x512.png',  scale: 0.60, bg: '#ffffff', radius: 0 },
  // Maskable: extra safe-zone padding so the mark survives a circle/squircle crop.
  { size: 512, file: 'pwa-maskable-512x512.png', scale: 0.46, bg: '#ffffff', radius: 0 },
  { size: 180, file: 'apple-touch-icon.png', scale: 0.62, bg: '#ffffff', radius: 0 },
]

const browser = await chromium.launch()
const page = await browser.newPage()

for (const t of targets) {
  const html = `<!doctype html><html><head><meta charset="utf8"><style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:${t.size}px;height:${t.size}px}
    .c{width:${t.size}px;height:${t.size}px;background:${t.bg};border-radius:${t.radius}px;
       display:flex;align-items:center;justify-content:center}
    .c svg{width:${Math.round(t.size * t.scale)}px !important;height:auto !important;display:block}
  </style></head><body><div class="c">${svg}</div></body></html>`
  await page.setViewportSize({ width: t.size, height: t.size })
  await page.setContent(html, { waitUntil: 'networkidle' })
  const el = await page.$('.c')
  const buf = await el.screenshot({ omitBackground: false })
  writeFileSync(resolve(pub, t.file), buf)
  console.log(`✓ ${t.file} (${t.size}px)`)
}

await browser.close()
