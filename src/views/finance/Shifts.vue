<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('finance.shifts.title') }}</h1>
        <p class="page-sub">{{ t('finance.shifts.sub') }}</p>
      </div>
      <div v-if="!openShift" class="header-right">
        <button class="btn-primary" @click="startOpen"><Plus :size="14" /> {{ t('finance.shifts.open_modal.open_btn') }}</button>
      </div>
    </div>

    <!-- Open shift banner -->
    <div v-if="openShift" class="shift-banner open">
      <div class="banner-left">
        <div class="banner-dot open-dot" />
        <div>
          <div class="banner-title">{{ t('finance.shifts.banner_open') }}</div>
          <div class="banner-sub">{{ t('finance.shifts.banner_started', { time: fmtDateTime(openShift.start_time) }) }}<template v-if="openShift.drawer_name"> · {{ t('finance.treasury.drawer') }}: {{ openShift.drawer_name }}</template> · {{ t('finance.shifts.starting_cash') }}: <Money :value="openShift.starting_cash" /></div>
        </div>
      </div>
      <button class="btn-danger" @click="openCloseModal">{{ t('finance.shifts.close_shift') }}</button>
    </div>

    <div class="tab-bar">
      <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
        <component :is="tab.icon" :size="15" />
        {{ t('finance.shifts.tab_' + tab.id) }}
      </button>
    </div>

    <!-- TAB: History -->
    <div v-if="activeTab === 'history'">
      <div class="table-wrap">
        <div v-if="loading" class="table-skeleton">
          <div v-for="i in 6" :key="i" class="skeleton-row" />
        </div>
        <table v-else class="data-table">
          <thead>
            <tr><th>{{ t('common.date') }}</th><th>{{ t('common.status') }}</th><th>{{ t('finance.shifts.col_starting') }}</th><th>{{ t('finance.shifts.col_expected') }}</th><th>{{ t('finance.shifts.col_counted') }}</th><th>{{ t('finance.shifts.col_difference') }}</th></tr>
          </thead>
          <tbody>
            <tr v-if="shifts.length === 0">
              <td colspan="6" class="table-empty">
                <Clock :size="32" style="opacity:.3;margin-bottom:8px;" />
                <div>{{ t('finance.shifts.empty') }}</div>
              </td>
            </tr>
            <tr v-for="s in shifts" :key="s.id" class="table-row" style="cursor:pointer" @click="router.push('/finance/shifts/' + s.id)">
              <td>{{ fmtDateTime(s.start_time) }}</td>
              <td><span class="status-badge" :class="`status-${s.status.toLowerCase()}`">{{ statusLabel(s.status) }}</span></td>
              <td class="col-amount"><Money :value="s.starting_cash" /></td>
              <td class="col-amount"><Money :value="s.expected_cash" /></td>
              <td class="col-amount"><Money :value="s.closing_cash" /></td>
              <td :class="diffClass(s.difference)">
                {{ Number(s.difference) >= 0 ? '+' : '' }}<Money :value="s.difference" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <AppPagination :page="page" :page-size="pageSize" :total="total" @update:page="fetchShifts" />
    </div>

    <!-- MODAL: Open Shift -->
    <AppModal :open="openModal" :title="t('finance.shifts.open_modal.title')" @close="openModal = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">{{ t('finance.shifts.open_modal.branch_label') }}</label>
          <BaseSelect v-model="shiftBranch" :options="branchOptions" :disabled="branchOptions.length < 2" />
        </div>
        <!-- Treasury on (s169c): pick the drawer; its book balance carries over from the last shift -->
        <template v-if="treasuryOn">
          <div v-if="drawersLoading" class="skeleton-row" style="margin:0;" />
          <template v-else>
            <BaseSelect v-if="freeDrawerOptions.length" v-model="shiftDrawer" :options="freeDrawerOptions"
                        :label="t('finance.treasury.drawer')" :disabled="freeDrawerOptions.length < 2" />
            <p v-if="!freeDrawerOptions.length" class="shift-warn">{{ drawers.length ? t('finance.treasury.drawers_all_busy') : t('finance.treasury.drawers_none') }}</p>
            <p v-else-if="busyCount" class="shift-help">{{ t('finance.treasury.drawers_some_busy', { n: busyCount }) }}</p>
            <div v-if="pickedDrawer" class="shift-summary">
              <div class="summary-row"><span>{{ t('finance.treasury.in_book') }}</span><span><Money :value="pickedDrawer.book_balance" /></span></div>
            </div>
          </template>
        </template>
        <div>
          <label class="form-label">{{ treasuryOn ? t('finance.treasury.counted_open') : t('finance.shifts.open_modal.cash_label') }}</label>
          <input v-model="startingCash" type="number" min="0" step="0.01" class="form-input" placeholder="0.00" />
        </div>
        <template v-if="treasuryOn && pickedDrawer && startingCash !== ''">
          <div class="diff-preview" :class="diffClass(openDiff)">
            {{ t('finance.shifts.close_modal.difference') }}: {{ openDiff >= 0 ? '+' : '' }}<Money :value="openDiff" />
          </div>
          <div v-if="openDiff !== 0">
            <label class="form-label">{{ t('finance.treasury.f.reason') }}</label>
            <textarea v-model="openReason" class="form-input" rows="2" :placeholder="t('finance.treasury.f.reason_ph')" />
          </div>
        </template>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="openModal = false">{{ t('common.cancel') }}</button>
        <button class="btn-primary" :disabled="opening || !canOpenShift" @click="openShiftAction">{{ t('finance.shifts.open_modal.open_btn') }}</button>
      </template>
    </AppModal>

    <!-- MODAL: Close Shift -->
    <AppModal :open="closeModal" :title="t('finance.shifts.close_modal.title')" @close="closeModal = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="shift-summary">
          <div class="summary-row"><span>{{ t('finance.shifts.close_modal.starting_cash') }}</span><span><Money :value="openShift?.starting_cash" /></span></div>
          <div class="summary-row"><span>{{ isBoxShift ? t('finance.treasury.expected_book') : t('finance.shifts.close_modal.expected_cash') }}</span><span><Money :value="expectedCash" /></span></div>
        </div>
        <div>
          <label class="form-label">{{ t('finance.shifts.close_modal.counted_label') }}</label>
          <input v-model="countedCash" type="number" min="0" step="0.01" class="form-input" placeholder="0.00" />
        </div>
        <div v-if="countedCash !== ''" class="diff-preview" :class="diffClass(closeDiff)">
          {{ t('finance.shifts.close_modal.difference') }}: {{ closeDiff >= 0 ? '+' : '' }}<Money :value="closeDiff" />
        </div>
        <template v-if="isBoxShift">
          <div v-if="countedCash !== '' && closeDiff !== 0">
            <label class="form-label">{{ t('finance.treasury.f.reason') }}</label>
            <textarea v-model="closeReason" class="form-input" rows="2" :placeholder="t('finance.treasury.f.reason_ph')" />
          </div>
          <!-- Optional: move the takings out of the drawer (a transfer), leaving a float -->
          <label class="check-row">
            <input v-model="moveOn" type="checkbox" class="check-input" />
            <span class="check-label">{{ t('finance.treasury.move_takings') }}</span>
          </label>
          <template v-if="moveOn">
            <BaseSelect v-model="moveToBox" :options="moveBoxOptions" :label="t('finance.treasury.move_to')" :placeholder="t('finance.treasury.f.pick_box')" />
            <BaseInput v-model="moveAmount" type="number" min="0" step="0.01" :label="t('finance.treasury.move_amount')" placeholder="0.00" />
            <p v-if="countedCash !== '' && moveAmount !== ''" class="shift-help">{{ t('finance.treasury.float_left') }}: <Money :value="Number(countedCash) - Number(moveAmount || 0)" /></p>
          </template>
        </template>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="closeModal = false">{{ t('common.cancel') }}</button>
        <button class="btn-danger-solid" :disabled="closing || !canCloseShift" @click="closeShiftAction">{{ t('finance.shifts.close_modal.close_btn') }}</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { Clock, History, Plus } from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import BaseSelect from '@/components/base/BaseSelect.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import { showErrorToast } from '@/utils/toast'
