<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('finance.cheques.title') }}</h1>
        <p class="page-sub">{{ t('finance.cheques.sub') }}</p>
      </div>
      <BaseButton v-if="fmt.chequesEnabled" @click="openNew"><Plus :size="14" /> {{ t('finance.cheques.new') }}</BaseButton>
    </div>

    <!-- The reminder: waiting cheques that are late or due this week -->
    <div v-if="alerts.length" class="ch-alerts">
      <button v-for="a in alerts" :key="a.key" class="ch-alert" :class="a.kind" @click="activeTab = a.tab">
        <AlertTriangle v-if="a.kind === 'late'" :size="15" /><CalendarClock v-else :size="15" />
        {{ a.text }}
      </button>
    </div>

    <div class="ch-tabs">
      <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
        {{ t('finance.cheques.tabs.' + tab.id) }}
      </button>
    </div>

    <BaseCard>
      <BaseTable :columns="columns" :rows="rows" :loading="loading" :empty-text="t('finance.cheques.empty')"
                 storage-key="cheques" @row-click="openDetail">
        <template #cell-direction="{ row }">
          <span class="ch-dir" :class="row.direction === 'RECEIVED' ? 'in' : 'out'">
            {{ t('finance.cheques.dir.' + row.direction) }}
          </span>
        </template>
        <template #cell-due_date="{ row }">
          <span :class="{ 'ch-late': row.status === 'PENDING' && row.days_to_due < 0 }">{{ fmtDate(row.due_date) }}</span>
          <div v-if="row.status === 'PENDING'" class="ch-days">{{ dueText(row) }}</div>
        </template>
        <template #cell-amount="{ row }"><Money :value="row.amount" /></template>
        <template #cell-status="{ row }">
          <span class="ch-pill" :class="row.status.toLowerCase()">{{ t('finance.cheques.status.' + row.status) }}</span>
        </template>
      </BaseTable>
    </BaseCard>

    <!-- New cheque -->
    <AppModal :open="form.open" :title="t('finance.cheques.new')" width="640px" :no-backdrop-close="true" @close="form.open = false">
      <div class="ch-dir-pick">
        <button v-for="d in ['RECEIVED', 'GIVEN']" :key="d" type="button" class="ch-dir-btn" :class="{ on: form.direction === d }" @click="form.direction = d">
          {{ t('finance.cheques.dir_long.' + d) }}
        </button>
      </div>
      <div class="ch-grid">
        <BaseSelect v-if="form.direction === 'RECEIVED'" v-model="form.customer" :options="customerOptions"
                    :label="t('finance.cheques.customer')" :placeholder="t('finance.cheques.pick')" />
        <BaseSelect v-else v-model="form.supplier" :options="supplierOptions"
                    :label="t('finance.cheques.supplier')" :placeholder="t('finance.cheques.pick')" />
        <BaseInput v-model="form.amount" type="number" :label="t('finance.cheques.amount')" placeholder="0" />
        <BaseInput v-model="form.number" :label="t('finance.cheques.number')" />
        <BaseInput v-model="form.bank_name" :label="t('finance.cheques.bank')" />
        <BaseInput v-model="form.issue_date" type="date" :label="t('finance.cheques.issue_date')" />
        <BaseInput v-model="form.due_date" type="date" :label="t('finance.cheques.due_date')" />
        <BaseSelect v-model="form.method" :options="methodOptions" :label="t('finance.cheques.method')"
                    :placeholder="t('finance.cheques.method_later')" />
        <BaseInput v-model="form.note" :label="t('finance.cheques.note')" />
      </div>
      <p class="ch-hint">{{ t('finance.cheques.pending_hint') }}</p>
      <p v-if="error" class="ch-error">{{ error }}</p>
      <template #footer>
        <BaseButton variant="ghost" @click="form.open = false">{{ t('common.cancel') }}</BaseButton>
        <BaseButton :loading="saving" :disabled="!canSave" @click="saveNew">{{ t('common.save') }}</BaseButton>
      </template>
    </AppModal>

    <!-- One cheque: clear / bounce / cancel -->
    <AppModal :open="!!detail" :title="detail ? t('finance.cheques.detail_title', { n: detail.number }) : ''" width="600px" @close="detail = null">
      <template v-if="detail">
        <div class="ch-meta">
          <div><span>{{ t('finance.cheques.cols.direction') }}</span>{{ t('finance.cheques.dir_long.' + detail.direction) }}</div>
          <div><span>{{ t('finance.cheques.cols.party') }}</span>{{ detail.party_name }}</div>
          <div><span>{{ t('finance.cheques.amount') }}</span><Money :value="detail.amount" /></div>
          <div><span>{{ t('finance.cheques.bank') }}</span>{{ detail.bank_name || '—' }}</div>
          <div><span>{{ t('finance.cheques.issue_date') }}</span>{{ fmtDate(detail.issue_date) }}</div>
          <div><span>{{ t('finance.cheques.due_date') }}</span>{{ fmtDate(detail.due_date) }}</div>
          <div><span>{{ t('finance.cheques.cols.status') }}</span>{{ t('finance.cheques.status.' + detail.status) }}
            <template v-if="detail.cleared_on"> · {{ fmtDate(detail.cleared_on) }}</template></div>
          <div v-if="detail.method_name"><span>{{ t('finance.cheques.method') }}</span>{{ detail.method_name }}</div>
        </div>
        <p v-if="detail.note" class="ch-note">{{ detail.note }}</p>
        <p v-if="detail.status_reason" class="ch-reason">{{ detail.status_reason }}</p>

        <div v-if="act === 'clear'" class="ch-act">
          <BaseSelect v-model="actForm.method" :options="methodOptions" :label="t('finance.cheques.method')" :placeholder="t('finance.cheques.pick')" />
          <BaseSelect v-if="fmt.treasuryEnabled && detail.direction === 'GIVEN'" v-model="actForm.box" :options="boxOptions"
                      :label="t('finance.cheques.paid_from')" :placeholder="t('finance.cheques.box_auto')" />
          <BaseInput v-model="actForm.on" type="date" :label="t('finance.cheques.cleared_on')" />
          <p class="ch-hint">{{ t('finance.cheques.clear_hint.' + detail.direction) }}</p>
        </div>
        <div v-if="act === 'bounce' || act === 'cancel'" class="ch-act">
          <BaseInput v-model="actForm.reason" :label="t('finance.cheques.reason')" />
          <p v-if="act === 'bounce' && detail.status === 'CLEARED'" class="ch-hint">{{ t('finance.cheques.bounce_hint') }}</p>
        </div>
        <p v-if="error" class="ch-error">{{ error }}</p>
      </template>
      <template #footer>
        <BaseButton variant="ghost" @click="detail = null">{{ t('common.close') }}</BaseButton>
        <template v-if="detail && !act">
          <BaseButton v-if="detail.status === 'PENDING'" variant="secondary" @click="startAct('cancel')">{{ t('finance.cheques.cancel') }}</BaseButton>
          <BaseButton v-if="canBounce" variant="danger" @click="startAct('bounce')">{{ t('finance.cheques.bounce') }}</BaseButton>
          <BaseButton v-if="detail.status === 'PENDING'" @click="startAct('clear')">{{ t('finance.cheques.clear') }}</BaseButton>
        </template>
        <BaseButton v-else-if="detail" :variant="act === 'clear' ? 'primary' : 'danger'" :loading="saving" :disabled="!actReady" @click="doAct">
          {{ t('finance.cheques.confirm.' + act) }}
        </BaseButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
