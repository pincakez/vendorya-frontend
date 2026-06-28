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
          :placeholder="t('core.header.search_ph')"
          @focus="searchOpen = true"
          @keydown.down.prevent="move(1)"
          @keydown.up.prevent="move(-1)"
          @keydown.enter.prevent="choose"
          @keydown.esc="searchOpen = false"
        />
        <kbd class="nhdr-kbd">⌘K</kbd>

        <Transition name="dropdown">
          <div v-if="searchOpen && q && results.length" class="nhdr-results">
            <div v-if="isFuzzyResult" class="nhdr-fuzzy-hint">Did you mean…</div>
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

      <!-- Role badge + logout icon -->
      <div v-if="auth.userRole" class="header-role-wrap">
        <span class="header-role-badge">{{ t('people.staff.roles.' + auth.userRole.toLowerCase()) }}</span>
        <button class="header-logout-icon" @click="logoutModal = true" :title="t('nav.log_out')">
          <LogOut :size="15" />
        </button>
      </div>

      <!-- Notification bell -->
      <div class="bell-wrap" ref="bellRef">
        <button class="header-icon-btn bell-btn" title="Notifications" @click="toggleDropdown">
          <Bell :size="18" />
          <span v-if="unreadCount > 0" class="bell-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
        </button>

        <Transition name="dropdown">
          <div v-if="dropdownOpen" class="notif-dropdown">
            <div class="nd-header">
              <span class="nd-title">{{ t('core.header.notifications') }}</span>
              <button v-if="unreadCount > 0" class="nd-mark-all" @click="doMarkAll">{{ t('core.inbox.mark_all') }}</button>
            </div>
            <div v-if="recent.length === 0" class="nd-empty">{{ t('core.header.caught_up') }}</div>
            <button v-for="n in recent" :key="n.id" class="nd-item" @click="openNotif(n)">
              <span class="nd-dot" :class="`dot-${n.priority.toLowerCase()}`"></span>
              <div class="nd-body">
                <div class="nd-item-title">{{ n.title }}</div>
                <div v-if="n.body" class="nd-item-body">{{ n.body }}</div>
                <div class="nd-item-time">{{ timeAgo(n.created_at) }}</div>
              </div>
            </button>
            <button class="nd-view-all" @click="goInbox">{{ t('core.header.view_all') }}</button>
          </div>
        </Transition>
      </div>

      <!-- Settings -->
      <button class="header-icon-btn" @click="router.push('/settings')" :title="t('nav.items.store_settings')">
        <Settings :size="18" />
      </button>

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

  <!-- Logout confirmation modal -->
  <Teleport to="body">
    <Transition name="lo-fade">
      <div v-if="logoutModal" class="lo-overlay" @click.self="logoutModal = false" @keydown="onLoModalKey">
        <div class="lo-card" role="dialog" aria-modal="true">
          <div class="lo-icon-wrap"><LogOut :size="22" /></div>
          <div class="lo-title">{{ t('nav.logout_confirm_title') }}</div>
          <div class="lo-body">{{ t('nav.logout_confirm_body') }}</div>
          <div class="lo-btns">
            <button
              ref="loCancelBtn"
              class="lo-btn lo-cancel"
              :class="{ focused: loFocus === 0 }"
              @click="logoutModal = false"
              @mouseenter="loFocus = 0"
            >{{ t('common.cancel') }}</button>
            <button
              ref="loConfirmBtn"
              class="lo-btn lo-confirm"
              :class="{ focused: loFocus === 1 }"
              @click="doLogout"
              @mouseenter="loFocus = 1"
            ><LogOut :size="14" /> {{ t('nav.log_out') }}</button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import {
  Bell, Sun, Moon, Search, ChevronDown, Check, ArrowLeft, Bot, Eye, LogOut,
  LayoutDashboard, Package, ShoppingCart, SlidersHorizontal, Tag, List, FileBarChart,
  FileText, CornerDownLeft, Receipt, Clock, Wallet, Users, Truck, Briefcase,
  LineChart, TrendingUp, DollarSign, Activity, Inbox as InboxIcon, Settings, Percent, Lock, Calculator, Sparkles,
  Library, Archive, ArrowLeftRight, ArrowDownUp, Layers, UserCircle, CreditCard,
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
const { locale, t } = useI18n()

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
const PAGES = computed(() => [
  { label: t('nav.dashboard'), path: '/dashboard', group: t('nav.groups.general'), icon: LayoutDashboard, kw: 'home overview summary' },
  { label: t('core.header.pos'), path: '/pos', group: t('nav.groups.general'), icon: Calculator, kw: 'cashier sale checkout counter point of sale' },
  { label: t('nav.items.products'), path: '/inventory/products', group: t('nav.groups.inventory'), icon: Package, kw: 'items drugs medicines stock sku barcode' },
  { label: t('nav.items.purchases'), path: '/inventory/purchases', group: t('nav.groups.inventory'), icon: ShoppingCart, kw: 'receive supplier invoice stock in buy' },
  { label: t('nav.items.stock_adjustments'), path: '/inventory/adjustments', group: t('nav.groups.inventory'), icon: SlidersHorizontal, kw: 'correct opening balance ledger movement' },
  { label: t('nav.items.stock_transfers'), path: '/inventory/transfers', group: t('nav.groups.inventory'), icon: ArrowLeftRight, kw: 'move branch transfer between' },
  { label: t('nav.items.memory_base'), path: '/inventory/memory-base', group: t('nav.groups.inventory'), icon: Library, kw: 'drug catalog reference index names medicines database' },
  { label: t('nav.items.categories'), path: '/inventory/categories', group: t('nav.groups.inventory'), icon: Tag, kw: 'groups drugs types classify' },
  { label: t('nav.items.attributes'), path: '/inventory/attributes', group: t('nav.groups.inventory'), icon: List, kw: 'fields manufacturer active ingredient custom meta' },
  { label: t('nav.items.inventory_reports'), path: '/inventory/reports', group: t('nav.groups.inventory'), icon: FileBarChart, kw: 'stock report low reorder expiry batch' },
  { label: t('nav.items.import_export'), path: '/inventory/import-export', group: t('nav.groups.inventory'), icon: ArrowDownUp, kw: 'csv bulk upload download data' },
  { label: t('nav.items.storage'), path: '/inventory/storage', group: t('nav.groups.inventory'), icon: Archive, kw: 'warehouse shelf location bin rack' },
  { label: t('nav.items.sales_invoices'), path: '/finance/invoices', group: t('nav.groups.finance'), icon: FileText, kw: 'invoice sale receipt order customer' },
  { label: t('nav.items.returns'), path: '/finance/returns', group: t('nav.groups.finance'), icon: CornerDownLeft, kw: 'refund return exchange cancel' },
  { label: t('nav.items.expenses'), path: '/finance/expenses', group: t('nav.groups.finance'), icon: Receipt, kw: 'cost spending overhead bills' },
  { label: t('nav.items.shifts'), path: '/finance/shifts', group: t('nav.groups.finance'), icon: Clock, kw: 'open close shift daily session cash' },
  { label: t('nav.items.cash_drawer'), path: '/finance/cash-drawer', group: t('nav.groups.finance'), icon: Wallet, kw: 'drawer float cash in out' },
  { label: t('nav.items.customers'), path: '/people/customers', group: t('nav.groups.people'), icon: Users, kw: 'clients patients buyer contact' },
  { label: t('nav.items.suppliers'), path: '/people/suppliers', group: t('nav.groups.people'), icon: Truck, kw: 'vendor company distributor source' },
  { label: t('nav.items.staff'), path: '/people/staff', group: t('nav.groups.people'), icon: Briefcase, kw: 'employees cashier manager role user account' },
  { label: t('nav.items.sales'), path: '/reports/sales', group: t('nav.groups.reports'), icon: LineChart, kw: 'revenue chart trend analytics' },
  { label: t('nav.items.profit_margin'), path: '/reports/profit', group: t('nav.groups.reports'), icon: TrendingUp, kw: 'margin gross net cost' },
  { label: t('nav.items.pnl'), path: '/reports/pnl', group: t('nav.groups.reports'), icon: DollarSign, kw: 'profit loss income statement financial' },
  { label: t('nav.items.tax'), path: '/reports/tax', group: t('nav.groups.reports'), icon: Percent, kw: 'vat gst tax report' },
  { label: t('nav.items.activity_log'), path: '/activity-log', group: t('nav.groups.general'), icon: Activity, kw: 'history audit log who changed' },
  { label: t('nav.items.inbox'), path: '/inbox', group: t('nav.groups.general'), icon: InboxIcon, kw: 'messages alerts notifications' },
  { label: t('nav.items.store_settings'), path: '/settings', group: t('nav.groups.settings'), icon: Settings, kw: 'store info general configuration setup name' },
  { label: 'Capabilities', path: '/settings/capabilities', group: t('nav.groups.settings'), icon: Layers, kw: 'multi unit pharmacy fefo expiry weight selling mode features toggle enable disable' },
  { label: 'POS Settings', path: '/settings/pos', group: t('nav.groups.settings'), icon: Calculator, kw: 'clock 12h 24h time format cart display pos favorites top selling ux' },
  { label: t('nav.items.taxes'), path: '/settings/taxes', group: t('nav.groups.settings'), icon: Percent, kw: 'vat rate tax rate percentage' },
  { label: 'Profile', path: '/settings/profile', group: t('nav.groups.settings'), icon: UserCircle, kw: 'account password name email photo avatar' },
  { label: t('nav.items.security'), path: '/settings/security', group: t('nav.groups.settings'), icon: Lock, kw: 'password 2fa pin access login auth' },
  { label: 'Notifications', path: '/settings/notifications', group: t('nav.groups.settings'), icon: Bell, kw: 'alerts push email sound notification prefs' },
  { label: 'Billing', path: '/settings/billing', group: t('nav.groups.settings'), icon: CreditCard, kw: 'subscription plan payment invoice billing' },
  { label: t('nav.items.whats_new'), path: '/settings/changelog', group: t('nav.groups.settings'), icon: Sparkles, kw: 'updates version release new features' },
])

function fuzzyMatch(term, target) {
  let ti = 0
  for (const ch of term) {
    const pos = target.indexOf(ch, ti)
    if (pos === -1) return false
    ti = pos + 1
  }
  return true
}

const q = ref('')
const searchOpen = ref(false)
const idx = ref(0)
const searchRef = ref(null)
const searchInput = ref(null)

function pageMatches(p, term) {
  return p.label.toLowerCase().includes(term) ||
    p.group.toLowerCase().includes(term) ||
    (p.kw || '').toLowerCase().includes(term)
}

const results = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term) return []
  const exact = PAGES.value.filter(p => pageMatches(p, term)).slice(0, 7)
  if (exact.length) return exact
  return PAGES.value.filter(p =>
    fuzzyMatch(term, p.label.toLowerCase()) || fuzzyMatch(term, (p.kw || '').toLowerCase())
  ).slice(0, 7)
})

