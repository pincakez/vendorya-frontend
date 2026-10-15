<template>
  <!-- hide-close while "Receive payment" is open on top: Escape then closes only that one (both listen on window) -->
  <AppModal :open="open" :title="customerId ? t('people.customer_form.title_edit') : t('people.customer_form.title_new')" width="900px"
            :hide-close="receiveOpen" @close="$emit('close')">
    <div class="modal-form">

      <!-- ── Balance + Receive payment (existing customer; managers and up — the server refuses a cashier) ── -->
      <div v-if="customerId && customer" class="cfm-balance">
        <span class="cfm-balance-label">{{ t('people.customer_detail.info.balance') }}</span>
        <span v-if="Number(customer.balance) > 0" class="cfm-owe">{{ t('people.customer_detail.owes') }} <Money :value="customer.balance" /></span>
        <span v-else-if="Number(customer.balance) < 0" class="cfm-credit">{{ t('people.customer_detail.credit') }} <Money :value="Math.abs(Number(customer.balance))" /></span>
        <span v-else class="cfm-zero">—</span>
        <BaseButton v-if="canReceive" variant="primary" size="sm" class="cfm-receive" @click="receiveOpen = true">
          <HandCoins :size="14" /> {{ t('people.customer_detail.receive_payment') }}
        </BaseButton>
      </div>

      <!-- ── Simple fields (always visible) · TwoCol preset ── -->
      <div class="modal-2col">
        <div class="modal-field">
          <label class="form-label">{{ t('people.customer_form.name_label') }}</label>
          <input
            ref="nameInputEl"
            v-model="form.name"
            class="form-input"
            :placeholder="t('people.customer_form.name_ph')"
            @keydown.enter.prevent="save"
          />
        </div>
        <div class="modal-field">
          <label class="form-label">{{ t('people.customer_form.phone_label') }} <span class="pfm-opt">({{ t('common.optional') }})</span></label>
          <input v-model="form.phone_number" class="form-input" :placeholder="t('people.customer_form.phone_ph')" @keydown.enter.prevent="save" />
        </div>
        <div class="modal-field modal-span-2">
          <label class="form-label">{{ t('people.customer_form.email_label') }} <span class="pfm-opt">({{ t('common.optional') }})</span></label>
          <input v-model="form.email" type="email" class="form-input" :placeholder="t('people.customer_form.email_ph')" @keydown.enter.prevent="save" />
        </div>
      </div>

      <!-- ── Expand toggle ── -->
      <button type="button" class="pfm-expand-btn" @click="expanded = !expanded">
        <ChevronDown :size="14" :class="['pfm-chev', { open: expanded }]" />
        {{ expanded ? t('people.pfm.collapse') : t('people.pfm.more_fields') }}
      </button>

      <!-- ── Expanded fields · TwoCol preset ── -->
      <div v-if="expanded" class="modal-section">
        <div class="modal-2col">
          <div class="modal-field">
            <label class="form-label">{{ t('people.pfm.whatsapp') }}</label>
            <input v-model="form.whatsapp_number" class="form-input" placeholder="e.g. 01012345678" />
          </div>
          <div class="modal-field">
            <label class="form-label">{{ t('people.pfm.instagram') }}</label>
            <input v-model="form.instagram" class="form-input" placeholder="@handle" />
          </div>
          <div class="modal-field modal-span-2">
            <label class="form-label">{{ t('people.pfm.website') }}</label>
            <input v-model="form.website" class="form-input" placeholder="https://…" />
          </div>
          <div class="modal-field">
            <label class="form-label">{{ t('people.pfm.country') }}</label>
            <input v-model="form.country" class="form-input" placeholder="Egypt" />
          </div>
          <div class="modal-field">
            <label class="form-label">{{ t('people.pfm.city') }}</label>
            <input v-model="form.city" class="form-input" placeholder="Cairo" />
          </div>
          <div class="modal-field">
            <label class="form-label">{{ t('people.customer_form.phone_2') }}</label>
            <input v-model="form.phone_2" class="form-input" placeholder="e.g. 01112345678" />
          </div>
          <div class="modal-field">
            <label class="form-label">{{ t('people.customer_form.tax_number') }}</label>
            <input v-model="form.tax_number" class="form-input" />
          </div>
          <div class="modal-field modal-span-2">
            <label class="form-label">{{ t('people.customer_form.address') }}</label>
            <input v-model="form.address" class="form-input" />
          </div>
          <!-- s171: personal data (national ID + guarantor) — managers and up; the server hides it from cashiers -->
          <template v-if="canSetCredit">
            <div class="modal-field">
              <label class="form-label">{{ t('people.customer_form.national_id') }}</label>
              <input v-model="form.national_id" class="form-input" inputmode="numeric" />
            </div>
            <div class="modal-field modal-span-2 pfm-sub">{{ t('people.customer_form.guarantor') }}</div>
            <div class="modal-field">
              <label class="form-label">{{ t('people.customer_form.guarantor_name') }}</label>
              <input v-model="form.guarantor_name" class="form-input" />
            </div>
            <div class="modal-field">
              <label class="form-label">{{ t('people.customer_form.national_id') }}</label>
              <input v-model="form.guarantor_national_id" class="form-input" inputmode="numeric" />
            </div>
            <div class="modal-field">
              <label class="form-label">{{ t('people.customer_form.phone_label') }}</label>
              <input v-model="form.guarantor_phone" class="form-input" />
            </div>
            <div class="modal-field">
              <label class="form-label">{{ t('people.customer_form.phone_2') }}</label>
              <input v-model="form.guarantor_phone_2" class="form-input" />
            </div>
            <div class="modal-field">
              <label class="form-label">{{ t('people.customer_form.guarantor_work') }}</label>
              <input v-model="form.guarantor_work" class="form-input" />
            </div>
            <div class="modal-field">
              <label class="form-label">{{ t('people.customer_form.address') }}</label>
              <input v-model="form.guarantor_address" class="form-input" />
            </div>
          </template>
          <div v-if="canSetCredit" class="modal-field">
            <label class="form-label">{{ t('people.customer_form.credit_limit_label') }} <span class="pfm-opt">({{ t('common.optional') }})</span></label>
            <input v-model.number="form.credit_limit" type="number" min="0" step="100" class="form-input" placeholder="0" />
          </div>
          <div class="modal-field modal-span-2">
            <label class="form-label">{{ t('people.pfm.notes') }}</label>
            <textarea v-model="form.notes" class="form-input" rows="2" :placeholder="t('people.pfm.notes_ph')" />
          </div>
        </div>
      </div>

      <p v-if="errorMsg" class="pfm-error">{{ errorMsg }}</p>
    </div>

    <template #footer>
      <button class="btn-ghost" @click="$emit('close')">{{ t('common.cancel') }}</button>
      <button class="btn-primary" :disabled="!_canSave || saving" @click="save">
        {{ saving ? t('common.saving') : (customerId ? t('people.customer_form.save_changes') : t('people.customer_form.add_customer')) }}
      </button>
    </template>
  </AppModal>

  <ReceivePaymentModal :open="receiveOpen" :customer="customer" @close="receiveOpen = false" @received="onReceived" />
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown, HandCoins } from 'lucide-vue-next'
import AppModal from '@/components/ui/AppModal.vue'
import Money from '@/components/ui/Money.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import ReceivePaymentModal from '@/components/shared/ReceivePaymentModal.vue'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()

