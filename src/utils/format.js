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
 *  - weight:    StoreSettings.default_weight_unit (KG | G) — see formatWeight below
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
    signDisplay: 'negative',   // s171: never "-0" / "-0.00" (a zero times −1, or a tiny minus that rounds to zero)
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


/* ── Weight (§WT) ─────────────────────────────────────────────────────────────
 * A weight product's stock/qty is ALWAYS kilograms, stored to the gram (3 dp).
 * Grams are only a ×0.001 display tier over that kg base — like packs over
 * pills — chosen store-wide by StoreSettings.default_weight_unit ('KG' | 'G').
 * Every screen shows/reads weights through these helpers; none converts inline.
 */

function resolveWeightUnit(unit) {
  let u = unit
  if (u == null) {
    try { u = useFormatStore().weightUnit } catch { /* outside Pinia ctx */ }
  }
  return String(u || 'KG').toUpperCase() === 'G' ? 'G' : 'KG'
}

/** 'kg' or 'g' — the short label for the store's (or the given) weight unit. */
export function weightUnitLabel(unit) {
  return resolveWeightUnit(unit) === 'G' ? 'g' : 'kg'
}

/** True when weights are shown/typed in grams. */
export function isGramUnit(unit) {
  return resolveWeightUnit(unit) === 'G'
}

/** Stored kg → number in the display unit (0.25 kg → 250 in g mode), gram-rounded. */
export function fromBaseKg(kg, unit) {
  const n = Number(kg)
  if (!Number.isFinite(n)) return 0
  const grams = Math.round(n * 1000)
  return resolveWeightUnit(unit) === 'G' ? grams : grams / 1000
}

/** A typed weight in the display unit → kg to store (250 in g mode → 0.25). NaN if not a number. */
export function toBaseKg(value, unit) {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? '').replace(',', '.'))
  if (!Number.isFinite(n)) return NaN
  const kg = resolveWeightUnit(unit) === 'G' ? n / 1000 : n
  return Math.round(kg * 1000) / 1000
}

/** "250 g" / "0.25 kg" — a stored kg quantity in the store's weight unit. */
export function formatWeight(kg, unit) {
  const u = resolveWeightUnit(unit)
  const v = fromBaseKg(kg, u)
  const { separator } = resolveOpts()
  const digits = v.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: u === 'G' ? 0 : 3,
    useGrouping: !!separator,
  })
  return `${digits} ${weightUnitLabel(u)}`
}
