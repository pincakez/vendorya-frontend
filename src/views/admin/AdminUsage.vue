<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Tenant Usage</h1>
        <p class="page-sub">Live snapshot of usage metrics across all stores</p>
      </div>
      <div class="header-right">
        <div class="search-wrap">
          <Search :size="14" class="search-icon" />
          <input v-model="search" class="search-input" placeholder="Search store…" />
        </div>
        <button class="btn-admin" :disabled="loadingAll" @click="loadAll">
          <RefreshCw :size="14" :class="loadingAll ? 'spin' : ''" />
          {{ loadingAll ? 'Loading…' : 'Refresh All' }}
        </button>
      </div>
    </div>

    <!-- Store cards grid -->
    <div v-if="loadingAll && !cards.length" class="cards-grid">
      <div v-for="i in 4" :key="i" class="usage-card loading-card">
        <div class="skeleton-line" style="width:60%;height:16px;margin-bottom:8px;" />
        <div class="skeleton-line" style="width:40%;height:12px;" />
      </div>
    </div>

    <div v-else-if="!filtered.length" class="empty-state">
      <BarChart2 :size="36" style="opacity:.3;margin-bottom:10px;" />
      <p>No stores found</p>
    </div>

    <div v-else class="cards-grid">
      <div v-for="card in filtered" :key="card.store.id" class="usage-card">
        <!-- Header -->
        <div class="card-header">
          <div>
            <p class="card-store-name">{{ card.store.name }}</p>
            <span class="card-code">{{ card.store.store_code }}</span>
            <span class="store-status" :class="card.store.is_active ? 'active' : 'inactive'">
              {{ card.store.is_active ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <div class="card-actions">
            <button class="icon-btn" title="Refresh" :disabled="card.loading" @click="loadCard(card)">
              <RefreshCw :size="13" :class="card.loading ? 'spin' : ''" />
            </button>
            <button class="icon-btn export-btn" title="Export store data" :disabled="card.exporting" @click="exportStore(card)">
              <Download :size="13" />
            </button>
          </div>
        </div>

        <!-- Stats -->
        <div v-if="card.loading && !card.data" class="card-loading">Loading…</div>
        <div v-else-if="card.error" class="card-error">{{ card.error }}</div>
        <div v-else-if="card.data" class="stats-grid">
          <div class="stat">
            <p class="stat-value">{{ card.data.staff_count }}</p>
            <p class="stat-label">Staff</p>
          </div>
          <div class="stat">
            <p class="stat-value">{{ card.data.branches_count }}</p>
            <p class="stat-label">Branches</p>
          </div>
          <div class="stat">
            <p class="stat-value">{{ card.data.dau }}</p>
            <p class="stat-label">DAU</p>
          </div>
          <div class="stat">
            <p class="stat-value">{{ card.data.mau }}</p>
            <p class="stat-label">MAU (30d)</p>
          </div>
          <div class="stat">
            <p class="stat-value">{{ card.data.products_count }}</p>
            <p class="stat-label">Products</p>
          </div>
          <div class="stat">
            <p class="stat-value">{{ card.data.variants_count }}</p>
            <p class="stat-label">Variants</p>
          </div>
          <div class="stat">
            <p class="stat-value">{{ card.data.invoices_month }}</p>
            <p class="stat-label">Invoices (mo.)</p>
          </div>
          <div class="stat">
            <p class="stat-value">{{ card.data.invoices_total }}</p>
            <p class="stat-label">Invoices (all)</p>
          </div>
          <div class="stat wide">
            <p class="stat-value accent">{{ fmtRevenue(card.data.revenue_month) }}</p>
            <p class="stat-label">Revenue this month</p>
          </div>
        </div>
        <div v-else class="card-loading">
          <button class="load-btn" @click="loadCard(card)">Load metrics</button>
        </div>

        <p v-if="card.data" class="as-of">as of {{ fmtTime(card.data.as_of) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { Search, RefreshCw, Download, BarChart2 } from 'lucide-vue-next'
import api from '@/api/axios'

const search = ref('')
const stores = ref([])
const loadingAll = ref(false)

const cards = ref([])

const filtered = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return cards.value
  return cards.value.filter(c =>
    c.store.name.toLowerCase().includes(q) ||
    (c.store.store_code || '').toLowerCase().includes(q)
  )
})

async function fetchStores() {
  loadingAll.value = true
  try {
    const { data } = await api.get('/api/admin/stores/', { params: { page_size: 200 } })
    stores.value = data.results ?? data
    cards.value = stores.value.map(s => reactive({
      store: s,
      data: null,
      loading: false,
      exporting: false,
      error: null,
    }))
  } catch {
    stores.value = []
  } finally {
    loadingAll.value = false
  }
}

async function loadCard(card) {
  card.loading = true
  card.error = null
  try {
    const { data } = await api.get(`/api/admin/stores/${card.store.id}/usage/`)
    card.data = data
  } catch (e) {
    card.error = e.response?.data?.detail || 'Failed to load'
  } finally {
    card.loading = false
  }
}

async function loadAll() {
  await fetchStores()
  for (const card of cards.value) {
    loadCard(card)
  }
}

async function exportStore(card) {
  card.exporting = true
  try {
    const resp = await api.get(`/api/admin/stores/${card.store.id}/export/`, { responseType: 'blob' })
    const url = URL.createObjectURL(resp.data)
    const a = document.createElement('a')
    const cd = resp.headers['content-disposition'] || ''
    const match = cd.match(/filename="(.+)"/)
    a.href = url
    a.download = match ? match[1] : `vendorya_export_${card.store.store_code}.json`
    a.click()
    URL.revokeObjectURL(url)
  } catch {
    alert('Export failed. Try again.')
  } finally {
    card.exporting = false
  }
}

function fmtRevenue(val) {
  if (!val) return '—'
  const n = parseFloat(val)
  if (isNaN(n)) return '—'
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

function fmtTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  await fetchStores()
  for (const card of cards.value) {
    loadCard(card)
  }
})
</script>

<style scoped>
.page-header { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:24px; }
.page-title  { font-size:22px; font-weight:700; margin:0 0 2px; }
.page-sub    { font-size:13px; color:var(--text-secondary); margin:0; }
.header-right { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.search-wrap  { position:relative; }
.search-icon  { position:absolute; left:9px; top:50%; transform:translateY(-50%); color:var(--text-muted); }
.search-input { padding:7px 10px 7px 30px; border:1px solid var(--border); border-radius:8px; font-size:13px; background:var(--surface); color:var(--text-primary); width:200px; }
.btn-admin { display:inline-flex; align-items:center; gap:6px; padding:8px 14px; border-radius:8px; background:var(--admin-accent,#ef4444); color:#fff; font-size:13px; font-weight:600; border:none; cursor:pointer; transition:background 100ms,transform 70ms; }
.btn-admin:hover { background:var(--danger); }
.btn-admin:disabled { opacity:.55; cursor:not-allowed; }

.cards-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(340px, 1fr)); gap:18px; }

.usage-card {
  background:var(--surface);
  border:1px solid var(--border);
  border-radius:14px;
  padding:18px 20px 14px;
  display:flex;
  flex-direction:column;
  gap:14px;
}
.loading-card { min-height:160px; }

.card-header { display:flex; align-items:flex-start; justify-content:space-between; gap:10px; }
.card-store-name { font-size:15px; font-weight:700; margin:0 0 4px; }
.card-code { font-size:11px; font-weight:600; color:var(--text-muted); background:var(--bg-subtle,rgba(0,0,0,.04)); padding:2px 7px; border-radius:5px; margin-right:6px; }
.store-status { font-size:11px; font-weight:600; padding:2px 7px; border-radius:5px; }
.store-status.active   { color:var(--success); background:rgba(22,163,74,.1); }
.store-status.inactive { color:#9ca3af; background:rgba(156,163,175,.1); }
.card-actions { display:flex; gap:6px; }
.icon-btn { display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:7px; border:1px solid var(--border); background:var(--surface); cursor:pointer; color:var(--text-secondary); transition:background 100ms; }
.icon-btn:hover { background:var(--bg-hover,rgba(0,0,0,.06)); }
.icon-btn:disabled { opacity:.45; cursor:not-allowed; }
.export-btn { color:var(--admin-accent,#ef4444); border-color:rgba(239,68,68,.3); }

.stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px 8px; }
.stat { text-align:center; }
.stat-value { font-size:18px; font-weight:700; margin:0 0 2px; line-height:1; }
.stat-value.accent { color:var(--admin-accent,#ef4444); }
.stat-label { font-size:10.5px; color:var(--text-muted); margin:0; text-transform:uppercase; letter-spacing:.04em; }
.wide { grid-column:span 4; text-align:left; border-top:1px solid var(--border); padding-top:10px; }
.wide .stat-value { font-size:20px; }

.card-loading { display:flex; align-items:center; justify-content:center; min-height:60px; color:var(--text-muted); font-size:13px; }
.card-error   { color:#ef4444; font-size:12.5px; text-align:center; padding:12px 0; }
.load-btn { background:transparent; border:1px dashed var(--border); color:var(--text-secondary); padding:6px 14px; border-radius:8px; cursor:pointer; font-size:13px; }
.load-btn:hover { background:var(--bg-hover,rgba(0,0,0,.05)); }

.as-of { font-size:10.5px; color:var(--text-muted); margin:0; text-align:right; }

.empty-state { text-align:center; padding:60px 0; color:var(--text-muted); }
.skeleton-line { background:var(--border); border-radius:4px; animation:pulse 1.4s ease-in-out infinite; }
.spin { animation:spin360 .8s linear infinite; }
@keyframes pulse   { 0%,100%{opacity:.4} 50%{opacity:.9} }
@keyframes spin360 { to{transform:rotate(360deg)} }
</style>
