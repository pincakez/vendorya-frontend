<template>
  <header class="app-header nhdr">
    <!-- ─────────────── ADMIN MODE ─────────────── -->
    <template v-if="admin">
      <div class="header-greeting" style="display:flex; align-items:center; gap:10px;">
        <span class="admin-badge" v-if="!auth.activeStore">GENERAL ADMIN</span>
        <span class="admin-badge" v-else style="background: var(--admin-accent-soft); color: var(--admin-accent);">
          ACTING AS · {{ auth.activeStore.name }}
        </span>
      </div>

      <!-- Store picker -->
      <div class="store-picker" ref="pickerRef">
        <button class="store-picker-btn" @click="pickerOpen = !pickerOpen" :class="{ open: pickerOpen }">
          <Search :size="14" />
          <span>{{ auth.activeStore ? 'Switch store' : 'Pick store' }}</span>
          <ChevronDown :size="14" />
        </button>

        <div v-if="pickerOpen" class="store-picker-pop">
          <div class="store-picker-search">
            <Search :size="14" style="opacity:0.5;" />
            <input v-model="storeQuery" type="text" placeholder="Search stores..." @input="onStoreSearch" />
          </div>
          <div class="store-picker-list">
            <button v-if="auth.activeStore" class="store-picker-item exit" @click="selectGeneral">
              <ArrowLeft :size="14" />
              <span>Back to General Admin</span>
            </button>
            <div v-if="storesLoading" class="store-picker-empty">Loading...</div>
            <div v-else-if="!stores.length" class="store-picker-empty">No stores</div>
            <button
              v-for="s in stores" :key="s.id"
              class="store-picker-item" :class="{ active: auth.activeStore?.id === s.id }"
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

      <!-- Switch to Store View (preview) -->
      <button v-if="auth.isInStoreMode" class="header-preview-btn" title="Switch to Store View" @click="enterPreview">
        <Eye :size="14" /> Store View
      </button>

      <div class="nhdr-spacer" />

      <!-- Theme toggle -->
      <button class="header-icon-btn" @click="theme.toggle()" :title="theme.dark ? 'Switch to light mode' : 'Switch to dark mode'">
        <Sun v-if="theme.dark" :size="18" />
        <Moon v-else :size="18" />
      </button>

      <!-- AI Chat toggle -->
      <button class="header-icon-btn ai-toggle-btn" :class="{ active: chatOpen }" @click="$emit('toggleChat')" title="Toggle AI Assistant">
        <Bot :size="18" />
      </button>
    </template>

    <!-- ─────────────── STORE MODE ─────────────── -->
    <template v-else>
      <!-- Global search / command palette -->
      <div class="nhdr-search" ref="searchRef">
        <Search :size="15" class="nhdr-search-icon" />
        <input
          ref="searchInput"
          v-model="q"
          class="nhdr-search-input"
          placeholder="Search pages — Products, Invoices, Customers…"
          @focus="searchOpen = true"
          @keydown.down.prevent="move(1)"
          @keydown.up.prevent="move(-1)"
          @keydown.enter.prevent="choose"
          @keydown.esc="searchOpen = false"
        />
        <kbd class="nhdr-kbd">⌘K</kbd>

        <Transition name="dropdown">
          <div v-if="searchOpen && q && results.length" class="nhdr-results">
            <button
              v-for="(r, i) in results" :key="r.path"
              class="nhdr-result" :class="{ active: i === idx }"
              @click="navTo(r.path)" @mouseenter="idx = i"
            >
              <component :is="r.icon" :size="15" class="nhdr-result-icon" />
              <span class="nhdr-result-label">{{ r.label }}</span>
              <span class="nhdr-result-group">{{ r.group }}</span>
            </button>
          </div>
        </Transition>
      </div>

      <div class="nhdr-spacer" />

      <!-- Store brand: client logo + PREMIUM badge -->
      <div v-if="storeLogo || auth.isPremium" class="nhdr-brand">
        <img v-if="storeLogo" :src="storeLogo" :alt="auth.storeName" class="nhdr-store-logo" />
        <span v-if="auth.isPremium" class="nhdr-premium-badge">PREMIUM</span>
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
            <button v-for="n in recent" :key="n.id" class="nd-item" @click="openNotif(n)">
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

      <!-- Language toggle -->
      <button class="header-lang-btn" @click="toggleLocale" :title="locale === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'">
        {{ locale === 'ar' ? 'EN' : 'AR' }}
      </button>
    </template>
  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  Bell, Sun, Moon, Search, ChevronDown, Check, ArrowLeft, Bot, Eye,
  LayoutDashboard, Package, ShoppingCart, SlidersHorizontal, Tag, List, FileBarChart,
  FileText, CornerDownLeft, Receipt, Clock, Wallet, Users, Truck, Briefcase,
  LineChart, TrendingUp, DollarSign, Activity, Inbox as InboxIcon, Settings, Percent, Lock, Calculator,
} from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'
import { useNotifications } from '@/composables/useNotifications'
import api from '@/api/axios'

