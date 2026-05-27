<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Platform Overview</h1>
        <p class="page-sub">Vendorya super-admin dashboard</p>
      </div>
    </div>

    <!-- KPI cards -->
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-icon" style="background: rgba(249,115,22,0.15); color: var(--admin-accent);">
          <Store :size="20" />
        </div>
        <div>
          <div class="kpi-label">Active Stores</div>
          <div class="kpi-value">{{ loading ? '—' : stats.stores }}</div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon" style="background: rgba(59,130,246,0.15); color: #3b82f6;">
          <Building :size="20" />
        </div>
        <div>
          <div class="kpi-label">Branches</div>
          <div class="kpi-value">{{ loading ? '—' : stats.branches }}</div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon" style="background: rgba(168,85,247,0.15); color: #a855f7;">
          <Shield :size="20" />
        </div>
        <div>
          <div class="kpi-label">Super Admins</div>
          <div class="kpi-value">{{ loading ? '—' : stats.admins }}</div>
        </div>
      </div>

      <div class="kpi-card">
        <div class="kpi-icon" style="background: rgba(34,197,94,0.15); color: #22c55e;">
          <TrendingUp :size="20" />
        </div>
        <div>
          <div class="kpi-label">Premium Plans</div>
          <div class="kpi-value">{{ loading ? '—' : stats.premium }}</div>
        </div>
      </div>
    </div>

    <!-- Recent stores -->
    <div class="panel">
      <div class="panel-header">
        <div>
          <div class="panel-title">Stores</div>
          <div class="panel-sub">Pick a store from the topbar to act on it</div>
        </div>
        <RouterLink to="/admin/stores" class="panel-link">Manage all →</RouterLink>
      </div>
      <div class="stores-list">
        <div v-if="loading" v-for="i in 3" :key="i" class="store-row-skel" />
        <button
          v-else
          v-for="s in topStores"
          :key="s.id"
          class="store-row"
          @click="pick(s)"
        >
          <div class="store-row-avatar">{{ s.name.charAt(0).toUpperCase() }}</div>
          <div class="store-row-info">
            <div class="store-row-name">{{ s.name }}</div>
            <div class="store-row-meta">{{ s.owner_username }} · {{ s.branches_count }} branch · {{ s.staff_count }} staff</div>
          </div>
          <span class="plan-pill" :class="'plan-' + s.plan.toLowerCase()">{{ s.plan }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { Store, Building, Shield, TrendingUp } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import api from '@/api/axios'

const router = useRouter()
const auth = useAuthStore()

const loading = ref(true)
const stores = ref([])
const admins = ref([])

const stats = computed(() => ({
  stores:   stores.value.filter(s => s.is_active).length,
  branches: stores.value.reduce((a, s) => a + (s.branches_count || 0), 0),
  admins:   admins.value.length,
  premium:  stores.value.filter(s => s.plan === 'PREMIUM').length,
}))

const topStores = computed(() => stores.value.slice(0, 5))

function pick(store) {
  auth.setActiveStore(store)
  router.push('/dashboard')
}

onMounted(async () => {
  try {
    const [storesRes, usersRes] = await Promise.all([
      api.get('/api/admin/stores/'),
      api.get('/api/admin/users/'),
    ])
    stores.value = Array.isArray(storesRes.data) ? storesRes.data : (storesRes.data.results || [])
    admins.value = Array.isArray(usersRes.data) ? usersRes.data : (usersRes.data.results || [])
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
.page-title  { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub    { font-size:13px; color:var(--text-muted); margin:2px 0 0; }

.kpi-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:14px; margin-bottom:20px; }
.kpi-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:16px; display:flex; align-items:center; gap:14px; transition:border-color 120ms,transform 80ms; }
.kpi-card:hover { border-color: var(--admin-accent); }
.kpi-icon  { width:44px; height:44px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.kpi-label { font-size:12px; color:var(--text-muted); margin-bottom:2px; }
.kpi-value { font-size:22px; font-weight:700; color:var(--text-primary); font-variant-numeric:tabular-nums; }

.panel { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.panel-header { padding:16px 20px; border-bottom:1px solid var(--border); display:flex; align-items:center; justify-content:space-between; }
.panel-title { font-size:14px; font-weight:700; color:var(--text-primary); }
.panel-sub   { font-size:12px; color:var(--text-muted); margin-top:2px; }
.panel-link  { font-size:12.5px; font-weight:600; color:var(--admin-accent); text-decoration:none; }
.panel-link:hover { text-decoration:underline; }

.stores-list { padding:6px; }
.store-row { width:100%; display:flex; align-items:center; gap:12px; padding:10px 14px; border-radius:8px; background:transparent; border:none; cursor:pointer; text-align:left; transition:background 100ms; }
.store-row:hover { background: var(--admin-accent-soft); }
.store-row-avatar { width:36px; height:36px; border-radius:8px; background:var(--admin-accent-soft); color:var(--admin-accent); font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.store-row-info { flex:1; min-width:0; }
.store-row-name { font-size:14px; font-weight:600; color:var(--text-primary); }
.store-row-meta { font-size:12px; color:var(--text-muted); margin-top:2px; }
.store-row-skel { height:48px; margin:4px 8px; border-radius:8px; background:linear-gradient(90deg,var(--border) 25%,var(--bg-app) 50%,var(--border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position:-200% 0; } }

.plan-pill { padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.04em; }
.plan-free    { background:#f3f4f6; color:#6b7280; }
.plan-premium { background:rgba(249,115,22,0.15); color:var(--admin-accent); }
</style>
