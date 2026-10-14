<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('settings.export.title') }}</h1>
        <p class="page-sub">{{ t('settings.export.sub') }}</p>
      </div>
    </div>

    <BaseCard padding="lg" class="export-card">
      <div class="export-icon"><Archive :size="22" /></div>
      <div class="export-body">
        <h2 class="export-title">{{ t('settings.export.card_title') }}</h2>
        <p class="export-desc">{{ t('settings.export.card_desc') }}</p>
        <p class="export-note">{{ t('settings.export.files_note') }}</p>
        <p class="export-note"><Lock :size="12" class="note-icon" />{{ t('settings.export.privacy') }}</p>

        <div class="export-actions">
          <BaseButton :loading="busy" @click="download">
            <Download :size="14" /> {{ t('settings.export.button') }}
          </BaseButton>
          <span v-if="busy" class="export-status">{{ t('settings.export.preparing') }}</span>
          <span v-else-if="message" :class="['export-status', { 'is-error': isError }]">{{ message }}</span>
        </div>
      </div>
    </BaseCard>
  </div>
</template>

<script setup>
// Owner-only (route meta.minRole 'OWNER' = core.shop_export.ShopExportViewSet role_map) — s167.
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Archive, Download, Lock } from 'lucide-vue-next'
import api from '@/api/axios'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseButton from '@/components/base/BaseButton.vue'

const { t } = useI18n()
const busy = ref(false)
const message = ref('')
const isError = ref(false)

function filenameFrom(res) {
  const cd = res.headers?.['content-disposition'] || ''
  const m = cd.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i)
  return m ? decodeURIComponent(m[1]) : 'vendorya-export.zip'
}

async function download() {
  busy.value = true; message.value = ''; isError.value = false
  try {
    const res = await api.get('/api/core/shop-export/', { responseType: 'blob' })
    const url = URL.createObjectURL(res.data)
    const a = document.createElement('a')
    a.href = url; a.download = filenameFrom(res)
    document.body.appendChild(a); a.click(); a.remove()
    URL.revokeObjectURL(url)
    message.value = t('settings.export.done')
  } catch (e) {
    isError.value = true
    message.value = e.response?.status === 429 ? t('settings.export.err_throttled') : t('settings.export.err_generic')
  } finally { busy.value = false }
}
</script>

<style scoped>
.export-card { display: flex; gap: 18px; align-items: flex-start; max-width: 720px; }
.export-icon {
  flex-shrink: 0; width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  background: var(--accent-soft); color: var(--accent);
}
.export-body { flex: 1; min-width: 0; }
.export-title { font-size: 15px; font-weight: 700; color: var(--text-primary); margin: 0 0 6px; }
.export-desc { font-size: 13px; color: var(--text-secondary); margin: 0 0 10px; line-height: 1.5; }
.export-note { font-size: 12px; color: var(--text-muted); margin: 0 0 4px; display: flex; align-items: center; gap: 6px; }
.note-icon { flex-shrink: 0; }
.export-actions { display: flex; align-items: center; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
.export-status { font-size: 12px; color: var(--text-muted); }
.export-status.is-error { color: var(--danger); }
</style>
