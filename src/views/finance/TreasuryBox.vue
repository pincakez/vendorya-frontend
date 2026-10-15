<template>
  <div>
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="router.push('/finance/treasury')">
          <ChevronLeft :size="16" /> {{ t('finance.treasury.title') }}
        </button>
        <div>
          <h1 class="page-title">{{ box ? boxName(t, box) : t('finance.treasury.box') }}</h1>
          <p v-if="box" class="page-sub">
            {{ kindLabel(t, box.kind) }}<template v-if="box.branch_name"> · {{ box.branch_name }}</template>
            <span v-if="!box.is_active" class="tb-tag">{{ t('finance.treasury.closed') }}</span>
          </p>
        </div>
      </div>
      <div v-if="box" class="tb-balance">
        <div class="tb-balance-label">{{ t('finance.treasury.balance_now') }}</div>
        <div class="tb-balance-value" :class="{ 'tb-neg': Number(box.balance) < 0 }"><Money :value="box.balance" /></div>
      </div>
    </div>

    <p v-if="box?.system_role === 'UNSORTED'" class="tb-hint">{{ t('finance.treasury.unsorted_hint') }}</p>

    <AccountStatement
      v-model:date-from="from"
      v-model:date-to="to"
      :title="t('finance.treasury.statement_title')"
      :party-label="t('finance.treasury.box')"
      :party-name="box ? boxName(t, box) : ''"
      :party-meta="box ? [kindLabel(t, box.kind), box.branch_name].filter(Boolean).join(' · ') : ''"
      :lines="rows"
      :opening-balance="stmt?.opening_balance || 0"
      :closing-balance="stmt?.closing_balance || 0"
      :totals="{ debit: stmt?.total_in || 0, credit: stmt?.total_out || 0 }"
      :debit-label="t('finance.treasury.col_in')"
      :credit-label="t('finance.treasury.col_out')"
      :balance-hint="t('finance.treasury.statement_hint')"
      :loading="loading"
      :error="error"
      :filename="`box-${(box?.name || 'box').replace(/\s+/g, '-')}-${from || 'all'}-${to || 'now'}`"
      @refresh="fetchStatement"
    >
      <template v-if="auth.hasRole('ADMIN')" #actions="{ line }">
        <BaseButton v-if="line.canReverse" size="sm" variant="ghost" @click="openReverse(line)">
          <Undo2 :size="13" /> {{ t('finance.treasury.reverse') }}
        </BaseButton>
      </template>
    </AccountStatement>

    <!-- Reverse a manual line (ADMIN) — a new opposite line; the original is never edited -->
    <AppModal :open="rev.open" :title="t('finance.treasury.reverse_title')" width="460px" @close="rev.open = false">
      <div class="tb-form">
        <div v-if="rev.line" class="tb-summary">
          <div class="tb-summary-row"><span>{{ rev.line.type }}</span><span><Money :value="rev.line.amount" /></span></div>
          <div class="tb-summary-sub">{{ rev.line.dateLabel }}</div>
        </div>
        <p class="tb-help">{{ t('finance.treasury.reverse_hint') }}</p>
        <div>
          <label class="form-label">{{ t('finance.treasury.f.reason') }}</label>
          <textarea v-model="rev.reason" class="form-input" rows="2" :placeholder="t('finance.treasury.f.reverse_reason_ph')" />
        </div>
        <p v-if="rev.error" class="tb-err">{{ rev.error }}</p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="rev.open = false">{{ t('common.cancel') }}</BaseButton>
        <BaseButton variant="danger" :loading="rev.saving" :disabled="!rev.reason.trim()" @click="saveReverse">{{ t('finance.treasury.reverse') }}</BaseButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ChevronLeft, Undo2 } from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import AccountStatement from '@/components/finance/AccountStatement.vue'
import AppModal from '@/components/ui/AppModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { showSuccessToast } from '@/utils/toast'
import { formatDate } from '@/utils/date'
import { boxName, kindLabel, moveKindLabel, treasuryError, fetchBoxes, REVERSIBLE_KINDS } from '@/utils/treasury'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
const props = defineProps({ id: String })

