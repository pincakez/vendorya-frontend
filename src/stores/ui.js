import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', {
  state: () => ({
    sidebarCollapsed: localStorage.getItem('vendorya_sidebar') === 'collapsed',
  }),
  actions: {
    setSidebarCollapsed(val) {
      this.sidebarCollapsed = val
      localStorage.setItem('vendorya_sidebar', val ? 'collapsed' : 'open')
    },
    toggleSidebar() {
      this.setSidebarCollapsed(!this.sidebarCollapsed)
    },
  },
})
