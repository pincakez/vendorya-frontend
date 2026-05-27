import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    dark: localStorage.getItem('vendorya_theme') === 'dark',
  }),
  actions: {
    init() {
      document.documentElement.classList.toggle('dark', this.dark)
    },
    toggle() {
      this.dark = !this.dark
      localStorage.setItem('vendorya_theme', this.dark ? 'dark' : 'light')
      document.documentElement.classList.toggle('dark', this.dark)
    },
    setDark(value) {
      this.dark = value
      localStorage.setItem('vendorya_theme', value ? 'dark' : 'light')
      document.documentElement.classList.toggle('dark', value)
    },
  },
})
