<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Commands</h1>
        <p class="page-sub">Live session control — sign out individual users or entire stores</p>
      </div>
      <button class="btn-ghost" :disabled="loading" @click="load">
        <RefreshCw :size="15" :class="loading ? 'spin' : ''" /> Refresh
      </button>
    </div>

    <!-- Tab bar -->
    <div class="tab-bar" style="margin-bottom: 20px;">
      <button class="tab-btn" :class="{ active: tab === 'active' }" @click="tab = 'active'">
        <Wifi :size="14" />
        Active Sessions
        <span v-if="sessions.active.length" class="tab-count">{{ sessions.active.length }}</span>
      </button>
      <button class="tab-btn" :class="{ active: tab === 'inactive' }" @click="tab = 'inactive'">
        <WifiOff :size="14" />
        No Active Sessions
        <span v-if="sessions.inactive.length" class="tab-count tab-count-muted">{{ sessions.inactive.length }}</span>
      </button>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="sk-list">
      <div v-for="i in 3" :key="i" class="sk-card">
        <div class="sk-line sk-title"></div>
        <div class="sk-line sk-sub"></div>
      </div>
    </div>

    <!-- ACTIVE TAB -->
    <template v-else-if="tab === 'active'">
      <div v-if="!sessions.active.length" class="empty-state">
        <WifiOff :size="36" class="empty-icon" />
        <p>No active sessions right now</p>
        <span>All users are logged out or their tokens have expired</span>
      </div>

      <div v-else class="store-list">
        <div v-for="entry in sessions.active" :key="entry.store.id" class="store-card">
          <!-- Store header -->
          <div class="store-head">
            <div class="store-info">
              <div class="store-name">{{ entry.store.name }}</div>
              <div class="store-meta">
                <span class="code-badge">{{ entry.store.store_code }}</span>
                <span class="sess-count">{{ entry.total_tokens }} token{{ entry.total_tokens !== 1 ? 's' : '' }}</span>
                <span v-if="!entry.store.is_active" class="status-badge status-inactive">Inactive store</span>
              </div>
            </div>
            <button
              class="btn-danger"
              :disabled="busy[entry.store.id]"
              @click="forceLogoutStore(entry.store)"
            >
              <LogOut :size="14" />
              {{ busy[entry.store.id] === 'store' ? 'Signing out…' : 'Sign out store' }}
            </button>
          </div>

          <!-- User rows -->
          <div class="user-list">
            <div v-for="user in entry.users" :key="user.id" class="user-row">
              <div class="user-avatar" :style="{ background: colorFor(user.username) }">
                {{ initials(user.full_name) }}
              </div>
              <div class="user-main">
                <div class="user-name">{{ user.full_name }}</div>
                <div class="user-meta">
                  <span class="role-badge" :class="`role-${user.role.toLowerCase()}`">{{ user.role }}</span>
                  <span class="token-info">{{ user.active_tokens }} active token{{ user.active_tokens !== 1 ? 's' : '' }}</span>
                  <span class="token-date">Last login {{ timeAgo(user.last_token_at) }}</span>
                </div>
              </div>
              <button
                class="btn-ghost btn-sm"
                style="color: var(--danger);"
                :disabled="!!busy[user.id]"
                @click="forceLogoutUser(user, entry.store)"
              >
                <LogOut :size="13" />
                {{ busy[user.id] ? 'Signing out…' : 'Sign out' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- INACTIVE TAB -->
    <template v-else>
      <p class="inactive-note">
        These stores have no active sessions. If any users logged in recently and haven't refreshed their
        token yet, their refresh token may still be valid. You can pre-clear them here.
      </p>

      <div v-if="!sessions.inactive.length" class="empty-state">
        <CheckCircle :size="36" class="empty-icon" style="color: var(--success);" />
        <p>All stores have active sessions</p>
      </div>

      <div v-else class="store-list">
        <div v-for="entry in sessions.inactive" :key="entry.store.id" class="store-card store-card-dim">
          <div class="store-head">
            <div class="store-info">
              <div class="store-name">{{ entry.store.name }}</div>
              <div class="store-meta">
                <span class="code-badge">{{ entry.store.store_code }}</span>
                <span class="no-sess">No active sessions</span>
                <span v-if="!entry.store.is_active" class="status-badge status-inactive">Inactive store</span>
              </div>
            </div>
            <button
              class="btn-ghost btn-sm"
              style="color: var(--danger);"
              :disabled="busy[entry.store.id]"
              @click="forceLogoutStore(entry.store)"
            >
              <LogOut :size="14" />
              {{ busy[entry.store.id] ? 'Clearing…' : 'Clear tokens' }}
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- Toast -->
    <transition name="toast-fade">
      <div v-if="toast" class="cmd-toast" :class="toast.type">{{ toast.msg }}</div>
    </transition>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { RefreshCw, LogOut, Wifi, WifiOff, CheckCircle } from 'lucide-vue-next'
import api from '@/api/axios'

const tab      = ref('active')
const loading  = ref(false)
const busy     = reactive({})
const toast    = ref(null)
const sessions = ref({ active: [], inactive: [] })

async function load() {
  loading.value = true
  try {
    const { data } = await api.get('/api/admin/commands/sessions/')
    sessions.value = data
  } finally {
    loading.value = false
  }
}

async function forceLogoutStore(store) {
  busy[store.id] = 'store'
  try {
    const { data } = await api.post(`/api/admin/stores/${store.id}/force-logout/`)
    showToast(`${store.name}: ${data.detail}`, 'success')
    await load()
  } catch {
    showToast('Failed to sign out store', 'error')
  } finally {
    delete busy[store.id]
  }
}

async function forceLogoutUser(user, store) {
  busy[user.id] = true
  try {
    const { data } = await api.post('/api/admin/commands/user-logout/', { user_id: user.id })
    showToast(data.detail, 'success')
    await load()
  } catch {
    showToast(`Failed to sign out ${user.username}`, 'error')
  } finally {
    delete busy[user.id]
  }
}

function showToast(msg, type = 'success') {
  toast.value = { msg, type }
  setTimeout(() => { toast.value = null }, 3500)
}

const COLORS = ['#f78f1e','#3b82f6','#8b5cf6','#10b981','#ef4444','#f59e0b','#06b6d4','#ec4899']
function colorFor(name) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff
  return COLORS[h % COLORS.length]
}

function initials(name) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000)
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

