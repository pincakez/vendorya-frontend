<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('settings.profile.title') }}</h1>
        <p class="page-sub">{{ t('settings.profile.sub') }}</p>
      </div>
    </div>

    <div class="profile-layout">
      <!-- Avatar card -->
      <div class="avatar-card">
        <div class="avatar-circle" :style="{ background: avatarColor }">
          <img v-if="photoPreview || auth.user?.photo" :src="photoPreview || auth.user.photo" alt="" class="avatar-img" />
          <span v-else class="avatar-initials">{{ auth.initials }}</span>
        </div>
        <label class="btn-photo-upload">
          <Camera :size="13" /> {{ t('settings.profile.change_photo') }}
          <input type="file" accept="image/*" style="display:none;" @change="onPhotoFile" />
        </label>
        <button v-if="photoPreview" class="btn-photo-remove" @click="removePhoto">{{ t('settings.profile.remove') }}</button>
        <div class="avatar-name">{{ auth.displayName }}</div>
        <div class="avatar-role">
          <span class="role-badge" :class="'role-' + (auth.userRole || '').toLowerCase()">{{ auth.userRole }}</span>
        </div>
        <div class="avatar-store">{{ auth.storeName }}</div>
      </div>

      <!-- Form card -->
      <div class="settings-card">
        <div class="section-label">{{ t('settings.profile.personal_info') }}</div>
        <div class="form-grid">
          <div>
            <label class="form-label">{{ t('settings.profile.first_name') }}</label>
            <input v-model="form.first_name" class="form-input" :placeholder="t('settings.profile.first_name_ph')" />
          </div>
          <div>
            <label class="form-label">{{ t('settings.profile.last_name') }}</label>
            <input v-model="form.last_name" class="form-input" :placeholder="t('settings.profile.last_name_ph')" />
          </div>
          <div style="grid-column:1/-1;">
            <label class="form-label">{{ t('settings.profile.email') }}</label>
            <input v-model="form.email" type="email" class="form-input" placeholder="email@example.com" />
          </div>
          <div>
            <label class="form-label">{{ t('settings.profile.phone') }}</label>
            <input v-model="form.phone_number" class="form-input" placeholder="e.g. 01012345678" type="tel" />
          </div>
          <div>
            <label class="form-label">{{ t('settings.profile.whatsapp') }}</label>
            <input v-model="form.whatsapp_number" class="form-input" placeholder="e.g. 01012345678" type="tel" />
          </div>
        </div>

        <div class="section-label" style="margin-top:20px;">{{ t('settings.profile.display_prefs') }}</div>

        <label class="form-label">{{ t('settings.profile.interface_lang') }}</label>
        <p class="pref-hint">{{ t('settings.profile.lang_hint') }}</p>
        <div class="lang-pills">
          <button
            class="lang-pill" :class="{ active: locale === 'en' }"
            @click="setLanguage('en')"
          >English</button>
          <button
            class="lang-pill" :class="{ active: locale === 'ar' }"
            @click="setLanguage('ar')"
          >عربي</button>
        </div>

        <label class="form-label" style="margin-top:16px;">{{ t('settings.profile.symbol_color') }}</label>
        <p class="pref-hint">
          {{ t('settings.profile.symbol_color_hint1') }} <Money :value="1234.5" />.
          {{ t('settings.profile.symbol_color_hint2') }}
        </p>
        <div class="swatch-row">
          <button
            v-for="c in CURRENCY_PRESETS" :key="c"
            class="swatch" :class="{ active: (fmt.symbolColor || '').toLowerCase() === c }"
            :style="{ background: c }" :title="c" @click="pickColor(c)"
          ></button>
          <label class="swatch custom" :style="{ background: fmt.symbolColor }" :title="t('settings.profile.custom_color')">
            <input type="color" :value="fmt.symbolColor" @input="pickColor($event.target.value)" />
            <Palette :size="13" color="#fff" />
          </label>
        </div>

        <div class="section-label" style="margin-top:20px;">{{ t('settings.profile.display_size') }}</div>
        <p class="pref-hint">{{ t('settings.profile.display_size_hint') }}</p>
        <div class="form-grid">
          <div class="ui-pref">
            <label class="form-label">{{ t('settings.profile.ui_scale') }}</label>
            <select class="form-input" v-model.number="ui.ui_scale" @change="onUiChange">
              <option v-for="o in UI_SCALE_OPTS" :key="o.v" :value="o.v">{{ o.label }}</option>
            </select>
            <p class="pref-hint">{{ t('settings.profile.ui_scale_hint') }}</p>
          </div>
          <div class="ui-pref">
            <label class="form-label">{{ t('settings.profile.font_pages') }}</label>
            <select class="form-input" v-model.number="ui.ui_font" @change="onUiChange">
              <option v-for="v in UI_FONT_OPTS" :key="v" :value="v">{{ Math.round(v * 100) }}%</option>
            </select>
            <p class="pref-hint">{{ t('settings.profile.font_pages_hint') }}</p>
          </div>
          <div class="ui-pref">
            <label class="form-label">{{ t('settings.profile.font_tables') }}</label>
            <select class="form-input" v-model.number="ui.table_font" @change="onUiChange">
              <option v-for="v in TABLE_FONT_OPTS" :key="v" :value="v">{{ Math.round(v * 100) }}%</option>
            </select>
            <p class="pref-hint">{{ t('settings.profile.font_tables_hint') }}</p>
          </div>
        </div>

        <div class="section-label" style="margin-top:20px;">{{ t('settings.profile.password_security') }}</div>
        <RouterLink to="/settings/security" class="security-link">
          <span><ShieldCheck :size="15" /> {{ t('settings.profile.change_pw_link') }}</span>
          <ChevronRight :size="16" />
        </RouterLink>

        <div class="form-footer">
          <span v-if="saved" class="saved-msg">{{ t('settings.profile.saved') }}</span>
          <button class="btn-primary" :disabled="saving" @click="save">
            {{ saving ? t('common.saving') : t('settings.profile.save_changes') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { ShieldCheck, ChevronRight, Palette, Camera } from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import { useFormatStore } from '@/stores/format'
import { applyUiPrefs, UI_DEFAULTS } from '@/composables/applyUiPrefs'
import Money from '@/components/ui/Money.vue'
import { useI18n } from 'vue-i18n'

const { locale, t } = useI18n()

async function setLanguage(lang) {
  locale.value = lang
  localStorage.setItem('vendorya_locale', lang)
  try {
    const res = await api.patch('/api/auth/me/', { language: lang })
    auth.setUser({ ...auth.user, ...res.data })
  } catch { /* locale already switched; backend will sync on next login */ }
}

const auth = useAuthStore()
const fmt  = useFormatStore()

const CURRENCY_PRESETS = ['#16a34a', '#22c55e', '#0891b2', '#2563eb', '#f78f1e', '#6b7280']
function pickColor(c) { fmt.setSymbolColor(c) }

// ── Per-user display size (UI scale / font sizes) ──────────────
const UI_SCALE_OPTS   = computed(() => [{ v: 1, label: t('settings.profile.scale_normal') }, { v: 1.25, label: '125%' }, { v: 1.5, label: '150%' }])
const UI_FONT_OPTS    = [0.9, 0.95, 1.0, 1.05, 1.1, 1.2, 1.3]
const TABLE_FONT_OPTS = [0.85, 0.9, 0.95, 1.0, 1.05, 1.1, 1.15]
const ui = reactive({ ...UI_DEFAULTS, ...(auth.user?.ui_prefs || {}) })

let uiSaveTimer = null
function onUiChange() {
  applyUiPrefs(ui)                                 // instant preview
  clearTimeout(uiSaveTimer)
  uiSaveTimer = setTimeout(persistUi, 450)         // debounced save to profile
}
async function persistUi() {
  try {
    const res = await api.patch('/api/auth/me/', { ui_prefs: { ...ui } })
    auth.setUser({ ...auth.user, ...res.data })     // keeps cache + re-applies
  } catch { /* preview stays; next change retries */ }
}

const form = reactive({ first_name: '', last_name: '', email: '', phone_number: '', whatsapp_number: '' })
const saving = ref(false)
const saved  = ref(false)
const photoFile = ref(null)
const photoPreview = ref(null)

const COLORS = ['#2563eb','#7c3aed','#059669','#d97706','#dc2626','#0891b2']
const avatarColor = computed(() => {
  const name = auth.user?.username || 'u'
  let hash = 0
  for (const ch of name) hash = ch.charCodeAt(0) + (hash << 5) - hash
  return COLORS[Math.abs(hash) % COLORS.length]
})

function onPhotoFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  photoFile.value = file
  photoPreview.value = URL.createObjectURL(file)
}
function removePhoto() { photoFile.value = null; photoPreview.value = null }

function loadProfile() {
  form.first_name     = auth.user?.first_name     || ''
  form.last_name      = auth.user?.last_name      || ''
  form.email          = auth.user?.email          || ''
  form.phone_number   = auth.user?.phone_number   || ''
  form.whatsapp_number = auth.user?.whatsapp_number || ''
}

async function save() {
  saving.value = true
  saved.value  = false
  try {
    const fd = new FormData()
    fd.append('first_name',      form.first_name)
    fd.append('last_name',       form.last_name)
    fd.append('email',           form.email)
    fd.append('phone_number',    form.phone_number)
    fd.append('whatsapp_number', form.whatsapp_number)
    if (photoFile.value) fd.append('photo', photoFile.value)
    const res = await api.patch('/api/auth/me/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    auth.user = { ...auth.user, ...res.data }
    photoFile.value = null
    photoPreview.value = null
    saved.value = true
    setTimeout(() => { saved.value = false }, 2500)
  } catch (e) {
    alert(e.response?.data ? JSON.stringify(e.response.data) : t('settings.profile.err_save'))
  } finally { saving.value = false }
}

onMounted(() => loadProfile())
</script>

<style scoped>

.profile-layout { display:grid; grid-template-columns:220px 1fr; gap:20px; align-items:start; }
@media (max-width: 700px) { .profile-layout { grid-template-columns:1fr; } }

.avatar-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:24px 16px; display:flex; flex-direction:column; align-items:center; gap:10px; text-align:center; }
.avatar-circle  { width:80px; height:80px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; overflow:hidden; }
.avatar-img     { width:100%; height:100%; object-fit:cover; }
.avatar-initials{ font-size:26px; font-weight:700; color:#fff; }
.avatar-name    { font-size:15px; font-weight:600; color:var(--text-primary); }
.avatar-role    { margin-top:2px; }
.avatar-store   { font-size:12px; color:var(--text-muted); }

.btn-photo-upload { display:inline-flex; align-items:center; gap:5px; padding:5px 12px; border-radius:7px; font-size:12px; font-weight:600; border:1px solid var(--border); background:var(--bg-app); color:var(--text-primary); cursor:pointer; transition:background 100ms,border-color 100ms; }
.btn-photo-upload:hover { background:var(--accent-soft); border-color:var(--accent); color:var(--accent); }
.btn-photo-remove { background:none; border:none; font-size:11.5px; color:var(--danger); cursor:pointer; padding:0; }
.btn-photo-remove:hover { text-decoration:underline; }

.role-badge  { display:inline-block; padding:2px 9px; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:.04em; text-transform:uppercase; }
.role-owner   { background:#f3e8ff; color:#7c3aed; }
.role-admin   { background:var(--accent-soft); color:var(--accent-hover); }
.role-manager { background:var(--warning-soft); color:var(--warning-hover); }
.role-cashier { background:#f3f4f6; color:#6b7280; }

.settings-card  { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:24px; }
.section-label  { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.07em; color:var(--text-muted); margin-bottom:14px; padding-bottom:8px; border-bottom:1px solid var(--border); }
.form-grid      { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.form-input     { width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; box-sizing:border-box; transition:border-color 120ms; }
.form-input:focus { border-color:var(--accent); }

.saved-msg  { font-size:13px; color:var(--success); font-weight:500; }
.security-link { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:11px 14px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; font-weight:600; text-decoration:none; transition:border-color 120ms, background 120ms; }
.security-link span { display:inline-flex; align-items:center; gap:8px; }
.security-link:hover { border-color:var(--accent); background:var(--bg-card); }

.pref-hint { font-size:12.5px; color:var(--text-muted); margin:0 0 12px; line-height:1.5; }
.lang-pills { display:flex; gap:8px; margin-bottom:4px; }
.lang-pill { padding:6px 18px; border-radius:20px; font-size:13px; font-weight:600; border:1px solid var(--border); background:var(--bg-app); color:var(--text-secondary); cursor:pointer; transition:all 120ms; }
.lang-pill:hover { border-color:var(--accent); color:var(--accent); }
.lang-pill.active { background:var(--accent); border-color:var(--accent); color:#fff; cursor:default; }
.ui-pref select.form-input { cursor:pointer; }
.ui-pref .pref-hint { margin:5px 0 0; font-size:11.5px; }
.swatch-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.swatch { width:30px; height:30px; border-radius:50%; border:2px solid var(--border); cursor:pointer; padding:0; transition:transform 80ms, box-shadow 120ms; position:relative; display:inline-flex; align-items:center; justify-content:center; }
.swatch:hover  { transform:scale(1.08); }
.swatch:active { transform:scale(0.94); }
.swatch.active { box-shadow:0 0 0 2px var(--bg-card), 0 0 0 4px var(--text-primary); }
.swatch.custom input[type="color"] { position:absolute; inset:0; opacity:0; width:100%; height:100%; cursor:pointer; }
.form-footer { display:flex; align-items:center; justify-content:flex-end; gap:12px; margin-top:20px; padding-top:16px; border-top:1px solid var(--border); }

</style>
