<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Clients &amp; Subscriptions</h1>
        <p class="page-sub">Every store's current plan, status and invoices.</p>
      </div>
      <div class="header-right">
        <div class="search-wrap">
          <Search :size="14" class="search-icon" />
          <input v-model="search" class="search-input" placeholder="Search store or owner…" @input="onSearch" />
        </div>
        <select v-model="statusFilter" class="form-input" style="width:140px;" @change="fetchSubs">
          <option value="">All statuses</option>
          <option value="TRIAL">Trial</option>
          <option value="ACTIVE">Active</option>
          <option value="PAST_DUE">Past Due</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button class="tab" :class="{ active: tab === 'clients' }"  @click="tab = 'clients'">Clients</button>
      <button class="tab" :class="{ active: tab === 'invoices' }" @click="tab = 'invoices'; fetchInvoices()">Invoices</button>
    </div>

    <!-- CLIENTS tab -->
    <div v-show="tab === 'clients'" class="table-wrap">
      <div v-if="loading" class="table-skeleton">
        <div v-for="i in 5" :key="i" class="skeleton-row" />
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Store</th>
            <th>Owner</th>
            <th>Plan</th>
            <th>Status</th>
            <th>Period</th>
            <th style="width:130px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!subs.length">
            <td colspan="6" class="table-empty">No subscriptions match.</td>
          </tr>
          <tr v-for="s in subs" :key="s.id" class="table-row">
            <td>
              <div style="display:flex;align-items:center;gap:10px;">
                <div class="mini-avatar">{{ (s.store?.name || '?').charAt(0).toUpperCase() }}</div>
                <div>
                  <div style="font-weight:600;">{{ s.store?.name }}</div>
                  <div v-if="s.custom_label" style="font-size:11px;color:var(--admin-accent);">{{ s.custom_label }}</div>
                </div>
              </div>
            </td>
            <td style="font-size:12.5px;color:var(--text-secondary);">{{ s.store?.owner_username || '—' }}</td>
            <td>
              <span class="plan-pill">{{ s.display_label }}</span>
              <div v-if="s.custom_label" style="font-size:10.5px;color:var(--text-muted);margin-top:2px;">({{ s.plan_name }})</div>
            </td>
            <td><span class="status-pill" :class="'status-' + s.status.toLowerCase()">{{ s.status }}</span></td>
            <td style="font-size:12px;color:var(--text-secondary);">
              <span v-if="s.period_start || s.period_end">{{ s.period_start || '—' }} → {{ s.period_end || '—' }}</span>
              <span v-else>—</span>
            </td>
            <td>
              <button class="row-action" title="Manage" @click="openEdit(s)"><Pencil :size="13" /></button>
              <button class="row-action" title="Issue invoice" @click="openIssue(s)"><FilePlus :size="13" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- INVOICES tab -->
    <div v-show="tab === 'invoices'" class="table-wrap">
      <div v-if="invoicesLoading" class="table-skeleton">
        <div v-for="i in 5" :key="i" class="skeleton-row" />
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Store</th>
            <th>Plan</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Issued</th>
            <th>Due</th>
            <th style="width:130px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!invoices.length">
            <td colspan="8" class="table-empty">No invoices yet.</td>
          </tr>
          <tr v-for="inv in invoices" :key="inv.id" class="table-row">
            <td style="font-family:ui-monospace,monospace;font-size:12px;">{{ inv.invoice_number || '(draft)' }}</td>
            <td>{{ inv.store_name }}</td>
            <td>{{ inv.subscription?.display_label || inv.subscription?.plan_name }}</td>
            <td style="font-variant-numeric:tabular-nums;">{{ inv.amount }} {{ inv.currency }}</td>
            <td><span class="status-pill" :class="'inv-' + inv.status.toLowerCase()">{{ inv.status }}</span></td>
            <td style="font-size:12px;color:var(--text-secondary);">{{ inv.issued_at ? formatDate(inv.issued_at) : '—' }}</td>
            <td style="font-size:12px;color:var(--text-secondary);">{{ inv.due_at || '—' }}</td>
            <td>
              <button v-if="inv.status === 'ISSUED'" class="row-action" title="Mark paid" @click="markPaid(inv)"><CheckCircle :size="13" /></button>
              <button v-if="inv.status !== 'PAID' && inv.status !== 'VOID'" class="row-action" title="Void" @click="voidInvoice(inv)"><XCircle :size="13" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit subscription modal -->
    <AppModal :open="editModal.open" title="Manage Subscription" @close="closeEdit">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">Plan</label>
          <select v-model="editModal.plan" class="form-input">
            <option v-for="p in plans" :key="p.id" :value="p.id" :disabled="!p.is_active">
              {{ p.name }}{{ p.is_active ? '' : ' (disabled)' }}
            </option>
          </select>
        </div>
        <div>
          <label class="form-label">Custom label <span class="hint">(per-tenant override — blank uses plan name)</span></label>
          <input v-model="editModal.custom_label" class="form-input" placeholder="e.g. Hossam Special — free forever" />
        </div>
        <div>
          <label class="form-label">Status</label>
          <select v-model="editModal.status" class="form-input">
            <option value="TRIAL">Trial</option>
            <option value="ACTIVE">Active</option>
            <option value="PAST_DUE">Past Due</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
          <div>
            <label class="form-label">Period start</label>
            <input v-model="editModal.period_start" type="date" class="form-input" />
          </div>
          <div>
            <label class="form-label">Period end</label>
            <input v-model="editModal.period_end" type="date" class="form-input" />
          </div>
          <div>
            <label class="form-label">Trial ends</label>
            <input v-model="editModal.trial_ends_at" type="date" class="form-input" />
          </div>
        </div>
        <div>
          <label class="form-label">Internal notes <span class="hint">(never shown to tenant)</span></label>
          <textarea v-model="editModal.notes" rows="2" class="form-input" />
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="closeEdit">Cancel</button>
        <button class="btn-admin" :disabled="saving" @click="saveEdit">
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </template>
    </AppModal>

    <!-- Issue invoice modal -->
    <AppModal :open="issueModal.open" :title="'Issue invoice — ' + (issueModal.storeName || '')" @close="closeIssue">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div style="display:grid;grid-template-columns:1fr 120px;gap:10px;">
          <div>
            <label class="form-label">Amount <span class="req">*</span></label>
            <input v-model="issueModal.amount" type="number" min="0" step="0.01" class="form-input" />
          </div>
          <div>
            <label class="form-label">Currency</label>
            <input v-model="issueModal.currency" class="form-input" />
          </div>
        </div>
        <div>
          <label class="form-label">Line description</label>
          <input v-model="issueModal.line_description" class="form-input" placeholder="e.g. May 2026 — GO plan" />
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
          <div>
            <label class="form-label">Period start</label>
            <input v-model="issueModal.period_start" type="date" class="form-input" />
          </div>
          <div>
            <label class="form-label">Period end</label>
            <input v-model="issueModal.period_end" type="date" class="form-input" />
          </div>
          <div>
            <label class="form-label">Due</label>
            <input v-model="issueModal.due_at" type="date" class="form-input" />
          </div>
        </div>
        <div>
          <label class="form-label">Internal notes</label>
          <textarea v-model="issueModal.notes" rows="2" class="form-input" />
        </div>
        <p class="step-help">When issued, the invoice lands in the store owner's inbox immediately.</p>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="closeIssue">Cancel</button>
        <button class="btn-admin" :disabled="!Number(issueModal.amount) || saving" @click="issueInvoice">
          {{ saving ? 'Issuing…' : 'Issue invoice' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Pencil, FilePlus, CheckCircle, XCircle } from 'lucide-vue-next'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'

const tab = ref('clients')

const subs = ref([])
const plans = ref([])
const invoices = ref([])
const loading = ref(false)
const invoicesLoading = ref(false)
const saving = ref(false)
const search = ref('')
const statusFilter = ref('')

let searchTimer = null
function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(fetchSubs, 300)
}

