<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('finance.reservations.title') }}</h1>
        <p class="page-sub">{{ t('finance.reservations.sub') }}</p>
      </div>
      <BaseButton v-if="fmt.reservationsEnabled" @click="openNew"><Plus :size="14" /> {{ t('finance.reservations.new') }}</BaseButton>
    </div>

    <p v-if="!fmt.reservationsEnabled" class="rs-off">{{ t('finance.reservations.switch_off') }}</p>

    <div class="rs-tabs">
      <button v-for="tab in tabs" :key="tab" class="tab-btn" :class="{ active: activeTab === tab }" @click="activeTab = tab">
        {{ t('finance.reservations.tabs.' + tab) }}
      </button>
      <div class="rs-search"><BaseInput v-model="q" :placeholder="t('finance.reservations.search_ph')" @update:model-value="debouncedLoad" /></div>
    </div>

    <BaseCard>
      <BaseTable :columns="columns" :rows="rows" :loading="loading" :empty-text="t('finance.reservations.empty')"
                 storage-key="reservations" @row-click="openDetail">
        <template #cell-number="{ row }">#{{ row.number }}</template>
        <template #cell-customer_name="{ row }">
          {{ row.customer_name }}<div class="rs-sub">{{ row.customer_phone }}</div>
        </template>
        <template #cell-items="{ row }">{{ itemsText(row) }}</template>
        <template #cell-total="{ row }"><Money :value="row.total" /></template>
        <template #cell-deposit_held="{ row }"><Money :value="row.deposit_held" /></template>
        <template #cell-still_due="{ row }"><Money :value="row.still_due" /></template>
        <template #cell-hold_until="{ row }">
          <span :class="{ 'rs-late': row.overdue }">{{ fmtDate(row.hold_until) }}</span>
        </template>
        <template #cell-status="{ row }">
          <span class="rs-pill" :class="row.overdue ? 'late' : row.status.toLowerCase()">
            {{ row.overdue ? t('finance.reservations.overdue') : t('finance.reservations.status.' + row.status) }}
          </span>
        </template>
      </BaseTable>
    </BaseCard>

    <!-- New reservation -->
    <AppModal :open="form.open" :title="t('finance.reservations.new')" width="900px" :no-backdrop-close="true" @close="form.open = false">
      <div class="rs-grid">
        <BaseSelect v-model="form.customer" :options="customerOptions" :label="t('finance.reservations.customer')"
                    :placeholder="t('finance.reservations.pick')" />
        <BaseSelect v-model="form.branch" :options="branchOptions" :label="t('finance.reservations.branch')" />
        <BaseInput v-model="form.hold_until" type="date" :label="t('finance.reservations.hold_until')" />
      </div>

      <div class="rs-add">
        <BaseInput v-model="search" :label="t('finance.reservations.add_item')" :placeholder="t('finance.reservations.item_ph')"
                   @update:model-value="searchItems" />
        <div v-if="results.length" class="rs-results">
          <div v-for="v in results" :key="v.id" class="rs-result" @click="addItem(v)">
            <span class="rs-sku">{{ v.sku }}</span><span class="rs-name">{{ v.product_name }}</span>
            <span class="rs-stock">{{ t('finance.reservations.in_stock', { n: fmtQty(v.total_stock) }) }}</span>
          </div>
        </div>
      </div>

      <div v-if="form.items.length" class="rs-lines">
        <div class="rs-line rs-line-head">
          <span>{{ t('finance.reservations.cols.item') }}</span><span>{{ t('finance.reservations.qty') }}</span>
          <span>{{ t('finance.reservations.price') }}</span><span>{{ t('finance.reservations.cols.total') }}</span><span />
        </div>
        <div v-for="(it, i) in form.items" :key="it.variant" class="rs-line">
          <div>
            <div class="rs-name">{{ it.name }}</div><div class="rs-sub">{{ it.sku }}</div>
            <BaseInput v-if="it.track_serials" v-model="it.serials" :placeholder="t('finance.reservations.serials_ph')" />
          </div>
          <BaseInput v-model="it.quantity" type="number" />
          <BaseInput v-model="it.unit_price" type="number" />
          <span class="rs-num"><Money :value="lineTotal(it)" /></span>
          <BaseButton variant="ghost" size="sm" @click="form.items.splice(i, 1)"><X :size="14" /></BaseButton>
        </div>
        <div class="rs-sum">{{ t('finance.reservations.before_tax') }} <Money :value="formTotal" /></div>
      </div>

      <div class="rs-grid rs-dep">
        <BaseInput v-model="form.deposit_amount" type="number" :label="t('finance.reservations.first_deposit')" placeholder="0" />
        <BaseSelect v-model="form.deposit_method" :options="moneyMethodOptions" :label="t('finance.reservations.method')" />
        <BaseInput v-model="form.note" :label="t('finance.reservations.note')" />
      </div>
      <p class="rs-hint">{{ t('finance.reservations.hold_hint') }}</p>
      <p v-if="error" class="rs-error">{{ error }}</p>
      <template #footer>
        <BaseButton variant="ghost" @click="form.open = false">{{ t('common.cancel') }}</BaseButton>
        <BaseButton :loading="saving" :disabled="!canSave" @click="saveNew">{{ t('common.save') }}</BaseButton>
      </template>
    </AppModal>

    <!-- One reservation -->
    <AppModal :open="!!detail" :title="detail ? t('finance.reservations.detail_title', { n: detail.number }) : ''" width="760px" @close="detail = null">
      <template v-if="detail">
        <div class="rs-meta">
          <div><span>{{ t('finance.reservations.customer') }}</span>{{ detail.customer_name }} <small>{{ detail.customer_phone }}</small></div>
          <div><span>{{ t('finance.reservations.branch') }}</span>{{ detail.branch_name }}</div>
          <div><span>{{ t('finance.reservations.cols.date') }}</span>{{ fmtDate(detail.date) }}</div>
          <div><span>{{ t('finance.reservations.hold_until') }}</span>
            <span :class="{ 'rs-late': detail.overdue }">{{ fmtDate(detail.hold_until) }}</span></div>
          <div><span>{{ t('finance.reservations.cols.status') }}</span>{{ t('finance.reservations.status.' + detail.status) }}
            <template v-if="detail.sale_number"> · {{ t('finance.reservations.sale_n', { n: detail.sale_number }) }}</template></div>
          <div><span>{{ t('finance.reservations.salesperson') }}</span>{{ detail.salesperson_name || '—' }}</div>
        </div>

        <div class="rs-lines rs-lines-ro">
          <div v-for="it in detail.items" :key="it.id" class="rs-line-ro">
            <div><div class="rs-name">{{ it.name }}</div>
              <div class="rs-sub">{{ it.sku }}<template v-if="it.serial_numbers.length"> · {{ it.serial_numbers.join(', ') }}</template></div></div>
            <span class="rs-num">{{ fmtQty(it.quantity) }} × <Money :value="it.unit_price" /></span>
            <span class="rs-num"><Money :value="it.total" /></span>
          </div>
        </div>
        <div class="rs-totals">
          <div><span>{{ t('finance.reservations.cols.total') }}</span><Money :value="detail.total" /></div>
          <div><span>{{ t('finance.reservations.cols.deposit') }}</span><Money :value="detail.deposit_held" /></div>
          <div v-if="detail.status === 'OPEN'" class="strong"><span>{{ t('finance.reservations.cols.due') }}</span><Money :value="detail.still_due" /></div>
        </div>

        <div v-if="detail.deposits.length" class="rs-deps">
          <div class="rs-deps-title">{{ t('finance.reservations.deposits') }}</div>
          <div v-for="d in detail.deposits" :key="d.id" class="rs-dep-row">
            <span>{{ fmtDateTime(d.created_at) }}</span>
            <span>{{ d.method_name }}</span>
            <span class="rs-sub">{{ d.created_by_name }}<template v-if="d.note"> · {{ d.note }}</template></span>
            <span class="rs-num" :class="Number(d.amount) < 0 ? 'neg' : 'pos'"><Money :value="d.amount" /></span>
          </div>
        </div>

        <p v-if="detail.note" class="rs-note">{{ detail.note }}</p>
        <p v-if="detail.status === 'CANCELLED'" class="rs-reason">
          {{ t('finance.reservations.cancelled_by', { who: detail.cancelled_by_name, when: fmtDate(detail.cancelled_at) }) }}
          · {{ detail.cancel_reason }}
          <template v-if="detail.deposit_outcome"> · {{ t('finance.reservations.outcome.' + detail.deposit_outcome) }}</template>
        </p>
        <p v-if="Number(detail.converted_extra_to_credit) > 0" class="rs-hint">
          {{ t('finance.reservations.extra_to_credit', { amount: formatCurrency(detail.converted_extra_to_credit) }) }}
        </p>

        <!-- actions -->
        <div v-if="act === 'deposit' || act === 'give-back'" class="rs-act rs-grid">
          <BaseInput v-model="actForm.amount" type="number" :label="t('finance.reservations.amount')" />
          <BaseSelect v-model="actForm.method" :options="moneyMethodOptions" :label="t('finance.reservations.method')" />
          <BaseInput v-model="actForm.note" :label="t('finance.reservations.note')" />
        </div>
        <div v-if="act === 'convert'" class="rs-act">
          <BaseInput v-for="it in needSerials" :key="it.id" v-model="actForm.serials[it.id]"
                     :label="t('finance.reservations.serials_for', { name: it.name, n: fmtQty(it.quantity - it.serial_numbers.length) })"
                     :placeholder="t('finance.reservations.serials_scan')" />
          <div class="rs-grid">
            <BaseSelect v-model="actForm.method" :options="payMethodOptions" :label="t('finance.reservations.pay_rest_with')" />
            <BaseInput v-if="!isAjel(actForm.method)" v-model="actForm.amount" type="number" :label="t('finance.reservations.amount')" />
          </div>
          <p class="rs-hint">{{ t('finance.reservations.convert_hint') }}</p>
        </div>
        <div v-if="act === 'cancel'" class="rs-act">
          <div v-if="Number(detail.deposit_held) > 0" class="rs-pick">
            <button v-for="o in outcomes" :key="o" type="button" class="rs-pick-btn" :class="{ on: actForm.outcome === o }" @click="actForm.outcome = o">
              {{ t('finance.reservations.outcome_pick.' + o) }}
            </button>
          </div>
          <div class="rs-grid">
            <BaseSelect v-if="actForm.outcome === 'REFUNDED' && Number(detail.deposit_held) > 0 && depositSplit.length <= 1" v-model="actForm.method"
                        :options="moneyMethodOptions" :label="t('finance.reservations.give_back_by')" />
            <BaseInput v-model="actForm.reason" :label="t('finance.reservations.reason')" />
          </div>
          <p v-if="Number(detail.deposit_held) > 0" class="rs-hint">{{ t('finance.reservations.outcome_hint.' + actForm.outcome) }}</p>
          <p v-if="actForm.outcome === 'REFUNDED' && depositSplit.length > 1" class="rs-hint">
            {{ t('finance.reservations.give_back_split') }}
            <template v-for="(p, i) in depositSplit" :key="p.method"><span v-if="i"> · </span><Money :value="p.amount" /> {{ p.name }}</template>
          </p>
        </div>
        <p v-if="error" class="rs-error">{{ error }}</p>
      </template>
      <template #footer>
        <BaseButton variant="ghost" @click="detail = null">{{ t('common.close') }}</BaseButton>
        <template v-if="detail && detail.status === 'OPEN' && !act">
          <BaseButton variant="danger" @click="startAct('cancel')">{{ t('finance.reservations.cancel') }}</BaseButton>
          <BaseButton v-if="isManager && Number(detail.deposit_held) > 0" variant="secondary" @click="startAct('give-back')">{{ t('finance.reservations.give_back') }}</BaseButton>
          <BaseButton variant="secondary" @click="startAct('deposit')">{{ t('finance.reservations.add_deposit') }}</BaseButton>
          <BaseButton @click="startAct('convert')">{{ t('finance.reservations.convert') }}</BaseButton>
        </template>
        <template v-else-if="detail && act">
          <BaseButton variant="ghost" @click="act = ''">{{ t('common.back') }}</BaseButton>
          <BaseButton :variant="act === 'cancel' ? 'danger' : 'primary'" :loading="saving" :disabled="!actReady" @click="doAct">
            {{ t('finance.reservations.confirm.' + act) }}
          </BaseButton>
        </template>
        <BaseButton v-if="detail && detail.sale" variant="secondary" @click="$router.push(`/finance/invoices/${detail.sale}`)">
          {{ t('finance.reservations.open_sale') }}
        </BaseButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
