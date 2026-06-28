<template>
  <div class="print-page">
    <!-- Screen-only toolbar (hidden when printing) -->
    <div class="print-toolbar no-print">
      <button class="tb-btn" @click="goBack"><ArrowLeft :size="15" /> {{ t('inventory.purchases.purchase_print.back') }}</button>
      <div class="tb-title">{{ t('inventory.purchases.purchase_print.title') }} {{ doc.purchase?.purchase_number ? '#' + doc.purchase.purchase_number : '' }}</div>
      <button class="tb-btn primary" :disabled="loading || !!error" @click="doPrint"><Printer :size="15" /> {{ t('inventory.purchases.purchase_print.print') }}</button>
    </div>

    <div v-if="loading" class="print-state">{{ t('inventory.purchases.purchase_print.loading') }}</div>
    <div v-else-if="error" class="print-state error">{{ error }}</div>

    <!-- The printable document -->
    <div v-else class="invoice-sheet">
      <header class="inv-head">
        <div class="inv-store">
          <div class="store-name">{{ doc.store.name }}</div>
          <div v-if="headerLines.length" class="store-meta">
            <div v-for="(line, i) in headerLines" :key="i">{{ line }}</div>
          </div>
          <div v-if="doc.store.phone_number" class="store-meta">Tel: {{ doc.store.phone_number }}</div>
          <div v-if="storeLocation" class="store-meta">{{ storeLocation }}</div>
        </div>
        <div class="inv-meta">
          <div class="inv-title">PURCHASE INVOICE</div>
          <div class="inv-num">#{{ doc.purchase.purchase_number || '—' }}</div>
          <div v-if="doc.purchase.vendor_reference" class="inv-date">Supplier Inv #: {{ doc.purchase.vendor_reference }}</div>
          <div class="inv-date">{{ fmtDate(doc.purchase.date) }}</div>
          <span class="inv-status" :class="'st-' + doc.purchase.status.toLowerCase()">{{ doc.purchase.status }}</span>
        </div>
      </header>

      <div class="inv-parties">
        <div>
          <div class="party-label">Supplier</div>
          <div class="party-name">{{ doc.supplier?.name || '—' }}</div>
        </div>
        <div v-if="doc.branch" class="ta-right">
          <div class="party-label">Branch</div>
          <div class="party-name">{{ doc.branch.name }}</div>
        </div>
      </div>

      <table class="inv-items">
        <thead>
          <tr>
            <th>Item</th>
            <th class="ta-right">Qty</th>
            <th class="ta-right">Base (Cost)</th>
            <th class="ta-right">Retail</th>
            <th class="ta-right">Line Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(it, i) in doc.items" :key="i">
            <td>
              <div class="it-name">{{ it.name }}<span v-if="it.unit_name"> · {{ it.unit_name }}</span></div>
              <div class="it-sku">{{ it.sku }}</div>
            </td>
            <td class="ta-right">{{ formatQty(it.quantity) }}</td>
            <td class="ta-right"><Money :value="it.base_cost" /></td>
            <td class="ta-right"><Money :value="it.retail" /></td>
            <td class="ta-right"><Money :value="it.line_total" /></td>
          </tr>
          <tr v-if="!doc.items.length"><td colspan="5" class="ta-center muted">No line items.</td></tr>
        </tbody>
      </table>

      <div class="inv-totals">
        <div class="tot-row"><span>Total Base Cost</span><Money :value="doc.purchase.base_total" /></div>
        <div class="tot-row grand"><span>Total Retail</span><Money :value="doc.purchase.retail_total" /></div>
      </div>

      <div v-if="doc.purchase.notes" class="inv-notes">
        <div class="party-label">Notes</div>
        <div class="notes-body">{{ doc.purchase.notes }}</div>
      </div>

      <footer v-if="footerLines.length" class="inv-foot">
        <div v-for="(line, i) in footerLines" :key="i">{{ line }}</div>
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
import { formatQty } from '@/utils/format'

const { t }  = useI18n()
const route  = useRoute()
const router = useRouter()
const fmt    = useFormatStore()

const loading = ref(true)
const error   = ref('')
const doc = reactive({
  purchase: {}, store: {}, branch: null, supplier: null,
  legal: {}, currency: null, items: [],
})

const headerLines = computed(() => (doc.legal.receipt_header || '').split('\n').map(l => l.trim()).filter(Boolean))
const footerLines = computed(() => (doc.legal.receipt_footer || '').split('\n').map(l => l.trim()).filter(Boolean))
const storeLocation = computed(() => [doc.store.city, doc.store.country].filter(Boolean).join(', '))

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await api.get(`/api/finance/purchases/${route.params.id}/print-data/`)
    Object.assign(doc, res.data)
    // Honor the purchase's own store currency for this document (sudo-safe).
    if (doc.currency) {
      fmt.symbol = doc.currency.symbol || fmt.symbol
      fmt.position = doc.currency.position || fmt.position
    }
  } catch (e) {
    error.value = e.response?.status === 404
      ? t('inventory.purchases.purchase_print.err_not_found')
      : (e.response?.data?.detail || t('inventory.purchases.purchase_print.err_load'))
  } finally {
    loading.value = false
  }
}

function doPrint() { window.print() }
function goBack() { router.push('/inventory/purchases') }

onMounted(async () => {
  await load()
  // Auto-print when opened from the New Purchase modal (?auto=1).
  if (route.query.auto && !error.value) doPrint()
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
.st-received { background:var(--success-soft); color:var(--success-hover); }
.st-draft    { background:var(--warning-soft); color:var(--warning-hover); }

.inv-parties { display:flex; justify-content:space-between; gap:24px; margin:22px 0; }
.party-label { font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:.08em; color:#94a3b8; margin-bottom:3px; }
.party-name  { font-size:14px; font-weight:600; }

.inv-items { width:100%; border-collapse:collapse; margin-bottom:18px; }
.inv-items th { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:#64748b;
  text-align:left; padding:8px 10px; border-bottom:1.5px solid #e2e8f0; }
.inv-items td { padding:10px; border-bottom:1px solid #eef2f6; font-size:13px; vertical-align:top; }
.it-name { font-weight:600; }
.it-sku  { font-size:11px; color:#94a3b8; font-variant-numeric:tabular-nums; }

.inv-totals { margin-left:auto; width:280px; display:flex; flex-direction:column; gap:6px; }
.tot-row { display:flex; justify-content:space-between; font-size:13px; color:#334155; }
.tot-row.grand { border-top:1.5px solid #0f172a; margin-top:6px; padding-top:8px; font-size:16px; font-weight:800; color:#0f172a; }

.inv-notes { margin-top:24px; border-top:1px solid #eef2f6; padding-top:12px; }
.notes-body { font-size:12.5px; color:#475569; line-height:1.55; white-space:pre-wrap; }

.inv-foot { margin-top:32px; border-top:1px dashed #cbd5e1; padding-top:14px; text-align:center; font-size:12px; color:#64748b; line-height:1.6; }

.ta-right { text-align:right; }
.ta-center { text-align:center; }
.muted { color:#94a3b8; }

@media print {
  .print-page { background:#fff; padding:0; }
  .no-print { display:none !important; }
  .invoice-sheet { box-shadow:none; margin:0; max-width:none; border-radius:0; padding:0; }
}
</style>
