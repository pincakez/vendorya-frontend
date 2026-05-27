<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Stores</h1>
        <p class="page-sub">All Vendorya stores across the platform</p>
      </div>
      <div class="header-right">
        <div class="search-wrap">
          <Search :size="14" class="search-icon" />
          <input v-model="search" class="search-input" placeholder="Search store or owner…" @input="onSearch" />
        </div>
      </div>
    </div>

    <div class="table-wrap">
      <div v-if="loading" class="table-skeleton">
        <div v-for="i in 5" :key="i" class="skeleton-row" />
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Store</th>
            <th>Owner</th>
            <th>Plan</th>
            <th>Currency</th>
            <th>Branches</th>
            <th>Staff</th>
            <th>Status</th>
            <th style="width:90px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!stores.length">
            <td colspan="8" class="table-empty">
              <Store :size="32" style="opacity:.3;margin-bottom:8px;" />
              <div>No stores yet</div>
            </td>
          </tr>
          <tr v-for="s in stores" :key="s.id" class="table-row" :class="{ inactive: !s.is_active }">
            <td>
              <div style="display:flex;align-items:center;gap:10px;">
                <div class="store-mini-avatar">{{ s.name.charAt(0).toUpperCase() }}</div>
                <span style="font-weight:600;">{{ s.name }}</span>
              </div>
            </td>
            <td style="color:var(--text-secondary);font-size:12.5px;">{{ s.owner_username }}</td>
            <td><span class="plan-pill" :class="'plan-' + s.plan.toLowerCase()">{{ s.plan }}</span></td>
            <td style="font-variant-numeric:tabular-nums;">{{ s.currency_symbol }}</td>
            <td style="font-variant-numeric:tabular-nums;">{{ s.branches_count }}</td>
            <td style="font-variant-numeric:tabular-nums;">{{ s.staff_count }}</td>
            <td>
              <span v-if="s.is_active" class="status-active">Active</span>
              <span v-else class="status-inactive">Inactive</span>
            </td>
            <td>
              <button class="row-action" title="Enter store" @click="enterStore(s)">
                <LogIn :size="13" />
              </button>
              <button class="row-action" title="Edit" @click="openEdit(s)">
                <Pencil :size="13" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Edit modal -->
    <AppModal :open="modal.open" :title="modal.id ? 'Edit Store' : 'New Store'" @close="closeModal">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">Store Name</label>
          <input v-model="modal.name" class="form-input" placeholder="e.g. Trenda Fashion" />
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label class="form-label">Plan</label>
            <select v-model="modal.plan" class="form-input">
              <option value="FREE">Free</option>
              <option value="PREMIUM">Premium</option>
            </select>
          </div>
          <div>
            <label class="form-label">Currency</label>
            <input v-model="modal.currency_symbol" class="form-input" placeholder="EGP" />
          </div>
        </div>
        <div>
          <label class="form-label">Default Language</label>
          <select v-model="modal.default_language" class="form-input">
            <option value="ar">Arabic</option>
            <option value="en">English</option>
          </select>
        </div>
        <div v-if="modal.id" style="display:flex;align-items:center;gap:10px;padding-top:4px;">
          <label class="form-label" style="margin:0;">Active</label>
          <button class="toggle-btn" :class="{ on: modal.is_active }" @click="modal.is_active = !modal.is_active">
            <span class="toggle-knob" />
          </button>
          <span style="font-size:12px;color:var(--text-muted);">{{ modal.is_active ? 'Store is open for use' : 'Store deactivated' }}</span>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="closeModal">Cancel</button>
        <button class="btn-admin" :disabled="!modal.name.trim() || saving" @click="save">
          {{ saving ? 'Saving…' : 'Save Changes' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Store, Pencil, LogIn } from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import AppModal from '@/components/ui/AppModal.vue'

const router = useRouter()
const auth = useAuthStore()

const stores = ref([])
const loading = ref(false)
const saving = ref(false)
const search = ref('')

let searchTimer = null
function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(fetchStores, 350)
}

async function fetchStores() {
  loading.value = true
  try {
    const res = await api.get('/api/admin/stores/', {
      params: search.value ? { search: search.value } : {},
    })
    stores.value = Array.isArray(res.data) ? res.data : (res.data.results || [])
  } catch (e) {
    stores.value = []
  } finally {
    loading.value = false
  }
}

const modal = reactive({
  open: false, id: null,
  name: '', plan: 'FREE', currency_symbol: 'EGP', default_language: 'ar', is_active: true,
})

