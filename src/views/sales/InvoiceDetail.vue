<template>
  <div>
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="$router.back()">
          <ChevronLeft :size="16" /> {{ t('common.back') }}
        </button>
        <div v-if="data">
          <h1 class="page-title">{{ t('sales.invoice_detail.title', { number: data.invoice.invoice_number }) }}</h1>
          <p class="page-sub">{{ fmtDate(data.invoice.date) }}<span v-if="data.customer"> · {{ data.customer.name }}</span></p>
        </div>
        <div v-else class="page-title">{{ t('sales.invoice_detail.title_fallback') }}</div>
      </div>
      <div v-if="data" class="header-actions">
        <span class="status-pill" :class="statusClass(data.invoice.status)">{{ statusLabel(data.invoice.status) }}</span>
        <button class="btn-ghost" @click="printInvoice"><Printer :size="15" /> {{ t('sales.invoice_detail.print') }}</button>
      </div>
    </div>

    <div v-if="loading" class="skeleton-block" />
    <div v-else-if="!data" class="empty-state">{{ t('sales.invoice_detail.not_found') }}</div>
    <div v-else class="detail-layout">

      <!-- Info grid -->
      <div class="info-card">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">{{ t('sales.invoice_detail.info_invoice_number') }}</div>
            <div class="info-value mono">{{ data.invoice.invoice_number }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">{{ t('sales.invoice_detail.info_date') }}</div>
            <div class="info-value">{{ fmtDate(data.invoice.date) }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">{{ t('common.status') }}</div>
            <div class="info-value">
              <span class="status-pill" :class="statusClass(data.invoice.status)">{{ statusLabel(data.invoice.status) }}</span>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">{{ t('sales.invoice_detail.info_customer') }}</div>
            <div class="info-value">{{ data.customer?.name || t('sales.invoice_detail.walk_in') }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">{{ t('sales.invoice_detail.info_branch') }}</div>
            <div class="info-value">{{ data.branch?.name || data.store.name }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">{{ t('sales.invoice_detail.info_store') }}</div>
            <div class="info-value">{{ data.store.name }}</div>
          </div>
        </div>
      </div>

      <!-- Totals -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-label">{{ t('sales.invoice_detail.subtotal') }}</div>
          <div class="stat-value"><Money :value="data.invoice.subtotal" /></div>
        </div>
        <div class="stat-card" v-if="Number(data.invoice.discount) > 0">
          <div class="stat-label">{{ t('sales.invoice_detail.discount') }}</div>
          <div class="stat-value neg">−<Money :value="data.invoice.discount" /></div>
        </div>
        <div class="stat-card" v-if="Number(data.invoice.tax_total) > 0">
          <div class="stat-label">{{ t('sales.invoice_detail.tax') }}</div>
          <div class="stat-value"><Money :value="data.invoice.tax_total" /></div>
        </div>
        <div class="stat-card stat-card--accent">
          <div class="stat-label">{{ t('sales.invoice_detail.grand_total') }}</div>
          <div class="stat-value"><Money :value="data.invoice.grand_total" /></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">{{ t('sales.invoice_detail.paid') }}</div>
          <div class="stat-value pos"><Money :value="data.invoice.paid_amount" /></div>
        </div>
        <div class="stat-card" v-if="balanceDue > 0">
          <div class="stat-label">{{ t('sales.invoice_detail.balance_due') }}</div>
          <div class="stat-value neg"><Money :value="balanceDue" /></div>
        </div>
      </div>

      <!-- Line items -->
      <div class="section-card">
        <div class="section-header">
          <h2 class="section-title">{{ t('sales.invoice_detail.line_items') }}</h2>
          <span class="count-badge">{{ data.items.length }}</span>
        </div>
        <div class="dt-xscroll">
          <table class="dt">
            <thead>
              <tr>
                <th>{{ t('sales.invoice_detail.col_product') }}</th>
                <th>{{ t('sales.invoice_detail.col_sku') }}</th>
                <th class="num-col">{{ t('sales.invoice_detail.col_qty') }}</th>
                <th class="num-col">{{ t('sales.invoice_detail.col_unit_price') }}</th>
                <th class="num-col">{{ t('sales.invoice_detail.col_tax') }}</th>
                <th class="num-col">{{ t('sales.invoice_detail.col_total') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, i) in data.items" :key="i" class="dt-row">
                <td>{{ item.name }}</td>
                <td class="mono text-muted">{{ item.sku }}</td>
                <td class="num-col">{{ item.quantity }}</td>
                <td class="num-col"><Money :value="item.unit_price" /></td>
                <td class="num-col text-muted"><Money :value="item.tax_amount" /></td>
                <td class="num-col fw-bold"><Money :value="item.total" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Payments -->
      <div class="section-card" v-if="data.payments?.length">
        <div class="section-header">
          <h2 class="section-title">{{ t('sales.invoice_detail.payments') }}</h2>
        </div>
        <div class="payments-list">
          <div v-for="(p, i) in data.payments" :key="i" class="payment-row">
            <span class="payment-method">{{ p.method }}</span>
            <span class="payment-amount"><Money :value="p.amount" /></span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronLeft, Printer } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import api from '@/api/axios'
import Money from '@/components/ui/Money.vue'

const { t } = useI18n()
const props = defineProps({ id: String })
const router = useRouter()

function statusLabel(s) {
  const key = String(s).toLowerCase()
  return ['draft', 'posted', 'void', 'refunded'].includes(key) ? t('sales.status.' + key) : s
}

const data = ref(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const r = await api.get(`/api/finance/invoices/${props.id}/print-data/`)
    data.value = r.data
  } catch { data.value = null }
  finally { loading.value = false }
})

const balanceDue = computed(() => {
  if (!data.value) return 0
  return Math.max(0, Number(data.value.invoice.grand_total) - Number(data.value.invoice.paid_amount))
})

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function statusClass(s) {
  return { POSTED: 's-posted', DRAFT: 's-draft', VOID: 's-void', REFUNDED: 's-refunded' }[s] || ''
}

function printInvoice() {
  router.push(`/finance/invoices/${props.id}/print`)
}
</script>

<style scoped>
.back-btn {
  display: flex; align-items: center; gap: 4px;
  background: none; border: none; cursor: pointer;
  font-size: 13px; font-weight: 600; color: var(--text-muted);
  padding: 4px 0; margin-bottom: 4px;
  transition: color 140ms var(--ease-out), transform var(--press-back) var(--ease-spring);
}
.back-btn:hover { color: var(--text-primary); }
.back-btn:active { transform: scale(0.96); transition-duration: var(--press-down); }

.header-actions { display: flex; align-items: center; gap: 10px; }

.detail-layout { display: flex; flex-direction: column; gap: 16px; }

/* Info card */
.info-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 16px; padding: 20px 24px;
}
.info-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 16px 24px;
}
.info-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); margin-bottom: 4px; }
.info-value { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.mono { font-family: monospace; letter-spacing: .03em; }
.text-muted { color: var(--text-muted); }

/* Status pills */
.status-pill { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; padding: 3px 10px; border-radius: 99px; }
.s-posted  { background: var(--success-soft); color: var(--success); }
.s-draft   { background: var(--warning-soft); color: var(--warning); }
.s-void    { background: var(--bg-app); color: var(--text-muted); border: 1px solid var(--border); }
.s-refunded { background: var(--info-soft, var(--bg-app)); color: var(--info, var(--text-muted)); }

/* Stats row */
.stats-row { display: flex; flex-wrap: wrap; gap: 12px; }
.stat-card {
  flex: 1; min-width: 110px;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 14px; padding: 14px 18px;
}
.stat-card--accent { border-color: var(--accent); background: var(--accent-soft); }
.stat-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); margin-bottom: 6px; }
.stat-value { font-size: 20px; font-weight: 800; color: var(--text-primary); }
.pos { color: var(--success); }
.neg { color: var(--danger); }

