<template>
  <AppModal
    :open="open"
    :title="serviceId ? `Edit ${form.serial_number || 'Service'}` : 'New Service'"
    @close="$emit('close')"
  >
    <div class="sfm-form">

      <!-- Client: toggle registered vs free-text -->
      <div class="sfm-row">
        <label class="form-label">Client</label>
        <div class="sfm-toggle-row">
          <button
            type="button" class="sfm-toggle-btn" :class="{ active: !form.freeText }"
            @click="form.freeText = false"
          >Registered</button>
          <button
            type="button" class="sfm-toggle-btn" :class="{ active: form.freeText }"
            @click="form.freeText = true"
          >Walk-in / Free text</button>
        </div>
      </div>

      <!-- Registered customer search -->
      <div v-if="!form.freeText" class="sfm-row">
        <label class="form-label">Customer</label>
        <div class="sfm-customer-search">
          <input
            v-model="customerQuery"
            class="form-input"
            placeholder="Search by name or phone…"
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
      <template v-if="form.freeText">
        <div class="sfm-row">
          <label class="form-label">Client Name <span class="sfm-opt">(optional)</span></label>
          <input v-model="form.client_name" class="form-input" placeholder="e.g. Ahmed Hassan" />
        </div>
        <div class="sfm-row">
          <label class="form-label">Client Phone <span class="sfm-opt">(optional)</span></label>
          <input v-model="form.client_phone" class="form-input" placeholder="e.g. 01012345678" />
        </div>
      </template>

      <!-- Service type -->
      <div class="sfm-row">
        <label class="form-label">Service Type</label>
        <select v-model="form.service_type" class="form-input">
          <option value="">— Select type —</option>
          <option v-for="t in serviceTypes" :key="t" :value="t">{{ t }}</option>
          <option value="__custom__">Other (custom)…</option>
        </select>
        <input
          v-if="form.service_type === '__custom__'"
          v-model="form.custom_type"
          class="form-input"
          style="margin-top:6px;"
          placeholder="Enter custom type…"
        />
      </div>

      <!-- Receive Date -->
      <div class="sfm-row">
        <label class="form-label">Receive Date</label>
        <input v-model="form.receive_date" type="date" class="form-input" />
      </div>

      <!-- ETA -->
      <div class="sfm-row">
        <label class="form-label">ETA</label>
        <div class="sfm-checkbox-row">
          <input id="no_eta" type="checkbox" v-model="form.no_eta" />
          <label for="no_eta" class="sfm-check-label">No ETA</label>
        </div>
        <div v-if="!form.no_eta" class="sfm-eta-row">
          <div class="sfm-eta-field">
            <label class="sfm-eta-label">Days</label>
            <select v-model.number="form.eta_days" class="form-input">
              <option :value="null">0</option>
              <option v-for="d in 31" :key="d" :value="d">{{ d }}</option>
            </select>
          </div>
          <div class="sfm-eta-field">
            <label class="sfm-eta-label">Hours</label>
            <select v-model.number="form.eta_hours" class="form-input">
              <option :value="null">0</option>
              <option v-for="h in 24" :key="h" :value="h">{{ h }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Info (problem description) -->
      <div class="sfm-row">
        <label class="form-label">Problem / Description <span class="sfm-opt">(optional)</span></label>
        <textarea
          v-model="form.info"
          class="form-input"
          rows="2"
          placeholder="Describe the issue or service needed…"
        />
      </div>

      <!-- Keeping (items received) -->
      <div class="sfm-row">
        <label class="form-label">Items Received <span class="sfm-opt">(optional)</span></label>
        <input
          v-model="form.keeping"
          class="form-input"
          placeholder="e.g. Laptop + charger + bag"
        />
        <p class="sfm-hint">What the client left with you.</p>
      </div>

      <!-- Cost -->
      <div class="sfm-row">
        <label class="form-label">Cost</label>
        <input
          v-model.number="form.cost"
          type="number" min="0" step="0.01"
          class="form-input"
          placeholder="0.00"
        />
        <p class="sfm-hint">Amount to invoice when marked Done.</p>
      </div>

      <p v-if="errorMsg" class="sfm-error">{{ errorMsg }}</p>
    </div>

    <template #footer>
      <button class="btn-ghost" @click="$emit('close')">Cancel</button>
      <button
        class="btn-primary"
        :disabled="!canSave || saving"
        @click="save"
      >{{ saving ? 'Saving…' : (serviceId ? 'Save Changes' : 'Create Service') }}</button>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import api from '@/api/axios'

const props = defineProps({
  open:         { type: Boolean, default: false },
  serviceId:    { type: String,  default: null },
  serviceData:  { type: Object,  default: null },
  serviceTypes: { type: Array,   default: () => [] },
})
const emit = defineEmits(['close', 'saved'])

const saving   = ref(false)
const errorMsg = ref('')

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
    if (props.serviceId) {
      await api.patch(`/api/services/${props.serviceId}/`, payload)
    } else {
      await api.post('/api/services/', payload)
    }
    emit('saved')
    emit('close')
  } catch (err) {
    const data = err?.response?.data
    if (data) {
      const msgs = Object.values(data).flat()
      errorMsg.value = msgs[0] || 'Could not save service.'
    } else {
      errorMsg.value = 'Could not save service.'
    }
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.sfm-form { display: flex; flex-direction: column; gap: 14px; }
.sfm-row  { display: flex; flex-direction: column; gap: 5px; }
.sfm-opt  { font-size: 11px; font-weight: 400; color: var(--text-muted); margin-left: 4px; }
.sfm-hint { font-size: 11px; color: var(--text-muted); margin: 3px 0 0; }
.sfm-error { font-size: 12px; color: #dc2626; background: #fef2f2; border-radius: 8px; padding: 8px 12px; }

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
