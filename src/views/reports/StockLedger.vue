<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Stock Movement Ledger</h1>
        <p class="page-sub">Full audit trail per variant — purchases, sales, adjustments, returns</p>
      </div>
    </div>

    <div class="variant-pick">
      <label class="filter-field">
        <span>Variant</span>
        <select v-model="variant" class="filter-input" @change="fetchData">
          <option value="">Select a variant…</option>
          <option v-for="v in variants" :key="v.id" :value="v.id">
            {{ v.sku }} — {{ v.product_name || 'Product' }}
          </option>
        </select>
      </label>
    </div>

    <ReportFilters @change="onFilters" />

    <div v-if="variant" class="balance-bar">
      <div class="bal-item"><span>Opening</span><strong>{{ qty(opening) }}</strong></div>
      <div class="bal-item"><span>Closing</span><strong>{{ qty(closing) }}</strong></div>
    </div>

    <ReportTable
      v-if="variant"
      :columns="columns"
      :rows="rows"
      :loading="loading"
      title="Stock Ledger"
      filename="stock-ledger"
      :meta="meta"
      empty-text="No movements in this period"
    />
    <p v-else class="pick-hint">Pick a variant above to view its movement ledger.</p>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'
import { formatQty } from '@/utils/format'
import ReportFilters from '@/components/ui/ReportFilters.vue'
import ReportTable from '@/components/ui/ReportTable.vue'

const loading = ref(false)
const variants = ref([])
const variant = ref('')
const rows = ref([])
const opening = ref('0')
const closing = ref('0')
const filters = ref({})

const meta = computed(() => `${filters.value.date_from || ''} → ${filters.value.date_to || ''}`)
function qty(v) { return formatQty(v ?? 0) }

const columns = [
  { key: 'date',    label: 'Date', type: 'date' },
  { key: 'type',    label: 'Type', type: 'text' },
  { key: 'ref',     label: 'Reference', type: 'text' },
  { key: 'note',    label: 'Detail', type: 'text' },
  { key: 'branch',  label: 'Branch', type: 'text' },
  { key: 'qty',     label: 'Change', type: 'qty', accent: 'sign' },
  { key: 'balance', label: 'Balance', type: 'qty' },
]

function onFilters(f) { filters.value = f; if (variant.value) fetchData() }

async function fetchData() {
  if (!variant.value || !filters.value.date_from) return
  loading.value = true
  try {
    const res = await api.get('/api/reports/stock-ledger/', {
      params: { variant: variant.value, ...filters.value },
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
.variant-pick { margin-bottom:16px; }
.filter-field { display:flex; flex-direction:column; gap:4px; max-width:420px; }
.filter-field span { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; color:var(--text-muted); }
.filter-input { padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-card); color:var(--text-primary); font-size:13px; outline:none; }
.filter-input:focus { border-color:var(--accent); }
.balance-bar { display:flex; gap:14px; margin-bottom:16px; }
.bal-item { background:var(--bg-card); border:1px solid var(--border); border-radius:10px; padding:12px 18px; display:flex; flex-direction:column; gap:3px; }
.bal-item span { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; color:var(--text-muted); }
.bal-item strong { font-size:18px; font-variant-numeric:tabular-nums; color:var(--text-primary); }
.pick-hint { color:var(--text-muted); font-size:13px; }
</style>
