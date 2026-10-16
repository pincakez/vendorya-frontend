import { defineStore } from 'pinia'
import api, { beginLogout, refreshAccessToken } from '@/api/axios'
import { setAccessToken, markAuthReady } from '@/api/token'
import { useThemeStore } from './theme'
import { useFormatStore } from './format'
import { applyUiPrefs } from '@/composables/applyUiPrefs'
import i18n from '@/i18n'

// Same ladder as the server (users/permissions.py ROLE_RANK): a higher number may do everything below it.
export const ROLE_RANK = { CASHIER: 1, MANAGER: 2, ADMIN: 3, OWNER: 4 }

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // Access token lives in memory only (api/token.js); this flag mirrors "do we
    // hold a live token" for the router guard. Starts null on every page load and
    // is set by login() or bootstrap() (silent refresh from the httpOnly cookie).
    accessToken: null,
    user: JSON.parse(localStorage.getItem('vendorya_user') || 'null'),
    // §PRIVACY-SUDO (s163, Yakot 2026-10-08): no "Enter store" / store preview for the platform
    // account any more — sudo only ever sees the admin area. (activeStore + previewMode removed.)
  }),
  getters: {
    isAuthenticated: s => !!s.accessToken,
    isSuperadmin:    s => !!s.user?.is_superadmin,
    userRole:        s => s.user?.role || null,
    userStore:       s => s.user?.store || null,
    isCashier:       s => s.user?.role === 'CASHIER',
    isManager:       s => s.user?.role === 'MANAGER',
    isOwner:         s => s.user?.role === 'OWNER',
    // s167: hasRole('MANAGER') → true for MANAGER, ADMIN, OWNER. No minRole = open to every store user.
    hasRole:         s => minRole => !minRole || (ROLE_RANK[s.user?.role] || 0) >= (ROLE_RANK[minRole] || 99),
    currency:        s => s.user?.store?.currency || null,
    currencySymbol:  s => s.user?.store?.currency?.symbol || '',
    timezone:        s => s.user?.store?.timezone || 'Africa/Cairo',
    storeName:       s => s.user?.store?.name || 'Vendorya',
    displayName:     s => s.user?.full_name || s.user?.username || '—',
    initials: s => {
      const name = s.user?.full_name || s.user?.username || '?'
      return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    },
  },
  actions: {
    // Returns a status the Login view branches on:
    //   { status: 'ok' }           — logged in, tokens set
    //   { status: 'requires_2fa' } — user has 2FA enabled; re-call with otpToken
    //   { status: 'requires_setup', preAuth } — s174: an owner must set up an authenticator first (Login → setup step)
    async login(username, password, otpToken) {
      const payload = { username, password }
      if (otpToken) payload.otp_token = otpToken
      const res = await api.post('/api/auth/token/', payload)
      if (res.data.requires_2fa_setup) {
        return { status: 'requires_setup', preAuth: res.data.pre_auth_token }
      }
      if (res.data.requires_2fa) {
        return { status: 'requires_2fa' }
      }
      this.completeLogin(res.data)
      return { status: 'ok' }
    },
    // The tail of every login (password login, or the forced authenticator setup that finishes it — s174).
    completeLogin(data) {
      this.setAccess(data.access)
      if (data.user) this.setUser(data.user)
      // The user identity just changed (sudo vs regular) — apply that user's own theme,
      // not whatever the previous tab session left behind.
      useThemeStore().refresh()
      // Refresh currency + number-format prefs for the new identity.
      useFormatStore().loadForStore()
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
      if (!this.user) { markAuthReady(); return }
      try {
        const access = await refreshAccessToken()
        this.accessToken = access   // token.js already holds it; mirror for the guard
        // Refresh the cached user so a server-side change (e.g. role promotion
        // CASHIER→OWNER) takes effect on reload instead of showing a stale role.
        // Non-blocking: a failure here must not log the user out.
        this.fetchMe().catch(() => {})
      } catch {
        // Cookie gone/expired → not actually logged in. Drop stale UX state so the
        // guard routes to /login (keep theme prefs).
        this.user = null
        localStorage.removeItem('vendorya_user')
      } finally {
        // Open the axios gate — requests queued during boot now go out with the token.
        markAuthReady()
      }
    },
    setUser(user) {
      this.user = user
      localStorage.setItem('vendorya_user', JSON.stringify(user))
      applyUiPrefs(user?.ui_prefs)   // per-user display scale/font
      if (user?.language) {
        i18n.global.locale.value = user.language
        localStorage.setItem('vendorya_locale', user.language)
      }
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
