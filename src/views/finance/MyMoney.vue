<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('finance.owner.title') }}</h1>
        <p class="page-sub">{{ t('finance.owner.sub') }}</p>
      </div>
      <div v-if="!gate" class="header-right om-actions">
        <BaseButton variant="secondary" @click="openNewPart">
          <Briefcase :size="14" /> {{ t('finance.owner.new_business') }}
        </BaseButton>
        <BaseButton variant="secondary" :disabled="!parts.length" @click="openNewBox()">
          <Plus :size="14" /> {{ t('finance.owner.new_box') }}
        </BaseButton>
        <BaseButton variant="primary" :disabled="openBoxCount < 2" @click="setTab('move')">
          <ArrowRightLeft :size="14" /> {{ t('finance.owner.move_money') }}
        </BaseButton>
      </div>
    </div>

    <!-- Not open right now (a switch is off / this login is not the owner) — explain, never a bare error -->
    <div v-if="gate" class="om-gate">
      <component :is="gate === 'not_owner' ? UserX : PiggyBank" :size="34" class="om-gate-icon" />
      <div class="om-gate-title">{{ t('finance.owner.gate.' + gateKey + '_title') }}</div>
      <div class="om-gate-text">{{ t('finance.owner.gate.' + gateKey + '_text') }}</div>
      <router-link v-if="gate !== 'not_owner' && auth.hasRole('OWNER')" to="/settings/capabilities" class="om-link">{{ t('finance.owner.gate.link') }}</router-link>
    </div>

    <template v-else>
      <div class="om-tabs" role="tablist">
        <button v-for="tab in tabs" :key="tab.id" class="om-tab" :class="{ active: activeTab === tab.id }" role="tab" @click="setTab(tab.id)">
          <component :is="tab.icon" :size="15" />
          {{ t('finance.owner.tabs.' + tab.id) }}
        </button>
      </div>

      <OwnerOverview v-if="activeTab === 'overview'" :overview="overview" :loading="loading" :error="loadError"
                     @edit-part="openEditPart" @edit-box="openEditBox" @new-box="openNewBox" @new-part="openNewPart" />
      <OwnerMove v-else-if="activeTab === 'move'" :parts="parts" @done="reload" />
      <OwnerEntries v-else-if="activeTab === 'entries'" :parts="parts" @changed="reload" />
      <OwnerLoans v-else-if="activeTab === 'loans'" :parts="parts" @changed="reload" />
      <OwnerAmanat v-else-if="activeTab === 'amanat'" :parts="parts" @changed="reload" />
      <OwnerPartners v-else-if="activeTab === 'partners'" :parts="parts" @changed="reload" />
      <OwnerPnl v-else-if="activeTab === 'pnl'" :parts="parts" />
      <MoneyReports v-else-if="activeTab === 'reports'" scope="owner" />
    </template>

    <!-- ══ MODAL: New business / rename or close a business ══ -->
    <AppModal :open="partModal.open" :title="partModal.id ? t('finance.owner.edit_part') : t('finance.owner.new_business')" width="460px" @close="partModal.open = false">
      <div class="om-form">
        <p v-if="!partModal.id" class="om-sub">{{ t('finance.owner.new_business_hint') }}</p>
        <BaseInput v-model="partModal.name" :label="t('finance.owner.f.name')" :placeholder="t('finance.owner.f.business_name_ph')" />
        <template v-if="partModal.id">
          <label class="om-check">
            <input v-model="partModal.closeIt" type="checkbox" />
            <span>{{ t('finance.owner.f.close_part') }}</span>
          </label>
          <p v-if="partModal.closeIt" class="om-help">{{ t('finance.owner.f.close_part_hint') }}</p>
        </template>
        <p v-if="partModal.error" class="om-err">{{ partModal.error }}</p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="partModal.open = false">{{ t('common.cancel') }}</BaseButton>
        <BaseButton :loading="partModal.saving" :disabled="!partModal.name.trim()" @click="savePart">{{ t('common.save') }}</BaseButton>
      </template>
    </AppModal>

    <!-- ══ MODAL: New box / edit a box ══ -->
    <AppModal :open="boxModal.open" :title="boxModal.id ? t('finance.owner.edit_box') : t('finance.owner.new_box')" width="500px" @close="boxModal.open = false">
      <div class="om-form">
        <template v-if="!boxModal.id">
          <BaseSelect v-model="boxModal.part" :options="partOptions" :label="t('finance.owner.f.part')" :placeholder="t('finance.owner.f.pick_part')" />
          <p v-if="boxPart?.kind === 'PERSONAL'" class="om-help">{{ t('finance.owner.personal_box_hint') }}</p>
        </template>
        <BaseInput v-model="boxModal.name" :label="t('finance.owner.f.name')" :placeholder="boxPart?.kind === 'PERSONAL' ? t('finance.owner.f.personal_box_ph') : t('finance.owner.f.box_name_ph')" />
        <template v-if="!boxModal.id">
          <BaseSelect v-model="boxModal.kind" :options="kindOptions" :label="t('finance.owner.f.kind')" />
          <BaseInput v-model="boxModal.opening" type="number" step="0.01" :label="t('finance.owner.f.opening')" placeholder="0.00" />
          <p class="om-help">{{ t('finance.owner.f.opening_hint') }}</p>
        </template>
        <div>
          <label class="form-label">{{ t('finance.owner.f.note') }} <span class="om-muted">({{ t('common.optional') }})</span></label>
          <textarea v-model="boxModal.note" class="form-input" rows="2" />
        </div>
        <template v-if="boxModal.id">
          <label class="om-check">
            <input v-model="boxModal.closeIt" type="checkbox" />
            <span>{{ t('finance.owner.f.close_box') }}</span>
          </label>
          <p v-if="boxModal.closeIt" class="om-help">{{ t('finance.owner.f.close_box_hint') }}</p>
        </template>
        <p v-if="boxModal.error" class="om-err">{{ boxModal.error }}</p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="boxModal.open = false">{{ t('common.cancel') }}</BaseButton>
        <BaseButton :loading="boxModal.saving" :disabled="!boxModal.name.trim() || (!boxModal.id && !boxModal.part)" @click="saveBox">{{ t('common.save') }}</BaseButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import {
  Plus, Briefcase, ArrowRightLeft, PiggyBank, UserX, LayoutGrid, Coins, HandCoins, Users, BarChart3, Lock,
  FileBarChart,
} from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import { useFormatStore } from '@/stores/format'
import AppModal from '@/components/ui/AppModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import { showSuccessToast } from '@/utils/toast'
import { treasuryError, kindLabel } from '@/utils/treasury'
import { OWNER_API, OWNER_BOX_KINDS, GATE_CODES, sortParts, partName, errCode } from '@/utils/ownerMoney'
import OwnerOverview from './owner/OwnerOverview.vue'
import OwnerMove from './owner/OwnerMove.vue'
import OwnerEntries from './owner/OwnerEntries.vue'
import OwnerLoans from './owner/OwnerLoans.vue'
import OwnerAmanat from './owner/OwnerAmanat.vue'
import OwnerPartners from './owner/OwnerPartners.vue'
import OwnerPnl from './owner/OwnerPnl.vue'
import MoneyReports from './owner/MoneyReports.vue'
import './owner/owner.css'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const fmt = useFormatStore()