defineProps({ sidebarCollapsed: Boolean, admin: Boolean, chatOpen: Boolean })
defineEmits(['toggleSidebar', 'toggleChat'])

const auth   = useAuthStore()
const theme  = useThemeStore()
const router = useRouter()
const { locale } = useI18n()

function toggleLocale() {
  const next = locale.value === 'ar' ? 'en' : 'ar'
  locale.value = next
  localStorage.setItem('vendorya_locale', next)
}

const storeLogo = computed(() => {
  const store = auth.user?.store || auth.activeStore
  if (!store) return null
  return theme.dark ? (store.logo_dark_url || store.logo_light_url || null)
                    : (store.logo_light_url || store.logo_dark_url || null)
})

/* ── Store picker (admin) ───────────────────── */
const pickerOpen    = ref(false)
const storeQuery    = ref('')
const stores        = ref([])
const storesLoading = ref(false)
const pickerRef     = ref(null)
let storeSearchTimer = null

async function fetchStores(qy = '') {
  storesLoading.value = true
  try {
    const res = await api.get('/api/admin/stores/', { params: qy ? { search: qy } : {} })
    stores.value = Array.isArray(res.data) ? res.data : (res.data.results || [])
  } catch { stores.value = [] }
  finally { storesLoading.value = false }
}
function onStoreSearch() {
  clearTimeout(storeSearchTimer)
  storeSearchTimer = setTimeout(() => fetchStores(storeQuery.value.trim()), 250)
}
function selectStore(store) {
  auth.setActiveStore(store)
  pickerOpen.value = false
  router.push('/dashboard')
}
function enterPreview() { auth.enterPreview(); router.push('/dashboard') }
function selectGeneral() { auth.clearActiveStore(); pickerOpen.value = false; router.push('/admin/dashboard') }