function openEdit(s) {
  Object.assign(modal, {
    open: true, id: s.id,
    name: s.name, plan: s.plan, currency_symbol: s.currency_symbol,
    default_language: s.default_language, is_active: s.is_active,
  })
}

function closeModal() { modal.open = false }

async function save() {
  saving.value = true
  try {
    const payload = {
      name: modal.name,
      plan: modal.plan,
      currency_symbol: modal.currency_symbol,
      default_language: modal.default_language,
      is_active: modal.is_active,
    }
    if (modal.id) await api.patch(`/api/admin/stores/${modal.id}/`, payload)
    closeModal()
    fetchStores()
  } catch (e) {
    alert(e.response?.data ? JSON.stringify(e.response.data) : 'Error saving store')
  } finally {
    saving.value = false
  }
}

function enterStore(store) {
  auth.setActiveStore(store)
  router.push('/dashboard')
}

onMounted(fetchStores)
</script>

<style scoped>
.page-header  { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
.page-title   { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub     { font-size:13px; color:var(--text-muted); margin:2px 0 0; }
.header-right { display:flex; align-items:center; gap:10px; }

.search-wrap  { position:relative; }
.search-icon  { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none; }
.search-input { padding:7px 12px 7px 30px; border:1px solid var(--border); border-radius:8px; background:var(--bg-card); color:var(--text-primary); font-size:13px; width:220px; outline:none; transition:border-color 120ms; }
.search-input:focus { border-color:var(--admin-accent); }

.table-wrap { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.data-table { width:100%; border-collapse:collapse; font-size:13px; }
.data-table thead th { padding:10px 14px; text-align:left; font-size:11.5px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); background:var(--bg-app); border-bottom:1px solid var(--border); }
.data-table tbody tr.table-row { border-bottom:1px solid var(--border); transition:background 100ms; }
.data-table tbody tr.table-row:last-child { border-bottom:none; }
.data-table tbody tr.table-row:hover { background:var(--bg-app); }
.data-table tbody tr.table-row.inactive { opacity:.55; }
.data-table tbody td { padding:10px 14px; color:var(--text-primary); }
.table-empty { text-align:center; padding:48px 20px; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; }
.table-skeleton { padding:8px 0; }
.skeleton-row { height:40px; margin:4px 16px; border-radius:6px; background:linear-gradient(90deg,var(--border) 25%,var(--bg-app) 50%,var(--border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position:-200% 0; } }

.store-mini-avatar { width:28px; height:28px; border-radius:7px; background:var(--admin-accent-soft); color:var(--admin-accent); font-weight:700; display:flex; align-items:center; justify-content:center; font-size:12px; }

.plan-pill { display:inline-block; padding:2px 9px; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; }
.plan-free    { background:#f3f4f6; color:#6b7280; }
.plan-premium { background:rgba(249,115,22,0.15); color:var(--admin-accent); }

.status-active   { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:500; color:#16a34a; }
.status-active::before  { content:''; width:6px; height:6px; border-radius:50%; background:#16a34a; }
.status-inactive { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:500; color:#9ca3af; }
.status-inactive::before { content:''; width:6px; height:6px; border-radius:50%; background:#9ca3af; }

.row-action { width:28px; height:28px; border:none; background:none; border-radius:6px; cursor:pointer; color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; transition:background 100ms,color 100ms; margin-right:4px; }
.row-action:hover { background:var(--admin-accent-soft); color:var(--admin-accent); }

.toggle-btn { width:40px; height:22px; border-radius:11px; border:none; background:var(--border); cursor:pointer; position:relative; transition:background 200ms; padding:0; flex-shrink:0; }
.toggle-btn.on { background:var(--admin-accent); }
.toggle-knob { position:absolute; width:16px; height:16px; border-radius:50%; background:#fff; top:3px; left:3px; transition:left 200ms; box-shadow:0 1px 3px rgba(0,0,0,.2); }
.toggle-btn.on .toggle-knob { left:21px; }

.form-label  { display:block; font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.form-input  { width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; box-sizing:border-box; transition:border-color 120ms; }
.form-input:focus { border-color:var(--admin-accent); }
.btn-ghost { display:inline-flex; align-items:center; gap:5px; padding:7px 12px; border-radius:8px; font-size:13px; font-weight:500; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; transition:background 100ms,color 100ms,transform 70ms; }
.btn-ghost:hover  { background:var(--border); color:var(--text-primary); }
.btn-ghost:active { transform:scale(0.95); }
</style>
