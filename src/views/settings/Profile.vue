<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">My Profile</h1>
        <p class="page-sub">Update your name, email and password</p>
      </div>
    </div>

    <div class="profile-layout">
      <!-- Avatar card -->
      <div class="avatar-card">
        <div class="avatar-circle" :style="{ background: avatarColor }">
          <img v-if="auth.user?.photo" :src="auth.user.photo" alt="" class="avatar-img" />
          <span v-else class="avatar-initials">{{ auth.initials }}</span>
        </div>
        <div class="avatar-name">{{ auth.displayName }}</div>
        <div class="avatar-role">
          <span class="role-badge" :class="'role-' + (auth.userRole || '').toLowerCase()">{{ auth.userRole }}</span>
        </div>
        <div class="avatar-store">{{ auth.storeName }}</div>
      </div>

      <!-- Form card -->
      <div class="settings-card">
        <div class="section-label">Personal Info</div>
        <div class="form-grid">
          <div>
            <label class="form-label">First Name</label>
            <input v-model="form.first_name" class="form-input" placeholder="First name" />
          </div>
          <div>
            <label class="form-label">Last Name</label>
            <input v-model="form.last_name" class="form-input" placeholder="Last name" />
          </div>
          <div style="grid-column:1/-1;">
            <label class="form-label">Email</label>
            <input v-model="form.email" type="email" class="form-input" placeholder="email@example.com" />
          </div>
        </div>

        <div class="section-label" style="margin-top:20px;">Password &amp; Security</div>
        <RouterLink to="/settings/security" class="security-link">
          <span><ShieldCheck :size="15" /> Change password &amp; two-factor authentication</span>
          <ChevronRight :size="16" />
        </RouterLink>

        <div class="form-footer">
          <span v-if="saved" class="saved-msg">Saved!</span>
          <button class="btn-primary" :disabled="saving" @click="save">
            {{ saving ? 'Saving…' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ShieldCheck, ChevronRight } from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()

const form = reactive({ first_name: '', last_name: '', email: '' })
const saving = ref(false)
const saved  = ref(false)

const COLORS = ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2']
const avatarColor = computed(() => {
  const name = auth.user?.username || 'u'
  let hash = 0
  for (const ch of name) hash = ch.charCodeAt(0) + (hash << 5) - hash
  return COLORS[Math.abs(hash) % COLORS.length]
})

function loadProfile() {
  form.first_name = auth.user?.first_name || ''
  form.last_name  = auth.user?.last_name  || ''
  form.email      = auth.user?.email      || ''
}

async function save() {
  saving.value = true
  saved.value  = false
  try {
    const payload = { first_name: form.first_name, last_name: form.last_name, email: form.email }
    const res = await api.patch('/api/auth/me/', payload)
    auth.user = { ...auth.user, ...res.data }
    saved.value = true
    setTimeout(() => { saved.value = false }, 2500)
  } catch (e) {
    alert(e.response?.data ? JSON.stringify(e.response.data) : 'Error saving profile')
  } finally { saving.value = false }
}

onMounted(() => loadProfile())
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; }
.page-title  { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub    { font-size:13px; color:var(--text-muted); margin:2px 0 0; }

.profile-layout { display:grid; grid-template-columns:220px 1fr; gap:20px; align-items:start; }
@media (max-width: 700px) { .profile-layout { grid-template-columns:1fr; } }

.avatar-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:24px 16px; display:flex; flex-direction:column; align-items:center; gap:10px; text-align:center; }
.avatar-circle  { width:72px; height:72px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:hidden; }
.avatar-img     { width:100%; height:100%; object-fit:cover; }
.avatar-initials{ font-size:24px; font-weight:700; color:#fff; }
.avatar-name    { font-size:15px; font-weight:600; color:var(--text-primary); }
.avatar-role    { margin-top:2px; }
.avatar-store   { font-size:12px; color:var(--text-muted); }

.role-badge  { display:inline-block; padding:2px 9px; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; }
.role-owner   { background:#f3e8ff; color:#7c3aed; }
.role-admin   { background:var(--accent-soft); color:var(--accent-hover); }
.role-manager { background:#fef3c7; color:#b45309; }
.role-cashier { background:#f3f4f6; color:#6b7280; }

.settings-card  { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:24px; }
.section-label  { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-muted); margin-bottom:14px; padding-bottom:8px; border-bottom:1px solid var(--border); }
.form-grid      { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.form-label     { display:block; font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.form-input     { width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; box-sizing:border-box; transition:border-color 120ms; }
.form-input:focus { border-color:var(--accent); }

.error-text { font-size:12px; color:#dc2626; margin-top:6px; }
.saved-msg  { font-size:13px; color:#16a34a; font-weight:500; }
.security-link { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:11px 14px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; font-weight:600; text-decoration:none; transition:border-color 120ms, background 120ms; }
.security-link span { display:inline-flex; align-items:center; gap:8px; }
.security-link:hover { border-color:var(--accent); background:var(--bg-card); }
.form-footer { display:flex; align-items:center; justify-content:flex-end; gap:12px; margin-top:20px; padding-top:16px; border-top:1px solid var(--border); }

.btn-primary { display:inline-flex; align-items:center; gap:5px; padding:8px 18px; border-radius:8px; font-size:13px; font-weight:600; border:none; background:var(--accent); color:#fff; cursor:pointer; transition:background 100ms,transform 70ms,opacity 100ms; }
.btn-primary:hover    { background:var(--accent-hover); }
.btn-primary:active   { transform:scale(0.95); }
.btn-primary:disabled { opacity:.5; cursor:default; }
</style>
