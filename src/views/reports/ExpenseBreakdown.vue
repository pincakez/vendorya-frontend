<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Expense Breakdown</h1>
        <p class="page-sub">Expenses by category and by period</p>
      </div>
    </div>

    <ReportFilters :show-granularity="true" @change="onFilters" />

    <ReportTable
      :columns="catColumns"
      :rows="byCategory"
      :totals="catTotals"
      :loading="loading"
      title="By Category"
      filename="expenses-by-category"
      :meta="meta"
    />
    <ReportTable
      :columns="periodColumns"
      :rows="byPeriod"
      :totals="periodTotals"
      :loading="loading"
      title="By Period"
      filename="expenses-by-period"
      :meta="meta"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import api from '@/api/axios'
import ReportFilters from '@/components/ui/ReportFilters.vue'
import ReportTable from '@/components/ui/ReportTable.vue'

const loading = ref(false)
const byCategory = ref([])
const byPeriod = ref([])
const grandTotal = ref('0')
const filters = ref({})

const meta = computed(() => `${filters.value.date_from || ''} → ${filters.value.date_to || ''}`)

const catColumns = [
  { key: 'name',  label: 'Category', type: 'text' },
  { key: 'count', label: 'Entries', type: 'number' },
  { key: 'total', label: 'Total', type: 'currency', accent: 'money' },
]
const periodColumns = [
  { key: 'period', label: 'Period', type: 'date' },
  { key: 'total',  label: 'Total', type: 'currency', accent: 'money' },
]
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
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; }
.page-title { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub { font-size:13px; color:var(--text-muted); margin:2px 0 0; }
</style>
