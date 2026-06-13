import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/main.css'
import Money from './components/ui/Money.vue'
import { Observer } from 'tailwindcss-intersect'
import i18n from './i18n'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)
app.use(i18n)

// Global display component for currency amounts (colored symbol, right-side).
app.component('Money', Money)

// Init theme before mount so no flash of wrong theme
import { useThemeStore } from './stores/theme'
useThemeStore(pinia).init()

// Load currency + number-formatting prefs from the active store.  No-op if
// not authenticated yet; it runs again on the next login.
import { useFormatStore } from './stores/format'
const formatStore = useFormatStore(pinia)
formatStore.applyColor()  // user's currency-symbol tint (persisted in localStorage)

// Apply saved typography vars from Gallery › Typography tab (admin design tool)
;(function applyTypography() {
  try {
    const saved = JSON.parse(localStorage.getItem('vya_typography') || '{}')
    const map = { page: '--typo-page', h2: '--typo-h2', h3: '--typo-h3', h4: '--typo-h4', label: '--typo-label' }
    Object.entries(saved).forEach(([key, v]) => {
      const base = map[key]; if (!base) return
      document.documentElement.style.setProperty(`${base}-size`,   v.size   + 'px')
      document.documentElement.style.setProperty(`${base}-weight`, v.bold   ? '700' : '400')
      document.documentElement.style.setProperty(`${base}-style`,  v.italic ? 'italic' : 'normal')
    })
  } catch { /* noop */ }
})()

// Apply per-user display prefs (UI scale / font sizes) before mount, read from
// the localStorage-hydrated user so there's no resize flash. Re-applied on login
// and profile change via auth.setUser().
import { applyUiPrefs } from './composables/applyUiPrefs'
import { useAuthStore } from './stores/auth'
applyUiPrefs(useAuthStore(pinia).user?.ui_prefs)

// The router's first navigation restores auth from the httpOnly cookie (see the
// bootstrap gate in router/index.js) and then loads store format prefs, so mount
// can proceed normally here.
app.mount('#app')

// Start intersection observer for intersect: Tailwind variant
Observer.start()
// Restart on every route change so newly mounted elements are observed
router.afterEach(() => Observer.restart())
