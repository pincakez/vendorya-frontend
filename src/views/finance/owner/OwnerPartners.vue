<template>
  <div>
    <div class="om-toolbar">
      <div class="om-toolbar-left">
        <BaseSelect v-model="partId" :options="partOptions" :label="t('finance.owner.partners.which')" :placeholder="t('finance.owner.f.pick_part')" />
      </div>
      <div v-if="part" class="om-actions">
        <BaseButton variant="secondary" @click="openPartner()"><UserPlus :size="14" /> {{ t('finance.owner.partners.add') }}</BaseButton>
        <BaseButton :disabled="!activePartners.length" @click="openSettle"><CalendarCheck :size="14" /> {{ t('finance.owner.partners.settle') }}</BaseButton>
      </div>
    </div>

    <div v-if="!partOptions.length" class="om-empty">{{ t('finance.owner.partners.no_parts') }}</div>
    <div v-else-if="!part" class="om-empty">{{ t('finance.owner.partners.pick_part') }}</div>
    <template v-else>
      <!-- Shares bar — every active partner + the owner's rest -->
      <div class="om-panel" style="margin-bottom:16px">
        <div class="om-panel-head">
          <h3 class="om-panel-title">{{ t('finance.owner.partners.shares') }}</h3>
          <span class="om-muted">{{ t('finance.owner.partners.owner_keeps', { pct: fmtPct(ownerPct) }) }}</span>
        </div>
        <div class="om-bar" role="img" :aria-label="t('finance.owner.partners.shares')">
          <div v-for="s in shareSegs" :key="s.key" class="om-bar-seg" :style="{ width: s.pct + '%', background: s.color }" :title="`${s.label} · ${fmtPct(s.pct)}%`" />
        </div>
        <div class="om-bar-legend">
          <span v-for="s in shareSegs" :key="s.key"><i class="om-dot" :style="{ background: s.color }" />{{ s.label }} · {{ fmtPct(s.pct) }}%</span>
        </div>
      </div>

      <!-- Partners -->
      <div class="dt-card" style="margin-bottom:6px">
        <div class="dt-xscroll">
          <table class="dt">
            <thead>
              <tr>
                <th class="dt-th">{{ t('finance.owner.f.partner_name') }}</th>
                <th class="dt-th ta-right" style="width:90px">{{ t('finance.owner.f.share') }}</th>
                <th class="dt-th" style="width:110px">{{ t('finance.owner.f.since') }}</th>
                <th class="dt-th ta-right" style="width:150px">{{ t('finance.owner.partners.account') }}</th>
                <th class="dt-th" style="width:150px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="pLoading"><td colspan="5" class="dt-loading">{{ t('finance.owner.loading') }}</td></tr>
              <tr v-else-if="pError"><td colspan="5" class="dt-empty om-error">{{ pError }}</td></tr>
              <tr v-else-if="!partPartners.length"><td colspan="5" class="dt-empty">{{ t('finance.owner.partners.empty') }}</td></tr>
              <template v-else>
                <tr v-for="p in partPartners" :key="p.id" class="dt-row" :class="{ 'om-row-dim': p.is_active === false }">
                  <td class="om-strong">{{ p.name }} <span v-if="p.is_active === false" class="om-tag om-tag--muted">{{ t('finance.owner.partners.inactive') }}</span></td>
                  <td class="ta-right">{{ fmtPct(p.share_pct) }}%</td>
                  <td class="om-muted">{{ fmtDay(p.joined_on) }}</td>
                  <td class="ta-right" :class="Number(p.account) < 0 ? 'om-neg' : ''"><Money :value="p.account ?? 0" /></td>
                  <td class="ta-right">
                    <button class="om-row-action" :title="t('finance.owner.partners.put_in')" @click="openMoney(p, 'put-in')"><ArrowDownToLine :size="14" /></button>
                    <button class="om-row-action" :title="t('finance.owner.partners.pay')" @click="openMoney(p, 'pay')"><ArrowUpFromLine :size="14" /></button>
                    <button class="om-row-action" :title="t('finance.owner.partners.statement')" @click="openStatement(p)"><FileText :size="14" /></button>
                    <button class="om-row-action" :title="t('common.edit')" @click="openPartner(p)"><Pencil :size="13" /></button>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
      <p class="om-help" style="margin:4px 0 20px">{{ t('finance.owner.partners.account_hint') }}</p>

      <!-- Settlements -->
      <h3 class="om-panel-title" style="margin-bottom:10px">{{ t('finance.owner.partners.settlements') }}</h3>
      <div class="dt-card">
        <div class="dt-xscroll">
          <table class="dt">
            <thead>
              <tr>
                <th class="dt-th">{{ t('finance.owner.partners.period') }}</th>
                <th class="dt-th ta-right">{{ t('finance.owner.partners.profit') }}</th>
                <th class="dt-th ta-right">{{ t('finance.owner.partners.owner_only_exp') }}</th>
                <th class="dt-th" style="width:130px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="sLoading"><td colspan="4" class="dt-loading">{{ t('finance.owner.loading') }}</td></tr>
              <tr v-else-if="!settlements.length"><td colspan="4" class="dt-empty">{{ t('finance.owner.partners.no_settlements') }}</td></tr>
              <template v-else>
                <tr v-for="s in settlements" :key="s.id" class="dt-row clickable" :class="{ 'om-row-dim': s.cancelled_at }" @click="viewSettlement(s)">
                  <td>{{ fmtDay(s.date_from) }} → {{ fmtDay(s.date_to) }}
                    <span v-if="s.cancelled_at" class="om-tag om-tag--muted">{{ t('finance.owner.partners.cancelled') }}</span>
                  </td>
                  <td class="ta-right" :class="Number(s.profit) < 0 ? 'om-neg' : ''"><Money :value="s.profit ?? 0" /></td>
                  <td class="ta-right"><Money :value="s.owner_only_expenses ?? 0" /></td>
                  <td class="ta-right">
                    <BaseButton v-if="!s.cancelled_at" size="sm" variant="ghost" @click.stop="openCancel(s)">{{ t('finance.owner.partners.cancel') }}</BaseButton>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ══ MODAL: add / edit partner ══ -->
    <AppModal :open="pm.open" :title="pm.id ? t('finance.owner.partners.edit') : t('finance.owner.partners.add')" width="480px" @close="pm.open = false">
      <div class="om-form">
        <BaseInput v-model="pm.name" :label="t('finance.owner.f.partner_name')" :placeholder="t('finance.owner.f.partner_name_ph')" />
        <div class="om-form-row">
          <BaseInput v-model="pm.share_pct" type="number" min="0.01" max="99.99" step="0.01" suffix="%" :label="t('finance.owner.f.share')" />
          <BaseInput v-model="pm.joined_on" type="date" :label="t('finance.owner.f.since')" />
        </div>
        <p class="om-help">{{ t('finance.owner.partners.owner_keeps', { pct: fmtPct(pmOwnerRest) }) }}</p>
        <p v-if="pmTooHigh" class="om-err">{{ t('finance.treasury.err.share_total_too_high') }}</p>
        <label v-if="pm.id" class="om-check">
          <input v-model="pm.is_active" type="checkbox" />
          <span>{{ t('finance.owner.partners.active') }}</span>
        </label>
        <p v-if="pm.error" class="om-err">{{ pm.error }}</p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="pm.open = false">{{ t('common.cancel') }}</BaseButton>
        <BaseButton :loading="pm.saving" :disabled="!pm.name.trim() || !(Number(pm.share_pct) > 0) || Number(pm.share_pct) >= 100 || pmTooHigh" @click="savePartner">{{ t('common.save') }}</BaseButton>
      </template>
    </AppModal>

    <!-- ══ MODAL: partner puts money in / the business pays the partner ══ -->
    <AppModal :open="mm.open" :title="mm.mode === 'put-in' ? t('finance.owner.partners.put_in') : t('finance.owner.partners.pay')" width="460px" @close="mm.open = false">
      <div v-if="mm.partner" class="om-form">
        <div class="om-summary">
          <div class="om-summary-row"><span>{{ mm.partner.name }} · {{ t('finance.owner.partners.account') }}</span><span><Money :value="mm.partner.account ?? 0" /></span></div>
        </div>
        <p class="om-help" style="margin:0">{{ mm.mode === 'put-in' ? t('finance.owner.partners.put_in_hint') : t('finance.owner.partners.pay_hint') }}</p>
        <BaseSelect v-model="mm.box" :options="partBoxOptions" :label="mm.mode === 'put-in' ? t('finance.owner.f.into_box') : t('finance.owner.f.from_box')"
                    :placeholder="partBoxOptions.length ? t('finance.owner.f.pick_box') : t('finance.owner.f.no_boxes_in_part')" />
        <BaseInput v-model="mm.amount" type="number" min="0" step="0.01" :label="t('finance.owner.f.amount')" placeholder="0.00" />
        <BaseInput v-model="mm.note" :label="t('finance.owner.f.note')" />
        <p v-if="mm.error" class="om-err">{{ mm.error }}</p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="mm.open = false">{{ t('common.cancel') }}</BaseButton>
        <BaseButton :loading="mm.saving" :disabled="!mm.box || !(Number(mm.amount) > 0)" @click="saveMoney">{{ t('common.save') }}</BaseButton>
      </template>
    </AppModal>

    <!-- ══ MODAL: partner statement ══ -->
    <AppModal :open="sm.open" :title="t('finance.owner.partners.statement') + (sm.partner ? ' — ' + sm.partner.name : '')" width="720px" @close="sm.open = false">
      <div v-if="sm.loading" class="om-skel" style="height:120px" />
      <p v-else-if="sm.error" class="om-err">{{ sm.error }}</p>
      <div v-else class="om-form">
        <div class="dt-card">
          <div class="dt-xscroll">
            <table class="dt">
              <thead>
                <tr>
                  <th class="dt-th" style="width:110px">{{ t('common.date') }}</th>
                  <th class="dt-th">{{ t('finance.owner.f.what') }}</th>
                  <th class="dt-th ta-right">{{ t('finance.owner.f.amount') }}</th>
                  <th class="dt-th ta-right">{{ t('finance.owner.partners.running') }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!(sm.data?.lines || []).length"><td colspan="4" class="dt-empty">{{ t('finance.owner.no_lines') }}</td></tr>
                <template v-else>
                  <tr v-for="(l, i) in sm.data.lines" :key="i" class="dt-row">
                    <td class="om-muted">{{ fmtDay(l.date) }}</td>
                    <td>{{ stmtKind(l.kind) }}<span v-if="refLabel(l.ref)" class="om-muted"> · {{ refLabel(l.ref) }}</span></td>
                    <td class="ta-right" :class="Number(l.amount) < 0 ? 'om-neg' : ''"><Money :value="l.amount ?? 0" /></td>
                    <td class="ta-right om-strong"><Money :value="l.running ?? 0" /></td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
        </div>
        <div class="om-summary">
          <div class="om-summary-row om-summary-row--total"><span>{{ t('finance.owner.partners.account') }}</span><span><Money :value="sm.data?.account ?? 0" /></span></div>
        </div>
        <p class="om-help" style="margin:0">{{ t('finance.owner.partners.account_hint') }}</p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="sm.open = false">{{ t('common.close') }}</BaseButton>
      </template>
    </AppModal>

    <!-- ══ MODAL: settle a period — month → preview FIRST → confirm ══ -->
    <AppModal :open="se.open" :title="t('finance.owner.partners.settle')" width="620px" @close="se.open = false">
      <div class="om-form">
        <p class="om-sub">{{ t('finance.owner.partners.settle_hint') }}</p>
        <div class="om-form-row">
          <BaseInput v-model="se.month" type="month" :max="maxMonth" :label="t('finance.owner.partners.month')" />
          <div style="display:flex;align-items:flex-end">
            <BaseButton variant="secondary" :loading="se.loading" :disabled="!se.month" @click="previewSettle">{{ t('finance.owner.partners.preview') }}</BaseButton>
          </div>
        </div>
        <template v-if="se.preview">
          <div class="om-summary">
            <div class="om-summary-row"><span>{{ t('finance.owner.partners.period') }}</span><span>{{ fmtDay(se.preview.date_from) }} → {{ fmtDay(se.preview.date_to) }}</span></div>
            <div class="om-summary-row"><span>{{ t('finance.owner.partners.profit') }}</span><span :class="{ 'om-neg': Number(se.preview.profit) < 0 }"><Money :value="se.preview.profit ?? 0" /></span></div>
            <div class="om-summary-row"><span>{{ t('finance.owner.partners.owner_only_exp') }}</span><span><Money :value="se.preview.owner_only_expenses ?? 0" /></span></div>
            <div class="om-summary-row om-summary-row--total"><span>{{ t('finance.owner.partners.base') }}</span><span><Money :value="Number(se.preview.profit || 0) + Number(se.preview.owner_only_expenses || 0)" /></span></div>
          </div>
          <SettlementLines :lines="se.preview.lines || []" />
          <p v-if="Number(se.preview.profit) < 0" class="om-help" style="margin:0">{{ t('finance.owner.partners.loss_hint') }}</p>
        </template>
        <p v-if="se.error" class="om-err">{{ se.error }}</p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="se.open = false">{{ t('common.cancel') }}</BaseButton>
        <BaseButton :loading="se.saving" :disabled="!se.preview" @click="saveSettle">{{ t('finance.owner.partners.confirm_settle') }}</BaseButton>
      </template>
    </AppModal>

    <!-- ══ MODAL: one settlement ══ -->
    <AppModal :open="sv.open" :title="t('finance.owner.partners.settlement')" width="600px" @close="sv.open = false">
      <div v-if="sv.s" class="om-form">
        <div class="om-summary">
          <div class="om-summary-row"><span>{{ t('finance.owner.partners.period') }}</span><span>{{ fmtDay(sv.s.date_from) }} → {{ fmtDay(sv.s.date_to) }}</span></div>
          <div class="om-summary-row"><span>{{ t('finance.owner.partners.profit') }}</span><span><Money :value="sv.s.profit ?? 0" /></span></div>
          <div class="om-summary-row"><span>{{ t('finance.owner.partners.owner_only_exp') }}</span><span><Money :value="sv.s.owner_only_expenses ?? 0" /></span></div>
        </div>
        <SettlementLines :lines="sv.s.lines || []" />
        <p v-if="sv.s.cancelled_at" class="om-err">{{ t('finance.owner.partners.cancelled_on', { date: fmtDay(sv.s.cancelled_at) }) }}<template v-if="sv.s.cancel_reason"> — {{ sv.s.cancel_reason }}</template></p>
      </div>
      <template #footer>
        <BaseButton v-if="sv.s && !sv.s.cancelled_at" variant="danger" @click="openCancel(sv.s)">{{ t('finance.owner.partners.cancel') }}</BaseButton>
        <BaseButton variant="ghost" @click="sv.open = false">{{ t('common.close') }}</BaseButton>
      </template>
    </AppModal>

    <!-- ══ MODAL: cancel a settlement (with a reason) ══ -->
    <AppModal :open="cm.open" :title="t('finance.owner.partners.cancel_title')" width="460px" @close="cm.open = false">
      <div class="om-form">
        <p class="om-sub">{{ t('finance.owner.partners.cancel_hint') }}</p>
        <div>
          <label class="form-label">{{ t('finance.owner.f.reason') }}</label>
          <textarea v-model="cm.reason" class="form-input" rows="2" />
        </div>
        <p v-if="cm.error" class="om-err">{{ cm.error }}</p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="cm.open = false">{{ t('common.cancel') }}</BaseButton>
        <BaseButton variant="danger" :loading="cm.saving" :disabled="!cm.reason.trim()" @click="saveCancel">{{ t('finance.owner.partners.cancel') }}</BaseButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, h } from 'vue'
