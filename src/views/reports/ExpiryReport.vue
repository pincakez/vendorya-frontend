<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('reports.expiry.title') }}</h1>
        <p class="page-sub">{{ t('reports.expiry.subtitle') }}</p>
      </div>
      <div style="display:flex;gap:10px;">
        <button class="btn-scan" @click="scan" :disabled="scanning">
          <BellRing :size="15" /> {{ scanning ? t('reports.expiry.scanning') : t('reports.expiry.scan_btn') }}
        </button>
        <button class="btn-refresh" @click="fetchData" :class="{ spinning: loading }"><RefreshCw :size="15" /></button>
      </div>
    </div>

    <!-- Summary tiles -->
    <div class="exp-tiles">
      <div class="exp-tile">
        <div class="exp-tile-label">{{ t('reports.expiry.tile_expired') }}</div>
        <div class="exp-tile-val danger"><Money :value="totals.expired_value" /></div>
      </div>
      <div class="exp-tile">
        <div class="exp-tile-label">{{ t('reports.expiry.tile_soon') }}</div>
        <div class="exp-tile-val warn"><Money :value="totals.expiring_soon_value" /></div>
      </div>
      <div class="exp-tile">
        <div class="exp-tile-label">{{ t('reports.expiry.tile_total') }}</div>
        <div class="exp-tile-val"><Money :value="totals.total_value" /></div>
      </div>
    </div>

    <div class="sr-controls">
      <label class="filter-field">
        <span>{{ t('reports.expiry.status') }}</span>
        <select v-model="statusFilter" class="filter-input" @change="fetchData">
          <option value="all">{{ t('reports.expiry.f_all') }}</option>
          <option value="expired">{{ t('reports.expiry.f_expired') }}</option>
          <option value="soon">{{ t('reports.expiry.f_soon') }}</option>
        </select>
      </label>
      <label class="filter-field">
        <span>{{ t('reports.expiry.window') }}</span>
        <input v-model.number="windowDays" type="number" min="1" max="365" class="filter-input" style="width:110px;" @change="fetchData" />
      </label>
    </div>

    <ReportTable
      :columns="columns"
      :rows="rows"
      :loading="loading"
      :title="t('reports.expiry.table_title')"
      filename="expiry-batches"
      :empty-text="t('reports.expiry.empty')"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RefreshCw, BellRing } from 'lucide-vue-next'
import api from '@/api/axios'
import ReportTable from '@/components/ui/ReportTable.vue'
import Money from '@/components/ui/Money.vue'
import { showSuccessToast } from '@/utils/toast'

const { t } = useI18n()

const loading = ref(false)
const scanning = ref(false)
const rows = ref([])
const totals = ref({ expired_value: 0, expiring_soon_value: 0, total_value: 0 })
const statusFilter = ref('all')
const windowDays = ref(60)

const columns = computed(() => [
  { key: 'expiry_date',        label: t('reports.expiry.cols.expiry'), type: 'text' },
  { key: 'days_left',          label: t('reports.expiry.cols.days_left'), type: 'number' },
  { key: 'product',            label: t('reports.expiry.cols.product'), type: 'text' },
  { key: 'sku',                label: t('reports.expiry.cols.sku'), type: 'text' },
  { key: 'batch_number',       label: t('reports.expiry.cols.batch'), type: 'text' },
  { key: 'branch',             label: t('reports.expiry.cols.branch'), type: 'text' },
  { key: 'quantity_remaining', label: t('reports.expiry.cols.qty'), type: 'qty' },
  { key: 'value',              label: t('reports.expiry.cols.value'), type: 'currency', accent: 'money' },
  { key: 'state_label',        label: t('reports.expiry.cols.status'), type: 'text' },
])

async function fetchData() {
  loading.value = true
  try {
    const res = await api.get('/api/reports/expiry/', {
      params: { status: statusFilter.value, window: windowDays.value || undefined },
    })
    rows.value = (res.data.rows || []).map(r => ({
      ...r,
      state_label: t('reports.expiry.states.' + r.state),
    }))
    totals.value = res.data.totals || totals.value
  } catch { rows.value = [] } finally { loading.value = false }
}

async function scan() {
  scanning.value = true
  try {
    const res = await api.post('/api/reports/expiry/scan/')
    const { expired, expiring_soon } = res.data
    if (expired || expiring_soon) {
      showSuccessToast(t('reports.expiry.scan_done', { expired, soon: expiring_soon }))
    } else {
      showSuccessToast(t('reports.expiry.scan_clear'))
    }
    fetchData()
  } catch { /* noop */ } finally { scanning.value = false }
}

onMounted(fetchData)
</script>

<style scoped>
.exp-tiles { display:grid; grid-template-columns:repeat(3, 1fr); gap:14px; margin-bottom:18px; }
@media (max-width:640px) { .exp-tiles { grid-template-columns:1fr; } }
.exp-tile { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:16px 18px; }
.exp-tile-label { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; color:var(--text-muted); margin-bottom:6px; }
.exp-tile-val { font-size:22px; font-weight:700; color:var(--text-primary); }
.exp-tile-val.danger { color:#dc2626; }
.exp-tile-val.warn { color:#d97706; }

.sr-controls { display:flex; flex-wrap:wrap; align-items:flex-end; gap:14px; margin-bottom:18px; }
.filter-field { display:flex; flex-direction:column; gap:4px; min-width:160px; }
.filter-field span { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; color:var(--text-muted); }
.filter-input { padding:7px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-card); color:var(--text-primary); font-size:13px; outline:none; }
.filter-input:focus { border-color:var(--accent); }

.btn-scan { display:flex; align-items:center; gap:7px; padding:0 14px; height:34px; border-radius:8px; border:1px solid var(--accent); background:var(--accent); color:#fff; font-size:13px; font-weight:600; cursor:pointer; }
.btn-scan:hover { filter:brightness(1.05); }
.btn-scan:disabled { opacity:.6; cursor:default; }
.btn-refresh { width:34px; height:34px; border-radius:8px; border:1px solid var(--border); background:var(--bg-card); color:var(--text-muted); display:flex; align-items:center; justify-content:center; cursor:pointer; }
.btn-refresh:hover { color:var(--text-primary); background:var(--bg-app); }
.btn-refresh.spinning svg { animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
