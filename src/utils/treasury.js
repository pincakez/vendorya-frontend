/**
 * Treasury (money boxes) — small shared helpers for the screens (s169c, TREASURY.md § 11 part C).
 *
 * The server answers a refused money move with HTTP 400/403 `{ code, detail, ...params }`; the screens show the
 * translated text for `code` (finance.treasury.err.<code>) and fall back to the server's English `detail`.
 * Every box / kind / line label is translated here so all screens say the same words.
 */
import api from '@/api/axios'

export const BOX_KINDS = ['DRAWER', 'CASH', 'BANK', 'WALLET', 'RESERVED', 'SAVINGS']

// Line kinds an ADMIN may reverse on the box page (no business source behind them) — the others are fixed
// at their source (delete the expense / payment …) and the server answers `reverse_at_source`.
export const REVERSIBLE_KINDS = ['TRANSFER_IN', 'TRANSFER_OUT', 'OPENING', 'COUNT_ADJUST']

const KNOWN_ERRORS = [
  'treasury_off', 'not_enough_money', 'reason_required', 'box_not_empty', 'other_owner', 'same_box',
  'reverse_at_source', 'zero_amount', 'box_closed', 'cannot_reverse_reversal', 'already_reversed',
  'amount_positive', 'drawer_busy', 'paid_from_required',
]

/** Translated text for a failed Treasury call (axios error), or `fallback` when the server sent nothing usable. */
export function treasuryError(t, err, fallback) {
  const d = err?.response?.data
  if (d && typeof d === 'object' && !Array.isArray(d)) {
    if (d.code && KNOWN_ERRORS.includes(d.code)) return t('finance.treasury.err.' + d.code)
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
  const known = ['SALE_IN', 'RECEIPT_IN', 'REFUND_OUT', 'SUPPLIER_OUT', 'EXPENSE_OUT', 'OTHER_INCOME_IN',
                 'TRANSFER_IN', 'TRANSFER_OUT', 'OPENING', 'COUNT_ADJUST', 'REVERSAL']
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
