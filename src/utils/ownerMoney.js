/**
 * Treasury Wave 2 — the owner level ("My money", s170, TREASURY.md § 12). Shared helpers for the screens.
 *
 * Every call goes to `/api/treasury/owner/…`. A refusal answers `{ code, detail }` like Wave 1, so the screens reuse
 * `treasuryError()` (translations live in finance.treasury.err.<code>). Parts, boxes, partners, loans and amanat are
 * all NAMED BY THE OWNER on screen — nothing here knows a shop, person, bank or wallet name.
 */
import api from '@/api/axios'
import { boxName } from '@/utils/treasury'

export const OWNER_API = '/api/treasury/owner'

export const PART_KINDS = ['SHOP', 'BUSINESS', 'PERSONAL']
/** A part that can make profit (has partners, has a P&L): the shop part or a side business. */
export const BUSINESS_PART_KINDS = ['SHOP', 'BUSINESS']

// The codes that mean "this page is not open to you right now" → the page shows an explanation, not an error toast.
export const GATE_CODES = ['owner_level_off', 'not_owner', 'treasury_off', 'no_store']

// Box kinds the owner may add from "My money" (a till drawer belongs to a branch → it is made on the Treasury page).
export const OWNER_BOX_KINDS = ['CASH', 'BANK', 'WALLET', 'RESERVED', 'SAVINGS']

// Statement lines the owner may reverse (TREASURY.md § 12.3 `lines/{id}/reverse/`); a sale / expense / income /
// PartEntry line is fixed at its source (the server answers `reverse_at_source`).
export const OWNER_REVERSIBLE_KINDS = [
  'TRANSFER_IN', 'TRANSFER_OUT', 'DRAW_OUT', 'DRAW_IN', 'PUT_OUT', 'PUT_IN', 'OPENING', 'COUNT_ADJUST',
  'LOAN_IN', 'LOAN_REPAY', 'LOAN_OUT', 'LOAN_BACK', 'AMANA_IN', 'AMANA_OUT', 'PARTNER_IN', 'PARTNER_OUT',
]

/** What a move between two parts will be — the SAME rule as the server's `ledger.pair_kinds`:
 *  same part = a transfer · leaving a shop/business into personal = an owner draw · personal into a business = a
 *  put-in · business → another business = between businesses. Returns 'TRANSFER' | 'DRAW' | 'PUT_IN' | 'BETWEEN'. */
export function moveKind(srcPart, dstPart) {
  if (!srcPart || !dstPart) return ''
  if (String(srcPart.id) === String(dstPart.id)) return 'TRANSFER'
  const srcBiz = BUSINESS_PART_KINDS.includes(srcPart.kind)
  const dstBiz = BUSINESS_PART_KINDS.includes(dstPart.kind)
  if (srcBiz && dstBiz) return 'BETWEEN'
  if (srcBiz) return 'DRAW'
  if (dstBiz) return 'PUT_IN'
  return 'TRANSFER'
}

/** The part's name for people: PERSONAL has no name the owner must type → "Personal". */
export function partName(t, part) {
  if (!part) return '—'
  if (part.kind === 'PERSONAL' && !part.name) return t('finance.owner.part_kinds.PERSONAL')
  return part.name || t('finance.owner.part_kinds.' + (part.kind || 'BUSINESS'))
}

export function partKindLabel(t, kind) {
  return PART_KINDS.includes(kind) ? t('finance.owner.part_kinds.' + kind) : (kind || '')
}

/** Parts in the order the owner reads them: the shop part(s), then side businesses, then personal last. */
export function sortParts(parts) {
  const rank = { SHOP: 0, BUSINESS: 1, PERSONAL: 2 }
  return [...(parts || [])].sort((a, b) => (rank[a.kind] ?? 9) - (rank[b.kind] ?? 9) || String(a.name || '').localeCompare(String(b.name || '')))
}

/** Picker options of open boxes grouped by part ({ value, label, group }) — BaseSelect renders the groups. */
export function boxOptionsByPart(t, parts, filter = () => true) {
  const out = []
  for (const p of sortParts(parts)) {
    for (const b of (p.boxes || [])) {
      if (b.is_active === false || b.system_role === 'UNSORTED' || !filter(b, p)) continue
      out.push({ value: b.id, label: boxName(t, b), group: partName(t, p) })
    }
  }
  return out
}

/** { boxId: { box, part } } over every part's boxes. */
export function indexBoxes(parts) {
  const idx = {}
  for (const p of (parts || [])) for (const b of (p.boxes || [])) idx[b.id] = { box: b, part: p }
  return idx
}

/** GET a list endpoint → array (paginated or plain). Throws on error so the caller can show the code. */
export async function getList(path, params) {
  const r = await api.get(`${OWNER_API}/${path}`, { params })
  return r.data?.results ?? r.data ?? []
}

export function localISO(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** First and last day of a "YYYY-MM" month. */
export function monthRange(ym) {
  const [y, m] = String(ym || '').split('-').map(Number)
  if (!y || !m) return { from: '', to: '' }
  return { from: localISO(new Date(y, m - 1, 1)), to: localISO(new Date(y, m, 0)) }
}

/** The error code of an axios failure (or ''). */
export function errCode(e) {
  const d = e?.response?.data
  return d && typeof d === 'object' && !Array.isArray(d) ? String(d.code || '') : ''
}