/* Reservations with a deposit (s172, RESERVATIONS.md). Items held for a named customer — still on the shelf, not for
   sale to anyone else; deposits are real money in the drawer / box; Convert = a normal sale through the till's own
   checkout rules (the deposit counts as paid); Cancel = held stock free, the deposit given back / kept / store credit. */
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, X } from 'lucide-vue-next'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'
import BaseTable from '@/components/base/BaseTable.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import Money from '@/components/ui/Money.vue'
import { formatCurrency, formatQty } from '@/utils/format'
import { useAuthStore, ROLE_RANK } from '@/stores/auth'
import { useFormatStore } from '@/stores/format'
import { treasuryError } from '@/utils/treasury'
import { serialErrorText } from '@/utils/serials'
import i18n from '@/i18n'

const { t, locale } = useI18n()
const auth = useAuthStore()
const fmt = useFormatStore()

const tabs = ['open', 'overdue', 'converted', 'cancelled', 'all']
const activeTab = ref('open')
const q = ref('')
const loading = ref(false)
const rows = ref([])
const customers = ref([])
const branches = ref([])
const methods = ref([])
const saving = ref(false)
const error = ref('')
const detail = ref(null)
const act = ref('')
const search = ref('')
const results = ref([])
const form = reactive({ open: false, customer: '', branch: '', hold_until: '', note: '', items: [],
  deposit_amount: '', deposit_method: '' })
