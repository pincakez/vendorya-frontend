<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Work Shifts</h1>
        <p class="page-sub">Open and close cashier sessions, track cash flow</p>
      </div>
    </div>

    <!-- Open shift banner -->
    <div v-if="openShift" class="shift-banner open">
      <div class="banner-left">
        <div class="banner-dot open-dot" />
        <div>
          <div class="banner-title">Shift Open</div>
          <div class="banner-sub">Started {{ fmtDateTime(openShift.start_time) }} · Starting cash: <Money :value="openShift.starting_cash" /></div>
        </div>
      </div>
      <button class="btn-danger" @click="openCloseModal">Close Shift</button>
    </div>

    <div class="tab-bar">
      <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
        <component :is="tab.icon" :size="15" />
        {{ tab.label }}
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
            <tr><th>Date</th><th>Status</th><th>Starting Cash</th><th>Expected</th><th>Counted</th><th>Difference</th></tr>
          </thead>
          <tbody>
            <tr v-if="shifts.length === 0">
              <td colspan="6" class="table-empty">
                <Clock :size="32" style="opacity:.3;margin-bottom:8px;" />
                <div>No shift history yet</div>
              </td>
            </tr>
            <tr v-for="s in shifts" :key="s.id" class="table-row" style="cursor:pointer" @click="router.push('/finance/shifts/' + s.id)">
              <td>{{ fmtDateTime(s.start_time) }}</td>
              <td><span class="status-badge" :class="`status-${s.status.toLowerCase()}`">{{ s.status }}</span></td>
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
    <AppModal :open="openModal" title="Open New Shift" @close="openModal = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">Starting Cash in Drawer</label>
          <input v-model="startingCash" type="number" min="0" step="0.01" class="form-input" placeholder="0.00" />
        </div>
        <div>
          <label class="form-label">Branch</label>
          <input class="form-input" :value="auth.user?.store?.name || 'Main'" disabled />
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="openModal = false">Cancel</button>
        <button class="btn-primary" @click="openShiftAction">Open Shift</button>
      </template>
    </AppModal>

    <!-- MODAL: Close Shift -->
    <AppModal :open="closeModal" title="Close Shift" @close="closeModal = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div class="shift-summary">
          <div class="summary-row"><span>Starting Cash</span><span><Money :value="openShift?.starting_cash" /></span></div>
          <div class="summary-row"><span>Expected Cash</span><span><Money :value="openShift?.expected_cash" /></span></div>
        </div>
        <div>
          <label class="form-label">Counted Cash in Drawer</label>
          <input v-model="countedCash" type="number" min="0" step="0.01" class="form-input" placeholder="0.00" />
        </div>
        <div v-if="countedCash !== ''" class="diff-preview" :class="diffClass(countedCash - (openShift?.expected_cash || 0))">
          Difference: {{ Number(countedCash - (openShift?.expected_cash || 0)) >= 0 ? '+' : '' }}<Money :value="countedCash - (openShift?.expected_cash || 0)" />
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="closeModal = false">Cancel</button>
        <button class="btn-danger-solid" @click="closeShiftAction">Close Shift</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Clock, History } from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import { useQABStore } from '@/stores/qab'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { formatNumber } from '@/utils/format'

const auth   = useAuthStore()
const qab    = useQABStore()
const router = useRouter()

const tabs = [
  { id: 'history', label: 'Shift History', icon: History },
]
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

async function fetchOpenShift() {
  try {
    const res = await api.get('/api/finance/shifts/', { params: { status: 'OPEN', page_size: 1 } })
    const results = res.data.results ?? res.data
    openShift.value = results.length ? results[0] : null
  } catch { openShift.value = null }
}

function openCloseModal() { countedCash.value = ''; closeModal.value = true }

async function openShiftAction() {
  await api.post('/api/finance/shifts/', {
    starting_cash: startingCash.value || 0,
    branch: auth.user?.store?.id,
  })
  openModal.value = false
  startingCash.value = ''
  await fetchOpenShift()
  fetchShifts(1)
  qab.setActions([])
}

async function closeShiftAction() {
  if (!openShift.value) return
  await api.post(`/api/finance/shifts/${openShift.value.id}/close/`, { counted_cash: countedCash.value || 0 })
  closeModal.value = false
  await fetchOpenShift()
  fetchShifts(1)
  if (!openShift.value) {
    qab.setActions([{ id: 'open', label: 'Open Shift', icon: 'plus', handler: () => { startingCash.value = ''; openModal.value = true } }])
  }
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
  if (!openShift.value) {
    qab.setActions([{ id: 'open', label: 'Open Shift', icon: 'plus', handler: () => { startingCash.value = ''; openModal.value = true } }])
  }
})
onUnmounted(() => qab.clearActions())
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; }
.page-title  { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub    { font-size:13px; color:var(--text-muted); margin:2px 0 0; }

.shift-banner { display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-radius:12px; margin-bottom:20px; border:1px solid; }
.shift-banner.open { background:#f0fdf4; border-color:#86efac; }
.banner-left  { display:flex; align-items:center; gap:12px; }
.banner-dot   { width:10px; height:10px; border-radius:50%; }
.open-dot     { background:#16a34a; box-shadow:0 0 0 3px #bbf7d0; animation:pulse 2s infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
.banner-title { font-weight:700; font-size:14px; color:#15803d; }
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
.diff-over  { color:#16a34a; font-weight:600; }
.diff-short { color:#dc2626; font-weight:600; }

.status-badge { display:inline-flex; padding:2px 8px; border-radius:9999px; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; }
.status-open   { background:#dcfce7; color:#15803d; }
.status-closed { background:#f3f4f6; color:#6b7280; }

.shift-summary { background:var(--bg-app); border:1px solid var(--border); border-radius:8px; padding:12px 14px; display:flex; flex-direction:column; gap:8px; }
.summary-row { display:flex; justify-content:space-between; font-size:13px; color:var(--text-secondary); }
.summary-row span:last-child { font-variant-numeric:tabular-nums; font-weight:600; }

.diff-preview { padding:10px 14px; border-radius:8px; font-size:13px; font-weight:600; text-align:center; }
.diff-preview.diff-over  { background:#f0fdf4; color:#15803d; }
.diff-preview.diff-short { background:#fef2f2; color:#dc2626; }

.form-label { display:block; font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.btn-danger-solid { display:inline-flex; align-items:center; gap:5px; padding:8px 16px; border-radius:8px; font-size:13px; font-weight:600; border:none; background:#dc2626; color:#fff; cursor:pointer; transition:background 100ms,transform 70ms; }
.btn-danger-solid:hover  { background:#b91c1c; }
.btn-danger-solid:active { transform:scale(0.95); }
</style>
