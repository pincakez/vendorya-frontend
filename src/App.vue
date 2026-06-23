<template>
  <UpdateBanner />
  <RouterView />
</template>

<script setup>
import { RouterView } from 'vue-router'
import { onMounted, onUnmounted } from 'vue'
import UpdateBanner from './components/UpdateBanner.vue'

function blockBrowserShortcuts(e) {
  const k = (e.ctrlKey || e.metaKey)
  if (!k) return
  const key = e.key.toLowerCase()
  // Block browser shortcuts that make no sense in a SPA or could destroy POS session
  if (key === 's') { e.preventDefault(); return }  // save dialog
  if (key === 'p') { e.preventDefault(); return }  // print dialog (we have our own)
  if (key === 'w') { e.preventDefault(); return }  // close tab (catastrophic in POS mid-sale)
  if (key === 'n') { e.preventDefault(); return }  // new window
  if (key === 't') { e.preventDefault(); return }  // new tab
}

onMounted(()   => window.addEventListener('keydown', blockBrowserShortcuts))
onUnmounted(() => window.removeEventListener('keydown', blockBrowserShortcuts))
</script>
