<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Profit &amp; Loss</h1>
        <p class="page-sub">Revenue − COGS − Expenses − Returns = Net</p>
      </div>
    </div>

    <ReportFilters :show-granularity="true" @change="onFilters" />

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Revenue (ex-tax)</div>
        <div class="kpi-value">{{ money(t.revenue) }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">COGS</div>
        <div class="kpi-value">{{ money(t.cogs) }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Expenses</div>
        <div class="kpi-value">{{ money(t.expenses) }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Returns</div>
        <div class="kpi-value">{{ money(t.returns) }}</div>
      </div>
      <div class="kpi-card kpi-net" :class="netClass">
        <div class="kpi-label">Net Profit</div>
        <div class="kpi-value">{{ money(t.net) }}</div>
      </div>
    </div>

    <p v-if="t.reconciles === false" class="recon-warn">
      ⚠ Reconciliation mismatch — figures do not tie out. This is a bug, report it.
    </p>

    <ReportTable
      :columns="columns"
      :rows="rows"
      :totals="totals"
      :loading="loading"
      title="Profit &amp; Loss Statement"
      filename="profit-and-loss"
      :meta="meta"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import api from '@/api/axios'
import { formatCurrency } from '@/utils/format'
import ReportFilters from '@/components/ui/ReportFilters.vue'
import ReportTable from '@/components/ui/ReportTable.vue'

const loading = ref(false)
const rows = ref([])
const totals = ref(null)
const t = ref({})
const filters = ref({})

const meta = computed(() => `${filters.value.date_from || ''} → ${filters.value.date_to || ''}`)
const netClass = computed(() => Number(t.value.net) < 0 ? 'net-neg' : 'net-pos')
function money(v) { return formatCurrency(v ?? 0) }

const columns = [
  { key: 'period',       label: 'Period', type: 'date' },
  { key: 'revenue',      label: 'Revenue', type: 'currency', accent: 'money' },
  { key: 'cogs',         label: 'COGS', type: 'currency' },
  { key: 'gross_profit', label: 'Gross Profit', type: 'currency' },
  { key: 'expenses',     label: 'Expenses', type: 'currency' },
  { key: 'returns',      label: 'Returns', type: 'currency' },
  { key: 'net',          label: 'Net', type: 'currency', accent: 'sign' },
]

function onFilters(f) { filters.value = f; fetchData() }

async function fetchData() {
  if (!filters.value.date_from) return
  loading.value = true
  try {
    const res = await api.get('/api/reports/pnl/', { params: filters.value })
    rows.value = res.data.rows || []
    totals.value = res.data.totals || null
    t.value = res.data.totals || {}
  } catch { rows.value = []; totals.value = null; t.value = {} } finally { loading.value = false }
}
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; }
.page-title { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub { font-size:13px; color:var(--text-muted); margin:2px 0 0; }
.kpi-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:14px; margin-bottom:14px; }
.kpi-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:16px 18px; }
.kpi-label { font-size:11.5px; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:.04em; margin-bottom:6px; }
.kpi-value { font-size:20px; font-weight:700; color:var(--text-primary); font-variant-numeric:tabular-nums; }
.kpi-net.net-pos { border-color:#16a34a; }
.kpi-net.net-pos .kpi-value { color:#16a34a; }
.kpi-net.net-neg { border-color:#dc2626; }
.kpi-net.net-neg .kpi-value { color:#dc2626; }
.recon-warn { color:#dc2626; font-size:13px; font-weight:600; margin:0 0 14px; }
</style>
