<template>
  <AppModal :open="true" :large-close="true" anim="drop" :title="t('pos.payment.title')" width="560px" @close="$emit('close')">
    <div class="pm-body" @keydown="onKeydown">
      <div class="pm-total">
        <span class="pm-total-label">{{ t('pos.payment.total_due') }}</span>
        <span class="pm-total-amount">{{ currSymbol }} {{ fmtNum(totalDue) }}</span>
      </div>
      <div v-if="taxTotal > 0" class="pm-tax-line">{{ t('pos.payment.incl_vat', { amount: fmtNum(taxTotal) }) }}</div>

      <!-- Method tabs — set the method of the ACTIVE line (Alt+1…9) -->
      <div class="pm-methods">
        <button
          v-for="(m, i) in tabs" :key="m.id"
          :class="['pm-method', { active: activeLine?.methodId === m.id }]"
          @click="pickMethod(m)"
        >
          <span class="pm-method-key">{{ i + 1 }}</span>
          {{ m.name }}
          <span v-if="m.is_agel" class="pm-agel-badge">{{ t('pos.payment.credit') }}</span>
          <span v-if="m.is_store_credit" class="pm-sc-badge">{{ fmtNum(storeCredit) }}</span>
        </button>
      </div>

      <!-- Payment lines (split payment, s167) -->
      <div class="pm-lines">
        <div
          v-for="(line, i) in lines" :key="line.key"
          :class="['pm-line', { active: line.key === activeKey }]"
          @click="activeKey = line.key"
        >
          <div class="pm-line-main">
            <span class="pm-line-method">{{ methodOf(line)?.name || '—' }}</span>
            <div class="pm-line-amount">
              <span class="pm-cash-prefix">{{ currSymbol }}</span>
              <input
                v-if="!isAjel(line)"
                :ref="el => setInputRef(line.key, el)"
                v-model="line.amount"
                type="number" min="0" step="0.01" inputmode="decimal"
                class="pm-cash-input" placeholder="0.00"
                @focus="activeKey = line.key; $event.target.select()"
              />
              <span v-else class="pm-ajel-amount">{{ fmtNum(ajelCents / 100) }}</span>
            </div>
            <button v-if="!isAjel(line)" type="button" class="pm-line-btn" :title="t('pos.payment.rest_hint')" @click.stop="fillRest(line)">
              {{ t('pos.payment.rest') }}
            </button>
            <button v-if="lines.length > 1" type="button" class="pm-line-btn pm-line-x" :aria-label="t('pos.payment.remove_line')" @click.stop="removeLine(i)">
              <X :size="14" />
            </button>
          </div>
          <div v-if="isAjel(line)" class="pm-line-note">
            {{ t('pos.payment.on_account', { name: cart.customerObj?.name || t('pos.payment.the_customer') }) }}
          </div>
          <div v-else-if="line.key === changeLineKey && changeCents > 0" class="pm-change">
            {{ t('pos.payment.change') }}: <strong>{{ currSymbol }} {{ fmtNum(changeCents / 100) }}</strong>
          </div>
        </div>
      </div>

      <div class="pm-summary">
        <button type="button" class="pm-add" @click="addLine()">
          <Plus :size="15" /> {{ t('pos.payment.add_line') }}
        </button>
        <span v-if="leftCents > 0 && !ajelLine" class="pm-left">
          {{ t('pos.payment.left_to_pay') }}: <strong>{{ currSymbol }} {{ fmtNum(leftCents / 100) }}</strong>
        </span>
        <span v-else-if="changeCents > 0" class="pm-left pm-left--change">
          {{ t('pos.payment.change') }}: <strong>{{ currSymbol }} {{ fmtNum(changeCents / 100) }}</strong>
        </span>
      </div>

      <!-- Agel credit warning -->
      <div v-if="ajelLine && ajelCents > 0" class="pm-agel-warn">
        <AlertTriangle :size="16" />
        <span v-if="agelNeedsCustomer">{{ t('pos.payment.agel_needs_customer') }}</span>
        <span v-else-if="!allowAgel">{{ t('pos.payment.agel_off') }}</span>
        <span v-else>{{ t('pos.payment.agel_warn', { name: cart.customerObj?.name || t('pos.payment.the_customer') }) }}</span>
      </div>
      <div v-if="problem" class="pm-error">{{ problem }}</div>

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
      <div class="pm-hint">{{ t('pos.payment.keys_hint') }}</div>
    </div>
  </AppModal>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { AlertTriangle, Plus, X } from 'lucide-vue-next'
