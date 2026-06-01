<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Sales</h1>
        <p class="page-sub">Invoices, payments, and customer sales</p>
      </div>
    </div>

    <div class="tab-bar">
      <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
        <component :is="tab.icon" :size="15" />
        {{ tab.label }}
      </button>
    </div>

    <!-- TAB: Invoices -->
    <div v-if="activeTab === 'invoices'">
      <div class="toolbar">
        <div class="search-wrap">
          <Search :size="14" class="search-icon" />
          <input v-model="search" class="form-input search-input" placeholder="Search customer, invoice #…" @input="debouncedFetch" />
        </div>
        <select v-model="statusFilter" class="form-input filter-select" @change="fetchInvoices(1)">
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="POSTED">Posted</option>
          <option value="VOID">Void</option>
        </select>
      </div>

      <div class="table-wrap">
        <div v-if="loading" class="table-skeleton">
          <div v-for="i in 8" :key="i" class="skeleton-row" />
        </div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Balance</th>
              <th style="width:70px;"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="invoices.length === 0">
              <td colspan="8" class="table-empty">
                <FileText :size="40" style="opacity:.2;margin-bottom:10px;" />
                <div style="font-size:15px;font-weight:700;color:var(--text-primary);">No invoices yet</div>
                <div style="font-size:13px;">Create a new invoice to record a sale.</div>
              </td>
            </tr>
            <tr v-for="inv in invoices" :key="inv.id" class="table-row">
              <td class="col-num">{{ inv.invoice_number ? `#${inv.invoice_number}` : '—' }}</td>
              <td>{{ fmtDate(inv.date) }}</td>
              <td class="col-name">{{ inv.customer_name || inv.customer }}</td>
              <td><span class="status-badge" :class="`status-${inv.status.toLowerCase()}`">{{ inv.status }}</span></td>
              <td class="col-amount"><Money :value="inv.grand_total" /></td>
              <td class="col-amount"><Money :value="inv.paid_amount" /></td>
              <td :class="balanceClass(inv)"><Money :value="inv.grand_total - inv.paid_amount" /></td>
              <td>
                <button v-if="inv.status === 'DRAFT'" class="row-action success" title="Post invoice" @click="postInvoice(inv)">
                  <CheckCircle :size="13" />
                </button>
                <button v-if="inv.status !== 'VOID'" class="row-action danger" title="Void" @click="voidInvoice(inv)">
                  <Ban :size="13" />
                </button>
                <button class="row-action" title="Print invoice" @click="printInvoice(inv)">
                  <Printer :size="13" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <AppPagination :page="page" :page-size="pageSize" :total="total" @update:page="fetchInvoices" />
    </div>

    <!-- MODAL: New Invoice -->
    <AppModal :open="modal.open" title="New Sales Invoice" width="720px" @close="closeModal">
      <div class="form-grid">
        <div>
          <label class="form-label">Customer</label>
          <select v-model="modal.customer" class="form-input">
            <option value="">Select customer…</option>
            <option v-for="c in customers" :key="c.id" :value="c.id">{{ c.name }} — {{ c.phone_number }}</option>
          </select>
        </div>
        <div>
          <label class="form-label">Date</label>
          <input v-model="modal.date" type="datetime-local" class="form-input" />
        </div>
        <div>
          <label class="form-label">Discount</label>
          <input v-model="modal.discount" type="number" min="0" step="0.01" class="form-input" placeholder="0.00" />
        </div>
        <div>
          <label class="form-label">Status</label>
          <select v-model="modal.status" class="form-input">
            <option value="DRAFT">Draft</option>
            <option value="POSTED">Post immediately</option>
          </select>
        </div>
      </div>

      <div style="margin-top:18px;">
        <div class="section-label">Items</div>
        <div v-for="(item, i) in modal.items" :key="i" class="item-row">
          <select v-model="item.variant" class="form-input item-variant">
            <option value="">Select variant…</option>
            <option v-for="v in variants" :key="v.id" :value="v.id">{{ v.product_name }} — {{ v.sku }}</option>
          </select>
          <input v-model="item.quantity" type="number" min="1" step="1" class="form-input item-qty" placeholder="Qty" />
          <input v-model="item.unit_price" type="number" min="0" step="0.01" class="form-input item-price" placeholder="Price" />
          <button class="row-action danger" @click="modal.items.splice(i, 1)"><Trash2 :size="13" /></button>
        </div>
        <button class="btn-ghost" style="margin-top:8px;" @click="modal.items.push({ variant: '', quantity: 1, unit_price: '', tax_amount: 0 })">
          <Plus :size="13" /> Add Item
        </button>
      </div>

      <div class="invoice-totals">
        <div class="totals-row"><span>Subtotal</span><span><Money :value="modalSubtotal" /></span></div>
        <div class="totals-row"><span>Discount</span><span>- <Money :value="modal.discount || 0" /></span></div>
        <div class="totals-row total-line"><span>Total</span><span><Money :value="modalSubtotal - (modal.discount || 0)" /></span></div>
      </div>

      <template #footer>
        <button class="btn-ghost" @click="closeModal">Cancel</button>
        <button class="btn-primary" :disabled="saving || !modal.customer || modal.items.length === 0" @click="saveInvoice">
          {{ saving ? 'Saving…' : 'Save Invoice' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { FileText, Search, CheckCircle, Ban, Trash2, Plus, Receipt, RotateCcw, Printer } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import { useQABStore } from '@/stores/qab'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { formatNumber } from '@/utils/format'

const auth = useAuthStore()
const qab  = useQABStore()
const router = useRouter()

function printInvoice(inv) {
  router.push(`/finance/invoices/${inv.id}/print`)
}

const tabs = [
  { id: 'invoices', label: 'Invoices', icon: Receipt },
  { id: 'returns',  label: 'Returns',  icon: RotateCcw },
]
const activeTab = ref('invoices')

// ── LIST ────────────────────────────────────────────────
const invoices     = ref([])
const loading      = ref(false)
const total        = ref(0)
const page         = ref(1)
const pageSize     = 20
const search       = ref('')
const statusFilter = ref('')
const customers    = ref([])
const variants     = ref([])

async function fetchInvoices(p = 1) {
  loading.value = true
  page.value = p
  try {
    const params = { page: p, page_size: pageSize }
    if (search.value)       params.search = search.value
    if (statusFilter.value) params.status = statusFilter.value
    const res = await api.get('/api/finance/invoices/', { params })
    invoices.value = res.data.results ?? res.data
    total.value    = res.data.count ?? invoices.value.length
  } catch { invoices.value = [] } finally { loading.value = false }
}

async function fetchCustomers() {
  try {
    const res = await api.get('/api/auth/customers/')
    customers.value = res.data.results ?? res.data
  } catch {}
}

async function fetchVariants() {
  try {
    const res = await api.get('/api/inventory/variants/', { params: { page_size: 200 } })
    variants.value = res.data.results ?? res.data
  } catch {}
}

let searchTimer = null
function debouncedFetch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchInvoices(1), 300)
}

