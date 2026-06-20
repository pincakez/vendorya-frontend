<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('settings.notif_prefs.title') }}</h1>
        <p class="page-sub">{{ t('settings.notif_prefs.sub') }}</p>
      </div>
    </div>

    <!-- ── MY SOUNDS (every user) ─────────────────────────── -->
    <div class="settings-card">
      <div v-if="loading" class="loading-msg">{{ t('settings.notif_prefs.loading') }}</div>
      <template v-else>
        <div class="pref-table">
          <div class="pt-row pt-head">
            <div class="pt-type">{{ t('settings.notif_prefs.alert_type') }}</div>
            <div class="pt-enable">{{ t('settings.notif_prefs.enable') }}</div>
            <div class="pt-sound">{{ t('settings.notif_prefs.sound') }}</div>
          </div>

          <!-- INFO / WARNING / ALERT -->
          <div v-for="row in rows" :key="row.key" class="pt-row">
            <div class="pt-type">
              <span class="pt-dot" :class="row.dot"></span>
              <div>
                <div class="pt-label">{{ t(row.label) }}</div>
                <div class="pt-hint">{{ t(row.hint) }}</div>
              </div>
            </div>
            <div class="pt-enable">
              <label class="toggle" :class="{ on: prefs[row.enabled] }">
                <input type="checkbox" v-model="prefs[row.enabled]" />
                <span class="track"><span class="thumb"></span></span>
              </label>
            </div>
            <div class="pt-sound pt-sound-row">
              <select v-model="prefs[row.sound]" class="sound-select" :disabled="!prefs[row.enabled]">
                <option v-for="s in soundOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
              </select>
              <button class="preview-btn" :disabled="!prefs[row.enabled] || prefs[row.sound] === 'mute'"
                      :title="t('settings.notif_prefs.preview')" @click="preview(prefs[row.sound])">
                <Play :size="14" />
              </button>
            </div>
          </div>

          <!-- ADMIN — read-only (sudo controls it below) -->
          <div class="pt-row">
            <div class="pt-type">
              <span class="pt-dot dot-admin"></span>
              <div>
                <div class="pt-label">{{ t('settings.notif_prefs.admin_label') }}</div>
                <div class="pt-hint">{{ t('settings.notif_prefs.admin_managed') }}</div>
              </div>
            </div>
            <div class="pt-enable">
              <span class="always-on">{{ t('settings.notif_prefs.always_on') }}</span>
            </div>
            <div class="pt-sound pt-sound-row">
              <span class="locked-sound">{{ soundLabel(prefs.admin_sound) }} <Lock :size="12" /></span>
              <button class="preview-btn" :disabled="prefs.admin_sound === 'mute'"
                      :title="t('settings.notif_prefs.preview')" @click="preview(prefs.admin_sound)">
                <Play :size="14" />
              </button>
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

    <!-- ── STORE DEFAULTS (owner / admin) ─────────────────── -->
    <div v-if="canManageStore" class="settings-card section-card">
      <div class="section-head">
        <h2 class="section-title">{{ t('settings.notif_prefs.defaults_title') }}</h2>
        <p class="section-sub">{{ t('settings.notif_prefs.defaults_sub') }}</p>
      </div>
      <div class="def-grid">
        <div v-for="row in rows" :key="'def-' + row.key" class="def-item">
          <label class="form-label">{{ t(row.label) }}</label>
          <div class="pt-sound-row">
            <select v-model="storeDefaults[row.defKey]" class="sound-select">
              <option v-for="s in soundOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
            </select>
            <button class="preview-btn" :disabled="storeDefaults[row.defKey] === 'mute'"
                    :title="t('settings.notif_prefs.preview')" @click="preview(storeDefaults[row.defKey])">
              <Play :size="14" />
            </button>
          </div>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" :disabled="savingDefaults" @click="saveDefaults">
          {{ savingDefaults ? t('common.saving') : t('settings.notif_prefs.save_defaults') }}
        </button>
        <span v-if="savedDefaults" class="save-ok">{{ t('settings.notif_prefs.saved') }}</span>
      </div>
    </div>

    <!-- ── ADMIN MESSAGE SOUND (sudo only) ────────────────── -->
    <div v-if="isSudo" class="settings-card section-card section-sudo">
      <div class="section-head">
        <h2 class="section-title">{{ t('settings.notif_prefs.sudo_title') }}</h2>
        <p class="section-sub">{{ t('settings.notif_prefs.sudo_sub') }}</p>
      </div>
      <div class="def-item def-item--single">
        <label class="form-label">{{ t('settings.notif_prefs.admin_label') }}</label>
        <div class="pt-sound-row">
          <select v-model="adminSound" class="sound-select">
            <option v-for="s in soundOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
          <button class="preview-btn" :disabled="adminSound === 'mute'"
                  :title="t('settings.notif_prefs.preview')" @click="preview(adminSound)">
            <Play :size="14" />
          </button>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" :disabled="savingAdmin" @click="saveAdminSound">
          {{ savingAdmin ? t('common.saving') : t('settings.notif_prefs.save_admin') }}
        </button>
        <span v-if="savedAdmin" class="save-ok">{{ t('settings.notif_prefs.saved') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Play, Lock } from 'lucide-vue-next'
import api from '@/api/axios'
import { playSound } from '@/utils/sound'
import { useAuthStore } from '@/stores/auth'

const { t } = useI18n()
const auth = useAuthStore()
const isSudo = computed(() => auth.isSuperadmin)
const canManageStore = computed(() => ['OWNER', 'ADMIN'].includes(auth.userRole) && !!auth.user?.store)

const loading = ref(true)
const saving  = ref(false)
const saved   = ref(false)

const rows = [
  { key: 'info',    dot: 'dot-info',    label: 'settings.notif_prefs.info_label',    hint: 'settings.notif_prefs.info_hint',    enabled: 'info_enabled',    sound: 'info_sound',    defKey: 'default_info_sound' },
  { key: 'warning', dot: 'dot-warning', label: 'settings.notif_prefs.warning_label', hint: 'settings.notif_prefs.warning_hint', enabled: 'warning_enabled', sound: 'warning_sound', defKey: 'default_warning_sound' },
  { key: 'alert',   dot: 'dot-alert',   label: 'settings.notif_prefs.alert_label',   hint: 'settings.notif_prefs.alert_hint',   enabled: 'alert_enabled',   sound: 'alert_sound',   defKey: 'default_alert_sound' },
]

const prefs = ref({
  info_enabled: true, warning_enabled: true, alert_enabled: true,
  info_sound: 's01', warning_sound: 's02', alert_sound: 's03', admin_sound: 's01',
})

const storeDefaults = ref({ default_info_sound: 's01', default_warning_sound: 's02', default_alert_sound: 's03' })
const adminSound = ref('s01')

const soundOptions = computed(() => [
  { value: 'mute', label: t('settings.notif_prefs.mute') },
  ...Array.from({ length: 10 }, (_, i) => ({
    value: `s${String(i + 1).padStart(2, '0')}`,
    label: t('settings.notif_prefs.sound_n', { n: String(i + 1).padStart(2, '0') }),
  })),
])
function soundLabel(v) {
  return soundOptions.value.find(s => s.value === v)?.label || v
}
function preview(v) { playSound(v) }

async function load() {
  try {
    const res = await api.get('/api/notifications/preferences/')
    Object.assign(prefs.value, res.data)
  } catch {}
  if (canManageStore.value) {
    try {
      const res = await api.get('/api/core/settings/')
      storeDefaults.value = {
        default_info_sound:    res.data.default_info_sound    || 's01',
        default_warning_sound: res.data.default_warning_sound || 's02',
        default_alert_sound:   res.data.default_alert_sound   || 's03',
      }
    } catch {}
  }
  if (isSudo.value) {
    try {
      const res = await api.get('/api/notifications/admin-sound/')
      adminSound.value = res.data.admin_sound
    } catch {}
  }
  loading.value = false
}

async function save() {
  saving.value = true
  try {
    await api.put('/api/notifications/preferences/', prefs.value)
    saved.value = true; setTimeout(() => { saved.value = false }, 2000)
  } catch {}
  saving.value = false
}

const savingDefaults = ref(false)
const savedDefaults  = ref(false)
async function saveDefaults() {
  savingDefaults.value = true
  try {
    await api.patch('/api/core/settings/', storeDefaults.value)
    savedDefaults.value = true; setTimeout(() => { savedDefaults.value = false }, 2000)
  } catch {}
  savingDefaults.value = false
}

const savingAdmin = ref(false)
const savedAdmin  = ref(false)
async function saveAdminSound() {
  savingAdmin.value = true
  try {
    const res = await api.put('/api/notifications/admin-sound/', { admin_sound: adminSound.value })
    adminSound.value = res.data.admin_sound
    prefs.value.admin_sound = res.data.admin_sound   // reflect in the read-only row above
    savedAdmin.value = true; setTimeout(() => { savedAdmin.value = false }, 2000)
  } catch {}
  savingAdmin.value = false
}

onMounted(load)
</script>

<style scoped>
.settings-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:20px; }
.section-card  { margin-top:18px; }
.section-head  { margin-bottom:16px; }
.section-title { font-size:15px; font-weight:700; color:var(--text-primary); margin:0; }
.section-sub   { font-size:12.5px; color:var(--text-muted); margin:4px 0 0; line-height:1.5; }
.section-sudo  { border-color:color-mix(in oklab, var(--admin-accent, #ef4444) 35%, var(--border)); }
.loading-msg   { color:var(--text-muted); font-size:13px; padding:16px 0; }

.pref-table { width:100%; }
.pt-row     { display:grid; grid-template-columns:1fr 100px 210px; align-items:center; padding:14px 0; border-bottom:1px solid var(--border); gap:12px; }
.pt-row:last-child { border-bottom:none; }
.pt-head    { padding-bottom:10px; }
.pt-head .pt-type, .pt-head .pt-enable, .pt-head .pt-sound { font-size:11.5px; font-weight:700; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em; }

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

.toggle       { position:relative; display:inline-flex; cursor:pointer; }
.toggle input { position:absolute; opacity:0; width:0; height:0; }
.track        { width:38px; height:22px; background:var(--border); border-radius:11px; transition:background 200ms; display:flex; align-items:center; padding:2px; }
.thumb        { width:18px; height:18px; background:#fff; border-radius:50%; box-shadow:0 1px 3px rgba(0,0,0,0.2); transition:transform 200ms; }
.toggle.on .track { background:var(--primary,var(--accent)); }
.toggle.on .thumb { transform:translateX(16px); }

.pt-sound-row { display:flex; align-items:center; gap:8px; }
.sound-select { flex:1; padding:7px 10px; border-radius:8px; border:1px solid var(--border); background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; }
.sound-select:disabled { opacity:.5; cursor:not-allowed; }
.locked-sound { flex:1; display:inline-flex; align-items:center; gap:6px; font-size:13px; color:var(--text-muted); }

.preview-btn {
  flex-shrink:0; width:32px; height:32px; border-radius:8px; border:1px solid var(--border);
  background:var(--bg-app); color:var(--accent); cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  transition:background 120ms var(--ease-out), transform var(--press-back, 200ms) var(--ease-spring, ease);
}
.preview-btn:hover:not(:disabled) { background:var(--accent-soft); }
.preview-btn:active:not(:disabled) { transform:scale(.9); }
.preview-btn:disabled { opacity:.4; cursor:not-allowed; }

.def-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:16px; }
@media (max-width:640px) { .def-grid { grid-template-columns:1fr; } }
.def-item--single { max-width:320px; }
.form-label { display:block; font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:6px; }

.form-actions { display:flex; align-items:center; gap:12px; margin-top:20px; padding-top:16px; border-top:1px solid var(--border); }
.save-ok { font-size:13px; color:var(--success); }
</style>
