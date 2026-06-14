<template>
  <AppModal
    :open="open"
    :title="serviceId ? t('core.svcform.edit_title', { n: form.serial_number || t('core.services.service') }) : t('core.services.new_service')"
    width="760px"
    no-backdrop-close
    @close="$emit('close')"
  >
    <div class="sfm-form">

      <div class="sfm-grid">

        <!-- ══ FULL WIDTH: Client ══ -->
        <div class="sfm-full">
          <!-- Client: toggle registered vs free-text -->
          <div class="sfm-row">
            <label class="form-label">{{ t('core.services.col_client') }}</label>
            <div class="sfm-toggle-row">
              <button
                type="button" class="sfm-toggle-btn" :class="{ active: !form.freeText }"
                @click="form.freeText = false"
              >{{ t('core.svcform.registered') }}</button>
              <button
                type="button" class="sfm-toggle-btn" :class="{ active: form.freeText }"
                @click="form.freeText = true"
              >{{ t('core.svcform.walkin') }}</button>
            </div>
          </div>

          <!-- Registered customer search -->
          <div v-if="!form.freeText" class="sfm-row">
            <label class="form-label">{{ t('core.svcform.customer') }}</label>
            <div class="sfm-customer-search">
              <input
                v-model="customerQuery"
                class="form-input"
                :placeholder="t('core.svcform.search_customer')"
                @input="searchCustomers"
                @focus="showDropdown = true"
              />
              <div v-if="showDropdown && customerResults.length" class="sfm-dropdown">
                <button
                  v-for="c in customerResults" :key="c.id"
                  type="button" class="sfm-dropdown-item"
                  @click="selectCustomer(c)"
                >
                  <span class="sfm-dd-name">{{ c.name }}</span>
                  <span class="sfm-dd-phone">{{ c.phone_number || '' }}</span>
                </button>
              </div>
              <div v-if="form.client" class="sfm-selected-customer">
                <span>{{ form.clientName }}</span>
                <button type="button" class="sfm-clear-btn" @click="clearCustomer">×</button>
              </div>
            </div>
          </div>

          <!-- Free-text client -->
          <div v-if="form.freeText" class="sfm-subrow">
            <div class="sfm-row">
              <label class="form-label">{{ t('core.svcform.client_name') }} <span class="sfm-opt">({{ t('common.optional') }})</span></label>
              <input v-model="form.client_name" class="form-input" :placeholder="t('core.svcform.client_name_ph')" />
            </div>
            <div class="sfm-row">
              <label class="form-label">{{ t('core.svcform.client_phone') }} <span class="sfm-opt">({{ t('common.optional') }})</span></label>
              <input v-model="form.client_phone" class="form-input" placeholder="e.g. 01012345678" />
            </div>
          </div>
        </div>

        <!-- ══ LEFT COLUMN ══ -->
        <div class="sfm-col">
          <!-- Service type -->
          <div class="sfm-row">
            <label class="form-label">{{ t('core.services.col_type') }}</label>
            <select v-model="form.service_type" class="form-input">
              <option value="">{{ t('core.svcform.select_type') }}</option>
              <option v-for="st in serviceTypes" :key="st" :value="st">{{ st }}</option>
              <option value="__custom__">{{ t('core.svcform.other_custom') }}</option>
            </select>
            <input
              v-if="form.service_type === '__custom__'"
              v-model="form.custom_type"
              class="form-input"
              style="margin-top:6px;"
              :placeholder="t('core.svcform.custom_ph')"
            />
          </div>

          <!-- Receive Date -->
          <div class="sfm-row">
            <label class="form-label">{{ t('core.svcform.receive_date') }}</label>
            <input v-model="form.receive_date" type="date" class="form-input" />
          </div>

          <!-- ETA -->
          <div class="sfm-row">
            <label class="form-label">ETA</label>
            <div class="sfm-checkbox-row">
              <input id="no_eta" type="checkbox" v-model="form.no_eta" />
              <label for="no_eta" class="sfm-check-label">{{ t('core.services.no_eta') }}</label>
            </div>
            <div v-if="!form.no_eta" class="sfm-eta-row">
              <div class="sfm-eta-field">
                <label class="sfm-eta-label">{{ t('core.svcform.days') }}</label>
                <select v-model.number="form.eta_days" class="form-input">
                  <option :value="null">0</option>
                  <option v-for="d in 31" :key="d" :value="d">{{ d }}</option>
                </select>
              </div>
              <div class="sfm-eta-field">
                <label class="sfm-eta-label">{{ t('core.svcform.hours') }}</label>
                <select v-model.number="form.eta_hours" class="form-input">
                  <option :value="null">0</option>
                  <option v-for="h in 24" :key="h" :value="h">{{ h }}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- ══ RIGHT COLUMN ══ -->
        <div class="sfm-col">
          <!-- Info (problem description) -->
          <div class="sfm-row">
            <label class="form-label">{{ t('core.svcform.problem') }} <span class="sfm-opt">({{ t('common.optional') }})</span></label>
            <textarea
              v-model="form.info"
              class="form-input"
              rows="2"
              :placeholder="t('core.svcform.problem_ph')"
            />
          </div>

          <!-- Keeping (items received) -->
          <div class="sfm-row">
            <label class="form-label">{{ t('core.svcform.items_received') }} <span class="sfm-opt">({{ t('common.optional') }})</span></label>
            <input
              v-model="form.keeping"
              class="form-input"
              :placeholder="t('core.svcform.items_ph')"
            />
            <p class="sfm-hint">{{ t('core.svcform.items_hint') }}</p>
          </div>

          <!-- Cost -->
          <div class="sfm-row">
            <label class="form-label">{{ t('core.services.col_cost') }}</label>
            <input
              v-model.number="form.cost"
              type="number" min="0" step="0.01"
              class="form-input"
              placeholder="0.00"
            />
            <p class="sfm-hint">{{ t('core.svcform.cost_hint') }}</p>
          </div>
        </div>

      </div>

      <!-- Print options -->
      <div class="sfm-print-opts">
        <label class="sfm-print-cb">
          <input type="checkbox" v-model="printReceipt" />
          <span>{{ t('core.svcform.print_receipt') }}</span>
        </label>
        <label class="sfm-print-cb" :class="{ disabled: !printReceipt }">
          <input type="checkbox" v-model="doublePrint" :disabled="!printReceipt" />
          <span>{{ t('core.svcform.double_print') }}</span>
        </label>
        <span class="sfm-print-hint">{{ t('core.svcform.ctrl_s') }}</span>
      </div>

      <p v-if="errorMsg" class="sfm-error">{{ errorMsg }}</p>
    </div>

    <template #footer>
      <button v-if="serviceId" class="btn-ghost sfm-print-btn" @click="doServicePrint(doublePrint ? 2 : 1)" :title="t('core.svcform.print_now')">
        🖨 {{ t('settings.billing.print') }}
      </button>
      <div style="flex:1;" />
      <button class="btn-ghost" @click="$emit('close')">{{ t('common.cancel') }}</button>
      <button
        class="btn-primary"
        :disabled="!canSave || saving"
        @click="save"
      >{{ saving ? t('common.saving') : (serviceId ? t('settings.store.save_changes') : t('core.svcform.create')) }}</button>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import AppModal from '@/components/ui/AppModal.vue'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import { useQZTray } from '@/composables/useQZTray'

