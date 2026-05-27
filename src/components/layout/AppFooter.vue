<template>
  <footer class="app-footer">
    <span class="footer-item">
      <span style="font-weight:600;letter-spacing:0.05em;">ERP SYSTEM</span>
      &nbsp;V2.4.0
    </span>

    <span class="footer-sep">|</span>

    <span class="footer-item">
      <span class="footer-dot" />
      Server: Optimal
    </span>

    <span class="footer-sep">|</span>

    <span class="footer-item">
      Last synced: {{ syncedLabel }}
    </span>

    <span style="flex:1" />

    <span class="footer-item" style="opacity:0.5;">
      © 2026 Vendorya
    </span>
  </footer>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const syncedLabel = ref('just now')
let syncedAt = Date.now()
let timer

function updateLabel() {
  const diff = Math.floor((Date.now() - syncedAt) / 60000)
  syncedLabel.value = diff < 1 ? 'just now' : `${diff} min${diff > 1 ? 's' : ''} ago`
}

onMounted(() => { timer = setInterval(updateLabel, 30000) })
onUnmounted(() => clearInterval(timer))
</script>
