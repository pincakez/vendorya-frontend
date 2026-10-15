<template>
  <div>
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="router.push('/finance/my-money')">
          <ChevronLeft :size="16" /> {{ t('finance.owner.title') }}
        </button>
        <div>
          <h1 class="page-title">{{ box ? boxName(t, box) : t('finance.owner.f.box') }}</h1>
          <p v-if="box" class="page-sub">
            {{ partLine }}
            <span v-if="box.part_kind === 'PERSONAL'" class="om-private"><EyeOff :size="11" /> {{ t('finance.owner.only_you') }}</span>
            <span v-if="box.is_active === false" class="om-tag om-tag--muted">{{ t('finance.owner.closed') }}</span>
          </p>
        </div>
      </div>
      <div v-if="box" class="mb-balance">
        <div class="om-kpi-label">{{ t('finance.treasury.balance_now') }}</div>
        <div class="om-big" :class="{ 'om-neg': Number(box.balance) < 0 }"><Money :value="box.balance ?? 0" /></div>
      </div>
    </div>

    <div v-if="gate" class="om-gate">
      <PiggyBank :size="34" class="om-gate-icon" />
      <div class="om-gate-title">{{ t('finance.owner.gate.' + gate + '_title') }}</div>
      <div class="om-gate-text">{{ t('finance.owner.gate.' + gate + '_text') }}</div>
    </div>

    <AccountStatement
      v-else
      v-model:date-from="from"
      v-model:date-to="to"
      :title="t('finance.treasury.statement_title')"
      :party-label="t('finance.owner.f.box')"
      :party-name="box ? boxName(t, box) : ''"
      :party-meta="partLine"
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
      <template #actions="{ line }">
        <BaseButton v-if="line.canReverse" size="sm" variant="ghost" @click="openReverse(line)">
          <Undo2 :size="13" /> {{ t('finance.treasury.reverse') }}
        </BaseButton>
      </template>
    </AccountStatement>

    <!-- Reverse a manual line — a new opposite line (both legs of a move); the original is never edited -->
    <AppModal :open="rev.open" :title="t('finance.treasury.reverse_title')" width="460px" @close="rev.open = false">
      <div class="om-form">
        <div v-if="rev.line" class="om-summary">
          <div class="om-summary-row"><span>{{ rev.line.type }}</span><span><Money :value="rev.line.amount" /></span></div>
          <div class="om-muted">{{ rev.line.dateLabel }}</div>
        </div>
        <p class="om-sub">{{ t('finance.owner.reverse_hint') }}</p>
        <div>
          <label class="form-label">{{ t('finance.treasury.f.reason') }}</label>
          <textarea v-model="rev.reason" class="form-input" rows="2" :placeholder="t('finance.treasury.f.reverse_reason_ph')" />
        </div>
        <p v-if="rev.error" class="om-err">{{ rev.error }}</p>
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
import { ChevronLeft, Undo2, EyeOff, PiggyBank } from 'lucide-vue-next'
import api from '@/api/axios'
import AccountStatement from '@/components/finance/AccountStatement.vue'
import AppModal from '@/components/ui/AppModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { showSuccessToast } from '@/utils/toast'
import { formatDate } from '@/utils/date'
import { boxName, kindLabel, moveKindLabel, treasuryError } from '@/utils/treasury'
import { OWNER_API, OWNER_REVERSIBLE_KINDS, GATE_CODES, getList, partKindLabel, errCode } from '@/utils/ownerMoney'
import './owner/owner.css'

const { t } = useI18n()
const router = useRouter()
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
const gate = ref('')

// Card data (name, kind, part, balance) from the owner's boxes list; the statement's own `box` fills any gap.
const listed = ref(null)
const box = computed(() => {
  const s = stmt.value?.box
  const fromStmt = s && typeof s === 'object' ? s : null
  return listed.value || fromStmt ? { ...(fromStmt || {}), ...(listed.value || {}) } : null
})
const partLine = computed(() => {
  if (!box.value) return ''
  return [box.value.part_name || partKindLabel(t, box.value.part_kind), kindLabel(t, box.value.kind), box.value.branch_name]
    .filter(Boolean).join(' · ')
})

function setGate(e) {
  const code = errCode(e)
  if (!GATE_CODES.includes(code)) return false
  gate.value = code === 'not_owner' || code === 'no_store' ? 'not_owner' : (code === 'treasury_off' ? 'treasury_off' : 'owner_level_off')
  return true
}

async function fetchBox() {
  try {
    const all = await getList('boxes/')
    listed.value = all.find(b => String(b.id) === String(props.id)) || null
  } catch (e) { setGate(e) }
}

async function fetchStatement() {
  loading.value = true
  error.value = ''
  try {
    const params = {}
    if (from.value) params.date_from = from.value
    if (to.value) params.date_to = to.value
    const r = await api.get(`${OWNER_API}/boxes/${props.id}/statement/`, { params })
    stmt.value = r.data
  } catch (e) {
    if (setGate(e)) return
    const d = e?.response?.data
    error.value = e?.response?.status === 404 ? t('finance.treasury.err.box_not_found')
      : (d?.date_from || d?.date_to || treasuryError(t, e, t('finance.statement.load_failed')))
  } finally { loading.value = false }
}

const OUT_KINDS = ['TRANSFER_OUT', 'DRAW_OUT', 'PUT_OUT']
const IN_KINDS = ['TRANSFER_IN', 'DRAW_IN', 'PUT_IN']
const rows = computed(() => (stmt.value?.lines || []).map(l => {
  const amt = Number(l.amount || 0)
  const ref = l.ref || null
  const type = moveKindLabel(t, l.kind) + (l.reversed ? ` (${t('finance.treasury.reversed')})` : '')
  // a move's label is the OTHER box — the arrow shows the direction (→ out to it, ← in from it)
  let refText = ref?.label || ''
  if (refText && OUT_KINDS.includes(l.kind)) refText = '→ ' + refText
  else if (refText && IN_KINDS.includes(l.kind)) refText = '← ' + refText
  return {
    key: l.id,
    id: l.id,
    date: l.at,
    dateLabel: l.at ? formatDate(l.at) : '',
    type,
    ref: refText,
    to: ref?.type === 'box' && ref.id ? `/finance/my-money/box/${ref.id}` : null,
    note: [l.note, l.reason && t('finance.treasury.reason_prefix', { reason: l.reason }), l.created_by_name].filter(Boolean).join(' — '),
    debit: amt > 0 ? amt : 0,
    credit: amt < 0 ? -amt : 0,
    amount: l.amount,
    running_balance: l.running_balance,
    dim: !!l.reversed,
    canReverse: OWNER_REVERSIBLE_KINDS.includes(l.kind) && !l.reversed && !l.reverses,
  }
}))

const rev = reactive({ open: false, line: null, reason: '', saving: false, error: '' })
function openReverse(line) { Object.assign(rev, { open: true, line, reason: '', saving: false, error: '' }) }
async function saveReverse() {
  rev.saving = true
  rev.error = ''
  try {
    await api.post(`${OWNER_API}/lines/${rev.line.id}/reverse/`, { reason: rev.reason.trim() })
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
.page-sub { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.mb-balance { text-align:right; }
</style>
