<template>
  <div>
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="$router.back()">
          <ChevronLeft :size="16" /> {{ t('common.back') }}
        </button>
        <div v-if="supplier">
          <h1 class="page-title">{{ supplier.name }}</h1>
          <p class="page-sub">{{ t('people.supplier_detail.prefix') }} {{ supplier.code_prefix }} <span v-if="supplier.prefix_locked" class="lock-badge"><Lock :size="10" /> {{ t('people.supplier_detail.locked') }}</span></p>
        </div>
        <div v-else class="page-title">{{ t('people.supplier_detail.supplier') }}</div>
      </div>
      <div v-if="supplier" class="header-right">
        <BaseButton variant="primary" @click="openPay">
          <Plus :size="15" /> {{ t('people.supplier_detail.record_payment') }}
        </BaseButton>
      </div>
    </div>

    <div v-if="loading" class="skeleton-block" />
    <div v-else-if="!supplier" class="empty-state">{{ t('people.supplier_detail.not_found') }}</div>
    <div v-else class="detail-layout">

      <div class="info-card">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">{{ t('people.supplier_detail.info.contact') }}</div>
            <div class="info-value">{{ supplier.contact_info || '—' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">{{ t('people.supplier_detail.info.code_prefix') }}</div>
            <div class="info-value mono">{{ supplier.code_prefix }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">{{ t('people.supplier_detail.info.total_purchased') }}</div>
            <div class="info-value"><Money :value="supplier.received_total || 0" /></div>
          </div>
          <div class="info-item">
            <div class="info-label">{{ t('people.supplier_detail.info.total_paid') }}</div>
            <div class="info-value"><Money :value="supplier.payments_total || 0" /></div>
          </div>
          <div class="info-item">
            <div class="info-label">{{ t('people.supplier_detail.info.outstanding') }}</div>
            <div class="info-value">
              <span v-if="Number(supplier.balance) > 0" class="badge-owe"><Money :value="supplier.balance" /></span>
              <span v-else class="badge-paid">{{ t('people.supplier_detail.info.settled') }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="tab-bar">
        <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
          <component :is="tab.icon" :size="15" />
          {{ t('people.supplier_detail.tabs.' + tab.id) }}
        </button>
      </div>

      <AccountStatement
        v-if="activeTab === 'statement'"
        v-model:date-from="stmtFrom"
        v-model:date-to="stmtTo"
        :party-label="t('people.supplier_detail.supplier')"
        :party-name="supplier.name"
        :party-meta="[supplier.company_name, supplier.phone_number].filter(Boolean).join(' · ')"
        :lines="stmtRows"
        :opening-balance="stmt?.opening_balance || 0"
        :closing-balance="stmt?.closing_balance || 0"
        :totals="stmt?.totals"
        :debit-label="t('people.supplier_detail.stmt.debit')"
        :credit-label="t('people.supplier_detail.stmt.credit')"
        :balance-hint="t('people.supplier_detail.stmt.balance_hint')"
        :loading="stmtLoading"
        :error="stmtError"
        :filename="`statement-${supplier.code_prefix}-${stmtFrom || 'all'}-${stmtTo || 'now'}`"
        @refresh="fetchStatement"
      />

      <div v-if="activeTab === 'purchases'" class="section-card">
        <div class="section-header">
          <h2 class="section-title">{{ t('people.supplier_detail.purchase_history') }}</h2>
          <span class="count-badge">{{ total }}</span>
        </div>
        <div v-if="purLoading" class="table-skeleton"><div v-for="i in 5" :key="i" class="skeleton-row" /></div>
        <div v-else class="dt-xscroll">
        <table class="dt">
          <thead>
            <tr>
              <th class="dt-th">{{ t('people.supplier_detail.pur_cols.ref') }}</th>
              <th class="dt-th">{{ t('people.supplier_detail.pur_cols.date') }}</th>
              <th class="dt-th">{{ t('people.supplier_detail.pur_cols.total') }}</th>
              <th class="dt-th">{{ t('people.supplier_detail.pur_cols.status') }}</th>
              <th class="dt-th">{{ t('people.supplier_detail.pur_cols.notes') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="purchases.length === 0">
              <td colspan="5" class="dt-empty">{{ t('people.supplier_detail.no_purchases') }}</td>
            </tr>
            <tr v-for="p in purchases" :key="p.id" class="dt-row">
              <td class="mono">{{ p.vendor_reference || '—' }}</td>
              <td class="text-muted">{{ fmtDate(p.date) }}</td>
              <td><Money :value="p.total_amount" /></td>
              <td><span class="status-pill" :class="'s-' + p.status.toLowerCase()">{{ purStatusLabel(p.status) }}</span></td>
              <td class="text-muted">{{ p.notes || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div><!-- dt-xscroll -->
        <AppPagination :page="page" :page-size="pageSize" :total="total" @update:page="fetchPurchases" />
      </div>

      <div v-if="activeTab === 'payments'" class="section-card">
        <div class="section-header">
          <h2 class="section-title">{{ t('people.supplier_detail.payments_history') }}</h2>
          <span class="count-badge">{{ payments.length }}</span>
        </div>
        <div v-if="payLoading" class="table-skeleton"><div v-for="i in 4" :key="i" class="skeleton-row" /></div>
        <div v-else class="dt-xscroll">
          <table class="dt">
            <thead>
              <tr>
                <th class="dt-th">{{ t('people.supplier_detail.pay_cols.date') }}</th>
                <th class="dt-th">{{ t('people.supplier_detail.pay_cols.amount') }}</th>
                <th class="dt-th">{{ t('people.supplier_detail.pay_cols.method') }}</th>
                <th class="dt-th">{{ t('people.supplier_detail.pay_cols.by') }}</th>
                <th class="dt-th">{{ t('people.supplier_detail.pay_cols.note') }}</th>
                <th class="dt-th" style="text-align:right">{{ t('people.supplier_detail.pay_cols.actions') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="payments.length === 0">
                <td colspan="6" class="dt-empty">{{ t('people.supplier_detail.no_payments') }}</td>
              </tr>
              <tr v-for="p in payments" :key="p.id" class="dt-row">
                <td class="text-muted">{{ fmtDate(p.date) }}</td>
                <td><Money :value="p.amount" /></td>
                <td>{{ payMethodLabel(p) }}</td>
                <td class="text-muted">{{ p.created_by_name || '—' }}</td>
                <td class="text-muted">{{ p.note || '—' }}</td>
                <td style="text-align:right">
                  <button class="del-btn" :title="t('people.supplier_detail.pay_form.delete')" @click="deletePay(p)">
                    <Trash2 :size="14" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <AppModal :open="payOpen" :title="t('people.supplier_detail.record_payment')" width="480px" @close="payOpen = false">
      <div class="pay-form">
        <BaseInput v-model="payForm.amount" type="number" min="0" step="0.01"
                   :label="t('people.supplier_detail.pay_form.amount')"
                   :placeholder="'0.00'" :error="payErr" />
        <BaseInput v-model="payForm.date" type="date"
                   :label="t('people.supplier_detail.pay_form.date')" />
        <BaseSelect v-model="payForm.payment_method" :options="methodOptions"
                    :label="t('people.supplier_detail.pay_form.method')"
                    :placeholder="methodOptions.length ? '' : t('people.supplier_detail.pay_form.no_methods')" />
        <!-- Treasury on (s169c): the box the money leaves. Empty = the server picks the method's box. -->
        <div v-if="treasuryOn">
          <BaseSelect v-model="payForm.paid_from" :options="paidFromOptions" :label="t('finance.treasury.paid_from')" />
          <p v-if="payBox" class="pay-help">{{ t('finance.treasury.in_box_now') }}: <Money :value="payBox.balance" /></p>
        </div>
        <BaseInput v-model="payForm.note"
                   :label="t('people.supplier_detail.pay_form.note')"
                   :placeholder="t('people.supplier_detail.pay_form.note_ph')" />
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="payOpen = false">{{ t('common.cancel') }}</BaseButton>
        <BaseButton variant="primary" :loading="paySaving" :disabled="!payForm.payment_method" @click="savePay">{{ t('people.supplier_detail.pay_form.save') }}</BaseButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronLeft, Lock, Plus, Trash2, ScrollText, Package, Wallet } from 'lucide-vue-next'
import api from '@/api/axios'
import Money from '@/components/ui/Money.vue'
import AccountStatement from '@/components/finance/AccountStatement.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppModal from '@/components/ui/AppModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import { showSuccessToast, showErrorToast } from '@/utils/toast'
import { useFormatStore } from '@/stores/format'
import { fetchBoxes, boxOptionLabel, treasuryError } from '@/utils/treasury'

const { t } = useI18n()
const props = defineProps({ id: String })
const fmt = useFormatStore()

// ── Treasury (s169c): "Paid from" a money box, only when the shop's switch is on ──
const treasuryOn = computed(() => fmt.treasuryEnabled)
const boxes = ref([])
// "Automatic" (= the server uses the method's lands-in box) only for a NON-cash method; cash shows the real box.
const payIsCash = computed(() => !!methods.value.find(m => m.id === payForm.value.payment_method)?.is_cash)
const paidFromOptions = computed(() => [
  ...(payIsCash.value ? [] : [{ value: '', label: t('finance.treasury.auto_box') }]),
  ...boxes.value.filter(b => b.is_active && b.system_role !== 'UNSORTED')
    .map(b => ({ value: b.id, label: boxOptionLabel(t, b) })),
])
const myDrawer = ref('')   // the drawer of my open shift (GET /api/finance/shifts/drawer/ → shift.drawer)
const payBox = computed(() => boxes.value.find(b => b.id === payForm.value.paid_from) || null)

// PROLINE-PARITY Upgrade 6: the shop's OWN payment methods (the till's list) — minus Ajel (credit is not money
// paid) and store credit (a customer's wallet; the list endpoint already hides it).
const methods = ref([])
const methodOptions = computed(() => methods.value
  .filter(m => !m.is_agel && !m.is_store_credit)
  .map(m => ({ value: m.id, label: m.name })))

function purStatusLabel(s) {
  const key = (s || '').toLowerCase()
  const known = ['received', 'draft', 'void']
  return known.includes(key) ? t('people.supplier_detail.pur_status.' + key) : s
}

const supplier = ref(null)
const loading = ref(true)
const purchases = ref([])
const purLoading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

async function fetchSupplier() {
  loading.value = true
  try {
    const r = await api.get(`/api/inventory/suppliers/${props.id}/`)
    supplier.value = r.data
  } catch { supplier.value = null }
  finally { loading.value = false }
}

async function fetchPurchases(p = 1) {
  page.value = p
  purLoading.value = true
  try {
    const r = await api.get(`/api/inventory/suppliers/${props.id}/purchases/`, { params: { page: p } })
    purchases.value = r.data.results || []
    total.value = r.data.count || 0
  } catch { purchases.value = [] }
  finally { purLoading.value = false }
}

// ── Tabs ──────────────────────────────────────────────────────────────────
const tabs = [
  { id: 'statement', icon: ScrollText },
  { id: 'purchases', icon: Package },
  { id: 'payments',  icon: Wallet },
]
const activeTab = ref('statement')

// ── Account statement (كشف حساب) — default range: this year ──────────────
function localISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const stmtFrom = ref(`${new Date().getFullYear()}-01-01`)
const stmtTo = ref(localISO(new Date()))
const stmt = ref(null)
const stmtLoading = ref(false)
const stmtError = ref('')

async function fetchStatement() {
  stmtLoading.value = true
  stmtError.value = ''
  try {
    const params = {}
    if (stmtFrom.value) params.date_from = stmtFrom.value
    if (stmtTo.value) params.date_to = stmtTo.value
    const r = await api.get(`/api/inventory/suppliers/${props.id}/statement/`, { params })
    stmt.value = r.data
  } catch (e) {
    const d = e?.response?.data
    stmtError.value = d?.date_from || d?.date_to || t('finance.statement.load_failed')
  } finally { stmtLoading.value = false }
}

// How a payment was made: the shop's method name; an OLD payment that never got one (from before the switch,
// e.g. "Bank Transfer" in a shop with no bank method) shows its old fixed label, translated.
const LEGACY_METHODS = ['cash', 'bank', 'card', 'other']
function payMethodLabel(p) {
  if (p.payment_method) return p.payment_method_name || ''
  const code = (p.method || '').toLowerCase()
  return LEGACY_METHODS.includes(code) ? t('people.supplier_detail.methods.' + code) : (p.payment_method_name || '')
}

const stmtRows = computed(() => (stmt.value?.lines || []).map(l => {
  const isPurchase = l.kind === 'purchase'
  // Our purchase # is the ref; the supplier's own invoice # goes in the note (unless it IS the ref).
  const vendorNote = isPurchase && l.vendor_reference && l.vendor_reference !== l.ref
    ? t('people.supplier_detail.stmt.supplier_inv', { ref: l.vendor_reference }) : ''
  return {
    key: `${l.kind}-${l.link_id}`,
    date: l.date,
    type: isPurchase
      ? t('people.supplier_detail.stmt.purchase')
      : [t('people.supplier_detail.stmt.payment'), payMethodLabel(l)].filter(Boolean).join(' · '),
    ref: l.ref,
    note: [vendorNote, l.note].filter(Boolean).join(' — '),
    debit: l.debit,
    credit: l.credit,
    running_balance: l.running_balance,
    to: isPurchase ? `/inventory/purchases/${l.link_id}/print` : null,
  }
}))

// ── Supplier payments (running account) ──────────────────────────────────
const payments = ref([])
const payLoading = ref(false)
const payOpen = ref(false)
const paySaving = ref(false)
const payErr = ref('')
const payForm = ref({ amount: '', date: '', payment_method: '', note: '', paid_from: '' })

// Prefill "Paid from": a CASH method → the same rule as Expenses (my open shift's drawer, else the first cash box) so
// the user sees the real box; a non-cash method → the box it lands in when known, else "Automatic". Never overrides a
// box the user picked by hand.
const paidFromTouched = ref(false)
function defaultBoxFor(methodId) {
  const m = methods.value.find(x => x.id === methodId)
  const active = id => boxes.value.find(b => b.id === id && b.is_active && b.system_role !== 'UNSORTED')
  if (m?.is_cash) {
    if (myDrawer.value && active(myDrawer.value)) return myDrawer.value
    return boxes.value.find(b => b.is_active && b.kind === 'CASH')?.id || ''
  }
  return (m?.lands_in && active(m.lands_in)) ? m.lands_in : ''
}
watch(() => payForm.value.payment_method, id => { if (!paidFromTouched.value) payForm.value.paid_from = defaultBoxFor(id) })
watch(() => payForm.value.paid_from, v => { if (v !== defaultBoxFor(payForm.value.payment_method)) paidFromTouched.value = true })

async function fetchPayments() {
  payLoading.value = true
  try {
    const r = await api.get('/api/finance/supplier-payments/', { params: { supplier: props.id, page_size: 100 } })
    payments.value = r.data.results || r.data || []
  } catch { payments.value = [] }
  finally { payLoading.value = false }
}

async function openPay() {
  payErr.value = ''
  paidFromTouched.value = false
  payForm.value = { amount: '', date: new Date().toISOString().slice(0, 10), payment_method: '', note: '', paid_from: '' }
  payOpen.value = true
  if (treasuryOn.value) {
    boxes.value = await fetchBoxes()
    try {
      const { data } = await api.get('/api/finance/shifts/drawer/')
      myDrawer.value = data?.shift?.drawer || ''
    } catch { myDrawer.value = '' }
  }
  if (!methods.value.length) {
    try {
      const r = await api.get('/api/finance/payment-methods/')
      methods.value = r.data.results ?? r.data ?? []
    } catch { methods.value = [] }
  }
  const cash = methods.value.find(m => m.is_cash && !m.is_agel)
  payForm.value.payment_method = (cash ? cash.id : methodOptions.value[0]?.value) || ''
}

async function savePay() {
  payErr.value = ''
  const amt = Number(payForm.value.amount)
  if (!amt || amt <= 0) { payErr.value = t('people.supplier_detail.pay_form.amount_required'); return }
  if (!payForm.value.payment_method) { showErrorToast(t('people.supplier_detail.pay_form.method_required')); return }
  paySaving.value = true
  try {
    await api.post('/api/finance/supplier-payments/', {
      supplier: props.id,
      amount: amt,
      date: payForm.value.date ? new Date(payForm.value.date).toISOString() : undefined,
      payment_method: payForm.value.payment_method,
      note: payForm.value.note || '',
      ...(treasuryOn.value && payForm.value.paid_from ? { paid_from: payForm.value.paid_from } : {}),
    })
    payOpen.value = false
    showSuccessToast(t('people.supplier_detail.pay_form.recorded'))
    await Promise.all([fetchPayments(), fetchSupplier(), fetchStatement()])  // refresh history + outstanding
  } catch (e) {
    const d = e?.response?.data || {}
    const first = v => (Array.isArray(v) ? v[0] : v)
    showErrorToast(d.code ? treasuryError(t, e) : (first(d.amount) || first(d.payment_method) || first(d.paid_from)
      || t('people.supplier_detail.pay_form.save_failed')), 3500)
  } finally { paySaving.value = false }
}

async function deletePay(p) {
  if (!confirm(t('people.supplier_detail.pay_form.delete_confirm'))) return
  try {
    await api.delete(`/api/finance/supplier-payments/${p.id}/`)
    await Promise.all([fetchPayments(), fetchSupplier(), fetchStatement()])
    showSuccessToast(t('people.supplier_detail.pay_form.deleted'))
  } catch (e) { showErrorToast(e?.response?.data?.code ? treasuryError(t, e) : t('people.supplier_detail.pay_form.delete_failed'), 3500) }
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(() => { fetchSupplier(); fetchPurchases(); fetchPayments(); fetchStatement() })
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
.header-left { display:flex; align-items:flex-start; gap:12px; }
.header-right { flex-shrink:0; }
.pay-form { display:flex; flex-direction:column; gap:14px; }
.pay-help { font-size:12px; color:var(--text-muted); margin:6px 0 0; }
.del-btn { display:inline-flex; align-items:center; justify-content:center; width:28px; height:28px; border-radius:7px; border:none; background:none; color:var(--text-muted); cursor:pointer; transition:background 100ms, color 100ms; }
.del-btn:hover { background:rgba(220,38,38,0.10); color:var(--danger); }
.back-btn { display:inline-flex; align-items:center; gap:4px; padding:6px 10px; border-radius:8px; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; font-size:13px; font-weight:500; transition:background 100ms; margin-top:2px; }
.back-btn:hover { background:var(--border); }
.page-sub { font-size:13px; color:var(--text-muted); margin:2px 0 0; display:flex; align-items:center; gap:6px; }
.lock-badge { display:inline-flex; align-items:center; gap:3px; padding:1px 7px; border-radius:20px; background:rgba(245,158,11,0.12); color:var(--warning-hover); font-size:11px; font-weight:600; }

.detail-layout { display:flex; flex-direction:column; gap:20px; }
.tab-bar { display:flex; gap:2px; border-bottom:1px solid var(--border); margin-bottom:-6px; }
.tab-btn { display:flex; align-items:center; gap:6px; padding:9px 16px; font-size:13.5px; font-weight:500; color:var(--text-muted); border:none; background:none; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; transition:color 120ms,border-color 120ms; }
.tab-btn:hover  { color:var(--text-primary); }
.tab-btn.active { color:var(--accent); border-bottom-color:var(--accent); font-weight:600; }
.skeleton-block { height:160px; border-radius:12px; background:var(--border); }
.empty-state { text-align:center; padding:60px 20px; color:var(--text-muted); }

.info-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:20px 22px; }
.info-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:16px; }
.info-label { font-size:11px; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); font-weight:600; }
.info-value { font-size:14px; color:var(--text-primary); margin-top:3px; }
.mono { font-family:ui-monospace,monospace; font-size:13px; }

.section-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.section-header { display:flex; align-items:center; gap:10px; padding:14px 18px; border-bottom:1px solid var(--border); }
.section-title { font-size:15px; font-weight:600; color:var(--text-primary); margin:0; }
.count-badge { padding:2px 8px; border-radius:20px; background:var(--border); font-size:12px; font-weight:600; color:var(--text-muted); }

.table-empty { text-align:center; padding:40px 20px; color:var(--text-muted); }
.table-skeleton { padding:8px 0; }
.skeleton-row { height:38px; margin:4px 16px; border-radius:6px; background:linear-gradient(90deg,var(--border) 25%,var(--bg-app) 50%,var(--border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position:-200% 0; } }
.text-muted { color:var(--text-muted); font-size:12px; }

.badge-owe { display:inline-block; padding:2px 8px; border-radius:20px; background:rgba(220,38,38,0.10); color:var(--danger); font-size:12px; font-weight:600; }
.badge-paid { display:inline-block; padding:2px 8px; border-radius:20px; background:rgba(16,163,74,0.10); color:var(--success); font-size:12px; font-weight:600; }
.status-pill { display:inline-block; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
.s-received { background:rgba(16,163,74,0.12); color:var(--success); }
.s-draft    { background:var(--border); color:var(--text-muted); }
.s-void     { background:rgba(220,38,38,0.10); color:var(--danger); }
</style>
