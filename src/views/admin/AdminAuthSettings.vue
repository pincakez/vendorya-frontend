<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Auth Settings</h1>
        <p class="page-sub">Search any user to reset their password or manage two-factor authentication</p>
      </div>
    </div>

    <!-- Search with autocomplete -->
    <div class="search-wrap">
      <Search :size="16" class="search-icon" />
      <input v-model="query" @input="onSearch" @focus="onSearch" class="search-input"
        placeholder="Search by name, username, or email…" />
      <div v-if="showResults && results.length" class="results">
        <button v-for="u in results" :key="u.id" class="result-row" @click="select(u)">
          <div class="result-avatar" :style="{ background: colorFor(u.username) }">{{ initials(u) }}</div>
          <div class="result-main">
            <div class="result-name">{{ u.full_name }} <span class="result-username">@{{ u.username }}</span></div>
            <div class="result-meta">{{ u.is_superadmin ? 'Super Admin' : (u.role + (u.store_name ? ' · ' + u.store_name : '')) }}</div>
          </div>
          <ShieldCheck v-if="u.has_2fa" :size="14" class="result-2fa" />
        </button>
      </div>
      <div v-else-if="showResults && query && !searching" class="results"><div class="result-empty">No users found</div></div>
    </div>

    <!-- Selected user card -->
    <div v-if="selected" class="user-card">
      <div class="user-head">
        <div class="user-avatar" :style="{ background: colorFor(selected.username) }">{{ initials(selected) }}</div>
        <div>
          <div class="user-name">{{ selected.full_name }}</div>
          <div class="user-sub">@{{ selected.username }} · {{ selected.email || 'no email' }}</div>
          <div class="user-tags">
            <span class="tag" :class="selected.is_superadmin ? 'tag-admin' : 'tag-role'">
              {{ selected.is_superadmin ? 'Super Admin' : selected.role }}
            </span>
            <span v-if="selected.store_name" class="tag tag-store">{{ selected.store_name }}</span>
            <span v-if="!selected.is_active" class="tag tag-off">Inactive</span>
            <span v-if="selected.has_2fa" class="tag tag-2fa"><ShieldCheck :size="12" /> 2FA on</span>
            <span v-if="selected.force_password_change" class="tag tag-warn">Pending password change</span>
          </div>
        </div>
      </div>

      <div class="actions">
        <button class="act act-primary" @click="openRenew">
          <KeyRound :size="15" /> Renew password
        </button>
        <button v-if="selected.has_2fa" class="act" @click="disable2fa" :disabled="busy">
          <ShieldOff :size="15" /> Disable 2FA
        </button>
        <button v-if="selected.has_2fa" class="act act-danger" @click="clear2fa" :disabled="busy">
          <Trash2 :size="15" /> Clear 2FA tokens
        </button>
      </div>

      <p v-if="actionMsg" class="action-msg">{{ actionMsg }}</p>
    </div>

    <!-- Renew password modal -->
    <AppModal :open="renewOpen" title="Renew password" @close="renewOpen = false">
      <p class="modal-text">Set a temporary password for <strong>{{ selected?.username }}</strong>. They'll be required to change it on their next login. Share it with them directly.</p>
      <label class="form-label">Temporary password</label>
      <div style="display:flex; gap:8px;">
        <input v-model="temp" type="text" class="form-input" placeholder="Type or generate" />
        <button class="btn-ghost" type="button" @click="temp = genPassword()">Generate</button>
      </div>
      <p v-if="renewError" class="error-text">{{ renewError }}</p>
      <template #footer>
        <button class="btn-ghost" @click="renewOpen = false">Cancel</button>
        <button class="btn-primary" :disabled="busy || !temp" @click="renew">
          {{ busy ? 'Setting…' : 'Set temp password' }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Search, KeyRound, ShieldCheck, ShieldOff, Trash2 } from 'lucide-vue-next'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'

