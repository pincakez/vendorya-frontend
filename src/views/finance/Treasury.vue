<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('finance.treasury.title') }}</h1>
        <p class="page-sub">{{ t('finance.treasury.sub') }}</p>
      </div>
      <div v-if="!isOff" class="header-right tr-actions">
        <BaseButton v-if="auth.hasRole('OWNER')" variant="secondary" @click="openNewBox">
          <Plus :size="14" /> {{ t('finance.treasury.new_box') }}
        </BaseButton>
        <BaseButton v-if="auth.hasRole('ADMIN')" variant="secondary" :disabled="activeBoxes.length < 2" @click="openTransfer">
          <ArrowRightLeft :size="14" /> {{ t('finance.treasury.transfer') }}
        </BaseButton>
        <BaseButton variant="secondary" :disabled="!incomeBoxOptions.length" @click="openIncome">
          <HandCoins :size="14" /> {{ t('finance.treasury.other_income') }}
        </BaseButton>
        <BaseButton variant="primary" :disabled="!activeBoxes.length" @click="openCount()">
          <ClipboardCheck :size="14" /> {{ t('finance.treasury.count_box') }}
        </BaseButton>
      </div>
    </div>

    <!-- Switch is off for this shop (deep link / stale menu) -->
    <div v-if="isOff" class="tr-off">
      <Vault :size="34" class="tr-off-icon" />
      <div class="tr-off-title">{{ t('finance.treasury.off_title') }}</div>
      <div class="tr-off-text">{{ t('finance.treasury.off_text') }}</div>
      <router-link v-if="auth.hasRole('OWNER')" to="/settings/capabilities" class="tr-link">{{ t('finance.treasury.off_link') }}</router-link>
    </div>

    <template v-else>
      <div class="tab-bar">
        <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ active: activeTab === tab.id }" @click="setTab(tab.id)">
          <component :is="tab.icon" :size="15" />
          {{ t('finance.treasury.tabs.' + tab.id) }}
        </button>
      </div>

      <!-- ══ TAB: Boxes ══ -->
      <div v-if="activeTab === 'boxes'">
        <div class="tr-toolbar">
          <div class="tr-total">
            <span class="tr-total-label">{{ t('finance.treasury.total_all') }}</span>
            <span class="tr-total-value"><Money :value="totalBalance" /></span>
          </div>
          <label class="check-row">
            <input v-model="showClosed" type="checkbox" class="check-input" />
            <span class="check-label">{{ t('finance.treasury.show_closed', { n: closedCount }) }}</span>
          </label>
        </div>

        <div v-if="loading" class="tr-grid"><div v-for="i in 4" :key="i" class="tr-skel" /></div>
        <div v-else-if="loadError" class="tr-empty tr-error">{{ loadError }}</div>
        <template v-else>
          <section v-for="g in groups" :key="g.id" class="tr-group">
            <h2 class="tr-group-title">{{ t('finance.treasury.groups.' + g.id) }} <span class="count-badge">{{ g.boxes.length }}</span></h2>
            <div v-if="!g.boxes.length" class="tr-empty">{{ t('finance.treasury.groups_empty.' + g.id) }}</div>
            <div v-else class="tr-grid">
              <router-link v-for="b in g.boxes" :key="b.id" :to="`/finance/treasury/${b.id}`" class="tr-box-link">
                <BaseCard padding="md" :class="['tr-box', { 'tr-box--closed': !b.is_active, 'tr-box--unsorted': b.system_role === 'UNSORTED' }]">
                  <div class="tr-box-head">
                    <div class="tr-box-icon"><component :is="kindIcon(b.kind)" :size="18" /></div>
                    <div class="tr-box-names">
                      <div class="tr-box-name">{{ boxName(t, b) }}</div>
                      <div class="tr-box-meta">
                        {{ kindLabel(t, b.kind) }}<template v-if="b.branch_name"> · {{ b.branch_name }}</template>
                      </div>
                    </div>
                    <button v-if="auth.hasRole('OWNER') && b.system_role !== 'UNSORTED'" class="row-action"
                            :title="t('common.edit')" @click.prevent.stop="openEditBox(b)">
                      <Pencil :size="13" />
                    </button>
                  </div>
                  <div class="tr-box-balance" :class="{ 'tr-neg': Number(b.balance) < 0 }"><Money :value="b.balance" /></div>
                  <div class="tr-box-tags">
                    <span v-if="b.is_default_drawer" class="tr-tag">{{ t('finance.treasury.default_drawer') }}</span>
                    <span v-if="!b.is_active" class="tr-tag tr-tag--muted">{{ t('finance.treasury.closed') }}</span>
                  </div>
                  <div v-if="b.system_role === 'UNSORTED'" class="tr-hint">{{ t('finance.treasury.unsorted_hint') }}</div>
                  <div v-else-if="b.note" class="tr-note" :title="b.note">{{ b.note }}</div>
                </BaseCard>
              </router-link>
            </div>
          </section>
        </template>
      </div>

      <!-- ══ TAB: Other income ══ -->
      <div v-if="activeTab === 'income'">
        <div class="table-wrap">
          <div v-if="incLoading" class="table-skeleton"><div v-for="i in 5" :key="i" class="skeleton-row" /></div>
          <div v-else class="dt-xscroll">
            <table class="dt">
              <thead>
                <tr>
                  <th class="dt-th">{{ t('common.date') }}</th>
                  <th class="dt-th">{{ t('finance.treasury.f.box') }}</th>
                  <th class="dt-th">{{ t('finance.treasury.f.category') }}</th>
                  <th class="dt-th">{{ t('common.description') }}</th>
                  <th class="dt-th ta-right">{{ t('finance.treasury.f.amount') }}</th>
                  <th class="dt-th" style="width:60px;"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!incomes.length"><td colspan="6" class="dt-empty">{{ t('finance.treasury.income_empty') }}</td></tr>
                <tr v-for="i in incomesPage" :key="i.id" class="dt-row">
                  <td class="text-muted">{{ fmtDay(i.date) }}</td>
                  <td>{{ i.box_name || boxName(t, boxById[i.box]) }}</td>
                  <td>{{ i.category_name || catName(i.category) }}</td>
                  <td class="text-muted">{{ i.description || '—' }}</td>
                  <td class="ta-right tr-in"><Money :value="i.amount" /></td>
                  <td class="ta-right">
                    <button v-if="auth.hasRole('ADMIN')" class="row-action danger" :title="t('common.delete')" @click="deleteIncome(i)">
                      <Trash2 :size="13" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <AppPagination v-if="incomes.length > incPageSize" :page="incPage" :page-size="incPageSize" :total="incomes.length" @update:page="p => (incPage = p)" />
      </div>

      <!-- ══ TAB: Reports (Wave 3) ══ -->
      <MoneyReports v-if="activeTab === 'reports'" scope="shop" />

      <!-- ══ TAB: Income categories ══ -->
      <div v-if="activeTab === 'categories'">
        <div class="tr-cat-head">
          <p class="tr-cat-sub">{{ t('finance.treasury.cat_sub') }}</p>
          <BaseButton size="sm" @click="openCat()"><Plus :size="13" /> {{ t('finance.treasury.cat_new') }}</BaseButton>
        </div>
        <div class="table-wrap">
          <table class="dt">
            <thead><tr><th class="dt-th">{{ t('common.name') }}</th><th class="dt-th" style="width:90px;"></th></tr></thead>
            <tbody>
              <tr v-if="!categories.length"><td colspan="2" class="dt-empty">{{ t('finance.treasury.cat_empty') }}</td></tr>
              <tr v-for="c in categories" :key="c.id" class="dt-row">
                <td class="col-name">{{ c.name }}</td>
                <td class="ta-right">
                  <button class="row-action" :title="t('common.edit')" @click="openCat(c)"><Pencil :size="13" /></button>
                  <button v-if="auth.hasRole('ADMIN')" class="row-action danger" :title="t('common.delete')" @click="deleteCat(c)"><Trash2 :size="13" /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <!-- ══ MODAL: New box (OWNER) ══ -->
    <AppModal :open="boxModal.open" :title="boxModal.id ? t('finance.treasury.edit_box') : t('finance.treasury.new_box')" width="520px" @close="boxModal.open = false">
      <div class="tr-form">
        <BaseInput v-model="boxModal.name" :label="t('finance.treasury.f.name')" :placeholder="t('finance.treasury.f.name_ph')" />
        <template v-if="!boxModal.id">
          <BaseSelect v-model="boxModal.kind" :options="kindOptions" :label="t('finance.treasury.f.kind')" />
          <BaseSelect v-if="boxModal.kind === 'DRAWER' || branchOptions.length > 1" v-model="boxModal.branch"
                      :options="boxBranchOptions" :label="t('finance.treasury.f.branch')"
                      :placeholder="boxModal.kind === 'DRAWER' ? t('finance.treasury.f.branch_pick') : ''" />
          <BaseInput v-model="boxModal.opening" type="number" step="0.01" :label="t('finance.treasury.f.opening')" placeholder="0.00" />
          <p class="tr-help">{{ t('finance.treasury.f.opening_hint') }}</p>
        </template>
        <div>
          <label class="form-label">{{ t('finance.treasury.f.note') }} <span class="text-muted">({{ t('common.optional') }})</span></label>
          <textarea v-model="boxModal.note" class="form-input" rows="2" />
        </div>
        <label v-if="boxModal.id" class="check-row">
          <input v-model="boxModal.closeIt" type="checkbox" class="check-input" />
          <span class="check-label">{{ t('finance.treasury.f.close_box') }}</span>
        </label>
        <p v-if="boxModal.id && boxModal.closeIt" class="tr-help">{{ t('finance.treasury.f.close_hint') }}</p>
        <p v-if="boxModal.error" class="tr-err">{{ boxModal.error }}</p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="boxModal.open = false">{{ t('common.cancel') }}</BaseButton>
        <BaseButton :loading="boxModal.saving" :disabled="!canSaveBox" @click="saveBox">{{ t('common.save') }}</BaseButton>
      </template>
    </AppModal>

    <!-- ══ MODAL: Transfer (ADMIN) ══ -->
    <AppModal :open="trModal.open" :title="t('finance.treasury.transfer')" width="480px" @close="trModal.open = false">
      <div class="tr-form">
        <BaseSelect v-model="trModal.from_box" :options="allBoxOptions" :label="t('finance.treasury.f.from')" :placeholder="t('finance.treasury.f.pick_box')" />
        <p v-if="trModal.from_box" class="tr-help">{{ t('finance.treasury.in_box_now') }}: <Money :value="boxById[trModal.from_box]?.balance || 0" /></p>
        <BaseSelect v-model="trModal.to_box" :options="allBoxOptions.filter(o => o.value !== trModal.from_box)" :label="t('finance.treasury.f.to')" :placeholder="t('finance.treasury.f.pick_box')" />
        <BaseInput v-model="trModal.amount" type="number" min="0" step="0.01" :label="t('finance.treasury.f.amount')" placeholder="0.00" />
        <BaseInput v-model="trModal.note" :label="t('finance.treasury.f.note')" :placeholder="t('finance.treasury.f.note_ph')" />
        <p v-if="trModal.error" class="tr-err">{{ trModal.error }}</p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="trModal.open = false">{{ t('common.cancel') }}</BaseButton>
        <BaseButton :loading="trModal.saving" :disabled="!trModal.from_box || !trModal.to_box || !(Number(trModal.amount) > 0)" @click="saveTransfer">{{ t('finance.treasury.transfer_btn') }}</BaseButton>
      </template>
    </AppModal>

    <!-- ══ MODAL: Other income (MANAGER) ══ -->
    <AppModal :open="incModal.open" :title="t('finance.treasury.other_income')" width="480px" @close="incModal.open = false">
      <div class="tr-form">
        <BaseSelect v-model="incModal.box" :options="incomeBoxOptions" :label="t('finance.treasury.f.into_box')" :placeholder="t('finance.treasury.f.pick_box')" />
        <BaseInput v-model="incModal.amount" type="number" min="0" step="0.01" :label="t('finance.treasury.f.amount')" placeholder="0.00" />
        <BaseInput v-model="incModal.date" type="date" :label="t('common.date')" />
        <BaseSelect v-model="incModal.category" :options="catOptions" :label="t('finance.treasury.f.category')"
                    :placeholder="catOptions.length ? t('finance.treasury.f.pick_category') : t('finance.treasury.f.no_categories')" />
        <div>
          <label class="form-label">{{ t('common.description') }}</label>
          <textarea v-model="incModal.description" class="form-input" rows="2" :placeholder="t('finance.treasury.f.income_desc_ph')" />
        </div>
        <p v-if="incModal.error" class="tr-err">{{ incModal.error }}</p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="incModal.open = false">{{ t('common.cancel') }}</BaseButton>
        <BaseButton :loading="incModal.saving" :disabled="!incModal.box || !(Number(incModal.amount) > 0)" @click="saveIncome">{{ t('common.save') }}</BaseButton>
      </template>
    </AppModal>

    <!-- ══ MODAL: Count a box (MANAGER) ══ -->
    <AppModal :open="cntModal.open" :title="t('finance.treasury.count_box')" width="480px" @close="cntModal.open = false">
      <div class="tr-form">
        <BaseSelect v-model="cntModal.box" :options="allBoxOptions" :label="t('finance.treasury.f.box')" :placeholder="t('finance.treasury.f.pick_box')" />
        <div v-if="cntBox" class="tr-summary">
          <div class="tr-summary-row"><span>{{ t('finance.treasury.in_book') }}</span><span><Money :value="cntBox.balance" /></span></div>
        </div>
        <BaseInput v-model="cntModal.counted" type="number" step="0.01" :label="t('finance.treasury.f.counted')" placeholder="0.00" />
        <div v-if="cntBox && cntModal.counted !== ''" class="tr-diff" :class="diffClass(cntDiff)">
          {{ t('finance.treasury.difference') }}: {{ cntDiff > 0 ? '+' : '' }}<Money :value="cntDiff" />
        </div>
        <div v-if="cntDiffers">
          <label class="form-label">{{ t('finance.treasury.f.reason') }}</label>
          <textarea v-model="cntModal.reason" class="form-input" rows="2" :placeholder="t('finance.treasury.f.reason_ph')" />
        </div>
        <p v-if="cntModal.error" class="tr-err">{{ cntModal.error }}</p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="cntModal.open = false">{{ t('common.cancel') }}</BaseButton>
        <BaseButton :loading="cntModal.saving" :disabled="!cntModal.box || cntModal.counted === '' || (cntDiffers && !cntModal.reason.trim())" @click="saveCount">{{ t('finance.treasury.save_count') }}</BaseButton>
      </template>
    </AppModal>

    <!-- ══ MODAL: Income category ══ -->
    <AppModal :open="catModal.open" :title="catModal.id ? t('finance.treasury.cat_rename') : t('finance.treasury.cat_new')" width="420px" @close="catModal.open = false">
      <div class="tr-form">
        <BaseInput v-model="catModal.name" :label="t('common.name')" :placeholder="t('finance.treasury.cat_name_ph')" />
        <p v-if="catModal.error" class="tr-err">{{ catModal.error }}</p>
      </div>
      <template #footer>
        <BaseButton variant="ghost" @click="catModal.open = false">{{ t('common.cancel') }}</BaseButton>
        <BaseButton :loading="catModal.saving" :disabled="!catModal.name.trim()" @click="saveCat">{{ t('common.save') }}</BaseButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  Plus, Pencil, Trash2, ArrowRightLeft, HandCoins, ClipboardCheck, Vault, Wallet, Landmark, Smartphone,
  PiggyBank, Lock, Banknote, Inbox, Tags, Coins,
  FileBarChart,
} from 'lucide-vue-next'
import MoneyReports from './owner/MoneyReports.vue'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import { useFormatStore } from '@/stores/format'
import AppModal from '@/components/ui/AppModal.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import { showSuccessToast, showErrorToast } from '@/utils/toast'
import { formatDate } from '@/utils/date'
import { BOX_KINDS, boxName, kindLabel, boxOptionLabel, treasuryError } from '@/utils/treasury'

