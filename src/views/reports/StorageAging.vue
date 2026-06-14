<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('reports.storage_aging.title') }}</h1>
        <p class="page-sub">{{ t('reports.storage_aging.subtitle') }}</p>
      </div>
      <button class="btn-refresh" @click="fetchData" :class="{ spinning: loading }"><RefreshCw :size="15" /></button>
    </div>

    <div class="sr-controls">
      <label class="filter-field">
        <span>{{ t('reports.storage_aging.location') }}</span>
        <select v-model="location" class="filter-input" @change="fetchData">
          <option value="">{{ t('reports.storage_aging.all_locations') }}</option>
          <option v-for="l in locations" :key="l.id" :value="l.id">{{ l.name }}</option>
        </select>
      </label>
    </div>

    <ReportTable
      :columns="columns"
      :rows="rows"
      :totals="totals"
      :loading="loading"
      :title="t('reports.storage_aging.table_title')"
      filename="storage-aging"
      :meta="meta"
      :empty-text="t('reports.storage_aging.empty')"
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
const locations = ref([])
const location = ref('')

const meta = computed(() => asOf.value ? t('reports.storage_aging.as_of', { date: asOf.value }) : '')

const columns = computed(() => [
  { key: 'bucket_label', label: t('reports.storage_aging.cols.bucket'), type: 'text' },
  { key: 'items',        label: t('reports.storage_aging.cols.items'), type: 'number' },
  { key: 'qty',          label: t('reports.storage_aging.cols.qty'), type: 'qty' },
  { key: 'value',        label: t('reports.storage_aging.cols.value'), type: 'currency', accent: 'money' },
  { key: 'flag',         label: t('reports.storage_aging.cols.status'), type: 'text' },
])

async function fetchData() {
  loading.value = true
  try {
    const res = await api.get('/api/reports/storage-aging/', {
      params: { storage_location: location.value || undefined },
    })
    rows.value = (res.data.rows || []).map(r => ({
      ...r,
      bucket_label: t('reports.storage_aging.buckets.' + r.bucket),
      flag: r.write_down_candidate ? t('reports.storage_aging.write_down') : '',
    }))
    totals.value = res.data.totals || null
    asOf.value = res.data.as_of || ''
  } catch { rows.value = []; totals.value = null } finally { loading.value = false }
}

onMounted(async () => {
  try {
    const res = await api.get('/api/inventory/storage-locations/')
    locations.value = res.data.results ?? res.data
  } catch { locations.value = [] }
  fetchData()
})
</script>

<style scoped>
.sr-controls { display:flex; flex-wrap:wrap; align-items:flex-end; gap:14px; margin-bottom:18px; }
.filter-field { display:flex; flex-direction:column; gap:4px; min-width:220px; }
.filter-field span { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; color:var(--text-muted); }
.filter-input { padding:7px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-card); color:var(--text-primary); font-size:13px; outline:none; }
.filter-input:focus { border-color:var(--accent); }
.btn-refresh { width:34px; height:34px; border-radius:8px; border:1px solid var(--border); background:var(--bg-card); color:var(--text-muted); display:flex; align-items:center; justify-content:center; cursor:pointer; }
.btn-refresh:hover { color:var(--text-primary); background:var(--bg-app); }
.btn-refresh.spinning svg { animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