/* Section cards */
.section-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 16px; overflow: hidden;
}
.section-header {
  display: flex; align-items: center; gap: 10px;
  padding: 16px 20px; border-bottom: 1px solid var(--border);
}
.section-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.count-badge {
  font-size: 11px; font-weight: 700; padding: 2px 8px;
  border-radius: 99px; background: var(--bg-app); color: var(--text-muted);
  border: 1px solid var(--border);
}

/* Table */
.dt-xscroll { overflow-x: auto; }
.dt { width: 100%; border-collapse: collapse; }
.dt thead th {
  padding: 10px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .06em; color: var(--text-muted); text-align: left;
  border-bottom: 1px solid var(--border);
}
.dt-row td { padding: 12px 16px; font-size: 13.5px; color: var(--text-primary); border-bottom: 1px solid var(--border); }
.dt-row:last-child td { border-bottom: none; }
.num-col { text-align: right; }
.fw-bold { font-weight: 700; }

/* Payments */
.payments-list { padding: 8px 0; }
.payment-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 20px; font-size: 14px;
  border-bottom: 1px solid var(--border);
}
.payment-row:last-child { border-bottom: none; }
.payment-method { font-weight: 600; color: var(--text-primary); }
.payment-amount { font-weight: 700; color: var(--text-primary); }

/* Skeleton */
.skeleton-block { height: 400px; border-radius: 16px; background: var(--border); animation: shimmer 1.4s ease-in-out infinite; }
@keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:.45} }
.empty-state { padding: 60px 24px; text-align: center; color: var(--text-muted); font-size: 14px; }
</style>
