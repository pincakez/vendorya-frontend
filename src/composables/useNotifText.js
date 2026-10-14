// s167 (PROLINE-PARITY Upgrade 12): a notification is shown in the READER's screen language.
// The server stores a stable key + params in payload.i18n ({ title, body?, params }) next to
// the English title/body. Known key → translate it here; old rows (no i18n block), sudo notes
// and unknown keys → the stored text, unchanged. A param { k: 'walk_in' } is a word to translate.
import { useI18n } from 'vue-i18n'

export function useNotifText() {
  const { t, te } = useI18n()
  const has = (key) => te(key) || te(key, 'en')

  function params(m) {
    const out = {}
    for (const [name, v] of Object.entries(m.params || {})) {
      if (v && typeof v === 'object' && typeof v.k === 'string') {
        const key = `notif.words.${v.k}`
        out[name] = has(key) ? t(key) : v.k
      } else {
        out[name] = v ?? ''
      }
    }
    return out
  }

  function notifTitle(n) {
    const m = n?.payload?.i18n
    if (!m || typeof m !== 'object' || !m.title) return n?.title ?? ''
    const key = `notif.${m.title}`
    return has(key) ? t(key, params(m)) : n.title
  }

  function notifBody(n) {
    const m = n?.payload?.i18n
    if (!m || typeof m !== 'object' || !m.body) return n?.body ?? ''
    const key = `notif.${m.body}`
    return has(key) ? t(key, params(m)) : n.body
  }

  return { notifTitle, notifBody }
}
