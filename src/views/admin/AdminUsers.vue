<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Super Admin Users</h1>
        <p class="page-sub">Platform-level accounts with cross-store access</p>
      </div>
      <div class="header-right">
        <div class="search-wrap">
          <Search :size="14" class="search-icon" />
          <input v-model="search" class="search-input" placeholder="Search name or username…" @input="onSearch" />
        </div>
      </div>
    </div>

    <div class="dt-card">
      <div v-if="loading" class="table-skeleton">
        <div v-for="i in 4" :key="i" class="skeleton-row" />
      </div>
      <div v-else class="dt-xscroll">
        <table class="dt">
        <thead>
          <tr>
            <th class="dt-th">Name</th>
            <th class="dt-th">Username</th>
            <th class="dt-th">Email</th>
            <th class="dt-th">Status</th>
            <th class="dt-th" style="width:60px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!users.length">
            <td colspan="5" class="dt-empty">
              <Shield :size="32" style="opacity:.3;margin-bottom:8px;" />
              <div>No super admins yet</div>
            </td>
          </tr>
          <tr v-for="u in users" :key="u.id" class="dt-row" :class="{ inactive: !u.is_active }">
            <td>
              <div style="display:flex;align-items:center;gap:10px;">
                <div class="user-avatar">{{ initials(u) }}</div>
                <span style="font-weight:600;">{{ u.full_name }}</span>
              </div>
            </td>
            <td style="color:var(--text-secondary);">{{ u.username }}</td>
            <td style="color:var(--text-muted);font-size:12.5px;">{{ u.email || '—' }}</td>
            <td>
              <span v-if="u.is_active" class="status-active">Active</span>
              <span v-else class="status-inactive">Inactive</span>
            </td>
            <td>
              <button class="row-action" title="Edit" @click="openEdit(u)">
                <Pencil :size="13" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      </div><!-- dt-xscroll -->
    </div><!-- /dt-card -->


    <AppModal :open="modal.open" :title="modal.id ? 'Edit Super Admin' : 'New Super Admin'" @close="closeModal">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label class="form-label">First Name</label>
            <input v-model="modal.first_name" class="form-input" />
          </div>
          <div>
            <label class="form-label">Last Name</label>
            <input v-model="modal.last_name" class="form-input" />
          </div>
        </div>
        <div>
          <label class="form-label">Username</label>
          <input v-model="modal.username" class="form-input" :disabled="!!modal.id" />
        </div>
        <div>
          <label class="form-label">Email</label>
          <input v-model="modal.email" type="email" class="form-input" />
        </div>
        <div>
          <label class="form-label">{{ modal.id ? 'New Password (leave blank to keep)' : 'Password' }}</label>
          <input v-model="modal.password" type="password" class="form-input" />
        </div>
        <div v-if="modal.id" style="display:flex;align-items:center;gap:10px;padding-top:4px;">
          <label class="form-label" style="margin:0;">Active</label>
          <button class="toggle-btn" :class="{ on: modal.is_active }" @click="modal.is_active = !modal.is_active">
            <span class="toggle-knob" />
          </button>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="closeModal">Cancel</button>
        <button class="btn-admin" :disabled="!modal.username.trim() || (!modal.id && !modal.password.trim()) || saving" @click="save">
          {{ saving ? 'Saving…' : (modal.id ? 'Save Changes' : 'Create Admin') }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { Search, Shield, Pencil } from 'lucide-vue-next'
import api from '@/api/axios'
import { useQABStore } from '@/stores/qab'
import AppModal from '@/components/ui/AppModal.vue'

const qab = useQABStore()

const users = ref([])
const loading = ref(false)
const saving = ref(false)
const search = ref('')

let searchTimer = null
function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(fetchUsers, 350)
}

async function fetchUsers() {
  loading.value = true
  try {
    const res = await api.get('/api/admin/users/', {
      params: search.value ? { search: search.value } : {},
    })
    users.value = Array.isArray(res.data) ? res.data : (res.data.results || [])
  } catch { users.value = [] } finally { loading.value = false }
}

