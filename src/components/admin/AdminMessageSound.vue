<template>
  <!-- s168: the sudo-only "Admin message sound" card, moved here from the shop page settings/notifications
       (since s163 sudo is sent to /admin/* and could no longer reach it). Every shop hears this sound for admin notes. -->
  <div class="card sound-card">
    <div class="card-title">{{ t('settings.notif_prefs.sudo_title') }}</div>
    <p class="sound-sub">{{ t('settings.notif_prefs.sudo_sub') }}</p>
    <label class="form-label">{{ t('settings.notif_prefs.admin_label') }}</label>
    <div class="sound-row">
      <select v-model="adminSound" class="sound-select" :disabled="loading">
        <option v-for="s in soundOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
      </select>
      <button class="preview-btn" :disabled="adminSound === 'mute'"
              :title="t('settings.notif_prefs.preview')" @click="playSound(adminSound)">
        <Play :size="14" />
      </button>
      <button class="btn-primary" :disabled="saving || loading" @click="save">
        {{ saving ? t('common.saving') : t('settings.notif_prefs.save_admin') }}
      </button>
      <span v-if="saved" class="save-ok">{{ t('settings.notif_prefs.saved') }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Play } from 'lucide-vue-next'
import api from '@/api/axios'
import { playSound } from '@/utils/sound'

const { t } = useI18n()
const adminSound = ref('s01')
const loading = ref(true)
const saving  = ref(false)
const saved   = ref(false)

const soundOptions = computed(() => [
  { value: 'mute', label: t('settings.notif_prefs.mute') },
  ...Array.from({ length: 10 }, (_, i) => ({
    value: `s${String(i + 1).padStart(2, '0')}`,
    label: t('settings.notif_prefs.sound_n', { n: String(i + 1).padStart(2, '0') }),
  })),
])

async function save() {
  saving.value = true
  try {
    const res = await api.put('/api/notifications/admin-sound/', { admin_sound: adminSound.value })
    adminSound.value = res.data.admin_sound
    saved.value = true; setTimeout(() => { saved.value = false }, 2000)
  } catch {}
  saving.value = false
}

onMounted(async () => {
  try {
    const res = await api.get('/api/notifications/admin-sound/')
    adminSound.value = res.data.admin_sound
  } catch {}
  loading.value = false
})
</script>

<style scoped>
.card       { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:20px; margin-bottom:20px; }
.card-title { font-size:15px; font-weight:700; color:var(--text-primary); margin-bottom:4px; }
.sound-sub  { font-size:12.5px; color:var(--text-muted); margin:0 0 14px; line-height:1.5; }
.form-label { display:block; font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:6px; }
.sound-row  { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
.sound-select { min-width:200px; padding:7px 10px; border-radius:8px; border:1px solid var(--border); background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; }
.preview-btn {
  flex-shrink:0; width:32px; height:32px; border-radius:8px; border:1px solid var(--border);
  background:var(--bg-app); color:var(--accent); cursor:pointer;
  display:flex; align-items:center; justify-content:center;
}
.preview-btn:hover:not(:disabled) { background:var(--accent-soft); }
.preview-btn:disabled { opacity:.4; cursor:not-allowed; }
.save-ok { font-size:13px; color:var(--success); }
</style>
