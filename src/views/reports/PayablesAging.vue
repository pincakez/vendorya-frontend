<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('reports.ap_aging.title') }}</h1>
        <p class="page-sub">{{ t('reports.ap_aging.subtitle') }}</p>
      </div>
      <button class="btn-refresh" @click="fetchData" :class="{ spinning: loading }"><RefreshCw :size="15" /></button>
    </div>

    <ReportTable
      :columns="columns"
      :rows="rows"
      :totals="totals"
      :loading="loading"
      :title="t('reports.ap_aging.table_title')"
      filename="ap-aging"
      :meta="meta"
      :empty-text="t('reports.ap_aging.empty')"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RefreshCw } from 'lucide-vue-next'
import api from '@/api/axios'
import ReportTable from '@/components/ui/ReportTable.vue'

const { t } = useI18n()

const loading = ref(false)
const rows = ref([])
const totals = ref(null)
const asOf = ref('')

const meta = computed(() => asOf.value ? t('reports.ap_aging.as_of', { date: asOf.value }) : '')

const columns = computed(() => [
  { key: 'name',     label: t('reports.ap_aging.cols.supplier'), type: 'text' },
  { key: 'b0_30',    label: t('reports.ap_aging.cols.b0_30'), type: 'currency' },
  { key: 'b31_60',   label: t('reports.ap_aging.cols.b31_60'), type: 'currency' },
  { key: 'b61_90',   label: t('reports.ap_aging.cols.b61_90'), type: 'currency' },
  { key: 'b90_plus', label: t('reports.ap_aging.cols.b90_plus'), type: 'currency' },
  { key: 'total',    label: t('reports.ap_aging.cols.total_owed'), type: 'currency', accent: 'money' },
])

async function fetchData() {
  loading.value = true
  try {
    const res = await api.get('/api/reports/ap-aging/')
    rows.value = res.data.rows || []
    totals.value = res.data.totals || null
    asOf.value = res.data.as_of || ''
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
