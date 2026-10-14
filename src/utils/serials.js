// Serial / IMEI per unit (PROLINE-PARITY New 7) + condition / warranty (New 8) — shared helpers.
// Mirrors inventory/serials.py normalize(): no spaces anywhere, UPPER-CASE.

export function normalizeSerial(s) {
  return String(s ?? '').replace(/\s+/g, '').toUpperCase()
}

// A pasted column / typed list → clean unique list (order kept). Newline, comma or semicolon separated.
export function parseSerials(text) {
  const out = []
  const seen = new Set()
  for (const raw of String(text ?? '').split(/[\n,;\r]+/)) {
    const s = normalizeSerial(raw)
    if (s && !seen.has(s)) { seen.add(s); out.push(s) }
  }
  return out
}

export const CONDITIONS = ['NEW', 'IMPORTED_INSPECTED', 'USED']

// i18n key of a condition code (blank → '' = not stated).
export function conditionKey(code) {
  return code ? `serials.condition.${code}` : ''
}

// The server's serial error (`serial_code` + numbers) worded in the user's language; falls back to `detail`.
export function serialErrorText(t, data) {
  const code = Array.isArray(data?.serial_code) ? data.serial_code[0] : data?.serial_code
  if (!code) return ''
  const list = (v) => (Array.isArray(v) ? v.join(', ') : (v || ''))
  const key = `serials.err.${code}`
  const msg = t(key, {
    product: list(data.product), serials: list(data.serials), branch: list(data.branch),
    need: list(data.need), got: list(data.got), room: list(data.room),
  })
  return msg === key ? (Array.isArray(data.detail) ? data.detail[0] : data.detail) || code : msg
}
