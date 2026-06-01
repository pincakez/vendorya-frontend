<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Customers</h1>
        <p class="page-sub">Manage your customer list and track balances</p>
      </div>
      <div class="header-right">
        <div class="search-wrap">
          <Search :size="14" class="search-icon" />
          <input v-model="search" class="search-input" placeholder="Search name or phone…" @input="onSearch" />
        </div>
      </div>
    </div>

    <div class="table-wrap">
      <div v-if="loading" class="table-skeleton">
        <div v-for="i in 8" :key="i" class="skeleton-row" />
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Phone</th>
            <th>Notes</th>
            <th>Balance</th>
            <th style="width:80px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="customers.length === 0">
            <td colspan="5" class="table-empty">
              <Users :size="40" style="opacity:.2;margin-bottom:10px;" />
              <div style="font-size:15px;font-weight:700;color:var(--text-primary);">No customers yet</div>
              <div style="font-size:13px;">Add your first customer to start tracking sales.</div>
            </td>
          </tr>
          <tr v-for="c in customers" :key="c.id" class="table-row">
            <td class="col-name">{{ c.name }}</td>
            <td class="col-phone">{{ c.phone_number }}</td>
            <td class="col-notes">{{ c.notes || '—' }}</td>
            <td>
              <span v-if="Number(c.balance) > 0" class="balance-owe">Owes <Money :value="c.balance" /></span>
              <span v-else-if="Number(c.balance) < 0" class="balance-credit">Credit <Money :value="Math.abs(c.balance)" /></span>
              <span v-else class="balance-zero">—</span>
            </td>
            <td>
              <button class="row-action" @click="openEdit(c)"><Pencil :size="13" /></button>
              <button class="row-action danger" @click="deleteCustomer(c.id)"><Trash2 :size="13" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <AppPagination :page="page" :page-size="pageSize" :total="total" @update:page="fetchCustomers" />

    <!-- MODAL: Add / Edit -->
    <AppModal :open="modal.open" :title="modal.id ? 'Edit Customer' : 'New Customer'" @close="closeModal">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">Full Name</label>
          <input v-model="modal.name" class="form-input" placeholder="e.g. Ahmed Hassan" />
        </div>
        <div>
          <label class="form-label">Phone Number</label>
          <input v-model="modal.phone_number" class="form-input" placeholder="e.g. 01012345678" />
        </div>
        <div>
          <label class="form-label">Credit Limit (optional)</label>
          <input v-model.number="modal.credit_limit" type="number" min="0" step="100" class="form-input" placeholder="Leave blank to use store default" />
          <p style="font-size:11px;color:var(--text-muted);margin:4px 0 0;">Max unpaid balance. Blank = store default. Enforced per Settings › Policies.</p>
        </div>
        <div>
          <label class="form-label">Notes (optional)</label>
          <textarea v-model="modal.notes" class="form-input" rows="2" placeholder="Any notes about this customer…" />
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="closeModal">Cancel</button>
        <button class="btn-primary" :disabled="!modal.name.trim() || !modal.phone_number.trim() || saving" @click="save">
          {{ saving ? 'Saving…' : (modal.id ? 'Save Changes' : 'Add Customer') }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { Search, Users, Pencil, Trash2 } from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import { useQABStore } from '@/stores/qab'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { formatNumber } from '@/utils/format'

const auth = useAuthStore()
const qab  = useQABStore()

const customers = ref([])
const loading   = ref(false)
const saving    = ref(false)
const total     = ref(0)
const page      = ref(1)
const pageSize  = 20
const search    = ref('')

let searchTimer = null
function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchCustomers(1), 350)
}

async function fetchCustomers(p = 1) {
  loading.value = true
  page.value = p
  try {
    const res = await api.get('/api/auth/customers/', {
      params: { page: p, page_size: pageSize, search: search.value || undefined },
    })
    customers.value = res.data.results ?? res.data
    total.value     = res.data.count   ?? customers.value.length
  } catch { customers.value = [] } finally { loading.value = false }
}

