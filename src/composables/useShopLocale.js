// s167 (PROLINE-PARITY Upgrade 12): printed documents speak the SHOP's language
// (Store.default_language), not the cashier's screen language — a customer receipt
// reads the same whoever prints it. `st(key, params)` = t() with an explicit locale.
// Layout stays LTR; numbers stay Western (formatting never goes through the locale).
import { computed, unref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'

export const SHOP_LOCALES = ['en', 'ar']

export function normalizeShopLang(v) {
  const l = String(v || '').slice(0, 2).toLowerCase()
  return SHOP_LOCALES.includes(l) ? l : ''
}

/**
 * @param langSource ref/getter/value — the document's own shop language (e.g. print-data
 *        store.default_language). Falls back to the signed-in user's shop, then English.
 */
export function useShopLocale(langSource) {
  const { t } = useI18n()
  const auth = useAuthStore()
  const shopLang = computed(() => {
    const src = typeof langSource === 'function' ? langSource() : unref(langSource)
    return normalizeShopLang(src) || normalizeShopLang(auth.user?.store?.default_language) || 'en'
  })
  const st = (key, params = {}) => t(key, params, { locale: shopLang.value })
  return { st, shopLang }
}

// Western-numeral date for printed documents: "14 Oct 2026, 15:30" (en) / "14/10/2026, 15:30" (ar).
export function printDate(d, lang) {
  if (!d) return '—'
  const opts = lang === 'ar'
    ? { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
  return new Date(d).toLocaleString('en-GB', opts)
}
