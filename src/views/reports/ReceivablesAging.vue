<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">A/R Aging</h1>
        <p class="page-sub">Customer outstanding balances by age — net of payments, returns &amp; credit notes</p>
      </div>
      <button class="btn-refresh" @click="fetchData" :class="{ spinning: loading }"><RefreshCw :size="15" /></button>
    </div>

    <ReportTable
      :columns="columns"
      :rows="rows"
      :totals="totals"
      :loading="loading"
      title="Accounts Receivable Aging"
      filename="ar-aging"
      :meta="meta"
      empty-text="No outstanding receivables"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RefreshCw } from 'lucide-vue-next'
import api from '@/api/axios'
import ReportTable from '@/components/ui/ReportTable.vue'

const loading = ref(false)
const rows = ref([])
const totals = ref(null)
const meta = ref('')

const columns = [
  { key: 'name',     label: 'Customer', type: 'text' },
  { key: 'b0_30',    label: '0–30 days', type: 'currency' },
  { key: 'b31_60',   label: '31–60 days', type: 'currency' },
  { key: 'b61_90',   label: '61–90 days', type: 'currency' },
  { key: 'b90_plus', label: '90+ days', type: 'currency' },
  { key: 'total',    label: 'Total Due', type: 'currency', accent: 'money' },
]

async function fetchData() {
  loading.value = true
  try {
    const res = await api.get('/api/reports/ar-aging/')
    rows.value = res.data.rows || []
    totals.value = res.data.totals || null
    meta.value = `As of ${res.data.as_of}`
  } catch { rows.value = []; totals.value = null } finally { loading.value = false }
}
onMounted(fetchData)
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; }
.page-title { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub { font-size:13px; color:var(--text-muted); margin:2px 0 0; }
.btn-refresh { width:34px; height:34px; border-radius:8px; border:1px solid var(--border); background:var(--bg-card); color:var(--text-muted); display:flex; align-items:center; justify-content:center; cursor:pointer; }
.btn-refresh:hover { color:var(--text-primary); background:var(--bg-app); }
.btn-refresh.spinning svg { animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