/* ── Global search (store) ──────────────────── */
const PAGES = [
  { label: 'Dashboard', path: '/dashboard', group: 'General', icon: LayoutDashboard },
  { label: 'Products', path: '/inventory/products', group: 'Inventory', icon: Package },
  { label: 'Purchases', path: '/inventory/purchases', group: 'Inventory', icon: ShoppingCart },
  { label: 'Stock Adjustments', path: '/inventory/adjustments', group: 'Inventory', icon: SlidersHorizontal },
  { label: 'Categories', path: '/inventory/categories', group: 'Inventory', icon: Tag },
  { label: 'Attributes', path: '/inventory/attributes', group: 'Inventory', icon: List },
  { label: 'Inventory Reports', path: '/inventory/reports', group: 'Inventory', icon: FileBarChart },
  { label: 'Sales Invoices', path: '/finance/invoices', group: 'Finance', icon: FileText },
  { label: 'Returns', path: '/finance/returns', group: 'Finance', icon: CornerDownLeft },
  { label: 'Expenses', path: '/finance/expenses', group: 'Finance', icon: Receipt },
  { label: 'Shifts', path: '/finance/shifts', group: 'Finance', icon: Clock },
  { label: 'Cash Drawer', path: '/finance/cash-drawer', group: 'Finance', icon: Wallet },
  { label: 'Customers', path: '/people/customers', group: 'People', icon: Users },
  { label: 'Suppliers', path: '/people/suppliers', group: 'People', icon: Truck },
  { label: 'Staff', path: '/people/staff', group: 'People', icon: Briefcase },
  { label: 'Sales Report', path: '/reports/sales', group: 'Reports', icon: LineChart },
  { label: 'Profit Margin', path: '/reports/profit', group: 'Reports', icon: TrendingUp },
  { label: 'Profit & Loss', path: '/reports/pnl', group: 'Reports', icon: DollarSign },
  { label: 'Tax Report', path: '/reports/tax', group: 'Reports', icon: Percent },
  { label: 'Activity Log', path: '/activity-log', group: 'General', icon: Activity },
  { label: 'Inbox', path: '/inbox', group: 'General', icon: InboxIcon },
  { label: 'Settings', path: '/settings', group: 'Settings', icon: Settings },
  { label: 'Taxes', path: '/settings/taxes', group: 'Settings', icon: Percent },
  { label: 'Security', path: '/settings/security', group: 'Settings', icon: Lock },
  { label: 'Point of Sale', path: '/pos', group: 'General', icon: Calculator },
]

const q = ref('')
const searchOpen = ref(false)
const idx = ref(0)
const searchRef = ref(null)
const searchInput = ref(null)

const results = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term) return []
  return PAGES.filter(p => p.label.toLowerCase().includes(term) || p.group.toLowerCase().includes(term)).slice(0, 7)
})
watch(results, () => { idx.value = 0 })

function move(d) {
  if (!results.value.length) return
  idx.value = (idx.value + d + results.value.length) % results.value.length
}
function choose() { if (results.value[idx.value]) navTo(results.value[idx.value].path) }
function navTo(path) {
  searchOpen.value = false
  q.value = ''
  if (router.currentRoute.value.path !== path) router.push(path)
}
function onSearchKey(e) {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    searchInput.value?.focus()
    searchOpen.value = true
  }
}

/* ── Notifications bell (store) ─────────────── */
const { unreadCount, recent, fetchPrefs, fetchRecent, markRead, markAllRead } = useNotifications()
const dropdownOpen = ref(false)
const bellRef      = ref(null)
let pollTimer      = null

function toggleDropdown() { dropdownOpen.value = !dropdownOpen.value }

function onDocClick(e) {
  if (bellRef.value && !bellRef.value.contains(e.target)) dropdownOpen.value = false
  if (searchRef.value && !searchRef.value.contains(e.target)) searchOpen.value = false
  if (pickerRef.value && !pickerRef.value.contains(e.target)) pickerOpen.value = false
}

async function openNotif(n) {
  await markRead(n.id)
  dropdownOpen.value = false
  router.push(n.link || '/inbox')
}
async function doMarkAll() { await markAllRead() }
function goInbox() { dropdownOpen.value = false; router.push('/inbox') }

function timeAgo(iso) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

onMounted(() => {
  if (auth.isSuperadmin) {
    fetchStores()
  }
  if (auth.user?.store) {
    fetchPrefs()
    fetchRecent()
    pollTimer = setInterval(fetchRecent, 20000)
  }
  document.addEventListener('click', onDocClick)
  window.addEventListener('keydown', onSearchKey)
})
onUnmounted(() => {
  clearInterval(pollTimer)
  clearTimeout(storeSearchTimer)
  document.removeEventListener('click', onDocClick)
  window.removeEventListener('keydown', onSearchKey)
})
</script>

