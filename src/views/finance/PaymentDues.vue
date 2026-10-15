<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('finance.dues.title') }}</h1>
        <p class="page-sub">{{ t('finance.dues.sub') }}</p>
      </div>
      <BaseButton @click="openNew()"><Plus :size="14" /> {{ t('finance.dues.new') }}</BaseButton>
    </div>

    <!-- The reminder: open due dates that are late / today / this week -->
    <div v-if="alerts.length" class="pd-alerts">
      <button v-for="a in alerts" :key="a.key" class="pd-alert" :class="a.key" @click="activeTab = a.key">
        <AlertTriangle v-if="a.key === 'late'" :size="15" /><CalendarClock v-else :size="15" />
        {{ a.text }}
      </button>
    </div>

    <div v-if="customerFilter" class="pd-filter">
      {{ t('finance.dues.only_customer', { name: customerFilter.name }) }}
      <button class="pd-filter-x" :aria-label="t('common.clear')" @click="clearCustomer"><X :size="13" /></button>
    </div>

    <div class="pd-tabs">
      <button v-for="tab in tabs" :key="tab" class="tab-btn" :class="{ active: activeTab === tab }" @click="activeTab = tab">
        {{ t('finance.dues.tabs.' + tab) }}
      </button>
    </div>

    <BaseCard>
      <BaseTable :columns="columns" :rows="rows" :loading="loading" :empty-text="t('finance.dues.empty')"
                 storage-key="payment-dues" @row-click="openDetail">
        <template #cell-due_date="{ row }">
          <span :class="{ 'pd-late': row.status === 'OPEN' && row.days_to_due < 0 }">{{ fmtDate(row.due_date) }}</span>
          <div v-if="row.status === 'OPEN'" class="pd-days">{{ dueText(row) }}</div>
        </template>
        <template #cell-customer_name="{ row }">
          <div>{{ row.customer_name }}</div>
          <div v-if="row.customer_phone" class="pd-days">{{ row.customer_phone }}</div>
        </template>
        <template #cell-amount="{ row }"><Money :value="row.amount" /></template>
        <template #cell-plan="{ row }">
          <span v-if="row.plan_count">{{ t('finance.dues.nth', { n: row.plan_seq, of: row.plan_count }) }}</span>
          <span v-else class="pd-days">—</span>
        </template>
        <template #cell-status="{ row }">
          <span class="pd-pill" :class="row.status.toLowerCase()">{{ t('finance.dues.status.' + row.status) }}</span>
        </template>
      </BaseTable>
    </BaseCard>

    <!-- New: one date, or instalments -->
    <AppModal :open="form.open" :title="t('finance.dues.new')" width="640px" :no-backdrop-close="true" @close="form.open = false">
      <div class="pd-grid">
        <BaseSelect v-model="form.customer" :options="customerOptions" :label="t('finance.dues.customer')"
                    :placeholder="t('finance.dues.pick')" />
        <BaseInput v-model="form.amount" type="number" :label="t('finance.dues.amount_total')" placeholder="0" />
        <BaseInput v-model="form.first_date" type="date" :label="form.count > 1 ? t('finance.dues.first_date') : t('finance.dues.due_date')" />
        <BaseInput v-model.number="form.count" type="number" min="1" max="60" :label="t('finance.dues.count')" />
        <template v-if="form.count > 1">
          <BaseInput v-model.number="form.every" type="number" min="1" :label="t('finance.dues.every')" />
          <BaseSelect v-model="form.unit" :options="unitOptions" :label="t('finance.dues.unit')" />
        </template>
      </div>
      <p v-if="pickedCustomer" class="pd-owes" :class="{ none: Number(pickedCustomer.balance) <= 0 }">
        {{ Number(pickedCustomer.balance) > 0 ? t('finance.dues.owes_now', { amount: formatCurrency(pickedCustomer.balance) })
                                              : t('finance.dues.owes_nothing') }}
      </p>
      <BaseInput v-model="form.note" class="pd-note-in" :label="t('finance.dues.note')" />
      <!-- The plan as it will be saved -->
      <div v-if="preview.length > 1" class="pd-preview">
        <div class="pd-preview-title">{{ t('finance.dues.preview', { n: preview.length }) }}</div>
        <div v-for="(p, i) in preview" :key="i" class="pd-preview-row">
          <span>{{ t('finance.dues.nth', { n: i + 1, of: preview.length }) }}</span>
          <span>{{ fmtDate(p.date) }}</span>
          <Money :value="p.amount" />
        </div>
      </div>
      <p class="pd-hint">{{ t('finance.dues.reminder_hint') }}</p>
      <p v-if="error" class="pd-error">{{ error }}</p>
      <template #footer>
        <BaseButton variant="ghost" @click="form.open = false">{{ t('common.cancel') }}</BaseButton>
        <BaseButton :loading="saving" :disabled="!canSave" @click="saveNew">{{ t('common.save') }}</BaseButton>
      </template>
    </AppModal>

    <!-- One due date: take the payment / move / close / cancel -->
    <AppModal :open="!!detail" :title="detail ? detail.customer_name : ''" width="600px" @close="detail = null">
      <template v-if="detail">
        <div class="pd-meta">
          <div><span>{{ t('finance.dues.amount') }}</span><Money :value="detail.amount" /></div>
          <div><span>{{ t('finance.dues.due_date') }}</span>{{ fmtDate(detail.due_date) }}
            <template v-if="detail.status === 'OPEN'"> · {{ dueText(detail) }}</template></div>
          <div v-if="detail.plan_count"><span>{{ t('finance.dues.cols.plan') }}</span>{{ t('finance.dues.nth', { n: detail.plan_seq, of: detail.plan_count }) }}</div>
          <div><span>{{ t('finance.dues.cols.status') }}</span>{{ t('finance.dues.status.' + detail.status) }}
            <template v-if="detail.done_on"> · {{ fmtDate(detail.done_on) }}</template></div>
          <div v-if="detail.invoice_number"><span>{{ t('finance.dues.sale') }}</span>#{{ detail.invoice_number }}</div>
          <div v-if="detail.created_by_name"><span>{{ t('finance.dues.by') }}</span>{{ detail.created_by_name }}</div>
        </div>
        <p v-if="detail.note" class="pd-note">{{ detail.note }}</p>
        <p v-if="detail.status_reason" class="pd-reason">{{ detail.status_reason }}</p>
        <p v-if="detail.receipt" class="pd-hint">{{ t('finance.dues.paid_by_receipt') }}</p>

        <div v-if="act === 'move'" class="pd-act">
          <BaseInput v-model="actForm.due_date" type="date" :label="t('finance.dues.due_date')" />
          <BaseInput v-model="actForm.amount" type="number" :label="t('finance.dues.amount')" />
          <BaseInput v-model="actForm.note" :label="t('finance.dues.note')" />
        </div>
        <div v-if="act === 'close' || act === 'cancel'" class="pd-act">
          <BaseInput v-model="actForm.reason" :label="t('finance.dues.reason')" />
          <p class="pd-hint">{{ t('finance.dues.' + act + '_hint') }}</p>
        </div>
        <p v-if="error" class="pd-error">{{ error }}</p>
      </template>
      <template #footer>
        <BaseButton variant="ghost" @click="detail = null">{{ t('common.close') }}</BaseButton>
        <template v-if="detail && detail.status === 'OPEN' && !act">
          <BaseButton variant="secondary" @click="startAct('cancel')">{{ t('finance.dues.cancel') }}</BaseButton>
          <BaseButton variant="secondary" @click="startAct('close')">{{ t('finance.dues.close_no_money') }}</BaseButton>
          <BaseButton variant="secondary" @click="startAct('move')">{{ t('finance.dues.move') }}</BaseButton>
          <BaseButton @click="startPay"><HandCoins :size="14" /> {{ t('finance.dues.take_payment') }}</BaseButton>
        </template>
        <BaseButton v-else-if="detail && act" :variant="act === 'cancel' ? 'danger' : 'primary'" :loading="saving"
                    :disabled="!actReady" @click="doAct">
          {{ t('finance.dues.confirm.' + act) }}
        </BaseButton>
      </template>
    </AppModal>

    <!-- The money comes in through the normal customer payment; the due date then links that receipt -->
    <ReceivePaymentModal :open="pay.open" :customer="pay.customer" :amount="pay.amount"
                         @close="pay.open = false" @received="onPaid" />
  </div>
