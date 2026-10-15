<template>
  <div>
    <div class="om-toolbar">
      <div class="om-toolbar-left">
        <div class="om-kpi" style="min-width:200px">
          <div class="om-kpi-label">{{ t('finance.owner.totals.owed_by_me') }}</div>
          <div class="om-kpi-value" :class="{ 'om-neg': owedByMe > 0 }"><Money :value="owedByMe" /></div>
        </div>
        <div class="om-kpi" style="min-width:200px">
          <div class="om-kpi-label">{{ t('finance.owner.totals.owed_to_me') }}</div>
          <div class="om-kpi-value"><Money :value="owedToMe" /></div>
        </div>
      </div>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <label class="om-check"><input v-model="showClosed" type="checkbox" /><span>{{ t('finance.owner.loans.show_closed') }}</span></label>
        <BaseButton :disabled="!boxCount" @click="openNew"><Plus :size="14" /> {{ t('finance.owner.loans.new') }}</BaseButton>
      </div>
    </div>

    <div class="om-split">
      <div class="dt-card">
        <div class="dt-xscroll">
          <table class="dt">
            <thead>
              <tr>
                <th class="dt-th">{{ t('finance.owner.f.counterparty') }}</th>
                <th class="dt-th" style="width:130px">{{ t('finance.owner.f.direction') }}</th>
                <th class="dt-th">{{ t('finance.owner.f.part') }}</th>
                <th class="dt-th ta-right" style="width:140px">{{ t('finance.owner.loans.owed') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading"><td colspan="4" class="dt-loading">{{ t('finance.owner.loading') }}</td></tr>
              <tr v-else-if="loadError"><td colspan="4" class="dt-empty om-error">{{ loadError }}</td></tr>
              <tr v-else-if="!shown.length"><td colspan="4" class="dt-empty">{{ t('finance.owner.loans.empty') }}</td></tr>
              <template v-else>
                <tr v-for="l in shown" :key="l.id" class="dt-row clickable" :class="{ 'om-row-on': String(sel?.id) === String(l.id), 'om-row-dim': l.is_closed }" @click="pick(l)">
                  <td class="om-strong">{{ l.counterparty || '—' }}
                    <span v-if="l.is_closed" class="om-tag om-tag--muted">{{ t('finance.owner.loans.closed') }}</span>
                  </td>
                  <td><span class="om-tag" :class="l.direction === 'BORROWED' ? 'om-tag--warn' : 'om-tag'">{{ t('finance.owner.loans.dir.' + dirKey(l)) }}</span></td>
                  <td>{{ partLabel(l.part) }}</td>
                  <td class="ta-right om-strong"><Money :value="l.owed ?? 0" /></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Detail -->
      <div v-if="sel" class="om-panel">
        <div class="om-panel-head">
          <div>
            <h3 class="om-panel-title">{{ sel.counterparty }}</h3>
            <div class="om-muted">{{ t('finance.owner.loans.dir.' + dirKey(sel)) }} · {{ partLabel(sel.part) }}<template v-if="sel.opened_on"> · {{ fmtDay(sel.opened_on) }}</template></div>
          </div>
          <div class="om-panel-actions">
            <BaseButton size="sm" variant="secondary" :disabled="!(Number(sel.owed) > 0)" @click="openStep('pay')">{{ t('finance.owner.loans.pay_' + dirKey(sel)) }}</BaseButton>
            <BaseButton size="sm" variant="secondary" @click="openStep('more')">{{ t('finance.owner.loans.more_' + dirKey(sel)) }}</BaseButton>
          </div>
        </div>
        <div>
          <div class="om-kpi-label">{{ t('finance.owner.loans.owed_' + dirKey(sel)) }}</div>
          <div class="om-big"><Money :value="sel.owed ?? 0" /></div>
        </div>
        <p v-if="sel.note" class="om-sub">{{ sel.note }}</p>
        <div v-if="detailLoading" class="om-skel" style="height:80px" />
        <OwnerLines v-else :lines="detail?.lines || []" :parts="parts" />
      </div>
      <div v-else class="om-empty">{{ t('finance.owner.loans.pick') }}</div>
    </div>

    <!-- ══ MODAL: new loan ══ -->
    <AppModal :open="nm.open" :title="t('finance.owner.loans.new')" width="520px" @close="nm.open = false">
      <div class="om-form">
        <div>
          <label class="form-label">{{ t('finance.owner.f.direction') }}</label>
          <div class="om-seg">
            <button type="button" :class="{ active: nm.direction === 'BORROWED' }" @click="nm.direction = 'BORROWED'">{{ t('finance.owner.loans.dir.borrowed') }}</button>
            <button type="button" :class="{ active: nm.direction === 'LENT' }" @click="nm.direction = 'LENT'">{{ t('finance.owner.loans.dir.lent') }}</button>
          </div>
          <p class="om-help" style="margin-top:6px">{{ t('finance.owner.loans.dir_hint_' + (nm.direction === 'BORROWED' ? 'borrowed' : 'lent')) }}</p>
        </div>
        <BaseInput v-model="nm.counterparty" :label="t('finance.owner.f.counterparty')" :placeholder="t('finance.owner.f.counterparty_ph')" />
        <BaseSelect v-model="nm.part" :options="partOptions" :label="t('finance.owner.f.part')" :placeholder="t('finance.owner.f.pick_part')" />
        <BaseSelect v-model="nm.box" :options="boxesOf(nm.part)" :label="nm.direction === 'BORROWED' ? t('finance.owner.f.into_box') : t('finance.owner.f.from_box')"
                    :placeholder="boxesOf(nm.part).length ? t('finance.owner.f.pick_box') : t('finance.owner.f.no_boxes_in_part')" />
        <BaseInput v-model="nm.amount" type="number" min="0" step="0.01" :label="t('finance.owner.f.amount')" placeholder="0.00" />
        <BaseInput v-model="nm.note" :label="t('finance.owner.f.note')" :placeholder="t('finance.owner.f.loan_note_ph')" />
        <p v-if="nm.error" class="om-err">{{ nm.error }}</p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="nm.open = false">{{ t('common.cancel') }}</BaseButton>
        <BaseButton :loading="nm.saving" :disabled="!nm.counterparty.trim() || !nm.part || !nm.box || !(Number(nm.amount) > 0)" @click="saveNew">{{ t('common.save') }}</BaseButton>
      </template>
    </AppModal>

    <!-- ══ MODAL: pay back / add more ══ -->
    <AppModal :open="st.open" :title="sel ? t('finance.owner.loans.' + st.mode + '_' + dirKey(sel)) : ''" width="460px" @close="st.open = false">
      <div v-if="sel" class="om-form">
        <div class="om-summary">
          <div class="om-summary-row"><span>{{ sel.counterparty }}</span><span><Money :value="sel.owed ?? 0" /></span></div>
        </div>
        <BaseSelect v-model="st.box" :options="boxesOf(sel.part)" :label="stepBoxLabel" :placeholder="t('finance.owner.f.pick_box')" />
        <BaseInput v-model="st.amount" type="number" min="0" step="0.01" :label="t('finance.owner.f.amount')" placeholder="0.00" />
        <p v-if="st.mode === 'pay' && Number(st.amount) > Number(sel.owed || 0)" class="om-err">{{ t('finance.treasury.err.loan_overpaid') }}</p>
        <BaseInput v-model="st.note" :label="t('finance.owner.f.note')" />
        <p v-if="st.error" class="om-err">{{ st.error }}</p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="st.open = false">{{ t('common.cancel') }}</BaseButton>
        <BaseButton :loading="st.saving" :disabled="!st.box || !(Number(st.amount) > 0) || (st.mode === 'pay' && Number(st.amount) > Number(sel?.owed || 0))" @click="saveStep">{{ t('common.save') }}</BaseButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus } from 'lucide-vue-next'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import { showSuccessToast } from '@/utils/toast'
import { formatDate } from '@/utils/date'
import { treasuryError, boxName } from '@/utils/treasury'
import { OWNER_API, getList, partName } from '@/utils/ownerMoney'
import OwnerLines from './OwnerLines.vue'

const props = defineProps({ parts: { type: Array, default: () => [] } })
const emit = defineEmits(['changed'])
const { t } = useI18n()

function dirKey(l) { return l?.direction === 'LENT' ? 'lent' : 'borrowed' }
function fmtDay(d) { return d ? formatDate(String(d).length === 10 ? d + 'T12:00:00Z' : d) : '' }
function partLabel(id) { return partName(t, props.parts.find(p => String(p.id) === String(id))) }
const partOptions = computed(() => props.parts.map(p => ({ value: p.id, label: partName(t, p) })))
function boxesOf(partId) {
  const p = props.parts.find(x => String(x.id) === String(partId))
  return (p?.boxes || []).filter(b => b.is_active !== false && b.system_role !== 'UNSORTED').map(b => ({ value: b.id, label: boxName(t, b) }))
}
const boxCount = computed(() => props.parts.reduce((n, p) => n + boxesOf(p.id).length, 0))

const loans = ref([])
const loading = ref(false)
const loadError = ref('')
const showClosed = ref(false)
const shown = computed(() => loans.value.filter(l => showClosed.value || !l.is_closed))
const owedByMe = computed(() => loans.value.filter(l => l.direction === 'BORROWED').reduce((s, l) => s + Number(l.owed || 0), 0))
const owedToMe = computed(() => loans.value.filter(l => l.direction === 'LENT').reduce((s, l) => s + Number(l.owed || 0), 0))

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    loans.value = await getList('loans/')
    if (sel.value) {
      const again = loans.value.find(l => String(l.id) === String(sel.value.id))
      sel.value = again || null
      if (again) loadDetail(again.id)
    }
  } catch (e) {
    loans.value = []
    loadError.value = treasuryError(t, e, t('finance.owner.err_load'))
  } finally { loading.value = false }
}

