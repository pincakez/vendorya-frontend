<template>
  <div class="dm-overlay" @click.self="$emit('close')">
    <div class="dm-card">
      <div class="dm-header">
        <span class="dm-title">{{ isLine ? t('pos.discount_modal.title_line') : t('pos.discount_modal.title') }}</span>
        <button class="dm-close" @click="$emit('close')"><X :size="18" /></button>
      </div>

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
        <button class="dm-cancel" @click="$emit('close')">{{ t('common.cancel') }}</button>
        <button class="dm-apply" @click="apply">{{ t('pos.discount_modal.apply') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { X } from 'lucide-vue-next'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const emit = defineEmits(['close'])

// context: 'invoice' (default) or { variantId, lineTotal } for a single cart line
const props = defineProps({
  context: { type: [String, Object], default: 'invoice' },
})

const cart = useCartStore()
const auth = useAuthStore()
const currSymbol = computed(() => auth.currencySymbol || 'EGP')

const isLine    = computed(() => typeof props.context === 'object' && props.context !== null)
const lineItem  = computed(() => isLine.value ? cart.items.find(i => i.variant_id === props.context.variantId) : null)
// percent is taken on the invoice's discount base (shield-aware); a fixed amount caps at the discounted subtotal
const pctBase   = computed(() => isLine.value ? (props.context.lineTotal || 0) : cart.invoiceDiscountBase)
const fixedBase = computed(() => isLine.value ? (props.context.lineTotal || 0) : cart.discountedSubtotal)

const mode   = ref('percent')
const amount = ref('')
const inp    = ref(null)

// preload existing discount so the modal edits rather than resets
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
    cart.setLineDiscount(props.context.variantId, 'free', 0)
    emit('close'); return
  }
  const n = parseFloat(amount.value)
  if (isNaN(n) || n <= 0) { clear(); return }
  if (isLine.value) cart.setLineDiscount(props.context.variantId, mode.value, n)
  else              cart.setInvoiceDiscount(mode.value, n)
  emit('close')
}

function clear() {
  if (isLine.value) cart.setLineDiscount(props.context.variantId, null)
  else              cart.setInvoiceDiscount(null)
  emit('close')
}
</script>

<style scoped>
.dm-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center; z-index: 9998;
}
.dm-card {
  background: var(--bg-card); border-radius: 20px; padding: 28px 32px;
  min-width: 340px; display: flex; flex-direction: column; gap: 18px;
  box-shadow: 0 16px 60px rgba(0,0,0,0.25);
}
.dm-header { display: flex; align-items: center; justify-content: space-between; }
.dm-title { font-size: 18px; font-weight: 800; color: var(--text-primary); }
.dm-close { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 4px; border-radius: 8px; }
.dm-close:hover { background: var(--border); }
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
.dm-cancel {
  flex: 1; padding: 12px; border-radius: 12px; border: 2px solid var(--border);
  background: none; cursor: pointer; font-size: 14px; font-weight: 700; color: var(--text-secondary);
}
.dm-apply {
  flex: 2; padding: 12px; border-radius: 12px; border: none;
  background: var(--accent); color: #fff; cursor: pointer; font-size: 14px; font-weight: 700;
}
.dm-apply:hover { opacity: 0.9; }
</style>