const actForm = reactive({ amount: '', method: '', note: '', reason: '', outcome: 'REFUNDED', serials: {} })

const isManager = computed(() => (ROLE_RANK[auth.user?.role] || 0) >= ROLE_RANK.MANAGER)
const outcomes = computed(() => isManager.value ? ['REFUNDED', 'TO_CREDIT', 'KEPT'] : ['REFUNDED', 'TO_CREDIT'])
const columns = computed(() => [
  { key: 'number',        label: '#' },
  { key: 'customer_name', label: t('finance.reservations.customer') },
  { key: 'items',         label: t('finance.reservations.cols.items') },
  { key: 'total',         label: t('finance.reservations.cols.total'), type: 'currency' },
  { key: 'deposit_held',  label: t('finance.reservations.cols.deposit'), type: 'currency' },
  { key: 'still_due',     label: t('finance.reservations.cols.due'), type: 'currency' },
  { key: 'hold_until',    label: t('finance.reservations.hold_until') },
  { key: 'status',        label: t('finance.reservations.cols.status') },
])
const customerOptions = computed(() => customers.value.filter(c => !c.is_walk_in)
  .map(c => ({ value: c.id, label: c.phone_number ? `${c.name} · ${c.phone_number}` : c.name })))
const branchOptions = computed(() => branches.value.map(b => ({ value: b.id, label: b.name })))
// A deposit is real money: never Ajel or store credit.
// s175: what is held per method (net of give-backs, taken off the methods paid last) — the server's own split, so a
// deposit paid two ways is given back the way it came in.
const depositSplit = computed(() => {
  const order = [], net = {}, name = {}
  for (const d of [...(detail.value?.deposits || [])].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))) {
    if (!(d.method in net)) { order.push(d.method); net[d.method] = 0; name[d.method] = d.method_name }
    net[d.method] += Number(d.amount)
  }
  let short = -order.reduce((s, m) => s + Math.min(net[m], 0), 0)
  const split = order.filter(m => net[m] > 0).map(m => ({ method: m, name: name[m], amount: net[m] }))
  for (const row of [...split].reverse()) { const take = Math.min(row.amount, short); row.amount -= take; short -= take }
  return split.filter(r => r.amount > 0.0001)
})
const moneyMethodOptions = computed(() => methods.value.filter(m => !m.is_agel && !m.is_store_credit)
  .map(m => ({ value: m.id, label: m.name })))
