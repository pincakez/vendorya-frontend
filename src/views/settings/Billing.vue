<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('settings.billing.title') }}</h1>
        <p class="page-sub">{{ t('settings.billing.sub') }}</p>
      </div>
    </div>

    <!-- Current plan card -->
    <div v-if="subscription" class="plan-card">
      <div class="plan-card-left">
        <div class="plan-badge">{{ subscription.display_label }}</div>
        <div class="plan-title">
          {{ t('settings.billing.youre_on_a') }} <strong>{{ subscription.plan?.name }}</strong> {{ t('settings.billing.youre_on_b') }}
        </div>
        <div v-if="subscription.plan?.description" class="plan-desc">
          {{ subscription.plan.description }}
        </div>
        <div class="plan-meta">
          <span><strong>{{ t('settings.billing.status') }}:</strong> <span :class="'status-pill status-' + subscription.status.toLowerCase()">{{ subStatusLabel(subscription.status) }}</span></span>
          <span v-if="subscription.period_end"><strong>{{ t('settings.billing.renews') }}:</strong> {{ subscription.period_end }}</span>
          <span v-if="subscription.trial_ends_at"><strong>{{ t('settings.billing.trial_ends') }}:</strong> {{ subscription.trial_ends_at }}</span>
        </div>
      </div>
      <div class="plan-card-right">
        <div class="plan-price">
          <span class="price-amt">{{ subscription.plan?.monthly_price || '0.00' }}</span>
          <span class="price-cur">{{ subscription.plan?.currency || 'EGP' }}</span>
        </div>
        <div class="price-sub">{{ t('settings.billing.per_month') }}</div>
      </div>
    </div>
    <div v-else class="plan-card" style="justify-content:center;color:var(--text-muted);">
      {{ t('settings.billing.no_sub') }}
    </div>

    <!-- Quota usage -->
    <div v-if="subscription && subscription.quota" class="section-block">
      <h2 class="section-title" style="margin-top:0;">{{ t('settings.billing.plan_usage') }}</h2>
      <div class="quota-grid">
        <div v-for="(item, key) in subscription.quota" :key="key" class="quota-item">
          <div class="quota-header">
            <span class="quota-label">{{ quotaLabel(key) }}</span>
            <span class="quota-count" :class="item.over ? 'over' : ''">
              {{ item.used }}{{ item.limit != null ? ' / ' + item.limit : '' }}
            </span>
          </div>
          <div class="quota-bar-bg">
            <div
              class="quota-bar-fill"
              :class="item.over ? 'over' : barClass(item)"
              :style="{ width: barWidth(item) }"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Invoice list -->
    <h2 class="section-title">{{ t('settings.billing.invoices') }}</h2>
    <div class="table-wrap">
      <div v-if="invoicesLoading" class="table-skeleton">
        <div v-for="i in 3" :key="i" class="skeleton-row" />
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>{{ t('settings.billing.col_invoice') }}</th>
            <th>{{ t('common.description') }}</th>
            <th>{{ t('settings.billing.col_amount') }}</th>
            <th>{{ t('settings.billing.status') }}</th>
            <th>{{ t('settings.billing.col_issued') }}</th>
            <th>{{ t('settings.billing.col_due') }}</th>
            <th style="width:80px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!invoices.length">
            <td colspan="7" class="table-empty">{{ t('settings.billing.no_invoices') }}</td>
          </tr>
          <tr v-for="inv in invoices" :key="inv.id" class="table-row" @click="openInvoice(inv)">
            <td style="font-family:ui-monospace,monospace;font-size:12px;">{{ inv.invoice_number || '—' }}</td>
            <td style="color:var(--text-secondary);font-size:12.5px;">{{ inv.line_description || '—' }}</td>
            <td style="font-variant-numeric:tabular-nums;font-weight:600;">{{ formatNumber(inv.amount) }} {{ inv.currency }}</td>
            <td><span class="status-pill" :class="'inv-' + inv.status.toLowerCase()">{{ invStatusLabel(inv.status) }}</span></td>
            <td style="font-size:12px;color:var(--text-secondary);">{{ inv.issued_at ? formatDate(inv.issued_at) : '—' }}</td>
            <td style="font-size:12px;color:var(--text-secondary);">{{ inv.due_at || '—' }}</td>
            <td>
              <button class="row-action" :title="t('settings.billing.view')"><Eye :size="13" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Invoice detail modal -->
    <AppModal :open="detailModal.open" :title="detailModal.invoice?.invoice_number || t('settings.billing.invoice')" @close="closeDetail">
      <div v-if="detailModal.invoice" class="invoice-printable">
        <div class="invoice-head">
          <div>
            <div class="brand-title">VENDORYA</div>
            <div class="brand-sub">{{ t('settings.billing.bill_from') }}</div>
          </div>
          <div style="text-align:right;">
            <div class="inv-no">{{ detailModal.invoice.invoice_number }}</div>
            <div class="inv-status" :class="'inv-' + detailModal.invoice.status.toLowerCase()">{{ invStatusLabel(detailModal.invoice.status) }}</div>
          </div>
        </div>

        <div class="invoice-meta">
          <div>
            <div class="meta-label">{{ t('settings.billing.billed_to') }}</div>
            <div class="meta-value">{{ detailModal.invoice.store_name }}</div>
          </div>
          <div>
            <div class="meta-label">{{ t('settings.billing.col_issued') }}</div>
            <div class="meta-value">{{ detailModal.invoice.issued_at ? formatDate(detailModal.invoice.issued_at) : '—' }}</div>
          </div>
          <div>
            <div class="meta-label">{{ t('settings.billing.col_due') }}</div>
            <div class="meta-value">{{ detailModal.invoice.due_at || '—' }}</div>
          </div>
          <div>
            <div class="meta-label">{{ t('settings.billing.period') }}</div>
            <div class="meta-value">{{ detailModal.invoice.period_start || '—' }} → {{ detailModal.invoice.period_end || '—' }}</div>
          </div>
        </div>

        <table class="invoice-lines">
          <thead>
            <tr><th>{{ t('common.description') }}</th><th style="text-align:right;">{{ t('settings.billing.col_amount') }}</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>{{ detailModal.invoice.line_description || t('settings.billing.line_default', { plan: detailModal.invoice.subscription?.display_label }) }}</td>
              <td style="text-align:right;font-variant-numeric:tabular-nums;">{{ formatNumber(detailModal.invoice.amount) }} {{ detailModal.invoice.currency }}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr><td><strong>{{ t('settings.billing.total') }}</strong></td><td style="text-align:right;font-weight:700;font-size:15px;">{{ formatNumber(detailModal.invoice.amount) }} {{ detailModal.invoice.currency }}</td></tr>
          </tfoot>
        </table>

        <div v-if="detailModal.invoice.status === 'PAID'" class="paid-note">
          {{ t('settings.billing.paid_on', { date: formatDate(detailModal.invoice.paid_at) }) }}
          <span v-if="detailModal.invoice.paid_reference"> · {{ t('settings.billing.ref', { ref: detailModal.invoice.paid_reference }) }}</span>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="closeDetail">{{ t('common.close') }}</button>
        <button class="btn-primary" @click="printInvoice">
          <Printer :size="14" /> {{ t('settings.billing.print') }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { Eye, Printer } from 'lucide-vue-next'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'
import { formatNumber } from '@/utils/format'

const { t } = useI18n()
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

function quotaLabel(key) {
  const k = `settings.billing.quota.${key}`
  const label = t(k)
  return label === k ? key : label
}
function subStatusLabel(s) {
  const k = `settings.billing.sub_status.${(s || '').toLowerCase()}`
  const label = t(k)
  return label === k ? s : label
}
function invStatusLabel(s) {
  const k = `settings.billing.inv_status.${(s || '').toLowerCase()}`
  const label = t(k)
  return label === k ? s : label
}
function barWidth(item) {
  if (item.limit == null || item.limit === 0) return '0%'
  return Math.min(100, Math.round((item.used / item.limit) * 100)) + '%'
}
function barClass(item) {
  if (item.limit == null) return ''
  const pct = item.used / item.limit
  if (pct >= 0.9) return 'warn'
  return ''
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
.status-active   { background:rgba(16,163,74,0.15); color:var(--success); }
.status-past_due { background:rgba(245,158,11,0.15); color:var(--warning-hover); }
.status-cancelled{ background:#f3f4f6; color:#6b7280; }
.inv-draft  { background:#f3f4f6; color:#6b7280; }
.inv-issued { background:var(--accent-soft); color:var(--accent-hover); }
.inv-paid   { background:rgba(16,163,74,0.15); color:var(--success); }
.inv-void   { background:rgba(220,38,38,0.10); color:var(--danger-hover); }

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

.paid-note { margin-top:18px; padding:10px 14px; background:rgba(16,163,74,0.10); color:var(--success-hover); border-radius:8px; font-size:13px; font-weight:600; }


.section-block { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:20px 22px; margin-bottom:24px; }
.quota-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(200px,1fr)); gap:16px; }
.quota-item { display:flex; flex-direction:column; gap:6px; }
.quota-header { display:flex; align-items:center; justify-content:space-between; }
.quota-label { font-size:12px; font-weight:600; color:var(--text-secondary); text-transform:uppercase; letter-spacing:.04em; }
.quota-count { font-size:13px; font-weight:700; color:var(--text-primary); font-variant-numeric:tabular-nums; }
.quota-count.over { color:var(--danger); }
.quota-bar-bg { height:6px; background:var(--border); border-radius:99px; overflow:hidden; }
.quota-bar-fill { height:100%; border-radius:99px; background:var(--accent); transition:width 400ms; }
.quota-bar-fill.warn { background:var(--warning); }
.quota-bar-fill.over { background:var(--danger); }

@media print {
  .page-header, .table-wrap, .section-title, .btn-ghost, .btn-primary, .plan-card { display:none !important; }
  .invoice-printable { padding:0; }
}
</style>
