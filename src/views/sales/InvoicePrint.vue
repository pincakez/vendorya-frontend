<template>
  <div class="print-page">
    <!-- Screen-only toolbar (hidden when printing) -->
    <div class="print-toolbar no-print">
      <button class="tb-btn" @click="goBack"><ArrowLeft :size="15" /> {{ t('sales.invoice_print.back') }}</button>
      <div class="tb-title">{{ t('sales.invoice_print.title', { number: inv.invoice?.invoice_number ? '#' + inv.invoice.invoice_number : '' }) }}</div>
      <button class="tb-btn primary" :disabled="loading || !!error" @click="doPrint"><Printer :size="15" /> {{ t('sales.invoice_print.print') }}</button>
    </div>

    <div v-if="loading" class="print-state">{{ t('sales.invoice_print.loading') }}</div>
    <div v-else-if="error" class="print-state error">{{ error }}</div>


    <!-- The printable document — s167: labels in the SHOP's language (st), layout LTR, numbers Western -->
    <div v-else class="invoice-sheet" :lang="shopLang">
      <header class="inv-head">
        <div class="inv-store">
          <div class="store-name" dir="auto">{{ inv.store.name }}</div>
          <div v-if="headerLines.length" class="store-meta">
            <div v-for="(line, i) in headerLines" :key="i" dir="auto">{{ line }}</div>
          </div>
          <div v-if="inv.store.phone_number" class="store-meta" dir="auto">{{ st('receipt.tel', { phone: inv.store.phone_number }) }}</div>
          <div v-if="storeLocation" class="store-meta" dir="auto">{{ storeLocation }}</div>
          <!-- Tax ID prints only when the store enabled it (no "N/A" otherwise) -->
          <div v-if="inv.legal.show_tax_id && inv.legal.tax_id" class="store-meta" dir="auto">{{ st('receipt.tax_id', { id: inv.legal.tax_id }) }}</div>
          <div v-if="inv.legal.commercial_reg" class="store-meta" dir="auto">{{ st('receipt.comm_reg', { reg: inv.legal.commercial_reg }) }}</div>
        </div>
        <div class="inv-meta">
          <div class="inv-title">{{ st('receipt.invoice') }}</div>
          <div class="inv-num">#{{ inv.invoice.invoice_number || '—' }}</div>
          <div class="inv-date">{{ printDate(inv.invoice.date, shopLang) }}</div>
          <span class="inv-status" :class="'st-' + inv.invoice.status.toLowerCase()">{{ statusText }}</span>
        </div>
      </header>

      <div class="inv-parties">
        <div>
          <div class="party-label">{{ st('receipt.billed_to') }}</div>
          <div class="party-name" dir="auto">{{ inv.customer?.name || st('receipt.walk_in') }}</div>
        </div>
        <div v-if="inv.branch" class="ta-right">
          <div class="party-label">{{ st('receipt.branch') }}</div>
          <div class="party-name" dir="auto">{{ inv.branch.name }}</div>
        </div>
      </div>

      <table class="inv-items">
        <thead>
          <tr>
            <th>{{ st('receipt.col_item') }}</th>
            <th class="ta-right">{{ st('receipt.col_qty') }}</th>
            <th class="ta-right">{{ st('receipt.col_unit_price') }}</th>
            <th class="ta-right col-tax">{{ st('receipt.col_tax') }}</th>
            <th class="ta-right">{{ st('receipt.col_total') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(it, i) in inv.items" :key="i">
            <td>
              <div class="it-name" dir="auto">{{ it.name }}<span v-if="it.unit_name"> · {{ it.unit_name }}</span></div>
              <div class="it-sku">{{ it.sku }}</div>
              <div v-if="Number(it.discount_amount) > 0" class="it-disc">{{ st('receipt.disc') }} − <Money :value="it.discount_amount" /></div>
            </td>
            <td class="ta-right">{{ lineQty(it) }}</td>
            <td class="ta-right"><Money :value="it.unit_price" /></td>
            <td class="ta-right col-tax"><Money :value="it.tax_amount" /></td>
            <td class="ta-right"><Money :value="it.total" /></td>
          </tr>
          <tr v-if="!inv.items.length"><td colspan="5" class="ta-center muted">{{ st('receipt.no_items') }}</td></tr>
        </tbody>
      </table>

      <div class="inv-totals">
        <div class="tot-row"><span>{{ st('receipt.subtotal') }}</span><Money :value="inv.invoice.subtotal" /></div>
        <div class="tot-row"><span>{{ st('receipt.tax') }}</span><Money :value="inv.invoice.tax_total" /></div>
        <div v-if="Number(inv.invoice.discount) > 0" class="tot-row"><span>{{ st('receipt.discount') }}</span><span>− <Money :value="inv.invoice.discount" /></span></div>
        <div class="tot-row grand"><span>{{ st('receipt.grand_total') }}</span><Money :value="inv.invoice.grand_total" /></div>
        <div class="tot-row"><span>{{ st('receipt.paid') }}</span><Money :value="inv.invoice.paid_amount" /></div>
        <div v-if="balance > 0" class="tot-row balance"><span>{{ st('receipt.balance_due') }}</span><Money :value="balance" /></div>
      </div>

      <div v-if="inv.payments.length" class="inv-payments">
        <div class="party-label">{{ st('receipt.payments') }}</div>
        <div v-for="(p, i) in inv.payments" :key="i" class="pay-row">
          <span dir="auto">{{ p.method }}</span><Money :value="p.amount" />
        </div>
        <template v-if="changeGiven > 0">
          <div class="pay-row"><span dir="auto">{{ st('receipt.cash_received') }}</span><Money :value="cashReceived" /></div>
          <div class="pay-row"><span dir="auto">{{ st('receipt.change_given') }}</span><Money :value="changeGiven" /></div>
        </template>
      </div>

      <footer v-if="footerLines.length" class="inv-foot">
        <div v-for="(line, i) in footerLines" :key="i" dir="auto">{{ line }}</div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Printer } from 'lucide-vue-next'
import api from '@/api/axios'
import { useFormatStore } from '@/stores/format'
import { formatQty, formatWeight } from '@/utils/format'
import { useQZTray } from '@/composables/useQZTray'
import { useShopLocale, printDate } from '@/composables/useShopLocale'

const { t }  = useI18n()
const route  = useRoute()
const router = useRouter()
const fmt    = useFormatStore()
const { sendRaw, isAvailable } = useQZTray()

const loading = ref(true)
const error   = ref('')
const receiptPrinterName = ref('')
const inv = reactive({
  invoice: {}, store: {}, branch: null, customer: null,
  legal: {}, currency: null, items: [], payments: [], weight_unit: 'KG',
})

const balance = computed(() => Number(inv.invoice.grand_total || 0) - Number(inv.invoice.paid_amount || 0))
// s167 split payment: cash change handed back — the cash payment lines hold only the money KEPT.
const changeGiven  = computed(() => Number(inv.invoice.change_given || 0))
const cashReceived = computed(() =>
  inv.payments.filter(p => p.is_cash).reduce((s, p) => s + Number(p.amount || 0), 0) + changeGiven.value)
const headerLines = computed(() => (inv.legal.receipt_header || '').split('\n').map(l => l.trim()).filter(Boolean))
const footerLines = computed(() => (inv.legal.receipt_footer || '').split('\n').map(l => l.trim()).filter(Boolean))
const storeLocation = computed(() => [inv.store.city, inv.store.country].filter(Boolean).join(', '))
// §WT: weight lines read "250 g" / "0.25 kg" in the invoice's store weight unit; others a plain qty.
function lineQty(it) {
  return it.is_weight ? formatWeight(it.quantity, inv.weight_unit) : formatQty(it.quantity)
}

// s167: the document speaks the shop's language (print-data store.default_language).
const { st, shopLang } = useShopLocale(() => inv.store.default_language)
const statusText = computed(() => {
  const s = String(inv.invoice.status || '').toLowerCase()
  return s ? st(`sales.status.${s}`) : ''
})
// Silent thermal printing (QZ Tray RAW ESC/POS) stays ENGLISH even for an Arabic shop: a raw
// thermal printer gets plain bytes, so it cannot join or right-to-left Arabic letters — they'd
// print broken or as "?". The browser receipt (screen + print dialog) is in the shop's language.
const rt = (key, params = {}) => t(key, params, { locale: 'en' })

function fmtDate(d) { return printDate(d, 'en') }   // raw ESC/POS date (English month)

async function load() {
  loading.value = true
  error.value = ''
  try {
    const [printRes, settingsRes] = await Promise.all([
      api.get(`/api/finance/invoices/${route.params.id}/print-data/`),
      api.get('/api/core/settings/'),
    ])
    Object.assign(inv, printRes.data)
    receiptPrinterName.value = settingsRes.data.receipt_printer_name || ''
    // Honor the invoice's own store currency for this document (sudo-safe).
    if (inv.currency) {
      fmt.symbol = inv.currency.symbol || fmt.symbol
      fmt.position = inv.currency.position || fmt.position
    }
  } catch (e) {
    error.value = e.response?.status === 404
      ? t('sales.invoice_print.err_not_found')
      : (e.response?.data?.detail || t('sales.invoice_print.err_load'))
  } finally {
    loading.value = false
  }
}

// ── ESC/POS receipt builder ─────────────────────────────────────────────────
const ESC = '\x1B', GS = '\x1D', LF = '\x0A'
const INIT    = ESC + '\x40'
const CENTER  = ESC + '\x61\x01'
const LEFT    = ESC + '\x61\x00'
const BOLD_ON = ESC + '\x45\x01'
const BOLD_OFF= ESC + '\x45\x00'
const SIZE_2X = ESC + '\x21\x30'
const SIZE_NRM= ESC + '\x21\x00'
const CUT     = GS  + '\x56\x42\x05'
const COLS = 48

function esc_line(text = '') { return text + LF }
function esc_dashes() { return '-'.repeat(COLS) + LF }
function esc_two(left, right) {
  const gap = Math.max(1, COLS - left.length - right.length)
  return left + ' '.repeat(gap) + right + LF
}
function esc_money(val) { return parseFloat(val || 0).toFixed(2) }

function buildInvoiceESCPOS() {
  let out = INIT
  // Store header
  out += CENTER
  out += SIZE_2X + BOLD_ON + esc_line(inv.store.name || '') + SIZE_NRM + BOLD_OFF
  const hdrLines = (inv.legal.receipt_header || '').split('\n').map(l => l.trim()).filter(Boolean)
  for (const l of hdrLines) out += esc_line(l)
  if (inv.store.phone_number) out += esc_line(rt('receipt.tel', { phone: inv.store.phone_number }))
  const loc = [inv.store.city, inv.store.country].filter(Boolean).join(', ')
  if (loc) out += esc_line(loc)
  out += esc_dashes()

  // Invoice meta
  out += LEFT
  out += BOLD_ON + rt('receipt.invoice_no', { number: inv.invoice.invoice_number || '—' }) + BOLD_OFF + LF
  out += esc_line(fmtDate(inv.invoice.date))
  if (inv.customer?.name) out += esc_line((rt('receipt.customer') + ':').padEnd(10) + inv.customer.name)
  if (inv.branch?.name)   out += esc_line((rt('receipt.branch') + ':').padEnd(10) + inv.branch.name)
  out += esc_dashes()

  // Line items
  for (const it of inv.items) {
    const name  = String(it.name || '').slice(0, COLS - 12)
    const total = esc_money(it.total)
    const qty   = it.is_weight ? ' ' + formatWeight(it.quantity, inv.weight_unit) : ' x' + it.quantity
    out += (name + qty).padEnd(COLS - total.length - 1) + ' ' + total + LF
    if (Number(it.discount_amount) > 0) {
      const disc = '- ' + esc_money(it.discount_amount)
      out += ('  ' + rt('receipt.disc')).padEnd(COLS - disc.length - 1) + ' ' + disc + LF
    }
  }
  out += esc_dashes()

  // Totals
  out += esc_two(rt('receipt.subtotal') + ':', esc_money(inv.invoice.subtotal))
  if (Number(inv.invoice.tax_total) > 0)
    out += esc_two(rt('receipt.tax') + ':', esc_money(inv.invoice.tax_total))
  if (Number(inv.invoice.discount) > 0)
    out += esc_two(rt('receipt.discount') + ':', '- ' + esc_money(inv.invoice.discount))
  out += BOLD_ON + esc_two(rt('receipt.total') + ':', esc_money(inv.invoice.grand_total)) + BOLD_OFF
  out += esc_two(rt('receipt.paid') + ':', esc_money(inv.invoice.paid_amount))
  const bal = Number(inv.invoice.grand_total || 0) - Number(inv.invoice.paid_amount || 0)
  if (bal > 0.005) out += BOLD_ON + esc_two(rt('receipt.balance_due') + ':', esc_money(bal)) + BOLD_OFF

  // Payments
  if (inv.payments.length) {
    out += esc_dashes()
    for (const p of inv.payments) out += esc_two(p.method + ':', esc_money(p.amount))
    if (changeGiven.value > 0) {
      out += esc_two(rt('receipt.cash_received') + ':', esc_money(cashReceived.value))
      out += BOLD_ON + esc_two(rt('receipt.change_given') + ':', esc_money(changeGiven.value)) + BOLD_OFF
    }
  }

  // Footer
  const ftrLines = (inv.legal.receipt_footer || '').split('\n').map(l => l.trim()).filter(Boolean)
  if (ftrLines.length) {
    out += esc_dashes()
    out += CENTER
    for (const l of ftrLines) out += esc_line(l)
    out += LEFT
  }
  out += LF + LF + LF + CUT
  return out
}

async function doPrint(copies = 1) {
  // The toolbar button passes a click event — coerce anything non-numeric to 1.
  const n = Number.isInteger(copies) && copies > 0 ? copies : 1
  try {
    const available = await isAvailable()
    if (available && receiptPrinterName.value) {
      for (let i = 0; i < n; i++) {
        await sendRaw(receiptPrinterName.value, buildInvoiceESCPOS())
      }
      return
    }
  } catch {
    // silent — fall through to browser print
  }
  // Browser fallback: one dialog per copy.
  for (let i = 0; i < n; i++) window.print()
}

function goBack() { router.push('/finance/invoices') }

onMounted(async () => {
  await load()
  // Auto-print when opened from POS checkout (?auto=1&copies=N).
  if (route.query.auto && !error.value) {
    const copies = Math.max(1, parseInt(route.query.copies, 10) || 1)
    doPrint(copies)
  }
})
</script>

<style scoped>
.print-page { min-height:100vh; background:#f1f5f9; padding:0 0 40px; }

.print-toolbar { position:sticky; top:0; z-index:5; display:flex; align-items:center; justify-content:space-between;
  gap:12px; padding:12px 18px; background:var(--bg-header,#fff); border-bottom:1px solid var(--border,#e2e8f0); }
.tb-title { font-size:14px; font-weight:700; color:var(--text-primary,#0f172a); }
.tb-btn { display:inline-flex; align-items:center; gap:6px; padding:7px 14px; border-radius:8px; font-size:13px; font-weight:600;
  border:1px solid var(--border,#e2e8f0); background:var(--bg-card,#fff); color:var(--text-primary,#0f172a); cursor:pointer; transition:transform 70ms; }
.tb-btn:active { transform:scale(0.95); }
.tb-btn.primary { background:var(--accent,#f78f1e); border-color:var(--accent,#f78f1e); color:#fff; }
.tb-btn:disabled { opacity:.5; cursor:default; }

.print-state { max-width:760px; margin:48px auto; text-align:center; color:var(--text-muted,#94a3b8); font-size:14px; }
.print-state.error { color:var(--danger); }

.invoice-sheet { max-width:760px; margin:24px auto; background:#fff; color:#0f172a; padding:40px 44px;
  border-radius:10px; box-shadow:0 4px 24px rgba(0,0,0,.06); }

.inv-head { display:flex; justify-content:space-between; gap:24px; border-bottom:2px solid #0f172a; padding-bottom:18px; }
.store-name { font-size:22px; font-weight:800; }
.store-meta { font-size:12px; color:#475569; line-height:1.55; }
.inv-meta { text-align:right; flex-shrink:0; }
.inv-title { font-size:13px; font-weight:800; letter-spacing:.18em; color:#94a3b8; }
.inv-num { font-size:20px; font-weight:800; }
.inv-date { font-size:12px; color:#475569; margin-bottom:6px; }
.inv-status { display:inline-block; padding:2px 10px; border-radius:20px; font-size:11px; font-weight:700; }
.st-posted { background:var(--success-soft); color:var(--success-hover); }
.st-draft  { background:var(--warning-soft); color:var(--warning-hover); }
.st-void   { background:var(--danger-soft); color:var(--danger-hover); }

.inv-parties { display:flex; justify-content:space-between; gap:24px; margin:22px 0; }
.party-label { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#94a3b8; margin-bottom:3px; }
.party-name  { font-size:14px; font-weight:600; }

.inv-items { width:100%; border-collapse:collapse; margin-bottom:18px; }
.inv-items th { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#64748b;
  text-align:left; padding:8px 10px; border-bottom:1.5px solid #e2e8f0; }
.inv-items td { padding:10px; border-bottom:1px solid #eef2f6; font-size:13px; vertical-align:top; }
.inv-items th.ta-right { text-align:right; }   /* s167: number column headers line up with their values */
.it-name { font-weight:600; }
.it-sku  { font-size:11px; color:#94a3b8; font-variant-numeric:tabular-nums; }
.it-disc { font-size:11px; color:var(--danger); font-variant-numeric:tabular-nums; }

.inv-totals { margin-left:auto; width:280px; display:flex; flex-direction:column; gap:6px; }
.tot-row { display:flex; justify-content:space-between; font-size:13px; color:#334155; }
.tot-row.grand { border-top:1.5px solid #0f172a; margin-top:6px; padding-top:8px; font-size:16px; font-weight:800; color:#0f172a; }
.tot-row.balance { font-weight:700; color:var(--danger-hover); }

.inv-payments { margin-top:24px; border-top:1px solid #eef2f6; padding-top:12px; }
.pay-row { display:flex; justify-content:space-between; font-size:12.5px; color:#475569; padding:3px 0; }

.inv-foot { margin-top:32px; border-top:1px dashed #cbd5e1; padding-top:14px; text-align:center; font-size:12px; color:#64748b; line-height:1.6; }

.ta-right { text-align:right; }
.ta-center { text-align:center; }
.muted { color:#94a3b8; }

/* s167: Arabic letters must stay joined — no letter-spacing on an Arabic document. */
.invoice-sheet:lang(ar) .inv-title,
.invoice-sheet:lang(ar) .party-label,
.invoice-sheet:lang(ar) .inv-items th { letter-spacing:0; }

/* s167: narrow paper (80mm / 58mm thermal through the print dialog) and phone screens —
   stack the header, full-width totals, drop the per-line Tax column (the tax total stays). */
@media (max-width: 480px) {
  .invoice-sheet { padding:12px 10px; margin:0; border-radius:0; }
  .inv-head { flex-direction:column; gap:8px; padding-bottom:10px; }
  .inv-meta { text-align:left; }
  .store-name { font-size:16px; }
  .inv-num { font-size:16px; }
  .inv-parties { margin:12px 0; gap:10px; }
  .inv-items th, .inv-items td { padding:5px 3px; font-size:11px; }
  .inv-items th { letter-spacing:0; }
  .col-tax { display:none; }
  .inv-totals { width:100%; }
  .inv-foot { margin-top:16px; }
}

@media print {
  .print-page { background:#fff; padding:0; }
  .no-print { display:none !important; }
  .invoice-sheet { box-shadow:none; margin:0; max-width:none; border-radius:0; padding:0; }
}
</style>