async function fetchSubs() {
  loading.value = true
  try {
    const res = await api.get('/api/admin/billing/subscriptions/', {
      params: {
        ...(search.value ? { search: search.value } : {}),
        ...(statusFilter.value ? { status: statusFilter.value } : {}),
      },
    })
    subs.value = Array.isArray(res.data) ? res.data : (res.data.results || [])
  } catch { subs.value = [] } finally { loading.value = false }
}

async function fetchPlans() {
  try {
    const res = await api.get('/api/admin/billing/plans/')
    plans.value = Array.isArray(res.data) ? res.data : (res.data.results || [])
  } catch { plans.value = [] }
}

async function fetchInvoices() {
  invoicesLoading.value = true
  try {
    const res = await api.get('/api/admin/billing/invoices/')
    invoices.value = Array.isArray(res.data) ? res.data : (res.data.results || [])
  } catch { invoices.value = [] } finally { invoicesLoading.value = false }
}

// --- Edit subscription ---
const editModal = reactive({
  open: false, id: null, plan: null, custom_label: '', status: 'ACTIVE',
  period_start: '', period_end: '', trial_ends_at: '', notes: '',
})

function openEdit(s) {
  Object.assign(editModal, {
    open: true,
    id: s.id,
    plan: s.plan,
    custom_label: s.custom_label || '',
    status: s.status,
    period_start: s.period_start || '',
    period_end:   s.period_end || '',
    trial_ends_at:s.trial_ends_at || '',
    notes: s.notes || '',
  })
}
function closeEdit() { editModal.open = false }
async function saveEdit() {
  saving.value = true
  try {
    await api.patch(`/api/admin/billing/subscriptions/${editModal.id}/`, {
      plan: editModal.plan,
      custom_label: editModal.custom_label,
      status: editModal.status,
      period_start: editModal.period_start || null,
      period_end:   editModal.period_end || null,
      trial_ends_at:editModal.trial_ends_at || null,
      notes: editModal.notes,
    })
    closeEdit()
    fetchSubs()
  } catch (e) {
    alert(e.response?.data ? JSON.stringify(e.response.data) : 'Error saving subscription')
  } finally { saving.value = false }
}

