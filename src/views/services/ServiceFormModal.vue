<template>
  <AppModal
    :open="open"
    :title="serviceId ? t('core.svcform.edit_title', { n: form.serial_number || t('core.services.service') }) : t('core.services.new_service')"
    width="860px"
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

        <!-- ══ FULL WIDTH: Device + technician (Upgrade 13) ══ -->
        <div class="sfm-full sfm-section">
          <div class="sfm-section-title">{{ t('core.svcdesk.device_section') }}</div>
          <div class="sfm-subrow">
            <div class="sfm-row">
              <label class="form-label">{{ t('core.svcdesk.device') }} <span class="sfm-opt">({{ t('common.optional') }})</span></label>
              <input v-model="form.device" class="form-input" :placeholder="t('core.svcdesk.device_ph')" />
            </div>
            <div class="sfm-row">
              <label class="form-label">{{ t('core.svcdesk.device_serial') }} <span class="sfm-opt">({{ t('common.optional') }})</span></label>
              <input v-model="form.device_serial" class="form-input" :placeholder="t('core.svcdesk.device_serial_ph')" dir="ltr" />
            </div>
          </div>
          <div class="sfm-subrow">
            <div class="sfm-row">
              <label class="form-label">{{ t('core.svcdesk.damage') }} <span class="sfm-opt">({{ t('common.optional') }})</span></label>
              <textarea v-model="form.damage" class="form-input" rows="2" :placeholder="t('core.svcdesk.damage_ph')" />
            </div>
            <div class="sfm-row">
              <label class="form-label">{{ t('core.svcdesk.technician') }}</label>
              <select v-model="form.technician" class="form-input">
                <option :value="null">{{ t('core.svcdesk.no_technician') }}</option>
                <option v-for="u in technicians" :key="u.id" :value="u.id">{{ u.name }}</option>
              </select>
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
        </div>

      </div>

      <!-- ══ Charges + parts (Upgrade 13) ══ -->
      <div class="sfm-section">
        <div class="sfm-section-title">{{ t('core.svcdesk.charges_section') }}</div>
        <p v-if="locked" class="sfm-locked">{{ t('core.svcdesk.parts_locked') }}</p>
        <div class="sfm-charges">
          <div class="sfm-row">
            <label class="form-label">{{ t('core.svcdesk.detection_fee') }}</label>
            <input v-model.number="form.detection_fee" type="number" min="0" step="0.01" class="form-input" placeholder="0.00" :disabled="locked" />
            <p class="sfm-hint">{{ t('core.svcdesk.detection_hint') }}</p>
          </div>
          <div class="sfm-row">
            <label class="form-label">{{ t('core.svcdesk.repair_charge') }}</label>
            <input v-model.number="form.cost" type="number" min="0" step="0.01" class="form-input" placeholder="0.00" :disabled="locked" />
            <p class="sfm-hint">{{ t('core.svcform.cost_hint') }}</p>
          </div>
          <div class="sfm-row">
            <label class="form-label">{{ t('core.svcdesk.warranty_days') }}</label>
            <input v-model.number="form.warranty_days" type="number" min="0" step="1" class="form-input" placeholder="0" />
            <p class="sfm-hint">{{ t('core.svcdesk.warranty_hint') }}</p>
          </div>
        </div>
        <label class="sfm-print-cb" :class="{ disabled: locked }">
          <input type="checkbox" v-model="form.is_warranty" :disabled="locked" />
          <span>{{ t('core.svcdesk.is_warranty') }}</span>
        </label>
        <p class="sfm-hint">{{ t('core.svcdesk.is_warranty_hint') }}</p>

        <div class="sfm-section-title sfm-parts-title">{{ t('core.svcdesk.parts_section') }}</div>
        <p class="sfm-hint">{{ t('core.svcdesk.parts_hint') }}</p>
        <div v-if="!locked" class="sfm-customer-search">
          <input
            v-model="partQuery"
            class="form-input"
            :placeholder="t('core.svcdesk.parts_search_ph')"
            @input="searchParts"
            @focus="showPartDropdown = true"
          />
          <div v-if="showPartDropdown && partResults.length" class="sfm-dropdown">
            <button
              v-for="p in partResults" :key="p.id"
              type="button" class="sfm-dropdown-item"
              @click="addPart(p)"
            >
              <span class="sfm-dd-name" dir="auto">{{ p.name }}</span>
              <span class="sfm-dd-phone">
                {{ p.sku_display || '' }} · {{ t('core.svcdesk.in_stock', { n: formatQty(p.default_variant_stock) }) }}
              </span>
            </button>
          </div>
        </div>

        <div v-if="form.parts.length" class="sfm-parts">
          <div class="sfm-part-row sfm-part-head">
            <span>{{ t('core.svcdesk.col_part') }}</span>
            <span>{{ t('core.svcdesk.col_qty') }}</span>
            <span>{{ t('core.svcdesk.col_price') }}</span>
            <span>{{ t('core.svcdesk.col_total') }}</span>
            <span></span>
          </div>
          <div v-for="(p, i) in form.parts" :key="p.id || p.key" class="sfm-part-row">
            <span class="sfm-part-name">
              <span dir="auto">{{ p.product_name }}</span>
              <span class="sfm-dd-phone">
                {{ p.sku || '' }}<template v-if="p.unit_cost != null"> · {{ t('core.svcdesk.col_unit_cost') }} <Money :value="p.unit_cost" /></template>
              </span>
            </span>
            <input v-model.number="p.quantity" type="number" min="0.001" step="1" class="form-input sfm-part-num" :disabled="locked" />
            <input v-model.number="p.unit_price" type="number" min="0" step="0.01" class="form-input sfm-part-num" :disabled="locked" />
            <span class="sfm-part-total"><Money :value="lineTotal(p)" /></span>
            <button v-if="!locked" type="button" class="sfm-clear-btn sfm-part-remove" :title="t('core.svcdesk.remove_part')" @click="form.parts.splice(i, 1)">×</button>
            <span v-else></span>
          </div>
        </div>
        <p v-else class="sfm-hint">{{ t('core.svcdesk.no_parts') }}</p>

        <div class="sfm-totals">
          <span>{{ t('core.svcdesk.labour') }} <strong><Money :value="labourTotal" /></strong></span>
          <span>{{ t('core.svcdesk.parts_total') }} <strong><Money :value="partsTotal" /></strong></span>
          <span>{{ t('core.svcdesk.est_total') }} <strong><Money :value="estTotal" /></strong></span>
        </div>
        <p class="sfm-hint">{{ form.is_warranty ? t('core.svcdesk.free_warranty') : t('core.svcdesk.tax_note') }}</p>
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
import Money from '@/components/ui/Money.vue'
import api from '@/api/axios'
import { formatQty, formatNumber } from '@/utils/format'
import { useAuthStore } from '@/stores/auth'
import { useQZTray } from '@/composables/useQZTray'
import { useShopLocale } from '@/composables/useShopLocale'

