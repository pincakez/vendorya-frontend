<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">A/P Aging</h1>
        <p class="page-sub">Supplier outstanding balances by age (received purchases, net of payments)</p>
      </div>
      <button class="btn-refresh" @click="fetchData" :class="{ spinning: loading }"><RefreshCw :size="15" /></button>
    </div>

    <ReportTable
      :columns="columns"
      :rows="rows"
      :totals="totals"
      :loading="loading"
      title="Accounts Payable Aging"
      filename="ap-aging"
      :meta="meta"
      empty-text="No outstanding payables"
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
  { key: 'name',     label: 'Supplier', type: 'text' },
  { key: 'b0_30',    label: '0–30 days', type: 'currency' },
  { key: 'b31_60',   label: '31–60 days', type: 'currency' },
  { key: 'b61_90',   label: '61–90 days', type: 'currency' },
  { key: 'b90_plus', label: '90+ days', type: 'currency' },
  { key: 'total',    label: 'Total Owed', type: 'currency', accent: 'money' },
]

async function fetchData() {
  loading.value = true
  try {
    const res = await api.get('/api/reports/ap-aging/')
    rows.value = res.data.rows || []
    totals.value = res.data.totals || null
    meta.value = `As of ${res.data.as_of}`
  } catch { rows.value = []; totals.value = null } finally { loading.value = false }
}
onMounted(fetchData)
</script>

<style scoped>
.btn-refresh { width:34px; height:34px; border-radius:8px; border:1px solid var(--border); background:var(--bg-card); color:var(--text-muted); display:flex; align-items:center; justify-content:center; cursor:pointer; }
.btn-refresh:hover { color:var(--text-primary); background:var(--bg-app); }
.btn-refresh.spinning svg { animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
