<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Stock Transfers</h1>
        <p class="page-sub">Move stock between branches instantly — Admin / Owner only</p>
      </div>
      <button class="btn-primary" @click="openModal">New Transfer</button>
    </div>

    <!-- List -->
    <div class="dt-card">
      <div v-if="loading" class="table-skeleton">
        <div v-for="i in 6" :key="i" class="skeleton-row" />
      </div>
      <div v-else class="dt-xscroll">
        <table class="dt">
        <thead>
          <tr>
            <th class="dt-th">Date</th>
            <th class="dt-th">From</th>
            <th class="dt-th">To</th>
            <th class="dt-th">Items</th>
            <th class="dt-th">Notes</th>
            <th class="dt-th">By</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="transfers.length === 0">
            <td colspan="6" class="dt-empty">
              <ArrowLeftRight :size="32" style="opacity:.3;margin-bottom:8px;" />
              <div>No transfers yet</div>
              <div class="table-empty-sub">Use "New Transfer" to move stock between branches</div>
            </td>
          </tr>
          <tr v-for="t in transfers" :key="t.id" class="dt-row" @click="viewTransfer(t)">
            <td class="col-date">{{ fmtDate(t.created_at) }}</td>
            <td><span class="branch-pill from-pill">{{ t.from_branch_name }}</span></td>
            <td><span class="branch-pill to-pill">{{ t.to_branch_name }}</span></td>
            <td>
              <span v-for="item in t.items" :key="item.id" class="item-chip">
                {{ item.variant_sku }} ×{{ item.quantity }}
              </span>
            </td>
            <td class="col-notes">{{ t.notes || '—' }}</td>
            <td class="col-muted">{{ t.transferred_by_name }}</td>
          </tr>
        </tbody>
      </table>
      </div><!-- dt-xscroll -->
      <AppPagination :total="total" :page="page" :page-size="pageSize" @change="p => { page = p; load() }" />
    </div>

    <!-- New Transfer Modal -->
    <AppModal :open="modal.open" title="New Stock Transfer" width="640px" @close="closeModal">
      <div class="modal-body">
        <!-- Branches -->
        <div class="form-row-2">
          <div class="form-group">
            <label class="form-label">From Branch</label>
            <select v-model="modal.fromBranch" class="form-input">
              <option value="">Select branch…</option>
              <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">To Branch</label>
            <select v-model="modal.toBranch" class="form-input">
              <option value="">Select branch…</option>
              <option v-for="b in branches" :key="b.id" :value="b.id" :disabled="b.id === modal.fromBranch">{{ b.name }}</option>
            </select>
          </div>
        </div>

        <!-- Item search -->
        <div class="form-group">
          <label class="form-label">Add Product</label>
          <div class="search-row">
            <input
              v-model="modal.search"
              class="form-input"
              placeholder="Search by name or SKU…"
              @input="searchProducts"
            />
          </div>
          <div v-if="modal.results.length" class="search-dropdown">
            <div
              v-for="v in modal.results"
              :key="v.id"
              class="search-result"
              @click="addItem(v)"
            >
              <span class="result-sku">{{ v.sku }}</span>
              <span class="result-name">{{ v.product_name }}</span>
            </div>
          </div>
        </div>

        <!-- Items table -->
        <div v-if="modal.items.length" class="items-table">
          <table class="data-table mini-table">
            <thead>
              <tr>
                <th class="dt-th">SKU</th>
                <th class="dt-th">Product</th>
                <th class="dt-th">Qty</th>
                <th class="dt-th"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in modal.items" :key="item.variantId">
                <td class="col-ref">{{ item.sku }}</td>
                <td>{{ item.productName }}</td>
                <td>
                  <input
                    v-model.number="item.quantity"
                    type="number"
                    min="0.001"
                    step="1"
                    class="qty-input"
                  />
                </td>
                <td>
                  <button class="remove-btn" @click="modal.items.splice(idx, 1)">✕</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Notes -->
        <div class="form-group">
          <label class="form-label">Notes (optional)</label>
          <textarea v-model="modal.notes" class="form-input" rows="2" placeholder="Reason or reference…" />
        </div>

        <p v-if="modal.error" class="form-error">{{ modal.error }}</p>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="closeModal">Cancel</button>
        <button class="btn-primary" :disabled="!canSubmit || modal.saving" @click="submit">
          {{ modal.saving ? 'Transferring…' : 'Transfer Stock' }}
        </button>
      </template>
    </AppModal>

    <!-- Detail Modal -->
    <AppModal :open="detail.open" title="Transfer Detail" width="560px" @close="detail.open = false">
      <div v-if="detail.transfer" class="modal-body">
        <div class="detail-row">
          <span class="detail-label">Date</span>
          <span>{{ fmtDate(detail.transfer.created_at) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">From</span>
          <span class="branch-pill from-pill">{{ detail.transfer.from_branch_name }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">To</span>
          <span class="branch-pill to-pill">{{ detail.transfer.to_branch_name }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">By</span>
          <span>{{ detail.transfer.transferred_by_name }}</span>
        </div>
        <div v-if="detail.transfer.notes" class="detail-row">
          <span class="detail-label">Notes</span>
          <span>{{ detail.transfer.notes }}</span>
        </div>
        <table class="data-table mini-table" style="margin-top:16px;">
          <thead>
            <tr><th class="dt-th">SKU</th><th class="dt-th">Product</th><th class="dt-th">Qty</th></tr>
          </thead>
          <tbody>
            <tr v-for="item in detail.transfer.items" :key="item.id">
              <td class="col-ref">{{ item.variant_sku }}</td>
              <td>{{ item.product_name }}</td>
              <td>{{ item.quantity }}</td>
            </tr>
          </tbody>
        </table>
      </div><!-- existing -->
      <template #footer>
        <button class="btn-secondary" @click="detail.open = false">Close</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ArrowLeftRight } from 'lucide-vue-next'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'
import AppPagination from '@/components/ui/AppPagination.vue'

const transfers = ref([])
const branches  = ref([])
const loading   = ref(false)
const total     = ref(0)
const page      = ref(1)
const pageSize  = 20

const modal = reactive({
  open: false,
  saving: false,
  error: '',
  fromBranch: '',
  toBranch: '',
  notes: '',
  search: '',
  results: [],
  items: [],       // { variantId, sku, productName, quantity }
})

const detail = reactive({ open: false, transfer: null })

const canSubmit = computed(() =>
  modal.fromBranch && modal.toBranch &&
  modal.fromBranch !== modal.toBranch &&
  modal.items.length > 0 &&
  modal.items.every(i => i.quantity > 0)
)

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

async function load() {
  loading.value = true
  try {
    const res = await api.get('/api/inventory/transfers/', { params: { page: page.value, page_size: pageSize } })
    transfers.value = res.data.results ?? res.data
    total.value = res.data.count ?? transfers.value.length
  } finally {
    loading.value = false
  }
}

async function loadBranches() {
  const res = await api.get('/api/core/branches/')
  branches.value = res.data.results ?? res.data
}

let searchTimer = null
async function searchProducts() {
  clearTimeout(searchTimer)
  if (!modal.search.trim()) { modal.results = []; return }
  searchTimer = setTimeout(async () => {
    const res = await api.get('/api/inventory/variants/', {
      params: { search: modal.search, page_size: 8 }
    })
    const raw = res.data.results ?? res.data
    modal.results = raw.map(v => ({
      id: v.id,
      sku: v.sku,
      product_name: v.product_name ?? v.sku,
    }))
  }, 280)
}

function addItem(v) {
  if (modal.items.find(i => i.variantId === v.id)) { modal.results = []; modal.search = ''; return }
  modal.items.push({ variantId: v.id, sku: v.sku, productName: v.product_name, quantity: 1 })
  modal.results = []
  modal.search = ''
}

function openModal() {
  Object.assign(modal, { open: true, saving: false, error: '', fromBranch: '', toBranch: '', notes: '', search: '', results: [], items: [] })
}
function closeModal() { modal.open = false }

async function submit() {
  modal.saving = true
  modal.error = ''
  try {
    await api.post('/api/inventory/transfers/', {
      from_branch: modal.fromBranch,
      to_branch: modal.toBranch,
      notes: modal.notes,
      items: modal.items.map(i => ({ variant: i.variantId, quantity: i.quantity })),
    })
    closeModal()
    load()
  } catch (err) {
    const d = err.response?.data
    modal.error = typeof d === 'string' ? d
      : d?.detail ?? d?.non_field_errors?.[0] ?? JSON.stringify(d) ?? 'Transfer failed.'
  } finally {
    modal.saving = false
  }
}

function viewTransfer(t) {
  detail.transfer = t
  detail.open = true
}

onMounted(() => { load(); loadBranches() })
</script>

<style scoped>
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
.modal-body { display: flex; flex-direction: column; gap: 16px; }
.form-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-label { font-size: 13px; font-weight: 600; color: var(--text-muted); }
.form-input { padding: 8px 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg); color: var(--text); font-size: 14px; width: 100%; }
.form-input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 20%, transparent); }
.form-error { color: var(--danger); font-size: 13px; }