</template>

<script setup>
/* Payment due dates (s173, PAYMENT-DUES.md): when a customer promised to pay — one date or instalments. A reminder,
   never money: the debt is the customer's balance. "Take payment" = the normal customer receipt, then the due date
   is closed with that receipt. The banner + the bell notification on the day are the reminder. */
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { Plus, AlertTriangle, CalendarClock, HandCoins, X } from 'lucide-vue-next'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'
import BaseTable from '@/components/base/BaseTable.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import Money from '@/components/ui/Money.vue'
import ReceivePaymentModal from '@/components/shared/ReceivePaymentModal.vue'
import { formatCurrency } from '@/utils/format'
import i18n from '@/i18n'

const { t, locale } = useI18n()
const route = useRoute()
const router = useRouter()

const tabs = ['open', 'late', 'today', 'soon', 'done', 'cancelled', 'all']
const activeTab = ref('open')
const loading = ref(false)
const rows = ref([])
const summary = ref(null)
const customers = ref([])
const saving = ref(false)
const error = ref('')
const detail = ref(null)
const act = ref('')
const pay = reactive({ open: false, customer: null, amount: '' })
const localISO = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const form = reactive({ open: false, customer: '', amount: '', first_date: '', count: 1, every: 1, unit: 'MONTH', note: '' })
const actForm = reactive({ due_date: '', amount: '', note: '', reason: '' })