async function deleteCustomer(id) {
  if (!confirm('Delete this customer?')) return
  await api.delete(`/api/auth/customers/${id}/`)
  fetchCustomers(page.value)
}

const modal = reactive({ open: false, id: null, name: '', phone_number: '', notes: '', credit_limit: null })

function openNew()    { Object.assign(modal, { open: true, id: null, name: '', phone_number: '', notes: '', credit_limit: null }) }
function openEdit(c)  { Object.assign(modal, { open: true, id: c.id, name: c.name, phone_number: c.phone_number, notes: c.notes || '', credit_limit: c.credit_limit ?? null }) }
function closeModal() { modal.open = false }

async function save() {
  saving.value = true
  try {
    const payload = { name: modal.name, phone_number: modal.phone_number, notes: modal.notes || '', credit_limit: modal.credit_limit || null }
    modal.id
      ? await api.patch(`/api/auth/customers/${modal.id}/`, payload)
      : await api.post('/api/auth/customers/', payload)
    closeModal()
    fetchCustomers(modal.id ? page.value : 1)
  } catch (e) {
    alert(e.response?.data ? JSON.stringify(e.response.data) : 'Error saving customer')
  } finally { saving.value = false }
}

onMounted(() => {
  fetchCustomers()
  qab.setActions([{ id: 'new-customer', label: 'New Customer', icon: 'plus', handler: openNew }])
})
onUnmounted(() => qab.clearActions())

</script>

<style scoped>
.page-header  { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
.page-title   { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub     { font-size:13px; color:var(--text-muted); margin:2px 0 0; }
.header-right { display:flex; align-items:center; gap:10px; }

.search-wrap  { position:relative; }
.search-icon  { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none; }
.search-input { padding:7px 12px 7px 30px; border:1px solid var(--border); border-radius:8px; background:var(--bg-card); color:var(--text-primary); font-size:13px; width:220px; outline:none; transition:border-color 120ms; }
.search-input:focus { border-color:var(--accent); }

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

.col-name  { font-weight:500; }
.col-phone { font-variant-numeric:tabular-nums; color:var(--text-secondary); }
.col-notes { color:var(--text-muted); font-size:12px; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

.balance-owe    { font-weight:600; color:#dc2626; font-variant-numeric:tabular-nums; font-size:12.5px; }
.balance-credit { font-weight:600; color:#16a34a; font-variant-numeric:tabular-nums; font-size:12.5px; }
.balance-zero   { color:var(--text-muted); }

.row-action { width:28px; height:28px; border:none; background:none; border-radius:6px; cursor:pointer; color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; transition:background 100ms,color 100ms; }
.row-action:hover        { background:var(--border); color:var(--text-primary); }
.row-action.danger:hover { background:#fee2e2; color:#dc2626; }

.form-label  { display:block; font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.form-input  { width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; box-sizing:border-box; transition:border-color 120ms; resize:vertical; }
.form-input:focus { border-color:var(--accent); }
.btn-ghost   { display:inline-flex; align-items:center; gap:5px; padding:7px 12px; border-radius:8px; font-size:13px; font-weight:500; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; transition:background 100ms,color 100ms,transform 70ms; }
.btn-ghost:hover  { background:var(--border); color:var(--text-primary); }
.btn-ghost:active { transform:scale(0.95); }
.btn-primary { display:inline-flex; align-items:center; gap:5px; padding:8px 16px; border-radius:8px; font-size:13px; font-weight:600; border:none; background:var(--accent); color:#fff; cursor:pointer; transition:background 100ms,transform 70ms,opacity 100ms; }
.btn-primary:hover    { background:var(--accent-hover); }
.btn-primary:active   { transform:scale(0.95); }
.btn-primary:disabled { opacity:.5; cursor:default; }
</style>
