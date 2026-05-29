<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Profit Margin</h1>
        <p class="page-sub">Margin per product / category — COGS from actual purchase costs</p>
      </div>
    </div>

    <ReportFilters @change="onFilters" />

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
      :title="`Profit Margin by ${tabLabel}`"
      :filename="`profit-margin-${tab}`"
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
]
const tab = ref('product')
const loading = ref(false)
const rows = ref([])
const totals = ref(null)
const filters = ref({})

const tabLabel = computed(() => tab.value === 'product' ? 'Product' : 'Category')
const meta = computed(() => `${filters.value.date_from || ''} → ${filters.value.date_to || ''}`)

const columns = [
  { key: 'name',       label: 'Name', type: 'text' },
  { key: 'qty',        label: 'Qty Sold', type: 'qty' },
  { key: 'revenue',    label: 'Revenue (ex-tax)', type: 'currency', accent: 'money' },
  { key: 'cogs',       label: 'COGS', type: 'currency' },
  { key: 'profit',     label: 'Profit', type: 'currency', accent: 'sign' },
  { key: 'margin_pct', label: 'Margin %', type: 'number' },
]

function setTab(id) { tab.value = id; fetchData() }
function onFilters(f) { filters.value = f; fetchData() }

async function fetchData() {
  if (!filters.value.date_from) return
  loading.value = true
  try {
    const res = await api.get('/api/reports/profit-margin/', {
      params: { group_by: tab.value, ...filters.value },
    })
    rows.value = res.data.rows || []
    totals.value = res.data.totals || null
  } catch { rows.value = []; totals.value = null } finally { loading.value = false }
}
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; }
.page-title { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub { font-size:13px; color:var(--text-muted); margin:2px 0 0; }
.tab-bar { display:flex; gap:4px; margin-bottom:18px; border-bottom:1px solid var(--border); }
.tab-btn { padding:9px 16px; border:none; background:transparent; color:var(--text-muted); font-size:13.5px; font-weight:600; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; transition:color 120ms, border-color 120ms; }
.tab-btn:hover { color:var(--text-primary); }
.tab-btn.active { color:var(--accent); border-bottom-color:var(--accent); }
</style>