const props = defineProps({
  open:         { type: Boolean, default: false },
  customerId:   { type: String,  default: null },
  prefillName:  { type: String,  default: '' },
  prefillPhone: { type: String,  default: '' },
  prefillEmail: { type: String,  default: '' },
})

// `received`: a payment was taken from this customer — carries the reloaded customer (new balance).
const emit = defineEmits(['close', 'saved', 'received'])

const auth = useAuthStore()
const canSetCredit = computed(() => ['MANAGER', 'ADMIN', 'OWNER'].includes(auth.userRole))
// Receive payment (s167 lump sum): MANAGER+ like the customer page — lowering a debt is a credit decision.
const canReceive = computed(() => auth.hasRole('MANAGER'))

// The customer being edited, as the API returns it (live `balance`) — null for a new one.
const customer    = ref(null)
const receiveOpen = ref(false)

const saving      = ref(false)
const errorMsg    = ref('')
const expanded    = ref(false)
const nameInputEl = ref(null)

const form = reactive({
  name: '', phone_number: '', email: '',
  whatsapp_number: '', instagram: '', website: '',
  country: 'Egypt', city: '', notes: '',
  gender: 'MALE', credit_limit: null,
  phone_2: '', address: '', tax_number: '', national_id: '', guarantor_name: '', guarantor_national_id: '', guarantor_phone: '', guarantor_phone_2: '', guarantor_work: '', guarantor_address: '',
})
const EXTRA_FIELDS = ['phone_2', 'address', 'tax_number']            // everyone
const PRIVATE_FIELDS = ['national_id', 'guarantor_name', 'guarantor_national_id', 'guarantor_phone', 'guarantor_phone_2', 'guarantor_work', 'guarantor_address']   // MANAGER+ (s171)

