import { defineStore } from 'pinia'
import api from '@/api/axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: localStorage.getItem('vendorya_access') || null,
    refreshToken: localStorage.getItem('vendorya_refresh') || null,
    user: JSON.parse(localStorage.getItem('vendorya_user') || 'null'),
  }),
  getters: {
    isAuthenticated: s => !!s.accessToken,
    userRole: s => s.user?.role || null,
    userStore: s => s.user?.store || null,
    isCashier: s => s.user?.role === 'CASHIER',
    isManager: s => s.user?.role === 'MANAGER',
    isOwner: s => s.user?.role === 'OWNER',
    currency: s => s.user?.store?.currency_symbol || 'EGP',
    storeName: s => s.user?.store?.name || 'Vendorya',
    isPremium: s => s.user?.store?.plan === 'PREMIUM',
    displayName: s => s.user?.full_name || s.user?.username || '—',
    initials: s => {
      const name = s.user?.full_name || s.user?.username || '?'
      return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    },
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
    logout() {
      this.accessToken = null
      this.refreshToken = null
      this.user = null
      localStorage.clear()
    },
  },
})
