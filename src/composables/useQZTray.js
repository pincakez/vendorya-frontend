import qz from 'qz-tray'
import api from '@/api/axios'

// Use the authenticated `api` instance, NOT raw axios — these endpoints require
// a login token (IsAuthenticated). Raw axios sends no Authorization header, so
// the sign endpoint 401s and QZ Tray reports "Failed to sign request".

// Certificate: fetched from our server so QZ Tray permanently trusts this site.
qz.security.setCertificatePromise((resolve) => {
  api.get('/api/core/qztray/cert/')
    .then(r => resolve(r.data.certificate || ''))
    .catch(() => resolve(''))
})

// Signing: our server signs the QZ Tray challenge with the RSA private key.
qz.security.setSignatureAlgorithm('SHA512')
qz.security.setSignaturePromise((toSign) => (resolve, reject) => {
  api.post('/api/core/qztray/sign/', { toSign })
    .then(r => resolve(r.data.signature))
    .catch(reject)
})

let _connecting = null

async function _connect() {
  if (qz.websocket.isActive()) return
  if (!_connecting) {
    _connecting = qz.websocket
      .connect({
        host: 'localhost',
        port: { secure: [8182, 8181], insecure: [8181, 8182] },
        keepAlive: 60,
      })
      .finally(() => { _connecting = null })
  }
  await _connecting
}

function _pad(left, right, width) {
  const gap = width - left.length - right.length
  return left + ' '.repeat(Math.max(1, gap)) + right
}

function _testReceipt() {
  const now  = new Date()
  const date = now.toLocaleDateString('en-GB')
  const time = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const W = 42  // chars for 80mm @ typical 42-col mode
  const line = '-'.repeat(W)
  const dbl  = '='.repeat(W)
  return [
    '\n',
    '          *** TEST RECEIPT ***\n',
    '\n',
    '           VENDORYA STORE\n',
    '        123 Test Street, Cairo\n',
    '        Tel: 01000000000\n',
    '\n',
    `Date: ${date}${''.padEnd(W - 13 - date.length - time.length)}Time: ${time}\n`,
    `Invoice: #TEST-001\n`,
    `Cashier: Test Cashier\n`,
    line + '\n',
    _pad('Product', 'Qty  Price', W) + '\n',
    line + '\n',
    _pad('Laptop HP ProBook 450 G9',  '1  3,500.00', W) + '\n',
    _pad('USB-C Cable 1m',            '2     90.00', W) + '\n',
    _pad('Screen Protector',          '1     45.00', W) + '\n',
    line + '\n',
    _pad('Subtotal:', '3,635.00', W) + '\n',
    _pad('VAT (14%):', '509.10', W) + '\n',
    dbl + '\n',
    _pad('TOTAL:', '4,144.10 EGP', W) + '\n',
    dbl + '\n',
    '\n',
    _pad('Cash paid:', '5,000.00', W) + '\n',
    _pad('Change:', '855.90', W) + '\n',
    '\n',
    '  *** This is a test print — not a real sale ***\n',
    '\n',
    '       Thank you for shopping with us!\n',
    '         No returns after 7 days.\n',
    '\n\n',
  ].join('')
}

