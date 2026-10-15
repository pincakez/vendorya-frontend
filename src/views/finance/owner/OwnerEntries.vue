<template>
  <div>
    <div class="om-toolbar">
      <div class="om-toolbar-left">
        <BaseSelect v-model="partFilter" :options="filterOptions" :label="t('finance.owner.f.part')" />
      </div>
      <BaseButton :disabled="!entryParts.length" @click="openNew"><Plus :size="14" /> {{ t('finance.owner.entries.new') }}</BaseButton>
    </div>
    <p class="om-sub" style="margin-bottom:12px">{{ t('finance.owner.entries.hint') }}</p>

    <div v-if="!entryParts.length" class="om-empty">{{ t('finance.owner.entries.no_parts') }}</div>
    <template v-else>
      <div class="om-kpis">
        <div class="om-kpi"><div class="om-kpi-label">{{ t('finance.owner.entries.total_in') }}</div><div class="om-kpi-value om-pos"><Money :value="totals.in" /></div></div>
        <div class="om-kpi"><div class="om-kpi-label">{{ t('finance.owner.entries.total_out') }}</div><div class="om-kpi-value om-neg"><Money :value="totals.out" /></div></div>
        <div class="om-kpi"><div class="om-kpi-label">{{ t('finance.owner.entries.total_net') }}</div><div class="om-kpi-value" :class="{ 'om-neg': totals.in - totals.out < 0 }"><Money :value="totals.in - totals.out" /></div></div>
      </div>

      <div class="dt-card">
        <div class="dt-xscroll">
          <table class="dt">
            <thead>
              <tr>
                <th class="dt-th" style="width:110px">{{ t('common.date') }}</th>
                <th class="dt-th">{{ t('finance.owner.f.part') }}</th>
                <th class="dt-th" style="width:120px">{{ t('finance.owner.f.direction') }}</th>
                <th class="dt-th">{{ t('finance.owner.f.category') }}</th>
                <th class="dt-th">{{ t('finance.owner.f.box') }}</th>
                <th class="dt-th">{{ t('common.description') }}</th>
                <th class="dt-th ta-right" style="width:140px">{{ t('finance.owner.f.amount') }}</th>
                <th class="dt-th" style="width:64px"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading"><td colspan="8" class="dt-loading">{{ t('finance.owner.loading') }}</td></tr>
              <tr v-else-if="loadError"><td colspan="8" class="dt-empty om-error">{{ loadError }}</td></tr>
              <tr v-else-if="!filtered.length"><td colspan="8" class="dt-empty">{{ t('finance.owner.entries.empty') }}</td></tr>
              <template v-else>
              <tr v-for="e in pageRows" :key="e.id" class="dt-row">
                <td class="om-muted">{{ fmtDay(e.date) }}</td>
                <td>{{ partLabel(e.part) }}</td>
                <td><span class="om-tag" :class="e.direction === 'IN' ? 'om-tag--ok' : 'om-tag--warn'">{{ t('finance.owner.entries.dir.' + (e.direction === 'IN' ? 'IN' : 'OUT')) }}</span></td>
                <td>{{ e.category || '—' }} <span v-if="e.owner_only" class="om-tag om-tag--muted">{{ t('finance.owner.owner_only_tag') }}</span></td>
                <td>{{ e.box_name || boxLabel(e.box) }}</td>
                <td class="om-muted" :title="e.description">{{ e.description || '—' }}</td>
                <td class="ta-right" :class="e.direction === 'IN' ? 'om-pos' : 'om-neg'"><Money :value="e.direction === 'IN' ? e.amount : -Number(e.amount || 0)" /></td>
                <td class="ta-right">
                  <button class="om-row-action danger" :title="t('common.delete')" @click="remove(e)"><Trash2 :size="13" /></button>
                </td>
              </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
      <AppPagination v-if="filtered.length > pageSize" :page="page" :page-size="pageSize" :total="filtered.length" @update:page="p => (page = p)" />
    </template>

    <!-- ══ MODAL: new entry ══ -->
    <AppModal :open="modal.open" :title="t('finance.owner.entries.new')" width="520px" @close="modal.open = false">
      <div class="om-form">
        <BaseSelect v-model="modal.part" :options="partOptions" :label="t('finance.owner.f.part')" :placeholder="t('finance.owner.f.pick_part')" />
        <div>
          <label class="form-label">{{ t('finance.owner.f.direction') }}</label>
          <div class="om-seg">
            <button type="button" :class="{ active: modal.direction === 'IN' }" @click="modal.direction = 'IN'">{{ t('finance.owner.entries.dir.IN') }}</button>
            <button type="button" :class="{ active: modal.direction === 'OUT' }" @click="modal.direction = 'OUT'">{{ t('finance.owner.entries.dir.OUT') }}</button>
          </div>
        </div>
        <div class="om-form-row">
          <BaseInput v-model="modal.amount" type="number" min="0" step="0.01" :label="t('finance.owner.f.amount')" placeholder="0.00" />
          <BaseInput v-model="modal.date" type="date" :label="t('common.date')" />
        </div>
        <BaseInput v-model="modal.category" :label="t('finance.owner.f.category')" list="om-entry-cats"
                   :placeholder="modal.direction === 'IN' ? t('finance.owner.f.category_in_ph') : t('finance.owner.f.category_out_ph')" />
        <datalist id="om-entry-cats"><option v-for="c in knownCategories" :key="c" :value="c" /></datalist>
        <BaseSelect v-model="modal.box" :options="boxOptions" :label="modal.direction === 'IN' ? t('finance.owner.f.into_box') : t('finance.owner.f.from_box')"
                    :placeholder="boxOptions.length ? t('finance.owner.f.pick_box') : t('finance.owner.f.no_boxes_in_part')" />
        <div>
          <label class="form-label">{{ t('common.description') }} <span class="om-muted">({{ t('common.optional') }})</span></label>
          <textarea v-model="modal.description" class="form-input" rows="2" />
        </div>
        <template v-if="showOwnerOnly">
          <label class="om-check">
            <input v-model="modal.owner_only" type="checkbox" />
            <span>{{ t('finance.owner.owner_only_label') }}</span>
          </label>
          <p class="om-help">{{ t('finance.owner.owner_only_hint') }}</p>
        </template>
        <p v-if="modal.error" class="om-err">{{ modal.error }}</p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="modal.open = false">{{ t('common.cancel') }}</BaseButton>
        <BaseButton :loading="modal.saving" :disabled="!canSave" @click="save">{{ t('common.save') }}</BaseButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Trash2 } from 'lucide-vue-next'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import { showSuccessToast, showErrorToast } from '@/utils/toast'