// UI tabs inside the view (not router tabs); `?tab=` only so a box page's back button lands on the same tab.
const tabs = [
  { id: 'overview', icon: LayoutGrid },
  { id: 'move',     icon: ArrowRightLeft },
  { id: 'entries',  icon: Coins },
  { id: 'loans',    icon: HandCoins },
  { id: 'amanat',   icon: Lock },
  { id: 'partners', icon: Users },
  { id: 'pnl',      icon: BarChart3 },
  { id: 'reports',  icon: FileBarChart },   // s172 Wave 3
]
const TAB_IDS = tabs.map(x => x.id)
const activeTab = ref(TAB_IDS.includes(route.query.tab) ? route.query.tab : 'overview')
function setTab(id) {
  activeTab.value = id
  router.replace({ query: id === 'overview' ? {} : { tab: id } }).catch(() => {})
}
// s174: the sidebar's My money tree links straight to a tab (same page, only ?tab= changes)
watch(() => route.query.tab, v => { activeTab.value = TAB_IDS.includes(v) ? v : 'overview' })

// ── Overview (the ONE source of parts + boxes for every tab) ─────────────
const overview = ref(null)
const loading = ref(false)
const loadError = ref('')
const gate = ref('')
const gateKey = computed(() => ({ owner_level_off: 'owner_level_off', not_owner: 'not_owner', treasury_off: 'treasury_off', no_store: 'not_owner' }[gate.value] || 'owner_level_off'))

