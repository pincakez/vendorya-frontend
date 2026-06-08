import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/main.css'
import Money from './components/ui/Money.vue'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

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