const { t } = useI18n()
const auth = useAuthStore()
const fmt = useFormatStore()

const tabs = [
  { id: 'boxes',      icon: Vault },
  { id: 'income',     icon: Coins },
  { id: 'categories', icon: Tags },
  { id: 'reports',    icon: FileBarChart },   // s172 Wave 3
]
const activeTab = ref('boxes')
function setTab(id) {
  activeTab.value = id
  if (id === 'income') fetchIncomes(1)
}

// ── Boxes ────────────────────────────────────────────────────────────────
const boxes = ref([])
const loading = ref(false)
const loadError = ref('')
const isOff = ref(false)
const showClosed = ref(false)

async function fetchBoxes() {
  loading.value = true
  loadError.value = ''
  try {
    const r = await api.get('/api/treasury/boxes/')
    boxes.value = r.data?.results ?? r.data ?? []
    isOff.value = false
  } catch (e) {
    if (e?.response?.data?.code === 'treasury_off') { isOff.value = true; fmt.apply({ treasury_enabled: false }) }
    else loadError.value = treasuryError(t, e, t('finance.treasury.err.load'))
    boxes.value = []
  } finally { loading.value = false }
}

const boxById = computed(() => Object.fromEntries(boxes.value.map(b => [b.id, b])))
const activeBoxes = computed(() => boxes.value.filter(b => b.is_active))
const closedCount = computed(() => boxes.value.length - activeBoxes.value.length)
const visibleBoxes = computed(() => showClosed.value ? boxes.value : activeBoxes.value)
const totalBalance = computed(() => activeBoxes.value.reduce((s, b) => s + Number(b.balance || 0), 0))

