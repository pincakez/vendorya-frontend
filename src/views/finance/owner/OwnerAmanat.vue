<template>
  <div>
    <!-- Live total at the top: money in my boxes that belongs to other people -->
    <div class="om-toolbar">
      <div class="om-kpi" style="min-width:260px">
        <div class="om-kpi-label">{{ t('finance.owner.amanat.total') }}</div>
        <div class="om-kpi-value"><Money :value="liveTotal" /></div>
        <div class="om-muted" style="margin-top:4px">{{ t('finance.owner.amanat.total_hint') }}</div>
      </div>
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <label class="om-check"><input v-model="showClosed" type="checkbox" /><span>{{ t('finance.owner.amanat.show_closed') }}</span></label>
        <BaseButton :disabled="!boxCount" @click="openNew"><Plus :size="14" /> {{ t('finance.owner.amanat.new') }}</BaseButton>
      </div>
    </div>

    <div class="om-split">
      <div class="dt-card">
        <div class="dt-xscroll">
          <table class="dt">
            <thead>
              <tr>
                <th class="dt-th">{{ t('finance.owner.f.held_for') }}</th>
                <th class="dt-th">{{ t('finance.owner.f.part') }}</th>
                <th class="dt-th" style="width:110px">{{ t('finance.owner.f.since') }}</th>
                <th class="dt-th ta-right" style="width:140px">{{ t('finance.owner.amanat.held') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading"><td colspan="4" class="dt-loading">{{ t('finance.owner.loading') }}</td></tr>
              <tr v-else-if="loadError"><td colspan="4" class="dt-empty om-error">{{ loadError }}</td></tr>
              <tr v-else-if="!shown.length"><td colspan="4" class="dt-empty">{{ t('finance.owner.amanat.empty') }}</td></tr>
              <template v-else>
                <tr v-for="a in shown" :key="a.id" class="dt-row clickable" :class="{ 'om-row-on': String(sel?.id) === String(a.id), 'om-row-dim': a.is_closed }" @click="pick(a)">
                  <td class="om-strong">{{ a.held_for || '—' }}
                    <span v-if="a.is_closed" class="om-tag om-tag--muted">{{ t('finance.owner.amanat.returned') }}</span>
                  </td>
                  <td>{{ partLabel(a.part) }}</td>
                  <td class="om-muted">{{ fmtDay(a.opened_on) }}</td>
                  <td class="ta-right om-strong"><Money :value="a.held ?? 0" /></td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>

      <div v-if="sel" class="om-panel">
        <div class="om-panel-head">
          <div>
            <h3 class="om-panel-title">{{ sel.held_for }}</h3>
            <div class="om-muted">{{ partLabel(sel.part) }}<template v-if="sel.opened_on"> · {{ fmtDay(sel.opened_on) }}</template></div>
          </div>
          <div class="om-panel-actions">
            <BaseButton size="sm" variant="secondary" :disabled="!(Number(sel.held) > 0)" @click="openStep('return')">{{ t('finance.owner.amanat.give_back') }}</BaseButton>
            <BaseButton size="sm" variant="secondary" @click="openStep('more')">{{ t('finance.owner.amanat.add_more') }}</BaseButton>
          </div>
        </div>
        <div>
          <div class="om-kpi-label">{{ t('finance.owner.amanat.held') }}</div>
          <div class="om-big"><Money :value="sel.held ?? 0" /></div>
        </div>
        <p v-if="sel.note" class="om-sub">{{ sel.note }}</p>
        <div v-if="detailLoading" class="om-skel" style="height:80px" />
        <OwnerLines v-else :lines="detail?.lines || []" :parts="parts" />
      </div>
      <div v-else class="om-empty">{{ t('finance.owner.amanat.pick') }}</div>
    </div>

    <!-- ══ MODAL: receive an amana ══ -->
    <AppModal :open="nm.open" :title="t('finance.owner.amanat.new')" width="500px" @close="nm.open = false">
      <div class="om-form">
        <p class="om-sub">{{ t('finance.owner.amanat.new_hint') }}</p>
        <BaseInput v-model="nm.held_for" :label="t('finance.owner.f.held_for')" :placeholder="t('finance.owner.f.held_for_ph')" />
        <BaseSelect v-model="nm.part" :options="partOptions" :label="t('finance.owner.f.part')" :placeholder="t('finance.owner.f.pick_part')" />
        <BaseSelect v-model="nm.box" :options="boxesOf(nm.part)" :label="t('finance.owner.f.into_box')"
                    :placeholder="boxesOf(nm.part).length ? t('finance.owner.f.pick_box') : t('finance.owner.f.no_boxes_in_part')" />
        <BaseInput v-model="nm.amount" type="number" min="0" step="0.01" :label="t('finance.owner.f.amount')" placeholder="0.00" />
        <BaseInput v-model="nm.note" :label="t('finance.owner.f.note')" />
        <p v-if="nm.error" class="om-err">{{ nm.error }}</p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="nm.open = false">{{ t('common.cancel') }}</BaseButton>
        <BaseButton :loading="nm.saving" :disabled="!nm.held_for.trim() || !nm.part || !nm.box || !(Number(nm.amount) > 0)" @click="saveNew">{{ t('common.save') }}</BaseButton>
      </template>
    </AppModal>

    <!-- ══ MODAL: give back / add more ══ -->
    <AppModal :open="st.open" :title="st.mode === 'return' ? t('finance.owner.amanat.give_back') : t('finance.owner.amanat.add_more')" width="460px" @close="st.open = false">
      <div v-if="sel" class="om-form">
        <div class="om-summary">
          <div class="om-summary-row"><span>{{ sel.held_for }}</span><span><Money :value="sel.held ?? 0" /></span></div>
        </div>
        <BaseSelect v-model="st.box" :options="boxesOf(sel.part)" :label="st.mode === 'return' ? t('finance.owner.f.from_box') : t('finance.owner.f.into_box')" :placeholder="t('finance.owner.f.pick_box')" />
        <BaseInput v-model="st.amount" type="number" min="0" step="0.01" :label="t('finance.owner.f.amount')" placeholder="0.00" />
        <p v-if="st.mode === 'return' && Number(st.amount) > Number(sel.held || 0)" class="om-err">{{ t('finance.treasury.err.amana_overdrawn') }}</p>
        <BaseInput v-model="st.note" :label="t('finance.owner.f.note')" />
        <p v-if="st.error" class="om-err">{{ st.error }}</p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="st.open = false">{{ t('common.cancel') }}</BaseButton>
        <BaseButton :loading="st.saving" :disabled="!st.box || !(Number(st.amount) > 0) || (st.mode === 'return' && Number(st.amount) > Number(sel?.held || 0))" @click="saveStep">{{ t('common.save') }}</BaseButton>
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

function fmtDay(d) { return d ? formatDate(String(d).length === 10 ? d + 'T12:00:00Z' : d) : '—' }
function partLabel(id) { return partName(t, props.parts.find(p => String(p.id) === String(id))) }
const partOptions = computed(() => props.parts.map(p => ({ value: p.id, label: partName(t, p) })))
function boxesOf(partId) {
  const p = props.parts.find(x => String(x.id) === String(partId))
  return (p?.boxes || []).filter(b => b.is_active !== false && b.system_role !== 'UNSORTED').map(b => ({ value: b.id, label: boxName(t, b) }))
}
const boxCount = computed(() => props.parts.reduce((n, p) => n + boxesOf(p.id).length, 0))

const rows = ref([])
const loading = ref(false)
const loadError = ref('')
const showClosed = ref(false)
const shown = computed(() => rows.value.filter(a => showClosed.value || !a.is_closed))
// The live total = Σ what is still held (same as the server's amanat_total), recomputed after every change.
const liveTotal = computed(() => rows.value.filter(a => !a.is_closed).reduce((s, a) => s + Number(a.held || 0), 0))

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    rows.value = await getList('amanat/')
    if (sel.value) {
      const again = rows.value.find(a => String(a.id) === String(sel.value.id))
      sel.value = again || null
      if (again) loadDetail(again.id)
    }
  } catch (e) {
    rows.value = []
    loadError.value = treasuryError(t, e, t('finance.owner.err_load'))
  } finally { loading.value = false }
}

