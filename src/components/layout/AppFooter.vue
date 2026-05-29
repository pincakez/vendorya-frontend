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

    <template v-if="authStore.isSuperadmin">
      <span class="footer-sep">|</span>
      <span class="footer-item">
        <span class="footer-dot" :class="aiDotClass" />
        AI: {{ aiLabel }}
      </span>
    </template>

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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/api/axios'

const authStore = useAuthStore()

const syncedLabel = ref('just now')
let syncedAt = Date.now()
let timer

function updateLabel() {
  const diff = Math.floor((Date.now() - syncedAt) / 60000)
  syncedLabel.value = diff < 1 ? 'just now' : `${diff} min${diff > 1 ? 's' : ''} ago`
}

// AI API status
const aiStatus = ref('loading')

const aiDotClass = computed(() => {
  if (aiStatus.value === 'connected') return 'dot-green'
  if (aiStatus.value === 'error')     return 'dot-red'
  return 'dot-gray'
})

const aiLabel = computed(() => {
  if (aiStatus.value === 'connected') return 'Connected'
  if (aiStatus.value === 'error')     return 'Error'
  if (aiStatus.value === 'no_key')    return 'No Key'
  return '…'
})

async function checkAiStatus() {
  if (!authStore.isSuperadmin) return
  try {
    const { data } = await api.get('/api/admin/ai/status/')
    aiStatus.value = data.status
  } catch {
    aiStatus.value = 'error'
  }
}

let aiTimer

onMounted(() => {
  timer = setInterval(updateLabel, 30000)
  if (authStore.isSuperadmin) {
    checkAiStatus()
    aiTimer = setInterval(checkAiStatus, 60000)
  }
})

onUnmounted(() => {
  clearInterval(timer)
  clearInterval(aiTimer)
})
</script>
