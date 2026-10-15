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

      <!-- s173: payment due dates (managers+, with the shop switch on) — reminders, not money -->
      <div v-if="fmt.paymentDuesEnabled && isManagerPlus" class="section-card">
        <div class="section-header">
          <h2 class="section-title">{{ t('people.customer_detail.dues.title') }}</h2>
          <span class="count-badge">{{ dues.length }}</span>
          <div class="cd-dues-actions">
            <BaseButton size="sm" variant="ghost" @click="$router.push({ path: '/finance/due-dates', query: { customer: customer.id } })">
              {{ t('people.customer_detail.dues.see_all') }}
            </BaseButton>
            <BaseButton size="sm" @click="$router.push({ path: '/finance/due-dates', query: { customer: customer.id, new: 1 } })">
              <CalendarClock :size="13" /> {{ t('people.customer_detail.dues.add') }}
            </BaseButton>
          </div>
        </div>
        <div v-if="!dues.length" class="cd-dues-none">{{ t('people.customer_detail.dues.none') }}</div>
        <div v-for="d in dues" :key="d.id" class="cd-due" :class="{ late: d.days_to_due < 0 }">
          <span class="cd-due-date">{{ fmtDate(d.due_date + 'T12:00:00') }}</span>
          <span v-if="d.plan_count" class="cd-due-plan">{{ t('finance.dues.nth', { n: d.plan_seq, of: d.plan_count }) }}</span>
          <span class="cd-due-when">{{ d.days_to_due < 0 ? t('finance.dues.days_late', { n: -d.days_to_due })
            : d.days_to_due === 0 ? t('finance.dues.due_today') : t('finance.dues.days_left', { n: d.days_to_due }) }}</span>
          <Money :value="d.amount" />
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

      <!-- Payments received (lump sums, s167) — managers and up -->
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

      <!-- Account statement (كشف حساب, s167) — managers and up, same as the server -->
      <div v-if="isManagerPlus" class="stmt-section">
        <h2 class="section-title">{{ t('people.customer_detail.stmt.title') }}</h2>
        <AccountStatement
          v-model:date-from="stmtFrom"
          v-model:date-to="stmtTo"
          :party-label="t('people.customer_detail.stmt.customer')"
          :party-name="customer.name"
          :party-meta="customer.phone_number || ''"
          :lines="stmtRows"
          :opening-balance="stmt?.opening_balance || 0"
          :closing-balance="stmt?.closing_balance || 0"
          :totals="stmt?.totals"
          :debit-label="t('people.customer_detail.stmt.debit')"
          :credit-label="t('people.customer_detail.stmt.credit')"
          :balance-hint="t('people.customer_detail.stmt.balance_hint')"
          :loading="stmtLoading"
          :error="stmtError"
          :filename="`statement-${(customer.phone_number || customer.name || 'customer').replace(/\s+/g, '-')}-${stmtFrom || 'all'}-${stmtTo || 'now'}`"
          @refresh="fetchStatement"
        />
      </div>
    </div>

    <!-- Receive payment (one lump sum → oldest sales first, then the opening balance) — shared with the till -->
    <ReceivePaymentModal :open="recOpen" :customer="customer" @close="recOpen = false" @received="onReceived" />

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
        <div v-if="isManagerPlus">
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
import { ChevronLeft, Pencil, HandCoins, Trash2, CalendarClock } from 'lucide-vue-next'
import api from '@/api/axios'
import Money from '@/components/ui/Money.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AccountStatement from '@/components/finance/AccountStatement.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import ReceivePaymentModal from '@/components/shared/ReceivePaymentModal.vue'
import { useAuthStore } from '@/stores/auth'
import { useFormatStore } from '@/stores/format'
import { showSuccessToast, showErrorToast } from '@/utils/toast'
import { formatCurrency } from '@/utils/format'

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
      notes: editModal.notes,
      // Opening balance + credit limit: managers and up only (s167 / 2026-10-14) — a cashier's edit leaves both out.
      ...(isManagerPlus.value ? { opening_balance: editModal.opening_balance || 0, credit_limit: editModal.credit_limit || null } : {}),
    })
    customer.value = r.data
    editModal.open = false
    fetchStatement()   // the opening balance is the statement's first line
  } catch {} finally { editModal.saving = false }
}

// ── Account statement (كشف حساب, s167) — default range: this year, like the supplier one ──
const stmtFrom = ref(`${new Date().getFullYear()}-01-01`)
const stmtTo = ref((() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})())
const stmt = ref(null)
const stmtLoading = ref(false)
const stmtError = ref('')

