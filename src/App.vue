<template>
  <UpdateBanner />
  <RouterView />
  <LockScreen />
</template>

<script setup>
import { RouterView } from 'vue-router'
import { onMounted, onUnmounted, watch } from 'vue'
import UpdateBanner from './components/UpdateBanner.vue'
import LockScreen from './components/LockScreen.vue'
import { useAuthStore } from './stores/auth'
import { useLockscreen } from './composables/useLockscreen'

const auth = useAuthStore()
const { init, destroy } = useLockscreen()

// Init lockscreen when a store user is present (user.store is set = store session)
watch(() => auth.user?.store, (store) => {
  if (store) init()
  else destroy()
}, { immediate: true })

function blockBrowserShortcuts(e) {
  const k = (e.ctrlKey || e.metaKey)
  if (!k) return
  const key = e.key.toLowerCase()
  if (key === 's') { e.preventDefault(); return }
  if (key === 'p') { e.preventDefault(); return }
  if (key === 'w') { e.preventDefault(); return }
  if (key === 'n') { e.preventDefault(); return }
  if (key === 't') { e.preventDefault(); return }
}

onMounted(()   => window.addEventListener('keydown', blockBrowserShortcuts))
onUnmounted(() => window.removeEventListener('keydown', blockBrowserShortcuts))
</script>
