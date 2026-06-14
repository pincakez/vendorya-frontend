<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('reports.storage_value.title') }}</h1>
        <p class="page-sub">{{ t('reports.storage_value.subtitle') }}</p>
      </div>
      <button class="btn-refresh" @click="fetchData" :class="{ spinning: loading }"><RefreshCw :size="15" /></button>
    </div>

    <div class="sr-controls">
      <div class="scope-field">
        <span>{{ t('reports.storage_value.group_by') }}</span>
        <div class="scope-toggle">
          <button v-for="g in groupOptions" :key="g"
            class="scope-btn" :class="{ active: groupBy === g }"
            @click="setGroup(g)">
            {{ t('reports.storage_value.by.' + g) }}
          </button>
        </div>
      </div>
    </div>

    <ReportTable
      :columns="columns"
      :rows="rows"
      :totals="totals"
      :loading="loading"
      :title="t('reports.storage_value.table_title')"
      filename="storage-value"
      :empty-text="t('reports.storage_value.empty')"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { RefreshCw } from 'lucide-vue-next'
import api from '@/api/axios'
import ReportTable from '@/components/ui/ReportTable.vue'

const { t } = useI18n()

const loading = ref(false)
const rows = ref([])
const totals = ref(null)
const groupOptions = ['category', 'supplier']
const groupBy = ref('category')

function setGroup(g) { groupBy.value = g; fetchData() }

const columns = computed(() => [
  { key: 'location', label: t('reports.storage_value.cols.location'), type: 'text' },
  { key: 'group',    label: t('reports.storage_value.cols.' + groupBy.value), type: 'text' },
  { key: 'qty',      label: t('reports.storage_value.cols.qty'), type: 'qty' },
  { key: 'value',    label: t('reports.storage_value.cols.value'), type: 'currency', accent: 'money' },
])

async function fetchData() {
  loading.value = true
  try {
    const res = await api.get('/api/reports/storage-value/', {
      params: { group_by: groupBy.value },
    })
    const flat = []
    for (const loc of res.data.rows || []) {
      for (const g of loc.groups || []) {
        flat.push({ location: loc.name, group: g.name, qty: g.qty, value: g.value })
      }
    }
    rows.value = flat
    totals.value = flat.length ? { value: res.data.total_value } : null
  } catch { rows.value = []; totals.value = null } finally { loading.value = false }
}

fetchData()
</script>

<style scoped>
.sr-controls { display:flex; flex-wrap:wrap; align-items:flex-end; gap:14px; margin-bottom:18px; }
.scope-field { display:flex; flex-direction:column; gap:4px; }
.scope-field span { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; color:var(--text-muted); }
.scope-toggle { display:inline-flex; border:1px solid var(--border); border-radius:8px; overflow:hidden; background:var(--bg-card); }
.scope-btn { padding:8px 14px; font-size:13px; font-weight:600; color:var(--text-muted); background:transparent; border:none; cursor:pointer; transition:background 120ms,color 120ms; }
.scope-btn:not(:last-child) { border-right:1px solid var(--border); }
.scope-btn:hover { color:var(--text-primary); }
.scope-btn.active { background:var(--accent); color:#fff; }
.btn-refresh { width:34px; height:34px; border-radius:8px; border:1px solid var(--border); background:var(--bg-card); color:var(--text-muted); display:flex; align-items:center; justify-content:center; cursor:pointer; }
.btn-refresh:hover { color:var(--text-primary); background:var(--bg-app); }
.btn-refresh.spinning svg { animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