// ── ACTIONS ─────────────────────────────────────────────
async function postInvoice(inv) {
  if (!confirm(`Post invoice for ${inv.customer_name || inv.customer}?`)) return
  await api.patch(`/api/finance/invoices/${inv.id}/`, { status: 'POSTED' })
  fetchInvoices(page.value)
}

async function voidInvoice(inv) {
  if (!confirm('Void this invoice? This cannot be undone.')) return
  await api.post(`/api/finance/invoices/${inv.id}/void/`)
  fetchInvoices(page.value)
}

// ── MODAL ───────────────────────────────────────────────
const saving = ref(false)
const modal  = reactive({
  open: false, customer: '', date: '', discount: 0, status: 'DRAFT',
  items: [],
})

const modalSubtotal = computed(() =>
  modal.items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unit_price) || 0), 0)
)

function openModal() {
  const now = new Date()
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
  Object.assign(modal, {
    open: true, customer: '', date: now.toISOString().slice(0, 16),
    discount: 0, status: 'DRAFT', items: [],
  })
}

function closeModal() { modal.open = false }

async function saveInvoice() {
  saving.value = true
  try {
    const payload = {
      customer: modal.customer,
      branch: auth.user?.store?.id,
      date: modal.date,
      discount: modal.discount || 0,
      status: modal.status,
      items: modal.items.map(i => ({
        variant: i.variant,
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price),
        tax_amount: 0,
      })),
    }
    await api.post('/api/finance/invoices/', payload)
    closeModal()
    fetchInvoices(1)
  } catch (e) {
    alert(e.response?.data?.detail || 'Failed to save invoice.')
  } finally {
    saving.value = false
  }
}

// ── HELPERS ─────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
function balanceClass(inv) {
  const bal = inv.grand_total - inv.paid_amount
  return bal > 0.01 ? 'col-balance-due' : 'col-balance-paid'
}