import api from '@/api/axios'
import { useCartStore } from '@/stores/cart'
import { usePosStore } from '@/stores/pos'
import { useAuthStore } from '@/stores/auth'
import { formatNumber } from '@/utils/format'
import AppModal from '@/components/ui/AppModal.vue'

const { t } = useI18n()
const emit = defineEmits(['close', 'success'])
// serverTotals = the draft as the server last saved it. Its grand_total includes VAT, which the cart's own
// figure does not — so it is what we show and charge (s156, §AUDIT A4). Falls back to the cart if missing.
const props = defineProps({ serverTotals: { type: Object, default: null } })

const cart = useCartStore()
const pos  = usePosStore()
const auth = useAuthStore()

const currSymbol = computed(() => auth.currencySymbol || 'EGP')
const loading    = ref(false)
const error      = ref('')

const printReceipt = ref(true)
const doublePrint  = ref(false)
const allowAgel    = ref(true)

// The customer's store credit — re-read from the server when the window opens (the cart's copy may be old).
const isNamedCustomer = computed(() => !!cart.customerObj && !cart.customerObj.is_walk_in)
const storeCredit     = ref(isNamedCustomer.value ? Number(cart.customerObj?.store_credit) || 0 : 0)

const totalDue = computed(() => {
  const g = parseFloat(props.serverTotals?.grand_total)
  return Number.isFinite(g) ? g : cart.grandTotal
})
const taxTotal = computed(() => parseFloat(props.serverTotals?.tax_total) || 0)

// ── Methods ─────────────────────────────────────────────────
// Store credit is not a real shop method: the server spends the wallet when it sees "STORE_CREDIT" (s167).
const STORE_CREDIT = 'STORE_CREDIT'
// Order (so Alt+1 is always the drawer): cash → the shop's other methods → store credit → Ajel last.
const tabs = computed(() => {
  const ms = pos.paymentMethods
  const list = [...ms.filter(m => m.is_cash), ...ms.filter(m => !m.is_cash && !m.is_agel)]
  if (isNamedCustomer.value && storeCredit.value > 0) {
    list.push({ id: STORE_CREDIT, name: t('pos.payment.store_credit'), is_store_credit: true })
  }
  return [...list, ...ms.filter(m => !m.is_cash && m.is_agel)]
})
const methodOf = line => tabs.value.find(m => m.id === line.methodId) || null
const isAjel   = line => !!methodOf(line)?.is_agel
const isCash   = line => !!methodOf(line)?.is_cash
const defaultMethod = pos.paymentMethods.find(m => m.is_cash) || pos.paymentMethods.find(m => !m.is_agel) || pos.paymentMethods[0] || null

// ── Lines (amounts kept as typed; maths in whole cents) ─────
let seq = 0
const cents = v => { const n = parseFloat(v); return Number.isFinite(n) ? Math.round(n * 100) : 0 }
const toAmount = c => (Math.max(c, 0) / 100).toFixed(2)
const dueCents = computed(() => Math.max(cents(totalDue.value), 0))

// Fast path: one line, the default method, the full amount — PAY then Enter, exactly as before.
const lines     = ref([{ key: ++seq, methodId: defaultMethod?.id ?? null, amount: toAmount(dueCents.value) }])
const activeKey = ref(lines.value[0].key)
const activeLine = computed(() => lines.value.find(l => l.key === activeKey.value) || null)

const inputRefs = {}
function setInputRef(key, el) { if (el) inputRefs[key] = el; else delete inputRefs[key] }
function focusLine(key) { nextTick(() => { inputRefs[key]?.focus(); inputRefs[key]?.select() }) }

