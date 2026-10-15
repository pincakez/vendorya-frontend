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
const DEFAULT_LEVELS = ['Category', 'Sub-category', 'Sub-category 2', 'Sub-category 3']

// Always return exactly 4 non-empty tier names, falling back to defaults.
function normalizeLevels(arr) {
  return DEFAULT_LEVELS.map((d, i) => {
    const v = Array.isArray(arr) && arr[i] ? String(arr[i]).trim() : ''
    return v || d
  })
}

export const useFormatStore = defineStore('format', {
  state: () => ({
    symbol:   '',
    position: 'SUFFIX',
    decimals: 2,
    thousandsSeparator: false,
    // What this store calls a catalog item (label only): NAME/PRODUCT/ITEM/MODEL.
    itemNoun: 'NAME',
    // Display names for the 4 category tiers (label only).
    categoryLevels: ['Category', 'Sub-category', 'Sub-category 2', 'Sub-category 3'],
    // §WT: how weights are shown/typed — 'KG' (default) or 'G'. Display only;
    // stock is always kg to the gram. Read via utils/format.js formatWeight().
    weightUnit: 'KG',
    // Treasury (money boxes) capability switch — StoreSettings.treasury_enabled. Gates the Finance → Treasury
    // menu and the "paid from" / "lands in" / drawer pickers. Off = the app behaves exactly as before.
    treasuryEnabled: false,
    // s172 (RESERVATIONS.md): StoreSettings.reservations_enabled — gates the Finance → Reservations menu.
    reservationsEnabled: false,
    // Treasury Wave 2 (s170, TREASURY.md § 12): the owner level switch (StoreSettings.treasury_owner_level) and whether this
    // login IS the owner (settings GET `treasury_is_owner`). "My money" shows only when all three are true.
    treasuryOwnerLevel: false,
    treasuryIsOwner: false,
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
    // Free text since s157 (§AUDIT B6): the 4 old codes keep their nice spelling, any other word shows as typed.
    itemLabel: (s) => ({ NAME: 'Name', PRODUCT: 'Product', ITEM: 'Item', MODEL: 'Model' }[s.itemNoun] || s.itemNoun || 'Name'),
    itemLabelUpper() { return this.itemLabel.toUpperCase() },
  },

  actions: {
    /** Pull currency from the active store payload (already on auth) and
     *  fetch StoreSettings to learn decimals + separator. */
    async loadForStore() {
      const auth = useAuthStore()
      const store = auth.user?.store
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
        this.categoryLevels     = normalizeLevels(res.data?.category_level_names)
        this.weightUnit         = res.data?.default_weight_unit === 'G' ? 'G' : 'KG'
        this.treasuryEnabled    = !!res.data?.treasury_enabled
        this.reservationsEnabled = !!res.data?.reservations_enabled
        this.treasuryOwnerLevel = !!res.data?.treasury_owner_level
        this.treasuryIsOwner    = !!res.data?.treasury_is_owner
      } catch {
        this.decimals = 2
        this.thousandsSeparator = false
        this.itemNoun = 'NAME'
        this.categoryLevels = DEFAULT_LEVELS.slice()
        this.weightUnit = 'KG'
        this.treasuryEnabled = false
        this.reservationsEnabled = false
        this.treasuryOwnerLevel = false
        this.treasuryIsOwner = false
      }
      this.loaded = true
    },

    /** Called after the user saves StoreSettings or sudo changes the store currency. */
    apply({ symbol, position, decimals, thousands_separator, item_noun, category_level_names, default_weight_unit, treasury_enabled, treasury_owner_level, treasury_is_owner, reservations_enabled }) {
      if (symbol !== undefined)   this.symbol   = symbol
      if (position !== undefined) this.position = position
      if (decimals !== undefined) this.decimals = Number(decimals)
      if (thousands_separator !== undefined) this.thousandsSeparator = !!thousands_separator
      if (item_noun !== undefined) this.itemNoun = item_noun || 'NAME'
      if (category_level_names !== undefined) this.categoryLevels = normalizeLevels(category_level_names)
      if (default_weight_unit !== undefined) this.weightUnit = default_weight_unit === 'G' ? 'G' : 'KG'
      if (treasury_enabled !== undefined) this.treasuryEnabled = !!treasury_enabled
      if (reservations_enabled !== undefined) this.reservationsEnabled = !!reservations_enabled
      if (treasury_owner_level !== undefined) this.treasuryOwnerLevel = !!treasury_owner_level
      if (treasury_is_owner !== undefined) this.treasuryIsOwner = !!treasury_is_owner
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
      this.itemNoun = 'NAME'
      this.categoryLevels = DEFAULT_LEVELS.slice()
      this.weightUnit = 'KG'
      this.treasuryEnabled = false
      this.reservationsEnabled = false
      this.treasuryOwnerLevel = false
      this.treasuryIsOwner = false
      this.loaded = false
      // symbolColor is a user preference — intentionally kept across logout.
    },
  },
})
