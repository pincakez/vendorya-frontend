<template>
  <div>
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="$router.back()">
          <ChevronLeft :size="16" /> Back
        </button>
        <div v-if="shift">
          <h1 class="page-title">Shift Detail</h1>
          <p class="page-sub">{{ fmtDate(shift.start_time) }} · {{ shift.status }}</p>
        </div>
        <div v-else class="page-title">Shift Detail</div>
      </div>
    </div>

    <div v-if="loading" class="skeleton-block" />
    <div v-else-if="!summary" class="empty-state">Shift not found.</div>
    <div v-else class="detail-layout">

      <!-- Shift info row -->
      <div class="info-card">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Status</div>
            <div class="info-value">
              <span class="status-pill" :class="shift.status === 'OPEN' ? 's-open' : 's-closed'">{{ shift.status }}</span>
            </div>
          </div>
          <div class="info-item">
            <div class="info-label">Opened</div>
            <div class="info-value">{{ fmtDateTime(shift.start_time) }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Closed</div>
            <div class="info-value">{{ shift.end_time ? fmtDateTime(shift.end_time) : '—' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Starting Cash</div>
            <div class="info-value"><Money :value="shift.starting_cash" /></div>
          </div>
          <div class="info-item">
            <div class="info-label">Expected Cash</div>
            <div class="info-value"><Money :value="shift.expected_cash" /></div>
          </div>
          <div class="info-item">
            <div class="info-label">Counted Cash</div>
            <div class="info-value">{{ shift.closing_cash != null ? '' : '—' }}<Money v-if="shift.closing_cash != null" :value="shift.closing_cash" /></div>
          </div>
          <div class="info-item">
            <div class="info-label">Difference</div>
            <div class="info-value" :class="Number(shift.difference) !== 0 ? (Number(shift.difference) > 0 ? 'pos' : 'neg') : ''">
              {{ shift.difference != null ? (Number(shift.difference) >= 0 ? '+' : '') : '' }}<Money v-if="shift.difference != null" :value="shift.difference" />
              <span v-else>—</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats row -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-label">Total Sales</div>
          <div class="stat-value"><Money :value="summary.total_sales" /></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Invoices</div>
          <div class="stat-value">{{ summary.invoice_count }}</div>
        </div>
        <div class="stat-card" v-for="pb in summary.payment_breakdown" :key="pb.method">
          <div class="stat-label">{{ pb.method }}</div>
          <div class="stat-value"><Money :value="pb.total" /></div>
        </div>
      </div>

      <!-- Invoices during shift -->
      <div class="section-card">
        <div class="section-header">
          <h2 class="section-title">Sales During Shift</h2>
          <span class="count-badge">{{ summary.invoice_count }}</span>
        </div>
        <div class="dt-xscroll">
        <table class="dt">
          <thead>
            <tr>
              <th class="dt-th">#</th>
              <th class="dt-th">Time</th>
              <th class="dt-th">Customer</th>
              <th class="dt-th">Total</th>
              <th class="dt-th">Paid</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="summary.invoices.length === 0">
              <td colspan="5" class="dt-empty">No sales during this shift.</td>
            </tr>
            <tr v-for="inv in summary.invoices" :key="inv.id" class="dt-row">
              <td class="mono">{{ inv.invoice_number || '—' }}</td>
              <td class="text-muted">{{ fmtTime(inv.created_at) }}</td>
              <td>{{ inv.customer }}</td>
              <td><Money :value="inv.grand_total" /></td>
              <td>
                <span v-if="Number(inv.grand_total) - Number(inv.paid_total) > 0" class="badge-owe"><Money :value="Number(inv.grand_total) - Number(inv.paid_total)" /></span>
                <span v-else class="badge-paid">Paid</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div><!-- dt-xscroll -->
      </div><!-- existing -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ChevronLeft } from 'lucide-vue-next'
import api from '@/api/axios'
import Money from '@/components/ui/Money.vue'

const props = defineProps({ id: String })

const summary = ref(null)
const shift = ref(null)
const loading = ref(true)

async function fetchSummary() {
  loading.value = true
  try {
    const r = await api.get(`/api/finance/shifts/${props.id}/summary/`)
    summary.value = r.data
    shift.value = r.data.shift
  } catch { summary.value = null }
  finally { loading.value = false }
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function fmtTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

onMounted(fetchSummary)
</script>

<style scoped>
.header-left { display:flex; align-items:flex-start; gap:12px; }
.back-btn { display:inline-flex; align-items:center; gap:4px; padding:6px 10px; border-radius:8px; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; font-size:13px; font-weight:500; transition:background 100ms; margin-top:2px; }
.back-btn:hover { background:var(--border); }

.detail-layout { display:flex; flex-direction:column; gap:20px; }
.skeleton-block { height:200px; border-radius:12px; background:var(--border); }
.empty-state { text-align:center; padding:60px 20px; color:var(--text-muted); }

.info-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:20px 22px; }
.info-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(160px, 1fr)); gap:16px; }
.info-label { font-size:11px; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); font-weight:600; }
.info-value { font-size:14px; color:var(--text-primary); margin-top:3px; }
.pos { color:var(--success); font-weight:600; }
.neg { color:var(--danger); font-weight:600; }

.stats-row { display:grid; grid-template-columns:repeat(auto-fill, minmax(140px, 1fr)); gap:14px; }
.stat-card { background:var(--bg-card); border:1px solid var(--border); border-radius:10px; padding:16px 18px; }
.stat-label { font-size:11px; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); font-weight:600; }
.stat-value { font-size:20px; font-weight:700; color:var(--text-primary); margin-top:4px; }

.section-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.section-header { display:flex; align-items:center; gap:10px; padding:14px 18px; border-bottom:1px solid var(--border); }
.section-title { font-size:15px; font-weight:600; color:var(--text-primary); margin:0; }
.count-badge { padding:2px 8px; border-radius:20px; background:var(--border); font-size:12px; font-weight:600; color:var(--text-muted); }

.table-empty { text-align:center; padding:40px 20px; color:var(--text-muted); }
.mono { font-family:ui-monospace,monospace; font-size:12px; }
.text-muted { color:var(--text-muted); font-size:12px; }
.badge-owe { display:inline-block; padding:2px 8px; border-radius:20px; background:rgba(220,38,38,0.10); color:var(--danger); font-size:12px; font-weight:600; }
.badge-paid { display:inline-block; padding:2px 8px; border-radius:20px; background:rgba(16,163,74,0.10); color:var(--success); font-size:12px; font-weight:600; }
.status-pill { display:inline-block; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
.s-open { background:rgba(16,163,74,0.12); color:var(--success); }
.s-closed { background:var(--border); color:var(--text-muted); }
</style>
