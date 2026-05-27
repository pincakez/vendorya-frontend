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

app.mount('#app')