/* Cheques received from customers / given to suppliers (s171). A waiting cheque moves nothing; Clear = a normal
   payment through the cheque's method; Bounce after clearing reverses it (Admin). The banner is the reminder. */
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, AlertTriangle, CalendarClock } from 'lucide-vue-next'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'
import BaseTable from '@/components/base/BaseTable.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import Money from '@/components/ui/Money.vue'
import { formatCurrency } from '@/utils/format'
import { useAuthStore, ROLE_RANK } from '@/stores/auth'
import { useFormatStore } from '@/stores/format'
import { fetchBoxes, boxOptionLabel, treasuryError } from '@/utils/treasury'
import i18n from '@/i18n'

const { t, locale } = useI18n()
const auth = useAuthStore()
const fmt = useFormatStore()

const tabs = [{ id: 'pending' }, { id: 'soon' }, { id: 'overdue' }, { id: 'cleared' }, { id: 'closed' }, { id: 'all' }]
const activeTab = ref('pending')
const loading = ref(false)
const rows = ref([])
const summary = ref(null)
const customers = ref([])
const suppliers = ref([])
const methods = ref([])
const boxes = ref([])
const saving = ref(false)
const error = ref('')
const detail = ref(null)
const act = ref('')
const today = () => new Date().toISOString().slice(0, 10)
const form = reactive({ open: false, direction: 'RECEIVED', customer: '', supplier: '', amount: '', number: '',
  bank_name: '', issue_date: '', due_date: '', method: '', note: '' })
