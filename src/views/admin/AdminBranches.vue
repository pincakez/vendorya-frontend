<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Branches</h1>
        <p class="page-sub">All branches across all stores</p>
      </div>
      <div class="header-right">
        <select v-model="storeFilter" class="filter-select" @change="fetchBranches">
          <option value="">All stores</option>
          <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
        <div class="search-wrap">
          <Search :size="14" class="search-icon" />
          <input v-model="search" class="search-input" placeholder="Search branch or store…" @input="onSearch" />
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
            <th>Branch</th>
            <th>Store</th>
            <th>City</th>
            <th>Country</th>
            <th>Main</th>
            <th style="width:60px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!filtered.length">
            <td colspan="6" class="table-empty">
              <Building :size="32" style="opacity:.3;margin-bottom:8px;" />
              <div>No branches found</div>
            </td>
          </tr>
          <tr v-for="b in filtered" :key="b.id" class="table-row">
            <td><span style="font-weight:600;">{{ b.name }}</span></td>
            <td style="color:var(--text-secondary);">{{ b.store_name }}</td>
            <td>{{ b.city || '—' }}</td>
            <td>{{ b.country || '—' }}</td>
            <td>
              <span v-if="b.is_main_branch" class="main-pill">MAIN</span>
              <span v-else style="color:var(--text-muted);font-size:12px;">—</span>
            </td>
            <td>
              <button class="row-action" title="Edit" @click="openEdit(b)">
                <Pencil :size="13" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppModal :open="modal.open" title="Edit Branch" @close="closeModal">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">Branch Name</label>
          <input v-model="modal.name" class="form-input" />
        </div>
        <div style="display:flex;align-items:center;gap:10px;">
          <label class="form-label" style="margin:0;">Main Branch</label>
          <button class="toggle-btn" :class="{ on: modal.is_main_branch }" @click="modal.is_main_branch = !modal.is_main_branch">
            <span class="toggle-knob" />
          </button>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="closeModal">Cancel</button>
        <button class="btn-admin" :disabled="!modal.name.trim() || saving" @click="save">
          {{ saving ? 'Saving…' : 'Save' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Search, Building, Pencil } from 'lucide-vue-next'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'

const branches = ref([])
const stores = ref([])
const loading = ref(false)
const saving = ref(false)
const search = ref('')
const storeFilter = ref('')

let searchTimer = null
function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(fetchBranches, 350)
}

const filtered = computed(() => {
  if (!storeFilter.value) return branches.value
  return branches.value.filter(b => b.store === storeFilter.value)
})

async function fetchBranches() {
  loading.value = true
  try {
    const res = await api.get('/api/admin/branches/', {
      params: search.value ? { search: search.value } : {},
    })
    branches.value = Array.isArray(res.data) ? res.data : (res.data.results || [])
  } catch (e) {
    branches.value = []
  } finally {
    loading.value = false
  }
}

async function fetchStores() {
  try {
    const res = await api.get('/api/admin/stores/')
    stores.value = Array.isArray(res.data) ? res.data : (res.data.results || [])
  } catch { stores.value = [] }
}

const modal = reactive({ open: false, id: null, name: '', is_main_branch: false })

function openEdit(b) {
  Object.assign(modal, { open: true, id: b.id, name: b.name, is_main_branch: b.is_main_branch })
}

function closeModal() { modal.open = false }

async function save() {
  saving.value = true
  try {
    await api.patch(`/api/admin/branches/${modal.id}/`, {
      name: modal.name,
      is_main_branch: modal.is_main_branch,
    })
    closeModal()
    fetchBranches()
  } catch (e) {
    alert(e.response?.data ? JSON.stringify(e.response.data) : 'Error saving branch')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  fetchBranches()
  fetchStores()
})
</script>

<style scoped>
.page-header  { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
.page-title   { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub     { font-size:13px; color:var(--text-muted); margin:2px 0 0; }
.header-right { display:flex; align-items:center; gap:10px; }

.filter-select { padding:7px 12px; border:1px solid var(--border); border-radius:8px; background:var(--bg-card); color:var(--text-primary); font-size:13px; outline:none; min-width:160px; }

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
.data-table tbody td { padding:10px 14px; color:var(--text-primary); }
.table-empty { text-align:center; padding:48px 20px; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; }
.table-skeleton { padding:8px 0; }
.skeleton-row { height:40px; margin:4px 16px; border-radius:6px; background:linear-gradient(90deg,var(--border) 25%,var(--bg-app) 50%,var(--border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position:-200% 0; } }

.main-pill { display:inline-block; padding:2px 9px; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:.04em; background:rgba(239,68,68,0.15); color:var(--admin-accent); }

.row-action { width:28px; height:28px; border:none; background:none; border-radius:6px; cursor:pointer; color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; transition:background 100ms,color 100ms; }
.row-action:hover { background:var(--admin-accent-soft); color:var(--admin-accent); }

.toggle-btn { width:40px; height:22px; border-radius:11px; border:none; background:var(--border); cursor:pointer; position:relative; transition:background 200ms; padding:0; flex-shrink:0; }
.toggle-btn.on { background:var(--admin-accent); }
.toggle-knob { position:absolute; width:16px; height:16px; border-radius:50%; background:#fff; top:3px; left:3px; transition:left 200ms; box-shadow:0 1px 3px rgba(0,0,0,.2); }
.toggle-btn.on .toggle-knob { left:21px; }

.form-label  { display:block; font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.form-input  { width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; box-sizing:border-box; transition:border-color 120ms; }
.form-input:focus { border-color:var(--admin-accent); }
.btn-ghost { display:inline-flex; align-items:center; gap:5px; padding:7px 12px; border-radius:8px; font-size:13px; font-weight:500; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; transition:background 100ms; }
.btn-ghost:hover { background:var(--border); color:var(--text-primary); }
</style>
