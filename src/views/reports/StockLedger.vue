<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('reports.stock_ledger.title') }}</h1>
        <p class="page-sub">{{ t('reports.stock_ledger.subtitle') }}</p>
      </div>
    </div>

    <div class="ledger-controls">
      <label class="filter-field">
        <span>{{ t('reports.stock_ledger.variant') }}</span>
        <select v-model="variant" class="filter-input" @change="fetchData">
          <option value="">{{ t('reports.stock_ledger.variant_ph') }}</option>
          <option v-for="v in variants" :key="v.id" :value="v.id">
            {{ v.sku }} — {{ v.product_name || t('reports.stock_ledger.product_fallback') }}
          </option>
        </select>
      </label>
      <div class="scope-field">
        <span>{{ t('reports.stock_ledger.scope.label') }}</span>
        <div class="scope-toggle">
          <button v-for="s in scopes" :key="s"
            class="scope-btn" :class="{ active: scope === s }"
            @click="setScope(s)">
            {{ t('reports.stock_ledger.scope.' + s) }}
          </button>
        </div>
      </div>
    </div>

    <ReportFilters @change="onFilters" />

    <div v-if="variant" class="balance-bar">
      <div class="bal-item"><span>{{ t('reports.stock_ledger.opening') }}</span><strong>{{ qty(opening) }}</strong></div>
      <div class="bal-item"><span>{{ t('reports.stock_ledger.closing') }}</span><strong>{{ qty(closing) }}</strong></div>
    </div>

    <ReportTable
      v-if="variant"
      :columns="columns"
      :rows="rows"
      :loading="loading"
      :title="t('reports.stock_ledger.table_title')"
      filename="stock-ledger"
      :meta="meta"
      :empty-text="t('reports.stock_ledger.empty')"
    />
    <p v-else class="pick-hint">{{ t('reports.stock_ledger.pick_hint') }}</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/api/axios'
import { formatQty } from '@/utils/format'
import ReportFilters from '@/components/ui/ReportFilters.vue'
import ReportTable from '@/components/ui/ReportTable.vue'

const { t } = useI18n()

const loading = ref(false)
const variants = ref([])
const variant = ref('')
const rows = ref([])
const opening = ref('0')
const closing = ref('0')
const filters = ref({})
const scopes = ['active', 'storage', 'combined']
const scope = ref('active')

function setScope(s) { scope.value = s; if (variant.value) fetchData() }

const meta = computed(() => `${filters.value.date_from || ''} → ${filters.value.date_to || ''}`)
function qty(v) { return formatQty(v ?? 0) }

const columns = computed(() => [
  { key: 'date',    label: t('reports.stock_ledger.cols.date'), type: 'date' },
  { key: 'type',    label: t('reports.stock_ledger.cols.type'), type: 'text' },
  { key: 'ref',     label: t('reports.stock_ledger.cols.ref'), type: 'text' },
  { key: 'note',    label: t('reports.stock_ledger.cols.detail'), type: 'text' },
  { key: 'branch',  label: t('reports.stock_ledger.cols.branch'), type: 'text' },
  { key: 'qty',     label: t('reports.stock_ledger.cols.change'), type: 'qty', accent: 'sign' },
  { key: 'balance', label: t('reports.stock_ledger.cols.balance'), type: 'qty' },
])

function onFilters(f) { filters.value = f; if (variant.value) fetchData() }

async function fetchData() {
  if (!variant.value || !filters.value.date_from) return
  loading.value = true
  try {
    const res = await api.get('/api/reports/stock-ledger/', {
      params: { variant: variant.value, scope: scope.value, ...filters.value },
    })
    rows.value = res.data.rows || []
    opening.value = res.data.opening_balance || '0'
    closing.value = res.data.closing_balance || '0'
  } catch { rows.value = []; opening.value = '0'; closing.value = '0' } finally { loading.value = false }
}

onMounted(async () => {
  try {
    let page = 1
    const all = []
    while (true) {
      const res = await api.get('/api/inventory/variants/', { params: { page, page_size: 100 } })
      const data = res.data.results ?? res.data
      all.push(...data)
      if (!res.data.next) break
      page++
    }
    variants.value = all
  } catch { variants.value = [] }
})
</script>

<style scoped>
.ledger-controls { display:flex; flex-wrap:wrap; align-items:flex-end; gap:16px; margin-bottom:16px; }
.filter-field { display:flex; flex-direction:column; gap:4px; min-width:280px; flex:1; max-width:420px; }
.filter-field span { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; color:var(--text-muted); }
.scope-field { display:flex; flex-direction:column; gap:4px; }
.scope-field span { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; color:var(--text-muted); }
.scope-toggle { display:inline-flex; border:1px solid var(--border); border-radius:8px; overflow:hidden; background:var(--bg-card); }
.scope-btn { padding:8px 14px; font-size:13px; font-weight:600; color:var(--text-muted); background:transparent; border:none; cursor:pointer; transition:background 120ms,color 120ms; }
.scope-btn:not(:last-child) { border-right:1px solid var(--border); }
.scope-btn:hover { color:var(--text-primary); }
.scope-btn.active { background:var(--accent); color:#fff; }
.filter-input { padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-card); color:var(--text-primary); font-size:13px; outline:none; }
.filter-input:focus { border-color:var(--accent); }
.balance-bar { display:flex; gap:14px; margin-bottom:16px; }
.bal-item { background:var(--bg-card); border:1px solid var(--border); border-radius:10px; padding:12px 18px; display:flex; flex-direction:column; gap:3px; }
.bal-item span { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; color:var(--text-muted); }
.bal-item strong { font-size:18px; font-variant-numeric:tabular-nums; color:var(--text-primary); }
.pick-hint { color:var(--text-muted); font-size:13px; }
</style>
