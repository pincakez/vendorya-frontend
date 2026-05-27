<template>
  <header class="app-header">
    <!-- Sidebar toggle -->
    <button class="header-collapse-btn" @click="$emit('toggleSidebar')">
      <PanelLeftOpen v-if="sidebarCollapsed" :size="18" />
      <PanelLeftClose v-else :size="18" />
    </button>

    <!-- Greeting -->
    <div class="header-greeting">
      <div class="header-greeting-text">{{ greeting }}, {{ auth.displayName }}</div>
      <div class="header-greeting-sub">{{ auth.storeName }} &nbsp;·&nbsp; {{ formattedDate }}</div>
    </div>

    <!-- Role badge -->
    <span v-if="auth.userRole" class="header-role-badge">{{ auth.userRole }}</span>

    <!-- Notification bell -->
    <button class="header-icon-btn bell-btn" title="Inbox" @click="goInbox">
      <Bell :size="18" />
      <span v-if="unread > 0" class="bell-badge">{{ unread > 99 ? '99+' : unread }}</span>
    </button>

    <!-- Theme toggle -->
    <button class="header-icon-btn" @click="theme.toggle()" :title="theme.dark ? 'Switch to light mode' : 'Switch to dark mode'">
      <Sun v-if="theme.dark" :size="18" />
      <Moon v-else :size="18" />
    </button>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, Sun, Moon, PanelLeftOpen, PanelLeftClose } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import api from '@/api/axios'

defineProps({ sidebarCollapsed: Boolean })
defineEmits(['toggleSidebar'])

const auth = useAuthStore()
const theme = useThemeStore()
const router = useRouter()

const unread = ref(0)
let pollTimer = null

async function fetchUnread() {
  try {
    const res = await api.get('/api/notifications/unread-count/')
    unread.value = res.data?.count ?? 0
  } catch {
    // silent — header shouldn't break if endpoint is gone
  }
}

function goInbox() { router.push('/inbox') }

onMounted(() => {
  if (auth.user?.store) {
    fetchUnread()
    pollTimer = setInterval(fetchUnread, 20000)
  }
})
onUnmounted(() => clearInterval(pollTimer))

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
})

const formattedDate = computed(() => {
  return new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })
})
</script>

<style scoped>
.bell-btn { position: relative; }
.bell-badge {
  position: absolute;
  top: 1px;
  right: 1px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  box-shadow: 0 0 0 2px var(--header-bg, var(--bg-card));
}
</style>