const { t } = useI18n()
const auth = useAuthStore()
const { sendRaw, isAvailable } = useQZTray()

const props = defineProps({
  open:         { type: Boolean, default: false },
  serviceId:    { type: String,  default: null },
  serviceData:  { type: Object,  default: null },
  serviceTypes: { type: Array,   default: () => [] },
})
const emit = defineEmits(['close', 'saved'])

const saving   = ref(false)
const errorMsg = ref('')

/* ── print options (pre-checked from store defaults) ─────────────── */
const printReceipt = ref(true)
const doublePrint  = ref(true)

/* ── Ctrl+S to save (not Enter) ──────────────────────────────────── */
function handleKey(e) {
  if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S') && props.open) {
    e.preventDefault()
    if (canSave.value && !saving.value) save()
  }
}
onMounted(() => document.addEventListener('keydown', handleKey))
onUnmounted(() => document.removeEventListener('keydown', handleKey))

/* ── form state ─────────────────────────────────────────────────── */
const form = reactive({
  freeText:     false,
  client:       null,
  clientName:   '',
  client_name:  '',
  client_phone: '',
  service_type: '',
  custom_type:  '',
  receive_date: todayStr(),
  no_eta:       true,
  eta_days:     null,
  eta_hours:    null,
  info:         '',
  keeping:      '',
  cost:         0,
  serial_number: '',
})

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

