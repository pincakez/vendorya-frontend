<template>
  <footer class="app-footer">
    <span class="footer-item">
      <span class="footer-dot" :class="serverDotClass" />
      Server: {{ serverLabel }}
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

// Server health
const serverStatus = ref('loading')

const serverDotClass = computed(() => {
  if (serverStatus.value === 'ok')      return 'dot-green'
  if (serverStatus.value === 'degraded') return 'dot-yellow'
  if (serverStatus.value === 'error')   return 'dot-red'
  return 'dot-gray'
})

const serverLabel = computed(() => {
  if (serverStatus.value === 'ok')      return 'Online'
  if (serverStatus.value === 'degraded') return 'Degraded'
  if (serverStatus.value === 'error')   return 'Offline'
  return '…'
})

async function checkServerHealth() {
  try {
    const { data } = await api.get('/api/health/')
    serverStatus.value = data.status === 'ok' ? 'ok' : 'degraded'
  } catch {
    serverStatus.value = 'error'
  }
}

let serverTimer

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
  checkServerHealth()
  serverTimer = setInterval(checkServerHealth, 120000)
  if (authStore.isSuperadmin) {
    checkAiStatus()
    aiTimer = setInterval(checkAiStatus, 60000)
  }
})

onUnmounted(() => {
  clearInterval(timer)
  clearInterval(serverTimer)
  clearInterval(aiTimer)
})
</script>
