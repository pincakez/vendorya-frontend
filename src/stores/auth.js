import { defineStore } from 'pinia'
import api from '@/api/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem('vendorya_access') || null,
    refreshToken: localStorage.getItem('vendorya_refresh') || null,
    user: JSON.parse(localStorage.getItem('vendorya_user') || 'null'),
    // Super-admin: the store currently being acted on (null = General Admin mode)
    activeStore: JSON.parse(localStorage.getItem('vendorya_active_store_obj') || 'null'),
  }),
  getters: {
    isAuthenticated: s => !!s.accessToken,
    isSuperadmin:    s => !!s.user?.is_superadmin,
    userRole:        s => s.user?.role || null,
    userStore:       s => s.user?.store || null,
    isCashier:       s => s.user?.role === 'CASHIER',
    isManager:       s => s.user?.role === 'MANAGER',
    isOwner:         s => s.user?.role === 'OWNER',
    currency:        s => s.activeStore?.currency_symbol || s.user?.store?.currency_symbol || 'EGP',
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
    async login(username, password) {
      const res = await api.post('/api/auth/token/', { username, password })
      this.setTokens(res.data.access, res.data.refresh)
      if (res.data.user) this.setUser(res.data.user)
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
    },
    clearActiveStore() {
      this.setActiveStore(null)
    },
    logout() {
      this.accessToken = null
      this.refreshToken = null
      this.user = null
      this.activeStore = null
      localStorage.clear()
    },
  },
})
