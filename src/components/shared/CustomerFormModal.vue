<template>
  <AppModal :open="open" :title="customerId ? t('people.customer_form.title_edit') : t('people.customer_form.title_new')" @close="$emit('close')">
    <div class="cfm-form">

      <!-- Gender -->
      <div class="cfm-row">
        <label class="form-label">{{ t('people.customer_form.gender') }}</label>
        <div class="cfm-radio-group">
          <label class="cfm-radio" :class="{ active: form.gender === 'MALE' }">
            <input type="radio" v-model="form.gender" value="MALE" tabindex="1" />
            <span>{{ t('people.customer_form.male') }}</span>
          </label>
          <label class="cfm-radio" :class="{ active: form.gender === 'FEMALE' }">
            <input type="radio" v-model="form.gender" value="FEMALE" tabindex="2" />
            <span>{{ t('people.customer_form.female') }}</span>
          </label>
        </div>
      </div>

      <!-- Name -->
      <div class="cfm-row">
        <label class="form-label">{{ t('people.customer_form.name_label') }} <span class="cfm-optional" v-if="!form.name && !form.phone_number">{{ t('people.customer_form.name_required_hint') }}</span></label>
        <input
          ref="nameInputEl"
          v-model="form.name"
          class="form-input"
          :placeholder="t('people.customer_form.name_ph')"
          tabindex="3"
          @keydown.enter.prevent="save"
        />
      </div>

      <!-- Phone -->
      <div class="cfm-row">
        <label class="form-label">{{ t('people.customer_form.phone_label') }} <span class="cfm-optional">({{ t('common.optional') }})</span></label>
        <input
          v-model="form.phone_number"
          class="form-input"
          :placeholder="t('people.customer_form.phone_ph')"
          tabindex="4"
          @keydown.enter.prevent="save"
        />
      </div>

      <!-- Email -->
      <div class="cfm-row">
        <label class="form-label">{{ t('people.customer_form.email_label') }} <span class="cfm-optional">({{ t('common.optional') }})</span></label>
        <input
          v-model="form.email"
          type="email"
          class="form-input"
          :placeholder="t('people.customer_form.email_ph')"
          tabindex="5"
          @keydown.enter.prevent="save"
        />
      </div>

      <!-- Credit Limit -->
      <div class="cfm-row">
        <label class="form-label">{{ t('people.customer_form.credit_limit_label') }} <span class="cfm-optional">({{ t('common.optional') }})</span></label>
        <input
          v-model.number="form.credit_limit"
          type="number" min="0" step="100"
          class="form-input"
          :placeholder="t('people.customer_form.credit_limit_ph')"
          tabindex="6"
          @keydown.enter.prevent="save"
        />
        <p class="cfm-hint">{{ t('people.customer_form.credit_limit_hint') }}</p>
      </div>

      <!-- Notes -->
      <div class="cfm-row">
        <label class="form-label">{{ t('people.customer_form.notes_label') }} <span class="cfm-optional">({{ t('common.optional') }})</span></label>
        <textarea
          v-model="form.notes"
          class="form-input"
          rows="2"
          :placeholder="t('people.customer_form.notes_ph')"
          tabindex="7"
        />
      </div>

      <p v-if="errorMsg" class="cfm-error">{{ errorMsg }}</p>
    </div>

    <template #footer>
      <button class="btn-ghost" tabindex="9" @click="$emit('close')">{{ t('common.cancel') }}</button>
      <button
        class="btn-primary"
        tabindex="8"
        :disabled="!_canSave || saving"
        @click="save"
      >{{ saving ? t('common.saving') : (customerId ? t('people.customer_form.save_changes') : t('people.customer_form.add_customer')) }}</button>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, reactive, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
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
const nameInputEl = ref(null)

const form = reactive({
  gender:       'MALE',
  name:         '',
  phone_number: '',
  email:        '',
  credit_limit: null,
  notes:        '',
})

watch(() => props.open, (val) => {
  if (!val) return
  errorMsg.value = ''
  Object.assign(form, {
    gender:       'MALE',
    name:         props.prefillName  || '',
    phone_number: props.prefillPhone || '',
    email:        props.prefillEmail || '',
    credit_limit: null,
    notes:        '',
  })
  nextTick(() => nameInputEl.value?.focus())
})

const _canSave = computed(() => !!(form.name.trim() || form.phone_number.trim()))

async function save() {
  if (!_canSave.value || saving.value) return
  errorMsg.value = ''
  saving.value = true

  const payload = {
    gender:       form.gender,
    name:         form.name.trim() || form.phone_number.trim(),  // phone as fallback name
    phone_number: form.phone_number.trim() || null,
    email:        form.email.trim(),
    notes:        form.notes.trim(),
    credit_limit: form.credit_limit || null,
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
    if (data) {
      const msgs = Object.values(data).flat()
      errorMsg.value = msgs[0] || t('people.customer_form.err_save')
    } else {
      errorMsg.value = t('people.customer_form.err_save')
    }
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.cfm-form { display: flex; flex-direction: column; gap: 14px; }
.cfm-row  { display: flex; flex-direction: column; gap: 5px; }

.cfm-radio-group {
  display: flex; gap: 10px;
}
.cfm-radio {
  display: flex; align-items: center; gap: 7px;
  padding: 7px 14px; border-radius: 8px; cursor: pointer;
  border: 1.5px solid var(--border); background: var(--bg-app);
  font-size: 13px; font-weight: 600; color: var(--text-secondary);
  transition: border-color 120ms, background 120ms, color 120ms;
  user-select: none;
}
.cfm-radio input[type="radio"] { display: none; }
.cfm-radio.active {
  border-color: var(--accent); background: var(--accent-soft); color: var(--accent);
}

.cfm-optional { font-size: 11px; font-weight: 400; color: var(--text-muted); margin-left: 4px; }
.cfm-hint  { font-size: 11px; color: var(--text-muted); margin: 3px 0 0; }
.cfm-error { font-size: 12px; color: var(--danger); background: var(--danger-soft); border-radius: 8px; padding: 8px 12px; }
</style>
