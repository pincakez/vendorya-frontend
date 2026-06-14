<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('settings.notif_prefs.title') }}</h1>
        <p class="page-sub">{{ t('settings.notif_prefs.sub') }}</p>
      </div>
    </div>

    <div class="settings-card">
      <div v-if="loading" class="loading-msg">{{ t('settings.notif_prefs.loading') }}</div>
      <template v-else>

        <div class="pref-table">
          <!-- Header -->
          <div class="pt-row pt-head">
            <div class="pt-type">{{ t('settings.notif_prefs.alert_type') }}</div>
            <div class="pt-enable">{{ t('settings.notif_prefs.enable') }}</div>
            <div class="pt-sound">{{ t('settings.notif_prefs.sound') }}</div>
          </div>

          <!-- INFO -->
          <div class="pt-row">
            <div class="pt-type">
              <span class="pt-dot dot-info"></span>
              <div>
                <div class="pt-label">{{ t('settings.notif_prefs.info_label') }}</div>
                <div class="pt-hint">{{ t('settings.notif_prefs.info_hint') }}</div>
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
                <div class="pt-label">{{ t('settings.notif_prefs.warning_label') }}</div>
                <div class="pt-hint">{{ t('settings.notif_prefs.warning_hint') }}</div>
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
                <div class="pt-label">{{ t('settings.notif_prefs.alert_label') }}</div>
                <div class="pt-hint">{{ t('settings.notif_prefs.alert_hint') }}</div>
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
                <div class="pt-label">{{ t('settings.notif_prefs.admin_label') }}</div>
                <div class="pt-hint">{{ t('settings.notif_prefs.admin_hint') }}</div>
              </div>
            </div>
            <div class="pt-enable">
              <span class="always-on">{{ t('settings.notif_prefs.always_on') }}</span>
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
            {{ saving ? t('common.saving') : t('settings.notif_prefs.save_btn') }}
          </button>
          <span v-if="saved" class="save-ok">{{ t('settings.notif_prefs.saved') }}</span>
        </div>

      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/api/axios'

const { t } = useI18n()
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

const soundOptions = computed(() => [
  { value: 'mute', label: t('settings.notif_prefs.mute') },
  ...Array.from({ length: 10 }, (_, i) => ({
    value: `s${String(i + 1).padStart(2, '0')}`,
    label: t('settings.notif_prefs.sound_n', { n: String(i + 1).padStart(2, '0') }),
  })),
])

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
.dot-info    { background:var(--success); }
.dot-warning { background:var(--warning); }
.dot-alert   { background:var(--danger); }
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
.toggle.on .track { background:var(--primary,var(--accent)); }
.toggle.on .thumb { transform:translateX(16px); }

.pt-sound   { }
.sound-select { width:100%; padding:7px 10px; border-radius:8px; border:1px solid var(--border); background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; }
.sound-select:disabled { opacity:.5; cursor:not-allowed; }

.form-actions { display:flex; align-items:center; gap:12px; margin-top:20px; padding-top:16px; border-top:1px solid var(--border); }
.save-ok { font-size:13px; color:var(--success); }
</style>
