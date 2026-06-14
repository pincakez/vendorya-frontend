<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('reports.tax.title') }}</h1>
        <p class="page-sub">{{ t('reports.tax.subtitle') }}</p>
      </div>
    </div>

    <ReportFilters :show-granularity="true" @change="onFilters" />

    <ReportTable
      :columns="rateColumns"
      :rows="byRate"
      :totals="rateTotals"
      :loading="loading"
      :title="t('reports.tax.by_rate')"
      filename="tax-by-rate"
      :meta="meta"
    />
    <ReportTable
      :columns="periodColumns"
      :rows="byPeriod"
      :totals="periodTotals"
      :loading="loading"
      :title="t('reports.tax.by_period')"
      filename="tax-by-period"
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

const loading = ref(false)
const byRate = ref([])
const byPeriod = ref([])
const total = ref('0')
const filters = ref({})

const meta = computed(() => `${filters.value.date_from || ''} → ${filters.value.date_to || ''}`)

const rateColumns = computed(() => [
  { key: 'name',      label: t('reports.tax.cols.tax'), type: 'text' },
  { key: 'rate',      label: t('reports.tax.cols.rate_pct'), type: 'number' },
  { key: 'taxable',   label: t('reports.tax.cols.taxable_base'), type: 'currency' },
  { key: 'collected', label: t('reports.tax.cols.collected'), type: 'currency', accent: 'money' },
])
const periodColumns = computed(() => [
  { key: 'period',    label: t('reports.tax.cols.period'), type: 'date' },
  { key: 'collected', label: t('reports.tax.cols.collected'), type: 'currency', accent: 'money' },
])
const rateTotals = computed(() => byRate.value.length ? { collected: total.value } : null)
const periodTotals = computed(() => byPeriod.value.length ? { collected: total.value } : null)

function onFilters(f) { filters.value = f; fetchData() }

async function fetchData() {
  if (!filters.value.date_from) return
  loading.value = true
  try {
    const res = await api.get('/api/reports/tax/', { params: filters.value })
    byRate.value = res.data.by_rate || []
    byPeriod.value = res.data.by_period || []
    total.value = res.data.total_collected || '0'
  } catch { byRate.value = []; byPeriod.value = [] } finally { loading.value = false }
}
</script>

<style scoped>
</style>
