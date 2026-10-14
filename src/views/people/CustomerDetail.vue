<template>
  <div>
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="$router.back()">
          <ChevronLeft :size="16" /> {{ t('common.back') }}
        </button>
        <div v-if="customer">
          <h1 class="page-title">{{ customer.name }}</h1>
          <p class="page-sub">{{ customer.phone_number || '—' }}</p>
        </div>
        <div v-else class="page-title">{{ t('people.customer_detail.customer') }}</div>
      </div>
      <div v-if="customer" class="header-right">
        <button class="btn-secondary" @click="openEdit"><Pencil :size="14" /> {{ t('common.edit') }}</button>
        <BaseButton v-if="isManagerPlus" variant="primary" @click="openReceive">
          <HandCoins :size="15" /> {{ t('people.customer_detail.receive_payment') }}
        </BaseButton>
      </div>
    </div>

    <div v-if="loading" class="skeleton-block" />
    <div v-else-if="!customer" class="empty-state">{{ t('people.customer_detail.not_found') }}</div>
    <div v-else class="detail-layout">

      <!-- Info card -->
      <div class="info-card">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">{{ t('people.customer_detail.info.phone') }}</div>
            <div class="info-value">{{ customer.phone_number || '—' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">{{ t('people.customer_detail.info.balance') }}</div>
            <div class="info-value">
              <span v-if="Number(customer.balance) > 0" class="badge-owe">{{ t('people.customer_detail.owes') }} <Money :value="customer.balance" /></span>
              <span v-else-if="Number(customer.balance) < 0" class="badge-credit">{{ t('people.customer_detail.credit') }} <Money :value="Math.abs(Number(customer.balance))" /></span>
              <span v-else>—</span>
            </div>
          </div>
          <div v-if="Number(customer.opening_balance)" class="info-item">
            <div class="info-label">{{ t('people.customer_detail.info.opening_balance') }}</div>
            <div class="info-value"><Money :value="customer.opening_balance" /></div>
          </div>
          <div class="info-item">
            <div class="info-label">{{ t('people.customer_detail.info.credit_limit') }}</div>
            <div class="info-value"><Money v-if="customer.credit_limit" :value="customer.credit_limit" /> <span v-else class="text-muted">{{ t('people.customer_detail.info.store_default') }}</span></div>
          </div>
          <div class="info-item">
            <div class="info-label">{{ t('people.customer_detail.info.store_credit') }}</div>
            <div class="info-value"><Money v-if="Number(customer.store_credit) > 0" :value="customer.store_credit" /> <span v-else class="text-muted">{{ t('people.customer_detail.info.none') }}</span></div>
          </div>
          <div class="info-item">
            <div class="info-label">{{ t('people.customer_detail.info.notes') }}</div>
            <div class="info-value">{{ customer.notes || '—' }}</div>
          </div>
        </div>
      </div>

      <!-- Invoices -->
      <div class="section-card">
        <div class="section-header">
          <h2 class="section-title">{{ t('people.customer_detail.invoice_history') }}</h2>
          <span class="count-badge">{{ total }}</span>
        </div>
        <div v-if="invLoading" class="table-skeleton"><div v-for="i in 5" :key="i" class="skeleton-row" /></div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>{{ t('people.customer_detail.inv_cols.num') }}</th>
              <th>{{ t('people.customer_detail.inv_cols.date') }}</th>
              <th>{{ t('people.customer_detail.inv_cols.total') }}</th>
              <th>{{ t('people.customer_detail.inv_cols.paid') }}</th>
              <th>{{ t('people.customer_detail.inv_cols.balance') }}</th>
              <th>{{ t('people.customer_detail.inv_cols.method') }}</th>
              <th>{{ t('people.customer_detail.inv_cols.status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="invoices.length === 0">
              <td colspan="7" class="table-empty">{{ t('people.customer_detail.no_invoices') }}</td>
            </tr>
            <tr v-for="inv in invoices" :key="inv.id" class="table-row" @click="goInvoice(inv.id)">
              <td class="mono">{{ inv.invoice_number || '—' }}</td>
              <td class="text-muted">{{ fmtDate(inv.date) }}</td>
              <td><Money :value="inv.grand_total" /></td>
              <td><Money :value="inv.paid_amount" /></td>
              <td>
                <span v-if="Number(inv.grand_total) - Number(inv.paid_amount) > 0" class="badge-owe"><Money :value="Number(inv.grand_total) - Number(inv.paid_amount)" /></span>
                <span v-else class="badge-paid">{{ t('people.customer_detail.badge_paid') }}</span>
              </td>
              <td class="text-muted">{{ inv.payment_method || '—' }}</td>
              <td><span class="status-pill" :class="'s-' + inv.status.toLowerCase()">{{ invStatusLabel(inv.status) }}</span></td>
            </tr>
          </tbody>
        </table>
        <AppPagination :page="page" :page-size="pageSize" :total="total" @update:page="fetchInvoices" />
      </div>

      <!-- Payments received (lump sums, s168) — managers and up -->
      <div v-if="isManagerPlus" class="section-card">
        <div class="section-header">
          <h2 class="section-title">{{ t('people.customer_detail.receipts_history') }}</h2>
          <span class="count-badge">{{ receipts.length }}</span>
        </div>
        <div v-if="recLoading" class="table-skeleton"><div v-for="i in 3" :key="i" class="skeleton-row" /></div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>{{ t('people.customer_detail.rec_cols.date') }}</th>
              <th>{{ t('people.customer_detail.rec_cols.amount') }}</th>
              <th>{{ t('people.customer_detail.rec_cols.method') }}</th>
              <th>{{ t('people.customer_detail.rec_cols.to_sales') }}</th>
              <th>{{ t('people.customer_detail.rec_cols.to_opening') }}</th>
              <th>{{ t('people.customer_detail.rec_cols.by') }}</th>
              <th>{{ t('people.customer_detail.rec_cols.note') }}</th>
              <th v-if="canDeleteReceipt" />
            </tr>
          </thead>
          <tbody>
            <tr v-if="receipts.length === 0">
              <td :colspan="canDeleteReceipt ? 8 : 7" class="table-empty">{{ t('people.customer_detail.no_receipts') }}</td>
            </tr>
            <tr v-for="r in receipts" :key="r.id" class="rec-row">
              <td class="text-muted">{{ fmtDate(r.date) }}</td>
              <td><Money :value="r.amount" /></td>
              <td>{{ r.method_name }}</td>
              <td><Money :value="Number(r.amount) - Number(r.unallocated)" /></td>
              <td><Money :value="r.unallocated" /></td>
              <td class="text-muted">{{ r.created_by_name || '—' }}</td>
              <td class="text-muted">{{ r.note || '—' }}</td>
              <td v-if="canDeleteReceipt" style="text-align:right">
                <button class="del-btn" :title="t('people.customer_detail.receive.delete')" @click="deleteReceipt(r)">
                  <Trash2 :size="14" />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Receive payment (one lump sum → oldest sales first, then the opening balance) -->
    <AppModal :open="recModal.open" :title="t('people.customer_detail.receive_payment')" width="520px" @close="recModal.open = false">
      <div v-if="!recModal.result" class="rec-form">
        <div class="rec-balance">
          <span>{{ t('people.customer_detail.receive.owes_now') }}</span>
          <strong><Money :value="Math.max(0, Number(customer?.balance || 0))" /></strong>
        </div>
        <BaseInput v-model="recModal.amount" type="number" min="0" step="0.01"
                   :label="t('people.customer_detail.receive.amount')" placeholder="0.00" :error="recModal.error" />
        <BaseSelect v-model="recModal.method" :options="methodOptions"
                    :label="t('people.customer_detail.receive.method')"
                    :placeholder="methodOptions.length ? '' : t('people.customer_detail.receive.no_methods')" />
        <BaseInput v-model="recModal.date" type="date" :label="t('people.customer_detail.receive.date')" />
        <BaseInput v-model="recModal.note" :label="t('people.customer_detail.receive.note')"
                   :placeholder="t('people.customer_detail.receive.note_ph')" />
        <label v-if="extra > 0" class="rec-advance">
          <input type="checkbox" v-model="recModal.allowAdvance" />
          <span>{{ t('people.customer_detail.receive.keep_credit') }} <Money :value="extra" /></span>
        </label>
        <p class="rec-hint">{{ t('people.customer_detail.receive.hint') }}</p>
      </div>
      <div v-else class="rec-form">
        <p class="rec-done">{{ t('people.customer_detail.receive.done') }}</p>
        <div v-for="a in recModal.result.allocations" :key="a.invoice" class="rec-line">
          <span>{{ t('people.customer_detail.receive.to_sale', { num: a.invoice_number || '—' }) }}</span>
          <Money :value="a.amount" />
        </div>
        <div v-if="Number(recModal.result.to_opening_balance)" class="rec-line">
          <span>{{ t('people.customer_detail.receive.to_opening') }}</span>
          <Money :value="recModal.result.to_opening_balance" />
        </div>
        <div v-if="Number(recModal.result.advance)" class="rec-line">
          <span>{{ t('people.customer_detail.receive.to_credit') }}</span>
          <Money :value="recModal.result.advance" />
        </div>
        <div class="rec-line rec-total">
          <span>{{ t('people.customer_detail.receive.balance_after') }}</span>
          <Money :value="recModal.result.balance_after" />
        </div>
      </div>
      <template #footer>
        <template v-if="!recModal.result">
          <BaseButton variant="ghost" @click="recModal.open = false">{{ t('common.cancel') }}</BaseButton>
          <BaseButton variant="primary" :loading="recModal.saving" :disabled="!recModal.method" @click="saveReceive">
            {{ t('people.customer_detail.receive.save') }}
          </BaseButton>
        </template>
        <BaseButton v-else variant="primary" @click="recModal.open = false">{{ t('common.close') }}</BaseButton>
      </template>
    </AppModal>

    <!-- Edit modal (reuse Customers.vue logic inline) -->
    <AppModal :open="editModal.open" :title="t('people.customer_detail.edit_modal.title')" @close="editModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">{{ t('people.customer_detail.edit_modal.name_label') }} *</label>
          <input v-model="editModal.name" class="form-input" />
        </div>
        <div>
          <label class="form-label">{{ t('people.customer_detail.edit_modal.phone_label') }}</label>
          <input v-model="editModal.phone" class="form-input" />
        </div>
        <div>
          <label class="form-label">{{ t('people.customer_detail.edit_modal.credit_limit_label') }}</label>
          <input v-model="editModal.credit_limit" class="form-input" type="number" :placeholder="t('people.customer_detail.edit_modal.credit_limit_ph')" />
        </div>
        <div v-if="isManagerPlus">
          <label class="form-label">{{ t('people.customer_form.opening_label') }}</label>
          <input v-model="editModal.opening_balance" class="form-input" type="number" step="0.01" placeholder="0" />
          <p class="field-hint">{{ t('people.customer_form.opening_hint') }}</p>
        </div>
        <div>
          <label class="form-label">{{ t('people.customer_detail.edit_modal.notes_label') }}</label>
          <textarea v-model="editModal.notes" class="form-input" rows="2" />
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="editModal.open = false">{{ t('common.cancel') }}</button>
        <button class="btn-primary" :disabled="editModal.saving" @click="saveEdit">{{ editModal.saving ? t('common.saving') : t('common.save') }}</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ChevronLeft, Pencil, HandCoins, Trash2 } from 'lucide-vue-next'
import api from '@/api/axios'
import Money from '@/components/ui/Money.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import { useAuthStore } from '@/stores/auth'
import { showSuccessToast, showErrorToast } from '@/utils/toast'

const { t } = useI18n()
const props = defineProps({ id: String })
const router = useRouter()
const auth = useAuthStore()
// The server decides (receipts: MANAGER+, delete ADMIN+; opening balance: MANAGER+) — this only hides what it would refuse.
const isManagerPlus = computed(() => ['MANAGER', 'ADMIN', 'OWNER'].includes(auth.userRole))
const canDeleteReceipt = computed(() => ['ADMIN', 'OWNER'].includes(auth.userRole))

function invStatusLabel(s) {
  const key = (s || '').toLowerCase()
  const known = ['draft', 'posted', 'void', 'refunded']
  return known.includes(key) ? t('sales.status.' + key) : s
}

const customer = ref(null)
const loading = ref(true)
const invoices = ref([])
const invLoading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const editModal = reactive({ open: false, name: '', phone: '', credit_limit: '', opening_balance: '', notes: '', saving: false })

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
  editModal.opening_balance = Number(customer.value.opening_balance) ? customer.value.opening_balance : ''
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
      ...(isManagerPlus.value ? { opening_balance: editModal.opening_balance || 0 } : {}),
    })
    customer.value = r.data
    editModal.open = false
  } catch {} finally { editModal.saving = false }
}

