// Return to supplier (s171): turn an API refusal into one readable sentence in the reader's language.
// The backend answers {code, detail, ...params} (finance/purchase_returns.py), serial refusals {serial_code, detail}
// (inventory/serials.py) and Treasury refusals {code, detail} (finance.treasury.err.*).
import i18n from '@/i18n'
import { treasuryError } from '@/utils/treasury'

export function supplierReturnError(t, err) {
  const d = err?.response?.data
  if (d && typeof d === 'object' && !Array.isArray(d)) {
    const key = d.code ? 'inventory.supplier_returns.err.' + d.code : ''
    if (key && i18n.global.te(key, 'en')) return t(key, { ...d })
    if (d.serial_code && typeof d.detail === 'string') return d.detail
  }
  return treasuryError(t, err, t('inventory.supplier_returns.err.generic'))
}
