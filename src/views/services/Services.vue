<template>
  <div>
    <!-- Page header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('core.services.title') }}</h1>
        <p class="page-sub">{{ t('core.services.sub') }}</p>
      </div>
      <div class="header-actions">
        <button class="btn-primary" @click="openNew">
          <Plus :size="15" /> {{ t('core.services.new_service') }}
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
      <div class="svc-filters">
      <select v-model="techFilter" class="svc-search svc-tech-select" @change="setTab(activeTab)">
        <option value="">{{ t('core.svcdesk.all_technicians') }}</option>
        <option value="none">{{ t('core.svcdesk.unassigned') }}</option>
        <option v-for="u in technicians" :key="u.id" :value="String(u.id)">{{ u.name }}</option>
      </select>
      <div class="svc-search-wrap">
        <Search :size="14" class="svc-search-icon" />
        <input
          v-model="search"
          class="svc-search"
          :placeholder="t('core.services.search_ph')"
          @input="debouncedFetch"
        />
      </div>
      </div>
    </div>

    <!-- Table -->
    <AppTable :loading="loading" :empty="items.length === 0" :cols="8" :skeleton-rows="6">
      <template #head>
        <th class="dt-th" style="width:100px;">{{ t('core.services.col_srv') }}</th>
        <th class="dt-th">{{ t('core.services.col_client') }}</th>
        <th class="dt-th">{{ t('core.services.col_type') }}</th>
        <th class="dt-th" style="width:110px;">{{ t('core.services.col_received') }}</th>
        <th class="dt-th" style="width:110px;">{{ t('core.services.col_eta') }}</th>
        <th class="dt-th" style="width:90px;">{{ t('core.services.col_cost') }}</th>
        <th class="dt-th" style="width:44px;text-align:center;">🔔</th>
        <th class="dt-th" style="width:120px;"></th>
      </template>
      <template #empty>
        <div class="dt-empty-inner">
          <Wrench :size="36" class="dt-empty-icon" />
          <div class="dt-empty-title">{{ activeTab !== 'OPEN' ? t('core.services.no_services_status') : t('core.services.no_services') }}</div>
        </div>
      </template>
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
            <td>
              <div class="col-client">
                <span>{{ s.service_type || '—' }}</span>
                <span v-if="s.device || s.technician_name" class="client-phone" dir="auto">
                  {{ [s.device, s.technician_name].filter(Boolean).join(' · ') }}
                </span>
                <!-- s169c: the device serial is one of the shop's own units → its product (+ warranty if still on) -->
                <span v-if="s.device_unit" class="client-phone unit-line" dir="auto">
                  {{ t('core.svcdesk.unit_ours', { product: s.device_unit.product_name }) }}
                  <span
                    v-if="s.device_unit.warranty_active"
                    class="eta-badge ok"
                    :title="s.device_unit.warranty_ends_on ? t('core.svcdesk.unit_warranty_until', { date: fmtDate(s.device_unit.warranty_ends_on) }) : ''"
                  >{{ t('core.svcdesk.unit_in_warranty') }}</span>
                </span>
              </div>
            </td>
            <td>{{ fmtDate(s.receive_date) }}</td>
            <td>
              <span v-if="s.no_eta || !s.eta_label" class="eta-none">—</span>
              <span v-else :class="['eta-badge', s.eta_label === 'overdue' ? 'overdue' : 'ok']">
                {{ s.eta_label === 'overdue' ? t('core.services.overdue') : s.eta_label }}
              </span>
            </td>
            <td><Money :value="jobTotal(s)" /></td>
            <td style="text-align:center;" @click.stop>
              <button
                class="bell-btn"
                :class="{ active: s.notify_bell }"
                @click="toggleBell(s)"
                :title="t('core.services.toggle_bell')"
              >
                <Bell :size="13" />
              </button>
            </td>
            <td class="col-actions" @click.stop>
              <!-- OPEN actions -->
              <template v-if="s.status === 'OPEN'">
                <button class="row-action" :title="t('common.edit')" @click="openEdit(s)"><Pencil :size="13" /></button>
                <button class="row-action success" :title="t('core.services.mark_done')" @click="confirmDone(s)"><CheckCircle :size="13" /></button>
                <button class="row-action danger" :title="t('common.cancel')" @click="confirmCancel(s)"><XCircle :size="13" /></button>
              </template>
              <!-- DONE / CANCELLED actions -->
              <template v-else-if="s.status === 'DONE' || s.status === 'CANCELLED'">
                <button class="row-action" :title="t('core.services.archive')" @click="confirmArchive(s)"><Archive :size="13" /></button>
              </template>
              <!-- Return button for DONE -->
              <template v-if="s.status === 'DONE' && canReturn">
                <button class="row-action" :title="t('core.services.return_svc')" @click="confirmReturn(s)"><RotateCcw :size="13" /></button>
              </template>
              <!-- Invoice link for DONE -->
              <a
                v-if="s.status === 'DONE' && s.invoice"
                class="row-action" :title="t('core.services.view_invoice')"
                href="#" @click.prevent="viewInvoice(s)"
              ><FileText :size="13" /></a>
            </td>
          </tr>
    </AppTable>

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
    <AppModal :open="confirm.done" :title="t('core.services.done_title')" @close="confirm.done = false">
      <!-- The exact invoice total (server quote: same tax rule as the invoice) — what the cashier collects. -->
      <p v-if="!confirm.quote" class="done-note">{{ confirm.quoteError ? t('core.svcdesk.quote_failed') : t('core.svcdesk.loading_total') }}</p>
      <template v-else>
        <p style="font-size:14px;color:var(--text-secondary);line-height:1.6;">
          {{ t('core.services.done_body_a') }} <strong><Money :value="confirm.quote.grand_total" /></strong> {{ t('core.services.done_body_b') }} <strong>{{ confirm.target?.serial_number }}</strong>.
        </p>
        <div class="done-quote">
          <span>{{ t('core.svcdesk.subtotal') }} <Money :value="confirm.quote.subtotal" /></span>
          <span>{{ t('core.svcdesk.tax') }} <Money :value="confirm.quote.tax_total" /></span>
          <span>{{ t('core.svcdesk.grand_total') }} <strong><Money :value="confirm.quote.grand_total" /></strong></span>
        </div>
        <p v-if="confirm.target?.is_warranty" class="done-note">{{ t('core.svcdesk.free_warranty') }}</p>
      </template>
      <!-- How the customer paid (Yakot, s156) — not asked for a free job -->
      <div v-if="quoteTotal > 0" class="done-pay">
        <div class="done-pay-lbl">{{ t('core.services.paid_how') }}</div>
        <div class="done-pay-methods">
          <button
            v-for="m in payMethods" :key="m.id" type="button"
            :class="confirm.method === m.id ? 'btn-primary' : 'btn-ghost'"
            @click="confirm.method = m.id"
          >{{ m.name }}</button>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="confirm.done = false">{{ t('common.cancel') }}</button>
        <button class="btn-primary" :disabled="confirm.busy || !confirm.quote || (quoteTotal > 0 && !confirm.method)" @click="executeDone">
          {{ confirm.busy ? t('core.services.processing') : t('core.services.done_confirm') }}
        </button>
      </template>
    </AppModal>

    <!-- Confirm: Cancel -->
    <AppModal :open="confirm.cancel" :title="t('core.services.cancel_title')" @close="confirm.cancel = false">
      <p style="font-size:14px;color:var(--text-secondary);line-height:1.6;">
        {{ t('core.services.cancel_body_a') }} <strong>{{ confirm.target?.serial_number }}</strong>{{ t('core.services.cancel_body_b') }}
      </p>
      <template #footer>
        <button class="btn-ghost" @click="confirm.cancel = false">{{ t('core.services.keep_it') }}</button>
        <button class="btn-danger" :disabled="confirm.busy" @click="executeCancel">
          {{ confirm.busy ? t('core.services.cancelling') : t('core.services.cancel_btn') }}
        </button>
      </template>
    </AppModal>

    <!-- Confirm: Archive -->
    <AppModal :open="confirm.archive" :title="t('core.services.archive_title')" @close="confirm.archive = false">
      <p style="font-size:14px;color:var(--text-secondary);line-height:1.6;">
        {{ t('core.services.archive_body_a') }} <strong>{{ confirm.target?.serial_number }}</strong>{{ t('core.services.archive_body_b') }}
      </p>
      <template #footer>
        <button class="btn-ghost" @click="confirm.archive = false">{{ t('common.cancel') }}</button>
        <button class="btn-primary" :disabled="confirm.busy" @click="executeArchive">
          {{ confirm.busy ? t('core.services.archiving') : t('core.services.archive') }}
        </button>
      </template>
    </AppModal>

    <!-- Confirm: Return -->
    <AppModal :open="confirm.return" :title="t('core.services.return_title')" @close="confirm.return = false">
      <p style="font-size:14px;color:var(--text-secondary);line-height:1.6;">
        {{ t('core.services.return_body_a') }} <strong>{{ confirm.target?.serial_number }}</strong>{{ t('core.services.return_body_b') }}
      </p>
      <div v-if="confirm.target?.invoice" class="done-pay">
        <div class="done-pay-lbl">{{ t('core.svcdesk.return_money') }}</div>
        <div class="done-pay-methods">
          <button type="button" :class="confirm.refundMethod === 'CASH' ? 'btn-primary' : 'btn-ghost'" @click="confirm.refundMethod = 'CASH'">{{ t('core.svcdesk.refund_cash') }}</button>
          <button v-if="confirm.target?.client" type="button" :class="confirm.refundMethod === 'STORE_CREDIT' ? 'btn-primary' : 'btn-ghost'" @click="confirm.refundMethod = 'STORE_CREDIT'">{{ t('core.svcdesk.refund_store_credit') }}</button>
        </div>
        <label v-if="(confirm.target?.parts || []).length" class="done-check">
          <input type="checkbox" v-model="confirm.restockParts" />
          <span>{{ t('core.svcdesk.restock_parts') }}</span>
        </label>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="confirm.return = false">{{ t('common.cancel') }}</button>
        <button class="btn-primary" :disabled="confirm.busy" @click="executeReturn">
          {{ confirm.busy ? t('core.services.processing') : t('core.services.return_confirm') }}
        </button>
      </template>
    </AppModal>

    <!-- Detail modal: click a row -->
    <AppModal :open="detail.open" :title="detail.service?.serial_number || t('core.services.service')" @close="detail.open = false" width="520px">
      <div v-if="detail.service" class="det-body">
        <!-- Status badge -->
        <div class="det-status-row">
          <span :class="['det-badge', `det-badge-${detail.service.status?.toLowerCase()}`]">
            {{ t('core.services.status.' + (detail.service.status || '').toLowerCase()) }}
          </span>
          <span class="det-serial">{{ detail.service.serial_number }}</span>
        </div>

        <div class="det-grid">
          <div class="det-field"><span class="det-lbl">{{ t('core.services.col_client') }}</span><span class="det-val">{{ detail.service.client_display_name || '—' }}</span></div>
          <div class="det-field"><span class="det-lbl">{{ t('settings.store.phone') }}</span><span class="det-val">{{ detail.service.client_display_phone || '—' }}</span></div>
          <div class="det-field"><span class="det-lbl">{{ t('core.services.col_type') }}</span><span class="det-val">{{ detail.service.service_type || '—' }}</span></div>
          <div class="det-field"><span class="det-lbl">{{ t('core.services.col_received') }}</span><span class="det-val">{{ fmtDate(detail.service.receive_date) }}</span></div>
          <div class="det-field"><span class="det-lbl">{{ t('core.services.col_eta') }}</span>
            <span class="det-val">
              <span v-if="detail.service.no_eta || !detail.service.eta_label" class="eta-none">{{ t('core.services.no_eta') }}</span>
              <span v-else :class="['eta-badge', detail.service.eta_label === 'overdue' ? 'overdue' : 'ok']">
                {{ detail.service.eta_label === 'overdue' ? t('core.services.overdue') : detail.service.eta_label }}
              </span>
            </span>
          </div>
          <div class="det-field det-full"><span class="det-lbl">{{ t('common.description') }}</span><span class="det-val">{{ detail.service.info || '—' }}</span></div>
          <div class="det-field det-full"><span class="det-lbl">{{ t('core.services.items_kept') }}</span><span class="det-val">{{ detail.service.keeping || '—' }}</span></div>
          <div class="det-field"><span class="det-lbl">{{ t('core.svcdesk.device') }}</span><span class="det-val" dir="auto">{{ detail.service.device || '—' }}</span></div>
          <div class="det-field"><span class="det-lbl">{{ t('core.svcdesk.device_serial') }}</span><span class="det-val" dir="ltr">{{ detail.service.device_serial || '—' }}</span></div>
          <div class="det-field det-full"><span class="det-lbl">{{ t('core.svcdesk.damage') }}</span><span class="det-val" dir="auto">{{ detail.service.damage || '—' }}</span></div>
          <div class="det-field"><span class="det-lbl">{{ t('core.svcdesk.technician') }}</span><span class="det-val">{{ detail.service.technician_name || t('core.svcdesk.unassigned') }}</span></div>
          <div class="det-field"><span class="det-lbl">{{ t('core.svcdesk.warranty_label') }}</span>
            <span class="det-val">
              {{ Number(detail.service.warranty_days) > 0 ? t('core.svcdesk.warranty_value', { n: detail.service.warranty_days }) : '—' }}
              <span v-if="detail.service.is_warranty" class="eta-badge ok">{{ t('core.svcdesk.warranty_job') }}</span>
            </span>
          </div>
          <div class="det-field"><span class="det-lbl">{{ t('core.svcdesk.detection_fee') }}</span><span class="det-val"><Money :value="detail.service.detection_fee" /></span></div>
          <div class="det-field">
            <span class="det-lbl">{{ t('core.svcdesk.repair_charge') }}</span>
            <input
              v-model.number="detail.editCost"
              type="number" min="0" step="0.01"
              class="form-input det-cost-input"
              placeholder="0.00"
              :disabled="detail.service.status !== 'OPEN'"
            />
          </div>
          <div v-if="(detail.service.parts || []).length" class="det-field det-full">
            <span class="det-lbl">{{ t('core.svcdesk.parts_section') }}</span>
            <div v-for="p in detail.service.parts" :key="p.id" class="det-part">
              <span dir="auto">{{ formatQty(p.quantity) }} × {{ p.product_name }}</span>
              <Money :value="p.line_total" />
            </div>
          </div>
          <div class="det-field det-full det-totals">
            <span>{{ t('core.svcdesk.est_total') }} <strong><Money :value="jobTotal(detail.service)" /></strong></span>
            <span v-if="detail.service.invoice_number" class="det-ref">{{ t('core.svcdesk.invoice_no', { n: detail.service.invoice_number }) }}</span>
            <span v-if="detail.service.refund_number" class="det-ref">{{ t('core.svcdesk.refund_no', { n: detail.service.refund_number }) }}</span>
          </div>
          <div class="det-field det-full det-diagnosis">
            <span class="det-lbl det-diagnosis-lbl">
              {{ t('core.services.diagnosis_label') }}
              <span class="det-diagnosis-hint">{{ t('core.services.diagnosis_hint') }}</span>
            </span>
            <textarea
              v-model="detail.editDiagnosis"
              class="form-input det-diagnosis-input"
              rows="3"
              :placeholder="t('core.services.diagnosis_ph')"
            />
          </div>

          <!-- Job notes timeline (Proline tb_Ser_Service_Tasks) -->
          <div class="det-field det-full det-diagnosis">
            <span class="det-lbl">{{ t('core.svcdesk.notes_section') }}</span>
            <div v-if="!(detail.service.notes || []).length" class="det-val det-muted">{{ t('core.svcdesk.notes_empty') }}</div>
            <div v-for="n in detail.service.notes" :key="n.id" class="det-note">
              <div class="det-note-meta">{{ fmtDateTime(n.created_at) }} · {{ n.user_name || '—' }}</div>
              <div class="det-val" dir="auto">{{ n.body }}</div>
            </div>
            <div class="det-note-add">
              <input v-model="detail.newNote" class="form-input" :placeholder="t('core.svcdesk.note_ph')" @keydown.enter.prevent="addNote" />
              <button class="btn-ghost" :disabled="detail.noteBusy || !detail.newNote.trim()" @click="addNote">{{ t('core.svcdesk.add_note') }}</button>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <template v-if="detail.service?.status === 'OPEN'">
          <button class="btn-ghost" :disabled="detail.busy" @click="detailNotYet">
            {{ detail.busy ? t('common.saving') : t('core.services.not_yet') }}
          </button>
          <button class="btn-success" :disabled="detail.busy" @click="detailMarkDone">
            {{ detail.busy ? t('core.services.processing') : t('core.services.done_short') }}
          </button>
        </template>
        <template v-else>
          <button class="btn-ghost" @click="detail.open = false">{{ t('common.close') }}</button>
          <button
            v-if="detail_hasChanges"
            class="btn-primary" :disabled="detail.busy"
            @click="saveCost"
          >{{ detail.busy ? t('common.saving') : t('core.services.save_cost') }}</button>
        </template>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  Plus, Search, Wrench, Bell, Pencil, CheckCircle,
  XCircle, Archive, FileText, RotateCcw,
} from 'lucide-vue-next'
import api from '@/api/axios'
import { useCtrlN } from '@/composables/useCtrlN'
useCtrlN(openNew)
import AppModal from '@/components/ui/AppModal.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import Money from '@/components/ui/Money.vue'
import { formatQty } from '@/utils/format'
import { useAuthStore } from '@/stores/auth'
import ServiceFormModal from './ServiceFormModal.vue'
import AppTable from '@/components/ui/AppTable.vue'

