<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Inbox</h1>
        <p class="page-sub">{{ unreadCount }} unread</p>
      </div>
      <div class="header-right">
        <button class="btn-ghost" :disabled="!unreadCount" @click="doMarkAll">
          <CheckCheck :size="14" /> Mark all read
        </button>
        <button class="btn-ghost" @click="load" :disabled="loading">
          <RefreshCw :size="14" :class="{ spin: loading }" /> Refresh
        </button>
      </div>
    </div>

    <!-- Priority filter tabs -->
    <div class="filter-tabs">
      <button v-for="tab in tabs" :key="tab.id"
        class="filter-tab"
        :class="{ active: activeTab === tab.id }"
        @click="setTab(tab.id)">
        <span class="tab-dot" :class="`dot-${tab.id}`"></span>
        {{ tab.label }}
        <span v-if="tab.count" class="tab-count">{{ tab.count }}</span>
      </button>
    </div>

    <div class="inbox-wrap">
      <div v-if="loading && !items.length" class="inbox-skeleton">
        <div v-for="i in 4" :key="i" class="skel-row" />
      </div>

      <div v-else-if="!filtered.length" class="inbox-empty">
        <InboxIcon :size="40" style="opacity:.3;margin-bottom:8px;" />
        <div>Nothing here.</div>
      </div>

      <button
        v-for="n in filtered"
        :key="n.id"
        class="inbox-item"
        :class="{ unread: n.is_unread }"
        @click="openItem(n)"
      >
        <span class="ii-priority-bar" :class="`bar-${n.priority.toLowerCase()}`"></span>
        <div class="ii-icon" :class="priorityClass(n.priority)">
          <component :is="iconFor(n)" :size="16" />
        </div>
        <div class="ii-body">
          <div class="ii-title">
            {{ n.title }}
            <span v-if="n.is_unread" class="ii-dot" />
            <span class="ii-priority-badge" :class="`badge-${n.priority.toLowerCase()}`">{{ n.priority }}</span>
          </div>
          <div v-if="n.body" class="ii-text">{{ n.body }}</div>
          <div class="ii-meta">
            <span>{{ timeAgo(n.created_at) }}</span>
            <span v-if="n.link" class="ii-link">Open →</span>
          </div>
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Inbox as InboxIcon, CheckCheck, RefreshCw,
  FileText, CheckCircle2, AlertTriangle, Info, Package, BellRing, ShieldAlert
} from 'lucide-vue-next'
import { useNotifications } from '@/composables/useNotifications'

const router = useRouter()
const { fetchAll, markRead, markAllRead } = useNotifications()

const items      = ref([])
const loading    = ref(false)
const activeTab  = ref('all')

const unreadCount = computed(() => items.value.filter(n => n.is_unread).length)

const tabs = computed(() => [
  { id: 'all',     label: 'All',         count: items.value.length },
  { id: 'info',    label: 'Information', count: items.value.filter(n => n.priority === 'INFO').length },
  { id: 'warning', label: 'Warnings',    count: items.value.filter(n => n.priority === 'WARNING').length },
  { id: 'alert',   label: 'Alerts',      count: items.value.filter(n => n.priority === 'ALERT').length },
  { id: 'admin',   label: 'Admin Notes', count: items.value.filter(n => n.priority === 'ADMIN').length },
])

const filtered = computed(() => {
  if (activeTab.value === 'all') return items.value
  return items.value.filter(n => n.priority === activeTab.value.toUpperCase())
})

function setTab(id) { activeTab.value = id }

async function load() {
  loading.value = true
  items.value = await fetchAll()
  loading.value = false
}

async function openItem(n) {
  await markRead(n.id)
  n.is_unread = false
  if (n.link) router.push(n.link)
}

async function doMarkAll() {
  await markAllRead()
  items.value.forEach(n => { n.is_unread = false })
}

function iconFor(n) {
  switch (n.type) {
    case 'BILLING_INVOICE':  return FileText
    case 'BILLING_PAID':     return CheckCircle2
    case 'SUBSCRIPTION':     return Info
    case 'LOW_STOCK':        return Package
    case 'SHIFT_DIFFERENCE': return AlertTriangle
    case 'INVOICE_VOIDED':   return ShieldAlert
    case 'ADMIN_NOTE':       return BellRing
    default:                 return Info
  }
}

function priorityClass(p) {
  return { INFO: 'icon-info', WARNING: 'icon-warning', ALERT: 'icon-alert', ADMIN: 'icon-admin' }[p] || 'icon-info'
}

