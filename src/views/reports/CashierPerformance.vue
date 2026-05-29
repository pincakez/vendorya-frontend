<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Cashier Performance</h1>
        <p class="page-sub">Sales, returns and shift cash differences per staff member</p>
      </div>
    </div>

    <ReportFilters :show-branch="false" @change="onFilters" />

    <ReportTable
      :columns="columns"
      :rows="rows"
      :totals="totals"
      :loading="loading"
      title="Cashier Performance"
      filename="cashier-performance"
      :meta="meta"
      empty-text="No staff activity in this period"
    />
    <p class="hint">Sales are attributed by who collected payment. Cash difference is the sum of closed-shift overage/shortage.</p>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import api from '@/api/axios'
import ReportFilters from '@/components/ui/ReportFilters.vue'
import ReportTable from '@/components/ui/ReportTable.vue'

const loading = ref(false)
const rows = ref([])
const totals = ref(null)
const filters = ref({})

const meta = computed(() => `${filters.value.date_from || ''} → ${filters.value.date_to || ''}`)

const columns = [
  { key: 'name',            label: 'Staff', type: 'text' },
  { key: 'sales_count',     label: 'Sales', type: 'number' },
  { key: 'sales_value',     label: 'Collected', type: 'currency', accent: 'money' },
  { key: 'returns_count',   label: 'Returns', type: 'number' },
  { key: 'returns_value',   label: 'Refunded', type: 'currency' },
  { key: 'shifts',          label: 'Shifts', type: 'number' },
  { key: 'cash_difference', label: 'Cash Diff', type: 'currency', accent: 'sign' },
]

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
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; }
.page-title { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub { font-size:13px; color:var(--text-muted); margin:2px 0 0; }
.hint { font-size:12px; color:var(--text-muted); margin-top:-8px; }
</style>