.search-row { position: relative; }
.search-dropdown { border: 1px solid var(--border); border-radius: 8px; background: var(--surface); box-shadow: 0 4px 16px rgba(0,0,0,.12); overflow: hidden; margin-top: 4px; }
.search-result { display: flex; gap: 10px; align-items: center; padding: 10px 14px; cursor: pointer; transition: background 120ms; }
.search-result:hover { background: var(--hover); }
.result-sku { font-size: 12px; font-family: monospace; color: var(--text-muted); background: var(--bg); border-radius: 4px; padding: 2px 6px; }
.result-name { font-size: 14px; }

.items-table { border-radius: 10px; overflow: hidden; border: 1px solid var(--border); }
.mini-table { width: 100%; }
.qty-input { width: 72px; padding: 4px 8px; border: 1px solid var(--border); border-radius: 6px; background: var(--bg); color: var(--text); font-size: 14px; text-align: center; }
.remove-btn { background: none; border: none; color: var(--danger); cursor: pointer; font-size: 14px; padding: 4px 8px; border-radius: 4px; }
.remove-btn:hover { background: var(--danger-soft); }

.branch-pill { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.from-pill { background: var(--warning-soft); color: var(--warning-hover); }
.to-pill { background: #d1fae5; color: #065f46; }

.item-chip { display: inline-block; font-size: 11px; background: var(--bg); border: 1px solid var(--border); border-radius: 6px; padding: 2px 7px; margin: 2px; font-family: monospace; }

.col-date { color: var(--text-muted); font-size: 13px; white-space: nowrap; }
.col-ref { font-family: monospace; font-size: 12px; color: var(--text-muted); }
.col-muted { color: var(--text-muted); font-size: 13px; }
.col-notes { color: var(--text-muted); font-size: 13px; max-width: 180px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.detail-row { display: flex; gap: 16px; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border); }
.detail-label { font-size: 13px; color: var(--text-muted); width: 80px; flex-shrink: 0; }

.table-skeleton { display: flex; flex-direction: column; gap: 8px; padding: 16px; }
.skeleton-row { height: 44px; border-radius: 8px; background: var(--border); animation: pulse 1.2s ease-in-out infinite; }
@keyframes pulse { 0%,100% { opacity: .6 } 50% { opacity: .25 } }
</style>
