import qz from 'qz-tray'

// Unsigned mode — no server-side certificate required.
// The QZ Tray desktop app must allow unsigned connections (its default setting).
qz.security.setCertificatePromise((resolve) => resolve(''))
qz.security.setSignatureAlgorithm('SHA512')
qz.security.setSignaturePromise((_toSign) => (resolve) => resolve(null))

let _connecting = null

async function _connect() {
  if (qz.websocket.isActive()) return
  if (!_connecting) {
    _connecting = qz.websocket
      .connect({ host: 'localhost', port: { secure: [8181], insecure: [8182] } })
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
    if (!printerName) throw new Error('No printer name configured. Set it in Settings → Service Types.')
    await _connect()
    const config = qz.configs.create(printerName)
    await qz.print(config, [{ type: 'raw', format: 'plain', data }])
  }

  return { isAvailable, sendRaw }
}