const query = ref('')
const results = ref([])
const showResults = ref(false)
const searching = ref(false)
const selected = ref(null)
const busy = ref(false)
const actionMsg = ref('')

const renewOpen = ref(false)
const temp = ref('')
const renewError = ref('')

let debounce = null
function onSearch() {
  showResults.value = true
  clearTimeout(debounce)
  debounce = setTimeout(doSearch, 200)
}
async function doSearch() {
  searching.value = true
  try {
    const { data } = await api.get('/api/admin/auth/users/', { params: { q: query.value } })
    results.value = data
  } catch { results.value = [] } finally { searching.value = false }
}

function select(u) {
  selected.value = u
  showResults.value = false
  query.value = u.full_name
  actionMsg.value = ''
}

async function refreshSelected() {
  if (!selected.value) return
  const { data } = await api.get(`/api/admin/auth/users/${selected.value.id}/`)
  selected.value = data
}

function openRenew() { temp.value = ''; renewError.value = ''; renewOpen.value = true }

async function renew() {
  renewError.value = ''; busy.value = true
  try {
    const { data } = await api.post(`/api/admin/auth/users/${selected.value.id}/renew-password/`, { temp_password: temp.value })
    renewOpen.value = false
    actionMsg.value = data.detail
    await refreshSelected()
  } catch (e) {
    const d = e.response?.data
    renewError.value = d?.temp_password?.[0] || d?.detail || 'Could not set password.'
  } finally { busy.value = false }
}

async function disable2fa() {
  busy.value = true; actionMsg.value = ''
  try {
    const { data } = await api.post(`/api/admin/auth/users/${selected.value.id}/disable-2fa/`)
    actionMsg.value = data.detail
    await refreshSelected()
  } catch (e) { actionMsg.value = e.response?.data?.detail || 'Failed.' } finally { busy.value = false }
}

async function clear2fa() {
  busy.value = true; actionMsg.value = ''
  try {
    const { data } = await api.post(`/api/admin/auth/users/${selected.value.id}/clear-2fa-tokens/`)
    actionMsg.value = data.detail
    await refreshSelected()
  } catch (e) { actionMsg.value = e.response?.data?.detail || 'Failed.' } finally { busy.value = false }
}

// helpers
function initials(u) {
  const n = u.full_name || u.username || '?'
  return n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}
const COLORS = ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2']
function colorFor(name) {
  let h = 0; for (const ch of (name || 'u')) h = ch.charCodeAt(0) + (h << 5) - h
  return COLORS[Math.abs(h) % COLORS.length]
}
function genPassword() {
  const U = 'ABCDEFGHJKLMNPQRSTUVWXYZ', L = 'abcdefghijkmnpqrstuvwxyz', D = '23456789'
  const all = U + L + D
  let p = U[Math.floor(Math.random()*U.length)] + L[Math.floor(Math.random()*L.length)] + D[Math.floor(Math.random()*D.length)]
  for (let i = 0; i < 9; i++) p += all[Math.floor(Math.random()*all.length)]
  return p.split('').sort(() => Math.random() - 0.5).join('')
}
</script>

