<template>
  <div class="pm-overlay" @click.self="$emit('close')">
    <div class="pm-card">
      <div class="pm-header">
        <span class="pm-title">Payment</span>
        <button class="pm-close" @click="$emit('close')"><X :size="20" /></button>
      </div>

      <div class="pm-total">
        <span class="pm-total-label">Total Due</span>
        <span class="pm-total-amount">{{ currSymbol }} {{ fmtNum(cart.grandTotal) }}</span>
      </div>

      <!-- Payment method tabs -->
      <div class="pm-methods">
        <button
          v-for="m in pos.paymentMethods" :key="m.id"
          :class="['pm-method', { active: selectedMethod?.id === m.id }]"
          @click="selectedMethod = m; cashReceived = ''"
        >
          {{ m.name }}
          <span v-if="m.is_agel" class="pm-agel-badge">Credit</span>
        </button>
      </div>

      <!-- Cash: received amount + change -->
      <div v-if="selectedMethod?.is_cash" class="pm-cash-section">
        <label class="pm-cash-label">Cash Received</label>
        <div class="pm-cash-wrap">
          <span class="pm-cash-prefix">{{ currSymbol }}</span>
          <input
            ref="cashInput"
            v-model="cashReceived"
            type="number"
            min="0"
            step="0.01"
            class="pm-cash-input"
            placeholder="0.00"
          />
        </div>
        <div v-if="change >= 0" class="pm-change">
          Change: <strong>{{ currSymbol }} {{ fmtNum(change) }}</strong>
        </div>
      </div>

      <!-- Agel credit warning -->
      <div v-if="selectedMethod?.is_agel" class="pm-agel-warn">
        <AlertTriangle :size="16" />
        <span>This sale will be recorded as credit for {{ cart.customerObj?.name || 'the customer' }}. The customer's outstanding balance will increase.</span>
      </div>

      <!-- Error -->
      <div v-if="error" class="pm-error">{{ error }}</div>

      <button class="pm-confirm" :disabled="loading || !canConfirm" @click="confirm">
        <span v-if="loading">Processing…</span>
        <span v-else>Confirm Payment</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { X, AlertTriangle } from 'lucide-vue-next'
import api from '@/api/axios'
import { useCartStore } from '@/stores/cart'
import { usePosStore } from '@/stores/pos'
import { useAuthStore } from '@/stores/auth'

const emit = defineEmits(['close', 'success'])

const cart = useCartStore()
const pos  = usePosStore()
const auth = useAuthStore()

const currSymbol     = computed(() => auth.currencySymbol || 'EGP')
const selectedMethod = ref(pos.paymentMethods.find(m => m.is_cash) || pos.paymentMethods[0] || null)
const cashReceived   = ref('')
const loading        = ref(false)
const error          = ref('')
const cashInput      = ref(null)

const change = computed(() => {
  const received = parseFloat(cashReceived.value) || 0
  return received - cart.grandTotal
})

const canConfirm = computed(() => {
  if (!selectedMethod.value) return false
  if (selectedMethod.value.is_cash) {
    const r = parseFloat(cashReceived.value) || 0
    return r >= cart.grandTotal
  }
  return true
})

watch(() => selectedMethod.value?.is_cash, (isCash) => {
  if (isCash) nextTick(() => cashInput.value?.focus())
})

function fmtNum(n) {
  return parseFloat(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

async function confirm() {
  if (!canConfirm.value || loading.value) return
  error.value = ''
  loading.value = true
  try {
    // 1. Checkout (DRAFT → POSTED)
    const idempotencyKey = crypto.randomUUID()
    const checkoutRes = await api.post(
      `/api/finance/invoices/${pos.currentInvoiceId}/checkout/`,
      {},
      { headers: { 'Idempotency-Key': idempotencyKey } }
    )
    const invoiceId = pos.currentInvoiceId
    pos.lastPostedInvoiceId = invoiceId

    // 2. Record payment
    await api.post('/api/finance/payments/', {
      invoice: invoiceId,
      method: selectedMethod.value.id,
      amount: cart.grandTotal,
    })

    emit('success', checkoutRes.data)
  } catch (e) {
    const detail = e?.response?.data?.detail
    if (typeof detail === 'string') error.value = detail
    else if (e?.response?.data?.shortages) {
      const s = e.response.data.shortages
      error.value = `Insufficient stock: ${s.map(x => `${x.name} (have ${x.available}, need ${x.requested})`).join(', ')}`
    } else {
      error.value = 'Payment failed. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.pm-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.55);
  display: flex; align-items: center; justify-content: center; z-index: 9999;
}
.pm-card {
  background: var(--bg-card); border-radius: 20px; padding: 28px 32px;
  min-width: 400px; max-width: 520px; display: flex; flex-direction: column; gap: 20px;
  box-shadow: 0 20px 80px rgba(0,0,0,0.3);
}
.pm-header { display: flex; align-items: center; justify-content: space-between; }
.pm-title { font-size: 20px; font-weight: 800; color: var(--text-primary); }
.pm-close { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 4px; border-radius: 8px; }
.pm-close:hover { background: var(--border); }

.pm-total {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 20px; background: var(--bg-app); border-radius: 14px;
}
.pm-total-label { font-size: 12px; font-weight: 600; letter-spacing: 0.06em; color: var(--text-muted); text-transform: uppercase; }
.pm-total-amount { font-size: 32px; font-weight: 900; color: var(--text-primary); }

.pm-methods { display: flex; flex-wrap: wrap; gap: 8px; }
.pm-method {
  flex: 1; min-width: 120px; padding: 12px 16px; border-radius: 12px;
  border: 2px solid var(--border); background: var(--bg-app);
  cursor: pointer; font-size: 14px; font-weight: 700; color: var(--text-secondary);
  transition: all 150ms; display: flex; align-items: center; justify-content: center; gap: 8px;
}
.pm-method:hover { border-color: var(--accent); }
.pm-method.active { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
.pm-agel-badge {
  font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px;
  background: #fef3c7; color: #92400e;
}

.pm-cash-section { display: flex; flex-direction: column; gap: 10px; }
.pm-cash-label { font-size: 12px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.pm-cash-wrap {
  display: flex; align-items: center; gap: 10px;
  border: 2px solid var(--border); border-radius: 12px; padding: 12px 16px;
}
.pm-cash-wrap:focus-within { border-color: var(--accent); }
.pm-cash-prefix { font-size: 15px; font-weight: 700; color: var(--text-muted); }
.pm-cash-input {
  flex: 1; border: none; background: none; font-size: 24px; font-weight: 800;
  color: var(--text-primary); outline: none;
}
.pm-change { font-size: 14px; color: #16a34a; font-weight: 700; text-align: right; }

.pm-agel-warn {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 14px; border-radius: 12px; background: #fffbeb; border: 1px solid #fde68a;
  font-size: 13px; color: #92400e;
}

.pm-error {
  padding: 12px 16px; border-radius: 10px; background: #fef2f2;
  border: 1px solid #fecaca; color: #dc2626; font-size: 13px; font-weight: 600;
}

.pm-confirm {
  padding: 16px; border-radius: 14px; border: none;
  background: #16a34a; color: #fff; cursor: pointer;
  font-size: 16px; font-weight: 800; transition: opacity 150ms;
}
.pm-confirm:disabled { opacity: 0.4; cursor: not-allowed; }
.pm-confirm:not(:disabled):hover { opacity: 0.9; }
</style>