// ── Receive payment (s168): one lump sum, spread by the server oldest sale first ──
const receipts = ref([])
const recLoading = ref(false)
const methods = ref([])
const recModal = reactive({ open: false, amount: '', method: '', date: '', note: '', allowAdvance: false,
                            saving: false, error: '', result: null })
// Credit (Ajel) is the unpaid part of a sale, never a way to pay.
const methodOptions = computed(() => methods.value.filter(m => !m.is_agel).map(m => ({ value: m.id, label: m.name })))
// What the typed amount goes beyond everything they owe — only kept as credit when ticked.
const extra = computed(() => {
  const owes = Math.max(0, Number(customer.value?.balance || 0))
  const amt = Number(recModal.amount) || 0
  return amt > owes ? Math.round((amt - owes) * 100) / 100 : 0
})
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

async function fetchReceipts() {
  if (!isManagerPlus.value) return
  recLoading.value = true
  try {
    const r = await api.get('/api/finance/customer-receipts/', { params: { customer: props.id, page_size: 100 } })
    receipts.value = r.data.results || r.data || []
  } catch { receipts.value = [] }
  finally { recLoading.value = false }
}

async function openReceive() {
  Object.assign(recModal, { open: true, amount: '', date: today(), note: '', allowAdvance: false,
                            saving: false, error: '', result: null })
  if (!methods.value.length) {
    try {
      const r = await api.get('/api/finance/payment-methods/')
      methods.value = r.data.results ?? r.data ?? []
    } catch { methods.value = [] }
  }
  const cash = methodOptions.value.find(o => methods.value.find(m => m.id === o.value)?.is_cash)
  recModal.method = (cash || methodOptions.value[0])?.value || ''
}

