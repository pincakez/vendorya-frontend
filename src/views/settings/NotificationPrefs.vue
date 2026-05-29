<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Notifications</h1>
        <p class="page-sub">Control which alerts you see and which sounds they play</p>
      </div>
    </div>

    <div class="settings-card">
      <div v-if="loading" class="loading-msg">Loading preferences...</div>
      <template v-else>

        <div class="pref-table">
          <!-- Header -->
          <div class="pt-row pt-head">
            <div class="pt-type">Alert type</div>
            <div class="pt-enable">Enable</div>
            <div class="pt-sound">Sound</div>
          </div>

          <!-- INFO -->
          <div class="pt-row">
            <div class="pt-type">
              <span class="pt-dot dot-info"></span>
              <div>
                <div class="pt-label">Information</div>
                <div class="pt-hint">Low-priority updates — payment received, general system messages</div>
              </div>
            </div>
            <div class="pt-enable">
              <label class="toggle" :class="{ on: prefs.info_enabled }">
                <input type="checkbox" v-model="prefs.info_enabled" />
                <span class="track"><span class="thumb"></span></span>
              </label>
            </div>
            <div class="pt-sound">
              <select v-model="prefs.info_sound" class="sound-select" :disabled="!prefs.info_enabled">
                <option v-for="s in soundOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
            </div>
          </div>

          <!-- WARNING -->
          <div class="pt-row">
            <div class="pt-type">
              <span class="pt-dot dot-warning"></span>
              <div>
                <div class="pt-label">Warning</div>
                <div class="pt-hint">Items needing attention — low stock, shift cash difference</div>
              </div>
            </div>
            <div class="pt-enable">
              <label class="toggle" :class="{ on: prefs.warning_enabled }">
                <input type="checkbox" v-model="prefs.warning_enabled" />
                <span class="track"><span class="thumb"></span></span>
              </label>
            </div>
            <div class="pt-sound">
              <select v-model="prefs.warning_sound" class="sound-select" :disabled="!prefs.warning_enabled">
                <option v-for="s in soundOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
            </div>
          </div>

          <!-- ALERT -->
          <div class="pt-row">
            <div class="pt-type">
              <span class="pt-dot dot-alert"></span>
              <div>
                <div class="pt-label">Alert</div>
                <div class="pt-hint">Action required — invoice voided, access denied</div>
              </div>
            </div>
            <div class="pt-enable">
              <label class="toggle" :class="{ on: prefs.alert_enabled }">
                <input type="checkbox" v-model="prefs.alert_enabled" />
                <span class="track"><span class="thumb"></span></span>
              </label>
            </div>
            <div class="pt-sound">
              <select v-model="prefs.alert_sound" class="sound-select" :disabled="!prefs.alert_enabled">
                <option v-for="s in soundOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
            </div>
          </div>

          <!-- ADMIN — always on, sound only -->
          <div class="pt-row">
            <div class="pt-type">
              <span class="pt-dot dot-admin"></span>
              <div>
                <div class="pt-label">Admin Notes</div>
                <div class="pt-hint">Messages sent directly from Vendorya admin — always shown</div>
              </div>
            </div>
            <div class="pt-enable">
              <span class="always-on">Always on</span>
            </div>
            <div class="pt-sound">
              <select v-model="prefs.admin_sound" class="sound-select">
                <option v-for="s in soundOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn-primary" :disabled="saving" @click="save">
            {{ saving ? 'Saving...' : 'Save preferences' }}
          </button>
          <span v-if="saved" class="save-ok">Saved</span>
        </div>

      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '@/api/axios'

const loading = ref(true)
const saving  = ref(false)
const saved   = ref(false)

const prefs = ref({
  info_enabled: true,
  warning_enabled: true,
  alert_enabled: true,
  info_sound: 's01',
  warning_sound: 's02',
  alert_sound: 's03',
  admin_sound: 's01',
})

const soundOptions = [
  { value: 'mute', label: 'Mute' },
  ...Array.from({ length: 10 }, (_, i) => ({
    value: `s${String(i + 1).padStart(2, '0')}`,
    label: `Sound ${String(i + 1).padStart(2, '0')}`,
  })),
]

async function load() {
  try {
    const res = await api.get('/api/notifications/preferences/')
    Object.assign(prefs.value, res.data)
  } catch {}
  loading.value = false
}

async function save() {
  saving.value = true
  try {
    await api.put('/api/notifications/preferences/', prefs.value)
    saved.value = true
    setTimeout(() => { saved.value = false }, 2000)
  } catch {}
  saving.value = false
}

onMounted(load)
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; }
.page-title  { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub    { font-size:13px; color:var(--text-muted); margin:2px 0 0; }

.settings-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:20px; }
.loading-msg   { color:var(--text-muted); font-size:13px; padding:16px 0; }

.pref-table { width:100%; border-collapse:collapse; }
.pt-row     { display:grid; grid-template-columns:1fr 100px 160px; align-items:center; padding:14px 0; border-bottom:1px solid var(--border); gap:12px; }
.pt-row:last-child { border-bottom:none; }
.pt-head    { padding-bottom:10px; }
.pt-head .pt-type,
.pt-head .pt-enable,
.pt-head .pt-sound { font-size:11.5px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; }

.pt-type    { display:flex; align-items:flex-start; gap:10px; }
.pt-dot     { width:10px; height:10px; border-radius:50%; flex-shrink:0; margin-top:4px; }
.dot-info    { background:#16a34a; }
.dot-warning { background:#f59e0b; }
.dot-alert   { background:#ef4444; }
.dot-admin   { background:#1e293b; }
.pt-label   { font-size:13.5px; font-weight:600; color:var(--text-primary); }
.pt-hint    { font-size:12px; color:var(--text-muted); margin-top:2px; line-height:1.4; }

.pt-enable  { display:flex; justify-content:center; }
.always-on  { font-size:11.5px; color:var(--text-muted); font-style:italic; }

/* Toggle switch */
.toggle       { position:relative; display:inline-flex; cursor:pointer; }
.toggle input { position:absolute; opacity:0; width:0; height:0; }
.track        { width:38px; height:22px; background:var(--border); border-radius:11px; transition:background 200ms; display:flex; align-items:center; padding:2px; }
.thumb        { width:18px; height:18px; background:#fff; border-radius:50%; box-shadow:0 1px 3px rgba(0,0,0,0.2); transition:transform 200ms; }
.toggle.on .track { background:var(--primary,#3b82f6); }
.toggle.on .thumb { transform:translateX(16px); }

.pt-sound   { }
.sound-select { width:100%; padding:7px 10px; border-radius:8px; border:1px solid var(--border); background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; }
.sound-select:disabled { opacity:.5; cursor:not-allowed; }

.form-actions { display:flex; align-items:center; gap:12px; margin-top:20px; padding-top:16px; border-top:1px solid var(--border); }
.btn-primary  { display:inline-flex; align-items:center; gap:6px; padding:9px 20px; border-radius:8px; background:var(--primary,#3b82f6); color:#fff; font-size:13.5px; font-weight:600; border:none; cursor:pointer; transition:background 120ms,transform 80ms; }
.btn-primary:hover   { background:#2563eb; }
.btn-primary:active  { transform:scale(0.97); }
.btn-primary:disabled{ opacity:.5; cursor:not-allowed; }
.save-ok { font-size:13px; color:#16a34a; }
</style>