/* ── customer search ─────────────────────────────────────────────── */
const customerQuery   = ref('')
const customerResults = ref([])
const showDropdown    = ref(false)

let searchTimer = null
async function searchCustomers() {
  clearTimeout(searchTimer)
  if (customerQuery.value.trim().length < 2) { customerResults.value = []; return }
  searchTimer = setTimeout(async () => {
    const { data } = await api.get('/api/auth/customers/', {
      params: { search: customerQuery.value.trim(), page_size: 8, is_walk_in: false },
    })
    customerResults.value = data.results ?? data
  }, 250)
}

function selectCustomer(c) {
  form.client     = c.id
  form.clientName = c.name
  customerQuery.value = c.name
  showDropdown.value  = false
  customerResults.value = []
}

function clearCustomer() {
  form.client     = null
  form.clientName = ''
  customerQuery.value = ''
}

/* ── validation ──────────────────────────────────────────────────── */
const canSave = computed(() => {
  if (!form.receive_date) return false
  const type = form.service_type === '__custom__' ? form.custom_type.trim() : form.service_type
  if (!type) return false
  return true
})

/* ── reset on open ───────────────────────────────────────────────── */
watch(() => props.open, (val) => {
  if (!val) return
  errorMsg.value = ''
  clearCustomer()
  customerResults.value = []
  loadPrintDefaults()

  if (props.serviceData) {
    const s = props.serviceData
    Object.assign(form, {
      freeText:     !s.client,
      client:       s.client ?? null,
      clientName:   s.client_display_name ?? '',
      client_name:  s.client_name ?? '',
      client_phone: s.client_phone ?? '',
      service_type: s.service_type ?? '',
      custom_type:  '',
      receive_date: s.receive_date ?? todayStr(),
      no_eta:       s.no_eta ?? true,
      eta_days:     s.eta_days ?? null,
      eta_hours:    s.eta_hours ?? null,
      info:         s.info ?? '',
      keeping:      s.keeping ?? '',
      cost:         parseFloat(s.cost) || 0,
      serial_number: s.serial_number ?? '',
    })
    if (form.client) customerQuery.value = form.clientName
  } else {
    Object.assign(form, {
      freeText: false, client: null, clientName: '',
      client_name: '', client_phone: '',
      service_type: '', custom_type: '',
      receive_date: todayStr(),
      no_eta: true, eta_days: null, eta_hours: null,
      info: '', keeping: '', cost: 0, serial_number: '',
    })
  }
})

/* ── print defaults from store settings ──────────────────────────── */
async function loadPrintDefaults() {
  try {
    const { data } = await api.get('/api/core/settings/')
    printReceipt.value = data.srv_print_default ?? true
    doublePrint.value  = data.srv_double_print_default ?? true
  } catch {
    // keep safe fallbacks
  }
}

