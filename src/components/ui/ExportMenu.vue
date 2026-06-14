<template>
  <div class="export-wrap" ref="root">
    <button class="export-btn" :disabled="!rows.length" @click="open = !open">
      <Download :size="14" />
      <span>{{ t('common.export') }}</span>
      <ChevronDown :size="13" :class="{ flip: open }" />
    </button>
    <Transition name="export-pop">
      <div v-if="open" class="export-menu">
        <button class="export-item" @click="run('csv')"><FileText :size="14" /> CSV</button>
        <button class="export-item" @click="run('excel')"><Sheet :size="14" /> Excel</button>
        <button class="export-item" @click="run('pdf')"><FileType :size="14" /> PDF</button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Download, ChevronDown, FileText, Sheet, FileType } from 'lucide-vue-next'
import { exportCSV, exportExcel, exportPDF } from '@/composables/useExport'

const { t } = useI18n()

const props = defineProps({
  rows:     { type: Array,  default: () => [] },
  columns:  { type: Array,  required: true },   // [{ key, label, type }]
  filename: { type: String, default: 'report' },
  title:    { type: String, default: 'Report' },
  meta:     { type: String, default: '' },      // e.g. "01 Jan – 31 Jan 2026"
})

const open = ref(false)
const root = ref(null)

async function run(fmt) {
  open.value = false
  if (!props.rows.length) return
  if (fmt === 'csv')   return exportCSV(props.rows, props.columns, props.filename)
  if (fmt === 'excel') return exportExcel(props.rows, props.columns, props.filename)
  if (fmt === 'pdf')   return exportPDF(props.rows, props.columns, props.filename, props.title, props.meta)
}

function onClickOutside(e) {
  if (root.value && !root.value.contains(e.target)) open.value = false
}
onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<style scoped>
.export-wrap { position: relative; display: inline-block; }
.export-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 12px; border-radius: 999px; border: none; cursor: pointer;
  background: var(--success); color: #fff; font-size: 13px; font-weight: 600;
  transition: background 120ms, transform 80ms;
}
.export-btn:hover:not(:disabled) { background: var(--success-hover); }
.export-btn:active:not(:disabled) { transform: scale(.95); }
.export-btn:disabled { opacity: .5; cursor: not-allowed; }
.export-btn svg.flip { transform: rotate(180deg); transition: transform 150ms; }

.export-menu {
  position: absolute; right: 0; top: calc(100% + 6px); z-index: 50;
  min-width: 150px; background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 10px; padding: 6px; box-shadow: 0 8px 24px rgba(0,0,0,.12);
}
.export-item {
  display: flex; align-items: center; gap: 9px; width: 100%;
  padding: 8px 10px; border: none; background: transparent; cursor: pointer;
  color: var(--text-primary); font-size: 13px; border-radius: 7px; text-align: left;
  transition: background 100ms;
}
.export-item:hover { background: var(--bg-app); }

.export-pop-enter-active, .export-pop-leave-active { transition: opacity 120ms, transform 120ms; }
.export-pop-enter-from, .export-pop-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