const sel = ref(null)
const detail = ref(null)
const detailLoading = ref(false)
function pick(l) { sel.value = l; loadDetail(l.id) }
async function loadDetail(id) {
  detailLoading.value = true
  try {
    const r = await api.get(`${OWNER_API}/loans/${id}/`)
    detail.value = r.data
    if (r.data && String(sel.value?.id) === String(id)) sel.value = { ...sel.value, ...r.data, lines: undefined }
  } catch { detail.value = null } finally { detailLoading.value = false }
}

// ── New loan ──
const nm = reactive({ open: false, direction: 'BORROWED', counterparty: '', part: '', box: '', amount: '', note: '', saving: false, error: '' })
function openNew() {
  const first = props.parts.length === 1 ? props.parts[0].id : ''
  Object.assign(nm, { open: true, direction: 'BORROWED', counterparty: '', part: first, box: '', amount: '', note: '', saving: false, error: '' })
}
async function saveNew() {
  nm.saving = true
  nm.error = ''
  try {
    const r = await api.post(`${OWNER_API}/loans/`, {
      part: nm.part, direction: nm.direction, counterparty: nm.counterparty.trim(), amount: nm.amount, box: nm.box, note: nm.note || '',
    })
    nm.open = false
    showSuccessToast(t('finance.owner.saved'))
    if (r.data?.id) sel.value = r.data
    load()
    emit('changed')
  } catch (e) { nm.error = treasuryError(t, e) } finally { nm.saving = false }
}

// ── Pay back / add more ──
const st = reactive({ open: false, mode: 'pay', box: '', amount: '', note: '', saving: false, error: '' })
// borrowed: paying back takes money OUT of a box, borrowing more puts money IN · lent: the mirror
const stepBoxLabel = computed(() => {
  const out = (dirKey(sel.value) === 'borrowed') === (st.mode === 'pay')
  return out ? t('finance.owner.f.from_box') : t('finance.owner.f.into_box')
})
function openStep(mode) {
  const opts = boxesOf(sel.value?.part)
  Object.assign(st, { open: true, mode, box: opts.length === 1 ? opts[0].value : '', amount: '', note: '', saving: false, error: '' })
}
async function saveStep() {
  st.saving = true
  st.error = ''
  try {
    await api.post(`${OWNER_API}/loans/${sel.value.id}/${st.mode}/`, { amount: st.amount, box: st.box, note: st.note || '' })
    st.open = false
    showSuccessToast(t('finance.owner.saved'))
    load()
    emit('changed')
  } catch (e) { st.error = treasuryError(t, e) } finally { st.saving = false }
}

onMounted(load)
</script>