// Drawers first (by branch), then every other box; the "not sorted yet" box last in its group.
const groups = computed(() => {
  const byName = (a, b) => (a.branch_name || '').localeCompare(b.branch_name || '') || boxName(t, a).localeCompare(boxName(t, b))
  const drawers = visibleBoxes.value.filter(b => b.kind === 'DRAWER').sort(byName)
  const others = visibleBoxes.value.filter(b => b.kind !== 'DRAWER')
    .sort((a, b) => (a.system_role === 'UNSORTED') - (b.system_role === 'UNSORTED') || byName(a, b))
  return [{ id: 'drawers', boxes: drawers }, { id: 'others', boxes: others }]
})

const KIND_ICONS = { DRAWER: Inbox, CASH: Banknote, BANK: Landmark, WALLET: Smartphone, RESERVED: Lock, SAVINGS: PiggyBank }
function kindIcon(kind) { return KIND_ICONS[kind] || Wallet }

const allBoxOptions = computed(() => activeBoxes.value.map(b => ({ value: b.id, label: boxOptionLabel(t, b) })))
// Other income never lands in the "not sorted yet" box — that one is only for unrouted payment methods.
const incomeBoxOptions = computed(() => activeBoxes.value.filter(b => b.system_role !== 'UNSORTED')
  .map(b => ({ value: b.id, label: boxOptionLabel(t, b) })))
