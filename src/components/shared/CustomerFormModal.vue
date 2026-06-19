<template>
  <AppModal :open="open" :title="customerId ? t('people.customer_form.title_edit') : t('people.customer_form.title_new')" width="900px" @close="$emit('close')">
    <div class="pfm-form">

      <!-- ── Simple fields (always visible) ── -->
      <div class="pfm-row">
        <label class="form-label">{{ t('people.customer_form.name_label') }}</label>
        <input
          ref="nameInputEl"
          v-model="form.name"
          class="form-input"
          :placeholder="t('people.customer_form.name_ph')"
          @keydown.enter.prevent="save"
        />
      </div>
      <div class="pfm-row">
        <label class="form-label">{{ t('people.customer_form.phone_label') }} <span class="pfm-opt">({{ t('common.optional') }})</span></label>
        <input v-model="form.phone_number" class="form-input" :placeholder="t('people.customer_form.phone_ph')" @keydown.enter.prevent="save" />
      </div>
      <div class="pfm-row">
        <label class="form-label">{{ t('people.customer_form.email_label') }} <span class="pfm-opt">({{ t('common.optional') }})</span></label>
        <input v-model="form.email" type="email" class="form-input" :placeholder="t('people.customer_form.email_ph')" @keydown.enter.prevent="save" />
      </div>

      <!-- ── Expand toggle ── -->
      <button type="button" class="pfm-expand-btn" @click="expanded = !expanded">
        <ChevronDown :size="14" :class="['pfm-chev', { open: expanded }]" />
        {{ expanded ? t('people.pfm.collapse') : t('people.pfm.more_fields') }}
      </button>

      <!-- ── Expanded fields ── -->
      <div v-if="expanded" class="pfm-expanded">
        <div class="pfm-2col">
          <div class="pfm-row">
            <label class="form-label">{{ t('people.pfm.whatsapp') }}</label>
            <input v-model="form.whatsapp_number" class="form-input" placeholder="e.g. 01012345678" />
          </div>
          <div class="pfm-row">
            <label class="form-label">{{ t('people.pfm.instagram') }}</label>
            <input v-model="form.instagram" class="form-input" placeholder="@handle" />
          </div>
        </div>
        <div class="pfm-row">
          <label class="form-label">{{ t('people.pfm.website') }}</label>
          <input v-model="form.website" class="form-input" placeholder="https://…" />
        </div>
        <div class="pfm-2col">
          <div class="pfm-row">
            <label class="form-label">{{ t('people.pfm.country') }}</label>
            <input v-model="form.country" class="form-input" placeholder="Egypt" />
          </div>
          <div class="pfm-row">
            <label class="form-label">{{ t('people.pfm.city') }}</label>
            <input v-model="form.city" class="form-input" placeholder="Cairo" />
          </div>
        </div>
        <div class="pfm-row">
          <label class="form-label">{{ t('people.pfm.notes') }}</label>
          <textarea v-model="form.notes" class="form-input" rows="2" :placeholder="t('people.pfm.notes_ph')" />
        </div>
        <div class="pfm-row">
          <label class="form-label">{{ t('people.customer_form.credit_limit_label') }} <span class="pfm-opt">({{ t('common.optional') }})</span></label>
          <input v-model.number="form.credit_limit" type="number" min="0" step="100" class="form-input" style="max-width:160px;" placeholder="0" />
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
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronDown } from 'lucide-vue-next'
import AppModal from '@/components/ui/AppModal.vue'
import api from '@/api/axios'

const { t } = useI18n()

const props = defineProps({
  open:         { type: Boolean, default: false },
  customerId:   { type: String,  default: null },
  prefillName:  { type: String,  default: '' },
  prefillPhone: { type: String,  default: '' },
  prefillEmail: { type: String,  default: '' },
})

const emit = defineEmits(['close', 'saved'])

const saving      = ref(false)
const errorMsg    = ref('')
const expanded    = ref(false)
const nameInputEl = ref(null)

const form = reactive({
  name: '', phone_number: '', email: '',
  whatsapp_number: '', instagram: '', website: '',
  country: 'Egypt', city: '', notes: '',
  gender: 'MALE', credit_limit: null,
})

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
  nextTick(() => nameInputEl.value?.focus())
})

const _canSave = computed(() => !!form.name.trim())

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
    credit_limit:    form.credit_limit || null,
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
.pfm-form { display: flex; flex-direction: column; gap: 12px; }
.pfm-row  { display: flex; flex-direction: column; gap: 4px; }
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
.pfm-chev { transition: transform 220ms ease; flex-shrink: 0; }
.pfm-chev.open { transform: rotate(180deg); }

.pfm-expanded { display: flex; flex-direction: column; gap: 12px; padding-top: 4px; border-top: 1px dashed var(--border); }
.pfm-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
</style>