import { useI18n } from 'vue-i18n'
import { UserPlus, CalendarCheck, Pencil, FileText, ArrowDownToLine, ArrowUpFromLine } from 'lucide-vue-next'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import Money from '@/components/ui/Money.vue'
import { showSuccessToast } from '@/utils/toast'
import { formatDate } from '@/utils/date'
import { formatNumber } from '@/utils/format'
import { treasuryError, boxName } from '@/utils/treasury'
import { OWNER_API, getList, partName, BUSINESS_PART_KINDS, monthRange, localISO } from '@/utils/ownerMoney'

const props = defineProps({ parts: { type: Array, default: () => [] } })
const emit = defineEmits(['changed'])
const { t } = useI18n()

function fmtDay(d) { return d ? formatDate(String(d).length === 10 ? d + 'T12:00:00Z' : d) : '—' }
function fmtPct(n) { return formatNumber(Number(n || 0), { decimals: 2 }).replace(/\.00$/, '') }

// Partners live on a SHOP or a BUSINESS part (personal money has no partners).
const bizParts = computed(() => props.parts.filter(p => BUSINESS_PART_KINDS.includes(p.kind)))
const partOptions = computed(() => bizParts.value.map(p => ({ value: p.id, label: partName(t, p) })))
const partId = ref('')
const part = computed(() => bizParts.value.find(p => String(p.id) === String(partId.value)) || null)
watch(bizParts, list => { if (!partId.value && list.length) partId.value = list[0].id }, { immediate: true })
const partBoxOptions = computed(() => (part.value?.boxes || [])
  .filter(b => b.is_active !== false && b.system_role !== 'UNSORTED').map(b => ({ value: b.id, label: boxName(t, b) })))

