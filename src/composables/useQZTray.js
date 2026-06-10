import qz from 'qz-tray'
import axios from 'axios'

// Certificate: fetched from our server so QZ Tray permanently trusts this site.
qz.security.setCertificatePromise((resolve) => {
  axios.get('/api/core/qztray/cert/')
    .then(r => resolve(r.data.certificate || ''))
    .catch(() => resolve(''))
})

// Signing: our server signs the QZ Tray challenge with the RSA private key.
qz.security.setSignatureAlgorithm('SHA512')
qz.security.setSignaturePromise((toSign) => (resolve, reject) => {
  axios.post('/api/core/qztray/sign/', { toSign })
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

  async function testPrinter(printerName) {
    if (!printerName) throw new Error('Enter a printer name first.')
    await _connect()
    const config = qz.configs.create(printerName)
    await qz.print(config, [{ type: 'raw', format: 'plain', data: '\n** QZ Tray Test **\nPrinter is working.\n\n\n' }])
  }

  return { isAvailable, sendRaw, testPrinter }
}
