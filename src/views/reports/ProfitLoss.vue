<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('reports.pnl.title') }}</h1>
        <p class="page-sub">{{ t('reports.pnl.subtitle') }}</p>
      </div>
    </div>

    <ReportFilters :show-granularity="true" @change="onFilters" />

    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">{{ t('reports.pnl.kpi.revenue_ex_tax') }}</div>
        <div class="kpi-value"><Money :value="sum.revenue ?? 0" /></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">{{ t('reports.pnl.kpi.cogs') }}</div>
        <div class="kpi-value"><Money :value="sum.cogs ?? 0" /></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">{{ t('reports.pnl.kpi.expenses') }}</div>
        <div class="kpi-value"><Money :value="sum.expenses ?? 0" /></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">{{ t('reports.pnl.kpi.returns') }}</div>
        <div class="kpi-value"><Money :value="sum.returns ?? 0" /></div>
      </div>
      <div class="kpi-card kpi-net" :class="netClass">
        <div class="kpi-label">{{ t('reports.pnl.kpi.net_profit') }}</div>
        <div class="kpi-value"><Money :value="sum.net ?? 0" /></div>
      </div>
    </div>

    <p v-if="sum.reconciles === false" class="recon-warn">
      {{ t('reports.pnl.recon_warn') }}
    </p>

    <ReportTable
      :columns="columns"
      :rows="rows"
      :totals="totals"
      :loading="loading"
      :title="t('reports.pnl.table_title')"
      filename="profit-and-loss"
      :meta="meta"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/api/axios'
import { formatCurrency } from '@/utils/format'
import ReportFilters from '@/components/ui/ReportFilters.vue'
import ReportTable from '@/components/ui/ReportTable.vue'

const { t } = useI18n()

const loading = ref(false)
const rows = ref([])
const totals = ref(null)
const sum = ref({})
const filters = ref({})

const meta = computed(() => `${filters.value.date_from || ''} → ${filters.value.date_to || ''}`)
const netClass = computed(() => Number(sum.value.net) < 0 ? 'net-neg' : 'net-pos')
function money(v) { return formatCurrency(v ?? 0) }

const columns = computed(() => [
  { key: 'period',       label: t('reports.pnl.cols.period'), type: 'date' },
  { key: 'revenue',      label: t('reports.pnl.cols.revenue'), type: 'currency', accent: 'money' },
  { key: 'cogs',         label: t('reports.pnl.cols.cogs'), type: 'currency' },
  { key: 'gross_profit', label: t('reports.pnl.cols.gross_profit'), type: 'currency' },
  { key: 'expenses',     label: t('reports.pnl.cols.expenses'), type: 'currency' },
  { key: 'returns',      label: t('reports.pnl.cols.returns'), type: 'currency' },
  { key: 'net',          label: t('reports.pnl.cols.net'), type: 'currency', accent: 'sign' },
])

function onFilters(f) { filters.value = f; fetchData() }

async function fetchData() {
  if (!filters.value.date_from) return
  loading.value = true
  try {
    const res = await api.get('/api/reports/pnl/', { params: filters.value })
    rows.value = res.data.rows || []
    totals.value = res.data.totals || null
    sum.value = res.data.totals || {}
  } catch { rows.value = []; totals.value = null; sum.value = {} } finally { loading.value = false }
}
</script>

<style scoped>
.kpi-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(190px,1fr)); gap:14px; margin-bottom:14px; }
.kpi-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:16px 18px; }
.kpi-label { font-size:11.5px; color:var(--text-muted); font-weight:600; text-transform:uppercase; letter-spacing:.04em; margin-bottom:6px; }
.kpi-value { font-size:20px; font-weight:700; color:var(--text-primary); font-variant-numeric:tabular-nums; }
.kpi-net.net-pos { border-color:var(--success); }
.kpi-net.net-pos .kpi-value { color:var(--success); }
.kpi-net.net-neg { border-color:var(--danger); }
.kpi-net.net-neg .kpi-value { color:var(--danger); }
.recon-warn { color:var(--danger); font-size:13px; font-weight:600; margin:0 0 14px; }
</style>