/* ── save ────────────────────────────────────────────────────────── */
async function save() {
  if (!canSave.value || saving.value) return
  errorMsg.value = ''
  saving.value   = true

  const serviceType = form.service_type === '__custom__'
    ? form.custom_type.trim()
    : form.service_type

  const payload = {
    service_type: serviceType,
    receive_date: form.receive_date,
    no_eta:       form.no_eta,
    info:         form.info.trim(),
    keeping:      form.keeping.trim(),
    cost:         form.cost || 0,
  }

  if (!form.no_eta) {
    payload.eta_days  = form.eta_days  || 0
    payload.eta_hours = form.eta_hours || 0
  }

  if (form.freeText) {
    payload.client       = null
    payload.client_name  = form.client_name.trim()
    payload.client_phone = form.client_phone.trim()
  } else {
    payload.client       = form.client || null
    payload.client_name  = ''
    payload.client_phone = ''
  }

  try {
    const res = props.serviceId
      ? await api.patch(`/api/services/${props.serviceId}/`, payload)
      : await api.post('/api/services/', payload)
    // Print before closing — fill in the backend-generated serial first.
    if (printReceipt.value) {
      if (res?.data?.serial_number) form.serial_number = res.data.serial_number
      await doServicePrint(doublePrint.value ? 2 : 1)
    }
    emit('saved')
    emit('close')
  } catch (err) {
    const data = err?.response?.data
    if (data) {
      const msgs = Object.values(data).flat()
      errorMsg.value = msgs[0] || t('core.svcform.err_save')
    } else {
      errorMsg.value = t('core.svcform.err_save')
    }
  } finally {
    saving.value = false
  }
}

/* ── Print receipt ───────────────────────────────────────────── */

// ESC/POS constants
const _ESC = '\x1B', _GS = '\x1D', _LF = '\x0A'
const _INIT    = _ESC + '\x40'
const _CENTER  = _ESC + '\x61\x01'
const _LEFT    = _ESC + '\x61\x00'
const _BOLD_ON = _ESC + '\x45\x01'
const _BOLD_OFF= _ESC + '\x45\x00'
const _SIZE_2X = _ESC + '\x21\x30'
const _SIZE_NRM= _ESC + '\x21\x00'
const _CUT     = _GS  + '\x56\x42\x05'
const _COLS    = 48

function _ln(t = '') { return t + _LF }
function _dashes() { return '-'.repeat(_COLS) + _LF }
function _two(l, r) { return l + ' '.repeat(Math.max(1, _COLS - l.length - r.length)) + r + _LF }

function buildServiceESCPOS(copy) {
  const storeName  = auth.storeName || auth.activeStore?.name || 'Store'
  const clientName = form.freeText ? (form.client_name || 'Walk-in') : (form.clientName || 'Walk-in')
  const clientPhone= form.freeText ? (form.client_phone || '') : ''
  const serial     = form.serial_number || props.serviceId?.slice(0, 8) || '—'
  const stype      = form.service_type === '__custom__' ? form.custom_type : (form.service_type || '—')
  const rcvDate    = form.receive_date || '—'
  const etaStr     = form.no_eta ? 'No ETA' : `${form.eta_days || 0}d ${form.eta_hours || 0}h from receive`
  const info       = form.info || '—'
  const keeping    = form.keeping || '—'
  const cost       = `${auth.currencySymbol || ''} ${form.cost || 0}`

  let out = _INIT
  out += _CENTER
  out += _SIZE_2X + _BOLD_ON + _ln(storeName) + _SIZE_NRM + _BOLD_OFF
  out += _dashes()
  out += _BOLD_ON + _ln(copy) + _BOLD_OFF
  out += _ln('SRV# ' + serial)
  out += _dashes()
  out += _LEFT
  out += _two('Client:', (clientName + (clientPhone ? ' ' + clientPhone : '')).slice(0, _COLS - 10))
  out += _two('Service:', stype.slice(0, _COLS - 10))
  out += _two('Received:', rcvDate)
  out += _two('ETA:', etaStr.slice(0, _COLS - 6))
  out += _two('Items:', keeping.slice(0, _COLS - 8))
  if (info && info !== '—') out += _two('Info:', info.slice(0, _COLS - 7))
  out += _dashes()
  out += _BOLD_ON + _two('COST:', cost) + _BOLD_OFF
  out += _dashes()
  out += _CENTER + _ln('Thank you for choosing ' + storeName) + _LEFT
  out += _LF + _LF + _LF + _CUT
  return out
}

