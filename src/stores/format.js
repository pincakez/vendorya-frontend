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
export const useFormatStore = defineStore('format', {
  state: () => ({
    symbol:   '',
    position: 'SUFFIX',
    decimals: 2,
    thousandsSeparator: false,
    loaded: false,
  }),

  getters: {
    asOpts: (s) => ({
      symbol: s.symbol,
      position: s.position,
      decimals: s.decimals,
      separator: s.thousandsSeparator,
    }),
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
      } catch {
        this.decimals = 2
        this.thousandsSeparator = false
      }
      this.loaded = true
    },

    /** Called after the user saves StoreSettings or sudo changes the store currency. */
    apply({ symbol, position, decimals, thousands_separator }) {
      if (symbol !== undefined)   this.symbol   = symbol
      if (position !== undefined) this.position = position
      if (decimals !== undefined) this.decimals = Number(decimals)
      if (thousands_separator !== undefined) this.thousandsSeparator = !!thousands_separator
    },

    reset() {
      this.symbol = ''
      this.position = 'SUFFIX'
      this.decimals = 2
      this.thousandsSeparator = false
      this.loaded = false
    },
  },
})