const { t } = useI18n()
const auth = useAuthStore()
const { sendRaw, isAvailable } = useQZTray()
// s167: the ticket prints in the SHOP's language (signed-in shop's default_language); raw thermal = English.
const { st, shopLang } = useShopLocale()
const rt = (key, params = {}) => t(key, params, { locale: 'en' })

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
  // Upgrade 13 — service desk
  device:        '',
  device_serial: '',
  damage:        '',
  technician:    null,
  detection_fee: 0,
  warranty_days: 0,
  is_warranty:   false,
  parts:         [],
  status:        'OPEN',
})

// A job that is no longer open (billed) keeps its charges + parts as they were — the server refuses changes.
const locked = computed(() => !!props.serviceId && form.status !== 'OPEN')

/* ── technicians (active users of this shop) ─────────────────────── */
const technicians = ref([])
async function loadTechnicians() {
  try {
    const { data } = await api.get('/api/services/technicians/')
    technicians.value = data
  } catch { technicians.value = [] }
}

/* ── parts from stock (search like the POS) ──────────────────────── */
const partQuery        = ref('')
const partResults      = ref([])
const showPartDropdown = ref(false)
let partTimer = null
let partKey = 0
function searchParts() {
  clearTimeout(partTimer)
  if (partQuery.value.trim().length < 2) { partResults.value = []; return }
  partTimer = setTimeout(async () => {
    try {
      const { data } = await api.get('/api/inventory/products/autocomplete/', {
        params: { q: partQuery.value.trim(), pos: 1 },
      })
      partResults.value = (data.results ?? data).filter(p => p.default_variant_id).slice(0, 8)
    } catch { partResults.value = [] }
  }, 250)
}
function addPart(p) {
  const same = form.parts.find(x => x.variant === p.default_variant_id)
  if (same) same.quantity = (Number(same.quantity) || 0) + 1
  else form.parts.push({
    key: `n${++partKey}`, variant: p.default_variant_id, product_name: p.name, sku: p.sku_display || '',
    quantity: 1, unit_price: Number(p.default_variant_price) || 0, unit_cost: null,
  })
  partQuery.value = ''
  partResults.value = []
  showPartDropdown.value = false
}
const round2 = n => Math.round((Number(n) || 0) * 100) / 100
function lineTotal(p) { return round2((Number(p.quantity) || 0) * (Number(p.unit_price) || 0)) }
const labourTotal = computed(() => form.is_warranty ? 0 : round2((Number(form.detection_fee) || 0) + (Number(form.cost) || 0)))
const partsTotal  = computed(() => form.is_warranty ? 0 : round2(form.parts.reduce((s, p) => s + lineTotal(p), 0)))
const estTotal    = computed(() => round2(labourTotal.value + partsTotal.value))

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
  partQuery.value = ''
  partResults.value = []
  loadPrintDefaults()
  loadTechnicians()

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
      device:        s.device ?? '',
      device_serial: s.device_serial ?? '',
      damage:        s.damage ?? '',
      technician:    s.technician ?? null,
      detection_fee: parseFloat(s.detection_fee) || 0,
      warranty_days: s.warranty_days ?? 0,
      is_warranty:   !!s.is_warranty,
      status:        s.status ?? 'OPEN',
      parts: (s.parts ?? []).map(p => ({
        id: p.id, variant: p.variant, product_name: p.product_name, sku: p.sku || '',
        quantity: parseFloat(p.quantity) || 0, unit_price: parseFloat(p.unit_price) || 0,
        unit_cost: p.unit_cost ?? null,
      })),
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
      device: '', device_serial: '', damage: '', technician: null,
      detection_fee: 0, warranty_days: 0, is_warranty: false, parts: [], status: 'OPEN',
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

