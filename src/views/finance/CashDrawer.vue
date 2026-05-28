<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Cash Drawer</h1>
        <p class="page-sub">Today's cash movements and current balance</p>
      </div>
    </div>

    <div v-if="loading" class="cards-grid">
      <div v-for="i in 4" :key="i" class="kpi-card skeleton-card" />
    </div>

    <div v-else>
      <!-- KPI Cards -->
      <div class="cards-grid">
        <div class="kpi-card">
          <div class="kpi-icon" style="background:#dbeafe;color:#2563eb;"><Banknote :size="20" /></div>
          <div class="kpi-body">
            <div class="kpi-label">Cash In (Today)</div>
            <div class="kpi-value">{{ auth.currencySymbol }} {{ formatNumber(stats.cash_in) }}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:#fee2e2;color:#dc2626;"><ArrowUpFromLine :size="20" /></div>
          <div class="kpi-body">
            <div class="kpi-label">Cash Out (Expenses)</div>
            <div class="kpi-value">{{ auth.currencySymbol }} {{ formatNumber(stats.cash_out) }}</div>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon" style="background:#dcfce7;color:#16a34a;"><Wallet :size="20" /></div>
          <div class="kpi-body">
            <div class="kpi-label">Expected Balance</div>
            <div class="kpi-value">{{ auth.currencySymbol }} {{ formatNumber(stats.expected_balance) }}</div>
          </div>
        </div>
        <div class="kpi-card" :class="openShift ? 'card-open' : 'card-closed'">
          <div class="kpi-icon" :style="openShift ? 'background:#dcfce7;color:#16a34a;' : 'background:#f3f4f6;color:#6b7280;'">
            <Clock :size="20" />
          </div>
          <div class="kpi-body">
            <div class="kpi-label">Current Shift</div>
            <div class="kpi-value" style="font-size:15px;">
              {{ openShift ? `Open · since ${fmtTime(openShift.start_time)}` : 'No open shift' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Today's cash payments table -->
      <div style="margin-top:28px;">
        <div class="section-title">Today's Cash Payments</div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>Time</th><th>Invoice #</th><th>Amount</th></tr>
            </thead>
            <tbody>
              <tr v-if="payments.length === 0">
                <td colspan="3" class="table-empty">No cash payments today</td>
              </tr>
              <tr v-for="p in payments" :key="p.id" class="table-row">
                <td>{{ fmtTime(p.created_at) }}</td>
                <td class="col-ref">{{ p.invoice }}</td>
                <td class="col-amount">{{ auth.currencySymbol }} {{ formatNumber(p.amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Banknote, ArrowUpFromLine, Wallet, Clock } from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import { formatNumber } from '@/utils/format'

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
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; }
.page-title  { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub    { font-size:13px; color:var(--text-muted); margin:2px 0 0; }

.cards-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(210px, 1fr)); gap:14px; }
.kpi-card { display:flex; align-items:center; gap:14px; background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:16px 18px; }
.kpi-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.kpi-label { font-size:12px; color:var(--text-muted); font-weight:500; margin-bottom:3px; }
.kpi-value { font-size:18px; font-weight:700; color:var(--text-primary); font-variant-numeric:tabular-nums; }
.skeleton-card { height:76px; background:var(--border); border-radius:12px; animation:shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position:-200% 0; } }

.section-title { font-size:14px; font-weight:700; color:var(--text-primary); margin-bottom:12px; }

.table-wrap { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.data-table { width:100%; border-collapse:collapse; font-size:13px; }
.data-table thead th { padding:10px 14px; text-align:left; font-size:11.5px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); background:var(--bg-app); border-bottom:1px solid var(--border); }
.data-table tbody tr.table-row { border-bottom:1px solid var(--border); transition:background 100ms; }
.data-table tbody tr.table-row:last-child { border-bottom:none; }
.data-table tbody tr.table-row:hover { background:var(--bg-app); }
.data-table tbody td { padding:10px 14px; color:var(--text-primary); }
.table-empty { text-align:center; padding:32px; color:var(--text-muted); }

.col-ref    { font-family:monospace; font-size:12px; color:var(--text-muted); }
.col-amount { font-variant-numeric:tabular-nums; color:#16a34a; font-weight:600; }
</style>