const kindOptions = computed(() => BOX_KINDS.map(k => ({ value: k, label: kindLabel(t, k) })))

function diffClass(n) { return n > 0 ? 'diff-over' : n < 0 ? 'diff-short' : '' }
function localISO(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
function fmtDay(d) { return d ? formatDate(String(d).length === 10 ? d + 'T12:00:00Z' : d) : '—' }

// ── Branches (for drawers) ───────────────────────────────────────────────
const branches = ref([])
const branchOptions = computed(() => branches.value.map(b => ({ value: b.id, label: b.name })))
const boxBranchOptions = computed(() => boxModal.kind === 'DRAWER'
  ? branchOptions.value
  : [{ value: '', label: t('finance.treasury.f.whole_shop') }, ...branchOptions.value])
async function fetchBranches() {
  if (branches.value.length) return
  try {
    const r = await api.get('/api/core/branches/')
    branches.value = r.data?.results ?? r.data ?? []
  } catch { branches.value = [] }
}

// ── New / edit box (OWNER) ───────────────────────────────────────────────
const boxModal = reactive({ open: false, id: null, name: '', kind: 'CASH', branch: '', opening: '', note: '', closeIt: false, saving: false, error: '' })
const canSaveBox = computed(() => !!boxModal.name.trim() && (boxModal.id || boxModal.kind !== 'DRAWER' || !!boxModal.branch))

async function openNewBox() {
  await fetchBranches()
  Object.assign(boxModal, { open: true, id: null, name: '', kind: 'CASH', branch: '', opening: '', note: '', closeIt: false, saving: false, error: '' })
}
function openEditBox(b) {
  Object.assign(boxModal, { open: true, id: b.id, name: b.name || '', kind: b.kind, branch: b.branch || '', opening: '', note: b.note || '', closeIt: !b.is_active, saving: false, error: '' })
}
async function saveBox() {
  boxModal.saving = true
  boxModal.error = ''
  try {
    if (boxModal.id) {
      await api.patch(`/api/treasury/boxes/${boxModal.id}/`, { name: boxModal.name.trim(), note: boxModal.note || '', is_active: !boxModal.closeIt })
    } else {
      const body = { name: boxModal.name.trim(), kind: boxModal.kind, note: boxModal.note || '' }
      if (boxModal.branch) body.branch = boxModal.branch
      if (boxModal.opening !== '' && Number(boxModal.opening) !== 0) body.opening = boxModal.opening
      await api.post('/api/treasury/boxes/', body)
    }
    boxModal.open = false
    showSuccessToast(t('finance.treasury.saved'))
    fetchBoxes()
  } catch (e) {
    boxModal.error = treasuryError(t, e)
  } finally { boxModal.saving = false }
}

// ── Transfer (ADMIN) ─────────────────────────────────────────────────────
const trModal = reactive({ open: false, from_box: '', to_box: '', amount: '', note: '', saving: false, error: '' })
function openTransfer() { Object.assign(trModal, { open: true, from_box: '', to_box: '', amount: '', note: '', saving: false, error: '' }) }
async function saveTransfer() {
  trModal.error = ''
  if (trModal.from_box === trModal.to_box) { trModal.error = t('finance.treasury.err.same_box'); return }
  trModal.saving = true
  try {
    await api.post('/api/treasury/transfers/', { from_box: trModal.from_box, to_box: trModal.to_box, amount: trModal.amount, note: trModal.note || '' })
    trModal.open = false
    showSuccessToast(t('finance.treasury.transfer_done'))
    fetchBoxes()
  } catch (e) {
    trModal.error = treasuryError(t, e)
  } finally { trModal.saving = false }
}

// ── Other income (MANAGER) ───────────────────────────────────────────────
const incModal = reactive({ open: false, box: '', amount: '', date: '', category: '', description: '', saving: false, error: '' })
function openIncome() {
  if (!categories.value.length) fetchCategories()
  Object.assign(incModal, { open: true, box: '', amount: '', date: localISO(), category: '', description: '', saving: false, error: '' })
}
async function saveIncome() {
  incModal.saving = true
  incModal.error = ''
  try {
    await api.post('/api/treasury/other-income/', {
      box: incModal.box, amount: incModal.amount, date: incModal.date,
      category: incModal.category || null, description: incModal.description || '',
    })
    incModal.open = false
    showSuccessToast(t('finance.treasury.income_saved'))
    fetchBoxes()
    if (activeTab.value === 'income') fetchIncomes(1)
  } catch (e) {
    incModal.error = treasuryError(t, e)
  } finally { incModal.saving = false }
}

const incomes = ref([])
const incLoading = ref(false)
const incPage = ref(1)
const incPageSize = 25
// The server answers ONE plain list (no paging) → page it here.
const incomesPage = computed(() => incomes.value.slice((incPage.value - 1) * incPageSize, incPage.value * incPageSize))
async function fetchIncomes(p = 1) {
  incPage.value = p
  incLoading.value = true
  if (!categories.value.length) fetchCategories()
  try {
    const r = await api.get('/api/treasury/other-income/')
    incomes.value = r.data?.results ?? r.data ?? []
    const last = Math.max(1, Math.ceil(incomes.value.length / incPageSize))
    if (incPage.value > last) incPage.value = last
  } catch (e) {
    incomes.value = []
    showErrorToast(treasuryError(t, e, t('finance.treasury.err.load')))
  } finally { incLoading.value = false }
}
async function deleteIncome(i) {
  if (!confirm(t('finance.treasury.income_delete_confirm'))) return
  try {
    await api.delete(`/api/treasury/other-income/${i.id}/`)
    showSuccessToast(t('finance.treasury.income_deleted'))
    fetchIncomes(incPage.value)
    fetchBoxes()
  } catch (e) { showErrorToast(treasuryError(t, e), 3500) }
}

// ── Income categories ────────────────────────────────────────────────────
const categories = ref([])
const catOptions = computed(() => categories.value.map(c => ({ value: c.id, label: c.name })))
function catName(id) { return categories.value.find(c => c.id === id)?.name || '—' }
async function fetchCategories() {
  try {
    const r = await api.get('/api/treasury/income-categories/')
    categories.value = r.data?.results ?? r.data ?? []
  } catch { categories.value = [] }
}
const catModal = reactive({ open: false, id: null, name: '', saving: false, error: '' })
function openCat(c) { Object.assign(catModal, { open: true, id: c?.id || null, name: c?.name || '', saving: false, error: '' }) }
async function saveCat() {
  catModal.saving = true
  catModal.error = ''
  try {
    const body = { name: catModal.name.trim() }
    catModal.id
      ? await api.patch(`/api/treasury/income-categories/${catModal.id}/`, body)
      : await api.post('/api/treasury/income-categories/', body)
    catModal.open = false
    fetchCategories()
  } catch (e) { catModal.error = treasuryError(t, e) } finally { catModal.saving = false }
}
async function deleteCat(c) {
  if (!confirm(t('finance.treasury.cat_delete_confirm', { name: c.name }))) return
  try {
    await api.delete(`/api/treasury/income-categories/${c.id}/`)
    fetchCategories()
  } catch (e) { showErrorToast(treasuryError(t, e), 3500) }
}

// ── Count a box (MANAGER) ────────────────────────────────────────────────
const cntModal = reactive({ open: false, box: '', counted: '', reason: '', saving: false, error: '' })
const cntBox = computed(() => boxById.value[cntModal.box] || null)
const cntDiff = computed(() => cntBox.value && cntModal.counted !== ''
  ? Math.round((Number(cntModal.counted) - Number(cntBox.value.balance || 0)) * 100) / 100 : 0)
const cntDiffers = computed(() => !!cntBox.value && cntModal.counted !== '' && cntDiff.value !== 0)
function openCount(boxId = '') {
  Object.assign(cntModal, { open: true, box: boxId, counted: '', reason: '', saving: false, error: '' })
}
async function saveCount() {
  cntModal.saving = true
  cntModal.error = ''
  try {
    const body = { counted: cntModal.counted }
    if (cntDiffers.value) body.reason = cntModal.reason.trim()
    const r = await api.post(`/api/treasury/boxes/${cntModal.box}/count/`, body)
    cntModal.open = false
    const diff = Number(r.data?.difference ?? cntDiff.value)
    showSuccessToast(diff === 0 ? t('finance.treasury.count_matches') : t('finance.treasury.count_saved'))
    fetchBoxes()
  } catch (e) { cntModal.error = treasuryError(t, e) } finally { cntModal.saving = false }
}

onMounted(() => { fetchBoxes(); fetchCategories() })
</script>

<style scoped>
.tr-actions { display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; }

.tab-bar { display:flex; gap:2px; border-bottom:1px solid var(--border); margin-bottom:20px; }
.tab-btn { display:flex; align-items:center; gap:6px; padding:9px 16px; font-size:13.5px; font-weight:500; color:var(--text-muted); border:none; background:none; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; transition:color 120ms,border-color 120ms; }
.tab-btn:hover  { color:var(--text-primary); }
.tab-btn.active { color:var(--accent); border-bottom-color:var(--accent); font-weight:600; }

.tr-toolbar { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:16px; }
.tr-total { display:flex; align-items:baseline; gap:10px; }
.tr-total-label { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); }
.tr-total-value { font-size:20px; font-weight:800; color:var(--text-primary); font-variant-numeric:tabular-nums; }

