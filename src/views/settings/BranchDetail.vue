<template>
  <div>
    <div class="page-header">
      <div style="display:flex;align-items:center;gap:12px;">
        <button class="btn-ghost btn-sm" @click="$router.push('/settings?tab=branches')">
          <ChevronLeft :size="15" /> Branches
        </button>
        <div>
          <h1 class="page-title">{{ branch?.name || '…' }}</h1>
          <p class="page-sub">Branch overview — stock, staff, and today's performance.</p>
        </div>
      </div>
      <span v-if="branch?.is_main_branch" class="badge-main">Main Branch</span>
    </div>

    <div v-if="loading" class="table-skeleton">
      <div v-for="i in 4" :key="i" class="skeleton-row" style="height:80px;margin-bottom:12px;" />
    </div>

    <template v-else-if="branch">
      <!-- KPI row -->
      <div class="kpi-row">
        <div class="kpi-card">
          <div class="kpi-label">Today's Sales</div>
          <div class="kpi-value">{{ auth.currencySymbol }} {{ formatNumber(data.today_sales?.total || 0) }}</div>
          <div class="kpi-sub">{{ data.today_sales?.count || 0 }} invoice{{ data.today_sales?.count !== 1 ? 's' : '' }}</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Staff at Branch</div>
          <div class="kpi-value">{{ data.staff?.length || 0 }}</div>
          <div class="kpi-sub">assigned users</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Variants in Stock</div>
          <div class="kpi-value">{{ data.stock_summary?.variants_in_stock ?? '—' }}</div>
          <div class="kpi-sub">{{ formatNumber(data.stock_summary?.total_units || 0, { decimals: 0 }) }} total units</div>
        </div>
        <div class="kpi-card" :class="{ 'kpi-card--warn': (data.stock_summary?.low_stock_count || 0) > 0 }">
          <div class="kpi-label">Low Stock</div>
          <div class="kpi-value">{{ data.stock_summary?.low_stock_count ?? '—' }}</div>
          <div class="kpi-sub">variants at or below reorder level</div>
        </div>
      </div>

      <!-- Branch info + Staff side-by-side -->
      <div class="detail-grid">
        <!-- Branch info -->
        <div class="dt-card">
          <div class="card-section-title">Branch Info</div>
          <div class="info-row"><span class="info-label">Name</span><span>{{ branch.name }}</span></div>
          <div class="info-row" v-if="branch.address_city"><span class="info-label">City</span><span>{{ branch.address_city }}<span v-if="branch.address_country">, {{ branch.address_country }}</span></span></div>
          <div class="info-row" v-if="branch.address_street_1"><span class="info-label">Street</span><span>{{ branch.address_street_1 }}</span></div>
          <div class="info-row" v-if="branch.phone_number"><span class="info-label">Phone</span><span>{{ branch.phone_number }}</span></div>
          <div class="info-row" v-if="branch.email"><span class="info-label">Email</span><span>{{ branch.email }}</span></div>
        </div>

        <!-- Staff list -->
        <div class="dt-card">
          <div class="card-section-title">Staff</div>
          <div v-if="!data.staff?.length" style="color:var(--text-muted);font-size:13px;padding:8px 0;">No staff assigned to this branch.</div>
          <table v-else class="dt" style="margin-top:4px;">
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in data.staff" :key="u.id" class="dt-row">
                <td>{{ u.full_name }}</td>
                <td style="color:var(--text-muted);font-size:12.5px;">{{ u.username }}</td>
                <td><span class="role-pill" :class="'role-' + u.role.toLowerCase()">{{ u.role }}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>

    <div v-else-if="!loading" style="color:var(--text-muted);padding:32px;text-align:center;">
      Branch not found.
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronLeft } from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import { formatNumber } from '@/utils/format'

const route  = useRoute()
const auth   = useAuthStore()
const loading = ref(true)
const branch  = ref(null)
const data    = ref({})

onMounted(async () => {
  try {
    const { data: res } = await api.get(`/api/core/branches/${route.params.id}/detail-data/`)
    branch.value = res.branch
    data.value   = res
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
.badge-main  { background: var(--accent-soft); color: var(--accent); font-size: 11.5px; font-weight: 600; padding: 3px 10px; border-radius: 20px; white-space: nowrap; }

.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
@media (max-width: 900px) { .kpi-row { grid-template-columns: repeat(2, 1fr); } }

.kpi-card {
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px;
  padding: 16px 20px;
}
.kpi-card--warn { border-color: var(--warning); background: var(--warning-soft); }
.kpi-label { font-size: 12px; color: var(--text-muted); font-weight: 500; margin-bottom: 4px; }
.kpi-value { font-size: 26px; font-weight: 800; color: var(--text-primary); line-height: 1.1; font-variant-numeric: tabular-nums; }
.kpi-sub   { font-size: 11.5px; color: var(--text-muted); margin-top: 4px; }

.detail-grid { display: grid; grid-template-columns: 300px 1fr; gap: 16px; }
@media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } }

.dt-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 14px; padding: 20px; }
.card-section-title { font-size: 13px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: .05em; margin-bottom: 14px; }

.info-row { display: flex; gap: 12px; padding: 7px 0; border-bottom: 1px solid var(--border); font-size: 13.5px; }
.info-row:last-child { border-bottom: none; }
.info-label { color: var(--text-muted); min-width: 64px; flex-shrink: 0; }

.role-pill { display: inline-block; padding: 2px 8px; border-radius: 20px; font-size: 11.5px; font-weight: 600; }
.role-owner   { background: var(--accent-soft);   color: var(--accent); }
.role-admin   { background: var(--info-soft);    color: var(--info); }
.role-manager { background: var(--success-soft);  color: var(--success); }
.role-cashier { background: var(--border); color: var(--text-muted); }
</style>
