<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Staff</h1>
        <p class="page-sub">Manage your team, roles and access</p>
      </div>
      <div class="header-right">
        <div class="search-wrap">
          <Search :size="14" class="search-icon" />
          <input v-model="search" class="search-input" placeholder="Search name or email…" @input="onSearch" />
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
            <th>Name</th>
            <th>Username</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th style="width:60px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="staff.length === 0">
            <td colspan="6" class="table-empty">
              <UserCog :size="32" style="opacity:.3;margin-bottom:8px;" />
              <div>No staff members yet</div>
            </td>
          </tr>
          <tr v-for="s in staff" :key="s.id" class="table-row" :class="{ inactive: !s.is_active }">
            <td class="col-name">
              <div class="staff-avatar" :style="{ background: avatarColor(s.username) }">
                {{ initials(s) }}
              </div>
              {{ s.full_name }}
            </td>
            <td class="col-username">{{ s.username }}</td>
            <td class="col-email">{{ s.email || '—' }}</td>
            <td><span class="role-badge" :class="'role-' + s.role.toLowerCase()">{{ s.role }}</span></td>
            <td>
              <span v-if="s.is_active" class="status-active">Active</span>
              <span v-else class="status-inactive">Inactive</span>
            </td>
            <td>
              <button class="row-action" @click="openEdit(s)"><Pencil :size="13" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <AppPagination :page="page" :page-size="pageSize" :total="total" @update:page="fetchStaff" />

    <!-- MODAL: Add / Edit -->
    <AppModal :open="modal.open" :title="modal.id ? 'Edit Staff Member' : 'New Staff Member'" @close="closeModal">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label class="form-label">First Name</label>
            <input v-model="modal.first_name" class="form-input" placeholder="First name" />
          </div>
          <div>
            <label class="form-label">Last Name</label>
            <input v-model="modal.last_name" class="form-input" placeholder="Last name" />
          </div>
        </div>
        <div>
          <label class="form-label">Username</label>
          <input v-model="modal.username" class="form-input" placeholder="e.g. ahmed.cashier" :disabled="!!modal.id" />
        </div>
        <div>
          <label class="form-label">Email (optional)</label>
          <input v-model="modal.email" class="form-input" type="email" placeholder="email@example.com" />
        </div>
        <div>
          <label class="form-label">Role</label>
          <select v-model="modal.role" class="form-input">
            <option value="CASHIER">Cashier</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
            <option value="OWNER">Owner</option>
          </select>
        </div>
        <div>
          <label class="form-label">{{ modal.id ? 'New Password (leave blank to keep current)' : 'Password' }}</label>
          <input v-model="modal.password" class="form-input" type="password" :placeholder="modal.id ? 'Leave blank to keep unchanged' : 'Set a password'" />
        </div>
        <div v-if="modal.id" style="display:flex;align-items:center;gap:10px;padding-top:4px;">
          <label class="form-label" style="margin:0;">Active</label>
          <button class="toggle-btn" :class="{ on: modal.is_active }" @click="modal.is_active = !modal.is_active">
            <span class="toggle-knob" />
          </button>
          <span style="font-size:12px;color:var(--text-muted);">{{ modal.is_active ? 'Can log in' : 'Blocked from logging in' }}</span>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="closeModal">Cancel</button>
        <button class="btn-primary" :disabled="!modal.username.trim() || (!modal.id && !modal.password.trim()) || saving" @click="save">
          {{ saving ? 'Saving…' : (modal.id ? 'Save Changes' : 'Add Staff') }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { Search, UserCog, Pencil } from 'lucide-vue-next'
import api from '@/api/axios'
import { useQABStore } from '@/stores/qab'
import AppPagination from '@/components/ui/AppPagination.vue'
import AppModal from '@/components/ui/AppModal.vue'

const qab = useQABStore()

const staff    = ref([])
const loading  = ref(false)
const saving   = ref(false)
const total    = ref(0)
const page     = ref(1)
const pageSize = 20
const search   = ref('')

let searchTimer = null
function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchStaff(1), 350)
}

async function fetchStaff(p = 1) {
  loading.value = true
  page.value = p
  try {
    const res = await api.get('/api/auth/staff/', {
      params: { page: p, page_size: pageSize, search: search.value || undefined },
    })
    staff.value = res.data.results ?? res.data
    total.value = res.data.count   ?? staff.value.length
  } catch { staff.value = [] } finally { loading.value = false }
}

const modal = reactive({ open: false, id: null, username: '', first_name: '', last_name: '', email: '', role: 'CASHIER', password: '', is_active: true })

function openNew() {
  Object.assign(modal, { open: true, id: null, username: '', first_name: '', last_name: '', email: '', role: 'CASHIER', password: '', is_active: true })
}
function openEdit(s) {
  Object.assign(modal, { open: true, id: s.id, username: s.username, first_name: s.first_name, last_name: s.last_name, email: s.email || '', role: s.role, password: '', is_active: s.is_active })
}
function closeModal() { modal.open = false }

