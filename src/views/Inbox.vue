<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Inbox</h1>
        <p class="page-sub">{{ unreadCount }} unread · {{ items.length }} total</p>
      </div>
      <div class="header-right">
        <button class="btn-ghost" :disabled="!unreadCount" @click="markAllRead">
          <CheckCheck :size="14" /> Mark all read
        </button>
        <button class="btn-ghost" @click="fetchAll" :disabled="loading">
          <RefreshCw :size="14" :class="{ spin: loading }" /> Refresh
        </button>
      </div>
    </div>

    <div class="inbox-wrap">
      <div v-if="loading && !items.length" class="inbox-skeleton">
        <div v-for="i in 4" :key="i" class="skel-row" />
      </div>

      <div v-else-if="!items.length" class="inbox-empty">
        <Inbox :size="40" style="opacity:.3;margin-bottom:8px;" />
        <div>Your inbox is empty.</div>
      </div>

      <button
        v-for="n in items"
        :key="n.id"
        class="inbox-item"
        :class="{ unread: n.is_unread }"
        @click="openItem(n)"
      >
        <div class="ii-icon" :class="typeClass(n.type)">
          <component :is="iconFor(n.type)" :size="16" />
        </div>
        <div class="ii-body">
          <div class="ii-title">
            {{ n.title }}
            <span v-if="n.is_unread" class="ii-dot" />
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
import { Inbox, CheckCheck, RefreshCw, FileText, CheckCircle2, AlertTriangle, Info, Package } from 'lucide-vue-next'
import api from '@/api/axios'

const router = useRouter()
const items = ref([])
const loading = ref(false)

const unreadCount = computed(() => items.value.filter(n => n.is_unread).length)

async function fetchAll() {
  loading.value = true
  try {
    const res = await api.get('/api/notifications/')
    items.value = Array.isArray(res.data) ? res.data : (res.data.results || [])
  } catch {
    items.value = []
  } finally {
    loading.value = false
  }
}

async function markRead(n) {
  if (!n.is_unread) return
  try {
    const res = await api.post(`/api/notifications/${n.id}/read/`)
    Object.assign(n, res.data)
  } catch {}
}

async function markAllRead() {
  try {
    await api.post('/api/notifications/read-all/')
    fetchAll()
  } catch {}
}

async function openItem(n) {
  await markRead(n)
  if (n.link) router.push(n.link)
}

function iconFor(type) {
  switch (type) {
    case 'BILLING_INVOICE': return FileText
    case 'BILLING_PAID':    return CheckCircle2
    case 'SUBSCRIPTION':    return Info
    case 'LOW_STOCK':       return Package
    case 'SHIFT_DIFFERENCE':return AlertTriangle
    case 'SYSTEM':          return Info
    default:                return Info
  }
}

function typeClass(type) {
  if (type === 'BILLING_INVOICE') return 'icon-billing'
  if (type === 'BILLING_PAID')    return 'icon-paid'
  if (type === 'LOW_STOCK')       return 'icon-warn'
  if (type === 'SHIFT_DIFFERENCE')return 'icon-warn'
  return 'icon-default'
}

function timeAgo(iso) {
  const t = new Date(iso).getTime()
  const diff = Math.max(0, Date.now() - t) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

let pollTimer = null
onMounted(() => {
  fetchAll()
  pollTimer = setInterval(fetchAll, 15000)
})
onUnmounted(() => clearInterval(pollTimer))
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
.page-title  { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub    { font-size:13px; color:var(--text-muted); margin:2px 0 0; }
.header-right{ display:flex; align-items:center; gap:8px; }
.btn-ghost   { display:inline-flex; align-items:center; gap:5px; padding:7px 12px; border-radius:8px; font-size:12.5px; font-weight:500; border:1px solid var(--border); background:var(--bg-card); color:var(--text-secondary); cursor:pointer; transition:background 100ms,color 100ms,transform 70ms; }
.btn-ghost:hover  { background:var(--border); color:var(--text-primary); }
.btn-ghost:active { transform:scale(0.96); }
.btn-ghost:disabled { opacity:.5; cursor:not-allowed; }
.spin { animation: spin 800ms linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.inbox-wrap     { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.inbox-empty    { padding:60px 20px; text-align:center; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; }
.inbox-skeleton { padding:10px; display:flex; flex-direction:column; gap:8px; }
.skel-row       { height:64px; border-radius:8px; background:linear-gradient(90deg,var(--border) 25%,var(--bg-app) 50%,var(--border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position:-200% 0; } }

.inbox-item    { display:flex; align-items:flex-start; gap:12px; width:100%; padding:14px 16px; border:none; background:none; cursor:pointer; text-align:left; border-bottom:1px solid var(--border); transition:background 120ms; }
.inbox-item:last-child { border-bottom:none; }
.inbox-item:hover      { background:var(--bg-app); }
.inbox-item.unread     { background:rgba(59,130,246,0.05); }
.inbox-item.unread:hover{ background:rgba(59,130,246,0.10); }

.ii-icon       { width:34px; height:34px; border-radius:9px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.icon-default  { background:rgba(107,114,128,0.15); color:#6b7280; }
.icon-billing  { background:rgba(59,130,246,0.15); color:#3b82f6; }
.icon-paid     { background:rgba(16,163,74,0.15); color:#16a34a; }
.icon-warn     { background:rgba(245,158,11,0.15); color:#f59e0b; }

.ii-body  { flex:1; min-width:0; }
.ii-title { font-size:13.5px; font-weight:600; color:var(--text-primary); display:flex; align-items:center; gap:6px; }
.ii-dot   { width:8px; height:8px; border-radius:50%; background:#3b82f6; flex-shrink:0; }
.ii-text  { font-size:12.5px; color:var(--text-secondary); margin-top:2px; line-height:1.45; }
.ii-meta  { display:flex; align-items:center; gap:10px; font-size:11.5px; color:var(--text-muted); margin-top:6px; }
.ii-link  { color:var(--primary, #3b82f6); font-weight:600; }
</style>
