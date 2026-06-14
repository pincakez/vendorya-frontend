<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Activity Log — All Stores</h1>
        <p class="page-sub">Platform-wide audit trail {{ lastFetched ? '· updated ' + relativeFetched : '' }}</p>
      </div>
      <div class="header-right">
        <select v-model="filters.store" class="filter-select" @change="reload">
          <option value="">All stores</option>
          <option v-for="s in meta.stores" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <select v-model="filters.operation_type" class="filter-select" @change="reload">
          <option value="">All operations</option>
          <option v-for="op in meta.operation_types" :key="op.value" :value="op.value">{{ op.label }}</option>
        </select>
        <button class="refresh-btn" :class="{ loading }" @click="reload" title="Refresh now">
          <RefreshCw :size="14" />
        </button>
        <button class="purge-btn" @click="openPurge" title="Delete old audit logs">
          <Trash2 :size="14" /> Purge old
        </button>
      </div>
    </div>

    <AppModal :open="purge.open" title="Purge old audit logs" width="460px" @close="purge.open = false">
      <p class="purge-intro">Permanently delete audit-log entries older than the retention window. This frees up space and cannot be undone.</p>
      <div class="form-group">
        <label class="form-label">Keep logs from the last</label>
        <div style="display:flex;gap:8px;align-items:center;">
          <input v-model.number="purge.years" type="number" min="1" max="20" class="form-input" style="width:90px;" />
          <span>year(s)</span>
          <button class="btn-ghost" :disabled="purge.checking" @click="previewPurge">Preview</button>
        </div>
      </div>
      <p v-if="purge.count !== null" class="purge-preview">
        <strong>{{ purge.count }}</strong> log(s) older than {{ purge.window }} (before {{ purge.cutoff }}) will be deleted.
      </p>
      <template #footer>
        <button class="btn-ghost" @click="purge.open = false">Cancel</button>
        <button class="btn-danger" :disabled="purge.deleting || purge.count === null || purge.count === 0" @click="doPurge">
          {{ purge.deleting ? 'Deleting…' : 'Delete permanently' }}
        </button>
      </template>
    </AppModal>

    <div class="dt-card">
      <div v-if="loading && !logs.length" class="table-skeleton">
        <div v-for="i in 6" :key="i" class="skeleton-row" />
      </div>
      <div v-else class="dt-xscroll">
        <table class="dt">
        <thead>
          <tr>
            <th class="dt-th" style="width:140px;">When</th>
            <th class="dt-th" style="width:150px;">Store</th>
            <th class="dt-th" style="width:140px;">User</th>
            <th class="dt-th" style="width:120px;">Type</th>
            <th class="dt-th">Action</th>
            <th class="dt-th" style="width:120px;">IP</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!logs.length">
            <td colspan="6" class="dt-empty">
              <Activity :size="32" style="opacity:.3;margin-bottom:8px;" />
              <div>No activity recorded yet</div>
            </td>
          </tr>
          <tr v-for="log in logs" :key="log.id" class="dt-row">
            <td class="ts" :title="absoluteTime(log.timestamp)">{{ relative(log.timestamp) }}</td>
            <td><span class="store-cell">{{ log.store_name }}</span></td>
            <td>
              <div class="user-cell">
                <div class="user-dot" :style="{ background: userColor(log.username || '?') }"></div>
                {{ log.full_name || log.username || 'system' }}
              </div>
            </td>
            <td><span class="op-pill" :class="'op-' + log.operation_type.toLowerCase()">{{ opLabel(log.operation_type) }}</span></td>
            <td>
              <div>{{ log.action }}</div>
              <div v-if="hasMeaningfulDetails(log.details)" class="details-line">{{ shortDetails(log.details) }}</div>
            </td>
            <td class="ip">{{ log.ip_address || '—' }}</td>
          </tr>
        </tbody>
      </table>
      </div><!-- dt-xscroll -->
    </div><!-- /dt-card -->

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { Activity, RefreshCw, Trash2 } from 'lucide-vue-next'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'

const logs = ref([])
const meta = reactive({ stores: [], operation_types: [] })
const filters = reactive({ store: '', operation_type: '' })
const loading = ref(false)

const purge = reactive({ open: false, years: 2, count: null, window: '', cutoff: '', checking: false, deleting: false })
function openPurge() { Object.assign(purge, { open: true, years: 2, count: null, window: '', cutoff: '' }) }
async function previewPurge() {
  purge.checking = true; purge.count = null
  try {
    const res = await api.get('/api/admin/activity-logs/purge/', { params: { years: purge.years } })
    purge.count = res.data.count; purge.window = res.data.window; purge.cutoff = res.data.cutoff
  } catch (e) { alert(e.response?.data?.detail || 'Preview failed.') } finally { purge.checking = false }
}
async function doPurge() {
  purge.deleting = true
  try {
    const res = await api.post('/api/admin/activity-logs/purge/', { years: purge.years })
    alert(`Purged ${res.data.deleted} log(s) older than ${res.data.window}.`)
    purge.open = false
    reload()
  } catch (e) { alert(e.response?.data?.detail || 'Purge failed.') } finally { purge.deleting = false }
}
const lastFetched = ref(null)
const now = ref(Date.now())

let pollTimer = null
let tickTimer = null

const relativeFetched = computed(() => relative(lastFetched.value))

async function loadMeta() {
  try {
    const res = await api.get('/api/admin/activity-logs/meta/')
    meta.stores = res.data.stores || []
    meta.operation_types = res.data.operation_types || []
  } catch { /* keep empty */ }
}