// ── Partners ──
const partners = ref([])
const pLoading = ref(false)
const pError = ref('')
const partPartners = computed(() => partners.value.filter(p => String(p.part) === String(partId.value))
  .sort((a, b) => (a.is_active === false) - (b.is_active === false) || Number(b.share_pct) - Number(a.share_pct)))
const activePartners = computed(() => partPartners.value.filter(p => p.is_active !== false))
const partnersPct = computed(() => activePartners.value.reduce((s, p) => s + Number(p.share_pct || 0), 0))
const ownerPct = computed(() => Math.max(0, Math.round((100 - partnersPct.value) * 100) / 100))
const SEG_COLORS = ['var(--info)', 'var(--success)', 'var(--warning)', 'var(--danger)', 'var(--text-secondary)', 'var(--admin-accent)']
const shareSegs = computed(() => [
  { key: 'owner', label: t('finance.owner.partners.you'), pct: ownerPct.value, color: 'var(--accent)' },
  ...activePartners.value.map((p, i) => ({ key: p.id, label: p.name, pct: Number(p.share_pct || 0), color: SEG_COLORS[i % SEG_COLORS.length] })),
])

async function loadPartners() {
  pLoading.value = true
  pError.value = ''
  try { partners.value = await getList('partners/', partId.value ? { part: partId.value } : undefined) } catch (e) {
    partners.value = []
    pError.value = treasuryError(t, e, t('finance.owner.err_load'))
  } finally { pLoading.value = false }
}

