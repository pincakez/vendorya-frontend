<template>
  <div>
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">Services</h1>
        <p class="page-sub">Track repair & service jobs</p>
      </div>
      <div class="header-actions">
        <button class="btn-primary" @click="openNew">
          <Plus :size="15" /> New Service
        </button>
      </div>
    </div>

    <!-- Status tabs + search -->
    <div class="svc-toolbar">
      <div class="tab-bar" style="margin-bottom:0;">
        <button
          v-for="tab in statusTabs" :key="tab.id"
          class="tab-btn" :class="{ active: activeTab === tab.id }"
          @click="setTab(tab.id)"
        >
          {{ tab.label }}
          <span v-if="tab.count != null" class="tab-badge">{{ tab.count }}</span>
        </button>
      </div>
      <div class="svc-search-wrap">
        <Search :size="14" class="svc-search-icon" />
        <input
          v-model="search"
          class="svc-search"
          placeholder="Search by SRV#, client, type…"
          @input="debouncedFetch"
        />
      </div>
    </div>

    <!-- Table -->
    <div class="dt-card">
      <div v-if="loading" class="svc-skeleton">
        <div v-for="i in 6" :key="i" class="skeleton-row" />
      </div>
      <div v-else class="dt-xscroll">
      <table class="dt">
        <thead>
          <tr>
            <th class="dt-th" style="width:100px;">SRV #</th>
            <th class="dt-th">Client</th>
            <th class="dt-th">Type</th>
            <th class="dt-th" style="width:110px;">Received</th>
            <th class="dt-th" style="width:110px;">ETA</th>
            <th class="dt-th" style="width:90px;">Cost</th>
            <th class="dt-th" style="width:44px;text-align:center;">🔔</th>
            <th class="dt-th" style="width:120px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="items.length === 0">
            <td colspan="8" class="dt-empty">
              <div class="dt-empty-inner">
                <Wrench :size="36" class="dt-empty-icon" />
                <div class="dt-empty-title">No services{{ activeTab !== 'OPEN' ? ' in this status' : '' }}</div>
              </div>
            </td>
          </tr>
          <tr v-for="s in items" :key="s.id" class="dt-row clickable" @click.stop="openDetail(s)">
            <td class="col-serial">
              <span class="serial-chip">{{ s.serial_number }}</span>
            </td>
            <td>
              <div class="col-client">
                <span class="client-name">{{ s.client_display_name || '—' }}</span>
                <span v-if="s.client_display_phone" class="client-phone">{{ s.client_display_phone }}</span>
              </div>
            </td>
            <td>{{ s.service_type || '—' }}</td>
            <td>{{ fmtDate(s.receive_date) }}</td>
            <td>
              <span v-if="s.no_eta || !s.eta_label" class="eta-none">—</span>
              <span v-else :class="['eta-badge', s.eta_label === 'overdue' ? 'overdue' : 'ok']">
                {{ s.eta_label === 'overdue' ? 'Overdue' : s.eta_label }}
              </span>
            </td>
            <td><Money :value="s.cost" /></td>
            <td style="text-align:center;" @click.stop>
              <button
                class="bell-btn"
                :class="{ active: s.notify_bell }"
                @click="toggleBell(s)"
                title="Toggle notification reminder"
              >
                <Bell :size="13" />
              </button>
            </td>
            <td class="col-actions" @click.stop>
              <!-- OPEN actions -->
              <template v-if="s.status === 'OPEN'">
                <button class="row-action" title="Edit" @click="openEdit(s)"><Pencil :size="13" /></button>
                <button class="row-action success" title="Mark Done" @click="confirmDone(s)"><CheckCircle :size="13" /></button>
                <button class="row-action danger" title="Cancel" @click="confirmCancel(s)"><XCircle :size="13" /></button>
              </template>
              <!-- DONE / CANCELLED actions -->
              <template v-else-if="s.status === 'DONE' || s.status === 'CANCELLED'">
                <button class="row-action" title="Archive" @click="confirmArchive(s)"><Archive :size="13" /></button>
              </template>
              <!-- Return button for DONE -->
              <template v-if="s.status === 'DONE'">
                <button class="row-action" title="Return service" @click="confirmReturn(s)"><RotateCcw :size="13" /></button>
              </template>
              <!-- Invoice link for DONE -->
              <a
                v-if="s.status === 'DONE' && s.invoice"
                class="row-action" title="View Invoice"
                href="#" @click.prevent="viewInvoice(s)"
              ><FileText :size="13" /></a>
            </td>
          </tr>
        </tbody>
      </table>
      </div><!-- dt-xscroll -->
    </div><!-- dt-card -->

    <AppPagination :page="page" :page-size="pageSize" :total="total" @update:page="goPage" />

    <!-- Service form modal -->
    <ServiceFormModal
      :open="modal.open"
      :service-id="modal.serviceId"
      :service-data="modal.data"
      :service-types="serviceTypes"
      @close="modal.open = false"
      @saved="onSaved"
    />

    <!-- Confirm: Mark Done -->
    <AppModal :open="confirm.done" title="Mark as Done?" @close="confirm.done = false">
      <p style="font-size:14px;color:var(--text-secondary);line-height:1.6;">
        This will create a Sales Invoice for <strong><Money :value="confirm.target?.cost" /></strong> and link it to <strong>{{ confirm.target?.serial_number }}</strong>.
      </p>
      <template #footer>
        <button class="btn-ghost" @click="confirm.done = false">Cancel</button>
        <button class="btn-primary" :disabled="confirm.busy" @click="executeDone">
          {{ confirm.busy ? 'Processing…' : 'Mark Done & Create Invoice' }}
        </button>
      </template>
    </AppModal>

    <!-- Confirm: Cancel -->
    <AppModal :open="confirm.cancel" title="Cancel Service?" @close="confirm.cancel = false">
      <p style="font-size:14px;color:var(--text-secondary);line-height:1.6;">
        Cancel <strong>{{ confirm.target?.serial_number }}</strong>? This cannot be undone.
      </p>
      <template #footer>
        <button class="btn-ghost" @click="confirm.cancel = false">Keep it</button>
        <button class="btn-danger" :disabled="confirm.busy" @click="executeCancel">
          {{ confirm.busy ? 'Cancelling…' : 'Cancel Service' }}
        </button>
      </template>
    </AppModal>

    <!-- Confirm: Archive -->
    <AppModal :open="confirm.archive" title="Archive Service?" @close="confirm.archive = false">
      <p style="font-size:14px;color:var(--text-secondary);line-height:1.6;">
        Move <strong>{{ confirm.target?.serial_number }}</strong> to Archives?
      </p>
      <template #footer>
        <button class="btn-ghost" @click="confirm.archive = false">Cancel</button>
        <button class="btn-primary" :disabled="confirm.busy" @click="executeArchive">
          {{ confirm.busy ? 'Archiving…' : 'Archive' }}
        </button>
      </template>
    </AppModal>

    <!-- Confirm: Return -->
    <AppModal :open="confirm.return" title="Return Service?" @close="confirm.return = false">
      <p style="font-size:14px;color:var(--text-secondary);line-height:1.6;">
        Mark <strong>{{ confirm.target?.serial_number }}</strong> as returned? The invoice stays — this is a record-only action with no financial impact.
      </p>
      <template #footer>
        <button class="btn-ghost" @click="confirm.return = false">Cancel</button>
        <button class="btn-primary" :disabled="confirm.busy" @click="executeReturn">
          {{ confirm.busy ? 'Processing…' : 'Confirm Return' }}
        </button>
      </template>
    </AppModal>

    <!-- Detail modal: click a row -->
    <AppModal :open="detail.open" :title="detail.service?.serial_number || 'Service'" @close="detail.open = false" width="520px">
      <div v-if="detail.service" class="det-body">
        <!-- Status badge -->
        <div class="det-status-row">
          <span :class="['det-badge', `det-badge-${detail.service.status?.toLowerCase()}`]">
            {{ detail.service.status }}
          </span>
          <span class="det-serial">{{ detail.service.serial_number }}</span>
        </div>

        <div class="det-grid">
          <div class="det-field"><span class="det-lbl">Client</span><span class="det-val">{{ detail.service.client_display_name || '—' }}</span></div>
          <div class="det-field"><span class="det-lbl">Phone</span><span class="det-val">{{ detail.service.client_display_phone || '—' }}</span></div>
          <div class="det-field"><span class="det-lbl">Service Type</span><span class="det-val">{{ detail.service.service_type || '—' }}</span></div>
          <div class="det-field"><span class="det-lbl">Received</span><span class="det-val">{{ fmtDate(detail.service.receive_date) }}</span></div>
          <div class="det-field"><span class="det-lbl">ETA</span>
            <span class="det-val">
              <span v-if="detail.service.no_eta || !detail.service.eta_label" class="eta-none">No ETA</span>
              <span v-else :class="['eta-badge', detail.service.eta_label === 'overdue' ? 'overdue' : 'ok']">
                {{ detail.service.eta_label === 'overdue' ? 'Overdue' : detail.service.eta_label }}
              </span>
            </span>
          </div>
          <div class="det-field det-full"><span class="det-lbl">Description</span><span class="det-val">{{ detail.service.info || '—' }}</span></div>
          <div class="det-field det-full"><span class="det-lbl">Items Kept</span><span class="det-val">{{ detail.service.keeping || '—' }}</span></div>
          <div class="det-field">
            <span class="det-lbl">Cost</span>
            <input
              v-model.number="detail.editCost"
              type="number" min="0" step="0.01"
              class="form-input det-cost-input"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <template v-if="detail.service?.status === 'OPEN'">
          <button class="btn-ghost" @click="detail.open = false">Not Yet</button>
          <button class="btn-success" :disabled="detail.busy" @click="detailMarkDone">
            {{ detail.busy ? 'Processing…' : '✓ Done' }}
          </button>
        </template>
        <template v-else>
          <button class="btn-ghost" @click="detail.open = false">Close</button>
          <button
            v-if="detail_costChanged"
            class="btn-primary" :disabled="detail.busy"
            @click="saveCost"
          >{{ detail.busy ? 'Saving…' : 'Save Cost' }}</button>
        </template>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus, Search, Wrench, Bell, Pencil, CheckCircle,
  XCircle, Archive, FileText, RotateCcw,
} from 'lucide-vue-next'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import Money from '@/components/ui/Money.vue'
import ServiceFormModal from './ServiceFormModal.vue'

