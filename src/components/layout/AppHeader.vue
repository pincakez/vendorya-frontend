<template>
  <header class="app-header">
    <!-- Sidebar toggle -->
    <button class="header-icon-btn" @click="$emit('toggleSidebar')">
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
    <div class="bell-wrap" ref="bellRef">
      <button class="header-icon-btn bell-btn" title="Notifications" @click="toggleDropdown">
        <Bell :size="18" />
        <span v-if="unreadCount > 0" class="bell-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      </button>

      <Transition name="dropdown">
        <div v-if="dropdownOpen" class="notif-dropdown">
          <div class="nd-header">
            <span class="nd-title">Notifications</span>
            <button v-if="unreadCount > 0" class="nd-mark-all" @click="doMarkAll">Mark all read</button>
          </div>

          <div v-if="recent.length === 0" class="nd-empty">You're all caught up</div>

          <button
            v-for="n in recent"
            :key="n.id"
            class="nd-item"
            @click="openNotif(n)"
          >
            <span class="nd-dot" :class="`dot-${n.priority.toLowerCase()}`"></span>
            <div class="nd-body">
              <div class="nd-item-title">{{ n.title }}</div>
              <div v-if="n.body" class="nd-item-body">{{ n.body }}</div>
              <div class="nd-item-time">{{ timeAgo(n.created_at) }}</div>
            </div>
          </button>

          <button class="nd-view-all" @click="goInbox">View all notifications →</button>
        </div>
      </Transition>
    </div>

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
import { useNotifications } from '@/composables/useNotifications'

defineProps({ sidebarCollapsed: Boolean })
defineEmits(['toggleSidebar'])

const auth   = useAuthStore()
const theme  = useThemeStore()
const router = useRouter()

const { unreadCount, recent, fetchPrefs, fetchRecent, markRead, markAllRead } = useNotifications()

const dropdownOpen = ref(false)
const bellRef      = ref(null)
let pollTimer      = null

function toggleDropdown() {
  dropdownOpen.value = !dropdownOpen.value
}

function closeDropdown(e) {
  if (bellRef.value && !bellRef.value.contains(e.target)) {
    dropdownOpen.value = false
  }
}

async function openNotif(n) {
  await markRead(n.id)
  dropdownOpen.value = false
  if (n.link) router.push(n.link)
  else router.push('/inbox')
}

async function doMarkAll() {
  await markAllRead()
}

function goInbox() {
  dropdownOpen.value = false
  router.push('/inbox')
}

function timeAgo(iso) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

onMounted(() => {
  if (auth.user?.store) {
    fetchPrefs()
    fetchRecent()
    pollTimer = setInterval(fetchRecent, 20000)
  }
  document.addEventListener('click', closeDropdown)
})
onUnmounted(() => {
  clearInterval(pollTimer)
  document.removeEventListener('click', closeDropdown)
})

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
.bell-wrap { position: relative; }
.bell-btn  { position: relative; }
.bell-badge {
  position: absolute;
  top: 1px; right: 1px;
  min-width: 16px; height: 16px;
  padding: 0 4px; border-radius: 8px;
  background: #ef4444; color: #fff;
  font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  line-height: 1;
  box-shadow: 0 0 0 2px var(--header-bg, var(--bg-card));
}

/* Dropdown */
.notif-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: -8px;
  width: 320px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
  z-index: 1000;
  overflow: hidden;
}

.nd-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px 8px;
  border-bottom: 1px solid var(--border);
}
.nd-title    { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.nd-mark-all { font-size: 11.5px; color: var(--primary, #3b82f6); background: none; border: none; cursor: pointer; padding: 0; }
.nd-mark-all:hover { text-decoration: underline; }

.nd-empty {
  padding: 28px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--text-muted);
}

.nd-item {
  display: flex; align-items: flex-start; gap: 10px;
  width: 100%; padding: 10px 16px;
  border: none; background: none; cursor: pointer; text-align: left;
  border-bottom: 1px solid var(--border);
  transition: background 100ms;
}
.nd-item:last-of-type { border-bottom: none; }
.nd-item:hover { background: var(--bg-app); }

.nd-dot {
  width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; margin-top: 4px;
}
.dot-info    { background: #16a34a; }
.dot-warning { background: #f59e0b; }
.dot-alert   { background: #ef4444; }
.dot-admin   { background: #1e293b; }

.nd-body        { flex: 1; min-width: 0; }
.nd-item-title  { font-size: 13px; font-weight: 600; color: var(--text-primary); line-height: 1.35; }
.nd-item-body   { font-size: 12px; color: var(--text-secondary); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nd-item-time   { font-size: 11px; color: var(--text-muted); margin-top: 3px; }

.nd-view-all {
  display: block; width: 100%; padding: 10px 16px;
  text-align: center; font-size: 12.5px; font-weight: 600;
  color: var(--primary, #3b82f6); background: none; border: none;
  border-top: 1px solid var(--border); cursor: pointer;
  transition: background 100ms;
}
.nd-view-all:hover { background: var(--bg-app); }

/* Transition */
.dropdown-enter-active, .dropdown-leave-active { transition: opacity 150ms, transform 150ms; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
