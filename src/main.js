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
import { useAuthStore } from './stores/auth'
const authStore   = useAuthStore(pinia)
const formatStore = useFormatStore(pinia)
formatStore.applyColor()  // user's currency-symbol tint (persisted in localStorage)
if (authStore.isAuthenticated) formatStore.loadForStore()

app.mount('#app')