// --- Issue invoice ---
const issueModal = reactive({
  open: false, storeId: null, storeName: '',
  amount: '0', currency: 'EGP',
  line_description: '', period_start: '', period_end: '', due_at: '', notes: '',
})
function openIssue(s) {
  Object.assign(issueModal, {
    open: true, storeId: s.store.id, storeName: s.store.name,
    amount: '0', currency: 'EGP',
    line_description: '', period_start: '', period_end: '', due_at: '', notes: '',
  })
}
function closeIssue() { issueModal.open = false }
async function issueInvoice() {
  saving.value = true
  try {
    await api.post('/api/admin/billing/invoices/', {
      store: issueModal.storeId,
      amount: Number(issueModal.amount),
      currency: issueModal.currency || 'EGP',
      line_description: issueModal.line_description,
      period_start: issueModal.period_start || null,
      period_end:   issueModal.period_end || null,
      due_at:       issueModal.due_at || null,
      notes:        issueModal.notes,
    })
    closeIssue()
    if (tab.value === 'invoices') fetchInvoices()
  } catch (e) {
    alert(e.response?.data ? JSON.stringify(e.response.data) : 'Error issuing invoice')
  } finally { saving.value = false }
}

// --- Invoice actions ---
async function markPaid(inv) {
  const reference = prompt('Payment reference (optional)') || ''
  try {
    await api.post(`/api/admin/billing/invoices/${inv.id}/mark-paid/`, { reference })
    fetchInvoices()
  } catch (e) { alert('Error marking paid') }
}
async function voidInvoice(inv) {
  if (!confirm(`Void ${inv.invoice_number}? This can't be undone.`)) return
  try {
    await api.post(`/api/admin/billing/invoices/${inv.id}/void/`)
    fetchInvoices()
  } catch (e) {
    alert(e.response?.data?.detail || 'Error voiding invoice')
  }
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(() => {
  fetchSubs()
  fetchPlans()
})
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
.page-title  { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub    { font-size:13px; color:var(--text-muted); margin:2px 0 0; }
.header-right{ display:flex; align-items:center; gap:10px; }

.search-wrap  { position:relative; }
.search-icon  { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none; }
.search-input { padding:7px 12px 7px 30px; border:1px solid var(--border); border-radius:8px; background:var(--bg-card); color:var(--text-primary); font-size:13px; width:220px; outline:none; transition:border-color 120ms; }
.search-input:focus { border-color:var(--admin-accent); }

.tabs { display:flex; gap:4px; margin-bottom:16px; border-bottom:1px solid var(--border); }
.tab  { background:none; border:none; padding:10px 16px; font-size:13px; font-weight:600; color:var(--text-muted); cursor:pointer; border-bottom:2px solid transparent; transition:color 120ms, border-color 120ms; }
.tab:hover  { color:var(--text-primary); }
.tab.active { color:var(--admin-accent); border-bottom-color:var(--admin-accent); }

.table-wrap { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.data-table { width:100%; border-collapse:collapse; font-size:13px; }
.data-table thead th { padding:10px 14px; text-align:left; font-size:11.5px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); background:var(--bg-app); border-bottom:1px solid var(--border); }
.data-table tbody tr.table-row { border-bottom:1px solid var(--border); transition:background 100ms; }
.data-table tbody tr.table-row:last-child { border-bottom:none; }
.data-table tbody tr.table-row:hover { background:var(--bg-app); }
.data-table tbody td { padding:10px 14px; color:var(--text-primary); vertical-align:top; }
.table-empty { text-align:center; padding:48px 20px; color:var(--text-muted); }
.table-skeleton { padding:8px 0; }
.skeleton-row { height:40px; margin:4px 16px; border-radius:6px; background:linear-gradient(90deg,var(--border) 25%,var(--bg-app) 50%,var(--border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position:-200% 0; } }

.mini-avatar { width:28px; height:28px; border-radius:7px; background:var(--admin-accent-soft); color:var(--admin-accent); font-weight:700; display:flex; align-items:center; justify-content:center; font-size:12px; }
.plan-pill   { display:inline-block; padding:2px 9px; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; background:rgba(239,68,68,0.15); color:var(--admin-accent); }

.status-pill { display:inline-block; padding:2px 9px; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; }
.status-trial    { background:#dbeafe; color:#1d4ed8; }
.status-active   { background:rgba(16,163,74,0.15); color:#16a34a; }
.status-past_due { background:rgba(245,158,11,0.15); color:#b45309; }
.status-cancelled{ background:#f3f4f6; color:#6b7280; }

.inv-draft  { background:#f3f4f6; color:#6b7280; }
.inv-issued { background:#dbeafe; color:#1d4ed8; }
.inv-paid   { background:rgba(16,163,74,0.15); color:#16a34a; }
.inv-void   { background:rgba(220,38,38,0.10); color:#b91c1c; }

.row-action { width:28px; height:28px; border:none; background:none; border-radius:6px; cursor:pointer; color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; transition:background 100ms,color 100ms; margin-right:4px; }
.row-action:hover { background:var(--admin-accent-soft); color:var(--admin-accent); }

.form-label  { display:block; font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.form-input  { width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; box-sizing:border-box; transition:border-color 120ms; font-family:inherit; }
.form-input:focus { border-color:var(--admin-accent); }
.req { color:#dc2626; font-weight:700; }
.hint{ color:var(--text-muted); font-weight:400; font-size:11px; }
.step-help { font-size:12px; color:var(--text-muted); margin:4px 0 0; line-height:1.5; }

.btn-ghost { display:inline-flex; align-items:center; gap:5px; padding:7px 12px; border-radius:8px; font-size:13px; font-weight:500; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; transition:background 100ms,color 100ms,transform 70ms; }
.btn-ghost:hover  { background:var(--border); color:var(--text-primary); }
.btn-ghost:active { transform:scale(0.95); }
</style>