// Build ESC/POS print footer: optional extra feed + optional auto-cut.
// cutFeedMm: extra paper to advance before cutting (0 = no extra feed).
// ESC J n feeds n × (1/360 inch) ≈ n/14.2 mm; clamped to 255 dots (~18 mm).
// Generate TSPL commands for a LabelPreset record with optional sample data.
export function buildLabelTSPL(preset, {
  storeName   = 'Vendorya Store',
  productName = 'Sample Product',
  sku         = 'TEST-SKU-001',
  price       = '150.00',
} = {}) {
  const W = preset.width_mm
  const H = preset.height_mm
  const lines = [
    `SIZE ${W} mm, ${H} mm\r\n`,
    `GAP 3 mm, 0 mm\r\n`,
    `DIRECTION 0\r\n`,
    `REFERENCE 0,0\r\n`,
    `OFFSET 0 mm\r\n`,
    `CLS\r\n`,
  ]
  const fieldCount = [preset.show_store_name, preset.show_product_name, preset.show_barcode, preset.show_sku, preset.show_price].filter(Boolean).length
  const step = fieldCount > 0 ? Math.max(14, Math.floor((H - 12) / fieldCount)) : 16
  let y = 8
  if (preset.show_store_name) {
    lines.push(`TEXT 10,${y},"1",0,1,1,"${storeName}"\r\n`)
    y += step
  }
  if (preset.show_product_name) {
    lines.push(`TEXT 10,${y},"2",0,1,1,"${productName}"\r\n`)
    y += step + 4
  }
  if (preset.show_barcode) {
    const bH = Math.min(50, Math.max(20, H - y - (preset.show_sku ? 18 : 0) - (preset.show_price ? 18 : 0) - 8))
    lines.push(`BARCODE 10,${y},"128",${bH},0,0,2,2,"${sku}"\r\n`)
    y += bH + 4
  }
  if (preset.show_sku) {
    lines.push(`TEXT 10,${y},"1",0,1,1,"${sku}"\r\n`)
    y += step
  }
  if (preset.show_price) {
    lines.push(`TEXT 10,${y},"2",0,1,1,"${price} EGP"\r\n`)
  }
  lines.push(`PRINT 1\r\n`)
  return lines.join('')
}

export function buildPrintFooter(autoCut = true, cutFeedMm = 0) {
  let footer = ''
  if (cutFeedMm > 0) {
    const dots = Math.min(255, Math.round(cutFeedMm * 14.2))
    footer += '\x1B\x4A' + String.fromCharCode(dots)
  }
  if (autoCut) footer += '\x1D\x56\x41\x00'  // GS V A 0 = partial cut
  return footer
}

function _testLabel() {
  // TSPL commands for 50mm × 25mm label (XPrinter XP-420B or similar)
  return [
    'SIZE 50 mm, 25 mm\r\n',
    'GAP 3 mm, 0 mm\r\n',
    'DIRECTION 0\r\n',
    'REFERENCE 0,0\r\n',
    'OFFSET 0 mm\r\n',
    'CLS\r\n',
    'TEXT 10,8,"3",0,1,1,"VENDORYA"\r\n',
    'TEXT 10,40,"2",0,1,1,"Laptop HP ProBook 450"\r\n',
    'TEXT 10,68,"2",0,1,1,"Price: 3,500.00 EGP"\r\n',
    'BARCODE 10,95,"128",50,0,0,2,2,"TEST-SKU-001"\r\n',
    'TEXT 10,152,"1",0,1,1,"SKU: TEST-SKU-001"\r\n',
    'PRINT 1\r\n',
  ].join('')
}

export function useQZTray() {
  async function isAvailable() {
    try {
      await _connect()
      return true
    } catch {
      return false
    }
  }

  async function sendRaw(printerName, data) {
    if (!printerName) throw new Error('No printer name configured. Set it in Settings → Printing Setup → Printers.')
    await _connect()
    const config = qz.configs.create(printerName)
    await qz.print(config, [{ type: 'raw', format: 'plain', data }])
  }

  async function testPrinter(printerName, type, { copies = 1, autoCut = true, cutFeedMm = 0 } = {}) {
    if (!printerName) throw new Error('Enter a printer name first.')
    await _connect()
    const config = qz.configs.create(printerName)
    let one
    if (type === 'label') {
      one = _testLabel()
    } else {
      one = _testReceipt() + buildPrintFooter(autoCut, cutFeedMm)
    }
    const data = Array(Math.max(1, copies)).fill(one).join('')
    await qz.print(config, [{ type: 'raw', format: 'plain', data }])
  }

  return { isAvailable, sendRaw, testPrinter }
}
