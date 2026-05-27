/**
 * Format helpers that honor the store's currency + display rules.
 *
 * Source of truth at runtime is `useFormatStore` (Pinia). These helpers
 * accept an optional `opts` so callers in static contexts (mocks, tests)
 * can override; in normal UI use, pass nothing and the store wins.
 *
 * Rules:
 *  - decimals:  StoreSettings.decimals  (0..4, default 2)
 *  - separator: StoreSettings.thousands_separator  (default off)
 *  - symbol:    Store.currency.symbol      (e.g. "EGP", "LE", "$")
 *  - position:  Store.currency.position    (PREFIX → "$100", SUFFIX → "100 LE")
 *
 * Never appends the symbol twice — pure number formatters return digits only.
 */

import { useFormatStore } from '@/stores/format'


function resolveOpts(opts) {
  // Allow explicit overrides from the caller; fall back to the Pinia store.
  let store = null
  try { store = useFormatStore() } catch { /* outside Pinia ctx — ignore */ }

  return {
    decimals: opts?.decimals
      ?? store?.decimals
      ?? 2,
    separator: opts?.separator
      ?? store?.thousandsSeparator
      ?? false,
    symbol: opts?.symbol
      ?? store?.symbol
      ?? '',
    position: opts?.position
      ?? store?.position
      ?? 'SUFFIX',
  }
}


/** Format a raw number with the user's decimals + optional separator. No currency. */
export function formatNumber(value, opts) {
  const { decimals, separator } = resolveOpts(opts)
  const n = Number(value)
  if (!Number.isFinite(n)) return '0'.padEnd(decimals ? 2 + decimals : 1, decimals ? '.0' : '')
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: !!separator,
  })
}


/** Format a monetary amount with the store's currency symbol + position. */
export function formatCurrency(value, opts) {
  const { symbol, position } = resolveOpts(opts)
  const number = formatNumber(value, opts)
  if (!symbol) return number
  return position === 'PREFIX' ? `${symbol}${number}` : `${number} ${symbol}`
}


/** Format a quantity. Decimals respect store setting but trailing zeros are trimmed. */
export function formatQty(value, opts) {
  const { decimals, separator } = resolveOpts(opts)
  const n = Number(value)
  if (!Number.isFinite(n)) return '0'
  const fixed = n.toFixed(decimals).replace(/\.?0+$/, '')
  if (!separator) return fixed || '0'
  // Re-apply grouping after trimming
  const [intPart, fracPart] = fixed.split('.')
  const withSep = Number(intPart).toLocaleString('en-US')
  return fracPart ? `${withSep}.${fracPart}` : withSep
}