const { t } = useI18n()
const router = useRouter()
const auth = useAuthStore()
// Returning a billed job gives money back — manager and above, like a normal return.
const canReturn = computed(() => auth.hasRole('MANAGER'))

// What the job bills before tax: labour (detection fee + repair) + parts; 0 for a warranty job.
function jobTotal(s) {
  if (!s || s.is_warranty) return 0
  const n = (Number(s.labour_total ?? s.cost) || 0) + (Number(s.parts_total) || 0)
  return Math.round(n * 100) / 100
}

/* ── technicians (filter) ────────────────────────────────────────── */
const technicians = ref([])
const techFilter  = ref('')
async function fetchTechnicians() {
  try { technicians.value = (await api.get('/api/services/technicians/')).data } catch { technicians.value = [] }
}

/* ── status tabs ─────────────────────────────────────────────────── */
const statusTabs = reactive([
  { id: 'OPEN',      label: '', count: null },
  { id: 'DONE',      label: '', count: null },
  { id: 'CANCELLED', label: '', count: null },
  { id: 'ARCHIVED',  label: '', count: null },
  { id: 'RETURNED',  label: '', count: null },
])
watch(() => t('core.services.status.open'), () => {
  statusTabs.forEach(tb => { tb.label = t('core.services.status.' + tb.id.toLowerCase()) })
}, { immediate: true })
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
  target: null, busy: false, method: null,
  refundMethod: 'CASH', restockParts: true,
  quote: null, quoteError: false,
})