const router = useRouter()

/* ── status tabs ─────────────────────────────────────────────────── */
const statusTabs = reactive([
  { id: 'OPEN',      label: 'Open',      count: null },
  { id: 'DONE',      label: 'Done',      count: null },
  { id: 'CANCELLED', label: 'Cancelled', count: null },
  { id: 'ARCHIVED',  label: 'Archived',  count: null },
  { id: 'RETURNED',  label: 'Returned',  count: null },
])
const activeTab = ref('OPEN')

/* ── state ───────────────────────────────────────────────────────── */
const loading      = ref(false)
const items        = ref([])
const total        = ref(0)
const page         = ref(1)
const pageSize     = ref(20)
const search       = ref('')
const serviceTypes = ref([])

/* ── modal ───────────────────────────────────────────────────────── */
const modal = reactive({ open: false, serviceId: null, data: null })

/* ── confirm dialogs ─────────────────────────────────────────────── */
const confirm = reactive({
  done: false, cancel: false, archive: false, return: false,
  target: null, busy: false,
})

/* ── detail modal ────────────────────────────────────────────────── */
const detail = reactive({ open: false, service: null, editCost: 0, busy: false })
const detail_costChanged = computed(() =>
  detail.service && parseFloat(detail.editCost) !== parseFloat(detail.service.cost)
)