const parts = computed(() => sortParts(overview.value?.parts || []))
const openBoxCount = computed(() => parts.value.reduce((n, p) => n + (p.boxes || []).filter(b => b.is_active !== false && b.system_role !== 'UNSORTED').length, 0))

async function reload() {
  loading.value = !overview.value
  loadError.value = ''
  try {
    const r = await api.get(`${OWNER_API}/overview/`)
    overview.value = r.data || { parts: [] }
    gate.value = ''
  } catch (e) {
    const code = errCode(e)
    if (GATE_CODES.includes(code)) {
      gate.value = code
      // the menu was stale — hide "My money" until the switches / owner change again
      if (code === 'owner_level_off') fmt.apply({ treasury_owner_level: false })
      if (code === 'treasury_off') fmt.apply({ treasury_enabled: false })
      if (code === 'not_owner') fmt.apply({ treasury_is_owner: false })
    } else {
      loadError.value = treasuryError(t, e, t('finance.owner.err_load'))
    }
  } finally { loading.value = false }
}

// ── Business part: new / rename / close ──────────────────────────────────
const partModal = reactive({ open: false, id: null, name: '', closeIt: false, saving: false, error: '' })
function openNewPart() { Object.assign(partModal, { open: true, id: null, name: '', closeIt: false, saving: false, error: '' }) }
function openEditPart(p) { Object.assign(partModal, { open: true, id: p.id, name: p.name || '', closeIt: false, saving: false, error: '' }) }
async function savePart() {
  partModal.saving = true
  partModal.error = ''
  try {
    if (partModal.id) {
      const body = { name: partModal.name.trim() }
      if (partModal.closeIt) body.is_active = false
      await api.patch(`${OWNER_API}/parts/${partModal.id}/`, body)
    } else {
      await api.post(`${OWNER_API}/parts/`, { name: partModal.name.trim(), kind: 'BUSINESS' })
    }
    partModal.open = false
    showSuccessToast(t('finance.owner.saved'))
    reload()
  } catch (e) { partModal.error = treasuryError(t, e) } finally { partModal.saving = false }
}

// ── Box: new / edit ──────────────────────────────────────────────────────
const boxModal = reactive({ open: false, id: null, part: '', name: '', kind: 'CASH', opening: '', note: '', closeIt: false, saving: false, error: '' })
const partOptions = computed(() => parts.value.map(p => ({ value: p.id, label: partName(t, p) })))
const boxPart = computed(() => parts.value.find(p => String(p.id) === String(boxModal.part)) || null)
const kindOptions = computed(() => OWNER_BOX_KINDS.map(k => ({ value: k, label: kindLabel(t, k) })))
function openNewBox(partId = '') {
  Object.assign(boxModal, { open: true, id: null, part: partId || '', name: '', kind: 'CASH', opening: '', note: '', closeIt: false, saving: false, error: '' })
}
function openEditBox(b) {
  Object.assign(boxModal, { open: true, id: b.id, part: b.part || '', name: b.name || '', kind: b.kind, opening: '', note: b.note || '', closeIt: false, saving: false, error: '' })
}
async function saveBox() {
  boxModal.saving = true
  boxModal.error = ''
  try {
    if (boxModal.id) {
      const body = { name: boxModal.name.trim(), note: boxModal.note || '' }
      if (boxModal.closeIt) body.is_active = false
      await api.patch(`${OWNER_API}/boxes/${boxModal.id}/`, body)
    } else {
      const body = { part: boxModal.part, name: boxModal.name.trim(), kind: boxModal.kind, note: boxModal.note || '' }
      if (boxModal.opening !== '' && Number(boxModal.opening) !== 0) body.opening = boxModal.opening
      await api.post(`${OWNER_API}/boxes/`, body)
    }
    boxModal.open = false
    showSuccessToast(t('finance.owner.saved'))
    reload()
  } catch (e) { boxModal.error = treasuryError(t, e) } finally { boxModal.saving = false }
}

onMounted(reload)
</script>
