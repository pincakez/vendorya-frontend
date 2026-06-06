import { defineStore } from 'pinia'
import api from '@/api/axios'
import { useAuthStore } from './auth'


/**
 * Single source of truth for *display* rules:
 *  - currency (symbol + position, from active store)
 *  - decimals (StoreSettings.decimals)
 *  - thousandsSeparator (StoreSettings.thousands_separator)
 *
 * Loaded on app boot via `loadForStore()` and refreshed whenever sudo
 * switches stores or the user saves new settings.
 */
const COLOR_KEY = 'vendorya:currencyColor'
const DEFAULT_COLOR = '#16a34a'  // light green — keep in sync with --currency-color in main.css

export const useFormatStore = defineStore('format', {
  state: () => ({
    symbol:   '',
    position: 'SUFFIX',
    decimals: 2,
    thousandsSeparator: false,
    // What this store calls a catalog item (label only): NAME/PRODUCT/ITEM/MODEL.
    itemNoun: 'NAME',
    // Currency-symbol tint — a per-user (per-browser) display preference.
    symbolColor: localStorage.getItem(COLOR_KEY) || DEFAULT_COLOR,
    loaded: false,
  }),

  getters: {
    asOpts: (s) => ({
      symbol: s.symbol,
      position: s.position,
      decimals: s.decimals,
      separator: s.thousandsSeparator,
    }),
    // "Name" / "Product" / "Item" / "Model" and an uppercase variant for headers.
    itemLabel: (s) => ({ NAME: 'Name', PRODUCT: 'Product', ITEM: 'Item', MODEL: 'Model' }[s.itemNoun] || 'Name'),
    itemLabelUpper() { return this.itemLabel.toUpperCase() },
  },

  actions: {
    /** Pull currency from the active store payload (already on auth) and
     *  fetch StoreSettings to learn decimals + separator. */
    async loadForStore() {
      const auth = useAuthStore()
      const store = auth.activeStore || auth.user?.store
      if (!store) {
        this.$reset()
        return
      }

      const cur = store.currency
      this.symbol   = cur?.symbol   || ''
      this.position = cur?.position || 'SUFFIX'

      try {
        const res = await api.get('/api/core/settings/')
        this.decimals           = Number(res.data?.decimals ?? 2)
        this.thousandsSeparator = !!res.data?.thousands_separator
        this.itemNoun           = res.data?.item_noun || 'NAME'
      } catch {
        this.decimals = 2
        this.thousandsSeparator = false
        this.itemNoun = 'NAME'
      }
      this.loaded = true
    },

    /** Called after the user saves StoreSettings or sudo changes the store currency. */
    apply({ symbol, position, decimals, thousands_separator, item_noun }) {
      if (symbol !== undefined)   this.symbol   = symbol
      if (position !== undefined) this.position = position
      if (decimals !== undefined) this.decimals = Number(decimals)
      if (thousands_separator !== undefined) this.thousandsSeparator = !!thousands_separator
      if (item_noun !== undefined) this.itemNoun = item_noun || 'NAME'
    },

    /** Push the chosen currency-symbol colour onto <html> so the CSS var
     *  (--currency-color), read by every <Money>, updates app-wide. */
    applyColor() {
      try {
        document.documentElement.style.setProperty('--currency-color', this.symbolColor || DEFAULT_COLOR)
      } catch { /* SSR / no DOM */ }
    },

    /** Persist + apply a new currency-symbol colour (Settings › Localization). */
    setSymbolColor(color) {
      this.symbolColor = color || DEFAULT_COLOR
      try { localStorage.setItem(COLOR_KEY, this.symbolColor) } catch { /* ignore */ }
      this.applyColor()
    },

    reset() {
      this.symbol = ''
      this.position = 'SUFFIX'
      this.decimals = 2
      this.thousandsSeparator = false
      this.loaded = false
      // symbolColor is a user preference — intentionally kept across logout.
    },
  },
})
