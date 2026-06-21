/**
 * Unit-of-measure display helpers.
 *
 * Stock is ALWAYS stored in a product's smallest unit (the base unit, factor 1).
 * Packs/strips are just multiples we display in — these helpers turn a flat
 * base-unit quantity (e.g. 200 pills) into a human breakdown (10 packs · 20
 * strips · 200 pills) without ever touching the stored number.
 *
 * `sellingUnits` is the array the API ships on every product payload
 * (`build_selling_units` on the backend): each entry is
 *   { id, name, factor, price, is_base, is_weight }
 * with `factor` a string ("1.000", "10.000"). The base unit has is_base=true.
 *
 * Everything is self-gating: a product with no factor>1 tiers (e.g. a laptop)
 * collapses to a single base count, so non-pharmacy stores show a plain number.
 */

const num = (v) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/** The base (factor-1) unit's display name, falling back gracefully. */
function baseUnitName(sellingUnits) {
  const base = (sellingUnits || []).find((u) => u.is_base)
  return base?.name || 'pcs'
}

/** True when the product sells by weight (decimal kg) — no tier breakdown. */
export function isWeightUnits(sellingUnits) {
  const base = (sellingUnits || []).find((u) => u.is_base)
  return !!base?.is_weight
}

/** Tiers larger than the base, biggest factor first. */
function sortedTiers(sellingUnits) {
  return (sellingUnits || [])
    .filter((u) => !u.is_base && num(u.factor) > 1)
    .sort((a, b) => num(b.factor) - num(a.factor))
}

/**
 * Break a base-unit quantity into the largest-first ladder of units.
 *
 * Returns:
 *   parts     [{ name, count }]  largest tier → base; always at least the base
 *   headline  { name, count }    the topmost meaningful unit (packs, usually)
 *   baseName  string             the smallest unit's name
 *   hasTiers  bool               false ⇒ plain base number, no breakdown
 *   isWeight  bool               weight product ⇒ caller shows decimal qty as-is
 */
export function decomposeStock(baseQty, sellingUnits) {
  const baseName = baseUnitName(sellingUnits)
  const qty = num(baseQty)

  if (isWeightUnits(sellingUnits)) {
    return { parts: [{ name: baseName, count: qty }], headline: { name: baseName, count: qty }, baseName, hasTiers: false, isWeight: true }
  }

  const tiers = sortedTiers(sellingUnits)
  // No tiers, or oversold/negative stock — show the raw base count, no ladder.
  if (!tiers.length || qty < 0) {
    return { parts: [{ name: baseName, count: qty }], headline: { name: baseName, count: qty }, baseName, hasTiers: false, isWeight: false }
  }

  let remaining = qty
  const parts = []
  for (const tier of tiers) {
    const f = num(tier.factor)
    const count = Math.floor(remaining / f)
    remaining -= count * f
    parts.push({ name: tier.name, count })
  }
  // Leftover loose base units (rounded to kill float dust on whole-unit goods).
  parts.push({ name: baseName, count: Math.round(remaining * 1000) / 1000 })

  // Headline = the biggest unit there's at least one of (don't shout "0 packs"
  // when there are 19 tablets — show "1 strip"); fall back to the base count.
  const headline = parts.find((p) => p.count > 0) || parts[parts.length - 1]

  return { parts, headline, baseName, hasTiers: true, isWeight: false }
}

/** "10 packs" style label for the headline unit (count + name, name as-is). */
export function headlineLabel(headline) {
  if (!headline) return '0'
  return `${headline.count.toLocaleString('en-US')} ${headline.name}`
}

/** "10 packs · 20 strips · 200 pills" — drops empty leading tiers for brevity. */
export function formatBreakdown(parts, { dropZeros = false } = {}) {
  if (!parts || !parts.length) return '0'
  let shown = parts
  if (dropZeros) {
    // Trim leading all-zero tiers but always keep at least the base part.
    const firstNonZero = parts.findIndex((p) => p.count > 0)
    shown = firstNonZero === -1 ? parts.slice(-1) : parts.slice(firstNonZero)
  }
  return shown.map((p) => `${p.count.toLocaleString('en-US')} ${p.name}`).join(' · ')
}

/**
 * "1 Pack = 2 Strips = 20 pills" — the product's conversion recipe, derived
 * from how many of each smaller unit fit in the largest one. Empty string when
 * the product has no extra tiers (nothing to convert).
 */
export function unitConversionLine(sellingUnits) {
  const tiers = sortedTiers(sellingUnits)
  if (!tiers.length) return ''
  const top = tiers[0]
  const topFactor = num(top.factor)
  // Ladder below the top tier: any mid tiers, then the base (factor 1).
  const lower = [...tiers.slice(1), { name: baseUnitName(sellingUnits), factor: 1 }]
  const fmt = (n) => Number(n.toFixed(3)).toLocaleString('en-US')
  const chain = lower.map((u) => `${fmt(topFactor / num(u.factor))} ${u.name}`)
  return `1 ${top.name} = ${chain.join(' = ')}`
}