function localISO(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const now = new Date()
const from = ref(localISO(new Date(now.getFullYear(), now.getMonth(), 1)))   // default: this month
const to = ref(localISO(now))

const stmt = ref(null)
const loading = ref(false)
const error = ref('')
// The box's card data (name, kind, branch, balance) comes from the boxes list; the statement's own `box` is used too
// when it is an object (the contract names it, its shape may be just the id).
const listed = ref(null)
const box = computed(() => {
  const s = stmt.value?.box
  const fromStmt = s && typeof s === 'object' ? s : null
  return listed.value || fromStmt ? { ...(fromStmt || {}), ...(listed.value || {}) } : null
})
async function fetchBox() {
  const all = await fetchBoxes()
  listed.value = all.find(b => String(b.id) === String(props.id)) || null
}

async function fetchStatement() {
  loading.value = true
  error.value = ''
  try {
    const params = {}
    if (from.value) params.date_from = from.value
    if (to.value) params.date_to = to.value
    const r = await api.get(`/api/treasury/boxes/${props.id}/statement/`, { params })
    stmt.value = r.data
  } catch (e) {
    const d = e?.response?.data
    error.value = d?.date_from || d?.date_to || treasuryError(t, e, t('finance.statement.load_failed'))
  } finally { loading.value = false }
}

// Where a line came from → a screen to open (only the kinds we have a page for; anything else stays plain text).
const REF_ROUTES = {
  sale: id => `/finance/invoices/${id}`,
  invoice: id => `/finance/invoices/${id}`,
  sales_invoice: id => `/finance/invoices/${id}`,
  shift: id => `/finance/shifts/${id}`,
  box: id => `/finance/treasury/${id}`,
}

const rows = computed(() => (stmt.value?.lines || []).map(l => {
  const amt = Number(l.amount || 0)
  const ref = l.ref || null
  const refRoute = ref?.type && ref?.id && REF_ROUTES[String(ref.type).toLowerCase()]
  const type = moveKindLabel(t, l.kind) + (l.reversed ? ` (${t('finance.treasury.reversed')})` : '')
  return {
    key: l.id,
    id: l.id,
    date: l.at,
    dateLabel: l.at ? formatDate(l.at) : '',
    type,
    ref: ref?.label || '',
    to: refRoute ? refRoute(ref.id) : null,
    note: [l.note, l.reason && t('finance.treasury.reason_prefix', { reason: l.reason }), l.created_by_name]
      .filter(Boolean).join(' — '),
    debit: amt > 0 ? amt : 0,
    credit: amt < 0 ? -amt : 0,
    amount: l.amount,
    running_balance: l.running_balance,
    dim: !!l.reversed,
    canReverse: REVERSIBLE_KINDS.includes(l.kind) && !l.reversed && !l.reverses,
  }
}))

// ── Reverse ──────────────────────────────────────────────────────────────
const rev = reactive({ open: false, line: null, reason: '', saving: false, error: '' })
function openReverse(line) { Object.assign(rev, { open: true, line, reason: '', saving: false, error: '' }) }
async function saveReverse() {
  rev.saving = true
  rev.error = ''
  try {
    await api.post(`/api/treasury/moves/${rev.line.id}/reverse/`, { reason: rev.reason.trim() })
    rev.open = false
    showSuccessToast(t('finance.treasury.reversed_ok'))
    fetchStatement()
    fetchBox()
  } catch (e) { rev.error = treasuryError(t, e) } finally { rev.saving = false }
}

watch(() => props.id, () => { fetchBox(); fetchStatement() })
onMounted(() => { fetchBox(); fetchStatement() })
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.header-left { display:flex; align-items:flex-start; gap:12px; }
.back-btn { display:inline-flex; align-items:center; gap:4px; padding:6px 10px; border-radius:8px; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; font-size:13px; font-weight:500; transition:background 100ms; margin-top:2px; }
.back-btn:hover { background:var(--border); }
.page-sub { display:flex; align-items:center; gap:8px; }
.tb-tag { font-size:11px; font-weight:600; padding:2px 8px; border-radius:999px; background:var(--border); color:var(--text-muted); }
.tb-balance { text-align:right; }
.tb-balance-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text-muted); }
.tb-balance-value { font-size:24px; font-weight:800; color:var(--text-primary); font-variant-numeric:tabular-nums; }
.tb-neg { color:var(--danger); }
.tb-hint { font-size:13px; line-height:1.45; color:var(--warning-hover); background:var(--warning-soft); border-radius:8px; padding:10px 12px; margin:0 0 14px; }

.tb-form { display:flex; flex-direction:column; gap:14px; }
.tb-help { font-size:12.5px; color:var(--text-muted); margin:0; line-height:1.5; }
.tb-err { font-size:13px; color:var(--danger); background:var(--danger-soft); border-radius:8px; padding:8px 12px; margin:0; }
.tb-summary { background:var(--bg-app); border:1px solid var(--border); border-radius:8px; padding:12px 14px; }
.tb-summary-row { display:flex; justify-content:space-between; font-size:13.5px; font-weight:700; color:var(--text-primary); }
.tb-summary-sub { font-size:12px; color:var(--text-muted); margin-top:4px; }
</style>