/* ── date formatter ──────────────────────────────────────────────── */
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ── fetch ───────────────────────────────────────────────────────── */
async function fetchItems() {
  loading.value = true
  try {
    const params = {
      status:    activeTab.value,
      page:      page.value,
      page_size: pageSize.value,
    }
    if (search.value.trim()) params.search = search.value.trim()
    const { data } = await api.get('/api/services/', { params })
    items.value = data.results ?? data
    total.value = data.count   ?? (data.results?.length ?? data.length)
  } finally {
    loading.value = false
  }
}

async function fetchCounts() {
  const statuses = ['OPEN', 'DONE', 'CANCELLED', 'ARCHIVED', 'RETURNED']
  const results = await Promise.allSettled(
    statuses.map(s => api.get('/api/services/', { params: { status: s, page_size: 1 } }))
  )
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      const data = r.value.data
      statusTabs[i].count = data.count ?? (data.results?.length ?? 0)
    }
  })
}

async function fetchServiceTypes() {
  try {
    const { data } = await api.get('/api/core/settings/')
    serviceTypes.value = data.service_types ?? []
  } catch {}
}

/* ── debounce search ─────────────────────────────────────────────── */
let searchTimer = null
function debouncedFetch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { page.value = 1; fetchItems() }, 300)
}

function setTab(id) {
  activeTab.value = id
  page.value = 1
  fetchItems()
}

function goPage(p) {
  page.value = p
  fetchItems()
}

/* ── modal helpers ───────────────────────────────────────────────── */
function openNew() {
  modal.serviceId = null
  modal.data = null
  modal.open = true
}