/* ── detail modal ────────────────────────────────────────────────── */
const detail = reactive({ open: false, service: null, editCost: 0, editDiagnosis: '', busy: false, newNote: '', noteBusy: false })
const detail_costChanged      = computed(() => detail.service && parseFloat(detail.editCost) !== parseFloat(detail.service.cost))
const detail_diagnosisChanged = computed(() => detail.service && detail.editDiagnosis.trim() !== (detail.service.diagnosis || '').trim())
const detail_hasChanges       = computed(() => detail_costChanged.value || detail_diagnosisChanged.value)

/* ── date formatter ──────────────────────────────────────────────── */
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function fmtDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
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
    if (techFilter.value) params.technician = techFilter.value
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
const payMethods = ref([])
async function loadPayMethods() {
  if (payMethods.value.length) return
  try {
    const { data } = await api.get('/api/finance/payment-methods/')
    payMethods.value = data.results ?? data
  } catch { payMethods.value = [] }
}
// The exact amount Done will bill (tax included) — from the server, never re-computed here.
const quoteTotal = computed(() => Number(confirm.quote?.grand_total) || 0)
async function loadQuote(s) {
  confirm.quote = null
  confirm.quoteError = false
  try {
    const { data } = await api.get(`/api/services/${s.id}/quote/`)
    if (confirm.target?.id === s.id) confirm.quote = data
  } catch { confirm.quoteError = true }
}
function confirmDone(s) {
  confirm.target = s
  confirm.method = null
  confirm.done = true
  loadPayMethods()
  loadQuote(s)
}
async function executeDone() {
  confirm.busy = true
  try {
    // expected_total: the server refuses (409) if the job changed since this window got its total.
    const body = { expected_total: confirm.quote.grand_total }
    if (confirm.method) body.method = confirm.method
    await api.post(`/api/services/${confirm.target.id}/done/`, body)
    confirm.done = false
    fetchItems(); fetchCounts()
  } catch (e) {
    alert(e?.response?.data?.detail ?? t('core.services.err_done'))
    if (e?.response?.status === 409) loadQuote(confirm.target)
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
    alert(e?.response?.data?.detail ?? t('core.services.err_cancel'))
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
    alert(e?.response?.data?.detail ?? t('core.services.err_archive'))
  } finally { confirm.busy = false }
}

