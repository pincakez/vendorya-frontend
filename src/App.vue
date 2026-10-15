<template>
  <UpdateBanner />
  <RouterView />
  <LockScreen />
  <OwnerLockScreen />
</template>

<script setup>
import { RouterView } from 'vue-router'
import { onMounted, onUnmounted, watch } from 'vue'
import UpdateBanner from './components/UpdateBanner.vue'
import LockScreen from './components/LockScreen.vue'
import OwnerLockScreen from './components/OwnerLockScreen.vue'
import { useRoute, useRouter } from 'vue-router'
import { useOwnerLock } from './composables/useOwnerLock'
import { useAuthStore } from './stores/auth'
import { useLockscreen } from './composables/useLockscreen'

const auth = useAuthStore()
const { init, destroy, isLocked } = useLockscreen()

// s174: "My private accounts" locks again (its minutes ran out, the tree's lock icon, or the app's idle lock screen) →
// leave its pages; the idle lock screen also locks the tree, so a walk-away never leaves the owner's money open.
const route = useRoute()
const router = useRouter()
const ownerLock = useOwnerLock()
ownerLock.onLocked(() => { if (route.meta.ownerLevel) router.push('/dashboard').catch(() => {}) })
watch(isLocked, (locked) => { if (locked && ownerLock.enabled.value && ownerLock.isOpen.value) ownerLock.lockNow() })

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