function openEdit(s) {
  modal.serviceId = s.id
  modal.data = s
  modal.open = true
}

function onSaved() {
  modal.open = false
  page.value = 1
  fetchItems()
  fetchCounts()
}

/* ── bell toggle ─────────────────────────────────────────────────── */
async function toggleBell(s) {
  const { data } = await api.post(`/api/services/${s.id}/toggle-bell/`)
  s.notify_bell = data.notify_bell
}

/* ── mark done ───────────────────────────────────────────────────── */
function confirmDone(s) {
  confirm.target = s
  confirm.done = true
}
async function executeDone() {
  confirm.busy = true
  try {
    await api.post(`/api/services/${confirm.target.id}/done/`)
    confirm.done = false
    fetchItems(); fetchCounts()
  } catch (e) {
    alert(e?.response?.data?.detail ?? 'Failed to mark as done.')
  } finally { confirm.busy = false }
}

/* ── cancel ──────────────────────────────────────────────────────── */
function confirmCancel(s) {
  confirm.target = s
  confirm.cancel = true
}
async function executeCancel() {
  confirm.busy = true
  try {
    await api.post(`/api/services/${confirm.target.id}/cancel/`)
    confirm.cancel = false
    fetchItems(); fetchCounts()
  } catch (e) {
    alert(e?.response?.data?.detail ?? 'Failed to cancel.')
  } finally { confirm.busy = false }
}

/* ── archive ─────────────────────────────────────────────────────── */
function confirmArchive(s) {
  confirm.target = s
  confirm.archive = true
}
async function executeArchive() {
  confirm.busy = true
  try {
    await api.post(`/api/services/${confirm.target.id}/archive/`)
    confirm.archive = false
    fetchItems(); fetchCounts()
  } catch (e) {
    alert(e?.response?.data?.detail ?? 'Failed to archive.')
  } finally { confirm.busy = false }
}

/* ── invoice link ────────────────────────────────────────────────── */
function viewInvoice(s) {
  if (s.invoice) router.push(`/finance/invoices/${s.invoice}`)
}

/* ── return service ──────────────────────────────────────────────── */
function confirmReturn(s) {
  confirm.target = s
  confirm.return = true
}
async function executeReturn() {
  confirm.busy = true
  try {
    await api.post(`/api/services/${confirm.target.id}/return/`)
    confirm.return = false
    fetchItems(); fetchCounts()
  } catch (e) {
    alert(e?.response?.data?.detail ?? 'Failed to return service.')
  } finally { confirm.busy = false }
}

/* ── detail modal ────────────────────────────────────────────────── */
function openDetail(s) {
  detail.service  = s
  detail.editCost = parseFloat(s.cost) || 0
  detail.open     = true
  detail.busy     = false
}

async function detailMarkDone() {
  detail.busy = true
  try {
    await api.post(`/api/services/${detail.service.id}/done/`)
    detail.open = false
    fetchItems(); fetchCounts()
  } catch (e) {
    alert(e?.response?.data?.detail ?? 'Failed to mark as done.')
  } finally { detail.busy = false }
}

async function saveCost() {
  detail.busy = true
  try {
    const { data } = await api.patch(`/api/services/${detail.service.id}/`, { cost: detail.editCost })
    Object.assign(detail.service, data)
    detail.open = false
    fetchItems()
  } catch (e) {
    alert(e?.response?.data?.detail ?? 'Failed to save cost.')
  } finally { detail.busy = false }
}

/* ── init ────────────────────────────────────────────────────────── */
onMounted(() => {
  fetchItems()
  fetchCounts()
  fetchServiceTypes()
})
</script>

