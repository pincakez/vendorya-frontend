<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('finance.cash_drawer.title') }}</h1>
        <p class="page-sub">{{ t('finance.cash_drawer.sub') }}</p>
      </div>
    </div>

    <div v-if="loading" class="cards-grid">
      <div v-for="i in 4" :key="i" class="kpi-card skeleton-card" />
    </div>

    <div v-else>
      <!-- KPI Cards -->
      <div class="cards-grid">
        <div class="kpi-card">
          <div class="kpi-icon" style="background:var(--accent-soft);color:var(--accent);"><Banknote :size="20" /></div>
          <div class="kpi-body">
            <div class="kpi-label">{{ t('finance.cash_drawer.cash_in') }}</div>
            <div class="kpi-value"><Money :value="stats.cash_in" /></div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:var(--danger-soft);color:var(--danger);"><ArrowUpFromLine :size="20" /></div>
          <div class="kpi-body">
            <div class="kpi-label">{{ t('finance.cash_drawer.cash_out') }}</div>
            <div class="kpi-value"><Money :value="stats.cash_out" /></div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:var(--success-soft);color:var(--success);"><Wallet :size="20" /></div>
          <div class="kpi-body">
            <div class="kpi-label">{{ t('finance.cash_drawer.expected_balance') }}</div>
            <div class="kpi-value"><Money :value="stats.expected_balance" /></div>
          </div>
        </div>
        <div class="kpi-card" :class="openShift ? 'card-open' : 'card-closed'">
          <div class="kpi-icon" :style="openShift ? 'background:var(--success-soft);color:var(--success);' : 'background:var(--bg-app);color:var(--text-muted);'">
            <Clock :size="20" />
          </div>
          <div class="kpi-body">
            <div class="kpi-label">{{ t('finance.cash_drawer.current_shift') }}</div>
            <div class="kpi-value" style="font-size:15px;">
              {{ openShift ? t('finance.cash_drawer.open_since', { time: fmtTime(openShift.start_time) }) : t('finance.cash_drawer.no_open_shift') }}
            </div>
          </div>
        </div>
      </div>

      <!-- Today's cash payments table -->
      <div style="margin-top:28px;">
        <div class="section-title">{{ t('finance.cash_drawer.payments_title') }}</div>
        <div class="dt-card">
          <div class="dt-xscroll">
        <table class="dt">
            <thead>
              <tr><th class="dt-th">{{ t('finance.cash_drawer.col_time') }}</th><th class="dt-th">{{ t('finance.cash_drawer.col_invoice') }}</th><th class="dt-th">{{ t('finance.cash_drawer.col_amount') }}</th></tr>
            </thead>
            <tbody>
              <tr v-if="payments.length === 0">
                <td colspan="3" class="dt-empty">{{ t('finance.cash_drawer.empty') }}</td>
              </tr>
              <tr v-for="p in payments" :key="p.id" class="dt-row">
                <td>{{ fmtTime(p.created_at) }}</td>
                <td class="col-ref">{{ p.invoice }}</td>
                <td class="col-amount"><Money :value="p.amount" /></td>
              </tr>
            </tbody>
          </table>
        </div><!-- dt-xscroll -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Banknote, ArrowUpFromLine, Wallet, Clock } from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import { formatNumber } from '@/utils/format'

const { t }   = useI18n()
const auth    = useAuthStore()
const loading = ref(false)
const openShift = ref(null)
const payments  = ref([])
const stats     = ref({ cash_in: 0, cash_out: 0, expected_balance: 0 })

async function fetchData() {
  loading.value = true
  try {
    const [shiftRes, payRes] = await Promise.all([
      api.get('/api/finance/shifts/', { params: { status: 'OPEN', page_size: 1 } }),
      api.get('/api/finance/payments/', { params: { page_size: 100 } }),
    ])
    const shiftResults = shiftRes.data.results ?? shiftRes.data
    openShift.value = shiftResults.length ? shiftResults[0] : null

    const today = new Date().toDateString()
    const allPayments = payRes.data.results ?? payRes.data
    payments.value = allPayments.filter(p => new Date(p.created_at).toDateString() === today)

    const cashIn = payments.value.reduce((s, p) => s + Number(p.amount), 0)
    const startingCash = openShift.value ? Number(openShift.value.starting_cash) : 0
    stats.value = {
      cash_in: cashIn,
      cash_out: 0,
      expected_balance: startingCash + cashIn,
    }
  } catch {} finally { loading.value = false }
}

function fmtTime(d) {
  return d ? new Date(d).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }) : '—'
}

onMounted(fetchData)
</script>

<style scoped>

.cards-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(210px, 1fr)); gap:14px; }
.kpi-card { display:flex; align-items:center; gap:14px; background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:16px 18px; }
.kpi-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.kpi-label { font-size:12px; color:var(--text-muted); font-weight:500; margin-bottom:3px; }
.kpi-value { font-size:18px; font-weight:700; color:var(--text-primary); font-variant-numeric:tabular-nums; }
.skeleton-card { height:76px; background:var(--border); border-radius:12px; animation:shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position:-200% 0; } }

.section-title { font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:12px; }

.table-empty { text-align:center; padding:32px; color:var(--text-muted); }

.col-ref    { font-family:monospace; font-size:12px; color:var(--text-muted); }
.col-amount { font-variant-numeric:tabular-nums; color:var(--success); font-weight:600; }
</style>
