<template>
  <!-- Receive payment (s167) — one lump sum from a customer, spread by the server over their oldest unpaid
       sales first, then the opening balance. Used by the customer page AND the till's customer pop-up.
       The server allows MANAGER+ only (finance.CustomerReceiptViewSet) — callers hide the button below that. -->
  <AppModal :open="open" :title="t('people.customer_detail.receive_payment')" width="520px" @close="$emit('close')">
    <div v-if="!result" class="rec-form">
      <div class="rec-balance">
        <span>{{ t('people.customer_detail.receive.owes_now') }}</span>
        <strong><Money :value="owes" /></strong>
      </div>
      <BaseInput v-model="form.amount" type="number" min="0" step="0.01"
                 :label="t('people.customer_detail.receive.amount')" placeholder="0.00" :error="form.error" />
      <BaseSelect v-model="form.method" :options="methodOptions"
                  :label="t('people.customer_detail.receive.method')"
                  :placeholder="methodOptions.length ? '' : t('people.customer_detail.receive.no_methods')" />
      <BaseInput v-model="form.date" type="date" :label="t('people.customer_detail.receive.date')" />
      <BaseInput v-model="form.note" :label="t('people.customer_detail.receive.note')"
                 :placeholder="t('people.customer_detail.receive.note_ph')" />
      <label v-if="extra > 0" class="rec-advance">
        <input type="checkbox" v-model="form.allowAdvance" />
        <span>{{ t('people.customer_detail.receive.keep_credit') }} <Money :value="extra" /></span>
      </label>
      <p class="rec-hint">{{ t('people.customer_detail.receive.hint') }}</p>
    </div>
    <div v-else class="rec-form">
      <p class="rec-done">{{ t('people.customer_detail.receive.done') }}</p>
      <div v-for="a in result.allocations" :key="a.invoice" class="rec-line">
        <span>{{ t('people.customer_detail.receive.to_sale', { num: a.invoice_number || '—' }) }}</span>
        <Money :value="a.amount" />
      </div>
      <div v-if="Number(result.to_opening_balance)" class="rec-line">
        <span>{{ t('people.customer_detail.receive.to_opening') }}</span>
        <Money :value="result.to_opening_balance" />
      </div>
      <div v-if="Number(result.advance)" class="rec-line">
        <span>{{ t('people.customer_detail.receive.to_credit') }}</span>
        <Money :value="result.advance" />
      </div>
      <div class="rec-line rec-total">
        <span>{{ t('people.customer_detail.receive.balance_after') }}</span>
        <Money :value="result.balance_after" />
      </div>
    </div>
    <template #footer>
      <template v-if="!result">
        <BaseButton variant="ghost" @click="$emit('close')">{{ t('common.cancel') }}</BaseButton>
        <BaseButton variant="primary" :loading="form.saving" :disabled="!form.method" @click="save">
          {{ t('people.customer_detail.receive.save') }}
        </BaseButton>
      </template>
      <BaseButton v-else variant="primary" @click="$emit('close')">{{ t('common.close') }}</BaseButton>
    </template>
  </AppModal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/api/axios'
import Money from '@/components/ui/Money.vue'
import AppModal from '@/components/ui/AppModal.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseInput from '@/components/base/BaseInput.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import { showSuccessToast } from '@/utils/toast'

const { t } = useI18n()

const props = defineProps({
  open:     { type: Boolean, default: false },
  // The customer as the API returns it — needs `id` and the live `balance` (positive = they owe the shop).
  customer: { type: Object, default: null },
})
// `received` carries the server's answer (the receipt + its `summary`) — the caller refreshes what it shows.
const emit = defineEmits(['close', 'received'])

const methods = ref([])
const result = ref(null)
const form = reactive({ amount: '', method: '', date: '', note: '', allowAdvance: false, saving: false, error: '' })

const owes = computed(() => Math.max(0, Number(props.customer?.balance || 0)))
// Ajel (credit) is the unpaid part of a sale and store credit is spent only at checkout — neither pays a debt
// (the server refuses both; the list already leaves store credit out).
const methodOptions = computed(() => methods.value
  .filter(m => !m.is_agel && !m.is_store_credit)
  .map(m => ({ value: m.id, label: m.name })))
// What the typed amount goes beyond everything they owe — only kept as credit when ticked.
const extra = computed(() => {
  const amt = Number(form.amount) || 0
  return amt > owes.value ? Math.round((amt - owes.value) * 100) / 100 : 0
})
const today = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

watch(() => props.open, async (val) => {
  if (!val) return
  result.value = null
  Object.assign(form, { amount: '', method: '', date: today(), note: '', allowAdvance: false, saving: false, error: '' })
  if (!methods.value.length) {
    try {
      const r = await api.get('/api/finance/payment-methods/')
      methods.value = r.data.results ?? r.data ?? []
    } catch { methods.value = [] }
  }
  // Cash first — the usual way a debt is paid at the counter.
  const cash = methods.value.find(m => m.is_cash && !m.is_agel)
  form.method = cash?.id || methodOptions.value[0]?.value || ''
}, { immediate: true })

async function save() {
  form.error = ''
  const amt = Number(form.amount)
  if (!amt || amt <= 0) { form.error = t('people.customer_detail.receive.amount_required'); return }
  if (extra.value > 0 && !form.allowAdvance) { form.error = t('people.customer_detail.receive.too_much'); return }
  if (!props.customer?.id || form.saving) return
  form.saving = true
  try {
    const r = await api.post('/api/finance/customer-receipts/', {
      customer: props.customer.id,
      amount: amt,
      method: form.method,
      // today → the server stamps the real time; another day → noon, so no time zone pushes it a day off
      date: form.date && form.date !== today() ? new Date(`${form.date}T12:00:00`).toISOString() : undefined,
      note: form.note || '',
      allow_advance: form.allowAdvance,
    })
    result.value = r.data.summary
    showSuccessToast(t('people.customer_detail.receive.done'))
    emit('received', r.data)
  } catch (e) {
    const d = e?.response?.data || {}
    const first = v => (Array.isArray(v) ? v[0] : v)   // a field error comes as a list or a plain string
    form.error = first(d.amount) || first(d.method) || first(d.customer) || d.detail
      || t('people.customer_detail.receive.save_failed')
  } finally { form.saving = false }
}
</script>

<style scoped>
.rec-form { display:flex; flex-direction:column; gap:14px; }
.rec-balance { display:flex; align-items:center; justify-content:space-between; padding:10px 12px; border-radius:8px; background:var(--bg-app); border:1px solid var(--border); font-size:13px; color:var(--text-secondary); }
.rec-balance strong { color:var(--text-primary); font-size:15px; }
.rec-advance { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text-secondary); cursor:pointer; }
.rec-hint { font-size:12px; color:var(--text-muted); margin:0; }
.rec-done { font-size:14px; font-weight:600; color:var(--success); margin:0; }
.rec-line { display:flex; align-items:center; justify-content:space-between; font-size:13px; color:var(--text-secondary); padding:6px 0; border-bottom:1px solid var(--border); }
.rec-total { border-bottom:none; font-weight:600; color:var(--text-primary); }
</style>
