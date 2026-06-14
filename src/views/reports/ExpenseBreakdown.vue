<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('reports.expenses.title') }}</h1>
        <p class="page-sub">{{ t('reports.expenses.subtitle') }}</p>
      </div>
    </div>

    <ReportFilters :show-granularity="true" @change="onFilters" />

    <ReportTable
      :columns="catColumns"
      :rows="byCategory"
      :totals="catTotals"
      :loading="loading"
      :title="t('reports.expenses.by_category')"
      filename="expenses-by-category"
      :meta="meta"
    />
    <ReportTable
      :columns="periodColumns"
      :rows="byPeriod"
      :totals="periodTotals"
      :loading="loading"
      :title="t('reports.expenses.by_period')"
      filename="expenses-by-period"
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
const byCategory = ref([])
const byPeriod = ref([])
const grandTotal = ref('0')
const filters = ref({})

const meta = computed(() => `${filters.value.date_from || ''} → ${filters.value.date_to || ''}`)

const catColumns = computed(() => [
  { key: 'name',  label: t('reports.expenses.cols.category'), type: 'text' },
  { key: 'count', label: t('reports.expenses.cols.entries'), type: 'number' },
  { key: 'total', label: t('reports.expenses.cols.total'), type: 'currency', accent: 'money' },
])
const periodColumns = computed(() => [
  { key: 'period', label: t('reports.expenses.cols.period'), type: 'date' },
  { key: 'total',  label: t('reports.expenses.cols.total'), type: 'currency', accent: 'money' },
])
const catTotals = computed(() => byCategory.value.length ? { total: grandTotal.value } : null)
const periodTotals = computed(() => byPeriod.value.length ? { total: grandTotal.value } : null)

function onFilters(f) { filters.value = f; fetchData() }

async function fetchData() {
  if (!filters.value.date_from) return
  loading.value = true
  try {
    const res = await api.get('/api/reports/expenses/', { params: filters.value })
    byCategory.value = res.data.by_category || []
    byPeriod.value = res.data.by_period || []
    grandTotal.value = res.data.total || '0'
  } catch { byCategory.value = []; byPeriod.value = [] } finally { loading.value = false }
}
</script>

<style scoped>
</style>
