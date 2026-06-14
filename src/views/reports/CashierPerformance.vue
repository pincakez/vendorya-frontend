<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('reports.cashier.title') }}</h1>
        <p class="page-sub">{{ t('reports.cashier.subtitle') }}</p>
      </div>
    </div>

    <ReportFilters :show-branch="false" @change="onFilters" />

    <ReportTable
      :columns="columns"
      :rows="rows"
      :totals="totals"
      :loading="loading"
      :title="t('reports.cashier.title')"
      filename="cashier-performance"
      :meta="meta"
      :empty-text="t('reports.cashier.empty')"
    />
    <p class="hint">{{ t('reports.cashier.hint') }}</p>
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
const rows = ref([])
const totals = ref(null)
const filters = ref({})

const meta = computed(() => `${filters.value.date_from || ''} → ${filters.value.date_to || ''}`)

const columns = computed(() => [
  { key: 'name',            label: t('reports.cashier.cols.staff'), type: 'text' },
  { key: 'sales_count',     label: t('reports.cashier.cols.sales'), type: 'number' },
  { key: 'sales_value',     label: t('reports.cashier.cols.collected'), type: 'currency', accent: 'money' },
  { key: 'returns_count',   label: t('reports.cashier.cols.returns'), type: 'number' },
  { key: 'returns_value',   label: t('reports.cashier.cols.refunded'), type: 'currency' },
  { key: 'shifts',          label: t('reports.cashier.cols.shifts'), type: 'number' },
  { key: 'cash_difference', label: t('reports.cashier.cols.cash_diff'), type: 'currency', accent: 'sign' },
])

function onFilters(f) { filters.value = f; fetchData() }

async function fetchData() {
  if (!filters.value.date_from) return
  loading.value = true
  try {
    const res = await api.get('/api/reports/cashier-performance/', { params: filters.value })
    rows.value = res.data.rows || []
    totals.value = res.data.totals || null
  } catch { rows.value = []; totals.value = null } finally { loading.value = false }
}
</script>

<style scoped>
.hint { font-size:12px; color:var(--text-muted); margin-top:-8px; }
</style>