const actForm = reactive({ method: '', box: '', on: '', reason: '' })

const columns = computed(() => [
  { key: 'due_date',   label: t('finance.cheques.due_date') },
  { key: 'direction',  label: t('finance.cheques.cols.direction') },
  { key: 'party_name', label: t('finance.cheques.cols.party') },
  { key: 'number',     label: t('finance.cheques.number') },
  { key: 'bank_name',  label: t('finance.cheques.bank') },
  { key: 'amount',     label: t('finance.cheques.amount'), type: 'currency' },
  { key: 'status',     label: t('finance.cheques.cols.status') },
])
const customerOptions = computed(() => customers.value.filter(c => !c.is_walk_in).map(c => ({ value: c.id, label: c.name })))
const supplierOptions = computed(() => suppliers.value.map(s => ({ value: s.id, label: s.name })))
const methodOptions = computed(() => methods.value.filter(m => !m.is_cash && !m.is_agel && !m.is_store_credit)
  .map(m => ({ value: m.id, label: m.name })))
const boxOptions = computed(() => boxes.value.map(b => ({ value: b.id, label: boxOptionLabel(t, b) })))
const canSave = computed(() => !saving.value && Number(form.amount) > 0 && form.number.trim() && form.due_date &&
  (form.direction === 'RECEIVED' ? form.customer : form.supplier))
const isAdmin = computed(() => (ROLE_RANK[auth.user?.role] || 0) >= ROLE_RANK.ADMIN)
const canBounce = computed(() => detail.value && (detail.value.status === 'PENDING' ||
  (detail.value.status === 'CLEARED' && isAdmin.value)))
const actReady = computed(() => act.value === 'clear' ? !!(actForm.method || detail.value?.method) : !!actForm.reason.trim())

const alerts = computed(() => {
  const s = summary.value
  if (!s) return []
  const out = []
  for (const [key, kind, tab] of [['overdue', 'late', 'overdue'], ['soon', 'soon', 'soon']]) {
    for (const d of ['received', 'given']) {
      const v = s[`${key}_${d}`]
      if (v && v.count) out.push({ key: key + d, kind, tab,
        text: t(`finance.cheques.alert.${key}_${d}`, { n: v.count, total: formatCurrency(v.total) }) })
    }
  }
  return out
})

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d + (String(d).length === 10 ? 'T12:00:00' : '')).toLocaleDateString(
    locale.value === 'ar' ? 'ar-EG-u-nu-latn' : 'en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
}
function dueText(row) {
  const n = row.days_to_due
  if (n < 0) return t('finance.cheques.days_late', { n: -n })
  if (n === 0) return t('finance.cheques.due_today')
  return t('finance.cheques.days_left', { n })
}
function errText(e) {
  const d = e?.response?.data
  if (d?.code && i18n.global.te('finance.cheques.err.' + d.code, 'en')) return t('finance.cheques.err.' + d.code)
  return treasuryError(t, e, t('finance.cheques.err.generic'))
}

function params() {
  return { pending: { status: 'PENDING' }, soon: { due: 'soon' }, overdue: { due: 'overdue' },
           cleared: { status: 'CLEARED' }, closed: {}, all: {} }[activeTab.value]
}
async function load() {
  loading.value = true
  try {
    const [r, s] = await Promise.all([api.get('/api/finance/cheques/', { params: params() }),
                                      api.get('/api/finance/cheques/summary/')])
    let list = Array.isArray(r.data) ? r.data : (r.data.results || [])
    if (activeTab.value === 'closed') list = list.filter(c => c.status === 'BOUNCED' || c.status === 'CANCELLED')
    rows.value = list
    summary.value = s.data
  } catch { rows.value = [] } finally { loading.value = false }
}