async function saveReceive() {
  recModal.error = ''
  const amt = Number(recModal.amount)
  if (!amt || amt <= 0) { recModal.error = t('people.customer_detail.receive.amount_required'); return }
  if (extra.value > 0 && !recModal.allowAdvance) { recModal.error = t('people.customer_detail.receive.too_much'); return }
  recModal.saving = true
  try {
    const r = await api.post('/api/finance/customer-receipts/', {
      customer: props.id,
      amount: amt,
      method: recModal.method,
      // today → the server stamps the real time; another day → noon, so no time zone pushes it a day off
      date: recModal.date && recModal.date !== today() ? new Date(`${recModal.date}T12:00:00`).toISOString() : undefined,
      note: recModal.note || '',
      allow_advance: recModal.allowAdvance,
    })
    recModal.result = r.data.summary
    showSuccessToast(t('people.customer_detail.receive.done'))
    await Promise.all([fetchCustomer(), fetchInvoices(page.value), fetchReceipts()])
  } catch (e) {
    const d = e?.response?.data || {}
    const first = v => (Array.isArray(v) ? v[0] : v)   // a field error comes as a list or a plain string
    recModal.error = first(d.amount) || first(d.method) || first(d.customer) || d.detail
      || t('people.customer_detail.receive.save_failed')
  } finally { recModal.saving = false }
}