const payMethodOptions = computed(() => methods.value.filter(m => !m.is_store_credit).map(m => ({ value: m.id, label: m.name })))
const isAjel = id => !!methods.value.find(m => m.id === id)?.is_agel

// Serial-tracked lines reserved without (all) their serials: the exact units are picked when the sale is made.
const needSerials = computed(() => (detail.value?.items || [])
  .filter(it => it.track_serials && it.serial_numbers.length < Number(it.quantity)))
const lineTotal = it => (Number(it.quantity) || 0) * (Number(it.unit_price) || 0)
const formTotal = computed(() => form.items.reduce((s, it) => s + lineTotal(it), 0))
const canSave = computed(() => !saving.value && form.customer && form.branch && form.items.length &&
  form.items.every(it => Number(it.quantity) > 0 && Number(it.unit_price) >= 0) &&
  (!(Number(form.deposit_amount) > 0) || form.deposit_method))
const actReady = computed(() => {
  if (act.value === 'deposit' || act.value === 'give-back') return Number(actForm.amount) > 0 && !!actForm.method
  if (act.value === 'convert') return (!!actForm.method || Number(detail.value?.still_due) <= 0) &&
    needSerials.value.every(it => (actForm.serials[it.id] || '').trim())
  if (act.value === 'cancel') return !!actForm.reason.trim()
  return false
})

