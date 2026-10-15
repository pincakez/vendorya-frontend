/**
 * Treasury (money boxes) — small shared helpers for the screens (s169c, TREASURY.md § 11 part C).
 *
 * The server answers a refused money move with HTTP 400/403 `{ code, detail, ...params }`; the screens show the
 * translated text for `code` (finance.treasury.err.<code>) and fall back to the server's English `detail`.
 * Every box / kind / line label is translated here so all screens say the same words.
 */
import api from '@/api/axios'
import i18n from '@/i18n'
import { formatCurrency } from '@/utils/format'

export const BOX_KINDS = ['DRAWER', 'CASH', 'BANK', 'WALLET', 'RESERVED', 'SAVINGS']

// Line kinds an ADMIN may reverse on the box page (no business source behind them) — the others are fixed
// at their source (delete the expense / payment …) and the server answers `reverse_at_source`.
export const REVERSIBLE_KINDS = ['TRANSFER_IN', 'TRANSFER_OUT', 'OPENING', 'COUNT_ADJUST']

// Money params the server sends with a refusal (`not_enough_money` → balance / needed, `reason_required` →
// difference, `box_not_empty` → balance) — shown in the shop's currency format.
const MONEY_PARAMS = ['balance', 'needed', 'difference']

/** Translated text for a failed Treasury call (axios error), or `fallback` when the server sent nothing usable.
 *  Every server `code` with a `finance.treasury.err.<code>` text is translated, with the answer's params
 *  ({methods}, {box}, {balance}, {needed}, {difference} …) filled in; an unknown code shows the server's `detail`. */
export function treasuryError(t, err, fallback) {
  const d = err?.response?.data
  if (d && typeof d === 'object' && !Array.isArray(d)) {
    const key = d.code ? 'finance.treasury.err.' + d.code : ''
    if (key && i18n.global.te(key, 'en')) {
      const params = { ...d }
      for (const p of MONEY_PARAMS) if (params[p] != null && params[p] !== '') params[p] = formatCurrency(params[p])
      return t(key, params)
    }
    if (typeof d.detail === 'string' && d.detail) return d.detail
    // DRF field errors: { field: ["msg"] } → the first message
    const first = Object.values(d).find(v => (Array.isArray(v) && typeof v[0] === 'string') || typeof v === 'string')
    if (first) return Array.isArray(first) ? first[0] : first
  }
  if (Array.isArray(d) && typeof d[0] === 'string') return d[0]
  return fallback || t('finance.treasury.err.generic')
}

/** The box's name for people: the per-shop UNSORTED box has no name → "Not sorted yet". */
export function boxName(t, box) {
  if (!box) return '—'
  if (box.system_role === 'UNSORTED') return t('finance.treasury.unsorted_name')
  return box.name || '—'
}

export function kindLabel(t, kind) {
  return BOX_KINDS.includes(kind) ? t('finance.treasury.kinds.' + kind) : (kind || '')
}

export function moveKindLabel(t, kind) {
  const known = ['SALE_IN', 'RECEIPT_IN', 'REFUND_OUT', 'SUPPLIER_OUT', 'SUPPLIER_IN', 'EXPENSE_OUT', 'OTHER_INCOME_IN',
                 'TRANSFER_IN', 'TRANSFER_OUT', 'OPENING', 'COUNT_ADJUST', 'REVERSAL',
                 // s170 owner level (generic labels — shop staff see these on a shop box too, never a name)
                 'DRAW_OUT', 'DRAW_IN', 'PUT_OUT', 'PUT_IN', 'LOAN_IN', 'LOAN_REPAY', 'LOAN_OUT', 'LOAN_BACK',
                 'AMANA_IN', 'AMANA_OUT', 'PARTNER_IN', 'PARTNER_OUT']
  return known.includes(kind) ? t('finance.treasury.move_kinds.' + kind) : (kind || '')
}

/** "Box name · Branch" for a picker option. */
export function boxOptionLabel(t, box) {
  const name = boxName(t, box)
  return box.branch_name ? `${name} · ${box.branch_name}` : name
}

/** GET /api/treasury/boxes/ → array (never throws; [] when off / refused). */
export async function fetchBoxes() {
  try {
    const r = await api.get('/api/treasury/boxes/')
    return r.data?.results ?? r.data ?? []
  } catch { return [] }
}
