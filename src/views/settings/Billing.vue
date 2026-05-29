<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Billing</h1>
        <p class="page-sub">Your current Vendorya subscription and invoices.</p>
      </div>
    </div>

    <!-- Current plan card -->
    <div v-if="subscription" class="plan-card">
      <div class="plan-card-left">
        <div class="plan-badge">{{ subscription.display_label }}</div>
        <div class="plan-title">
          You're on the <strong>{{ subscription.plan?.name }}</strong> plan
        </div>
        <div v-if="subscription.plan?.description" class="plan-desc">
          {{ subscription.plan.description }}
        </div>
        <div class="plan-meta">
          <span><strong>Status:</strong> <span :class="'status-pill status-' + subscription.status.toLowerCase()">{{ subscription.status }}</span></span>
          <span v-if="subscription.period_end"><strong>Renews:</strong> {{ subscription.period_end }}</span>
          <span v-if="subscription.trial_ends_at"><strong>Trial ends:</strong> {{ subscription.trial_ends_at }}</span>
        </div>
      </div>
      <div class="plan-card-right">
        <div class="plan-price">
          <span class="price-amt">{{ subscription.plan?.monthly_price || '0.00' }}</span>
          <span class="price-cur">{{ subscription.plan?.currency || 'EGP' }}</span>
        </div>
        <div class="price-sub">per month</div>
      </div>
    </div>
    <div v-else class="plan-card" style="justify-content:center;color:var(--text-muted);">
      No subscription found. Contact support.
    </div>

    <!-- Invoice list -->
    <h2 class="section-title">Invoices</h2>
    <div class="table-wrap">
      <div v-if="invoicesLoading" class="table-skeleton">
        <div v-for="i in 3" :key="i" class="skeleton-row" />
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Issued</th>
            <th>Due</th>
            <th style="width:80px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!invoices.length">
            <td colspan="7" class="table-empty">No invoices yet.</td>
          </tr>
          <tr v-for="inv in invoices" :key="inv.id" class="table-row" @click="openInvoice(inv)">
            <td style="font-family:ui-monospace,monospace;font-size:12px;">{{ inv.invoice_number || '—' }}</td>
            <td style="color:var(--text-secondary);font-size:12.5px;">{{ inv.line_description || '—' }}</td>
            <td style="font-variant-numeric:tabular-nums;font-weight:600;">{{ inv.amount }} {{ inv.currency }}</td>
            <td><span class="status-pill" :class="'inv-' + inv.status.toLowerCase()">{{ inv.status }}</span></td>
            <td style="font-size:12px;color:var(--text-secondary);">{{ inv.issued_at ? formatDate(inv.issued_at) : '—' }}</td>
            <td style="font-size:12px;color:var(--text-secondary);">{{ inv.due_at || '—' }}</td>
            <td>
              <button class="row-action" title="View"><Eye :size="13" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Invoice detail modal -->
    <AppModal :open="detailModal.open" :title="detailModal.invoice?.invoice_number || 'Invoice'" @close="closeDetail">
      <div v-if="detailModal.invoice" class="invoice-printable">
        <div class="invoice-head">
          <div>
            <div class="brand-title">VENDORYA</div>
            <div class="brand-sub">Bill from: Vendorya Ltd</div>
          </div>
          <div style="text-align:right;">
            <div class="inv-no">{{ detailModal.invoice.invoice_number }}</div>
            <div class="inv-status" :class="'inv-' + detailModal.invoice.status.toLowerCase()">{{ detailModal.invoice.status }}</div>
          </div>
        </div>

        <div class="invoice-meta">
          <div>
            <div class="meta-label">Billed to</div>
            <div class="meta-value">{{ detailModal.invoice.store_name }}</div>
          </div>
          <div>
            <div class="meta-label">Issued</div>
            <div class="meta-value">{{ detailModal.invoice.issued_at ? formatDate(detailModal.invoice.issued_at) : '—' }}</div>
          </div>
          <div>
            <div class="meta-label">Due</div>
            <div class="meta-value">{{ detailModal.invoice.due_at || '—' }}</div>
          </div>
          <div>
            <div class="meta-label">Period</div>
            <div class="meta-value">{{ detailModal.invoice.period_start || '—' }} → {{ detailModal.invoice.period_end || '—' }}</div>
          </div>
        </div>

        <table class="invoice-lines">
          <thead>
            <tr><th>Description</th><th style="text-align:right;">Amount</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>{{ detailModal.invoice.line_description || (detailModal.invoice.subscription?.display_label + ' subscription') }}</td>
              <td style="text-align:right;font-variant-numeric:tabular-nums;">{{ detailModal.invoice.amount }} {{ detailModal.invoice.currency }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr><td><strong>Total</strong></td><td style="text-align:right;font-weight:700;font-size:15px;">{{ detailModal.invoice.amount }} {{ detailModal.invoice.currency }}</td></tr>
          </tfoot>
        </table>

        <div v-if="detailModal.invoice.status === 'PAID'" class="paid-note">
          ✓ Paid on {{ formatDate(detailModal.invoice.paid_at) }}
          <span v-if="detailModal.invoice.paid_reference"> · ref {{ detailModal.invoice.paid_reference }}</span>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="closeDetail">Close</button>
        <button class="btn-primary" @click="printInvoice">
          <Printer :size="14" /> Print
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { Eye, Printer } from 'lucide-vue-next'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'

const route = useRoute()
const subscription = ref(null)
const invoices = ref([])
const invoicesLoading = ref(false)

const detailModal = reactive({ open: false, invoice: null })

async function fetchSub() {
  try {
    const res = await api.get('/api/billing/subscription/')
    subscription.value = res.data
  } catch (e) {
    subscription.value = null
  }
}

async function fetchInvoices() {
  invoicesLoading.value = true
  try {
    const res = await api.get('/api/billing/invoices/')
    invoices.value = Array.isArray(res.data) ? res.data : (res.data.results || [])
  } catch { invoices.value = [] } finally { invoicesLoading.value = false }
}

function openInvoice(inv) {
  detailModal.invoice = inv
  detailModal.open = true
}
function closeDetail() { detailModal.open = false }

function printInvoice() {
  window.print()
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Deep link: /settings/billing/invoices/:id from an inbox notification.
// Frontend route uses /settings/billing only; we read ?invoice= or :id and open the modal.
onMounted(async () => {
  await Promise.all([fetchSub(), fetchInvoices()])
  const target = route.params.id || route.query.invoice
  if (target) {
    const found = invoices.value.find(i => i.id === target)
    if (found) openInvoice(found)
  }
})
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
.page-title  { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub    { font-size:13px; color:var(--text-muted); margin:2px 0 0; }
.section-title { font-size:15px; font-weight:600; color:var(--text-primary); margin:24px 0 12px; }

.plan-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:22px 24px; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; }
.plan-card-left { display:flex; flex-direction:column; gap:8px; min-width:240px; }
.plan-badge { display:inline-block; padding:3px 11px; border-radius:20px; background:rgba(247,143,30,0.15); color:var(--accent); font-size:11px; font-weight:700; letter-spacing:.05em; text-transform:uppercase; width:fit-content; }
.plan-title { font-size:18px; font-weight:600; color:var(--text-primary); }
.plan-desc  { font-size:13px; color:var(--text-secondary); line-height:1.45; max-width:520px; }
.plan-meta  { display:flex; flex-wrap:wrap; gap:18px; margin-top:6px; font-size:12.5px; color:var(--text-muted); }
.plan-meta strong { color:var(--text-secondary); font-weight:600; margin-right:4px; }

.plan-card-right { text-align:right; }
.plan-price { display:flex; align-items:baseline; gap:6px; justify-content:flex-end; }
.price-amt  { font-size:30px; font-weight:700; color:var(--text-primary); }
.price-cur  { font-size:14px; color:var(--text-muted); font-weight:600; }
.price-sub  { font-size:12px; color:var(--text-muted); margin-top:2px; }

.table-wrap { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.data-table { width:100%; border-collapse:collapse; font-size:13px; }
.data-table thead th { padding:10px 14px; text-align:left; font-size:11.5px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); background:var(--bg-app); border-bottom:1px solid var(--border); }
.data-table tbody tr.table-row { border-bottom:1px solid var(--border); cursor:pointer; transition:background 100ms; }
.data-table tbody tr.table-row:last-child { border-bottom:none; }
.data-table tbody tr.table-row:hover { background:var(--bg-app); }
.data-table tbody td { padding:10px 14px; color:var(--text-primary); }
.table-empty { text-align:center; padding:48px 20px; color:var(--text-muted); }
.table-skeleton { padding:8px 0; }
.skeleton-row { height:40px; margin:4px 16px; border-radius:6px; background:linear-gradient(90deg,var(--border) 25%,var(--bg-app) 50%,var(--border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position:-200% 0; } }

.status-pill { display:inline-block; padding:2px 9px; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; }
.status-trial    { background:var(--accent-soft); color:var(--accent-hover); }
.status-active   { background:rgba(16,163,74,0.15); color:#16a34a; }
.status-past_due { background:rgba(245,158,11,0.15); color:#b45309; }
.status-cancelled{ background:#f3f4f6; color:#6b7280; }
.inv-draft  { background:#f3f4f6; color:#6b7280; }
.inv-issued { background:var(--accent-soft); color:var(--accent-hover); }
.inv-paid   { background:rgba(16,163,74,0.15); color:#16a34a; }
.inv-void   { background:rgba(220,38,38,0.10); color:#b91c1c; }

.row-action { width:28px; height:28px; border:none; background:none; border-radius:6px; cursor:pointer; color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; transition:background 100ms,color 100ms; }
.row-action:hover { background:var(--border); color:var(--text-primary); }

.invoice-printable { padding:4px 4px 8px; }
.invoice-head { display:flex; align-items:flex-start; justify-content:space-between; padding-bottom:18px; border-bottom:2px solid var(--text-primary); }
.brand-title { font-size:22px; font-weight:800; letter-spacing:.04em; color:var(--text-primary); }
.brand-sub   { font-size:12px; color:var(--text-muted); margin-top:2px; }
.inv-no      { font-family:ui-monospace,monospace; font-size:14px; font-weight:600; color:var(--text-primary); }
.inv-status  { display:inline-block; padding:2px 9px; border-radius:20px; font-size:11px; font-weight:700; margin-top:6px; letter-spacing:.04em; text-transform:uppercase; }

.invoice-meta { display:grid; grid-template-columns:1fr 1fr; gap:14px 24px; padding:18px 0; border-bottom:1px solid var(--border); }
.meta-label  { font-size:11px; color:var(--text-muted); text-transform:uppercase; letter-spacing:.05em; }
.meta-value  { font-size:13.5px; color:var(--text-primary); margin-top:2px; }

.invoice-lines { width:100%; border-collapse:collapse; margin-top:18px; }
.invoice-lines th { padding:10px 12px; text-align:left; font-size:11.5px; font-weight:600; color:var(--text-muted); text-transform:uppercase; letter-spacing:.05em; border-bottom:1px solid var(--border); }
.invoice-lines td { padding:12px; border-bottom:1px solid var(--border); font-size:13px; }
.invoice-lines tfoot td { font-size:14px; padding-top:14px; }

.paid-note { margin-top:18px; padding:10px 14px; background:rgba(16,163,74,0.10); color:#15803d; border-radius:8px; font-size:13px; font-weight:600; }

.btn-ghost { display:inline-flex; align-items:center; gap:5px; padding:7px 12px; border-radius:8px; font-size:13px; font-weight:500; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; transition:background 100ms,color 100ms,transform 70ms; }
.btn-ghost:hover  { background:var(--border); color:var(--text-primary); }
.btn-ghost:active { transform:scale(0.95); }
.btn-primary { display:inline-flex; align-items:center; gap:5px; padding:7px 14px; border-radius:8px; font-size:13px; font-weight:600; border:none; background:var(--primary, var(--accent-hover)); color:#fff; cursor:pointer; transition:transform 70ms; }
.btn-primary:active { transform:scale(0.96); }

@media print {
  .page-header, .table-wrap, .section-title, .btn-ghost, .btn-primary, .plan-card { display:none !important; }
  .invoice-printable { padding:0; }
}
</style>