const columns = computed(() => [
  { key: 'due_date',      label: t('finance.dues.due_date') },
  { key: 'customer_name', label: t('finance.dues.customer') },
  { key: 'amount',        label: t('finance.dues.amount'), type: 'currency' },
  { key: 'plan',          label: t('finance.dues.cols.plan') },
  { key: 'note',          label: t('finance.dues.note') },
  { key: 'status',        label: t('finance.dues.cols.status') },
])
const customerOptions = computed(() => customers.value.filter(c => !c.is_walk_in).map(c => ({ value: c.id, label: c.name })))
const unitOptions = computed(() => ['MONTH', 'WEEK', 'DAY'].map(u => ({ value: u, label: t('finance.dues.units.' + u) })))
const pickedCustomer = computed(() => customers.value.find(c => c.id === form.customer) || null)
const customerFilter = computed(() => {
  const id = route.query.customer
  return id ? (customers.value.find(c => c.id === id) || { id, name: '…' }) : null
})

// The same plan the server will save (finance/payment_dues.py schedule + split): equal parts in whole cents, the
// last takes what is left; months keep the day (the 31st → the month's last day).
function addMonths(iso, n) {
  const [y, m, d] = iso.split('-').map(Number)
  const t0 = new Date(y, m - 1 + n, 1)
  const last = new Date(t0.getFullYear(), t0.getMonth() + 1, 0).getDate()
  return localISO(new Date(t0.getFullYear(), t0.getMonth(), Math.min(d, last)))
}
function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number)
  return localISO(new Date(y, m - 1, d + n))
}
const preview = computed(() => {
  const count = Math.floor(Number(form.count) || 0), every = Math.floor(Number(form.every) || 0)
  const cents = Math.round((Number(form.amount) || 0) * 100)
  if (!form.first_date || count < 1 || count > 60 || every < 1 || cents < count) return []
  const part = Math.floor(cents / count)
  return Array.from({ length: count }, (_, i) => ({
    date: form.unit === 'MONTH' ? addMonths(form.first_date, i * every)
      : addDays(form.first_date, i * every * (form.unit === 'WEEK' ? 7 : 1)),
    amount: (i === count - 1 ? cents - part * (count - 1) : part) / 100,
  }))
})
const canSave = computed(() => !saving.value && form.customer && Number(form.amount) > 0 && form.first_date &&
  preview.value.length >= 1)