const moneyLines = computed(() => lines.value.filter(l => !isAjel(l)))
const paidCents  = computed(() => moneyLines.value.reduce((s, l) => s + Math.max(cents(l.amount), 0), 0))
const otherCents = computed(() => moneyLines.value.filter(l => !isCash(l)).reduce((s, l) => s + Math.max(cents(l.amount), 0), 0))
const scCents    = computed(() => moneyLines.value.filter(l => l.methodId === STORE_CREDIT).reduce((s, l) => s + Math.max(cents(l.amount), 0), 0))
const leftCents   = computed(() => dueCents.value - paidCents.value)        // > 0 = still to pay
const changeCents = computed(() => Math.max(paidCents.value - dueCents.value, 0))
const ajelLine    = computed(() => lines.value.find(isAjel) || null)
const ajelCents   = computed(() => Math.max(leftCents.value, 0))
// Change is shown on the first cash line (the server takes it off the cash lines too).
const changeLineKey = computed(() => moneyLines.value.find(isCash)?.key ?? null)

// Ajel (credit) needs a NAMED customer — the server refuses Walk-in (s156); say so up front.
const agelNeedsCustomer = computed(() => !!ajelLine.value && !isNamedCustomer.value)

const problem = computed(() => {
  if (moneyLines.value.some(l => l.amount !== '' && l.amount != null && cents(l.amount) < 0)) return t('pos.payment.err_negative')
  if (otherCents.value > dueCents.value) return t('pos.payment.err_noncash_over')
  if (scCents.value > Math.round(storeCredit.value * 100)) return t('pos.payment.err_sc_over', { amount: fmtNum(storeCredit.value) })
  return ''
})

const canConfirm = computed(() => {
  if (problem.value || lines.value.some(l => !methodOf(l))) return false
  if (leftCents.value > 0) {
    if (!ajelLine.value) return false
    if (agelNeedsCustomer.value || !allowAgel.value) return false
  }
  return true
})

function pickMethod(m) {
  const line = activeLine.value
  if (!line) return
  if (m.is_agel) {
    // Only one "rest on account" line; picking Ajel on another line moves it here.
    const other = lines.value.find(l => l.key !== line.key && isAjel(l))
    if (other) lines.value = lines.value.filter(l => l.key !== other.key)
    line.methodId = m.id
    return
  }
  const wasAjel = isAjel(line)
  line.methodId = m.id
  if (wasAjel) line.amount = toAmount(dueCents.value - paidCents.value)
  if (m.id === STORE_CREDIT) {
    // Never more than they have, never more than is left on this line.
    line.amount = toAmount(Math.min(cents(line.amount) || Math.max(leftCents.value, 0), Math.round(storeCredit.value * 100)))
  }
  focusLine(line.key)
}

function addLine() {
  const used = new Set(lines.value.map(l => l.methodId))
  const next = pos.paymentMethods.find(m => !m.is_agel && !used.has(m.id)) || defaultMethod
  const line = { key: ++seq, methodId: next?.id ?? null, amount: leftCents.value > 0 ? toAmount(leftCents.value) : '' }
  lines.value.push(line)
  activeKey.value = line.key
  focusLine(line.key)
}

function removeLine(i) {
  const [gone] = lines.value.splice(i, 1)
  if (gone?.key === activeKey.value) activeKey.value = lines.value[0]?.key
}

// "Rest": this line = whatever the other lines don't cover.
function fillRest(line) {
  const others = moneyLines.value.filter(l => l.key !== line.key).reduce((s, l) => s + Math.max(cents(l.amount), 0), 0)
  let c = Math.max(dueCents.value - others, 0)
  if (line.methodId === STORE_CREDIT) c = Math.min(c, Math.round(storeCredit.value * 100))
  line.amount = toAmount(c)
  activeKey.value = line.key
  focusLine(line.key)
}

