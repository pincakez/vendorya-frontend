<template>
  <div>
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="$router.back()">
          <ChevronLeft :size="16" /> Back
        </button>
        <div v-if="supplier">
          <h1 class="page-title">{{ supplier.name }}</h1>
          <p class="page-sub">Prefix: {{ supplier.code_prefix }} <span v-if="supplier.prefix_locked" class="lock-badge"><Lock :size="10" /> Locked</span></p>
        </div>
        <div v-else class="page-title">Supplier</div>
      </div>
    </div>

    <div v-if="loading" class="skeleton-block" />
    <div v-else-if="!supplier" class="empty-state">Supplier not found.</div>
    <div v-else class="detail-layout">

      <div class="info-card">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Contact</div>
            <div class="info-value">{{ supplier.contact_info || '—' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Code Prefix</div>
            <div class="info-value mono">{{ supplier.code_prefix }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Outstanding Balance</div>
            <div class="info-value">
              <span v-if="Number(supplier.balance) > 0" class="badge-owe"><Money :value="supplier.balance" /></span>
              <span v-else class="badge-paid">Settled</span>
            </div>
          </div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-header">
          <h2 class="section-title">Purchase History</h2>
          <span class="count-badge">{{ total }}</span>
        </div>
        <div v-if="purLoading" class="table-skeleton"><div v-for="i in 5" :key="i" class="skeleton-row" /></div>
        <div v-else class="dt-xscroll">
        <table class="dt">
          <thead>
            <tr>
              <th class="dt-th">Ref</th>
              <th class="dt-th">Date</th>
              <th class="dt-th">Total</th>
              <th class="dt-th">Paid</th>
              <th class="dt-th">Outstanding</th>
              <th class="dt-th">Status</th>
              <th class="dt-th">Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="purchases.length === 0">
              <td colspan="7" class="dt-empty">No purchases yet.</td>
            </tr>
            <tr v-for="p in purchases" :key="p.id" class="dt-row">
              <td class="mono">{{ p.vendor_reference || '—' }}</td>
              <td class="text-muted">{{ fmtDate(p.date) }}</td>
              <td><Money :value="p.total_amount" /></td>
              <td><Money :value="p.paid_amount" /></td>
              <td>
                <span v-if="Number(p.total_amount) - Number(p.paid_amount) > 0" class="badge-owe"><Money :value="Number(p.total_amount) - Number(p.paid_amount)" /></span>
                <span v-else class="badge-paid">Settled</span>
              </td>
              <td><span class="status-pill" :class="'s-' + p.status.toLowerCase()">{{ p.status }}</span></td>
              <td class="text-muted">{{ p.notes || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div><!-- dt-xscroll -->
        <AppPagination :page="page" :page-size="pageSize" :total="total" @update:page="fetchPurchases" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ChevronLeft, Lock } from 'lucide-vue-next'
import api from '@/api/axios'
import Money from '@/components/ui/Money.vue'
import AppPagination from '@/components/ui/AppPagination.vue'

const props = defineProps({ id: String })

const supplier = ref(null)
const loading = ref(true)
const purchases = ref([])
const purLoading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

async function fetchSupplier() {
  loading.value = true
  try {
    const r = await api.get(`/api/inventory/suppliers/${props.id}/`)
    supplier.value = r.data
  } catch { supplier.value = null }
  finally { loading.value = false }
}

async function fetchPurchases(p = 1) {
  page.value = p
  purLoading.value = true
  try {
    const r = await api.get(`/api/inventory/suppliers/${props.id}/purchases/`, { params: { page: p } })
    purchases.value = r.data.results || []
    total.value = r.data.count || 0
  } catch { purchases.value = [] }
  finally { purLoading.value = false }
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

onMounted(() => { fetchSupplier(); fetchPurchases() })
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
.header-left { display:flex; align-items:flex-start; gap:12px; }
.back-btn { display:inline-flex; align-items:center; gap:4px; padding:6px 10px; border-radius:8px; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; font-size:13px; font-weight:500; transition:background 100ms; margin-top:2px; }
.back-btn:hover { background:var(--border); }
.page-title { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub { font-size:13px; color:var(--text-muted); margin:2px 0 0; display:flex; align-items:center; gap:6px; }
.lock-badge { display:inline-flex; align-items:center; gap:3px; padding:1px 7px; border-radius:20px; background:rgba(245,158,11,0.12); color:#b45309; font-size:11px; font-weight:600; }

.detail-layout { display:flex; flex-direction:column; gap:20px; }
.skeleton-block { height:160px; border-radius:12px; background:var(--border); }
.empty-state { text-align:center; padding:60px 20px; color:var(--text-muted); }

.info-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:20px 22px; }
.info-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(200px, 1fr)); gap:16px; }
.info-label { font-size:11px; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); font-weight:600; }
.info-value { font-size:14px; color:var(--text-primary); margin-top:3px; }
.mono { font-family:ui-monospace,monospace; font-size:13px; }

.section-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.section-header { display:flex; align-items:center; gap:10px; padding:14px 18px; border-bottom:1px solid var(--border); }
.section-title { font-size:15px; font-weight:600; color:var(--text-primary); margin:0; }
.count-badge { padding:2px 8px; border-radius:20px; background:var(--border); font-size:12px; font-weight:600; color:var(--text-muted); }

.table-empty { text-align:center; padding:40px 20px; color:var(--text-muted); }
.table-skeleton { padding:8px 0; }
.skeleton-row { height:38px; margin:4px 16px; border-radius:6px; background:linear-gradient(90deg,var(--border) 25%,var(--bg-app) 50%,var(--border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position:-200% 0; } }
.text-muted { color:var(--text-muted); font-size:12px; }

.badge-owe { display:inline-block; padding:2px 8px; border-radius:20px; background:rgba(220,38,38,0.10); color:#dc2626; font-size:12px; font-weight:600; }
.badge-paid { display:inline-block; padding:2px 8px; border-radius:20px; background:rgba(16,163,74,0.10); color:#16a34a; font-size:12px; font-weight:600; }
.status-pill { display:inline-block; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
.s-received { background:rgba(16,163,74,0.12); color:#16a34a; }
.s-draft    { background:var(--border); color:var(--text-muted); }
.s-void     { background:rgba(220,38,38,0.10); color:#dc2626; }
</style>
