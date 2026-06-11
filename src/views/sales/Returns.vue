<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Returns</h1>
        <p class="page-sub">Customer refund invoices and stock returns</p>
      </div>
      <button class="btn-primary" @click="openModal"><Plus :size="14" /> New Return</button>
    </div>

    <div class="table-wrap">
      <div v-if="loading" class="table-skeleton">
        <div v-for="i in 6" :key="i" class="skeleton-row" />
      </div>
      <table v-else class="data-table">
        <thead>
          <tr><th>#</th><th>Date</th><th>Customer</th><th>Original Invoice</th><th>Total Refunded</th><th>Fee</th><th>Net</th><th>Method</th><th>Reason</th></tr>
        </thead>
        <tbody>
          <tr v-if="refunds.length === 0">
            <td colspan="9" class="table-empty">
              <RotateCcw :size="32" style="opacity:.3;margin-bottom:8px;" />
              <div>No returns yet</div>
            </td>
          </tr>
          <tr v-for="r in refunds" :key="r.id" class="table-row">
            <td class="col-num">#{{ r.refund_number }}</td>
            <td>{{ fmtDate(r.date) }}</td>
            <td class="col-name">{{ r.customer_name || r.customer }}</td>
            <td class="col-ref">{{ r.original_invoice ? `#${r.original_invoice}` : '—' }}</td>
            <td class="col-refund"><Money :value="r.total_refunded" /></td>
            <td class="col-fee">{{ Number(r.restocking_fee) > 0 ? '' : '—' }}<Money v-if="Number(r.restocking_fee) > 0" :value="r.restocking_fee" /></td>
            <td class="col-refund"><Money :value="r.net_refund" /></td>
            <td><span class="method-pill" :class="r.refund_method === 'STORE_CREDIT' ? 'credit' : 'cash'">{{ r.refund_method === 'STORE_CREDIT' ? 'Store Credit' : 'Cash' }}</span></td>
            <td class="col-reason">{{ r.reason || '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <AppPagination :page="page" :page-size="pageSize" :total="total" @update:page="fetchRefunds" />

    <!-- MODAL: New Return -->
    <AppModal :open="modal.open" title="New Return" width="720px" @close="closeModal">
      <div class="form-grid">
        <div>
          <label class="form-label">Customer</label>
          <select v-model="modal.customer" class="form-input">
            <option value="">Select customer…</option>
            <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
        <div>
          <label class="form-label">Original Invoice # (optional)</label>
          <select v-model="modal.original_invoice" class="form-input">
            <option value="">None</option>
            <option v-for="inv in invoices" :key="inv.id" :value="inv.id">#{{ inv.invoice_number }} — {{ inv.customer_name }}</option>
          </select>
        </div>
        <div v-if="branches.length > 1">
          <label class="form-label">Branch</label>
          <select v-model="modal.branch" class="form-input">
            <option v-for="b in branches" :key="b.id" :value="b.id">{{ b.name }}</option>
          </select>
        </div>
        <div>
          <label class="form-label">Refund Method</label>
          <div style="display:flex;gap:8px;">
            <button type="button" class="mode-btn" :class="{ active: modal.refund_method === 'CASH' }" @click="modal.refund_method = 'CASH'">Cash</button>
            <button type="button" class="mode-btn" :class="{ active: modal.refund_method === 'STORE_CREDIT' }" @click="modal.refund_method = 'STORE_CREDIT'">Store Credit</button>
          </div>
        </div>
        <div style="grid-column:1/-1;">
          <label class="form-label">Reason</label>
          <textarea v-model="modal.reason" class="form-input" rows="2" placeholder="Why is this being returned?" />
        </div>
      </div>
      <p v-if="restockingFeePercent > 0" class="fee-note">
        A {{ restockingFeePercent }}% restocking fee will be deducted from the payout.
      </p>

      <div style="margin-top:18px;">
        <div class="section-label">Items to Return</div>
        <div v-for="(item, i) in modal.items" :key="i" class="item-row">
          <select v-model="item.variant" class="form-input item-variant">
            <option value="">Select variant…</option>
            <option v-for="v in variants" :key="v.id" :value="v.id">{{ v.product_name }} — {{ v.sku }}</option>
          </select>
          <input v-model="item.quantity" type="number" min="1" class="form-input item-qty" placeholder="Qty" />
          <input v-model="item.refund_amount" type="number" min="0" step="0.01" class="form-input item-price" placeholder="Refund" />
          <label class="restock-label">
            <input v-model="item.restock_inventory" type="checkbox" />
            Restock
          </label>
          <button class="row-action danger" @click="modal.items.splice(i, 1)"><Trash2 :size="13" /></button>
        </div>
        <button class="btn-ghost" style="margin-top:8px;" @click="modal.items.push({ variant: '', quantity: 1, refund_amount: '', restock_inventory: true })">
          <Plus :size="13" /> Add Item
        </button>
      </div>

      <template #footer>
        <button class="btn-ghost" @click="closeModal">Cancel</button>
        <button class="btn-primary" :disabled="saving || !modal.customer || modal.items.length === 0" @click="saveReturn">
          {{ saving ? 'Saving…' : 'Save Return' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { RotateCcw, Trash2, Plus } from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppModal from '@/components/ui/AppModal.vue'

const auth = useAuthStore()

const refunds   = ref([])
const customers = ref([])
const invoices  = ref([])
const variants  = ref([])
const branches  = ref([])
const restockingFeePercent = ref(0)
const loading   = ref(false)
const total     = ref(0)
const page      = ref(1)
const pageSize  = 20
const saving    = ref(false)

async function fetchRefunds(p = 1) {
  loading.value = true
  page.value = p
  try {
    const res = await api.get('/api/finance/refunds/', { params: { page: p, page_size: pageSize } })
    refunds.value = res.data.results ?? res.data
    total.value   = res.data.count ?? refunds.value.length
  } catch { refunds.value = [] } finally { loading.value = false }
}

async function fetchSupporting() {
  try {
    const [c, inv, v, b, s] = await Promise.all([
      api.get('/api/auth/customers/'),
      api.get('/api/finance/invoices/', { params: { status: 'POSTED', page_size: 100 } }),
      api.get('/api/inventory/variants/', { params: { page_size: 200 } }),
      api.get('/api/core/branches/'),
      api.get('/api/core/settings/'),
    ])
    customers.value = c.data.results ?? c.data
    invoices.value  = inv.data.results ?? inv.data
    variants.value  = v.data.results ?? v.data
    branches.value  = b.data.results ?? b.data
    restockingFeePercent.value = Number(s.data?.restocking_fee_percent || 0)
  } catch {}
}

const modal = reactive({
  open: false, customer: '', original_invoice: '', branch: '',
  refund_method: 'CASH', reason: '', items: [],
})

function defaultBranchId() {
  const main = branches.value.find(b => b.is_main_branch)
  return auth.user?.default_branch || main?.id || branches.value[0]?.id || ''
}

function openModal() {
  Object.assign(modal, {
    open: true, customer: '', original_invoice: '', branch: defaultBranchId(),
    refund_method: 'CASH', reason: '', items: [],
  })
}
function closeModal() { modal.open = false }

async function saveReturn() {
  if (!modal.branch) { alert('No branch available for this return.'); return }
  saving.value = true
  try {
    await api.post('/api/finance/refunds/', {
      customer: modal.customer,
      original_invoice: modal.original_invoice || null,
      branch: modal.branch,
      refund_method: modal.refund_method,
      reason: modal.reason,
      items: modal.items.map(i => ({
        variant: i.variant,
        quantity: Number(i.quantity),
        refund_amount: Number(i.refund_amount),
        restock_inventory: i.restock_inventory,
      })),
    })
    closeModal()
    fetchRefunds(1)
  } catch (e) {
    const d = e.response?.data
    alert(d?.detail || (d ? JSON.stringify(d) : 'Failed to save return.'))
  } finally {
    saving.value = false
  }
}

function fmtDate(d) { return d ? new Date(d).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' }) : '—' }

onMounted(() => {
  fetchRefunds()
  fetchSupporting()
})
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
.table-empty { text-align:center; padding:48px 20px; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; }
.table-skeleton { padding:8px 0; }
.skeleton-row { height:40px; margin:4px 16px; border-radius:6px; background:linear-gradient(90deg,var(--border) 25%,var(--bg-app) 50%,var(--border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position:-200% 0; } }

.col-num    { font-family:monospace; font-size:12px; font-weight:600; color:var(--text-secondary); }
.col-name   { font-weight:500; }
.col-ref    { font-family:monospace; font-size:12px; color:var(--text-muted); }
.col-refund { color:#dc2626; font-weight:600; font-variant-numeric:tabular-nums; }
.col-fee    { color:var(--text-muted); font-size:12px; font-variant-numeric:tabular-nums; }
.col-reason { color:var(--text-muted); font-size:12px; max-width:200px; }

.method-pill { display:inline-block; padding:2px 8px; border-radius:999px; font-size:11px; font-weight:600; }
.method-pill.cash   { background:var(--bg-app); color:var(--text-secondary); border:1px solid var(--border); }
.method-pill.credit { background:#fef3c7; color:#b45309; }

.mode-btn { padding:7px 14px; border-radius:8px; font-size:13px; font-weight:500; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; transition:all 100ms; }
.mode-btn.active { background:var(--accent); color:#fff; border-color:var(--accent); }

.fee-note { margin:14px 0 0; padding:8px 12px; background:#fef3c7; color:#b45309; border-radius:8px; font-size:12.5px; }

.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.form-label { display:block; font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.section-label { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text-muted); margin-bottom:10px; }

.item-row { display:flex; gap:8px; align-items:center; margin-bottom:8px; }
.item-variant { flex:2; min-width:0; }
.item-qty   { width:70px; flex-shrink:0; }
.item-price { width:100px; flex-shrink:0; }
.restock-label { display:flex; align-items:center; gap:4px; font-size:12px; color:var(--text-secondary); white-space:nowrap; cursor:pointer; }

.row-action { width:28px; height:28px; border:none; background:none; border-radius:6px; cursor:pointer; color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; transition:background 100ms,color 100ms; }
.row-action.danger:hover { background:#fee2e2; color:#dc2626; }

</style>