const sel = ref(null)
const detail = ref(null)
const detailLoading = ref(false)
function pick(a) { sel.value = a; loadDetail(a.id) }
async function loadDetail(id) {
  detailLoading.value = true
  try {
    const r = await api.get(`${OWNER_API}/amanat/${id}/`)
    detail.value = r.data
    if (r.data && String(sel.value?.id) === String(id)) sel.value = { ...sel.value, ...r.data, lines: undefined }
  } catch { detail.value = null } finally { detailLoading.value = false }
}

const nm = reactive({ open: false, held_for: '', part: '', box: '', amount: '', note: '', saving: false, error: '' })
function openNew() {
  const first = props.parts.length === 1 ? props.parts[0].id : ''
  Object.assign(nm, { open: true, held_for: '', part: first, box: '', amount: '', note: '', saving: false, error: '' })
}
async function saveNew() {
  nm.saving = true
  nm.error = ''
  try {
    const r = await api.post(`${OWNER_API}/amanat/`, {
      part: nm.part, held_for: nm.held_for.trim(), amount: nm.amount, box: nm.box, note: nm.note || '',
    })
    nm.open = false
    showSuccessToast(t('finance.owner.saved'))
    if (r.data?.id) sel.value = r.data
    load()
    emit('changed')
  } catch (e) { nm.error = treasuryError(t, e) } finally { nm.saving = false }
}

const st = reactive({ open: false, mode: 'return', box: '', amount: '', note: '', saving: false, error: '' })
function openStep(mode) {
  const opts = boxesOf(sel.value?.part)
  Object.assign(st, { open: true, mode, box: opts.length === 1 ? opts[0].value : '', amount: '', note: '', saving: false, error: '' })
}
async function saveStep() {
  st.saving = true
  st.error = ''
  try {
    await api.post(`${OWNER_API}/amanat/${sel.value.id}/${st.mode}/`, { amount: st.amount, box: st.box, note: st.note || '' })
    st.open = false
    showSuccessToast(t('finance.owner.saved'))
    load()
    emit('changed')
  } catch (e) { st.error = treasuryError(t, e) } finally { st.saving = false }
}

onMounted(load)
</script>