/* ── invoice link ────────────────────────────────────────────────── */
function viewInvoice(s) {
  if (s.invoice) router.push(`/finance/invoices/${s.invoice}`)
}

/* ── return service ──────────────────────────────────────────────── */
function confirmReturn(s) {
  confirm.target = s
  confirm.refundMethod = 'CASH'
  confirm.restockParts = true
  confirm.return = true
}
async function executeReturn() {
  confirm.busy = true
  try {
    await api.post(`/api/services/${confirm.target.id}/return/`, {
      refund_method: confirm.refundMethod, restock_parts: confirm.restockParts,
    })
    confirm.return = false
    fetchItems(); fetchCounts()
  } catch (e) {
    alert(e?.response?.data?.detail ?? t('core.services.err_return'))
  } finally { confirm.busy = false }
}

/* ── detail modal ────────────────────────────────────────────────── */
function openDetail(s) {
  detail.service       = s
  detail.editCost      = parseFloat(s.cost) || 0
  detail.editDiagnosis = s.diagnosis || ''
  detail.open          = true
  detail.busy          = false
  detail.newNote       = ''
}

async function addNote() {
  const body = detail.newNote.trim()
  if (!body || detail.noteBusy) return
  detail.noteBusy = true
  try {
    const { data } = await api.post(`/api/services/${detail.service.id}/notes/`, { body })
    detail.service.notes = [...(detail.service.notes || []), data]
    detail.newNote = ''
  } catch (e) {
    alert(e?.response?.data?.detail ?? e?.response?.data?.body?.[0] ?? t('core.svcdesk.err_note'))
  } finally { detail.noteBusy = false }
}

