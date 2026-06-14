<template>
  <div class="dm-overlay" @click.self="$emit('close')">
    <div class="dm-card">
      <div class="dm-header">
        <span class="dm-title">{{ t('pos.discount_modal.title') }}</span>
        <button class="dm-close" @click="$emit('close')"><X :size="18" /></button>
      </div>

      <div class="dm-tabs">
        <button :class="['dm-tab', { active: mode === 'percent' }]" @click="mode = 'percent'; amount = ''">%</button>
        <button :class="['dm-tab', { active: mode === 'fixed'   }]" @click="mode = 'fixed';   amount = ''">{{ t('pos.discount_modal.tab_fixed') }}</button>
      </div>

      <div class="dm-input-wrap">
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

      <div v-if="preview !== null" class="dm-preview">
        {{ t('pos.discount_modal.preview', { sym: currSymbol, amount: preview.toFixed(2) }) }}
      </div>

      <div class="dm-actions">
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

const cart = useCartStore()
const auth = useAuthStore()
const currSymbol = computed(() => auth.currencySymbol || 'EGP')

const mode   = ref('percent')
const amount = ref('')
const inp    = ref(null)

onMounted(() => nextTick(() => inp.value?.focus()))

const preview = computed(() => {
  const n = parseFloat(amount.value)
  if (isNaN(n) || n <= 0) return null
  if (mode.value === 'percent') return (cart.subtotal * n) / 100
  return n
})

function apply() {
  const n = parseFloat(amount.value)
  if (isNaN(n) || n <= 0) { emit('close'); return }
  const disc = mode.value === 'percent' ? (cart.subtotal * n) / 100 : n
  cart.setDiscount(disc)
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
.dm-preview { font-size: 13px; color: var(--text-muted); text-align: center; }
.dm-actions { display: flex; gap: 10px; }
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