// ── Settlements ──
const settlements = ref([])
const sLoading = ref(false)
async function loadSettlements() {
  if (!partId.value) { settlements.value = []; return }
  sLoading.value = true
  try {
    const list = await getList('settlements/', { part: partId.value })
    settlements.value = list.filter(s => !s.part || String(s.part) === String(partId.value))
      .sort((a, b) => String(b.date_from).localeCompare(String(a.date_from)))
  } catch { settlements.value = [] } finally { sLoading.value = false }
}
watch(partId, () => { loadPartners(); loadSettlements() })

// ── Add / edit a partner ──
const pm = reactive({ open: false, id: null, name: '', share_pct: '', joined_on: '', is_active: true, saving: false, error: '' })
const pmOthers = computed(() => activePartners.value.filter(p => String(p.id) !== String(pm.id)).reduce((s, p) => s + Number(p.share_pct || 0), 0))
const pmOwnerRest = computed(() => Math.round((100 - pmOthers.value - (pm.is_active ? Number(pm.share_pct || 0) : 0)) * 100) / 100)
const pmTooHigh = computed(() => pm.is_active && pmOwnerRest.value < 0)
function openPartner(p) {
  Object.assign(pm, p
    ? { open: true, id: p.id, name: p.name || '', share_pct: p.share_pct ?? '', joined_on: p.joined_on || '', is_active: p.is_active !== false, saving: false, error: '' }
    : { open: true, id: null, name: '', share_pct: '', joined_on: localISO(), is_active: true, saving: false, error: '' })
}
async function savePartner() {
  pm.saving = true
  pm.error = ''
  try {
    const body = { name: pm.name.trim(), share_pct: pm.share_pct }
    if (pm.joined_on) body.joined_on = pm.joined_on
    if (pm.id) {
      body.is_active = pm.is_active
      await api.patch(`${OWNER_API}/partners/${pm.id}/`, body)
    } else {
      await api.post(`${OWNER_API}/partners/`, { ...body, part: partId.value })
    }
    pm.open = false
    showSuccessToast(t('finance.owner.saved'))
    loadPartners()
  } catch (e) { pm.error = treasuryError(t, e) } finally { pm.saving = false }
}

