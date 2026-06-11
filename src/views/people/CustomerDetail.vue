<template>
  <div>
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="$router.back()">
          <ChevronLeft :size="16" /> Back
        </button>
        <div v-if="customer">
          <h1 class="page-title">{{ customer.name }}</h1>
          <p class="page-sub">{{ customer.phone_number || '—' }}</p>
        </div>
        <div v-else class="page-title">Customer</div>
      </div>
      <div v-if="customer" class="header-right">
        <button class="btn-secondary" @click="openEdit"><Pencil :size="14" /> Edit</button>
      </div>
    </div>

    <div v-if="loading" class="skeleton-block" />
    <div v-else-if="!customer" class="empty-state">Customer not found.</div>
    <div v-else class="detail-layout">

      <!-- Info card -->
      <div class="info-card">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Phone</div>
            <div class="info-value">{{ customer.phone_number || '—' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Balance</div>
            <div class="info-value">
              <span v-if="Number(customer.balance) > 0" class="badge-owe">Owes <Money :value="customer.balance" /></span>
              <span v-else-if="Number(customer.balance) < 0" class="badge-credit">Credit <Money :value="Math.abs(Number(customer.balance))" /></span>
              <span v-else>—</span>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">Credit Limit</div>
            <div class="info-value"><Money v-if="customer.credit_limit" :value="customer.credit_limit" /> <span v-else class="text-muted">Store default</span></div>
          </div>
          <div class="info-item">
            <div class="info-label">Store Credit</div>
            <div class="info-value"><Money v-if="Number(customer.store_credit) > 0" :value="customer.store_credit" /> <span v-else class="text-muted">None</span></div>
          </div>
          <div class="info-item">
            <div class="info-label">Notes</div>
            <div class="info-value">{{ customer.notes || '—' }}</div>
          </div>
        </div>
      </div>

      <!-- Invoices -->
      <div class="section-card">
        <div class="section-header">
          <h2 class="section-title">Invoice History</h2>
          <span class="count-badge">{{ total }}</span>
        </div>
        <div v-if="invLoading" class="table-skeleton"><div v-for="i in 5" :key="i" class="skeleton-row" /></div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Date</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Balance</th>
              <th>Method</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="invoices.length === 0">
              <td colspan="7" class="table-empty">No invoices yet.</td>
            </tr>
            <tr v-for="inv in invoices" :key="inv.id" class="table-row" @click="goInvoice(inv.id)">
              <td class="mono">{{ inv.invoice_number || '—' }}</td>
              <td class="text-muted">{{ fmtDate(inv.date) }}</td>
              <td><Money :value="inv.grand_total" /></td>
              <td><Money :value="inv.paid_amount" /></td>
              <td>
                <span v-if="Number(inv.grand_total) - Number(inv.paid_amount) > 0" class="badge-owe"><Money :value="Number(inv.grand_total) - Number(inv.paid_amount)" /></span>
                <span v-else class="badge-paid">Paid</span>
              </td>
              <td class="text-muted">{{ inv.payment_method || '—' }}</td>
              <td><span class="status-pill" :class="'s-' + inv.status.toLowerCase()">{{ inv.status }}</span></td>
            </tr>
          </tbody>
        </table>
        <AppPagination :page="page" :page-size="pageSize" :total="total" @update:page="fetchInvoices" />
      </div>
    </div>

    <!-- Edit modal (reuse Customers.vue logic inline) -->
    <AppModal :open="editModal.open" title="Edit Customer" @close="editModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">Name *</label>
          <input v-model="editModal.name" class="form-input" />
        </div>
        <div>
          <label class="form-label">Phone</label>
          <input v-model="editModal.phone" class="form-input" />
        </div>
        <div>
          <label class="form-label">Credit Limit</label>
          <input v-model="editModal.credit_limit" class="form-input" type="number" placeholder="Leave blank for store default" />
        </div>
        <div>
          <label class="form-label">Notes</label>
          <textarea v-model="editModal.notes" class="form-input" rows="2" />
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="editModal.open = false">Cancel</button>
        <button class="btn-primary" :disabled="editModal.saving" @click="saveEdit">{{ editModal.saving ? 'Saving…' : 'Save' }}</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronLeft, Pencil } from 'lucide-vue-next'
import api from '@/api/axios'
import Money from '@/components/ui/Money.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppPagination from '@/components/ui/AppPagination.vue'

const props = defineProps({ id: String })
const router = useRouter()

const customer = ref(null)
const loading = ref(true)
const invoices = ref([])
const invLoading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const editModal = reactive({ open: false, name: '', phone: '', credit_limit: '', notes: '', saving: false })

async function fetchCustomer() {
  loading.value = true
  try {
    const r = await api.get(`/api/auth/customers/${props.id}/`)
    customer.value = r.data
  } catch { customer.value = null }
  finally { loading.value = false }
}

async function fetchInvoices(p = 1) {
  page.value = p
  invLoading.value = true
  try {
    const r = await api.get(`/api/auth/customers/${props.id}/invoices/`, { params: { page: p } })
    invoices.value = r.data.results || []
    total.value = r.data.count || 0
  } catch { invoices.value = [] }
  finally { invLoading.value = false }
}

function openEdit() {
  editModal.name = customer.value.name
  editModal.phone = customer.value.phone_number || ''
  editModal.credit_limit = customer.value.credit_limit || ''
  editModal.notes = customer.value.notes || ''
  editModal.open = true
}

async function saveEdit() {
  editModal.saving = true
  try {
    const r = await api.patch(`/api/auth/customers/${props.id}/`, {
      name: editModal.name,
      phone_number: editModal.phone,
      credit_limit: editModal.credit_limit || null,
      notes: editModal.notes,
    })
    customer.value = r.data
    editModal.open = false
  } catch {} finally { editModal.saving = false }
}

function goInvoice(id) {
  router.push(`/finance/invoices?highlight=${id}`)
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(() => { fetchCustomer(); fetchInvoices() })
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
.header-left { display:flex; align-items:flex-start; gap:12px; }
.back-btn { display:inline-flex; align-items:center; gap:4px; padding:6px 10px; border-radius:8px; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; font-size:13px; font-weight:500; transition:background 100ms; margin-top:2px; }
.back-btn:hover { background:var(--border); }
.page-title { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub { font-size:13px; color:var(--text-muted); margin:2px 0 0; }

.detail-layout { display:flex; flex-direction:column; gap:20px; }
.skeleton-block { height:200px; border-radius:12px; background:var(--border); }
.empty-state { text-align:center; padding:60px 20px; color:var(--text-muted); }

.info-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:20px 22px; }
.info-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:16px; }
.info-item {}
.info-label { font-size:11px; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); font-weight:600; }
.info-value { font-size:14px; color:var(--text-primary); margin-top:3px; }
.text-muted { color:var(--text-muted); }

