<template>
  <header class="app-header">
    <button class="header-collapse-btn" @click="$emit('toggleSidebar')">
      <PanelLeftOpen v-if="sidebarCollapsed" :size="18" />
      <PanelLeftClose v-else :size="18" />
    </button>

    <!-- Mode chip + greeting -->
    <div class="header-greeting" style="display:flex; align-items:center; gap:10px;">
      <span class="admin-badge" v-if="!auth.activeStore">GENERAL ADMIN</span>
      <span class="admin-badge" v-else style="background: var(--admin-accent-soft); color: var(--admin-accent);">
        ACTING AS · {{ auth.activeStore.name }}
      </span>
    </div>

    <!-- Store picker -->
    <div class="store-picker" ref="pickerRef">
      <button class="store-picker-btn" @click="open = !open" :class="{ open }">
        <Search :size="14" />
        <span>{{ auth.activeStore ? 'Switch store' : 'Pick store' }}</span>
        <ChevronDown :size="14" />
      </button>

      <div v-if="open" class="store-picker-pop">
        <div class="store-picker-search">
          <Search :size="14" style="opacity:0.5;" />
          <input
            ref="searchInput"
            v-model="query"
            type="text"
            placeholder="Search stores..."
            @input="onSearch"
          />
        </div>

        <div class="store-picker-list">
          <button v-if="auth.activeStore" class="store-picker-item exit" @click="selectGeneral">
            <ArrowLeft :size="14" />
            <span>Back to General Admin</span>
          </button>

          <div v-if="loading" class="store-picker-empty">Loading...</div>
          <div v-else-if="!stores.length" class="store-picker-empty">No stores</div>
          <button
            v-for="s in stores"
            :key="s.id"
            class="store-picker-item"
            :class="{ active: auth.activeStore?.id === s.id }"
            @click="selectStore(s)"
          >
            <div class="sp-avatar">{{ s.name.charAt(0).toUpperCase() }}</div>
            <div class="sp-info">
              <div class="sp-name">{{ s.name }}</div>
              <div class="sp-meta">{{ s.owner_username }} · {{ s.plan }}</div>
            </div>
            <Check v-if="auth.activeStore?.id === s.id" :size="14" style="color: var(--admin-accent);" />
          </button>
        </div>
      </div>
    </div>

    <!-- Theme toggle -->
    <button class="header-icon-btn" @click="theme.toggle()" :title="theme.dark ? 'Switch to light mode' : 'Switch to dark mode'">
      <Sun v-if="theme.dark" :size="18" />
      <Moon v-else :size="18" />
    </button>

    <!-- AI Chat toggle -->
    <button
      class="header-icon-btn ai-toggle-btn"
      :class="{ active: chatOpen }"
      @click="$emit('toggleChat')"
      title="Toggle AI Assistant"
    >
      <Bot :size="18" />
    </button>
  </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { Sun, Moon, Search, ChevronDown, Check, ArrowLeft, PanelLeftOpen, PanelLeftClose, Bot } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import api from '@/api/axios'

defineProps({ sidebarCollapsed: Boolean, chatOpen: Boolean })
defineEmits(['toggleSidebar', 'toggleChat'])

const router = useRouter()
const auth = useAuthStore()
const theme = useThemeStore()

const open = ref(false)
const query = ref('')
const stores = ref([])
const loading = ref(false)
const pickerRef = ref(null)
const searchInput = ref(null)

let searchTimer = null

async function fetchStores(q = '') {
  loading.value = true
  try {
    const res = await api.get('/api/admin/stores/', { params: q ? { search: q } : {} })
    stores.value = Array.isArray(res.data) ? res.data : (res.data.results || [])
  } catch (e) {
    stores.value = []
  } finally {
    loading.value = false
  }
}

function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchStores(query.value.trim()), 250)
}

function selectStore(store) {
  auth.setActiveStore(store)
  open.value = false
  // Auto-switch to store mode → land on store dashboard
  router.push('/dashboard')
}

function selectGeneral() {
  auth.clearActiveStore()
  open.value = false
  router.push('/admin/dashboard')
}

function onClickOutside(e) {
  if (pickerRef.value && !pickerRef.value.contains(e.target)) open.value = false
}

onMounted(() => {
  fetchStores()
  document.addEventListener('mousedown', onClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', onClickOutside)
  clearTimeout(searchTimer)
})
</script>

<style scoped>
.ai-toggle-btn.active {
  background: rgba(249,115,22,0.12);
  color: var(--admin-accent, #f97316);
}

.store-picker { position: relative; flex-shrink: 0; }

.store-picker-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 12px;
  border: 1px solid var(--border);
  border-radius: 9px;
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: background 120ms, border-color 120ms, transform 80ms;
}
.store-picker-btn:hover { border-color: var(--admin-accent); color: var(--admin-accent); }
.store-picker-btn:active { transform: scale(0.97); }
.store-picker-btn.open { border-color: var(--admin-accent); color: var(--admin-accent); }

.store-picker-pop {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  width: 320px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  z-index: 100;
  overflow: hidden;
}
.store-picker-search {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
}
.store-picker-search input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary);
  font-size: 13px;
}
.store-picker-list {
  max-height: 340px;
  overflow-y: auto;
  padding: 4px;
}
.store-picker-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 8px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: var(--text-primary);
  transition: background 120ms;
}
.store-picker-item:hover { background: var(--admin-accent-soft); }
.store-picker-item.active { background: var(--admin-accent-soft); }
.store-picker-item.exit {
  color: var(--admin-accent);
  font-weight: 600;
  font-size: 12.5px;
  margin-bottom: 4px;
  border-bottom: 1px dashed var(--border);
  border-radius: 0;
  padding-bottom: 12px;
}
.sp-avatar {
  width: 32px; height: 32px;
  border-radius: 8px;
  background: var(--admin-accent-soft);
  color: var(--admin-accent);
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.sp-info { flex: 1; min-width: 0; }
.sp-name { font-size: 13px; font-weight: 600; }
.sp-meta { font-size: 11px; color: var(--text-muted); }
.store-picker-empty {
  padding: 16px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}
</style>