<style scoped>
.page-header { margin-bottom:20px; }
.page-title  { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub    { font-size:13px; color:var(--text-muted); margin:2px 0 0; }

.search-wrap { position:relative; max-width:520px; margin-bottom:24px; }
.search-icon { position:absolute; left:13px; top:50%; transform:translateY(-50%); color:var(--text-muted); }
.search-input { width:100%; box-sizing:border-box; padding:11px 14px 11px 40px; border:1px solid var(--border); border-radius:10px; background:var(--bg-card); color:var(--text-primary); font-size:14px; outline:none; transition:border-color 120ms; }
.search-input:focus { border-color:var(--admin-accent, #ef4444); }

.results { position:absolute; z-index:20; top:calc(100% + 6px); left:0; right:0; background:var(--bg-card); border:1px solid var(--border); border-radius:10px; box-shadow:0 8px 28px rgba(0,0,0,.18); overflow:hidden; max-height:340px; overflow-y:auto; }
.result-row { display:flex; align-items:center; gap:12px; width:100%; padding:10px 14px; background:none; border:none; border-bottom:1px solid var(--border); cursor:pointer; text-align:left; transition:background 100ms; }
.result-row:last-child { border-bottom:none; }
.result-row:hover { background:var(--bg-app); }
.result-avatar { width:32px; height:32px; border-radius:50%; color:#fff; font-size:12px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.result-main { flex:1; min-width:0; }
.result-name { font-size:13.5px; font-weight:600; color:var(--text-primary); }
.result-username { font-weight:400; color:var(--text-muted); }
.result-meta { font-size:12px; color:var(--text-muted); }
.result-2fa { color:#16a34a; flex-shrink:0; }
.result-empty { padding:14px; font-size:13px; color:var(--text-muted); text-align:center; }

.user-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:24px; max-width:640px; }
.user-head { display:flex; gap:16px; align-items:flex-start; }
.user-avatar { width:56px; height:56px; border-radius:50%; color:#fff; font-size:20px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.user-name { font-size:17px; font-weight:700; color:var(--text-primary); }
.user-sub { font-size:13px; color:var(--text-muted); margin-top:2px; }
.user-tags { display:flex; flex-wrap:wrap; gap:6px; margin-top:10px; }
.tag { display:inline-flex; align-items:center; gap:4px; font-size:11px; font-weight:700; padding:3px 9px; border-radius:20px; text-transform:uppercase; letter-spacing:.03em; }
.tag-admin { background:#fee2e2; color:#dc2626; }
.tag-role  { background:#dbeafe; color:#1d4ed8; }
.tag-store { background:#f3f4f6; color:#6b7280; text-transform:none; letter-spacing:0; }
.tag-off   { background:#f3f4f6; color:#9ca3af; }
.tag-2fa   { background:#dcfce7; color:#166534; }
.tag-warn  { background:#fef3c7; color:#b45309; text-transform:none; letter-spacing:0; }

.actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:22px; padding-top:18px; border-top:1px solid var(--border); }
.act { display:inline-flex; align-items:center; gap:6px; padding:8px 14px; border-radius:8px; font-size:13px; font-weight:600; border:1px solid var(--border); background:var(--bg-app); color:var(--text-primary); cursor:pointer; transition:background 100ms; }
.act:hover { background:var(--border); }
.act:disabled { opacity:.5; cursor:default; }
.act-primary { background:#2563eb; color:#fff; border-color:#2563eb; }
.act-primary:hover { background:#1d4ed8; }
.act-danger { color:#dc2626; border-color:#fecaca; }
.act-danger:hover { background:#fef2f2; }
.action-msg { font-size:13px; color:#16a34a; font-weight:500; margin:14px 0 0; }

.modal-text { font-size:13px; color:var(--text-secondary); margin:0 0 12px; line-height:1.5; }
.form-label { display:block; font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.form-input { flex:1; width:100%; box-sizing:border-box; padding:9px 11px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; }
.form-input:focus { border-color:#2563eb; }
.error-text { font-size:12px; color:#dc2626; margin-top:10px; }

.btn-primary { display:inline-flex; align-items:center; gap:5px; padding:8px 16px; border-radius:8px; font-size:13px; font-weight:600; border:none; background:#2563eb; color:#fff; cursor:pointer; }
.btn-primary:hover { background:#1d4ed8; }
.btn-primary:disabled { opacity:.5; cursor:default; }
.btn-ghost { padding:8px 14px; border-radius:8px; font-size:13px; font-weight:600; border:1px solid var(--border); background:transparent; color:var(--text-secondary); cursor:pointer; white-space:nowrap; }
.btn-ghost:hover { background:var(--border); }
</style>