import { useFormatStore } from '@/stores/format'
import { fetchBoxes, boxOptionLabel, treasuryError } from '@/utils/treasury'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { formatNumber } from '@/utils/format'

const { t } = useI18n()
const auth   = useAuthStore()
const router = useRouter()
const fmt    = useFormatStore()
// Treasury (s169c): with the switch on, a shift opens on a drawer box (its book balance carries over) and a count that
// differs from the book needs a reason. Off = exactly the old flow.
const treasuryOn = computed(() => fmt.treasuryEnabled)

const tabs = [
  { id: 'history', icon: History },
]

function statusLabel(s) {
  const key = String(s).toLowerCase()
  return (key === 'open' || key === 'closed') ? t('finance.shifts.status_' + key) : s
}
const activeTab   = ref('history')
const shifts      = ref([])
const openShift   = ref(null)
const loading     = ref(false)
const total       = ref(0)
const page        = ref(1)
const pageSize    = 20

const openModal   = ref(false)
const closeModal  = ref(false)
const startingCash = ref('')
const countedCash  = ref('')

async function fetchShifts(p = 1) {
  loading.value = true
  page.value = p
  try {
    const res = await api.get('/api/finance/shifts/', { params: { page: p, page_size: pageSize } })
    shifts.value = res.data.results ?? res.data
    total.value  = res.data.count ?? shifts.value.length
  } catch { shifts.value = [] } finally { loading.value = false }
}