async function _saveChangesIfAny() {
  if (!detail_hasChanges.value) return
  const payload = {}
  if (detail_costChanged.value)      payload.cost      = detail.editCost
  if (detail_diagnosisChanged.value) payload.diagnosis = detail.editDiagnosis.trim()
  const { data } = await api.patch(`/api/services/${detail.service.id}/`, payload)
  Object.assign(detail.service, data)
}

async function detailMarkDone() {
  detail.busy = true
  try {
    await _saveChangesIfAny()
    detail.open = false
    confirmDone(detail.service)   // same window as the list's Done: asks how the customer paid
  } catch (e) {
    alert(e?.response?.data?.detail ?? t('core.services.err_done'))
  } finally { detail.busy = false }
}

async function detailNotYet() {
  detail.busy = true
  try {
    await _saveChangesIfAny()
    detail.open = false
    fetchItems()
  } catch (e) {
    alert(e?.response?.data?.detail ?? t('core.services.err_cost'))
  } finally { detail.busy = false }
}

async function saveCost() {
  detail.busy = true
  try {
    await _saveChangesIfAny()
    detail.open = false
    fetchItems()
  } catch (e) {
    alert(e?.response?.data?.detail ?? t('core.services.err_cost'))
  } finally { detail.busy = false }
}

/* ── init ────────────────────────────────────────────────────────── */
onMounted(() => {
  fetchItems()
  fetchCounts()
  fetchServiceTypes()
  fetchTechnicians()
})
</script>