<style scoped>
/* ── Global search ──────────────────────────── */
.nhdr-search { position: relative; width: 100%; max-width: 460px; }
.nhdr-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--text-muted); pointer-events: none; }
.nhdr-search-input {
  width: 100%; height: 38px; padding: 0 44px 0 36px;
  background: var(--bg-app); border: 1px solid var(--border); border-radius: 10px;
  font-size: 13.5px; color: var(--text-primary); outline: none;
  transition: border-color 140ms, box-shadow 140ms;
}
.nhdr-search-input::placeholder { color: var(--text-muted); }
.nhdr-search-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.nhdr-kbd {
  position: absolute; right: 10px; top: 50%; transform: translateY(-50%);
  font-family: ui-monospace, monospace; font-size: 11px; color: var(--text-muted);
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 5px; padding: 2px 6px;
}
.nhdr-spacer { flex: 1; }

.nhdr-results {
  position: absolute; top: calc(100% + 8px); left: 0; right: 0;
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px;
  box-shadow: 0 12px 32px rgba(0,0,0,0.16); overflow: hidden; z-index: 1000; padding: 5px;
}
.nhdr-result {
  display: flex; align-items: center; gap: 10px; width: 100%;
  padding: 9px 10px; border: none; background: none; cursor: pointer; text-align: left;
  border-radius: 8px; color: var(--text-secondary); transition: background 100ms, color 100ms;
}
.nhdr-result.active { background: var(--accent-soft); color: var(--text-primary); }
.nhdr-result-icon { color: var(--accent); flex-shrink: 0; }
.nhdr-result-label { font-size: 13.5px; font-weight: 500; color: var(--text-primary); }
.nhdr-result-group { margin-left: auto; font-size: 11px; color: var(--text-muted); }

/* ── Bell ───────────────────────────────────── */
.bell-wrap { position: relative; }
.bell-btn  { position: relative; }
.bell-badge {
  position: absolute; top: 1px; right: 1px; min-width: 16px; height: 16px;
  padding: 0 4px; border-radius: 8px; background: var(--danger); color: #fff;
  font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center;
  line-height: 1; box-shadow: 0 0 0 2px var(--bg-header);
}

