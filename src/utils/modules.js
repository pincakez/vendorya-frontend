// s176 module control — the optional modules sudo can allow per plan / per shop.
// Same keys, same order as vendorya-backend/core/modules.py `MODULES` (the server refuses an unknown key).
// The admin panel is English-only for now; its Arabic pass comes later.

export const MODULES = [
  { key: 'credit',             name: 'Selling on credit (Ajel)' },
  { key: 'reservations',       name: 'Reservations (deposits)' },
  { key: 'payment_dues',       name: 'Payment due dates' },
  { key: 'cheques',            name: 'Cheques' },
  { key: 'salesperson_picker', name: 'Salesperson at the till' },
  { key: 'multi_unit',         name: 'Units (pack / strip / piece)' },
  { key: 'expiry',             name: 'Expiry dates' },
  { key: 'weight',             name: 'Selling by weight' },
  { key: 'serials',            name: 'Serial numbers' },
  { key: 'transfers',          name: 'Stock transfers' },
  { key: 'supplier_returns',   name: 'Supplier returns' },
  { key: 'services',           name: 'Service desk / repairs' },
  { key: 'treasury',           name: 'Treasury (money boxes)' },
  { key: 'owner_level',        name: 'Owner level (My money)' },
  { key: 'shop_export',        name: "Export the shop's data" },
]

export const MODULE_KEYS = MODULES.map(m => m.key)

// The owner level rides on the Treasury: no Treasury → no owner level (same rule as the server).
export const MODULE_DEPENDS_ON = { owner_level: 'treasury' }

export function moduleName(key) {
  return MODULES.find(m => m.key === key)?.name || key
}

// "All modules" / "9 of 15 modules" — a plan's `modules` (null = every module, also future ones).
export function modulesSummary(list) {
  if (list == null) return 'All modules'
  return `${list.length} of ${MODULE_KEYS.length} modules`
}

// {key: bool} — what a shop may switch on, from its plan's list (null = every module) and its own
// {key: 'allow' | 'block'} exceptions. Mirrors core/modules.py allowed(), for the live preview only.
export function previewAllowed(planModules, access) {
  const out = {}
  for (const key of MODULE_KEYS) {
    let ok = planModules == null || planModules.includes(key)
    if (access?.[key] === 'allow') ok = true
    else if (access?.[key] === 'block') ok = false
    out[key] = ok
  }
  for (const [key, base] of Object.entries(MODULE_DEPENDS_ON)) out[key] = out[key] && out[base]
  return out
}