function openNew() {
  Object.assign(form, { open: true, direction: 'RECEIVED', customer: '', supplier: '', amount: '', number: '',
    bank_name: '', issue_date: today(), due_date: '', method: methodOptions.value[0]?.value || '', note: '' })
  error.value = ''
}
async function saveNew() {
  saving.value = true
  error.value = ''
  try {
    const body = { ...form }
    delete body.open
    if (body.direction === 'RECEIVED') delete body.supplier; else delete body.customer
    if (!body.method) delete body.method
    await api.post('/api/finance/cheques/', body)
    form.open = false
    activeTab.value = 'pending'
    load()
  } catch (e) { error.value = errText(e) } finally { saving.value = false }
}

function openDetail(row) {
  detail.value = row
  act.value = ''
  error.value = ''
}
async function startAct(kind) {
  act.value = kind
  Object.assign(actForm, { method: detail.value.method || '', box: '', on: today(), reason: '' })
  if (kind === 'clear' && fmt.treasuryEnabled && !boxes.value.length) boxes.value = await fetchBoxes()
}
async function doAct() {
  saving.value = true
  error.value = ''
  const body = act.value === 'clear'
    ? { ...(actForm.method ? { method: actForm.method } : {}), ...(actForm.box ? { box: actForm.box } : {}), on: actForm.on }
    : { reason: actForm.reason }
  try {
    detail.value = (await api.post(`/api/finance/cheques/${detail.value.id}/${act.value}/`, body)).data
    act.value = ''
    load()
  } catch (e) { error.value = errText(e) } finally { saving.value = false }
}

watch(activeTab, load)
onMounted(async () => {
  load()
  const [c, s, m] = await Promise.allSettled([api.get('/api/auth/customers/', { params: { page_size: 500 } }),
    api.get('/api/inventory/suppliers/'), api.get('/api/finance/payment-methods/')])
  const list = r => r.status === 'fulfilled' ? (Array.isArray(r.value.data) ? r.value.data : (r.value.data.results || [])) : []
  customers.value = list(c); suppliers.value = list(s); methods.value = list(m)
})
</script>

<style scoped>
.ch-alerts { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.ch-alert { display: inline-flex; align-items: center; gap: 6px; padding: 8px 12px; border-radius: 10px; border: 1px solid var(--border);
  background: var(--bg-card); color: var(--text-primary); font-size: 13px; cursor: pointer; }
.ch-alert.late { border-color: var(--danger); color: var(--danger); background: var(--danger-soft); }
.ch-alert.soon { border-color: var(--accent); background: var(--accent-soft); }
.ch-tabs { display: flex; flex-wrap: wrap; border-bottom: 1px solid var(--border); margin-bottom: 12px; }
.tab-btn { padding: 9px 16px; font-size: 13.5px; font-weight: 500; color: var(--text-muted); border: none; background: none;
  cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; }
.tab-btn:hover { color: var(--text-primary); }
.tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }
.ch-dir { font-size: 12px; font-weight: 600; padding: 2px 8px; border-radius: 999px; }
.ch-dir.in { background: var(--success-soft); color: var(--success); }
.ch-dir.out { background: var(--accent-soft); color: var(--accent); }
.ch-late { color: var(--danger); font-weight: 600; }
.ch-days { font-size: 12px; color: var(--text-muted); }
.ch-pill { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: var(--bg-app); color: var(--text-secondary); }
.ch-pill.cleared { background: var(--success-soft); color: var(--success); }
.ch-pill.bounced { background: var(--danger-soft); color: var(--danger); }
.ch-pill.pending { background: var(--accent-soft); color: var(--accent); }
.ch-dir-pick { display: flex; gap: 8px; margin-bottom: 14px; }
.ch-dir-btn { flex: 1; padding: 10px; border: 1px solid var(--border); border-radius: 10px; background: var(--bg-card);
  color: var(--text-secondary); font-weight: 600; cursor: pointer; }
.ch-dir-btn.on { border-color: var(--accent); background: var(--accent-soft); color: var(--text-primary); }
.ch-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 12px; }
.ch-meta { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px 16px; color: var(--text-primary); }
.ch-meta span { display: block; font-size: 12px; color: var(--text-muted); }
.ch-note { margin-top: 12px; color: var(--text-secondary); white-space: pre-wrap; }
.ch-reason { margin-top: 8px; color: var(--danger); font-weight: 600; }
.ch-act { margin-top: 16px; display: grid; gap: 12px; }
.ch-hint { margin: 8px 0 0; font-size: 12px; color: var(--text-muted); }
.ch-error { margin-top: 12px; color: var(--danger); font-size: 13px; }
</style>