const modal = reactive({ open: false, id: null, username: '', first_name: '', last_name: '', email: '', password: '', is_active: true })

function openNew() {
  Object.assign(modal, { open: true, id: null, username: '', first_name: '', last_name: '', email: '', password: '', is_active: true })
}
function openEdit(u) {
  Object.assign(modal, { open: true, id: u.id, username: u.username, first_name: u.first_name, last_name: u.last_name, email: u.email || '', password: '', is_active: u.is_active })
}
function closeModal() { modal.open = false }

async function save() {
  saving.value = true
  try {
    const payload = {
      first_name: modal.first_name,
      last_name: modal.last_name,
      email: modal.email,
    }
    if (modal.id) payload.is_active = modal.is_active
    if (modal.password.trim()) payload.password = modal.password

    if (modal.id) {
      await api.patch(`/api/admin/users/${modal.id}/`, payload)
    } else {
      await api.post('/api/admin/users/', { ...payload, username: modal.username, password: modal.password })
    }
    closeModal()
    fetchUsers()
  } catch (e) {
    alert(e.response?.data ? JSON.stringify(e.response.data) : 'Error saving admin')
  } finally { saving.value = false }
}

function initials(u) {
  const name = `${u.first_name} ${u.last_name}`.trim() || u.username
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

onMounted(() => {
  fetchUsers()
  qab.setActions([{ id: 'new-admin', label: 'New Admin', icon: 'plus', handler: openNew }])
})
onUnmounted(() => qab.clearActions())
</script>

<style scoped>
.header-right { display:flex; align-items:center; gap:10px; }

.search-wrap  { position:relative; }
.search-icon  { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none; }
.search-input { padding:7px 12px 7px 30px; border:1px solid var(--border); border-radius:8px; background:var(--bg-card); color:var(--text-primary); font-size:13px; width:220px; outline:none; transition:border-color 120ms; }
.search-input:focus { border-color:var(--admin-accent); }

.data-table tbody tr.table-row.inactive { opacity:.55; }
.table-empty { text-align:center; padding:48px 20px; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; }
.table-skeleton { padding:8px 0; }
.skeleton-row { height:40px; margin:4px 16px; border-radius:6px; background:linear-gradient(90deg,var(--border) 25%,var(--bg-app) 50%,var(--border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position:-200% 0; } }

.user-avatar { width:30px; height:30px; border-radius:50%; background:var(--admin-accent-soft); color:var(--admin-accent); font-weight:700; display:flex; align-items:center; justify-content:center; font-size:11px; }

.status-active   { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:500; color:var(--success); }
.status-active::before  { content:''; width:6px; height:6px; border-radius:50%; background:var(--success); }
.status-inactive { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:500; color:#9ca3af; }
.status-inactive::before { content:''; width:6px; height:6px; border-radius:50%; background:#9ca3af; }

.row-action { width:28px; height:28px; border:none; background:none; border-radius:6px; cursor:pointer; color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; transition:background 100ms,color 100ms; }
.row-action:hover { background:var(--admin-accent-soft); color:var(--admin-accent); }

.toggle-btn { width:40px; height:22px; border-radius:11px; border:none; background:var(--border); cursor:pointer; position:relative; transition:background 200ms; padding:0; flex-shrink:0; }
.toggle-btn.on { background:var(--admin-accent); }
.toggle-knob { position:absolute; width:16px; height:16px; border-radius:50%; background:#fff; top:3px; left:3px; transition:left 200ms; box-shadow:0 1px 3px rgba(0,0,0,.2); }
.toggle-btn.on .toggle-knob { left:21px; }

.form-input  { width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; box-sizing:border-box; transition:border-color 120ms; }
.form-input:focus { border-color:var(--admin-accent); }
.form-input:disabled { opacity:.5; }
</style>
