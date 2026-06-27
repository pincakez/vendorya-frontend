<script setup>
/**
 * WeekRevenueChart — last 7 days of real store revenue (area chart).
 * Data comes from the dashboard endpoint (`weekly_revenue`); currency is the
 * store's own symbol + format (via the format store) — never a hardcoded $.
 */
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import Money from '@/components/ui/Money.vue'
import { formatNumber } from '@/utils/format'
import { useFormatStore } from '@/stores/format'

const { t } = useI18n()

const props = defineProps({
  // [{ date, label, total }] — 7 entries, oldest → newest
  data: { type: Array, default: () => [] },
})

const ACCENT = '#f78f1e'  // chart canvas can't read CSS vars — matches --accent

let fmt = null
try { fmt = useFormatStore() } catch { /* outside Pinia */ }

const rows      = computed(() => props.data || [])
const weekTotal = computed(() => rows.value.reduce((a, r) => a + (parseFloat(r.total) || 0), 0))
const rangeLabel = computed(() => {
  if (!rows.value.length) return ''
  const first = rows.value[0]?.date, last = rows.value[rows.value.length - 1]?.date
  const f = (d) => d ? new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''
  return `${f(first)} – ${f(last)}`
})

const series = computed(() => [{
  name: t('core.dash.revenue'),
  data: rows.value.map(r => parseFloat(r.total) || 0),
}])

function money(v) {
  const num = formatNumber(v, fmt?.asOpts)
  const sym = fmt?.symbol || ''
  if (!sym) return num
  return fmt.position === 'PREFIX' ? `${sym} ${num}` : `${num} ${sym}`
}

const chartOptions = computed(() => ({
  chart: {
    type: 'area',
    toolbar: { show: false },
    animations: { enabled: true, easing: 'easeinout', speed: 600 },
    background: 'transparent',
  },
  stroke: { curve: 'smooth', width: 2.5 },
  fill: {
    type: 'gradient',
    gradient: { shadeIntensity: 1, opacityFrom: 0.30, opacityTo: 0.02, stops: [0, 95] },
  },
  colors: [ACCENT],
  xaxis: {
    categories: rows.value.map(r => r.label),
    labels: { style: { fontSize: '9px', colors: Array(7).fill('#9ca3af') } },
    axisBorder: { show: false },
    axisTicks:  { show: false },
  },
  yaxis: { show: false },
  grid: {
    borderColor: 'rgba(150,150,150,0.10)',
    strokeDashArray: 4,
    padding: { left: -8, right: 2, top: -10, bottom: 0 },
  },
  tooltip: { theme: 'dark', y: { formatter: v => money(v) } },
  dataLabels: { enabled: false },
  markers: { size: 0 },
}))

const hasData = computed(() => weekTotal.value > 0)
</script>

<template>
  <div class="dw-head">
    <div class="dw-labels">
      <span class="dw-tag">{{ t('core.dash.weekly_revenue') }}</span>
      <span class="dw-week">{{ rangeLabel }}</span>
    </div>
    <span class="dw-total"><Money :value="weekTotal" /></span>
  </div>

  <div v-if="hasData" class="dw-chart">
    <apexchart type="area" height="118" :options="chartOptions" :series="series" />
  </div>
  <div v-else class="dw-empty">{{ t('core.dash.no_sales_7d') }}</div>
</template>

<style scoped>
.dw-head   { display: flex; align-items: flex-start; justify-content: space-between; flex-shrink: 0; margin-bottom: 4px; }
.dw-labels { display: flex; flex-direction: column; gap: 2px; }
.dw-tag    { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: var(--text-muted); }
.dw-week   { font-size: 11px; color: var(--text-muted); font-weight: 500; }
.dw-total  { font-size: 22px; font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; color: var(--text-primary); }
.dw-chart  { flex: 1; min-height: 0; margin: 0 -14px -14px; }
.dw-empty  { flex: 1; display: flex; align-items: center; justify-content: center; font-size: 13px; color: var(--text-muted); }
</style>