// The banner is MY open shift (a manager sees everyone's in the history below, not here) — 2026-10-14.
async function fetchOpenShift() {
  try {
    const res = await api.get('/api/finance/shifts/', { params: { status: 'OPEN', page_size: 100 } })
    const results = res.data.results ?? res.data
    openShift.value = results.find(s => String(s.user) === String(auth.user?.id)) || null
  } catch { openShift.value = null }
}

// ── Close: expected = the drawer's book (Treasury on) or the old formula — one server answer for both ──
const expectedCash = ref(0)
const isBoxShift   = computed(() => openShift.value?.ledger ? openShift.value.ledger === 'BOX' : treasuryOn.value)
const closeDiff    = computed(() => countedCash.value === '' ? 0 : round2(Number(countedCash.value) - Number(expectedCash.value || 0)))
const closeReason  = ref('')
const moveOn       = ref(false)
const moveToBox    = ref('')
const moveAmount   = ref('')
const boxes        = ref([])
const moveBoxOptions = computed(() => boxes.value
  .filter(b => b.is_active && b.kind !== 'DRAWER' && b.system_role !== 'UNSORTED')
  .map(b => ({ value: b.id, label: boxOptionLabel(t, b) })))
const canCloseShift = computed(() => {
  if (!isBoxShift.value) return true
  if (countedCash.value !== '' && closeDiff.value !== 0 && !closeReason.value.trim()) return false
  if (moveOn.value) {
    const amt = Number(moveAmount.value)
    if (!moveToBox.value || !(amt > 0) || (countedCash.value !== '' && amt > Number(countedCash.value))) return false
  }
  return true
})
function round2(n) { return Math.round(n * 100) / 100 }

async function openCloseModal() {
  countedCash.value = ''; closeReason.value = ''; moveOn.value = false; moveToBox.value = ''; moveAmount.value = ''
  expectedCash.value = openShift.value?.expected_cash || 0
  closeModal.value = true
  try {
    const { data } = await api.get('/api/finance/shifts/drawer/')
    if (data?.shift && String(data.shift.id) === String(openShift.value?.id)) expectedCash.value = data.expected_balance
  } catch { /* keep the shift's own number */ }
  if (isBoxShift.value) boxes.value = await fetchBoxes()
}

// A shift belongs to a branch (its drawer). Before 2026-10-14 the page sent the SHOP's id as the branch (always
// refused, silently) — no shift could be opened from this page. Now: my default branch, else the first; a pick if several.
const branches      = ref([])
const shiftBranch   = ref('')
const branchOptions = computed(() => branches.value.map(b => ({ value: b.id, label: b.name })))

