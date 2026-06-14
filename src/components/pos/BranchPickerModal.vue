<template>
  <div class="bpm-overlay">
    <div class="bpm-card">
      <div class="bpm-title">{{ t('pos.branch_picker.title') }}</div>
      <div class="bpm-subtitle">{{ t('pos.branch_picker.subtitle') }}</div>

      <div v-if="loading" class="bpm-loading">{{ t('pos.branch_picker.loading') }}</div>
      <div v-else class="bpm-list">
        <button
          v-for="b in branches" :key="b.id"
          class="bpm-branch" :class="{ selected: selected?.id === b.id }"
          @click="selected = b"
        >
          <Building2 :size="18" />
          <span>{{ b.name }}</span>
        </button>
      </div>

      <label v-if="selected" class="bpm-default-label">
        <input type="checkbox" v-model="setDefault" />
        <span>{{ t('pos.branch_picker.set_default') }}</span>
      </label>

      <button class="bpm-confirm" :disabled="!selected" @click="confirm">
        {{ t('pos.branch_picker.open') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Building2 } from 'lucide-vue-next'
import api from '@/api/axios'

const { t } = useI18n()
const emit = defineEmits(['selected'])

const branches   = ref([])
const selected   = ref(null)
const setDefault = ref(false)
const loading    = ref(true)

onMounted(async () => {
  try {
    const res = await api.get('/api/core/branches/')
    branches.value = res.data.results || res.data
    if (branches.value.length === 1) {
      selected.value = branches.value[0]
      confirm()
    }
  } finally {
    loading.value = false
  }
})

async function confirm() {
  if (!selected.value) return
  if (setDefault.value) {
    await api.patch('/api/auth/me/', { default_branch: selected.value.id }).catch(() => {})
  }
  emit('selected', selected.value)
}
</script>

<style scoped>
.bpm-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.6);
  display: flex; align-items: center; justify-content: center; z-index: 9999;
}
.bpm-card {
  background: var(--bg-card); border-radius: 20px; padding: 36px 40px;
  min-width: 360px; max-width: 480px; display: flex; flex-direction: column; gap: 16px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.3);
}
.bpm-title { font-size: 20px; font-weight: 800; color: var(--text-primary); }
.bpm-subtitle { font-size: 13px; color: var(--text-muted); margin-top: -8px; }
.bpm-loading { color: var(--text-muted); text-align: center; padding: 24px; }
.bpm-list { display: flex; flex-direction: column; gap: 8px; }
.bpm-branch {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 18px; border-radius: 12px; border: 2px solid var(--border);
  background: var(--bg-app); cursor: pointer; font-size: 15px; font-weight: 600;
  color: var(--text-primary); transition: border-color 150ms, background 150ms;
}
.bpm-branch:hover { border-color: var(--accent); background: var(--accent-soft); }
.bpm-branch.selected { border-color: var(--accent); background: var(--accent-soft); }
.bpm-default-label {
  display: flex; align-items: center; gap: 10px;
  font-size: 13px; color: var(--text-secondary); cursor: pointer;
}
.bpm-confirm {
  background: var(--accent); color: #fff; border: none; border-radius: 12px;
  padding: 14px; font-size: 15px; font-weight: 700; cursor: pointer;
  transition: opacity 150ms;
}
.bpm-confirm:disabled { opacity: 0.4; cursor: not-allowed; }
.bpm-confirm:not(:disabled):hover { opacity: 0.9; }
</style>