async function save() {
  saving.value = true
  try {
    const payload = {
      first_name: modal.first_name,
      last_name:  modal.last_name,
      email:      modal.email,
      role:       modal.role,
    }
    if (!modal.id) payload.username = modal.username
    if (modal.id)  payload.is_active = modal.is_active
    if (modal.password.trim()) payload.password = modal.password

    modal.id
      ? await api.patch(`/api/auth/staff/${modal.id}/`, payload)
      : await api.post('/api/auth/staff/', { ...payload, username: modal.username, password: modal.password })
    closeModal()
    fetchStaff(modal.id ? page.value : 1)
  } catch (e) {
    alert(e.response?.data ? JSON.stringify(e.response.data) : 'Error saving staff member')
  } finally { saving.value = false }
}

onMounted(() => {
  fetchStaff()
  qab.setActions([{ id: 'new-staff', label: 'New Staff', icon: 'plus', handler: openNew }])
})
onUnmounted(() => qab.clearActions())

function initials(s) {
  const name = `${s.first_name} ${s.last_name}`.trim() || s.username
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const COLORS = ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2']
function avatarColor(username) {
  let hash = 0
  for (const ch of username) hash = ch.charCodeAt(0) + (hash << 5) - hash
  return COLORS[Math.abs(hash) % COLORS.length]
}
</script>

<style scoped>
.page-header  { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
.page-title   { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub     { font-size:13px; color:var(--text-muted); margin:2px 0 0; }
.header-right { display:flex; align-items:center; gap:10px; }

.search-wrap  { position:relative; }
.search-icon  { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:var(--text-muted); pointer-events:none; }
.search-input { padding:7px 12px 7px 30px; border:1px solid var(--border); border-radius:8px; background:var(--bg-card); color:var(--text-primary); font-size:13px; width:220px; outline:none; transition:border-color 120ms; }
.search-input:focus { border-color:#2563eb; }

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

.col-name     { display:flex; align-items:center; gap:10px; font-weight:500; }
.col-username { font-variant-numeric:tabular-nums; color:var(--text-secondary); font-size:12.5px; }
.col-email    { color:var(--text-muted); font-size:12px; }

.staff-avatar { width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; color:#fff; flex-shrink:0; }

.role-badge { display:inline-block; padding:2px 9px; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; }
.role-owner   { background:#f3e8ff; color:#7c3aed; }
.role-admin   { background:#dbeafe; color:#1d4ed8; }
.role-manager { background:#fef3c7; color:#b45309; }
.role-cashier { background:#f3f4f6; color:#6b7280; }

.status-active   { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:500; color:#16a34a; }
.status-active::before  { content:''; width:6px; height:6px; border-radius:50%; background:#16a34a; }
.status-inactive { display:inline-flex; align-items:center; gap:5px; font-size:12px; font-weight:500; color:#9ca3af; }
.status-inactive::before { content:''; width:6px; height:6px; border-radius:50%; background:#9ca3af; }

.row-action { width:28px; height:28px; border:none; background:none; border-radius:6px; cursor:pointer; color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; transition:background 100ms,color 100ms; }
.row-action:hover { background:var(--border); color:var(--text-primary); }

/* Toggle switch */
.toggle-btn { width:40px; height:22px; border-radius:11px; border:none; background:var(--border); cursor:pointer; position:relative; transition:background 200ms; padding:0; flex-shrink:0; }
.toggle-btn.on { background:#2563eb; }
.toggle-knob { position:absolute; width:16px; height:16px; border-radius:50%; background:#fff; top:3px; left:3px; transition:left 200ms; box-shadow:0 1px 3px rgba(0,0,0,.2); }
.toggle-btn.on .toggle-knob { left:21px; }

.form-label  { display:block; font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.form-input  { width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; box-sizing:border-box; transition:border-color 120ms; }
.form-input:focus { border-color:#2563eb; }
.form-input:disabled { opacity:.5; cursor:default; }
.btn-ghost   { display:inline-flex; align-items:center; gap:5px; padding:7px 12px; border-radius:8px; font-size:13px; font-weight:500; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; transition:background 100ms,color 100ms,transform 70ms; }
.btn-ghost:hover  { background:var(--border); color:var(--text-primary); }
.btn-ghost:active { transform:scale(0.95); }
.btn-primary { display:inline-flex; align-items:center; gap:5px; padding:8px 16px; border-radius:8px; font-size:13px; font-weight:600; border:none; background:#2563eb; color:#fff; cursor:pointer; transition:background 100ms,transform 70ms,opacity 100ms; }
.btn-primary:hover    { background:#1d4ed8; }
.btn-primary:active   { transform:scale(0.95); }
.btn-primary:disabled { opacity:.5; cursor:default; }
</style>
