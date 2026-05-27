<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Stock Adjustments</h1>
        <p class="page-sub">Manual stock corrections — theft, damage, count corrections</p>
      </div>
    </div>

    <div class="table-wrap">
      <div v-if="loading" class="table-skeleton">
        <div v-for="i in 6" :key="i" class="skeleton-row" />
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Product</th>
            <th>SKU</th>
            <th>Branch</th>
            <th>Change</th>
            <th>Reason</th>
            <th>Notes</th>
            <th>By</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="adjustments.length === 0">
            <td colspan="8" class="table-empty">
              <PackageSearch :size="32" style="opacity:.3;margin-bottom:8px;" />
              <div>No adjustments recorded yet</div>
            </td>
          </tr>
          <tr v-for="a in adjustments" :key="a.id" class="table-row">
            <td class="col-date">{{ fmtDate(a.created_at) }}</td>
            <td class="col-name">{{ a.product_name }}</td>
            <td class="col-ref">{{ a.variant_sku }}</td>
            <td class="col-muted">{{ a.branch_name }}</td>
            <td>
              <span class="qty-badge" :class="Number(a.quantity_change) >= 0 ? 'qty-pos' : 'qty-neg'">
                {{ Number(a.quantity_change) >= 0 ? '+' : '' }}{{ a.quantity_change }}
              </span>
            </td>
            <td><span class="reason-badge" :class="`reason-${a.reason.toLowerCase()}`">{{ reasonLabel(a.reason) }}</span></td>
            <td class="col-notes">{{ a.notes || '—' }}</td>
            <td class="col-muted">{{ a.adjusted_by_name }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <AppPagination :page="page" :page-size="pageSize" :total="total" @update:page="p => { page = p; fetchAdjustments() }" />

    <!-- New Adjustment Modal -->
    <AppModal :open="modal.open" title="New Stock Adjustment" @close="closeModal">
      <div style="display:flex;flex-direction:column;gap:14px;">

        <div>
          <label class="form-label">Product / SKU</label>
          <input
            v-model="modal.search"
            class="form-input"
            placeholder="Type product name or SKU…"
            @input="searchVariants"
          />
          <div v-if="variantResults.length" class="search-dropdown">
            <div
              v-for="v in variantResults"
              :key="v.id"
              class="search-item"
              @click="selectVariant(v)"
            >
              <span class="search-item-name">{{ v.product_name }}</span>
              <span class="search-item-sku">{{ v.sku }}</span>
            </div>
          </div>
          <div v-if="modal.variantId" class="selected-chip">
            <CheckCircle :size="13" /> {{ modal.search }}
          </div>
        </div>

        <div>
          <label class="form-label">Branch</label>
          <select v-model="modal.branchId" class="form-input">
            <option value="">Select branch…</option>
            <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label class="form-label">Quantity Change</label>
            <input v-model="modal.quantityChange" type="number" step="0.001" class="form-input" placeholder="e.g. -3 or +5" />
            <p class="form-hint">Negative = stock loss, Positive = stock gain</p>
          </div>
          <div>
            <label class="form-label">Reason</label>
            <select v-model="modal.reason" class="form-input">
              <option value="">Select reason…</option>
              <option v-for="r in reasons" :key="r.value" :value="r.value">{{ r.label }}</option>
            </select>
          </div>
        </div>

        <div>
          <label class="form-label">Notes <span class="optional">optional</span></label>
          <textarea v-model="modal.notes" class="form-input" rows="2" placeholder="Any additional details…" />
        </div>
      </div>

      <template #footer>
        <button class="btn-ghost" @click="closeModal">Cancel</button>
        <button class="btn-primary" :disabled="!canSave || saving" @click="saveAdjustment">
          {{ saving ? 'Saving…' : 'Save Adjustment' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { PackageSearch, CheckCircle } from 'lucide-vue-next'
import api from '@/api/axios'
import { useQABStore } from '@/stores/qab'
import AppModal from '@/components/ui/AppModal.vue'
import AppPagination from '@/components/ui/AppPagination.vue'

const qab = useQABStore()

const adjustments   = ref([])
const branches      = ref([])
const loading       = ref(false)
const saving        = ref(false)
const page          = ref(1)
const pageSize      = 20
const total         = ref(0)
const variantResults = ref([])
let searchTimer = null

const reasons = [
  { value: 'THEFT',      label: 'Theft / Loss' },
  { value: 'DAMAGE',     label: 'Damage' },
  { value: 'CORRECTION', label: 'Count Correction' },
  { value: 'GIFT',       label: 'Gift / Sample' },
]

const modal = reactive({
  open: false,
  variantId: '',
  branchId: '',
  quantityChange: '',
  reason: '',
  notes: '',
  search: '',
})

const canSave = computed(() =>
  modal.variantId && modal.branchId && modal.quantityChange !== '' && modal.reason
)

async function fetchAdjustments() {
  loading.value = true
  try {
    const res = await api.get('/api/inventory/adjustments/', { params: { page: page.value, page_size: pageSize } })
    adjustments.value = res.data.results ?? res.data
    total.value = res.data.count ?? adjustments.value.length
  } finally { loading.value = false }
}

async function fetchBranches() {
  const res = await api.get('/api/core/branches/')
  branches.value = res.data.results ?? res.data
}

function searchVariants() {
  clearTimeout(searchTimer)
  if (!modal.search.trim()) { variantResults.value = []; return }
  searchTimer = setTimeout(async () => {
    const res = await api.get('/api/inventory/products/', { params: { search: modal.search, page_size: 8 } })
    const products = res.data.results ?? res.data
    variantResults.value = products.flatMap(p =>
      p.default_variant_id
        ? [{ id: p.default_variant_id, sku: p.attributes_summary ? Object.values(p.attributes_summary)[0]?.[0] || p.default_variant_id : p.default_variant_id, product_name: p.name }]
        : []
    ).slice(0, 8)
  }, 280)
}

async function selectVariant(v) {
  modal.variantId = v.id
  modal.search = `${v.product_name} — ${v.sku}`
  variantResults.value = []
  // Fetch full variant to get real SKU
  try {
    const res = await api.get(`/api/inventory/variants/${v.id}/`)
    modal.variantId = res.data.id
    modal.search = `${v.product_name} — ${res.data.sku}`
  } catch {}
}

function openModal() {
  Object.assign(modal, { open: true, variantId: '', branchId: '', quantityChange: '', reason: '', notes: '', search: '' })
  variantResults.value = []
}
function closeModal() { modal.open = false; variantResults.value = [] }

async function saveAdjustment() {
  saving.value = true
  try {
    await api.post('/api/inventory/adjustments/', {
      variant: modal.variantId,
      branch: modal.branchId,
      quantity_change: modal.quantityChange,
      reason: modal.reason,
      notes: modal.notes,
    })
    closeModal()
    page.value = 1
    fetchAdjustments()
  } catch (e) {
    alert(e.response?.data ? JSON.stringify(e.response.data) : 'Error saving adjustment')
  } finally { saving.value = false }
}

function reasonLabel(r) {
  return reasons.find(x => x.value === r)?.label || r
}

function fmtDate(d) {
  return d ? new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
}

onMounted(() => {
  fetchAdjustments()
  fetchBranches()
  qab.setActions([{ id: 'new-adj', label: 'New Adjustment', icon: 'plus', handler: openModal }])
})
onUnmounted(() => qab.clearActions())
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; }
.page-title  { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub    { font-size:13px; color:var(--text-muted); margin:2px 0 0; }

.table-wrap { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.data-table { width:100%; border-collapse:collapse; font-size:13px; }
.data-table thead th { padding:10px 14px; text-align:left; font-size:11.5px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); background:var(--bg-app); border-bottom:1px solid var(--border); }
.data-table tbody tr.table-row { border-bottom:1px solid var(--border); transition:background 100ms; }
.data-table tbody tr.table-row:last-child { border-bottom:none; }
.data-table tbody tr.table-row:hover { background:var(--bg-app); }
.data-table tbody td { padding:10px 14px; color:var(--text-primary); }
.table-empty { text-align:center; padding:48px; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; }
.table-skeleton { padding:8px 0; }
.skeleton-row { height:40px; margin:4px 16px; border-radius:6px; background:var(--border); animation:shimmer 1.4s ease-in-out infinite; }
@keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:.5} }

.col-date  { font-size:12px; color:var(--text-muted); white-space:nowrap; }
.col-name  { font-weight:500; }
.col-ref   { font-family:monospace; font-size:12px; color:var(--text-muted); }
.col-muted { color:var(--text-muted); font-size:12.5px; }
.col-notes { color:var(--text-muted); font-size:12px; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

.qty-badge { display:inline-block; padding:2px 8px; border-radius:999px; font-size:12px; font-weight:700; font-variant-numeric:tabular-nums; }
.qty-pos   { background:#dcfce7; color:#166534; }
.qty-neg   { background:#fee2e2; color:#991b1b; }

.reason-badge { display:inline-block; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:600; }
.reason-theft      { background:#fee2e2; color:#991b1b; }
.reason-damage     { background:#fef3c7; color:#92400e; }
.reason-correction { background:#dbeafe; color:#1e40af; }
.reason-gift       { background:#f3e8ff; color:#6b21a8; }

/* Form */
.form-label { display:block; font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.form-hint  { font-size:11.5px; color:var(--text-muted); margin:4px 0 0; }
.form-input { padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; width:100%; box-sizing:border-box; transition:border-color 120ms; resize:vertical; }
.form-input:focus { border-color:#2563eb; }
.optional   { font-size:11px; color:var(--text-muted); font-weight:400; margin-left:4px; }

.search-dropdown { position:absolute; z-index:50; background:var(--bg-card); border:1px solid var(--border); border-radius:8px; box-shadow:0 4px 16px rgba(0,0,0,.12); margin-top:4px; width:calc(100% - 2px); overflow:hidden; }
.search-item { display:flex; align-items:center; justify-content:space-between; padding:9px 12px; cursor:pointer; transition:background 100ms; }
.search-item:hover { background:var(--bg-app); }
.search-item-name { font-size:13px; color:var(--text-primary); font-weight:500; }
.search-item-sku  { font-size:12px; color:var(--text-muted); font-family:monospace; }

.selected-chip { display:inline-flex; align-items:center; gap:5px; margin-top:6px; padding:4px 10px; background:#dcfce7; color:#166534; border-radius:999px; font-size:12px; font-weight:600; }

.btn-ghost   { display:inline-flex; align-items:center; gap:5px; padding:7px 14px; border-radius:8px; font-size:13px; font-weight:500; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; transition:background 100ms,transform 70ms; }
.btn-ghost:hover  { background:var(--border); }
.btn-ghost:active { transform:scale(.95); }
.btn-primary { display:inline-flex; align-items:center; gap:5px; padding:8px 18px; border-radius:8px; font-size:13px; font-weight:600; border:none; background:#2563eb; color:#fff; cursor:pointer; transition:background 100ms,transform 70ms,opacity 100ms; }
.btn-primary:hover    { background:#1d4ed8; }
.btn-primary:active   { transform:scale(.95); }
.btn-primary:disabled { opacity:.5; cursor:default; }
</style>
