import { defineStore } from 'pinia'
import api, { beginLogout, refreshAccessToken } from '@/api/axios'
import { setAccessToken } from '@/api/token'
import { useThemeStore } from './theme'
import { useFormatStore } from './format'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // Access token lives in memory only (api/token.js); this flag mirrors "do we
    // hold a live token" for the router guard. Starts null on every page load and
    // is set by login() or bootstrap() (silent refresh from the httpOnly cookie).
    accessToken: null,
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
      this.setAccess(res.data.access)
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
    // Memory-only access token. The router guard reads this.accessToken; the live
    // value used by requests lives in api/token.js. Never persisted to storage.
    setAccess(access) {
      this.accessToken = access
      setAccessToken(access)
    },
    // Page reload starts with no access token (memory-only). If we have a
    // remembered user, the 60-day httpOnly refresh cookie should still be valid —
    // silently exchange it for a fresh access token before the app renders.
    // Called from main.js, awaited before mount.
    async bootstrap() {
      if (!this.user) return
      try {
        const access = await refreshAccessToken()
        this.accessToken = access   // token.js already holds it; mirror for the guard
      } catch {
        // Cookie gone/expired → not actually logged in. Drop stale UX state so the
        // guard routes to /login (keep theme prefs).
        this.user = null
        this.activeStore = null
        localStorage.removeItem('vendorya_user')
        localStorage.removeItem('vendorya_active_store')
        localStorage.removeItem('vendorya_active_store_obj')
        localStorage.removeItem('vendorya_preview_mode')
      }
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
    // Hard logout via a full-page navigation.
    //
    // Two independent requirements that earlier attempts wrongly coupled:
    //  1. SECURITY: the 60-day refresh token MUST be blacklisted server-side.
    //     So we await a real credentialed request (with a timeout fallback) and
    //     only give up if the server is unreachable — never silently skip it.
    //  2. NO FLASH: the flash was caused solely by mutating reactive auth state
    //     (user = null flips LayoutSwitch to the store layout). The await was
    //     never the cause. So we leave reactive state untouched; with no reactive
    //     change nothing re-renders during the await, and the reload boots clean
    //     from cleared storage.
    async logout({ idle = false } = {}) {
      beginLogout()   // freeze the axios interceptor so an in-flight 401 can't re-auth us mid-logout
      setAccessToken(null)  // drop the in-memory access token immediately

      // Blacklist + clear the httpOnly cookie. The refresh token rides in the
      // cookie (sent via withCredentials), so no body is needed. Awaited so we
      // confirm it, but raced against a timeout so a slow/dead server can't trap
      // the user.
      try {
        await Promise.race([
          api.post('/api/auth/logout/', {}),
          new Promise((_, reject) => setTimeout(() => reject(new Error('logout-timeout')), 3000)),
        ])
      } catch {
        // Server unreachable/slow: token may outlive this session. We still clear
        // locally below; the only fully-clean recovery is server-side expiry.
        console.warn('Logout: could not confirm server-side token blacklist.')
      }

      // Keep theme prefs across logout so each user type's setting persists.
      const adminTheme = localStorage.getItem('vendorya_theme_admin')
      const userTheme  = localStorage.getItem('vendorya_theme_user')
      localStorage.clear()
      if (adminTheme) localStorage.setItem('vendorya_theme_admin', adminTheme)
      if (userTheme)  localStorage.setItem('vendorya_theme_user',  userTheme)

      // Synchronous navigation, no reactive writes anywhere above → the wrong
      // layout never renders. The reload reads cleared storage and boots logged-out.
      window.location.href = idle ? '/login?idle=1' : '/login'
    },
  },
})