<style scoped>
/* Shared header / tab / button classes — these are NOT global; each page
   defines its own scoped copy. Services.vue was missing them, so the
   New Service button + tabs rendered unstyled. (s53) */
.page-title  { font-size:28px; font-weight:800; color:var(--text-primary); margin:0; letter-spacing:-0.4px; }
.page-sub    { font-size:13.5px; color:var(--text-muted); margin:4px 0 0; }
.header-actions { display:flex; align-items:center; gap:10px; }
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
.svc-filters { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.svc-tech-select { width: 180px; padding-left: 10px; }
.done-note { font-size: 12px; color: var(--text-muted); margin: 6px 0 0; }
.done-quote { display: flex; flex-wrap: wrap; gap: 6px 18px; margin-top: 8px; font-size: 13px; color: var(--text-secondary); }
.done-quote strong { color: var(--text-primary); }
.done-check { display: flex; align-items: center; gap: 8px; margin-top: 12px; font-size: 13px; color: var(--text-secondary); cursor: pointer; }
.done-check input { accent-color: var(--accent); }
.done-pay { margin-top: 14px; }
.done-pay-lbl { font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-bottom: 8px; }
.done-pay-methods { display: flex; flex-wrap: wrap; gap: 8px; }
.client-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.client-phone { font-size: 11px; color: var(--text-muted); }
.unit-line { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.unit-line .eta-badge { font-size: 10px; padding: 1px 6px; }

.eta-none { color: var(--text-muted); font-size: 12px; }
.eta-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
}
.eta-badge.ok { background: var(--success-soft); color: var(--success); }
.eta-badge.overdue { background: var(--danger-soft); color: var(--danger); }

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

.row-action.success { color: var(--success); }
.row-action.success:hover { background: var(--success-soft); }

/* ── detail modal ───────────────────────────────────────────── */
.det-body { display: flex; flex-direction: column; gap: 16px; }
.det-status-row { display: flex; align-items: center; gap: 10px; }
.det-serial { font-size: 16px; font-weight: 800; font-family: monospace; color: var(--text-primary); }
.det-badge {
  font-size: 11px; font-weight: 700; padding: 3px 10px;
  border-radius: 20px; text-transform: uppercase; letter-spacing: .04em;
}
.det-badge-open      { background: var(--info-soft); color: var(--info-hover); }
.det-badge-done      { background: var(--success-soft); color: var(--success); }
.det-badge-cancelled { background: #f3f4f6; color: #6b7280; }
.det-badge-archived  { background: var(--warning-soft); color: #92400e; }
.det-badge-returned  { background: #ede9fe; color: #7c3aed; }

.det-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.det-field { display: flex; flex-direction: column; gap: 3px; }
.det-full  { grid-column: 1 / -1; }
.det-lbl   { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; }
.det-val   { font-size: 13px; color: var(--text-primary); line-height: 1.5; }
.det-cost-input { max-width: 140px; padding: 6px 10px; font-size: 14px; font-weight: 600; }

.det-part { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; color: var(--text-primary); padding: 3px 0; border-bottom: 1px dashed var(--border); }
.det-totals { flex-direction: row; flex-wrap: wrap; gap: 6px 16px; align-items: center; font-size: 13px; color: var(--text-secondary); }
.det-totals strong { color: var(--text-primary); margin-left: 4px; }
.det-ref { font-size: 12px; font-weight: 600; color: var(--text-muted); }
.det-muted { color: var(--text-muted); }
.det-note { display: flex; flex-direction: column; gap: 2px; padding: 6px 0; border-bottom: 1px dashed var(--border); }
.det-note-meta { font-size: 11px; color: var(--text-muted); }
.det-note-add { display: flex; gap: 8px; margin-top: 6px; }
.det-note-add .form-input { flex: 1; }
.det-diagnosis { margin-top: 4px; border-top: 1px dashed var(--border); padding-top: 12px; }
.det-diagnosis-lbl { display: flex; align-items: center; gap: 8px; }
.det-diagnosis-hint { font-size: 10px; font-weight: 400; color: var(--text-muted); text-transform: none; letter-spacing: 0; }
.det-diagnosis-input { font-size: 13px; resize: vertical; min-height: 72px; }

.btn-success {
  padding: 8px 20px; border-radius: 8px; border: none;
  background: var(--success); color: #fff; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: opacity 120ms;
}
.btn-success:hover   { opacity: .88; }
.btn-success:disabled { opacity: .5; cursor: not-allowed; }

</style>
