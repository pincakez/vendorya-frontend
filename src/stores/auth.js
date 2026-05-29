import { defineStore } from 'pinia'
import api, { beginLogout } from '@/api/axios'
import { useThemeStore } from './theme'
import { useFormatStore } from './format'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem('vendorya_access') || null,
    refreshToken: localStorage.getItem('vendorya_refresh') || null,
    user: JSON.parse(localStorage.getItem('vendorya_user') || 'null'),
    // Super-admin: the store currently being acted on (null = General Admin mode)
    activeStore: JSON.parse(localStorage.getItem('vendorya_active_store_obj') || 'null'),
    // Preview mode: sudo sees the store as a real user
    previewMode: localStorage.getItem('vendorya_preview_mode') === '1',
  }),
  getters: {
    isAuthenticated: s => !!s.accessToken,
    isSuperadmin:    s => !!s.user?.is_superadmin,
    userRole:        s => s.user?.role || null,
    userStore:       s => s.user?.store || null,
    isCashier:       s => s.user?.role === 'CASHIER',
    isManager:       s => s.user?.role === 'MANAGER',
    isOwner:         s => s.user?.role === 'OWNER',
    currency:        s => (s.activeStore?.currency || s.user?.store?.currency) || null,
    currencySymbol:  s => (s.activeStore?.currency?.symbol
                            || s.user?.store?.currency?.symbol
                            || ''),
    timezone:        s => s.activeStore?.timezone || s.user?.store?.timezone || 'Africa/Cairo',
    storeName:       s => s.activeStore?.name || s.user?.store?.name || 'Vendorya',
    isPremium:       s => (s.activeStore?.plan || s.user?.store?.plan) === 'PREMIUM',
    displayName:     s => s.user?.full_name || s.user?.username || '—',
    initials: s => {
      const name = s.user?.full_name || s.user?.username || '?'
      return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    },
    // True when sudo has picked a store; drives sidebar nav + axios header
    isInStoreMode: s => !!s.user?.is_superadmin && !!s.activeStore,
  },
  actions: {
    // Returns a status the Login view branches on:
    //   { status: 'ok' }           — logged in, tokens set
    //   { status: 'requires_2fa' } — user has 2FA enabled; re-call with otpToken
    async login(username, password, otpToken) {
      const payload = { username, password }
      if (otpToken) payload.otp_token = otpToken
      const res = await api.post('/api/auth/token/', payload)
      if (res.data.requires_2fa) {
        return { status: 'requires_2fa' }
      }
      this.setTokens(res.data.access, res.data.refresh)
      if (res.data.user) this.setUser(res.data.user)
      // The user identity just changed (sudo vs regular) — apply that user's own theme,
      // not whatever the previous tab session left behind.
      useThemeStore().refresh()
      // Refresh currency + number-format prefs for the new identity.
      useFormatStore().loadForStore()
      return { status: 'ok' }
    },
    async fetchMe() {
      const res = await api.get('/api/auth/me/')
      this.setUser(res.data)
    },
    setTokens(access, refresh) {
      this.accessToken = access
      this.refreshToken = refresh
      localStorage.setItem('vendorya_access', access)
      localStorage.setItem('vendorya_refresh', refresh)
    },
    setUser(user) {
      this.user = user
      localStorage.setItem('vendorya_user', JSON.stringify(user))
    },
    // Sudo picks a store from the admin topbar
    setActiveStore(store) {
      this.activeStore = store
      if (store) {
        localStorage.setItem('vendorya_active_store_obj', JSON.stringify(store))
        localStorage.setItem('vendorya_active_store', store.id)
      } else {
        localStorage.removeItem('vendorya_active_store_obj')
        localStorage.removeItem('vendorya_active_store')
      }
      // Currency + decimal rules belong to the active store — reload them.
      useFormatStore().loadForStore()
    },
    clearActiveStore() {
      this.previewMode = false
      this.setActiveStore(null)
    },
    enterPreview() {
      this.previewMode = true
      localStorage.setItem('vendorya_preview_mode', '1')
    },
    exitPreview() {
      this.previewMode = false
      localStorage.removeItem('vendorya_preview_mode')
    },
    // Hard logout via a full-page navigation. CRITICAL: we do NOT mutate the
    // reactive auth state (user / tokens / previewMode) here. Nulling user is
    // what caused the flash — it reactively flips LayoutSwitch to the store
    // layout, and Vue paints that frame before the redirect lands. Instead we
    // only clear (non-reactive) localStorage and reload; the fresh boot reads
    // the cleared storage and starts logged-out. Nothing ever re-renders.
    logout({ idle = false } = {}) {
      beginLogout()   // freeze the axios interceptor so a stray 401 can't re-auth us
      const refresh = localStorage.getItem('vendorya_refresh') || undefined

      // Keep theme prefs across logout so each user type's setting persists.
      const adminTheme = localStorage.getItem('vendorya_theme_admin')
      const userTheme  = localStorage.getItem('vendorya_theme_user')
      localStorage.clear()
      if (adminTheme) localStorage.setItem('vendorya_theme_admin', adminTheme)
      if (userTheme)  localStorage.setItem('vendorya_theme_user',  userTheme)

      // Best-effort blacklist + clear httpOnly cookie. sendBeacon survives the
      // imminent page unload (a normal XHR would be cancelled by the redirect)
      // and carries cookies same-origin, so the server can blacklist via the
      // refresh cookie too. Falls back silently if unsupported.
      try {
        const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
        const blob = new Blob([JSON.stringify({ refresh })], { type: 'application/json' })
        navigator.sendBeacon(`${BASE}/api/auth/logout/`, blob)
      } catch { /* ignore */ }

      // Synchronous navigation — no awaits, no reactive writes, so no paint of
      // the wrong layout can sneak in before we leave the page.
      window.location.href = idle ? '/login?idle=1' : '/login'
    },
  },
})
