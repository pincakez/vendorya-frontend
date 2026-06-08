// Per-user display preferences — UI scale, UI font size, table font size.
// The app sizes text in hundreds of scoped px values, so a root font-size bump
// does nothing; zoom is the only global lever. We inject a <style> with the
// computed zooms (rather than relying on `zoom: var()`, which isn't universally
// supported). (s53d)
//
//   UI Scale   → #app zoom            (whole window, browser-like; affects POS too)
//   UI Font    → .app-content zoom    (store page text; POS uses its own layout)
//   Table Font → .dt / .data-table    (counter-zoomed so it's independent of UI Font)

// Default is a clean 100% baseline so every screen (esp. the fixed-fit POS) fits
// perfectly out of the box; bigger sizes are an opt-in the user picks.
export const UI_DEFAULTS = { ui_scale: 1, ui_font: 1, table_font: 1 }

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Number(v) || lo))

export function applyUiPrefs(prefs) {
  const p = { ...UI_DEFAULTS, ...(prefs || {}) }
  const scale = clamp(p.ui_scale, 1, 1.5)
  const font  = clamp(p.ui_font, 0.8, 1.5)
  const table = clamp(p.table_font, 0.8, 1.5)
  // Tables live inside .app-content (zoomed by `font`); divide it back out so the
  // net table zoom equals `table`, independent of the chosen UI font size.
  const tableZoom = +(table / font).toFixed(4)

  // When zoomed past the natural fit, the fixed-height shell (esp. POS) would
  // clip its bottom. Let #app scroll in that case only — at default size the
  // rule is omitted, so the normal "app-content is the only scroller" design is
  // untouched (no regression / no double scrollbar).
  const overflow = (scale > 1 || font > 1)
    ? '#app{overflow-y:auto;overflow-x:hidden}'
    : ''

  let el = document.getElementById('ui-prefs-style')
  if (!el) {
    el = document.createElement('style')
    el.id = 'ui-prefs-style'
    document.head.appendChild(el)
  }
  el.textContent =
    `#app{zoom:${scale}}` +
    `.app-content{zoom:${font}}` +
    `.app-content .dt,.app-content .data-table{zoom:${tableZoom}}` +
    // POS uses its own layout (.pos-view), so it isn't covered by .app-content.
    // UI Font scales POS text; Table Font scales the cart line-items (the POS
    // "items table"), counter-zoomed so it's independent of UI Font.
    `.pos-view{zoom:${font}}` +
    `.pos-cart-header,.pos-cart-body{zoom:${tableZoom}}` +
    overflow
}
