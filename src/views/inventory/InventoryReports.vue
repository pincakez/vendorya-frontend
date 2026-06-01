<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Inventory Reports</h1>
        <p class="page-sub">Stock valuation and product summaries</p>
      </div>
      <button class="btn-refresh" @click="load" :class="{ spinning: loading }">
        <RefreshCw :size="15" />
      </button>
    </div>

    <!-- KPI cards -->
    <div v-if="loading" class="kpi-grid">
      <div v-for="i in 4" :key="i" class="kpi-card skeleton-card" />
    </div>
    <div v-else class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon" style="background:var(--accent-soft);color:var(--accent);"><Package :size="20" /></div>
        <div class="kpi-body">
          <div class="kpi-label">Total Products</div>
          <div class="kpi-value">{{ summary.totalProducts }}</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background:#f3e8ff;color:#7c3aed;"><Layers :size="20" /></div>
        <div class="kpi-body">
          <div class="kpi-label">Total Variants</div>
          <div class="kpi-value">{{ summary.totalVariants }}</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background:#dcfce7;color:#16a34a;"><BarChart2 :size="20" /></div>
        <div class="kpi-body">
          <div class="kpi-label">Total Stock Units</div>
          <div class="kpi-value">{{ formatQty(summary.totalUnits) }}</div>
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-icon" style="background:#fef3c7;color:#d97706;"><DollarSign :size="20" /></div>
        <div class="kpi-body">
          <div class="kpi-label">Stock Value (Cost)</div>
          <div class="kpi-value"><Money :value="summary.totalValue" /></div>
        </div>
      </div>
    </div>

    <!-- Stock Valuation Table -->
    <div v-if="!loading" style="margin-top:24px;">
      <div class="section-header">
        <span class="section-title">Stock Valuation by Product</span>
        <input v-model="search" class="search-input" placeholder="Search product…" />
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Branch</th>
              <th>Qty</th>
              <th>Cost Price</th>
              <th>Stock Value</th>
              <th>Sell Price</th>
              <th>Potential Revenue</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredRows.length === 0">
              <td colspan="8" class="table-empty">No stock data found</td>
            </tr>
            <tr v-for="(row, i) in filteredRows" :key="i" class="table-row">
              <td class="col-name">{{ row.productName }}</td>
              <td class="col-ref">{{ row.sku }}</td>
              <td class="col-muted">{{ row.branch }}</td>
              <td :class="Number(row.qty) === 0 ? 'col-zero' : ''">{{ formatQty(row.qty) }}</td>
              <td class="col-muted"><Money :value="row.costPrice" /></td>
              <td class="col-value"><Money :value="row.stockValue" /></td>
              <td class="col-muted"><Money :value="row.sellPrice" /></td>
              <td class="col-revenue"><Money :value="row.potentialRevenue" /></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Package, Layers, BarChart2, DollarSign, RefreshCw } from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import { formatNumber, formatQty } from '@/utils/format'

const auth    = useAuthStore()
const loading = ref(false)
const search  = ref('')
const rows    = ref([])

const summary = ref({ totalProducts: 0, totalVariants: 0, totalUnits: 0, totalValue: 0 })

async function load() {
  loading.value = true
  rows.value = []
  try {
    let page = 1
    const allVariants = []
    while (true) {
      const res = await api.get('/api/inventory/variants/', { params: { page, page_size: 100 } })
      const data = res.data.results ?? res.data
      allVariants.push(...data)
      if (!res.data.next) break
      page++
    }

    const productSet = new Set()
    let totalUnits = 0
    let totalValue = 0
    const newRows = []

    for (const v of allVariants) {
      productSet.add(v.product)
      for (const sl of v.stock_levels || []) {
        const qty   = Number(sl.quantity)
        const cost  = Number(v.cost_price)
        const sell  = Number(v.sell_price)
        totalUnits += qty
        totalValue += qty * cost
        newRows.push({
          productName: v.product_name || '—',
          sku: v.sku,
          branch: sl.branch_name,
          qty,
          costPrice: cost,
          stockValue: qty * cost,
          sellPrice: sell,
          potentialRevenue: qty * sell,
        })
      }
    }

    rows.value = newRows.sort((a, b) => b.stockValue - a.stockValue)
    summary.value = {
      totalProducts: productSet.size,
      totalVariants: allVariants.length,
      totalUnits,
      totalValue,
    }
  } finally { loading.value = false }
}

const filteredRows = computed(() => {
  if (!search.value.trim()) return rows.value
  const q = search.value.toLowerCase()
  return rows.value.filter(r => r.productName.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q))
})

onMounted(load)
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; }
.page-title  { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub    { font-size:13px; color:var(--text-muted); margin:2px 0 0; }

.btn-refresh { width:34px; height:34px; border-radius:8px; border:1px solid var(--border); background:var(--bg-card); color:var(--text-muted); display:flex; align-items:center; justify-content:center; cursor:pointer; transition:color 120ms,background 120ms; }
.btn-refresh:hover { color:var(--text-primary); background:var(--bg-app); }
.btn-refresh.spinning svg { animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }

.kpi-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(210px,1fr)); gap:14px; margin-bottom:8px; }
.kpi-card { display:flex; align-items:center; gap:14px; background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:16px 18px; }
.kpi-icon  { width:42px; height:42px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.kpi-body  { flex:1; }
.kpi-label { font-size:11.5px; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:.04em; margin-bottom:3px; }
.kpi-value { font-size:20px; font-weight:700; color:var(--text-primary); font-variant-numeric:tabular-nums; }
.skeleton-card { height:78px; background:var(--border); border-radius:12px; animation:shimmer 1.4s ease-in-out infinite; }
@keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:.5} }

.section-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.section-title  { font-size:14px; font-weight:700; color:var(--text-primary); }
.search-input   { padding:7px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-card); color:var(--text-primary); font-size:13px; outline:none; width:220px; transition:border-color 120ms; }
.search-input:focus { border-color:var(--accent); }

.table-wrap { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.data-table { width:100%; border-collapse:collapse; font-size:13px; }
.data-table thead th { padding:10px 14px; text-align:left; font-size:11.5px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); background:var(--bg-app); border-bottom:1px solid var(--border); }
.data-table tbody tr.table-row { border-bottom:1px solid var(--border); transition:background 100ms; }
.data-table tbody tr.table-row:last-child { border-bottom:none; }
.data-table tbody tr.table-row:hover { background:var(--bg-app); }
.data-table tbody td { padding:10px 14px; color:var(--text-primary); }
.table-empty { text-align:center; padding:40px; color:var(--text-muted); }

.col-name    { font-weight:500; }
.col-ref     { font-family:monospace; font-size:12px; color:var(--text-muted); }
.col-muted   { color:var(--text-muted); }
.col-zero    { color:#dc2626; font-weight:600; }
.col-value   { font-variant-numeric:tabular-nums; font-weight:600; color:var(--text-primary); }
.col-revenue { font-variant-numeric:tabular-nums; color:#16a34a; font-weight:600; }
</style>
