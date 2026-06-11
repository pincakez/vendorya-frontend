<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Misc Settings</h1>
        <p class="page-sub">Platform-wide configuration for the Admin AI and future global knobs.</p>
      </div>
    </div>

    <!-- AI API Key card -->
    <div class="settings-card">
      <div class="card-section-title">
        <BotIcon :size="15" style="flex-shrink:0;" />
        Gemini API Key
      </div>

      <div v-if="loading" class="skeleton-row" style="height:38px;border-radius:8px;max-width:480px;" />
      <template v-else>
        <!-- current key indicator -->
        <div class="key-status-row">
          <span v-if="hasKey" class="status-active" style="font-size:12px;">Key set</span>
          <span v-else class="status-inactive" style="font-size:12px;">No key configured</span>
          <span v-if="maskedKey" class="masked-display">{{ maskedKey }}</span>
        </div>

        <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;max-width:560px;">
          <div style="flex:1;min-width:240px;">
            <label class="form-label">New API Key</label>
            <input
              v-model="newKey"
              class="form-input"
              type="text"
              placeholder="Paste your Gemini API key…"
              autocomplete="off"
              spellcheck="false"
            />
          </div>
          <button
            class="btn-primary"
            :disabled="saving || newKey.trim() === ''"
            @click="saveKey"
          >
            <span v-if="saving">Saving…</span>
            <span v-else>Save</span>
          </button>
        </div>

        <p v-if="saveError" class="field-error" style="margin-top:8px;">{{ saveError }}</p>
        <p v-if="saveSuccess" class="save-ok" style="margin-top:8px;">Key saved successfully.</p>
      </template>
    </div>

    <!-- Model discovery overrides -->
    <div class="settings-card">
      <div class="card-section-title">
        <SlidersHorizontal :size="15" style="flex-shrink:0;" />
        Model Discovery
      </div>
      <p style="font-size:13px;color:var(--text-muted);margin-bottom:16px;line-height:1.5;">
        The model list updates itself from Google every time you Refresh. You normally don't
        touch anything here. These two boxes are just safety overrides — one model id per line.
      </p>

      <div v-if="loading" class="skeleton-row" style="height:80px;border-radius:8px;max-width:480px;" />
      <template v-else>
        <div style="display:flex;flex-direction:column;gap:18px;max-width:520px;">
          <div>
            <label class="form-label">Pin extra models (force-show)</label>
            <textarea
              v-model="extraModels" class="form-input" rows="3" spellcheck="false"
              placeholder="e.g. gemini-3.5-flash"
              style="resize:vertical;font-family:monospace;font-size:13px;"
            />
            <p class="hint-text">Show these even if auto-discovery would skip them (must still exist in Google's list).</p>
          </div>
          <div>
            <label class="form-label">Hide models</label>
            <textarea
              v-model="hiddenModels" class="form-input" rows="3" spellcheck="false"
              placeholder="e.g. gemini-2.0"
              style="resize:vertical;font-family:monospace;font-size:13px;"
            />
            <p class="hint-text">Hide anything whose name contains this text. Hiding always wins over pinning.</p>
          </div>
          <div>
            <button class="btn-primary" :disabled="savingModels" @click="saveModelPrefs">
              <span v-if="savingModels">Saving…</span>
              <span v-else>Save & apply on next Refresh</span>
            </button>
            <p v-if="modelsError" class="field-error" style="margin-top:8px;">{{ modelsError }}</p>
            <p v-if="modelsSaved" class="save-ok" style="margin-top:8px;">Saved. Hit “Refresh” on the AI Profiles page to apply.</p>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { BotIcon, SlidersHorizontal } from 'lucide-vue-next'
import api from '@/api/axios'

const loading    = ref(true)
const saving     = ref(false)
const hasKey     = ref(false)
const maskedKey  = ref('')
const newKey     = ref('')
const saveError  = ref('')
const saveSuccess = ref(false)

const extraModels   = ref('')
const hiddenModels  = ref('')
const savingModels  = ref(false)
const modelsSaved   = ref(false)
const modelsError   = ref('')

async function load() {
  try {
    const { data } = await api.get('/api/admin/ai/settings/')
    hasKey.value       = data.has_key
    maskedKey.value    = data.masked_key
    extraModels.value  = data.extra_models || ''
    hiddenModels.value = data.hidden_models || ''
  } catch {
    // non-fatal — page still usable
  } finally {
    loading.value = false
  }
}

async function saveModelPrefs() {
  modelsError.value = ''
  modelsSaved.value = false
  savingModels.value = true
  try {
    await api.patch('/api/admin/ai/settings/', {
      extra_models:  extraModels.value,
      hidden_models: hiddenModels.value,
    })
    modelsSaved.value = true
  } catch (e) {
    modelsError.value = e.response?.data?.detail || 'Failed to save. Try again.'
  } finally {
    savingModels.value = false
  }
}

async function saveKey() {
  saveError.value   = ''
  saveSuccess.value = false
  saving.value      = true
  try {
    const { data } = await api.patch('/api/admin/ai/settings/', { gemini_api_key: newKey.value.trim() })
    hasKey.value    = data.has_key
    maskedKey.value = data.masked_key
    newKey.value    = ''
    saveSuccess.value = true
  } catch (e) {
    saveError.value = e.response?.data?.detail || 'Failed to save key. Try again.'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.settings-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 22px 24px;
  margin-bottom: 16px;
  max-width: 700px;
}

.card-section-title {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: .05em;
  margin-bottom: 16px;
}

.key-status-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.masked-display {
  font-family: monospace;
  font-size: 13px;
  color: var(--text-muted);
  letter-spacing: .04em;
}

.save-ok {
  font-size: 12.5px;
  color: var(--success, var(--success));
}

.hint-text {
  font-size: 11.5px;
  color: var(--text-muted);
  margin-top: 6px;
  line-height: 1.45;
}

</style>