// First readable message in a DRF error body (nested parts errors are lists of objects).
function firstError(v) {
  if (typeof v === 'string') return v
  if (Array.isArray(v)) { for (const x of v) { const m = firstError(x); if (m) return m } return '' }
  if (v && typeof v === 'object') { for (const x of Object.values(v)) { const m = firstError(x); if (m) return m } }
  return ''
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
    device:        form.device.trim(),
    device_serial: form.device_serial.trim(),
    damage:        form.damage.trim(),
    technician:    form.technician || null,
    warranty_days: Math.max(0, parseInt(form.warranty_days) || 0),
  }
  // Charges + parts only while the job is open (a billed job keeps what its invoice says).
  if (!locked.value) {
    payload.cost          = form.cost || 0
    payload.detection_fee = form.detection_fee || 0
    payload.is_warranty   = form.is_warranty
    payload.parts = form.parts.map(p => ({
      id: p.id, variant: p.variant, quantity: p.quantity || 0, unit_price: p.unit_price || 0,
    }))
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
      await doServicePrint(doublePrint.value ? 2 : 1, res?.data?.id)
    }
    emit('saved')
    emit('close')
  } catch (err) {
    const data = err?.response?.data
    if (data) {
      errorMsg.value = firstError(data) || t('core.svcform.err_save')
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

// s167 (Upgrade 12): the ticket fields, worded by a translator — `rt` (English) for the RAW
// thermal path (a raw ESC/POS printer can't join/right-to-left Arabic letters), `st` (the
// SHOP's language) for the browser receipt, so it reads the same whoever prints it.
function ticketFields(tr) {
  const walkIn     = tr('receipt.svc_walk_in')
  const clientName = form.freeText ? (form.client_name || walkIn) : (form.clientName || walkIn)
  return {
    storeName:   auth.storeName || 'Store',
    clientName,
    clientPhone: form.freeText ? (form.client_phone || '') : '',
    serial:      form.serial_number || props.serviceId?.slice(0, 8) || '—',
    stype:       form.service_type === '__custom__' ? form.custom_type : (form.service_type || '—'),
    rcvDate:     form.receive_date || '—',
    etaStr:      form.no_eta ? tr('receipt.svc_no_eta')
                   : tr('receipt.svc_eta_value', { d: form.eta_days || 0, h: form.eta_hours || 0 }),
    info:        form.info || '—',
    keeping:     form.keeping || '—',
    // Upgrade 13 — device, technician, parts, the price split and the repair warranty
    device:      form.device || '',
    serialNo:    form.device_serial || '',
    damage:      form.damage || '',
    technician:  technicians.value.find(u => u.id === form.technician)?.name || '',
    parts:       form.parts.map(p => ({ name: p.product_name || '', qty: formatQty(p.quantity), total: money(form.is_warranty ? 0 : lineTotal(p)) })),
    detection:   money(form.is_warranty ? 0 : form.detection_fee),
    repair:      money(form.is_warranty ? 0 : form.cost),
    // Totals = the server quote of the SAVED job (same tax rule as the invoice Done makes), when there is one.
    hasQuote:    !!ticketQuote.value,
    subtotal:    money(ticketQuote.value ? ticketQuote.value.subtotal : estTotal.value),
    tax:         money(ticketQuote.value ? ticketQuote.value.tax_total : 0),
    total:       money(ticketQuote.value ? ticketQuote.value.grand_total : estTotal.value),
    warranty:    Number(form.warranty_days) > 0 ? tr('receipt.svc_warranty_days', { n: Number(form.warranty_days) }) : '',
    warrantyJob: form.is_warranty ? tr('receipt.svc_warranty_job') : '',
  }
}
function money(n) { return `${auth.currencySymbol || ''} ${formatNumber(Number(n) || 0)}`.trim() }

function buildServiceESCPOS(copyKey) {
  const f = ticketFields(rt)
  const lbl = (k) => rt(k) + ':'

  let out = _INIT
  out += _CENTER
  out += _SIZE_2X + _BOLD_ON + _ln(f.storeName) + _SIZE_NRM + _BOLD_OFF
  out += _dashes()
  out += _BOLD_ON + _ln(rt(copyKey)) + _BOLD_OFF
  out += _ln(rt('receipt.svc_no', { serial: f.serial }))
  out += _dashes()
  out += _LEFT
  out += _two(lbl('receipt.svc_client'), (f.clientName + (f.clientPhone ? ' ' + f.clientPhone : '')).slice(0, _COLS - 10))
  out += _two(lbl('receipt.svc_service'), f.stype.slice(0, _COLS - 10))
  out += _two(lbl('receipt.svc_received'), f.rcvDate)
  out += _two(lbl('receipt.svc_eta'), f.etaStr.slice(0, _COLS - 6))
  out += _two(lbl('receipt.svc_items_kept'), f.keeping.slice(0, _COLS - 12))
  if (f.info && f.info !== '—') out += _two(lbl('receipt.svc_description'), f.info.slice(0, _COLS - 13))
  if (f.device)     out += _two(lbl('receipt.svc_device'), f.device.slice(0, _COLS - 10))
  if (f.serialNo)   out += _two(lbl('receipt.svc_serial_no'), f.serialNo.slice(0, _COLS - 10))
  if (f.damage)     out += _two(lbl('receipt.svc_damage'), f.damage.slice(0, _COLS - 10))
  if (f.technician) out += _two(lbl('receipt.svc_technician'), f.technician.slice(0, _COLS - 14))
  out += _dashes()
  if (f.parts.length) {
    out += _BOLD_ON + _ln(rt('receipt.svc_parts')) + _BOLD_OFF
    for (const p of f.parts) out += _two(`${p.qty} x ${p.name}`.slice(0, _COLS - p.total.length - 2), p.total)
  }
  out += _two(lbl('receipt.svc_detection'), f.detection)
  out += _two(lbl('receipt.svc_repair'), f.repair)
  if (f.hasQuote) {
    out += _two(lbl('receipt.svc_subtotal'), f.subtotal)
    out += _two(lbl('receipt.svc_tax'), f.tax)
    out += _BOLD_ON + _two(rt('receipt.svc_grand_total').toUpperCase() + ':', f.total) + _BOLD_OFF
  } else {
    out += _BOLD_ON + _two(rt('receipt.svc_total_est').toUpperCase() + ':', f.total) + _BOLD_OFF
  }
  if (f.warrantyJob) out += _ln(f.warrantyJob)
  if (f.warranty)    out += _two(lbl('receipt.svc_warranty'), f.warranty)
  out += _dashes()
  out += _CENTER + _ln(rt('receipt.svc_thanks', { store: f.storeName })) + _LEFT
  out += _LF + _LF + _LF + _CUT
  return out
}

// Text typed by staff goes into a document.write() page — escape it.
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function printReceiptCSS(copies = 2) {
  const f = ticketFields(st)
  const lang = shopLang.value

  const block = (titleKey) => `
    <div class="receipt">
      <div class="r-header">
        <div class="r-store" dir="auto">${esc(f.storeName)}</div>
        <div class="r-type">${esc(st(titleKey))}</div>
      </div>
      <div class="r-serial" dir="auto">${esc(st('receipt.svc_no', { serial: f.serial }))}</div>
      <table class="r-table">
        <tr><td class="r-lbl">${esc(st('receipt.svc_client'))}</td><td dir="auto">${esc(f.clientName)}${f.clientPhone ? ' · ' + esc(f.clientPhone) : ''}</td></tr>
        <tr><td class="r-lbl">${esc(st('receipt.svc_service'))}</td><td dir="auto">${esc(f.stype)}</td></tr>
        <tr><td class="r-lbl">${esc(st('receipt.svc_received'))}</td><td>${esc(f.rcvDate)}</td></tr>
        <tr><td class="r-lbl">${esc(st('receipt.svc_eta'))}</td><td dir="auto">${esc(f.etaStr)}</td></tr>
        <tr><td class="r-lbl">${esc(st('receipt.svc_items_kept'))}</td><td dir="auto">${esc(f.keeping)}</td></tr>
        <tr><td class="r-lbl">${esc(st('receipt.svc_description'))}</td><td dir="auto">${esc(f.info)}</td></tr>
        ${f.device ? `<tr><td class="r-lbl">${esc(st('receipt.svc_device'))}</td><td dir="auto">${esc(f.device)}</td></tr>` : ''}
        ${f.serialNo ? `<tr><td class="r-lbl">${esc(st('receipt.svc_serial_no'))}</td><td dir="ltr">${esc(f.serialNo)}</td></tr>` : ''}
        ${f.damage ? `<tr><td class="r-lbl">${esc(st('receipt.svc_damage'))}</td><td dir="auto">${esc(f.damage)}</td></tr>` : ''}
        ${f.technician ? `<tr><td class="r-lbl">${esc(st('receipt.svc_technician'))}</td><td dir="auto">${esc(f.technician)}</td></tr>` : ''}
      </table>
      ${f.parts.length ? `<div class="r-sub">${esc(st('receipt.svc_parts'))}</div>
      <table class="r-table">${f.parts.map(p => `<tr><td dir="auto">${esc(p.qty)} × ${esc(p.name)}</td><td class="r-amt">${esc(p.total)}</td></tr>`).join('')}</table>` : ''}
      <table class="r-table">
        <tr><td class="r-lbl">${esc(st('receipt.svc_detection'))}</td><td class="r-amt">${esc(f.detection)}</td></tr>
        <tr><td class="r-lbl">${esc(st('receipt.svc_repair'))}</td><td class="r-amt">${esc(f.repair)}</td></tr>
        ${f.hasQuote ? `<tr><td class="r-lbl">${esc(st('receipt.svc_subtotal'))}</td><td class="r-amt">${esc(f.subtotal)}</td></tr>
        <tr><td class="r-lbl">${esc(st('receipt.svc_tax'))}</td><td class="r-amt">${esc(f.tax)}</td></tr>
        <tr><td class="r-lbl">${esc(st('receipt.svc_grand_total'))}</td><td class="r-amt"><strong>${esc(f.total)}</strong></td></tr>`
          : `<tr><td class="r-lbl">${esc(st('receipt.svc_total_est'))}</td><td class="r-amt"><strong>${esc(f.total)}</strong></td></tr>`}
        ${f.warrantyJob ? `<tr><td colspan="2" dir="auto"><strong>${esc(f.warrantyJob)}</strong></td></tr>` : ''}
        ${f.warranty ? `<tr><td class="r-lbl">${esc(st('receipt.svc_warranty'))}</td><td dir="auto">${esc(f.warranty)}</td></tr>` : ''}
      </table>
      <div class="r-footer" dir="auto">${esc(st('receipt.svc_thanks', { store: f.storeName }))}</div>
    </div>`

  // Layout stays LTR (dir="ltr"); lang marks the text for fonts/shaping. Arabic: no letter-spacing.
  const html = `<!DOCTYPE html><html lang="${lang}" dir="ltr"><head><meta charset="utf-8"><title>${esc(st('receipt.svc_doc_title'))}</title>
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
    .r-table td { padding: 1.5mm 1mm; vertical-align: top; font-size: 10px; line-height: 1.4; overflow-wrap: anywhere; }
    .r-lbl    { color: #444; width: 30%; white-space: nowrap; font-weight: bold; }
    .r-amt    { text-align: right; white-space: nowrap; }
    .r-sub    { font-size: 10px; font-weight: bold; border-top: 1px dashed #999; padding-top: 2mm; }
    .r-footer { text-align: center; font-size: 9px; color: #666; border-top: 1px dashed #999; padding-top: 3mm; margin-top: 2mm; }
    html[lang="ar"] .r-store, html[lang="ar"] .r-serial { letter-spacing: 0; }
    @media screen { body { background: #e5e5e5; width: auto; padding: 10px 0; } .receipt { border: 1px dashed #aaa; margin: 10px auto; background: #fff; } }
    @media print  { body { background: #fff; margin: 0; } }
  </style></head><body>
    ${block('receipt.svc_client_copy')}
    ${copies >= 2 ? block('receipt.svc_store_copy') : ''}
  </body></html>`

  const w = window.open('', '_blank', 'width=340,height=580')
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => { w.print() }, 400)
}

const ticketQuote = ref(null)
// `jobId` = the saved job (the edit's id, or the new job's id right after Create). The ticket's totals come from
// its server quote, so the printed total is the taxed amount Done will bill.
async function doServicePrint(copies = 2, jobId = props.serviceId) {
  ticketQuote.value = null
  if (jobId) {
    try { ticketQuote.value = (await api.get(`/api/services/${jobId}/quote/`)).data } catch { /* pre-tax fallback */ }
  }
  try {
    const available = await isAvailable()
    if (available) {
      const settingsRes = await api.get('/api/core/settings/')
      const printerName = settingsRes.data.receipt_printer_name || ''
      if (printerName) {
        await sendRaw(printerName, buildServiceESCPOS('receipt.svc_client_copy'))
        if (copies >= 2) await sendRaw(printerName, buildServiceESCPOS('receipt.svc_store_copy'))
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

/* ── Upgrade 13: device / charges / parts ── */
.sfm-section { display: flex; flex-direction: column; gap: 10px; padding-top: 12px; border-top: 1px solid var(--border); }
.sfm-section-title { font-size: 12px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: .05em; }
.sfm-parts-title { margin-top: 6px; }
.sfm-locked { font-size: 12px; color: var(--warning); background: var(--warning-soft); border-radius: 8px; padding: 8px 12px; margin: 0; }
.sfm-charges { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px 16px; }
.sfm-parts { display: flex; flex-direction: column; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.sfm-part-row {
  display: grid; grid-template-columns: minmax(0, 1fr) 90px 110px 110px 28px;
  gap: 10px; align-items: center; padding: 8px 10px; border-top: 1px solid var(--border);
}
.sfm-part-row:first-child { border-top: none; }
.sfm-part-head { background: var(--bg-app); font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; }
.sfm-part-name { display: flex; flex-direction: column; gap: 2px; font-size: 13px; font-weight: 600; color: var(--text-primary); min-width: 0; }
.sfm-part-num { padding: 5px 8px; font-size: 13px; }
.sfm-part-total { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.sfm-part-remove { color: var(--danger); font-size: 18px; }
.sfm-totals { display: flex; flex-wrap: wrap; gap: 8px 22px; justify-content: flex-end; font-size: 13px; color: var(--text-secondary); }
.sfm-totals strong { color: var(--text-primary); margin-left: 4px; }
@media (max-width: 600px) {
  .sfm-charges { grid-template-columns: 1fr; }
  .sfm-part-row { grid-template-columns: minmax(0, 1fr) 70px 90px 28px; }
  .sfm-part-row > :nth-child(4) { display: none; }
}

.sfm-checkbox-row { display: flex; align-items: center; gap: 8px; }
.sfm-check-label { font-size: 13px; color: var(--text-secondary); cursor: pointer; user-select: none; }

.sfm-eta-row { display: flex; gap: 16px; margin-top: 8px; }
.sfm-eta-field { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.sfm-eta-label { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; }
</style>
