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
    <button class="header-icon-btn" title="Notifications">
      <Bell :size="18" />
      <span class="notif-dot" />
    </button>

    <!-- Theme toggle -->
    <button class="header-icon-btn" @click="theme.toggle()" :title="theme.dark ? 'Switch to light mode' : 'Switch to dark mode'">
      <Sun v-if="theme.dark" :size="18" />
      <Moon v-else :size="18" />
    </button>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { Bell, Sun, Moon, PanelLeftOpen, PanelLeftClose } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

defineProps({ sidebarCollapsed: Boolean })
defineEmits(['toggleSidebar'])

const auth = useAuthStore()
const theme = useThemeStore()

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