.check-row   { display:flex; align-items:center; gap:8px; cursor:pointer; }
.check-input { width:16px; height:16px; accent-color:var(--accent); cursor:pointer; flex-shrink:0; }
.check-label { font-size:13px; font-weight:600; color:var(--text-secondary); }

.tr-group { margin-bottom:22px; }
.tr-group-title { display:flex; align-items:center; gap:8px; font-size:14px; font-weight:700; color:var(--text-primary); margin:0 0 10px; }
.count-badge { padding:2px 8px; border-radius:20px; background:var(--border); font-size:12px; font-weight:600; color:var(--text-muted); }
.tr-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:12px; }
.tr-skel { height:130px; border-radius:12px; background:var(--border); animation:pulse 1.4s ease-in-out infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }

.tr-box-link { text-decoration:none; color:inherit; display:block; }
.tr-box { height:100%; display:flex; flex-direction:column; gap:10px; transition:border-color 120ms, transform 80ms; border:1px solid var(--border); }
.tr-box-link:hover .tr-box { border-color:var(--accent); }
.tr-box--closed { opacity:.55; }
.tr-box--unsorted { border-style:dashed; border-color:var(--warning); }
.tr-box-head { display:flex; align-items:flex-start; gap:10px; }
.tr-box-icon { width:36px; height:36px; border-radius:9px; display:flex; align-items:center; justify-content:center; background:var(--accent-soft); color:var(--accent); flex-shrink:0; }
.tr-box--unsorted .tr-box-icon { background:var(--warning-soft); color:var(--warning); }
.tr-box-names { flex:1; min-width:0; }
.tr-box-name { font-size:14px; font-weight:700; color:var(--text-primary); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.tr-box-meta { font-size:12px; color:var(--text-muted); margin-top:2px; }
.tr-box-balance { font-size:22px; font-weight:800; color:var(--text-primary); font-variant-numeric:tabular-nums; }
.tr-neg { color:var(--danger); }
.tr-box-tags { display:flex; gap:6px; flex-wrap:wrap; min-height:0; }
.tr-tag { font-size:11px; font-weight:600; padding:2px 8px; border-radius:999px; background:var(--info-soft); color:var(--info); }
.tr-tag--muted { background:var(--border); color:var(--text-muted); }
.tr-hint { font-size:12px; line-height:1.45; color:var(--warning-hover); background:var(--warning-soft); border-radius:8px; padding:8px 10px; }
.tr-note { font-size:12px; color:var(--text-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }

.tr-empty { padding:24px; text-align:center; color:var(--text-muted); font-size:13px; background:var(--bg-card); border:1px dashed var(--border); border-radius:12px; }
.tr-error { color:var(--danger); }

.tr-off { display:flex; flex-direction:column; align-items:center; gap:8px; text-align:center; padding:56px 20px; background:var(--bg-card); border:1px solid var(--border); border-radius:12px; }
.tr-off-icon { color:var(--text-muted); opacity:.6; }
.tr-off-title { font-size:16px; font-weight:700; color:var(--text-primary); }
.tr-off-text { font-size:13px; color:var(--text-muted); max-width:460px; line-height:1.5; }
.tr-link { color:var(--accent); font-weight:600; font-size:13px; text-decoration:none; }
.tr-link:hover { text-decoration:underline; }

.table-wrap { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.table-skeleton { padding:8px 0; }
.skeleton-row { height:38px; margin:4px 16px; border-radius:6px; background:linear-gradient(90deg,var(--border) 25%,var(--bg-app) 50%,var(--border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position:-200% 0; } }
.text-muted { color:var(--text-muted); font-size:12px; }
.col-name { font-weight:500; }
.tr-in { color:var(--success); font-weight:600; }
.row-action { width:28px; height:28px; border:none; background:none; border-radius:6px; cursor:pointer; color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; transition:background 100ms,color 100ms; flex-shrink:0; }
.row-action:hover        { background:var(--border); color:var(--text-primary); }
.row-action.danger:hover { background:var(--danger-soft); color:var(--danger); }

.tr-cat-head { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; flex-wrap:wrap; }
.tr-cat-sub { font-size:13px; color:var(--text-muted); margin:0; }

.tr-form { display:flex; flex-direction:column; gap:14px; }
.tr-help { font-size:12px; color:var(--text-muted); margin:-6px 0 0; line-height:1.45; }
.tr-err { font-size:13px; color:var(--danger); background:var(--danger-soft); border-radius:8px; padding:8px 12px; margin:0; }
.tr-summary { background:var(--bg-app); border:1px solid var(--border); border-radius:8px; padding:12px 14px; display:flex; flex-direction:column; gap:8px; }
.tr-summary-row { display:flex; justify-content:space-between; font-size:13px; color:var(--text-secondary); }
.tr-summary-row span:last-child { font-variant-numeric:tabular-nums; font-weight:700; color:var(--text-primary); }
.tr-diff { padding:10px 14px; border-radius:8px; font-size:13px; font-weight:600; text-align:center; background:var(--bg-app); color:var(--text-secondary); }
.tr-diff.diff-over  { background:var(--success-soft); color:var(--success); }
.tr-diff.diff-short { background:var(--danger-soft); color:var(--danger); }
</style>