watch(() => props.open, (val) => {
  if (!val) return
  errorMsg.value = ''
  expanded.value = false
  Object.assign(form, {
    name: props.prefillName || '', phone_number: props.prefillPhone || '',
    email: props.prefillEmail || '', whatsapp_number: '', instagram: '',
    website: '', country: 'Egypt', city: '', notes: '',
    gender: 'MALE', credit_limit: null,
  })
  for (const k of [...EXTRA_FIELDS, ...PRIVATE_FIELDS]) form[k] = ''
  customer.value = null
  receiveOpen.value = false
  if (props.customerId) loadCustomer()
  nextTick(() => nameInputEl.value?.focus())
})

// Edit mode: fill the form with what is saved (a PATCH of blanks would wipe it) and show the live balance.
async function loadCustomer() {
  const id = props.customerId
  try {
    const { data } = await api.get(`/api/auth/customers/${id}/`)
    if (id !== props.customerId || !props.open) return
    customer.value = data
    Object.assign(form, {
      name: data.name || '', phone_number: data.phone_number || '', email: data.email || '',
      whatsapp_number: data.whatsapp_number || '', instagram: data.instagram || '', website: data.website || '',
      country: data.country || '', city: data.city || '', notes: data.notes || '',
      gender: data.gender || 'MALE', credit_limit: data.credit_limit ?? null,
    })
    for (const k of [...EXTRA_FIELDS, ...PRIVATE_FIELDS]) form[k] = data[k] || ''
  } catch {
    errorMsg.value = t('people.customer_form.err_load')
  }
}

async function onReceived() {
  try {
    const { data } = await api.get(`/api/auth/customers/${props.customerId}/`)
    customer.value = data
    emit('received', data)
  } catch { /* the balance shows on the next open */ }
}

// Edit mode: never save before the customer loaded (a failed load + a typed name would PATCH blanks over them).
const _canSave = computed(() => !!form.name.trim() && (!props.customerId || !!customer.value))

async function save() {
  if (!_canSave.value || saving.value) return
  errorMsg.value = ''
  saving.value = true
  const payload = {
    name:            form.name.trim(),
    phone_number:    form.phone_number.trim() || null,
    email:           form.email.trim(),
    gender:          form.gender,
    notes:           form.notes.trim(),
    whatsapp_number: form.whatsapp_number.trim(),
    instagram:       form.instagram.trim(),
    website:         form.website.trim(),
    country:         form.country.trim(),
    city:            form.city.trim(),
    // Credit limit: managers and up only (2026-10-14) — the server refuses a cashier who sets one.
    ...(canSetCredit.value ? { credit_limit: form.credit_limit || null } : {}),
    ...Object.fromEntries(EXTRA_FIELDS.map(k => [k, form[k].trim()])),
    // Personal fields: only a manager+ sees them, so only a manager+ sends them (a cashier's save must never blank them).
    ...(canSetCredit.value ? Object.fromEntries(PRIVATE_FIELDS.map(k => [k, form[k].trim()])) : {}),
  }
  try {
    let res
    if (props.customerId) {
      res = await api.patch(`/api/auth/customers/${props.customerId}/`, payload)
    } else {
      res = await api.post('/api/auth/customers/', payload)
    }
    emit('saved', res.data)
    emit('close')
  } catch (err) {
    const data = err?.response?.data
    errorMsg.value = data ? (Object.values(data).flat()[0] || t('people.customer_form.err_save')) : t('people.customer_form.err_save')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.cfm-balance { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 8px; background: var(--bg-app); border: 1px solid var(--border); font-size: 13px; }
.cfm-balance-label { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--text-muted); font-weight: 600; }
.cfm-owe    { display: inline-block; padding: 2px 8px; border-radius: 20px; background: var(--danger-soft); color: var(--danger); font-size: 12px; font-weight: 600; }
.cfm-credit { display: inline-block; padding: 2px 8px; border-radius: 20px; background: var(--success-soft); color: var(--success); font-size: 12px; font-weight: 600; }
.cfm-zero   { color: var(--text-muted); }
.cfm-receive { margin-inline-start: auto; }

.pfm-opt  { font-size: 11px; font-weight: 400; color: var(--text-muted); margin-left: 4px; }
.pfm-error { font-size: 12px; color: var(--danger); background: var(--danger-soft); border-radius: 8px; padding: 8px 12px; }

.pfm-expand-btn {
  display: inline-flex; align-items: center; gap: 6px;
  background: none; border: none; cursor: pointer;
  font-size: 12.5px; font-weight: 600; color: var(--accent);
  padding: 2px 0; align-self: flex-start;
  transition: opacity 120ms;
}
.pfm-expand-btn:hover { opacity: .75; }
.pfm-sub { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; color: var(--text-muted); margin-top: 6px; }
.pfm-chev { transition: transform 220ms ease; flex-shrink: 0; }
.pfm-chev.open { transform: rotate(180deg); }
</style>