async function deleteReceipt(r) {
  if (!confirm(t('people.customer_detail.receive.delete_confirm'))) return
  try {
    await api.delete(`/api/finance/customer-receipts/${r.id}/`)
    await Promise.all([fetchCustomer(), fetchInvoices(page.value), fetchReceipts()])
    showSuccessToast(t('people.customer_detail.receive.deleted'))
  } catch { showErrorToast(t('people.customer_detail.receive.delete_failed')) }
}

function goInvoice(id) {
  router.push(`/finance/invoices?highlight=${id}`)
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(() => { fetchCustomer(); fetchInvoices(); fetchReceipts() })
</script>

<style scoped>
.header-left { display:flex; align-items:flex-start; gap:12px; }
.back-btn { display:inline-flex; align-items:center; gap:4px; padding:6px 10px; border-radius:8px; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; font-size:13px; font-weight:500; transition:background 100ms; margin-top:2px; }
.back-btn:hover { background:var(--border); }

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

.badge-owe { display:inline-block; padding:2px 8px; border-radius:20px; background:rgba(220,38,38,0.10); color:var(--danger); font-size:12px; font-weight:600; }
.badge-credit { display:inline-block; padding:2px 8px; border-radius:20px; background:rgba(16,163,74,0.10); color:var(--success); font-size:12px; font-weight:600; }
.badge-paid { display:inline-block; padding:2px 8px; border-radius:20px; background:rgba(16,163,74,0.10); color:var(--success); font-size:12px; font-weight:600; }

.status-pill { display:inline-block; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
.s-posted { background:rgba(16,163,74,0.12); color:var(--success); }
.s-draft  { background:var(--border); color:var(--text-muted); }
.s-void   { background:rgba(220,38,38,0.10); color:var(--danger); }

.header-right { display:flex; align-items:center; gap:8px; }
.field-hint { font-size:12px; color:var(--text-muted); margin:6px 0 0; }

.rec-row { border-bottom:1px solid var(--border); }
.rec-row:last-child { border-bottom:none; }
.del-btn { display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:7px; border:none; background:none; color:var(--text-muted); cursor:pointer; transition:background 100ms, color 100ms; }
.del-btn:hover { background:rgba(220,38,38,0.10); color:var(--danger); }
.rec-form { display:flex; flex-direction:column; gap:14px; }
.rec-balance { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-radius:8px; background:var(--bg-app); border:1px solid var(--border); font-size:13px; color:var(--text-secondary); }
.rec-balance strong { color:var(--text-primary); font-size:15px; }
.rec-advance { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text-secondary); cursor:pointer; }
.rec-hint { font-size:12px; color:var(--text-muted); margin:0; }
.rec-done { font-size:14px; font-weight:600; color:var(--success); margin:0; }
.rec-line { display:flex; align-items:center; justify-content:space-between; font-size:13px; color:var(--text-secondary); padding:6px 0; border-bottom:1px solid var(--border); }
.rec-total { border-bottom:none; font-weight:600; color:var(--text-primary); }
.form-label { font-size:12px; font-weight:600; color:var(--text-secondary); text-transform:uppercase; letter-spacing:.04em; display:block; margin-bottom:6px; }
.form-input { width:100%; padding:8px 11px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; box-sizing:border-box; outline:none; }
.form-input:focus { border-color:var(--accent); }
</style>