async function startOpen() {
  startingCash.value = ''
  if (!branches.value.length) {
    try {
      const r = await api.get('/api/core/branches/')
      branches.value = r.data.results ?? r.data
    } catch { branches.value = [] }
  }
  const mine = branches.value.find(b => b.id === auth.user?.default_branch)
  openReason.value = ''
  shiftBranch.value = (mine || branches.value[0])?.id || ''
  openModal.value = true
  if (treasuryOn.value) loadDrawers()
}

// ── Open (Treasury on): the branch's drawers → [{ id, name, book_balance, busy }] ──
const drawers        = ref([])
const drawersLoading = ref(false)
const shiftDrawer    = ref('')
const openReason     = ref('')
const freeDrawerOptions = computed(() => drawers.value.filter(d => !d.busy).map(d => ({ value: d.id, label: d.name })))
const busyCount    = computed(() => drawers.value.filter(d => d.busy).length)
const pickedDrawer = computed(() => drawers.value.find(d => d.id === shiftDrawer.value && !d.busy) || null)
const openDiff     = computed(() => pickedDrawer.value && startingCash.value !== ''
  ? round2(Number(startingCash.value) - Number(pickedDrawer.value.book_balance || 0)) : 0)
const canOpenShift = computed(() => {
  if (!treasuryOn.value) return true
  if (!pickedDrawer.value) return false
  return !(startingCash.value !== '' && openDiff.value !== 0 && !openReason.value.trim())
})
async function loadDrawers() {
  if (!shiftBranch.value) { drawers.value = []; return }
  drawersLoading.value = true
  try {
    const r = await api.get('/api/finance/shifts/drawers/', { params: { branch: shiftBranch.value } })
    drawers.value = r.data?.results ?? r.data ?? []
  } catch { drawers.value = [] } finally { drawersLoading.value = false }
  shiftDrawer.value = freeDrawerOptions.value[0]?.value || ''
}
watch(shiftBranch, () => { if (openModal.value && treasuryOn.value) loadDrawers() })

// Busy guard: a double-click sent two "open" requests (the server now refuses the 2nd too — 2026-10-14).
const opening = ref(false)
async function openShiftAction() {
  if (opening.value) return
  opening.value = true
  try {
    const body = { starting_cash: startingCash.value || 0, branch: shiftBranch.value }
    if (treasuryOn.value) {
      body.drawer = shiftDrawer.value
      if (openDiff.value !== 0 && openReason.value.trim()) body.count_reason = openReason.value.trim()
    }
    await api.post('/api/finance/shifts/', body)
  } catch (e) {
    const d = e?.response?.data
    showErrorToast(d?.code === 'shift_already_open' ? t('finance.shifts.err_already_open')
      : d?.code ? treasuryError(t, e, t('pos.payment.err_shift_open'))
      : (typeof d?.detail === 'string' ? d.detail : (Array.isArray(d) && d[0]) || t('pos.payment.err_shift_open')), 3500)
    if (treasuryOn.value) loadDrawers()
    await fetchOpenShift()
    return
  } finally {
    opening.value = false
  }
  openModal.value = false
  startingCash.value = ''
  await fetchOpenShift()
  fetchShifts(1)
}

const closing = ref(false)
async function closeShiftAction() {
  if (!openShift.value || closing.value) return
  closing.value = true
  const body = { counted_cash: countedCash.value || 0 }
  if (isBoxShift.value) {
    if (closeDiff.value !== 0 && closeReason.value.trim()) body.count_reason = closeReason.value.trim()
    if (moveOn.value && moveToBox.value && Number(moveAmount.value) > 0) {
      body.move_to_box = moveToBox.value
      body.move_amount = moveAmount.value
    }
  }
  try {
    await api.post(`/api/finance/shifts/${openShift.value.id}/close/`, body)
  } catch (e) {
    showErrorToast(treasuryError(t, e, t('finance.treasury.err.close_failed')), 3500)
    return
  } finally { closing.value = false }
  closeModal.value = false
  await fetchOpenShift()
  fetchShifts(1)
}

function diffClass(diff) {
  const n = Number(diff)
  return n > 0 ? 'diff-over' : n < 0 ? 'diff-short' : ''
}

function fmtDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString(undefined, { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
}

onMounted(async () => {
  await fetchOpenShift()
  fetchShifts()
})
</script>

<style scoped>

.shift-banner { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-radius:12px; margin-bottom:20px; border:1px solid; }
.shift-banner.open { background:var(--success-soft); border-color:#86efac; }
.banner-left  { display:flex; align-items:center; gap:12px; }
.banner-dot   { width:10px; height:10px; border-radius:50%; }
.open-dot     { background:var(--success); box-shadow:0 0 0 3px #bbf7d0; animation:pulse 2s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
.banner-title { font-weight:700; font-size:14px; color:var(--success-hover); }
.banner-sub   { font-size:12px; color:#166534; margin-top:2px; }

.tab-bar { display:flex; gap:2px; border-bottom:1px solid var(--border); margin-bottom:20px; }
.tab-btn { display:flex; align-items:center; gap:6px; padding:9px 16px; font-size:13.5px; font-weight:500; color:var(--text-muted); border:none; background:none; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; transition:color 120ms,border-color 120ms; }
.tab-btn:hover  { color:var(--text-primary); }
.tab-btn.active { color:var(--accent); border-bottom-color:var(--accent); font-weight:600; }

.table-wrap { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.data-table { width:100%; border-collapse:collapse; font-size:13px; }
.data-table thead th { padding:10px 14px; text-align:left; font-size:11.5px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); background:var(--bg-app); border-bottom:1px solid var(--border); white-space:nowrap; }
.data-table tbody tr.table-row { border-bottom:1px solid var(--border); transition:background 100ms; }
.data-table tbody tr.table-row:last-child { border-bottom:none; }
.data-table tbody tr.table-row:hover { background:var(--bg-app); }
.data-table tbody td { padding:10px 14px; color:var(--text-primary); }
.table-empty { text-align:center; padding:48px 20px; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; }
.table-skeleton { padding:8px 0; }
.skeleton-row { height:40px; margin:4px 16px; border-radius:6px; background:linear-gradient(90deg,var(--border) 25%,var(--bg-app) 50%,var(--border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position:-200% 0; } }

.col-amount { font-variant-numeric:tabular-nums; }
.diff-over  { color:var(--success); font-weight:600; }
.diff-short { color:var(--danger); font-weight:600; }

.status-badge { display:inline-flex; padding:2px 8px; border-radius:9999px; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; }
.status-open   { background:var(--success-soft); color:var(--success-hover); }
.status-closed { background:#f3f4f6; color:#6b7280; }

.shift-summary { background:var(--bg-app); border:1px solid var(--border); border-radius:8px; padding:12px 14px; display:flex; flex-direction:column; gap:8px; }
.summary-row { display:flex; justify-content:space-between; font-size:13px; color:var(--text-secondary); }
.summary-row span:last-child { font-variant-numeric:tabular-nums; font-weight:600; }

.diff-preview { padding:10px 14px; border-radius:8px; font-size:13px; font-weight:600; text-align:center; }
.diff-preview.diff-over  { background:var(--success-soft); color:var(--success-hover); }
.diff-preview.diff-short { background:var(--danger-soft); color:var(--danger); }

.shift-help { font-size:12px; color:var(--text-muted); margin:0; }
.shift-warn { font-size:13px; color:var(--warning-hover); background:var(--warning-soft); border-radius:8px; padding:8px 12px; margin:0; }
.check-row   { display:flex; align-items:center; gap:8px; cursor:pointer; }
.check-input { width:16px; height:16px; accent-color:var(--accent); cursor:pointer; flex-shrink:0; }
.check-label { font-size:13px; font-weight:600; color:var(--text-primary); }
.btn-danger-solid:disabled { opacity:.5; cursor:not-allowed; }
.btn-danger-solid { display:inline-flex; align-items:center; gap:5px; padding:8px 16px; border-radius:8px; font-size:13px; font-weight:600; border:none; background:var(--danger); color:#fff; cursor:pointer; transition:background 100ms,transform 70ms; }
.btn-danger-solid:hover  { background:var(--danger-hover); }
.btn-danger-solid:active { transform:scale(0.95); }
</style>