onMounted(load)
</script>

<style scoped>
.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 18px;
  padding: 0 5px;
  border-radius: 9px;
  font-size: 11px;
  font-weight: 700;
  background: var(--danger);
  color: #fff;
  margin-left: 5px;
}
.tab-count-muted {
  background: var(--text-muted);
}

/* Store cards */
.store-list { display: flex; flex-direction: column; gap: 14px; }

.store-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}
.store-card-dim { opacity: 0.75; }

.store-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  background: var(--surface-2, var(--surface));
  border-bottom: 1px solid var(--border);
}
.store-card-dim .store-head { border-bottom: none; }

.store-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}
.store-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 3px;
}
.code-badge {
  font-size: 11px;
  font-weight: 600;
  background: var(--accent-soft, color-mix(in srgb, var(--accent) 12%, transparent));
  color: var(--accent);
  padding: 2px 7px;
  border-radius: 5px;
}
.sess-count {
  font-size: 12px;
  color: var(--text-secondary);
}
.no-sess {
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
}
.status-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 5px;
}
.status-inactive {
  background: var(--danger-soft);
  color: var(--danger);
}

/* User rows */
.user-list { padding: 4px 0; }

.user-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  transition: background 120ms;
}
.user-row:last-child { border-bottom: none; }
.user-row:hover { background: var(--surface-2, color-mix(in srgb, var(--border) 30%, transparent)); }

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}
.user-main { flex: 1; min-width: 0; }
.user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.user-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}
.role-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.role-owner   { background: var(--warning-soft); color: var(--warning); }
.role-admin   { background: var(--danger-soft);  color: var(--danger); }
.role-manager { background: var(--info-soft);    color: var(--info); }
.role-cashier { background: var(--success-soft); color: var(--success); }

.token-info  { font-size: 12px; color: var(--text-secondary); }
.token-date  { font-size: 12px; color: var(--text-muted); }

/* Empty state */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
}
.empty-state .empty-icon { margin: 0 auto 14px; display: block; opacity: 0.4; }
.empty-state p   { font-size: 16px; font-weight: 500; color: var(--text-secondary); margin-bottom: 4px; }
.empty-state span { font-size: 13px; }

/* Inactive note */
.inactive-note {
  font-size: 13px;
  color: var(--text-muted);
  background: var(--surface-2, color-mix(in srgb, var(--border) 30%, transparent));
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 16px;
  line-height: 1.5;
}

/* Skeleton */
.sk-list { display: flex; flex-direction: column; gap: 14px; }
.sk-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
}
.sk-line {
  background: var(--border);
  border-radius: 6px;
  animation: sk-pulse 1.4s ease-in-out infinite;
}
.sk-title { height: 18px; width: 40%; margin-bottom: 8px; }
.sk-sub   { height: 13px; width: 25%; }

@keyframes sk-pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

/* Spin animation for refresh icon */
.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Toast */
.cmd-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  padding: 10px 18px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(0,0,0,.15);
}
.cmd-toast.success { background: var(--success); color: #fff; }
.cmd-toast.error   { background: var(--danger);  color: #fff; }

.toast-fade-enter-active, .toast-fade-leave-active { transition: opacity .25s, transform .25s; }
.toast-fade-enter-from, .toast-fade-leave-to { opacity: 0; transform: translateY(8px); }
</style>
