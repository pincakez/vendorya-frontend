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
    '\n\n\n\n',
  ].join('')
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

  async function testPrinter(printerName, type) {
    if (!printerName) throw new Error('Enter a printer name first.')
    await _connect()
    const config = qz.configs.create(printerName)
    const data = type === 'label' ? _testLabel() : _testReceipt()
    await qz.print(config, [{ type: 'raw', format: 'plain', data }])
  }

  return { isAvailable, sendRaw, testPrinter }
}
