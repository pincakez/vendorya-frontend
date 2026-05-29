<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Security</h1>
        <p class="page-sub">Manage your password and two-factor authentication</p>
      </div>
      <RouterLink to="/settings/profile" class="back-link">← Back to Profile</RouterLink>
    </div>

    <div class="sec-layout">
      <!-- Change password -->
      <div class="settings-card">
        <div class="section-label">Change Password</div>
        <div class="form-col">
          <div>
            <label class="form-label">Current password</label>
            <input v-model="pw.current" type="password" class="form-input" placeholder="Enter current password" autocomplete="current-password" />
          </div>
          <div>
            <label class="form-label">New password</label>
            <input v-model="pw.next" type="password" class="form-input" placeholder="At least 10 characters" autocomplete="new-password" />
          </div>
          <div>
            <label class="form-label">Confirm new password</label>
            <input v-model="pw.confirm" type="password" class="form-input" placeholder="Repeat new password" autocomplete="new-password" />
          </div>
        </div>
        <p v-if="pwError" class="error-text">{{ pwError }}</p>
        <div class="form-footer">
          <span v-if="pwSaved" class="saved-msg">Password changed</span>
          <button class="btn-primary" :disabled="pwBusy || !canChange" @click="changePassword">
            {{ pwBusy ? 'Saving…' : 'Update Password' }}
          </button>
        </div>
      </div>

      <!-- 2FA -->
      <TwoFactorPanel />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { RouterLink } from 'vue-router'
import api from '@/api/axios'
import TwoFactorPanel from '@/components/settings/TwoFactorPanel.vue'

const pw = reactive({ current: '', next: '', confirm: '' })
const pwBusy = ref(false)
const pwSaved = ref(false)
const pwError = ref('')

const canChange = computed(() => pw.current && pw.next && pw.confirm)

async function changePassword() {
  pwError.value = ''
  pwSaved.value = false
  if (pw.next !== pw.confirm) { pwError.value = 'New passwords do not match.'; return }
  pwBusy.value = true
  try {
    await api.post('/api/auth/change-password/', {
      current_password: pw.current,
      new_password: pw.next,
    })
    pw.current = ''; pw.next = ''; pw.confirm = ''
    pwSaved.value = true
    setTimeout(() => { pwSaved.value = false }, 2500)
  } catch (e) {
    const d = e.response?.data
    pwError.value = d?.new_password?.[0] || d?.detail || 'Could not change password.'
  } finally { pwBusy.value = false }
}
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; }
.page-title  { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub    { font-size:13px; color:var(--text-muted); margin:2px 0 0; }
.back-link   { font-size:13px; color:#2563eb; text-decoration:none; font-weight:600; }
.back-link:hover { text-decoration:underline; }

.sec-layout { display:flex; flex-direction:column; gap:20px; max-width:640px; }

.settings-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:24px; }
.section-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-muted); margin-bottom:14px; padding-bottom:8px; border-bottom:1px solid var(--border); }
.form-col { display:flex; flex-direction:column; gap:14px; max-width:360px; }
.form-label { display:block; font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.form-input { width:100%; box-sizing:border-box; padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; transition:border-color 120ms; }
.form-input:focus { border-color:#2563eb; }
.error-text { font-size:12px; color:#dc2626; margin-top:10px; }
.saved-msg  { font-size:13px; color:#16a34a; font-weight:500; }
.form-footer { display:flex; align-items:center; justify-content:flex-end; gap:12px; margin-top:18px; padding-top:16px; border-top:1px solid var(--border); }

.btn-primary { display:inline-flex; align-items:center; gap:5px; padding:8px 18px; border-radius:8px; font-size:13px; font-weight:600; border:none; background:#2563eb; color:#fff; cursor:pointer; transition:background 100ms,opacity 100ms; }
.btn-primary:hover { background:#1d4ed8; }
.btn-primary:disabled { opacity:.5; cursor:default; }
</style>