// ── INIT ────────────────────────────────────────────────
onMounted(() => {
  qab.setActions([{ id: 'new', label: 'New Invoice', icon: 'plus', handler: openModal }])
  fetchInvoices()
  fetchCustomers()
  fetchVariants()
})
onUnmounted(() => qab.clearActions())
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; }
.page-title  { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub    { font-size:13px; color:var(--text-muted); margin:2px 0 0; }

.tab-bar { display:flex; gap:2px; border-bottom:1px solid var(--border); margin-bottom:20px; }
.tab-btn { display:flex; align-items:center; gap:6px; padding:9px 16px; font-size:13.5px; font-weight:500; color:var(--text-muted); border:none; background:none; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; transition:color 120ms,border-color 120ms; }
.tab-btn:hover  { color:var(--text-primary); }
.tab-btn.active { color:var(--accent); border-bottom-color:var(--accent); font-weight:600; }

.toolbar { display:flex; align-items:center; gap:8px; margin-bottom:14px; flex-wrap:wrap; }
.search-wrap  { position:relative; flex:1; min-width:200px; max-width:320px; }
.search-icon  { position:absolute; left:11px; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none; }
.search-input { padding-left:32px !important; }
.filter-select { max-width:160px; }

.table-wrap { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.data-table { width:100%; border-collapse:collapse; font-size:13px; }
.data-table thead th { padding:10px 14px; text-align:left; font-size:11.5px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); background:var(--bg-app); border-bottom:1px solid var(--border); white-space:nowrap; }
.data-table tbody tr.table-row { border-bottom:1px solid var(--border); transition:background 100ms; }
.data-table tbody tr.table-row:last-child { border-bottom:none; }
.data-table tbody tr.table-row:hover { background:var(--bg-app); }
.data-table tbody td { padding:10px 14px; color:var(--text-primary); }
.table-empty { text-align:center; padding:48px 20px; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; }
.table-skeleton { padding:8px 0; }
.skeleton-row { height:40px; margin:4px 16px; border-radius:6px; background:linear-gradient(90deg,var(--border) 25%,var(--bg-app) 50%,var(--border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position:-200% 0; } }

.col-num     { font-family:monospace; font-size:12px; font-weight:600; color:var(--text-secondary); }
.col-name    { font-weight:500; }
.col-amount  { font-variant-numeric:tabular-nums; }
.col-balance-due  { color:#dc2626; font-weight:600; font-variant-numeric:tabular-nums; }
.col-balance-paid { color:#16a34a; font-variant-numeric:tabular-nums; }

.status-badge { display:inline-flex; align-items:center; padding:2px 8px; border-radius:9999px; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; }
.status-draft  { background:#fef3c7; color:#92400e; }
.status-posted { background:#dcfce7; color:#15803d; }
.status-void   { background:#f3f4f6; color:#6b7280; }

.row-action { width:28px; height:28px; border:none; background:none; border-radius:6px; cursor:pointer; color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; transition:background 100ms,color 100ms; }
.row-action:hover        { background:var(--border); color:var(--text-primary); }
.row-action.success:hover { background:#dcfce7; color:#16a34a; }
.row-action.danger:hover  { background:#fee2e2; color:#dc2626; }

/* Modal form */
.form-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.form-label { display:block; font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.section-label { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text-muted); margin-bottom:10px; }

.item-row { display:flex; gap:8px; align-items:center; margin-bottom:8px; }
.item-variant { flex:2; min-width:0; }
.item-qty     { width:70px; flex-shrink:0; }
.item-price   { width:100px; flex-shrink:0; }

.invoice-totals { margin-top:18px; border-top:1px solid var(--border); padding-top:14px; display:flex; flex-direction:column; align-items:flex-end; gap:6px; }
.totals-row { display:flex; gap:32px; font-size:13px; color:var(--text-secondary); }
.totals-row span:last-child { font-variant-numeric:tabular-nums; min-width:90px; text-align:right; }
.total-line { font-size:15px; font-weight:700; color:var(--text-primary); }

.btn-ghost { display:inline-flex; align-items:center; gap:5px; padding:7px 12px; border-radius:8px; font-size:13px; font-weight:500; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; transition:background 100ms,color 100ms,transform 70ms; }
.btn-ghost:hover  { background:var(--border); color:var(--text-primary); }
.btn-ghost:active { transform:scale(0.95); }
.btn-primary { display:inline-flex; align-items:center; gap:5px; padding:8px 16px; border-radius:8px; font-size:13px; font-weight:600; border:none; background:var(--accent); color:#fff; cursor:pointer; transition:background 100ms,transform 70ms,opacity 100ms; }
.btn-primary:hover    { background:var(--accent-hover); }
.btn-primary:active   { transform:scale(0.95); }
.btn-primary:disabled { opacity:.5; cursor:default; }
</style>
