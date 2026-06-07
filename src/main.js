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

// v-fill — table scrolls inside the viewport (single scrollbar + pinned header)
import { vFill } from './directives/fillHeight'
app.directive('fill', vFill)

// Init theme before mount so no flash of wrong theme
import { useThemeStore } from './stores/theme'
useThemeStore(pinia).init()

// Load currency + number-formatting prefs from the active store.  No-op if
// not authenticated yet; it runs again on the next login.
import { useFormatStore } from './stores/format'
const formatStore = useFormatStore(pinia)
formatStore.applyColor()  // user's currency-symbol tint (persisted in localStorage)

// The router's first navigation restores auth from the httpOnly cookie (see the
// bootstrap gate in router/index.js) and then loads store format prefs, so mount
// can proceed normally here.
app.mount('#app')