async function fetchStatement() {
  if (!isManagerPlus.value) return
  stmtLoading.value = true
  stmtError.value = ''
  try {
    const params = {}
    if (stmtFrom.value) params.date_from = stmtFrom.value
    if (stmtTo.value) params.date_to = stmtTo.value
    const r = await api.get(`/api/auth/customers/${props.id}/statement/`, { params })
    stmt.value = r.data
  } catch (e) {
    const d = e?.response?.data
    stmtError.value = d?.date_from || d?.date_to || t('finance.statement.load_failed')
  } finally { stmtLoading.value = false }
}

const S = 'people.customer_detail.stmt.'
const stmtRows = computed(() => (stmt.value?.lines || []).map((l, i) => {
  const onSale = l.invoice_number ? t(S + 'on_sale', { num: l.invoice_number }) : ''
  let type = t(S + l.kind)
  let note = l.note || ''
  if (l.kind === 'payment' || l.kind === 'receipt') type = [type, l.method].filter(Boolean).join(' · ')
  if (l.kind === 'paid_back' && l.refund_method === 'STORE_CREDIT') type = `${type} ${t(S + 'store_credit')}`
  if (['return', 'return_fee', 'paid_back'].includes(l.kind)) note = onSale
  if (l.kind === 'receipt' && Number(l.receipt_amount) !== Number(l.credit)) {
    note = [t(S + 'receipt_part', { amount: formatCurrency(l.receipt_amount) }), note].filter(Boolean).join(' — ')
  }
  return {
    key: `${l.kind}-${l.link_id || ''}-${i}`,
    date: l.date,
    type,
    ref: l.ref,
    note,
    debit: l.debit,
    credit: l.credit,
    running_balance: l.running_balance,
    // sales, payments and returns all point at the sale; a receipt / the opening balance has no page
    to: l.link_id && l.kind !== 'receipt' && l.kind !== 'opening' ? `/finance/invoices?highlight=${l.link_id}` : null,
  }
}))

// ── Receive payment (s167): one lump sum, spread by the server oldest sale first ──
const receipts = ref([])
const recLoading = ref(false)
const recOpen = ref(false)

async function fetchReceipts() {
  if (!isManagerPlus.value) return
  recLoading.value = true
  try {
    const r = await api.get('/api/finance/customer-receipts/', { params: { customer: props.id, page_size: 100 } })
    receipts.value = r.data.results || r.data || []
  } catch { receipts.value = [] }
  finally { recLoading.value = false }
}

function openReceive() { recOpen.value = true }

async function onReceived() {
  await Promise.all([fetchCustomer(), fetchInvoices(page.value), fetchReceipts(), fetchStatement()])
}

async function deleteReceipt(r) {
  if (!confirm(t('people.customer_detail.receive.delete_confirm'))) return
  try {
    await api.delete(`/api/finance/customer-receipts/${r.id}/`)
    await Promise.all([fetchCustomer(), fetchInvoices(page.value), fetchReceipts(), fetchStatement()])
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

// s173: the customer's open payment due dates (a reminder list; the page Finance → Due dates does the work)
const fmt = useFormatStore()
const dues = ref([])
async function fetchDues() {
  if (!fmt.paymentDuesEnabled || !isManagerPlus.value) return
  try {
    const r = await api.get('/api/finance/payment-dues/', { params: { customer: props.id, status: 'OPEN', page_size: 50 } })
    dues.value = Array.isArray(r.data) ? r.data : (r.data.results || [])
  } catch { dues.value = [] }
}

onMounted(() => { fetchCustomer(); fetchInvoices(); fetchReceipts(); fetchStatement(); fetchDues() })
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
.stmt-section { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:14px 18px 18px; display:flex; flex-direction:column; gap:12px; }
.field-hint { font-size:12px; color:var(--text-muted); margin:6px 0 0; }

.rec-row { border-bottom:1px solid var(--border); }
.rec-row:last-child { border-bottom:none; }
.del-btn { display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:7px; border:none; background:none; color:var(--text-muted); cursor:pointer; transition:background 100ms, color 100ms; }
.del-btn:hover { background:rgba(220,38,38,0.10); color:var(--danger); }
.form-label { font-size:12px; font-weight:600; color:var(--text-secondary); text-transform:uppercase; letter-spacing:.04em; display:block; margin-bottom:6px; }
.form-input { width:100%; padding:8px 11px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; box-sizing:border-box; outline:none; }
.form-input:focus { border-color:var(--accent); }
.cd-dues-actions { margin-inline-start: auto; display: flex; gap: 8px; }
.cd-dues-none { font-size: 13px; color: var(--text-muted); padding: 4px 0; }
.cd-due { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-top: 1px solid var(--border); font-size: 13.5px; color: var(--text-primary); }
.cd-due:first-of-type { border-top: none; }
.cd-due-date { font-variant-numeric: tabular-nums; font-weight: 600; }
.cd-due-plan, .cd-due-when { font-size: 12px; color: var(--text-muted); }
.cd-due > :last-child { margin-inline-start: auto; }
.cd-due.late .cd-due-when { color: var(--danger); font-weight: 600; }
</style>
