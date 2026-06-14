<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('reports.profit_margin.title') }}</h1>
        <p class="page-sub">{{ t('reports.profit_margin.subtitle') }}</p>
      </div>
    </div>

    <ReportFilters @change="onFilters" />

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
      :title="t('reports.profit_margin.table_title', { dim: tabLabel })"
      :filename="`profit-margin-${tab}`"
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
  { id: 'product',  label: t('reports.profit_margin.tabs.product') },
  { id: 'category', label: t('reports.profit_margin.tabs.category') },
])
const tab = ref('product')
const loading = ref(false)
const rows = ref([])
const totals = ref(null)
const filters = ref({})

const tabLabel = computed(() => t('reports.profit_margin.dims.' + tab.value))
const meta = computed(() => `${filters.value.date_from || ''} → ${filters.value.date_to || ''}`)

const columns = computed(() => [
  { key: 'name',       label: t('reports.profit_margin.cols.name'), type: 'text' },
  { key: 'qty',        label: t('reports.profit_margin.cols.qty_sold'), type: 'qty' },
  { key: 'revenue',    label: t('reports.profit_margin.cols.revenue_ex_tax'), type: 'currency', accent: 'money' },
  { key: 'cogs',       label: t('reports.profit_margin.cols.cogs'), type: 'currency' },
  { key: 'profit',     label: t('reports.profit_margin.cols.profit'), type: 'currency', accent: 'sign' },
  { key: 'margin_pct', label: t('reports.profit_margin.cols.margin_pct'), type: 'number' },
])

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
.tab-bar { display:flex; gap:4px; margin-bottom:18px; border-bottom:1px solid var(--border); }
.tab-btn { padding:9px 16px; border:none; background:transparent; color:var(--text-muted); font-size:13.5px; font-weight:600; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; transition:color 120ms, border-color 120ms; }
.tab-btn:hover { color:var(--text-primary); }
.tab-btn.active { color:var(--accent); border-bottom-color:var(--accent); }
</style>