// ── Put in / pay ──
const mm = reactive({ open: false, mode: 'put-in', partner: null, box: '', amount: '', note: '', saving: false, error: '' })
function openMoney(p, mode) {
  Object.assign(mm, { open: true, mode, partner: p, box: partBoxOptions.value.length === 1 ? partBoxOptions.value[0].value : '', amount: '', note: '', saving: false, error: '' })
}
async function saveMoney() {
  mm.saving = true
  mm.error = ''
  try {
    await api.post(`${OWNER_API}/partners/${mm.partner.id}/${mm.mode}/`, { amount: mm.amount, box: mm.box, note: mm.note || '' })
    mm.open = false
    showSuccessToast(t('finance.owner.saved'))
    loadPartners()
    emit('changed')
  } catch (e) { mm.error = treasuryError(t, e) } finally { mm.saving = false }
}

// ── Statement ──
const sm = reactive({ open: false, partner: null, data: null, loading: false, error: '' })
async function openStatement(p) {
  Object.assign(sm, { open: true, partner: p, data: null, loading: true, error: '' })
  try {
    const r = await api.get(`${OWNER_API}/partners/${p.id}/statement/`)
    sm.data = r.data
  } catch (e) { sm.error = treasuryError(t, e, t('finance.owner.err_load')) } finally { sm.loading = false }
}
function stmtKind(k) { return ['SETTLEMENT', 'PUT_IN', 'PAID'].includes(k) ? t('finance.owner.partners.stmt_kinds.' + k) : (k || '') }
function refLabel(ref) {
  if (!ref) return ''
  if (typeof ref === 'string') return ref
  return ref.label || ''
}