import { formatDate } from '@/utils/date'
import { treasuryError, boxName } from '@/utils/treasury'
import { OWNER_API, getList, partName, indexBoxes, localISO } from '@/utils/ownerMoney'

const props = defineProps({ parts: { type: Array, default: () => [] } })
const emit = defineEmits(['changed'])
const { t } = useI18n()

// PartEntry = income / spending of a side business or of personal money (the shop has its own sales + expenses).
const entryParts = computed(() => props.parts.filter(p => p.kind === 'BUSINESS' || p.kind === 'PERSONAL'))
const partOptions = computed(() => entryParts.value.map(p => ({ value: p.id, label: partName(t, p) })))
const filterOptions = computed(() => [{ value: '', label: t('finance.owner.all_parts') }, ...partOptions.value])
const partFilter = ref('')
const idx = computed(() => indexBoxes(props.parts))
function partLabel(id) { return partName(t, props.parts.find(p => String(p.id) === String(id))) }
function boxLabel(id) { return idx.value[id] ? boxName(t, idx.value[id].box) : '—' }
function fmtDay(d) { return d ? formatDate(String(d).length === 10 ? d + 'T12:00:00Z' : d) : '—' }

const rows = ref([])
const loading = ref(false)
const loadError = ref('')
const page = ref(1)
const pageSize = 25
const filtered = computed(() => rows.value.filter(e => !partFilter.value || String(e.part) === String(partFilter.value)))
const pageRows = computed(() => filtered.value.slice((page.value - 1) * pageSize, page.value * pageSize))
const totals = computed(() => filtered.value.reduce((s, e) => {
  const a = Number(e.amount || 0)
  if (e.direction === 'IN') s.in += a; else s.out += a
  return s
}, { in: 0, out: 0 }))
const knownCategories = computed(() => [...new Set(rows.value
  .filter(e => e.direction === modal.direction && e.category).map(e => e.category))].sort())
watch(partFilter, () => { page.value = 1 })

async function load() {
  loading.value = true
  loadError.value = ''
  try { rows.value = await getList('entries/') } catch (e) {
    rows.value = []
    loadError.value = treasuryError(t, e, t('finance.owner.err_load'))
  } finally { loading.value = false }
}

// Which business parts have active partners → only those offer the "owner-only" tick.
const partnerParts = ref(new Set())
async function loadPartners() {
  try {
    const list = await getList('partners/')
    partnerParts.value = new Set(list.filter(p => p.is_active !== false).map(p => String(p.part)))
  } catch { partnerParts.value = new Set() }
}

const modal = reactive({ open: false, part: '', direction: 'OUT', amount: '', date: '', category: '', box: '', description: '', owner_only: false, saving: false, error: '' })
const modalPart = computed(() => entryParts.value.find(p => String(p.id) === String(modal.part)) || null)
const boxOptions = computed(() => (modalPart.value?.boxes || [])
  .filter(b => b.is_active !== false && b.system_role !== 'UNSORTED')
  .map(b => ({ value: b.id, label: boxName(t, b) })))
const showOwnerOnly = computed(() => modalPart.value?.kind === 'BUSINESS' && partnerParts.value.has(String(modalPart.value.id)))
const canSave = computed(() => !!modal.part && !!modal.box && Number(modal.amount) > 0 && !!modal.category.trim() && !!modal.date)
watch(() => modal.part, () => {
  if (!boxOptions.value.some(o => o.value === modal.box)) modal.box = boxOptions.value.length === 1 ? boxOptions.value[0].value : ''
  if (!showOwnerOnly.value) modal.owner_only = false
})

function openNew() {
  Object.assign(modal, {
    open: true, part: partFilter.value || (entryParts.value.length === 1 ? entryParts.value[0].id : ''), direction: 'OUT',
    amount: '', date: localISO(), category: '', box: '', description: '', owner_only: false, saving: false, error: '',
  })
}
async function save() {
  modal.saving = true
  modal.error = ''
  try {
    await api.post(`${OWNER_API}/entries/`, {
      part: modal.part, direction: modal.direction, category: modal.category.trim(), amount: modal.amount,
      date: modal.date, box: modal.box, description: modal.description || '', owner_only: showOwnerOnly.value && modal.owner_only,
    })
    modal.open = false
    showSuccessToast(t('finance.owner.saved'))
    load()
    emit('changed')
  } catch (e) { modal.error = treasuryError(t, e) } finally { modal.saving = false }
}

async function remove(e) {
  if (!confirm(t('finance.owner.entries.delete_confirm'))) return
  try {
    await api.delete(`${OWNER_API}/entries/${e.id}/`)
    showSuccessToast(t('finance.owner.entries.deleted'))
    load()
    emit('changed')
  } catch (err) { showErrorToast(treasuryError(t, err), 3500) }
}

onMounted(() => { load(); loadPartners() })
</script>