const fmtQty = v => formatQty(v)
function fmtDate(d) {
  if (!d) return '—'
  return new Date(String(d).length === 10 ? d + 'T12:00:00' : d).toLocaleDateString(
    locale.value === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
}
function fmtDateTime(d) {
  return new Date(d).toLocaleString(locale.value === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB',
    { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function itemsText(row) {
  const first = row.items[0]
  if (!first) return '—'
  const more = row.items.length - 1
  return `${formatQty(first.quantity)} × ${first.name}` + (more > 0 ? ` ${t('finance.reservations.and_more', { n: more })}` : '')
}
function errText(e) {
  const d = e?.response?.data
  const serialMsg = serialErrorText(t, d)
  if (serialMsg) return serialMsg
  if (d?.code && i18n.global.te('finance.reservations.err.' + d.code, 'en')) return t('finance.reservations.err.' + d.code, d)
  if (d?.shortages) return t('finance.reservations.err.not_enough_stock', { product: d.shortages[0]?.name, available: d.shortages[0]?.available })
  return treasuryError(t, e, t('finance.reservations.err.generic'))
}

function params() {
  const p = { open: { status: 'OPEN' }, overdue: { overdue: 1 }, converted: { status: 'CONVERTED' },
              cancelled: { status: 'CANCELLED' }, all: {} }[activeTab.value]
  return q.value.trim() ? { ...p, q: q.value.trim() } : p
}
async function load() {
  loading.value = true
  try {
    const r = await api.get('/api/finance/reservations/', { params: { ...params(), page_size: 200 } })
    rows.value = Array.isArray(r.data) ? r.data : (r.data.results || [])
  } catch { rows.value = [] } finally { loading.value = false }
}
let loadTimer = null
function debouncedLoad() { clearTimeout(loadTimer); loadTimer = setTimeout(load, 300) }

let searchTimer = null
function searchItems() {
  clearTimeout(searchTimer)
  if (!search.value.trim()) { results.value = []; return }
  searchTimer = setTimeout(async () => {
    try {
      const r = await api.get('/api/inventory/variants/', { params: { search: search.value, page_size: 8 } })
      results.value = (r.data.results ?? r.data).map(v => ({ ...v,
        total_stock: (v.stock_levels || []).filter(s => !form.branch || s.branch === form.branch)
          .reduce((s, x) => s + Number(x.quantity || 0), 0) }))
    } catch { results.value = [] }
  }, 280)
}
function addItem(v) {
  if (!form.items.find(i => i.variant === v.id)) {
    form.items.push({ variant: v.id, sku: v.sku, name: v.product_name, quantity: 1, unit_price: v.sell_price,
                      track_serials: !!v.track_serials, serials: '' })
  }
  results.value = []
  search.value = ''
}

function openNew() {
  Object.assign(form, { open: true, customer: '', branch: branches.value[0]?.id || '', hold_until: '', note: '', items: [],
    deposit_amount: '', deposit_method: methods.value.find(m => m.is_cash)?.id || moneyMethodOptions.value[0]?.value || '' })
  error.value = ''
}
async function saveNew() {
  saving.value = true
  error.value = ''
  try {
    const body = {
      customer: form.customer, branch: form.branch, note: form.note,
      ...(form.hold_until ? { hold_until: form.hold_until } : {}),
      items: form.items.map(it => ({ variant: it.variant, quantity: it.quantity, unit_price: it.unit_price,
        serial_numbers: it.track_serials ? it.serials : [] })),
      ...(Number(form.deposit_amount) > 0 ? { deposit_amount: form.deposit_amount, deposit_method: form.deposit_method } : {}),
    }
    const r = await api.post('/api/finance/reservations/', body)
    form.open = false
    activeTab.value = 'open'
    load()
    openDetail(r.data)
  } catch (e) { error.value = errText(e) } finally { saving.value = false }
}

function openDetail(row) {
  detail.value = row
  act.value = ''
  error.value = ''
}
function startAct(kind) {
  act.value = kind
  error.value = ''
  const lastDep = [...(detail.value.deposits || [])].reverse().find(d => Number(d.amount) > 0)
  const cash = methods.value.find(m => m.is_cash)
  Object.assign(actForm, { amount: '', note: '', reason: '', outcome: 'REFUNDED', serials: {},
    method: lastDep?.method || cash?.id || moneyMethodOptions.value[0]?.value || '' })
  if (kind === 'convert') {
    actForm.method = cash?.id || payMethodOptions.value[0]?.value || ''
    actForm.amount = detail.value.still_due
  }
}
async function doAct() {
  saving.value = true
  error.value = ''
  const id = detail.value.id
  let body
  if (act.value === 'deposit' || act.value === 'give-back') body = { amount: actForm.amount, method: actForm.method, note: actForm.note }
  else if (act.value === 'cancel') body = { outcome: actForm.outcome, reason: actForm.reason, method: actForm.method }
  else {
    const due = Number(detail.value.still_due)
    body = due <= 0 ? {} : { payments: [{ method: actForm.method, amount: isAjel(actForm.method) ? String(due) : actForm.amount }] }
    if (needSerials.value.length) body.serials = actForm.serials
  }
  try {
    const headers = act.value === 'convert' ? { 'Idempotency-Key': crypto.randomUUID() } : {}
    await api.post(`/api/finance/reservations/${id}/${act.value}/`, body, { headers })
    detail.value = (await api.get(`/api/finance/reservations/${id}/`)).data
    act.value = ''
    load()
  } catch (e) { error.value = errText(e) } finally { saving.value = false }
}

watch(activeTab, load)
onMounted(async () => {
  load()
  const [c, b, m] = await Promise.allSettled([api.get('/api/auth/customers/', { params: { page_size: 500 } }),
    api.get('/api/core/branches/'), api.get('/api/finance/payment-methods/')])
  const list = r => r.status === 'fulfilled' ? (Array.isArray(r.value.data) ? r.value.data : (r.value.data.results || [])) : []
  customers.value = list(c); branches.value = list(b); methods.value = list(m)
})
</script>

<style scoped>
.rs-off { padding: 12px 14px; border: 1px solid var(--border); border-radius: 10px; background: var(--bg-card);
  color: var(--text-secondary); margin-bottom: 12px; font-size: 13px; }
.rs-tabs { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 8px; border-bottom: 1px solid var(--border); margin-bottom: 12px; }
.rs-search { margin-inline-start: auto; min-width: 240px; padding-bottom: 6px; }
.tab-btn { padding: 9px 16px; font-size: 13.5px; font-weight: 500; color: var(--text-muted); border: none; background: none;
  cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
.tab-btn:hover { color: var(--text-primary); }
.tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }
.rs-sub { font-size: 12px; color: var(--text-muted); }
.rs-late { color: var(--danger); font-weight: 600; }
.rs-pill { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: var(--bg-app); color: var(--text-secondary); }
.rs-pill.open { background: var(--accent-soft); color: var(--accent); }
.rs-pill.converted { background: var(--success-soft); color: var(--success); }
.rs-pill.late { background: var(--danger-soft); color: var(--danger); }
.rs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.rs-add { position: relative; margin-top: 14px; }
.rs-results { position: absolute; inset-inline: 0; z-index: 5; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-card);
  box-shadow: 0 4px 16px rgba(0,0,0,.12); overflow: hidden; margin-top: 4px; }
.rs-result { display: flex; gap: 10px; align-items: center; padding: 8px 12px; cursor: pointer; font-size: 13px; color: var(--text-primary); }
.rs-result:hover { background: var(--accent-soft); }
.rs-sku { font-family: ui-monospace, monospace; color: var(--text-muted); font-size: 12px; }
.rs-name { font-weight: 600; color: var(--text-primary); }
.rs-stock { margin-inline-start: auto; font-size: 12px; color: var(--text-muted); }
.rs-lines { margin-top: 14px; border: 1px solid var(--border); border-radius: 10px; padding: 8px 12px; }
.rs-line { display: grid; grid-template-columns: 1fr 90px 120px 110px 36px; gap: 10px; align-items: center; padding: 6px 0;
  border-bottom: 1px solid var(--border); }
.rs-line:last-of-type { border-bottom: none; }
.rs-line-head { font-size: 12px; color: var(--text-muted); font-weight: 600; }
.rs-num { text-align: end; font-variant-numeric: tabular-nums; color: var(--text-primary); }
.rs-num.neg { color: var(--danger); }
.rs-num.pos { color: var(--success); }
.rs-sum { text-align: end; padding-top: 8px; font-weight: 600; color: var(--text-secondary); display: flex; justify-content: flex-end; gap: 8px; }
.rs-dep { margin-top: 14px; }
.rs-hint { margin: 8px 0 0; font-size: 12px; color: var(--text-muted); }
.rs-error { margin-top: 12px; color: var(--danger); font-size: 13px; }
.rs-meta { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px 16px; color: var(--text-primary); }
.rs-meta > div > span:first-child { display: block; font-size: 12px; color: var(--text-muted); }
.rs-meta small { color: var(--text-muted); }
.rs-lines-ro { padding: 4px 12px; }
.rs-line-ro { display: grid; grid-template-columns: 1fr auto 110px; gap: 12px; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border); }
.rs-line-ro:last-child { border-bottom: none; }
.rs-totals { margin-top: 10px; display: grid; gap: 4px; justify-items: end; }
.rs-totals > div { display: flex; gap: 16px; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.rs-totals .strong { color: var(--text-primary); font-weight: 700; font-size: 15px; }
.rs-deps { margin-top: 14px; }
.rs-deps-title { font-size: 12px; font-weight: 600; color: var(--text-muted); margin-bottom: 6px; }
.rs-dep-row { display: grid; grid-template-columns: 130px 120px 1fr 110px; gap: 10px; padding: 6px 0; font-size: 13px;
  border-bottom: 1px solid var(--border); color: var(--text-primary); }
.rs-note { margin-top: 12px; color: var(--text-secondary); white-space: pre-wrap; }
.rs-reason { margin-top: 10px; color: var(--danger); font-weight: 600; }
.rs-act { margin-top: 16px; display: grid; gap: 12px; }
.rs-pick { display: flex; gap: 8px; flex-wrap: wrap; }
.rs-pick-btn { flex: 1; min-width: 140px; padding: 10px; border: 1px solid var(--border); border-radius: 10px; background: var(--bg-card);
  color: var(--text-secondary); font-weight: 600; cursor: pointer; }
.rs-pick-btn.on { border-color: var(--accent); background: var(--accent-soft); color: var(--text-primary); }
@media (max-width: 640px) {
  .rs-line { grid-template-columns: 1fr 70px 90px; }
  .rs-line > :nth-child(4), .rs-line > :nth-child(5) { grid-column: span 1; }
  .rs-dep-row { grid-template-columns: 1fr 1fr; }
}
</style>