const actReady = computed(() => act.value === 'move' ? !!actForm.due_date && Number(actForm.amount) > 0 : !!actForm.reason.trim())

const alerts = computed(() => {
  const s = summary.value
  if (!s) return []
  return ['late', 'today', 'soon'].filter(k => s[k]?.count)
    .map(k => ({ key: k, text: t('finance.dues.alert.' + k, { n: s[k].count, total: formatCurrency(s[k].total) }) }))
})

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + (String(d).length === 10 ? 'T12:00:00' : '')).toLocaleDateString(
    locale.value === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
}
function dueText(row) {
  const n = row.days_to_due
  if (n < 0) return t('finance.dues.days_late', { n: -n })
  if (n === 0) return t('finance.dues.due_today')
  return t('finance.dues.days_left', { n })
}
function errText(e) {
  const d = e?.response?.data
  if (d?.code && i18n.global.te('finance.dues.err.' + d.code, 'en')) return t('finance.dues.err.' + d.code)
  const first = d && typeof d === 'object' ? Object.values(d).flat()[0] : ''
  return (typeof first === 'string' && first) || t('finance.dues.err.generic')
}

function params() {
  const p = { open: { status: 'OPEN' }, late: { due: 'late' }, today: { due: 'today' }, soon: { due: 'soon' },
              done: { status: 'DONE' }, cancelled: { status: 'CANCELLED' }, all: {} }[activeTab.value]
  return route.query.customer ? { ...p, customer: route.query.customer } : p
}
async function load() {
  loading.value = true
  try {
    const [r, s] = await Promise.all([api.get('/api/finance/payment-dues/', { params: { ...params(), page_size: 500 } }),
                                      api.get('/api/finance/payment-dues/summary/')])
    rows.value = Array.isArray(r.data) ? r.data : (r.data.results || [])
    summary.value = s.data
  } catch { rows.value = [] } finally { loading.value = false }
}
function clearCustomer() { router.replace({ query: {} }) }

function openNew(customerId = '') {
  Object.assign(form, { open: true, customer: customerId || route.query.customer || '', amount: '',
    first_date: addMonths(localISO(new Date()), 1), count: 1, every: 1, unit: 'MONTH', note: '' })
  error.value = ''
}
async function saveNew() {
  saving.value = true
  error.value = ''
  try {
    const body = { customer: form.customer, amount: form.amount, first_date: form.first_date, count: form.count,
                   note: form.note, ...(form.count > 1 ? { every: form.every, unit: form.unit } : {}) }
    await api.post('/api/finance/payment-dues/', body)
    form.open = false
    activeTab.value = 'open'
    load()
  } catch (e) { error.value = errText(e) } finally { saving.value = false }
}