function timeAgo(iso) {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

let pollTimer = null
onMounted(() => { load(); pollTimer = setInterval(load, 15000) })
onUnmounted(() => clearInterval(pollTimer))
</script>

<style scoped>
.page-header  { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:16px; flex-wrap:wrap; gap:12px; }
.page-title   { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub     { font-size:13px; color:var(--text-muted); margin:2px 0 0; }
.header-right { display:flex; align-items:center; gap:8px; }
.btn-ghost    { display:inline-flex; align-items:center; gap:5px; padding:7px 12px; border-radius:8px; font-size:12.5px; font-weight:500; border:1px solid var(--border); background:var(--bg-card); color:var(--text-secondary); cursor:pointer; transition:background 100ms,transform 70ms; }
.btn-ghost:hover   { background:var(--border); color:var(--text-primary); }
.btn-ghost:active  { transform:scale(0.96); }
.btn-ghost:disabled{ opacity:.5; cursor:not-allowed; }
.spin { animation:spin 800ms linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

/* Filter tabs */
.filter-tabs { display:flex; gap:6px; margin-bottom:16px; flex-wrap:wrap; }
.filter-tab  { display:inline-flex; align-items:center; gap:6px; padding:6px 12px; border-radius:20px; font-size:12.5px; font-weight:500; border:1px solid var(--border); background:var(--bg-card); color:var(--text-secondary); cursor:pointer; transition:all 120ms; }
.filter-tab:hover  { background:var(--bg-app); color:var(--text-primary); }
.filter-tab.active { background:var(--primary,var(--accent)); color:#fff; border-color:var(--primary,var(--accent)); }
.tab-dot { width:8px; height:8px; border-radius:50%; }
.dot-all     { background:#6b7280; }
.dot-info    { background:#16a34a; }
.dot-warning { background:#f59e0b; }
.dot-alert   { background:#ef4444; }
.dot-admin   { background:#1e293b; }
.tab-count { background:rgba(0,0,0,0.12); border-radius:10px; padding:1px 6px; font-size:11px; }
.filter-tab.active .tab-count { background:rgba(255,255,255,0.25); }

/* Inbox list */
.inbox-wrap     { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.inbox-empty    { padding:60px 20px; text-align:center; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; }
.inbox-skeleton { padding:10px; display:flex; flex-direction:column; gap:8px; }
.skel-row       { height:64px; border-radius:8px; background:linear-gradient(90deg,var(--border) 25%,var(--bg-app) 50%,var(--border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position:-200% 0; } }

.inbox-item     { display:flex; align-items:flex-start; gap:12px; width:100%; padding:12px 16px; border:none; background:none; cursor:pointer; text-align:left; border-bottom:1px solid var(--border); transition:background 120ms; position:relative; overflow:hidden; }
.inbox-item:last-child  { border-bottom:none; }
.inbox-item:hover       { background:var(--bg-app); }
.inbox-item.unread      { background:rgba(247,143,30,0.04); }
.inbox-item.unread:hover{ background:rgba(247,143,30,0.09); }

.ii-priority-bar { position:absolute; left:0; top:0; bottom:0; width:3px; }
.bar-info    { background:#16a34a; }
.bar-warning { background:#f59e0b; }
.bar-alert   { background:#ef4444; }
.bar-admin   { background:#1e293b; }

.ii-icon      { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.icon-info    { background:rgba(22,163,74,0.12);  color:#16a34a; }
.icon-warning { background:rgba(245,158,11,0.12); color:#f59e0b; }
.icon-alert   { background:rgba(239,68,68,0.12);  color:#ef4444; }
.icon-admin   { background:rgba(30,41,59,0.12);   color:#1e293b; }

.ii-body  { flex:1; min-width:0; padding-left:4px; }
.ii-title { font-size:13.5px; font-weight:600; color:var(--text-primary); display:flex; align-items:center; gap:6px; flex-wrap:wrap; }
.ii-dot   { width:8px; height:8px; border-radius:50%; background:var(--accent); flex-shrink:0; }

.ii-priority-badge { font-size:10px; font-weight:700; padding:1px 6px; border-radius:6px; text-transform:uppercase; letter-spacing:0.03em; }
.badge-info    { background:rgba(22,163,74,0.12);  color:#16a34a; }
.badge-warning { background:rgba(245,158,11,0.12); color:#b45309; }
.badge-alert   { background:rgba(239,68,68,0.12);  color:#dc2626; }
.badge-admin   { background:rgba(30,41,59,0.10);   color:#475569; }

.ii-text  { font-size:12.5px; color:var(--text-secondary); margin-top:2px; line-height:1.45; }
.ii-meta  { display:flex; align-items:center; gap:10px; font-size:11.5px; color:var(--text-muted); margin-top:6px; }
.ii-link  { color:var(--primary,var(--accent)); font-weight:600; }
</style>
