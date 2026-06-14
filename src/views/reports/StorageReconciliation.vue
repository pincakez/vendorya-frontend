<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('reports.storage_recon.title') }}</h1>
        <p class="page-sub">{{ t('reports.storage_recon.subtitle') }}</p>
      </div>
      <button class="btn-refresh" @click="fetchData" :class="{ spinning: loading }"><RefreshCw :size="15" /></button>
    </div>

    <div v-if="checked !== null" class="recon-banner" :class="reconciles ? 'ok' : 'bad'">
      <component :is="reconciles ? CheckCircle2 : AlertTriangle" :size="20" />
      <div>
        <strong>{{ reconciles ? t('reports.storage_recon.all_ok') : t('reports.storage_recon.failures_found', { n: rows.length }) }}</strong>
        <span>{{ t('reports.storage_recon.checked', { n: checked }) }}</span>
      </div>
    </div>

    <ReportTable
      v-if="!reconciles"
      :columns="columns"
      :rows="rows"
      :loading="loading"
      :title="t('reports.storage_recon.table_title')"
      filename="storage-reconciliation"
      :empty-text="t('reports.storage_recon.empty')"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-vue-next'
import api from '@/api/axios'
import ReportTable from '@/components/ui/ReportTable.vue'

const { t } = useI18n()

const loading = ref(false)
const rows = ref([])
const checked = ref(null)
const reconciles = ref(true)

const columns = computed(() => [
  { key: 'sku',        label: t('reports.storage_recon.cols.sku'), type: 'text' },
  { key: 'product',    label: t('reports.storage_recon.cols.product'), type: 'text' },
  { key: 'on_hand',    label: t('reports.storage_recon.cols.on_hand'), type: 'qty' },
  { key: 'expected',   label: t('reports.storage_recon.cols.expected'), type: 'qty' },
  { key: 'difference', label: t('reports.storage_recon.cols.difference'), type: 'qty', accent: 'sign' },
])

async function fetchData() {
  loading.value = true
  try {
    const res = await api.get('/api/reports/storage-reconciliation/')
    rows.value = res.data.failures || []
    checked.value = res.data.checked ?? 0
    reconciles.value = res.data.reconciles ?? true
  } catch { rows.value = []; checked.value = null; reconciles.value = true } finally { loading.value = false }
}

onMounted(fetchData)
</script>

<style scoped>
.recon-banner { display:flex; align-items:center; gap:12px; padding:14px 18px; border-radius:12px; border:1px solid var(--border); margin-bottom:20px; }
.recon-banner div { display:flex; flex-direction:column; gap:2px; }
.recon-banner strong { font-size:14px; font-weight:700; }
.recon-banner span { font-size:12.5px; color:var(--text-muted); }
.recon-banner.ok { background:color-mix(in srgb, var(--success) 12%, transparent); border-color:color-mix(in srgb, var(--success) 35%, transparent); color:var(--success); }
.recon-banner.bad { background:color-mix(in srgb, var(--danger) 12%, transparent); border-color:color-mix(in srgb, var(--danger) 35%, transparent); color:var(--danger); }
.btn-refresh { width:34px; height:34px; border-radius:8px; border:1px solid var(--border); background:var(--bg-card); color:var(--text-muted); display:flex; align-items:center; justify-content:center; cursor:pointer; }
.btn-refresh:hover { color:var(--text-primary); background:var(--bg-app); }
.btn-refresh.spinning svg { animation:spin .8s linear infinite; }
@keyframes spin { to { transform:rotate(360deg); } }
</style>
