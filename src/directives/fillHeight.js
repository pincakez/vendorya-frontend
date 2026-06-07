/**
 * v-fill — makes an element scroll inside the viewport instead of growing the page.
 *
 * It sets the element's max-height to "from my top edge down to just above the
 * bottom of the screen (leaving room for a sibling footer + a small gap)", then
 * turns on overflow:auto. Result: the table body scrolls inside this box while a
 * sticky <thead> stays pinned, and the PAGE itself doesn't scroll — so there's
 * exactly one scrollbar (this element's), not a second page-level one.
 *
 * Recomputes on window resize, on layout animations (e.g. the edit panel sliding
 * open above the table), and whenever the surrounding content resizes.
 */
const GAP = 6 // small breathing room under the table card

// nearest ancestor that actually scrolls vertically (here: .app-content)
function scrollAncestor(el) {
  let n = el.parentElement
  while (n && n !== document.body) {
    const oy = getComputedStyle(n).overflowY
    if (oy === 'auto' || oy === 'scroll' || oy === 'overlay') return n
    n = n.parentElement
  }
  return document.scrollingElement || document.documentElement
}

function compute(el) {
  const rect = el.getBoundingClientRect()
  // a pagination footer (sibling of this scroll box, inside the same card) must stay visible
  const footer = el.parentElement?.querySelector(':scope > .dt-foot')
  const footerH = footer ? footer.offsetHeight : 0
  // size against the scroll container's inner bottom (minus its own bottom padding),
  // so the table + footer fit exactly and the PAGE never needs its own scrollbar
  const sa = scrollAncestor(el)
  const saRect = sa.getBoundingClientRect()
  const padBottom = parseFloat(getComputedStyle(sa).paddingBottom) || 0
  const bottomLimit = (sa === document.scrollingElement ? window.innerHeight : saRect.bottom) - padBottom
  const avail = bottomLimit - rect.top - footerH - GAP
  el.style.overflow = 'auto'
  el.style.maxHeight = Math.max(avail, 180) + 'px'
}

export const vFill = {
  mounted(el) {
    const run = () => requestAnimationFrame(() => compute(el))
    el._fillRun = run
    // initial: double rAF so layout (fonts, flex) has settled
    requestAnimationFrame(run)

    window.addEventListener('resize', run)
    // the edit panel opens with a CSS animation above the table → recompute when it ends
    document.addEventListener('animationend', run, true)
    document.addEventListener('transitionend', run, true)

    // catch reflows from content above changing height (filters panel, bulk bar, etc.)
    el._ro = new ResizeObserver(run)
    el._ro.observe(document.body)
  },
  updated(el) {
    el._fillRun && el._fillRun()
  },
  unmounted(el) {
    window.removeEventListener('resize', el._fillRun)
    document.removeEventListener('animationend', el._fillRun, true)
    document.removeEventListener('transitionend', el._fillRun, true)
    el._ro && el._ro.disconnect()
  },
}