function openDetail(row) {
  detail.value = row
  act.value = ''
  error.value = ''
}
function startAct(kind) {
  act.value = kind
  Object.assign(actForm, { due_date: detail.value.due_date, amount: detail.value.amount, note: detail.value.note || '', reason: '' })
}
async function doAct() {
  saving.value = true
  error.value = ''
  const id = detail.value.id
  try {
    if (act.value === 'move') {
      detail.value = (await api.patch(`/api/finance/payment-dues/${id}/`,
        { due_date: actForm.due_date, amount: actForm.amount, note: actForm.note })).data
    } else {
      detail.value = (await api.post(`/api/finance/payment-dues/${id}/${act.value === 'close' ? 'done' : 'cancel'}/`,
        { reason: actForm.reason })).data
    }
    act.value = ''
    load()
  } catch (e) { error.value = errText(e) } finally { saving.value = false }
}
async function startPay() {
  error.value = ''
  try {
    pay.customer = (await api.get(`/api/auth/customers/${detail.value.customer}/`)).data   // live balance
    pay.amount = detail.value.amount
    pay.open = true
  } catch (e) { error.value = errText(e) }
}
async function onPaid(receipt) {
  pay.open = false
  try {
    detail.value = (await api.post(`/api/finance/payment-dues/${detail.value.id}/done/`, { receipt: receipt?.id })).data
  } catch (e) { error.value = errText(e) }
  load()
}

watch(activeTab, load)
watch(() => route.query.customer, load)
onMounted(async () => {
  load()
  try {
    const r = await api.get('/api/auth/customers/', { params: { page_size: 500 } })
    customers.value = Array.isArray(r.data) ? r.data : (r.data.results || [])
  } catch { customers.value = [] }
  if (route.query.new) openNew(route.query.customer)
})
</script>

<style scoped>
.pd-alerts { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.pd-alert { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 10px; border: 1px solid var(--border);
  background: var(--bg-card); color: var(--text-primary); font-size: 13px; cursor: pointer; }
.pd-alert.late { border-color: var(--danger); color: var(--danger); background: var(--danger-soft); }
.pd-alert.today, .pd-alert.soon { border-color: var(--accent); background: var(--accent-soft); }
.pd-filter { display: inline-flex; align-items: center; gap: 8px; margin-bottom: 12px; padding: 6px 10px; border-radius: 999px;
  background: var(--accent-soft); color: var(--text-primary); font-size: 13px; }
.pd-filter-x { display: inline-flex; border: none; background: none; color: var(--text-muted); cursor: pointer; padding: 0; }
.pd-tabs { display: flex; flex-wrap: wrap; border-bottom: 1px solid var(--border); margin-bottom: 12px; }
.tab-btn { padding: 9px 16px; font-size: 13.5px; font-weight: 500; color: var(--text-muted); border: none; background: none;
  cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
.tab-btn:hover { color: var(--text-primary); }
.tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }
.pd-late { color: var(--danger); font-weight: 600; }
.pd-days { font-size: 12px; color: var(--text-muted); }
.pd-pill { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: var(--bg-app); color: var(--text-secondary); }
.pd-pill.open { background: var(--accent-soft); color: var(--accent); }
.pd-pill.done { background: var(--success-soft); color: var(--success); }
.pd-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.pd-note-in { margin-top: 12px; }
.pd-owes { margin: 10px 0 0; font-size: 13px; color: var(--text-secondary); }
.pd-owes.none { color: var(--warning-hover); }
.pd-preview { margin-top: 14px; border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; background: var(--bg-app);
  max-height: 220px; overflow-y: auto; }
.pd-preview-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--text-muted); margin-bottom: 6px; }
.pd-preview-row { display: grid; grid-template-columns: 1fr 1fr auto; gap: 8px; font-size: 13px; padding: 3px 0; color: var(--text-primary); }
.pd-meta { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px 16px; color: var(--text-primary); }
.pd-meta span { display: block; font-size: 12px; color: var(--text-muted); }
.pd-note { margin-top: 12px; color: var(--text-secondary); white-space: pre-wrap; }
.pd-reason { margin-top: 8px; color: var(--text-secondary); font-weight: 600; }
.pd-act { margin-top: 16px; display: grid; gap: 12px; }
.pd-hint { margin: 8px 0 0; font-size: 12px; color: var(--text-muted); }
.pd-error { margin-top: 12px; color: var(--danger); font-size: 13px; }
</style>