.section-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.section-header { display:flex; align-items:center; gap:10px; padding:14px 18px; border-bottom:1px solid var(--border); }
.section-title { font-size:15px; font-weight:600; color:var(--text-primary); margin:0; }
.count-badge { padding:2px 8px; border-radius:20px; background:var(--border); font-size:12px; font-weight:600; color:var(--text-muted); }

.data-table { width:100%; border-collapse:collapse; font-size:13px; }
.data-table thead th { padding:9px 14px; text-align:left; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); background:var(--bg-app); border-bottom:1px solid var(--border); }
.data-table tbody tr.table-row { border-bottom:1px solid var(--border); cursor:pointer; transition:background 100ms; }
.data-table tbody tr.table-row:last-child { border-bottom:none; }
.data-table tbody tr.table-row:hover { background:var(--bg-app); }
.data-table tbody td { padding:10px 14px; color:var(--text-primary); }
.table-empty { text-align:center; padding:40px 20px; color:var(--text-muted); }
.table-skeleton { padding:8px 0; }
.skeleton-row { height:38px; margin:4px 16px; border-radius:6px; background:linear-gradient(90deg,var(--border) 25%,var(--bg-app) 50%,var(--border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position:-200% 0; } }
.mono { font-family:ui-monospace,monospace; font-size:12px; }
.text-muted { color:var(--text-muted); font-size:12px; }

.badge-owe { display:inline-block; padding:2px 8px; border-radius:20px; background:rgba(220,38,38,0.10); color:#dc2626; font-size:12px; font-weight:600; }
.badge-credit { display:inline-block; padding:2px 8px; border-radius:20px; background:rgba(16,163,74,0.10); color:#16a34a; font-size:12px; font-weight:600; }
.badge-paid { display:inline-block; padding:2px 8px; border-radius:20px; background:rgba(16,163,74,0.10); color:#16a34a; font-size:12px; font-weight:600; }

.status-pill { display:inline-block; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
.s-posted { background:rgba(16,163,74,0.12); color:#16a34a; }
.s-draft  { background:var(--border); color:var(--text-muted); }
.s-void   { background:rgba(220,38,38,0.10); color:#dc2626; }

.header-right { display:flex; align-items:center; gap:8px; }
.form-label { font-size:12px; font-weight:600; color:var(--text-secondary); text-transform:uppercase; letter-spacing:.04em; display:block; margin-bottom:6px; }
.form-input { width:100%; padding:8px 11px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; box-sizing:border-box; outline:none; }
.form-input:focus { border-color:var(--accent); }
</style>
