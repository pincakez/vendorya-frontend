import { defineStore } from 'pinia'

// Per-user-type theme keys — sudo and regular users keep independent settings
// so toggling one never affects the other.
const KEY_ADMIN = 'vendorya_theme_admin'
const KEY_USER  = 'vendorya_theme_user'

function readSuperadminFlag() {
  // Read directly from localStorage instead of importing the auth store
  // (avoids a Pinia init-order issue during app bootstrap).
  try {
    const u = JSON.parse(localStorage.getItem('vendorya_user') || 'null')
    return !!u?.is_superadmin
  } catch { return false }
}

function keyForCurrentUser() {
  return readSuperadminFlag() ? KEY_ADMIN : KEY_USER
}

function defaultForCurrentUser() {
  // Sudo defaults to dark; regular users default to light.
  return readSuperadminFlag() ? 'dark' : 'light'
}

function resolveDark() {
  const stored = localStorage.getItem(keyForCurrentUser())
  if (stored === 'dark' || stored === 'light') return stored === 'dark'
  return defaultForCurrentUser() === 'dark'
}

export const useThemeStore = defineStore('theme', {
  state: () => ({
    dark: false,
  }),
  actions: {
    init() {
      this.dark = resolveDark()
      document.documentElement.classList.toggle('dark', this.dark)
    },
    // Call after login/logout when the active user identity may have changed.
    refresh() {
      this.init()
    },
    toggle() {
      this.dark = !this.dark
      localStorage.setItem(keyForCurrentUser(), this.dark ? 'dark' : 'light')
      document.documentElement.classList.toggle('dark', this.dark)
    },
    setDark(value) {
      this.dark = value
      localStorage.setItem(keyForCurrentUser(), value ? 'dark' : 'light')
      document.documentElement.classList.toggle('dark', value)
    },
  },
})