async function reload() {
  loading.value = true
  try {
    const res = await api.get('/api/admin/activity-logs/', {
      params: {
        page_size: 100,
        store: filters.store || undefined,
        operation_type: filters.operation_type || undefined,
      },
    })
    logs.value = res.data.results ?? res.data
    lastFetched.value = Date.now()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function poll() {
  if (!logs.value.length) return reload()
  try {
    const since = logs.value[0].timestamp
    const res = await api.get('/api/admin/activity-logs/', {
      params: {
        page_size: 100,
        since,
        store: filters.store || undefined,
        operation_type: filters.operation_type || undefined,
      },
    })
    const fresh = res.data.results ?? res.data
    if (fresh.length) logs.value = [...fresh, ...logs.value].slice(0, 200)
    lastFetched.value = Date.now()
  } catch (e) {
    console.error(e)
  }
}

function relative(ts) {
  if (!ts) return ''
  const diff = Math.floor((now.value - new Date(ts).getTime()) / 1000)
  if (diff < 5)   return 'just now'
  if (diff < 60)  return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function absoluteTime(ts) {
  return new Date(ts).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'medium' })
}

function opLabel(value) {
  const found = meta.operation_types.find(o => o.value === value)
  return found ? found.label : value
}

function hasMeaningfulDetails(d) {
  return d && typeof d === 'object' && Object.keys(d).length > 0
}

function shortDetails(d) {
  const items = []
  if (d.invoice_number) items.push(`#${d.invoice_number}`)
  if (d.grand_total)    items.push(`total ${d.grand_total}`)
  if (d.amount)         items.push(`amount ${d.amount}`)
  if (d.change)         items.push(`Δ ${d.change}`)
  if (d.customer)       items.push(d.customer)
  if (d.supplier)       items.push(d.supplier)
  if (d.role)           items.push(d.role)
  return items.join(' · ')
}

const COLORS = ['#3b82f6','#a855f7','#16a34a','#d97706','#dc2626','#0891b2','#ec4899']
function userColor(key) {
  let hash = 0
  for (const ch of key) hash = ch.charCodeAt(0) + (hash << 5) - hash
  return COLORS[Math.abs(hash) % COLORS.length]
}

onMounted(() => {
  loadMeta()
  reload()
  pollTimer = setInterval(poll, 10000)
  tickTimer = setInterval(() => { now.value = Date.now() }, 30000)
})
onUnmounted(() => {
  clearInterval(pollTimer)
  clearInterval(tickTimer)
})
</script>

<style scoped>
.header-right { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }

.filter-select { padding:7px 12px; border:1px solid var(--border); border-radius:8px; background:var(--bg-card); color:var(--text-primary); font-size:13px; outline:none; min-width:160px; }
.refresh-btn   { width:34px; height:34px; border-radius:8px; border:1px solid var(--border); background:var(--bg-card); color:var(--text-secondary); cursor:pointer; display:inline-flex; align-items:center; justify-content:center; transition:background 100ms,color 100ms,transform 80ms; }
.refresh-btn:hover  { background:var(--admin-accent-soft); color:var(--admin-accent); }
.refresh-btn:active { transform:scale(0.92); }
.refresh-btn.loading svg { animation:spin 0.8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

.purge-btn { display:inline-flex; align-items:center; gap:5px; height:34px; padding:0 12px; border-radius:8px; border:1px solid var(--border); background:var(--bg-card); color:var(--text-secondary); font-size:13px; font-weight:500; cursor:pointer; transition:background 100ms,color 100ms; }
.purge-btn:hover { background:var(--danger-soft); color:var(--danger); border-color:#fca5a5; }

.purge-intro { font-size:13px; color:var(--text-secondary); margin:0 0 14px; line-height:1.5; }
.form-group { margin-bottom:12px; }
.form-label { display:block; font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:6px; }
.form-input { padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-card); color:var(--text-primary); font-size:13px; outline:none; }
.purge-preview { font-size:13px; color:var(--text-primary); background:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:10px 12px; margin:10px 0 0; }


.ts { color:var(--text-muted); font-size:12px; white-space:nowrap; }
.ip { color:var(--text-muted); font-size:11.5px; font-variant-numeric:tabular-nums; }

.store-cell { font-weight:600; color:var(--admin-accent); font-size:12.5px; }
.user-cell  { display:flex; align-items:center; gap:8px; font-weight:500; }
.user-dot   { width:8px; height:8px; border-radius:50%; flex-shrink:0; }

.op-pill { display:inline-block; padding:2px 9px; border-radius:20px; font-size:10.5px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; }
.op-sale       { background:rgba(34,197,94,0.15);  color:var(--success); }
.op-return     { background:rgba(239,68,68,0.15);  color:var(--danger); }
.op-discount   { background:rgba(168,85,247,0.15); color:#a855f7; }
.op-purchase   { background:rgba(59,130,246,0.15); color:var(--info); }
.op-adjustment { background:rgba(245,158,11,0.15); color:var(--warning); }
.op-expense    { background:rgba(236,72,153,0.15); color:#ec4899; }
.op-shift      { background:rgba(14,165,233,0.15); color:#0891b2; }
.op-staff      { background:rgba(99,102,241,0.15); color:#6366f1; }
.op-other      { background:#f3f4f6;               color:#6b7280; }

.details-line { font-size:11.5px; color:var(--text-muted); margin-top:2px; }
.table-empty  { text-align:center; padding:48px 20px; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; }
.table-skeleton { padding:8px 0; }
.skeleton-row { height:40px; margin:4px 16px; border-radius:6px; background:linear-gradient(90deg,var(--border) 25%,var(--bg-app) 50%,var(--border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position:-200% 0; } }
</style>
