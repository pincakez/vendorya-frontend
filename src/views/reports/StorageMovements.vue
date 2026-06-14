<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('reports.storage_movements.title') }}</h1>
        <p class="page-sub">{{ t('reports.storage_movements.subtitle') }}</p>
      </div>
    </div>

    <div class="sr-controls">
      <label class="filter-field">
        <span>{{ t('reports.storage_movements.location') }}</span>
        <select v-model="location" class="filter-input" @change="fetchData">
          <option value="">{{ t('reports.storage_movements.all_locations') }}</option>
          <option v-for="l in locations" :key="l.id" :value="l.id">{{ l.name }}</option>
        </select>
      </label>
      <label class="filter-field">
        <span>{{ t('reports.storage_movements.direction') }}</span>
        <select v-model="direction" class="filter-input" @change="fetchData">
          <option value="">{{ t('reports.storage_movements.all_directions') }}</option>
          <option value="TO_STORAGE">{{ t('reports.storage_movements.dir.TO_STORAGE') }}</option>
          <option value="FROM_STORAGE">{{ t('reports.storage_movements.dir.FROM_STORAGE') }}</option>
          <option value="WRITE_OFF">{{ t('reports.storage_movements.dir.WRITE_OFF') }}</option>
        </select>
      </label>
    </div>

    <ReportFilters :show-branch="false" @change="onFilters" />

    <ReportTable
      :columns="columns"
      :rows="rows"
      :loading="loading"
      :title="t('reports.storage_movements.table_title')"
      filename="storage-movements"
      :meta="meta"
      :empty-text="t('reports.storage_movements.empty')"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/api/axios'
import ReportFilters from '@/components/ui/ReportFilters.vue'
import ReportTable from '@/components/ui/ReportTable.vue'

const { t } = useI18n()

const loading = ref(false)
const rows = ref([])
const filters = ref({})
const locations = ref([])
const location = ref('')
const direction = ref('')

const meta = computed(() => `${filters.value.date_from || ''} → ${filters.value.date_to || ''}`)

const columns = computed(() => [
  { key: 'date',          label: t('reports.storage_movements.cols.date'), type: 'date' },
  { key: 'direction_display', label: t('reports.storage_movements.cols.direction'), type: 'text' },
  { key: 'sku',           label: t('reports.storage_movements.cols.sku'), type: 'text' },
  { key: 'product',       label: t('reports.storage_movements.cols.product'), type: 'text' },
  { key: 'storage_location', label: t('reports.storage_movements.cols.location'), type: 'text' },
  { key: 'qty',           label: t('reports.storage_movements.cols.qty'), type: 'qty' },
  { key: 'value',         label: t('reports.storage_movements.cols.value'), type: 'currency', accent: 'money' },
  { key: 'branch',        label: t('reports.storage_movements.cols.branch'), type: 'text' },
  { key: 'user',          label: t('reports.storage_movements.cols.user'), type: 'text' },
])

function onFilters(f) { filters.value = f; fetchData() }

async function fetchData() {
  if (!filters.value.date_from) return
  loading.value = true
  try {
    const res = await api.get('/api/reports/storage-movements/', {
      params: {
        date_from: filters.value.date_from,
        date_to: filters.value.date_to,
        storage_location: location.value || undefined,
        direction: direction.value || undefined,
      },
    })
    rows.value = (res.data.rows || []).map(r => ({
      ...r,
      branch: r.to_branch || r.from_branch || '—',
    }))
  } catch { rows.value = [] } finally { loading.value = false }
}

onMounted(async () => {
  try {
    const res = await api.get('/api/inventory/storage-locations/')
    locations.value = res.data.results ?? res.data
  } catch { locations.value = [] }
})
</script>

<style scoped>
.sr-controls { display:flex; flex-wrap:wrap; align-items:flex-end; gap:14px; margin-bottom:14px; }
.filter-field { display:flex; flex-direction:column; gap:4px; min-width:200px; }
.filter-field span { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; color:var(--text-muted); }
.filter-input { padding:7px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-card); color:var(--text-primary); font-size:13px; outline:none; }
.filter-input:focus { border-color:var(--accent); }
</style>
