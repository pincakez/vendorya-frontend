<template>
  <div class="login-bg">
    <div class="login-card">
      <!-- Logo -->
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px;">
        <div style="width:40px;height:40px;background:linear-gradient(135deg,#1d4ed8,#7c3aed);border-radius:10px;display:flex;align-items:center;justify-content:center;">
          <span style="color:#fff;font-weight:800;font-size:18px;">V</span>
        </div>
        <div>
          <div style="font-weight:700;font-size:17px;color:var(--text-primary);">Vendorya</div>
          <div style="font-size:11px;color:var(--text-muted);">ERP System</div>
        </div>
      </div>

      <h1 style="font-size:20px;font-weight:700;color:var(--text-primary);margin:0 0 4px;">Welcome back</h1>
      <p style="font-size:13.5px;color:var(--text-muted);margin:0 0 24px;">Sign in to your store account</p>

      <form @submit.prevent="handleLogin">
        <!-- Username -->
        <div style="margin-bottom:14px;">
          <label style="display:block;font-size:12.5px;font-weight:600;color:var(--text-secondary);margin-bottom:6px;">Username</label>
          <div style="position:relative;">
            <User :size="15" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);" />
            <input
              v-model="form.username"
              type="text"
              class="form-input"
              style="padding-left:36px;"
              placeholder="Enter your username"
              autocomplete="username"
              :disabled="loading"
            />
          </div>
        </div>

        <!-- Password -->
        <div style="margin-bottom:20px;">
          <label style="display:block;font-size:12.5px;font-weight:600;color:var(--text-secondary);margin-bottom:6px;">Password</label>
          <div style="position:relative;">
            <Lock :size="15" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);" />
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="form-input"
              style="padding-left:36px;padding-right:40px;"
              placeholder="Enter your password"
              autocomplete="current-password"
              :disabled="loading"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-muted);padding:0;display:flex;"
            >
              <Eye v-if="!showPassword" :size="15" />
              <EyeOff v-else :size="15" />
            </button>
          </div>
        </div>

        <!-- Error -->
        <div v-if="error" style="display:flex;align-items:flex-start;gap:8px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 12px;margin-bottom:16px;">
          <AlertCircle :size="15" style="color:#ef4444;margin-top:1px;flex-shrink:0;" />
          <span style="font-size:13px;color:#dc2626;">{{ error }}</span>
        </div>

        <!-- Submit -->
        <button
          type="submit"
          :disabled="loading || !form.username || !form.password"
          style="
            width:100%;
            height:42px;
            background:linear-gradient(135deg,#1d4ed8,#1e40af);
            color:#fff;
            border:none;
            border-radius:10px;
            font-size:14px;
            font-weight:600;
            cursor:pointer;
            display:flex;
            align-items:center;
            justify-content:center;
            gap:8px;
            transition:opacity 150ms,transform 80ms;
          "
          :style="{ opacity: (loading || !form.username || !form.password) ? '0.6' : '1' }"
          @mousedown="e => e.currentTarget.style.transform='scale(0.97)'"
          @mouseup="e => e.currentTarget.style.transform=''"
          @mouseleave="e => e.currentTarget.style.transform=''"
        >
          <Loader2 v-if="loading" :size="16" style="animation:spin 0.8s linear infinite;" />
          <LogIn v-else :size="16" />
          {{ loading ? 'Signing in…' : 'Sign In' }}
        </button>
      </form>

      <!-- Theme toggle at bottom -->
      <div style="margin-top:24px;display:flex;justify-content:center;">
        <button
          @click="theme.toggle()"
          style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-muted);background:none;border:none;cursor:pointer;padding:6px 10px;border-radius:8px;transition:background 120ms;"
          @mouseenter="e => e.currentTarget.style.background='var(--border)'"
          @mouseleave="e => e.currentTarget.style.background='none'"
        >
          <Sun v-if="theme.dark" :size="13" />
          <Moon v-else :size="13" />
          {{ theme.dark ? 'Light mode' : 'Dark mode' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Lock, Eye, EyeOff, AlertCircle, Loader2, LogIn, Sun, Moon } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore } from '@/stores/theme'

const router = useRouter()
const auth = useAuthStore()
const theme = useThemeStore()

const form = ref({ username: '', password: '' })
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')

async function handleLogin() {
  if (!form.value.username || !form.value.password) return
  error.value = ''
  loading.value = true
  try {
    await auth.login(form.value.username, form.value.password)
    router.push(auth.isSuperadmin ? '/admin/dashboard' : '/dashboard')
  } catch (err) {
    const status = err.response?.status
    if (status === 401) {
      error.value = 'Invalid username or password.'
    } else if (status === 400) {
      error.value = 'Please fill in both fields.'
    } else if (!navigator.onLine) {
      error.value = 'No internet connection.'
    } else {
      error.value = 'Server error. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
