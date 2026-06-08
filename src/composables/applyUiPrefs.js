// Per-user display preferences — UI scale, UI font size, table font size.
// The app sizes text in hundreds of scoped px values, so a root font-size bump
// does nothing; zoom is the only global lever. We inject a <style> with the
// computed zooms (rather than relying on `zoom: var()`, which isn't universally
// supported). (s53d)
//
//   UI Scale   → #app zoom            (whole window, browser-like; affects POS too)
//   UI Font    → .app-content zoom    (store page text; POS uses its own layout)
//   Table Font → .dt / .data-table    (counter-zoomed so it's independent of UI Font)

export const UI_DEFAULTS = { ui_scale: 1, ui_font: 1.05, table_font: 1 }

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, Number(v) || lo))

export function applyUiPrefs(prefs) {
  const p = { ...UI_DEFAULTS, ...(prefs || {}) }
  const scale = clamp(p.ui_scale, 1, 1.5)
  const font  = clamp(p.ui_font, 0.8, 1.5)
  const table = clamp(p.table_font, 0.8, 1.5)
  // Tables live inside .app-content (zoomed by `font`); divide it back out so the
  // net table zoom equals `table`, independent of the chosen UI font size.
  const tableZoom = +(table / font).toFixed(4)

  let el = document.getElementById('ui-prefs-style')
  if (!el) {
    el = document.createElement('style')
    el.id = 'ui-prefs-style'
    document.head.appendChild(el)
  }
  el.textContent =
    `#app{zoom:${scale}}` +
    `.app-content{zoom:${font}}` +
    `.app-content .dt,.app-content .data-table{zoom:${tableZoom}}`
}
