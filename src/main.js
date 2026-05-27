import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './assets/main.css'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// Init theme before mount so no flash of wrong theme
import { useThemeStore } from './stores/theme'
useThemeStore(pinia).init()

// Load currency + number-formatting prefs from the active store.  No-op if
// not authenticated yet; it runs again on the next login.
import { useFormatStore } from './stores/format'
import { useAuthStore } from './stores/auth'
const authStore   = useAuthStore(pinia)
const formatStore = useFormatStore(pinia)
if (authStore.isAuthenticated) formatStore.loadForStore()

app.mount('#app')