<style scoped>
/* Shared header / tab / button classes — these are NOT global; each page
   defines its own scoped copy. Services.vue was missing them, so the
   New Service button + tabs rendered unstyled. (s53) */
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
.page-title  { font-size:28px; font-weight:800; color:var(--text-primary); margin:0; letter-spacing:-0.4px; }
.page-sub    { font-size:13.5px; color:var(--text-muted); margin:4px 0 0; }
.header-actions { display:flex; align-items:center; gap:10px; }
.btn-primary { display:inline-flex; align-items:center; gap:6px; padding:9px 17px; border-radius:9px; font-size:13.5px; font-weight:600; border:none; background:var(--accent); color:#fff; cursor:pointer; transition:background 100ms,transform 70ms,opacity 100ms; }
.btn-primary:hover    { background:var(--accent-hover); }
.btn-primary:active   { transform:scale(0.95); }
.btn-primary:disabled { opacity:.5; cursor:default; }
.btn-ghost { display:inline-flex; align-items:center; gap:5px; padding:8px 13px; border-radius:9px; font-size:13.5px; font-weight:500; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; transition:background 100ms,color 100ms,transform 70ms; }
.btn-ghost:hover  { background:var(--border); color:var(--text-primary); }
.btn-ghost:active { transform:scale(0.95); }
.tab-bar { display:flex; gap:2px; border-bottom:1px solid var(--border); }
.tab-btn { display:flex; align-items:center; gap:6px; padding:9px 16px; font-size:13.5px; font-weight:500; color:var(--text-muted); border:none; background:none; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; transition:color 120ms,border-color 120ms; }
.tab-btn:hover  { color:var(--text-primary); }
.tab-btn.active { color:var(--accent); border-bottom-color:var(--accent); font-weight:600; }

.svc-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.svc-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.svc-search-icon {
  position: absolute;
  left: 10px;
  color: var(--text-muted);
  pointer-events: none;
}
.svc-search {
  padding: 7px 12px 7px 30px;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  background: var(--bg-card);
  color: var(--text-primary);
  font-size: 13px;
  width: 230px;
  outline: none;
  transition: border-color 150ms;
}
.svc-search:focus { border-color: var(--accent); }

.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 700;
  background: var(--accent-soft);
  color: var(--accent);
  margin-left: 5px;
}
.tab-btn.active .tab-badge {
  background: var(--accent);
  color: #fff;
}

.serial-chip {
  font-size: 12px;
  font-weight: 700;
  font-family: monospace;
  background: var(--bg-app);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 2px 8px;
  color: var(--text-primary);
}

.col-client { display: flex; flex-direction: column; gap: 2px; }
.client-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.client-phone { font-size: 11px; color: var(--text-muted); }

.eta-none { color: var(--text-muted); font-size: 12px; }
.eta-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
}
.eta-badge.ok { background: #dcfce7; color: #16a34a; }
.eta-badge.overdue { background: #fee2e2; color: #dc2626; }

.bell-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  padding: 4px;
  border-radius: 6px;
  transition: color 120ms, background 120ms;
}
.bell-btn:hover { background: var(--bg-hover); }
.bell-btn.active { color: var(--accent); }

.col-actions { display: flex; gap: 4px; align-items: center; }

.row-action.success { color: #16a34a; }
.row-action.success:hover { background: #dcfce7; }

.btn-danger {
  padding: 8px 18px;
  border-radius: 8px;
  border: none;
  background: #dc2626;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 120ms;
}
.btn-danger:disabled { opacity: .5; cursor: not-allowed; }

/* ── detail modal ───────────────────────────────────────────── */
.det-body { display: flex; flex-direction: column; gap: 16px; }
.det-status-row { display: flex; align-items: center; gap: 10px; }
.det-serial { font-size: 16px; font-weight: 800; font-family: monospace; color: var(--text-primary); }
.det-badge {
  font-size: 11px; font-weight: 700; padding: 3px 10px;
  border-radius: 20px; text-transform: uppercase; letter-spacing: .04em;
}
.det-badge-open      { background: #dbeafe; color: #1d4ed8; }
.det-badge-done      { background: #dcfce7; color: #16a34a; }
.det-badge-cancelled { background: #f3f4f6; color: #6b7280; }
.det-badge-archived  { background: #fef3c7; color: #92400e; }
.det-badge-returned  { background: #ede9fe; color: #7c3aed; }

.det-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.det-field { display: flex; flex-direction: column; gap: 3px; }
.det-full  { grid-column: 1 / -1; }
.det-lbl   { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; }
.det-val   { font-size: 13px; color: var(--text-primary); line-height: 1.5; }
.det-cost-input { max-width: 140px; padding: 6px 10px; font-size: 14px; font-weight: 600; }

.btn-success {
  padding: 8px 20px; border-radius: 8px; border: none;
  background: #16a34a; color: #fff; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: opacity 120ms;
}
.btn-success:hover   { opacity: .88; }
.btn-success:disabled { opacity: .5; cursor: not-allowed; }

.svc-skeleton { padding: 8px 0; }
.skeleton-row { height: 44px; margin: 4px 16px; border-radius: 6px;
  background: linear-gradient(90deg, var(--border) 25%, var(--bg-app) 50%, var(--border) 75%);
  background-size: 200% 100%; animation: shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position: -200% 0; } }
</style>
