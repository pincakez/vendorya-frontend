<template>
  <div class="login-bg">
    <div class="login-card">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
        <div style="width:40px;height:40px;background:linear-gradient(135deg,var(--accent-hover),#7c3aed);border-radius:10px;display:flex;align-items:center;justify-content:center;">
          <KeyRound :size="18" color="#fff" />
        </div>
        <div>
          <div style="font-weight:700;font-size:17px;color:var(--text-primary);">Set a new password</div>
          <div style="font-size:11px;color:var(--text-muted);">Required before you continue</div>
        </div>
      </div>

      <p class="hint">Your administrator issued a temporary password. Choose a new one to finish signing in.</p>

      <form @submit.prevent="submit">
        <div style="margin-bottom:14px;">
          <label class="lbl">New password</label>
          <input v-model="newPw" type="password" class="form-input" placeholder="At least 10 characters" autocomplete="new-password" :disabled="loading" />
        </div>
        <div style="margin-bottom:18px;">
          <label class="lbl">Confirm new password</label>
          <input v-model="confirmPw" type="password" class="form-input" placeholder="Repeat new password" autocomplete="new-password" :disabled="loading" />
        </div>

        <div v-if="error" class="err"><AlertCircle :size="15" style="flex-shrink:0;margin-top:1px;" /><span>{{ error }}</span></div>

        <button type="submit" :disabled="loading || !newPw || !confirmPw" class="submit" :style="{ opacity:(loading||!newPw||!confirmPw)?'0.6':'1' }">
          <Loader2 v-if="loading" :size="16" style="animation:spin .8s linear infinite;" />
          <KeyRound v-else :size="16" />
          {{ loading ? 'Saving…' : 'Set password & continue' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { KeyRound, AlertCircle, Loader2 } from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()
const newPw = ref('')
const confirmPw = ref('')
const loading = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  if (newPw.value !== confirmPw.value) { error.value = 'Passwords do not match.'; return }
  loading.value = true
  try {
    await api.post('/api/auth/change-password/', { new_password: newPw.value })
    await auth.fetchMe()   // clears force_password_change in the cached user
    router.push(auth.isSuperadmin ? '/admin/dashboard' : '/dashboard')
  } catch (e) {
    const d = e.response?.data
    error.value = d?.new_password?.[0] || d?.detail || 'Could not set password.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@keyframes spin { to { transform: rotate(360deg); } }
.hint { font-size:13px;color:var(--text-muted);margin:0 0 20px;line-height:1.5; }
.lbl { display:block;font-size:12.5px;font-weight:600;color:var(--text-secondary);margin-bottom:6px; }
.err { display:flex;align-items:flex-start;gap:8px;background:var(--danger-soft);border:1px solid #fecaca;border-radius:8px;padding:10px 12px;margin-bottom:16px;color:var(--danger);font-size:13px; }
.submit { width:100%;height:42px;background:linear-gradient(135deg,var(--accent-hover),var(--accent-hover));color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:opacity 150ms,transform 80ms; }
.submit:active { transform:scale(.97); }
</style>