// ── Settle a period ──
// The newest month that is fully over (a settlement can't end in the future — `settlement_future`).
const maxMonth = computed(() => {
  const d = new Date()
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
  const m = d.getDate() === last ? d : new Date(d.getFullYear(), d.getMonth() - 1, 1)
  return `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`
})
const se = reactive({ open: false, month: '', preview: null, loading: false, saving: false, error: '' })
watch(() => se.month, () => { se.preview = null; se.error = '' })
function openSettle() { Object.assign(se, { open: true, month: maxMonth.value, preview: null, loading: false, saving: false, error: '' }) }
async function previewSettle() {
  const { from, to } = monthRange(se.month)
  se.loading = true
  se.error = ''
  se.preview = null
  try {
    const r = await api.get(`${OWNER_API}/settlements/preview/`, { params: { part: partId.value, date_from: from, date_to: to } })
    se.preview = { date_from: from, date_to: to, ...(r.data || {}) }
  } catch (e) { se.error = treasuryError(t, e) } finally { se.loading = false }
}
async function saveSettle() {
  se.saving = true
  se.error = ''
  try {
    await api.post(`${OWNER_API}/settlements/`, { part: partId.value, date_from: se.preview.date_from, date_to: se.preview.date_to })
    se.open = false
    showSuccessToast(t('finance.owner.partners.settled'))
    loadSettlements()
    loadPartners()
  } catch (e) { se.error = treasuryError(t, e) } finally { se.saving = false }
}

// ── View / cancel a settlement ──
const sv = reactive({ open: false, s: null })
function viewSettlement(s) { Object.assign(sv, { open: true, s }) }
const cm = reactive({ open: false, s: null, reason: '', saving: false, error: '' })
function openCancel(s) { Object.assign(cm, { open: true, s, reason: '', saving: false, error: '' }) }
async function saveCancel() {
  cm.saving = true
  cm.error = ''
  try {
    await api.post(`${OWNER_API}/settlements/${cm.s.id}/cancel/`, { reason: cm.reason.trim() })
    cm.open = false
    sv.open = false
    showSuccessToast(t('finance.owner.partners.cancelled_ok'))
    loadSettlements()
    loadPartners()
  } catch (e) { cm.error = treasuryError(t, e) } finally { cm.saving = false }
}

// Settlement lines table (preview + saved) — the owner's own line has partner = null → "You (the owner)".
const SettlementLines = {
  props: { lines: { type: Array, default: () => [] } },
  setup(p) {
    return () => h('div', { class: 'dt-card' }, h('div', { class: 'dt-xscroll' }, h('table', { class: 'dt' }, [
      h('thead', h('tr', [
        h('th', { class: 'dt-th' }, t('finance.owner.f.partner_name')),
        h('th', { class: 'dt-th ta-right', style: 'width:90px' }, t('finance.owner.f.share')),
        h('th', { class: 'dt-th ta-right', style: 'width:150px' }, t('finance.owner.partners.their_part')),
      ])),
      h('tbody', p.lines.length
        ? p.lines.map((l, i) => h('tr', { class: 'dt-row', key: i }, [
          h('td', { class: l.partner ? '' : 'om-strong' }, l.partner ? (l.partner_name || '—') : t('finance.owner.partners.you')),
          h('td', { class: 'ta-right' }, l.share_pct != null ? fmtPct(l.share_pct) + '%' : '—'),
          h('td', { class: 'ta-right ' + (Number(l.amount) < 0 ? 'om-neg' : '') }, h(Money, { value: l.amount ?? 0 })),
        ]))
        : [h('tr', h('td', { colspan: 3, class: 'dt-empty' }, t('finance.owner.no_lines')))]),
    ])))
  },
}

onMounted(() => { if (partId.value) { loadPartners(); loadSettlements() } })
</script>