.notif-dropdown {
  position: absolute; top: calc(100% + 8px); right: -8px; width: 320px;
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18); z-index: 1000; overflow: hidden;
}
.nd-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px 8px; border-bottom: 1px solid var(--border); }
.nd-title    { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.nd-mark-all { font-size: 11.5px; color: var(--accent); background: none; border: none; cursor: pointer; padding: 0; }
.nd-mark-all:hover { text-decoration: underline; }
.nd-empty { padding: 28px 16px; text-align: center; font-size: 13px; color: var(--text-muted); }
.nd-item { display: flex; align-items: flex-start; gap: 10px; width: 100%; padding: 10px 16px; border: none; background: none; cursor: pointer; text-align: left; border-bottom: 1px solid var(--border); transition: background 100ms; }
.nd-item:last-of-type { border-bottom: none; }
.nd-item:hover { background: var(--bg-app); }
.nd-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
.dot-info    { background: var(--success); }
.dot-warning { background: var(--warning); }
.dot-alert   { background: var(--danger); }
.dot-admin   { background: #1e293b; }
.nd-body        { flex: 1; min-width: 0; }
.nd-item-title  { font-size: 13px; font-weight: 600; color: var(--text-primary); line-height: 1.35; }
.nd-item-body   { font-size: 12px; color: var(--text-secondary); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nd-item-time   { font-size: 11px; color: var(--text-muted); margin-top: 3px; }
.nd-view-all { display: block; width: 100%; padding: 10px 16px; text-align: center; font-size: 12.5px; font-weight: 600; color: var(--accent); background: none; border: none; border-top: 1px solid var(--border); cursor: pointer; transition: background 100ms; }
.nd-view-all:hover { background: var(--bg-app); }

.nhdr-brand { display: flex; align-items: center; gap: 8px; flex-shrink: 0; margin-right: 100px; }

.header-lang-btn {
  flex-shrink: 0; padding: 5px 10px; border-radius: 8px;
  border: 1px solid var(--border); background: transparent;
  color: var(--text-secondary); font-size: 12px; font-weight: 700;
  letter-spacing: 0.05em; cursor: pointer; font-family: inherit;
  transition: border-color 120ms, color 120ms, background 120ms;
}
.header-lang-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
.nhdr-store-logo { height: 28px; width: auto; max-width: 160px; object-fit: contain; flex-shrink: 0; }
.nhdr-premium-badge {
  flex-shrink: 0; font-size: 8.5px; font-weight: 700; letter-spacing: 0.06em; padding: 2px 5px;
  border-radius: 5px; background: var(--sb-badge-bg); color: var(--sb-badge-text);
}

/* ── AI toggle + store picker (admin) ───────── */
.ai-toggle-btn.active { background: rgba(239,68,68,0.12); color: var(--admin-accent, #ef4444); }

.header-preview-btn {
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px;
  border-radius: 8px; border: 1px solid var(--admin-accent);
  background: var(--admin-accent-soft); color: var(--admin-accent);
  font-size: 12.5px; font-weight: 600; cursor: pointer;
  transition: background 120ms, transform 80ms; flex-shrink: 0;
}
.header-preview-btn:hover  { background: rgba(239,68,68,0.22); }
.header-preview-btn:active { transform: scale(0.96); }

.store-picker { position: relative; flex-shrink: 0; }
.store-picker-btn {
  display: inline-flex; align-items: center; gap: 8px; padding: 7px 12px;
  border: 1px solid var(--border); border-radius: 9px; background: var(--bg-card);
  color: var(--text-secondary); font-size: 13px; font-weight: 500; cursor: pointer;
  transition: background 120ms, border-color 120ms, transform 80ms;
}
.store-picker-btn:hover { border-color: var(--admin-accent); color: var(--admin-accent); }
.store-picker-btn:active { transform: scale(0.97); }
.store-picker-btn.open { border-color: var(--admin-accent); color: var(--admin-accent); }
.store-picker-pop {
  position: absolute; top: calc(100% + 6px); left: 0; width: 320px;
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12); z-index: 100; overflow: hidden;
}
.store-picker-search { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-bottom: 1px solid var(--border); }
.store-picker-search input { flex: 1; background: transparent; border: none; outline: none; color: var(--text-primary); font-size: 13px; }
.store-picker-list { max-height: 340px; overflow-y: auto; padding: 4px; }
.store-picker-item {
  width: 100%; display: flex; align-items: center; gap: 10px; padding: 9px 10px;
  border-radius: 8px; background: transparent; text-align: left; cursor: pointer;
  color: var(--text-primary); transition: background 120ms;
}
.store-picker-item:hover { background: var(--admin-accent-soft); }
.store-picker-item.active { background: var(--admin-accent-soft); }
.store-picker-item.exit {
  color: var(--admin-accent); font-weight: 600; font-size: 12.5px; margin-bottom: 4px;
  border-bottom: 1px dashed var(--border); border-radius: 0; padding-bottom: 12px;
}
.sp-avatar {
  width: 32px; height: 32px; border-radius: 8px; background: var(--admin-accent-soft);
  color: var(--admin-accent); font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.sp-info { flex: 1; min-width: 0; }
.sp-name { font-size: 13px; font-weight: 600; }
.sp-meta { font-size: 11px; color: var(--text-muted); }
.store-picker-empty { padding: 16px; text-align: center; color: var(--text-muted); font-size: 13px; }

.dropdown-enter-active, .dropdown-leave-active { transition: opacity 150ms, transform 150ms; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-6px); }
</style>