// Keyboard first: Enter pays (or, with money still owed and no Ajel, opens a line for the rest);
// Alt+1…9 picks the method of the active line.
function onKeydown(e) {
  if (e.altKey && /^[1-9]$/.test(e.key)) {
    const m = tabs.value[Number(e.key) - 1]
    if (m) { e.preventDefault(); pickMethod(m) }
    return
  }
  if (e.key === 'Enter' && !e.shiftKey && e.target?.tagName === 'INPUT' && e.target.type !== 'checkbox') {
    e.preventDefault()
    if (canConfirm.value) confirm()
    else if (leftCents.value > 0 && !ajelLine.value && !problem.value) addLine()
  }
}

onMounted(async () => {
  focusLine(activeKey.value)
  try {
    const { data } = await api.get('/api/core/settings/')
    printReceipt.value = data.pos_print_default ?? true
    doublePrint.value  = data.pos_double_print_default ?? false
    allowAgel.value    = data.enable_agel_selling ?? true
  } catch {
    // keep safe fallbacks
  }
  if (isNamedCustomer.value) {
    try {
      const { data } = await api.get(`/api/auth/customers/${cart.customerObj.id}/`)
      storeCredit.value = Number(data.store_credit) || 0
    } catch { /* keep the cart's copy */ }
  }
})

function fmtNum(n) {
  return formatNumber(n)
}

function buildPayments() {
  const out = moneyLines.value
    .filter(l => cents(l.amount) > 0)
    .map(l => ({ method: l.methodId, amount: toAmount(cents(l.amount)) }))
  if (ajelLine.value && ajelCents.value > 0) out.push({ method: ajelLine.value.methodId, amount: toAmount(ajelCents.value) })
  return out
}

