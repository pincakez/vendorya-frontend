<template>
  <AppModal :open="true" :large-close="true" :title="isLine ? t('pos.discount_modal.title_line') : t('pos.discount_modal.title')" width="440px" @close="$emit('close')">
    <div class="dm-body">
      <div class="dm-tabs">
        <button :class="['dm-tab', { active: mode === 'percent' }]" @click="setMode('percent')">%</button>
        <button :class="['dm-tab', { active: mode === 'fixed'   }]" @click="setMode('fixed')">{{ t('pos.discount_modal.tab_fixed') }}</button>
        <button v-if="isLine" :class="['dm-tab', { active: mode === 'free' }]" @click="setMode('free')">{{ t('pos.discount_modal.tab_free') }}</button>
      </div>

      <div v-if="mode !== 'free'" class="dm-input-wrap">
        <span class="dm-input-prefix">{{ mode === 'percent' ? '%' : currSymbol }}</span>
        <input
          ref="inp"
          v-model="amount"
          type="number"
          min="0"
          :max="mode === 'percent' ? 100 : undefined"
          class="dm-input"
          placeholder="0"
          @keydown.enter="apply"
        />
      </div>
      <div v-else class="dm-free-note">{{ t('pos.discount_modal.free_note') }}</div>

      <div v-if="preview !== null" class="dm-preview">
        {{ t('pos.discount_modal.preview', { sym: currSymbol, amount: preview.toFixed(2) }) }}
      </div>

      <div class="dm-actions">
        <button v-if="hasExisting" class="dm-clear" @click="clear">{{ t('common.clear') }}</button>
        <button class="dm-apply" @click="apply">{{ t('pos.discount_modal.apply') }}</button>
      </div>
    </div>
  </AppModal>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import AppModal from '@/components/ui/AppModal.vue'

const { t } = useI18n()
const emit = defineEmits(['close'])

const props = defineProps({
  context: { type: [String, Object], default: 'invoice' },
})

const cart = useCartStore()
const auth = useAuthStore()
const currSymbol = computed(() => auth.currencySymbol || 'EGP')

const isLine    = computed(() => typeof props.context === 'object' && props.context !== null)
const lineItem  = computed(() => isLine.value ? cart.items.find(i => i.key === props.context.key) : null)
const pctBase   = computed(() => isLine.value ? (props.context.lineTotal || 0) : cart.invoiceDiscountBase)
const fixedBase = computed(() => isLine.value ? (props.context.lineTotal || 0) : cart.discountedSubtotal)

const mode   = ref('percent')
const amount = ref('')
const inp    = ref(null)

onMounted(() => {
  const existing = isLine.value ? lineItem.value : { discType: cart.invDiscType, discValue: cart.invDiscValue }
  if (existing?.discType) {
    mode.value = existing.discType
    amount.value = existing.discType === 'free' ? '' : String(existing.discValue || '')
  }
  nextTick(() => inp.value?.focus())
})

const hasExisting = computed(() =>
  isLine.value ? !!lineItem.value?.discType : !!cart.invDiscType
)

function setMode(m) { mode.value = m; if (m === 'free') amount.value = '' }

const preview = computed(() => {
  if (mode.value === 'free') return fixedBase.value
  const n = parseFloat(amount.value)
  if (isNaN(n) || n <= 0) return null
  if (mode.value === 'percent') return Math.min(pctBase.value, (pctBase.value * n) / 100)
  return Math.min(fixedBase.value, n)
})

function apply() {
  if (mode.value === 'free') {
    cart.setLineDiscount(props.context.key, 'free', 0)
    emit('close'); return
  }
  const n = parseFloat(amount.value)
  if (isNaN(n) || n <= 0) { clear(); return }
  if (isLine.value) cart.setLineDiscount(props.context.key, mode.value, n)
  else              cart.setInvoiceDiscount(mode.value, n)
  emit('close')
}

function clear() {
  if (isLine.value) cart.setLineDiscount(props.context.key, null)
  else              cart.setInvoiceDiscount(null)
  emit('close')
}
</script>

<style scoped>
.dm-body { display: flex; flex-direction: column; gap: 18px; }
.dm-tabs { display: flex; gap: 8px; }
.dm-tab {
  flex: 1; padding: 10px; border-radius: 10px; border: 2px solid var(--border);
  background: var(--bg-app); cursor: pointer; font-size: 14px; font-weight: 700;
  color: var(--text-secondary); transition: all 150ms;
}
.dm-tab.active { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
.dm-input-wrap {
  display: flex; align-items: center; gap: 10px;
  border: 2px solid var(--border); border-radius: 12px; padding: 12px 16px;
  transition: border-color 150ms;
}
.dm-input-wrap:focus-within { border-color: var(--accent); }
.dm-input-prefix { font-size: 16px; font-weight: 700; color: var(--accent); }
.dm-input {
  flex: 1; border: none; background: none; font-size: 24px; font-weight: 700;
  color: var(--text-primary); outline: none;
}
.dm-free-note { font-size: 14px; color: var(--text-secondary); text-align: center; padding: 8px 0; }
.dm-preview { font-size: 13px; color: var(--text-muted); text-align: center; }
.dm-actions { display: flex; gap: 10px; }
.dm-clear {
  flex: 1; padding: 12px; border-radius: 12px; border: 2px solid var(--danger, #dc2626);
  background: none; cursor: pointer; font-size: 14px; font-weight: 700; color: var(--danger, #dc2626);
}
.dm-apply {
  flex: 2; padding: 12px; border-radius: 12px; border: none;
  background: var(--accent); color: #fff; cursor: pointer; font-size: 14px; font-weight: 700;
}
.dm-apply:hover { opacity: 0.9; }
</style>
