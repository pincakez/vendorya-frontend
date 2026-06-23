<template>
  <AppModal :open="true" :large-close="true" anim="drop" :title="t('pos.payment.title')" width="520px" @close="$emit('close')">
    <div class="pm-body">
      <div class="pm-total">
        <span class="pm-total-label">{{ t('pos.payment.total_due') }}</span>
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
          <span v-if="m.is_agel" class="pm-agel-badge">{{ t('pos.payment.credit') }}</span>
        </button>
      </div>

      <!-- Cash: received amount + change -->
      <div v-if="selectedMethod?.is_cash" class="pm-cash-section">
        <label class="pm-cash-label">{{ t('pos.payment.cash_received') }}</label>
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
          {{ t('pos.payment.change') }}: <strong>{{ currSymbol }} {{ fmtNum(change) }}</strong>
        </div>
      </div>

      <!-- Agel credit warning -->
      <div v-if="selectedMethod?.is_agel" class="pm-agel-warn">
        <AlertTriangle :size="16" />
        <span>{{ t('pos.payment.agel_warn', { name: cart.customerObj?.name || t('pos.payment.the_customer') }) }}</span>
      </div>

      <!-- Print options -->
      <div class="pm-print-opts">
        <label class="pm-print-cb">
          <input type="checkbox" v-model="printReceipt" />
          <span>{{ t('pos.payment.print_receipt') }}</span>
        </label>
        <label class="pm-print-cb" :class="{ disabled: !printReceipt }">
          <input type="checkbox" v-model="doublePrint" :disabled="!printReceipt" />
          <span>{{ t('pos.payment.double_print') }}</span>
        </label>
      </div>

      <!-- Error -->
      <div v-if="error" class="pm-error">{{ error }}</div>

      <button class="pm-confirm" :disabled="loading || !canConfirm" @click="confirm">
        <span v-if="loading">{{ t('pos.payment.processing') }}</span>
        <span v-else>{{ t('pos.payment.confirm') }}</span>
      </button>
    </div>
  </AppModal>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { AlertTriangle } from 'lucide-vue-next'
import api from '@/api/axios'
import { useCartStore } from '@/stores/cart'
import { usePosStore } from '@/stores/pos'
import { useAuthStore } from '@/stores/auth'
import AppModal from '@/components/ui/AppModal.vue'

const { t } = useI18n()
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

const printReceipt = ref(true)
const doublePrint  = ref(false)

onMounted(async () => {
  try {
    const { data } = await api.get('/api/core/settings/')
    printReceipt.value = data.pos_print_default ?? true
    doublePrint.value  = data.pos_double_print_default ?? false
  } catch {
    // keep safe fallbacks
  }
})

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
    const idempotencyKey = crypto.randomUUID()
    const checkoutRes = await api.post(
      `/api/finance/invoices/${pos.currentInvoiceId}/checkout/`,
      {},
      { headers: { 'Idempotency-Key': idempotencyKey } }
    )
    const invoiceId = pos.currentInvoiceId
    pos.lastPostedInvoiceId = invoiceId

    await api.post('/api/finance/payments/', {
      invoice: invoiceId,
      method: selectedMethod.value.id,
      amount: cart.grandTotal,
    })

    emit('success', checkoutRes.data, {
      print:  printReceipt.value,
      copies: doublePrint.value ? 2 : 1,
    })
  } catch (e) {
    const data = e?.response?.data
    if (data?.expired) {
      const names = data.expired.map(x => x.name).join(', ')
      error.value = t('pos.payment.err_expired', { names })
    } else if (typeof data?.detail === 'string') {
      error.value = data.detail
    } else if (data?.shortages) {
      const s = data.shortages
      error.value = t('pos.payment.err_stock') + s.map(x => t('pos.payment.err_stock_item', { name: x.name, have: x.available, need: x.requested })).join(', ')
    } else {
      error.value = t('pos.payment.err_failed')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.pm-body { display: flex; flex-direction: column; gap: 20px; }

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
  background: var(--warning-soft); color: #92400e;
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
.pm-change { font-size: 14px; color: var(--success); font-weight: 700; text-align: right; }

.pm-agel-warn {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 14px; border-radius: 12px; background: #fffbeb; border: 1px solid #fde68a;
  font-size: 13px; color: #92400e;
}

.pm-print-opts { display: flex; gap: 22px; padding: 2px 4px; }
.pm-print-cb { display: flex; align-items: center; gap: 9px; font-size: 13.5px; font-weight: 600; color: var(--text-secondary); cursor: pointer; user-select: none; }
.pm-print-cb input { width: 17px; height: 17px; accent-color: var(--accent); cursor: pointer; }
.pm-print-cb.disabled { opacity: .45; cursor: not-allowed; }
.pm-print-cb.disabled input { cursor: not-allowed; }

.pm-error {
  padding: 12px 16px; border-radius: 10px; background: var(--danger-soft);
  border: 1px solid #fecaca; color: var(--danger); font-size: 13px; font-weight: 600;
}

.pm-confirm {
  padding: 16px; border-radius: 14px; border: none; width: 100%;
  background: var(--success); color: #fff; cursor: pointer;
  font-size: 16px; font-weight: 800; transition: opacity 150ms;
}
.pm-confirm:disabled { opacity: 0.4; cursor: not-allowed; }
.pm-confirm:not(:disabled):hover { opacity: 0.9; }
</style>
