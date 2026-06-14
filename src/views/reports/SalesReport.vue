<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('reports.sales.title') }}</h1>
        <p class="page-sub">{{ t('reports.sales.subtitle') }}</p>
      </div>
    </div>

    <ReportFilters :show-granularity="tab === 'period'" @change="onFilters" />

    <div class="tab-bar">
      <button v-for="tb in tabs" :key="tb.id" class="tab-btn" :class="{ active: tab === tb.id }" @click="setTab(tb.id)">
        {{ tb.label }}
      </button>
    </div>

    <ReportTable
      :columns="columns"
      :rows="rows"
      :totals="totals"
      :loading="loading"
      :title="t('reports.sales.table_title', { dim: tabLabel })"
      :filename="`sales-by-${tab}`"
      :meta="meta"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/api/axios'
import ReportFilters from '@/components/ui/ReportFilters.vue'
import ReportTable from '@/components/ui/ReportTable.vue'

const { t } = useI18n()

const tabs = computed(() => [
  { id: 'product',  label: t('reports.sales.tabs.product') },
  { id: 'category', label: t('reports.sales.tabs.category') },
  { id: 'supplier', label: t('reports.sales.tabs.supplier') },
  { id: 'period',   label: t('reports.sales.tabs.period') },
])
const tab = ref('product')
const loading = ref(false)
const rows = ref([])
const totals = ref(null)
const filters = ref({})

const tabLabel = computed(() => t('reports.sales.dims.' + tab.value))
const meta = computed(() => `${filters.value.date_from || ''} → ${filters.value.date_to || ''}`)

const breakdownCols = computed(() => [
  { key: 'name',  label: t('reports.sales.cols.name'),  type: 'text' },
  { key: 'qty',   label: t('reports.sales.cols.qty_sold'), type: 'qty' },
  { key: 'sales', label: t('reports.sales.cols.sales_ex_tax'), type: 'currency', accent: 'money' },
  { key: 'tax',   label: t('reports.sales.cols.tax'), type: 'currency' },
  { key: 'cogs',  label: t('reports.sales.cols.cogs'), type: 'currency' },
  { key: 'gross', label: t('reports.sales.cols.gross_incl'), type: 'currency', accent: 'good' },
])
const periodCols = computed(() => [
  { key: 'period',    label: t('reports.sales.cols.period'), type: 'date' },
  { key: 'invoices',  label: t('reports.sales.cols.invoices'), type: 'number' },
  { key: 'net_sales', label: t('reports.sales.cols.net_sales'), type: 'currency', accent: 'money' },
  { key: 'tax',       label: t('reports.sales.cols.tax'), type: 'currency' },
  { key: 'discount',  label: t('reports.sales.cols.discount'), type: 'currency' },
  { key: 'gross',     label: t('reports.sales.cols.gross'), type: 'currency', accent: 'good' },
])
const columns = computed(() => tab.value === 'period' ? periodCols.value : breakdownCols.value)

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