const isFuzzyResult = computed(() => {
  const term = q.value.trim().toLowerCase()
  if (!term || !results.value.length) return false
  return !results.value.some(p => pageMatches(p, term))
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
  if (diff < 60)    return t('core.inbox.just_now')
  if (diff < 3600)  return t('core.inbox.min_ago', { n: Math.floor(diff / 60) })
  if (diff < 86400) return t('core.inbox.hr_ago', { n: Math.floor(diff / 3600) })
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

/* ── Logout confirm modal ──────────────────── */
const logoutModal  = ref(false)
const loFocus      = ref(0)   // 0 = Cancel, 1 = Logout
const loCancelBtn  = ref(null)
const loConfirmBtn = ref(null)

watch(logoutModal, (val) => {
  if (val) {
    loFocus.value = 0
    nextTick(() => loCancelBtn.value?.focus())
  }
})

function onLoModalKey(e) {
  if (!logoutModal.value) return
  if (e.key === 'Escape') { logoutModal.value = false; return }
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    loFocus.value = loFocus.value === 0 ? 1 : 0
    nextTick(() => (loFocus.value === 0 ? loCancelBtn.value : loConfirmBtn.value)?.focus())
    e.preventDefault()
  }
  if (e.key === 'Enter') {
    if (loFocus.value === 1) doLogout()
    else logoutModal.value = false
    e.preventDefault()
  }
}

async function doLogout() {
  logoutModal.value = false
  await auth.logout()
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
  window.addEventListener('keydown', onLoModalKey)
})
onUnmounted(() => {
  clearInterval(pollTimer)
  clearTimeout(storeSearchTimer)
  document.removeEventListener('click', onDocClick)
  window.removeEventListener('keydown', onSearchKey)
  window.removeEventListener('keydown', onLoModalKey)
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
.nhdr-fuzzy-hint { font-size: 11px; color: var(--text-muted); padding: 6px 12px 2px; font-style: italic; }

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

/* ── Role badge + logout icon ───────────────────────────────── */
.header-role-wrap {
  display: flex; align-items: center; gap: 4px; flex-shrink: 0;
}
.header-logout-icon {
  display: flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; border-radius: 7px; border: none;
  background: rgba(239,68,68,0.10); color: var(--danger);
  cursor: pointer; flex-shrink: 0;
  transition: background 120ms, transform 80ms;
}
.header-logout-icon:hover  { background: rgba(239,68,68,0.20); }
.header-logout-icon:active { transform: scale(0.91); }

/* ── Logout confirm modal ───────────────────────────────────── */
.lo-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0,0,0,0.42); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
}
.lo-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 20px; padding: 32px 28px 24px;
  width: 340px; max-width: 90vw; text-align: center;
  box-shadow: 0 24px 60px rgba(0,0,0,0.24);
}
.lo-icon-wrap {
  width: 52px; height: 52px; border-radius: 14px;
  background: rgba(239,68,68,0.10); color: var(--danger);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px;
}
.lo-title { font-size: 17px; font-weight: 800; color: var(--text-primary); margin-bottom: 8px; }
.lo-body  { font-size: 13px; color: var(--text-secondary); line-height: 1.55; margin-bottom: 24px; }
.lo-btns  { display: flex; gap: 10px; }
.lo-btn {
  flex: 1; padding: 10px 16px; border-radius: 10px; border: none;
  font-size: 13.5px; font-weight: 700; cursor: pointer; font-family: inherit;
  transition: background 120ms, transform 80ms;
}
.lo-btn:active { transform: scale(0.96); }
.lo-cancel  { background: var(--bg-app); color: var(--text-primary); border: 1.5px solid var(--border); }
.lo-cancel:hover  { background: var(--border); }
.lo-cancel.focused  { outline: 2px solid var(--accent); outline-offset: 2px; }
.lo-confirm {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  background: var(--danger); color: #fff;
}
.lo-confirm:hover { background: #dc2626; }
.lo-confirm.focused { outline: 2px solid var(--danger); outline-offset: 2px; }

.lo-fade-enter-active, .lo-fade-leave-active { transition: opacity 180ms, transform 180ms; }
.lo-fade-enter-from, .lo-fade-leave-to { opacity: 0; transform: scale(0.96); }
</style>