async function confirm() {
  if (!canConfirm.value || loading.value) return
  error.value = ''
  loading.value = true
  try {
    // ONE call completes the sale AND takes the payment (s156) — since s167 as several lines: cash + card +
    // store credit + the rest on Ajel; the server keeps change off the cash line. A sale with nothing to pay
    // (100% discount) sends no lines.
    // ONE key per sale, reused on every retry (s157, §AUDIT A5): if the reply was lost after the server
    // finished, the retry gets that finished sale back instead of "already posted".
    if (pos.checkoutKey.invoice !== pos.currentInvoiceId) {
      pos.checkoutKey = { invoice: pos.currentInvoiceId, key: crypto.randomUUID() }
    }
    const idempotencyKey = pos.checkoutKey.key
    const payments = buildPayments()
    const checkoutRes = await api.post(
      `/api/finance/invoices/${pos.currentInvoiceId}/checkout/`,
      payments.length ? { payments } : {},
      { headers: { 'Idempotency-Key': idempotencyKey } }
    )
    pos.lastPostedInvoiceId = pos.currentInvoiceId

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
    } else if (Array.isArray(data) && typeof data[0] === 'string') {
      error.value = data[0]   // credit-limit BLOCK comes back as a plain list
    } else {
      error.value = t('pos.payment.err_failed')
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.pm-body { display: flex; flex-direction: column; gap: 16px; }

.pm-total {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 20px; background: var(--bg-app); border-radius: 14px;
}
.pm-total-label { font-size: 12px; font-weight: 600; letter-spacing: 0.06em; color: var(--text-muted); text-transform: uppercase; }
.pm-total-amount { font-size: 32px; font-weight: 900; color: var(--text-primary); }

.pm-methods { display: flex; flex-wrap: wrap; gap: 8px; }
.pm-method {
  flex: 1; min-width: 110px; padding: 11px 14px; border-radius: 12px;
  border: 2px solid var(--border); background: var(--bg-app);
  cursor: pointer; font-size: 14px; font-weight: 700; color: var(--text-secondary);
  transition: all 150ms; display: flex; align-items: center; justify-content: center; gap: 8px;
}
.pm-method:hover { border-color: var(--accent); }
.pm-method.active { border-color: var(--accent); background: var(--accent-soft); color: var(--accent); }
.pm-method-key { font-size: 10px; font-weight: 700; color: var(--text-muted); opacity: .8; }
.pm-tax-line { margin-top: -6px; text-align: end; font-size: 12px; color: var(--text-muted); }
.pm-agel-badge {
  font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px;
  background: var(--warning-soft); color: var(--warning);
}
.pm-sc-badge {
  font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px;
  background: var(--success-soft); color: var(--success);
}

.pm-lines { display: flex; flex-direction: column; gap: 8px; }
.pm-line {
  display: flex; flex-direction: column; gap: 6px;
  border: 2px solid var(--border); border-radius: 12px; padding: 10px 12px;
  cursor: pointer; transition: border-color 150ms;
}
.pm-line.active { border-color: var(--accent); }
.pm-line-main { display: flex; align-items: center; gap: 10px; min-width: 0; }
.pm-line-method { flex: 0 0 auto; max-width: 34%; font-size: 13px; font-weight: 800; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pm-line-amount { flex: 1; display: flex; align-items: center; gap: 8px; min-width: 0; }
.pm-cash-prefix { font-size: 14px; font-weight: 700; color: var(--text-muted); }
.pm-cash-input {
  flex: 1; min-width: 0; border: none; background: none; font-size: 22px; font-weight: 800;
  color: var(--text-primary); outline: none;
}
.pm-cash-input { appearance: textfield; -moz-appearance: textfield; }
.pm-cash-input::-webkit-outer-spin-button,
.pm-cash-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.pm-ajel-amount { flex: 1; font-size: 22px; font-weight: 800; color: var(--warning); }
/* Phone: the method name sits above the amount so the number keeps the room. */
@media (max-width: 520px) {
  .pm-line-main { flex-wrap: wrap; row-gap: 2px; }
  .pm-line-method { flex-basis: 100%; max-width: none; font-size: 12px; }
  .pm-cash-input, .pm-ajel-amount { font-size: 20px; }
}
.pm-line-btn {
  flex: 0 0 auto; padding: 6px 10px; border-radius: 8px; border: 1px solid var(--border);
  background: var(--bg-app); color: var(--text-secondary); font-size: 12px; font-weight: 700; cursor: pointer;
  display: inline-flex; align-items: center;
}
.pm-line-btn:hover { border-color: var(--accent); color: var(--accent); }
.pm-line-x { padding: 6px; }
.pm-line-note { font-size: 12px; color: var(--text-muted); }
.pm-change { font-size: 14px; color: var(--success); font-weight: 700; text-align: end; }

.pm-summary { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-top: -4px; }
.pm-add {
  display: inline-flex; align-items: center; gap: 6px; padding: 7px 12px; border-radius: 10px;
  border: 1px dashed var(--border); background: none; color: var(--text-secondary);
  font-size: 13px; font-weight: 700; cursor: pointer;
}
.pm-add:hover { border-color: var(--accent); color: var(--accent); }
.pm-left { font-size: 14px; font-weight: 700; color: var(--warning); }
.pm-left--change { color: var(--success); }

.pm-agel-warn {
  display: flex; align-items: flex-start; gap: 10px;
  padding: 14px; border-radius: 12px; background: var(--warning-soft); border: 1px solid var(--warning);
  font-size: 13px; color: var(--warning);
}

.pm-print-opts { display: flex; gap: 22px; padding: 2px 4px; flex-wrap: wrap; }
.pm-print-cb { display: flex; align-items: center; gap: 9px; font-size: 13.5px; font-weight: 600; color: var(--text-secondary); cursor: pointer; user-select: none; }
.pm-print-cb input { width: 17px; height: 17px; accent-color: var(--accent); cursor: pointer; }
.pm-print-cb.disabled { opacity: .45; cursor: not-allowed; }
.pm-print-cb.disabled input { cursor: not-allowed; }

.pm-error {
  padding: 12px 16px; border-radius: 10px; background: var(--danger-soft);
  border: 1px solid var(--danger); color: var(--danger); font-size: 13px; font-weight: 600;
}

.pm-confirm {
  padding: 16px; border-radius: 14px; border: none; width: 100%;
  background: var(--success); color: #fff; cursor: pointer;
  font-size: 16px; font-weight: 800; transition: opacity 150ms;
}
.pm-confirm:disabled { opacity: 0.4; cursor: not-allowed; }
.pm-confirm:not(:disabled):hover { opacity: 0.9; }
.pm-hint { margin-top: -8px; text-align: center; font-size: 11.5px; color: var(--text-muted); }
</style>
