<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('settings.security.title') }}</h1>
        <p class="page-sub">{{ t('settings.security.sub') }}</p>
      </div>
      <RouterLink to="/settings/profile" class="back-link">← {{ t('settings.security.back_profile') }}</RouterLink>
    </div>

    <div class="sec-layout">
      <!-- Change password -->
      <div class="settings-card">
        <div class="section-label">{{ t('settings.security.change_password') }}</div>
        <div class="form-col">
          <div>
            <label class="form-label">{{ t('settings.security.current') }}</label>
            <input v-model="pw.current" type="password" class="form-input" :placeholder="t('settings.security.current_ph')" autocomplete="current-password" />
          </div>
          <div>
            <label class="form-label">{{ t('settings.security.new') }}</label>
            <input v-model="pw.next" type="password" class="form-input" :placeholder="t('settings.security.new_ph')" autocomplete="new-password" />
          </div>
          <div>
            <label class="form-label">{{ t('settings.security.confirm') }}</label>
            <input v-model="pw.confirm" type="password" class="form-input" :placeholder="t('settings.security.confirm_ph')" autocomplete="new-password" />
          </div>
        </div>
        <p v-if="pwError" class="error-text">{{ pwError }}</p>
        <div class="form-footer">
          <span v-if="pwSaved" class="saved-msg">{{ t('settings.security.changed') }}</span>
          <button class="btn-primary" :disabled="pwBusy || !canChange" @click="changePassword">
            {{ pwBusy ? t('common.saving') : t('settings.security.update_btn') }}
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
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'
import api from '@/api/axios'
import TwoFactorPanel from '@/components/settings/TwoFactorPanel.vue'

const { t } = useI18n()

const pw = reactive({ current: '', next: '', confirm: '' })
const pwBusy = ref(false)
const pwSaved = ref(false)
const pwError = ref('')

const canChange = computed(() => pw.current && pw.next && pw.confirm)

async function changePassword() {
  pwError.value = ''
  pwSaved.value = false
  if (pw.next !== pw.confirm) { pwError.value = t('settings.security.err_mismatch'); return }
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
    pwError.value = d?.new_password?.[0] || d?.detail || t('settings.security.err_generic')
  } finally { pwBusy.value = false }
}
</script>

<style scoped>
.back-link   { font-size:13px; color:var(--accent); text-decoration:none; font-weight:600; }
.back-link:hover { text-decoration:underline; }

.sec-layout { display:flex; flex-direction:column; gap:20px; max-width:640px; }

.settings-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:24px; }
.section-label { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-muted); margin-bottom:14px; padding-bottom:8px; border-bottom:1px solid var(--border); }
.form-col { display:flex; flex-direction:column; gap:14px; max-width:360px; }
.form-input { width:100%; box-sizing:border-box; padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; transition:border-color 120ms; }
.form-input:focus { border-color:var(--accent); }
.error-text { font-size:12px; color:var(--danger); margin-top:10px; }
.saved-msg  { font-size:13px; color:var(--success); font-weight:500; }
.form-footer { display:flex; align-items:center; justify-content:flex-end; gap:12px; margin-top:18px; padding-top:16px; border-top:1px solid var(--border); }

</style>