function printReceiptCSS(copies = 2) {
  const storeName  = auth.storeName || auth.activeStore?.name || 'Store'
  const clientName = form.freeText ? (form.client_name || 'Walk-in') : (form.clientName || 'Walk-in')
  const clientPhone = form.freeText ? (form.client_phone || '') : ''
  const serial     = form.serial_number || props.serviceId?.slice(0, 8) || '—'
  const stype      = form.service_type === '__custom__' ? form.custom_type : (form.service_type || '—')
  const rcvDate    = form.receive_date || '—'
  const etaStr     = form.no_eta ? 'No ETA' : `${form.eta_days || 0}d ${form.eta_hours || 0}h from receive`
  const info       = form.info || '—'
  const keeping    = form.keeping || '—'
  const cost       = `${auth.currencySymbol || ''} ${form.cost || 0}`

  const block = (title) => `
    <div class="receipt">
      <div class="r-header">
        <div class="r-store">${storeName}</div>
        <div class="r-type">${title}</div>
      </div>
      <div class="r-serial">SRV# ${serial}</div>
      <table class="r-table">
        <tr><td class="r-lbl">Client</td><td>${clientName}${clientPhone ? ' · ' + clientPhone : ''}</td></tr>
        <tr><td class="r-lbl">Service</td><td>${stype}</td></tr>
        <tr><td class="r-lbl">Received</td><td>${rcvDate}</td></tr>
        <tr><td class="r-lbl">ETA</td><td>${etaStr}</td></tr>
        <tr><td class="r-lbl">Items kept</td><td>${keeping}</td></tr>
        <tr><td class="r-lbl">Description</td><td>${info}</td></tr>
        <tr><td class="r-lbl">Cost</td><td><strong>${cost}</strong></td></tr>
      </table>
      <div class="r-footer">Thank you for choosing ${storeName}</div>
    </div>`

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Service Receipt</title>
  <style>
    @page { size: 80mm auto; margin: 0; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Courier New', monospace; font-size: 11px; background: #fff; width: 80mm; }
    .receipt { width: 80mm; padding: 5mm 4mm 6mm; page-break-after: always; break-after: page; }
    .receipt:last-child { page-break-after: auto; break-after: auto; }
    .r-header { text-align: center; border-bottom: 1px dashed #999; padding-bottom: 4mm; margin-bottom: 3mm; }
    .r-store  { font-size: 14px; font-weight: bold; letter-spacing: .05em; }
    .r-type   { font-size: 9px; background: #000; color: #fff; display: inline-block; padding: 1px 7px; margin-top: 2mm; }
    .r-serial { font-size: 13px; font-weight: bold; text-align: center; margin: 3mm 0; letter-spacing: .12em; }
    .r-table  { width: 100%; border-collapse: collapse; margin-bottom: 3mm; }
    .r-table td { padding: 1.5mm 1mm; vertical-align: top; font-size: 10px; line-height: 1.4; }
    .r-lbl    { color: #444; width: 30%; white-space: nowrap; font-weight: bold; }
    .r-footer { text-align: center; font-size: 9px; color: #666; border-top: 1px dashed #999; padding-top: 3mm; margin-top: 2mm; }
    @media screen { body { background: #e5e5e5; width: auto; padding: 10px 0; } .receipt { border: 1px dashed #aaa; margin: 10px auto; background: #fff; } }
    @media print  { body { background: #fff; margin: 0; } }
  </style></head><body>
    ${block('CLIENT RECEIPT')}
    ${copies >= 2 ? block('STORE RECEIPT') : ''}
  </body></html>`

  const w = window.open('', '_blank', 'width=340,height=580')
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => { w.print() }, 400)
}

async function doServicePrint(copies = 2) {
  try {
    const available = await isAvailable()
    if (available) {
      const settingsRes = await api.get('/api/core/settings/')
      const printerName = settingsRes.data.receipt_printer_name || ''
      if (printerName) {
        await sendRaw(printerName, buildServiceESCPOS('CLIENT RECEIPT'))
        if (copies >= 2) await sendRaw(printerName, buildServiceESCPOS('STORE RECEIPT'))
        return
      }
    }
  } catch {
    // silent — fall through to CSS print
  }
  printReceiptCSS(copies)
}
</script>

<style scoped>
/* Footer buttons — scoped classes were missing, so Cancel / Create Service
   rendered as bare text. (s53) */

.sfm-form { display: flex; flex-direction: column; gap: 14px; }
.sfm-row  { display: flex; flex-direction: column; gap: 5px; }

/* Two-column layout: client block spans full width, then two field columns.
   Keeps the modal short so the Create button stays visible on small laptops. */
.sfm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 20px; }
.sfm-full { grid-column: 1 / -1; display: flex; flex-direction: column; gap: 14px; }
.sfm-col  { display: flex; flex-direction: column; gap: 14px; }
.sfm-subrow { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
@media (max-width: 600px) {
  .sfm-grid { grid-template-columns: 1fr; }
  .sfm-subrow { grid-template-columns: 1fr; }
}

.sfm-print-opts {
  display: flex; align-items: center; gap: 22px;
  padding: 12px 4px 2px; margin-top: 2px; border-top: 1px solid var(--border);
}
.sfm-print-cb { display: flex; align-items: center; gap: 9px; font-size: 13px; font-weight: 600; color: var(--text-secondary); cursor: pointer; user-select: none; }
.sfm-print-cb input { width: 16px; height: 16px; accent-color: var(--accent); cursor: pointer; }
.sfm-print-cb.disabled { opacity: .45; cursor: not-allowed; }
.sfm-print-cb.disabled input { cursor: not-allowed; }
.sfm-print-hint { margin-left: auto; font-size: 11.5px; color: var(--text-muted); }

.sfm-print-btn { color: var(--text-secondary); }
.sfm-opt  { font-size: 11px; font-weight: 400; color: var(--text-muted); margin-left: 4px; }
.sfm-hint { font-size: 11px; color: var(--text-muted); margin: 3px 0 0; }
.sfm-error { font-size: 12px; color: var(--danger); background: var(--danger-soft); border-radius: 8px; padding: 8px 12px; }

.sfm-toggle-row { display: flex; gap: 8px; }
.sfm-toggle-btn {
  flex: 1;
  padding: 7px 14px;
  border-radius: 8px;
  border: 1.5px solid var(--border);
  background: var(--bg-app);
  color: var(--text-secondary);
  font-size: 13px; font-weight: 600;
  cursor: pointer;
  transition: border-color 120ms, background 120ms, color 120ms;
}
.sfm-toggle-btn.active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent);
}

.sfm-customer-search { position: relative; }
.sfm-dropdown {
  position: absolute; top: 100%; left: 0; right: 0; z-index: 100;
  background: var(--bg-card);
  border: 1.5px solid var(--border);
  border-radius: 8px;
  max-height: 200px; overflow-y: auto;
  box-shadow: var(--shadow-card);
}
.sfm-dropdown-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 12px; width: 100%;
  background: none; border: none; cursor: pointer;
  text-align: left; gap: 12px;
  transition: background 100ms;
}
.sfm-dropdown-item:hover { background: var(--bg-hover); }
.sfm-dd-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.sfm-dd-phone { font-size: 11px; color: var(--text-muted); }

.sfm-selected-customer {
  display: inline-flex; align-items: center; gap: 8px;
  margin-top: 6px;
  padding: 4px 10px;
  background: var(--accent-soft);
  border: 1.5px solid var(--accent);
  border-radius: 20px;
  font-size: 12px; font-weight: 600; color: var(--accent);
}
.sfm-clear-btn {
  background: none; border: none; cursor: pointer;
  color: var(--accent); font-size: 16px; line-height: 1; padding: 0;
}

.sfm-checkbox-row { display: flex; align-items: center; gap: 8px; }
.sfm-check-label { font-size: 13px; color: var(--text-secondary); cursor: pointer; user-select: none; }

.sfm-eta-row { display: flex; gap: 16px; margin-top: 8px; }
.sfm-eta-field { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.sfm-eta-label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; }
</style>
