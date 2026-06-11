<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Sales Report</h1>
        <p class="page-sub">Sales broken down by product, category, supplier or period</p>
      </div>
    </div>

    <ReportFilters :show-granularity="tab === 'period'" @change="onFilters" />

    <div class="tab-bar">
      <button v-for="t in tabs" :key="t.id" class="tab-btn" :class="{ active: tab === t.id }" @click="setTab(t.id)">
        {{ t.label }}
      </button>
    </div>

    <ReportTable
      :columns="columns"
      :rows="rows"
      :totals="totals"
      :loading="loading"
      :title="`Sales by ${tabLabel}`"
      :filename="`sales-by-${tab}`"
      :meta="meta"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import api from '@/api/axios'
import ReportFilters from '@/components/ui/ReportFilters.vue'
import ReportTable from '@/components/ui/ReportTable.vue'

const tabs = [
  { id: 'product',  label: 'By Product' },
  { id: 'category', label: 'By Category' },
  { id: 'supplier', label: 'By Supplier' },
  { id: 'period',   label: 'By Period' },
]
const tab = ref('product')
const loading = ref(false)
const rows = ref([])
const totals = ref(null)
const filters = ref({})

const tabLabel = computed(() => tabs.find(t => t.id === tab.value).label.replace('By ', ''))
const meta = computed(() => `${filters.value.date_from || ''} → ${filters.value.date_to || ''}`)

const breakdownCols = [
  { key: 'name',  label: 'Name',  type: 'text' },
  { key: 'qty',   label: 'Qty Sold', type: 'qty' },
  { key: 'sales', label: 'Sales (ex-tax)', type: 'currency', accent: 'money' },
  { key: 'tax',   label: 'Tax', type: 'currency' },
  { key: 'cogs',  label: 'COGS', type: 'currency' },
  { key: 'gross', label: 'Gross (incl tax)', type: 'currency', accent: 'good' },
]
const periodCols = [
  { key: 'period',    label: 'Period', type: 'date' },
  { key: 'invoices',  label: 'Invoices', type: 'number' },
  { key: 'net_sales', label: 'Net Sales (ex-tax)', type: 'currency', accent: 'money' },
  { key: 'tax',       label: 'Tax', type: 'currency' },
  { key: 'discount',  label: 'Discount', type: 'currency' },
  { key: 'gross',     label: 'Gross', type: 'currency', accent: 'good' },
]
const columns = computed(() => tab.value === 'period' ? periodCols : breakdownCols)

function setTab(id) {
  tab.value = id
  fetchData()
}
function onFilters(f) {
  filters.value = f
  fetchData()
}

async function fetchData() {
  if (!filters.value.date_from) return
  loading.value = true
  try {
    const res = await api.get('/api/reports/sales/', {
      params: { breakdown: tab.value, ...filters.value },
    })
    rows.value = res.data.rows || []
    totals.value = res.data.totals || null
  } catch { rows.value = []; totals.value = null } finally { loading.value = false }
}
</script>

<style scoped>
.tab-bar { display:flex; gap:4px; margin-bottom:18px; border-bottom:1px solid var(--border); }
.tab-btn { padding:9px 16px; border:none; background:transparent; color:var(--text-muted); font-size:13.5px; font-weight:600; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; transition:color 120ms, border-color 120ms; }
.tab-btn:hover { color:var(--text-primary); }
.tab-btn.active { color:var(--accent); border-bottom-color:var(--accent); }
</style>
