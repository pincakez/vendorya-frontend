<template>
  <div class="label-page">
    <!-- Screen toolbar — hidden when printing -->
    <div class="print-toolbar no-print">
      <button class="tb-btn" @click="goBack"><ArrowLeft :size="15" /> {{ t('inventory.labels.back') }}</button>
      <div class="tb-info">
        <span class="tb-title">{{ t('inventory.labels.page_title') }}</span>
        <span class="tb-meta" data-testid="label-meta">{{ t('inventory.labels.page_meta', { n: totalLabels, w: preset.width_mm, h: preset.height_mm }, totalLabels) }}</span>
      </div>
      <!-- s167: a big job (2,000+ stickers) is shown + printed one batch at a time -->
      <div v-if="batchCount > 1" class="tb-batch">
        <button class="tb-btn" :disabled="batchIdx === 0" @click="batchIdx--"><ChevronLeft :size="15" /></button>
        <span class="tb-meta" data-testid="label-batch">{{ t('inventory.labels.batch', { i: batchIdx + 1, n: batchCount, from: batchFrom + 1, to: batchTo }) }}</span>
        <button class="tb-btn" :disabled="batchIdx >= batchCount - 1" @click="batchIdx++"><ChevronRight :size="15" /></button>
      </div>
      <button class="tb-btn primary" :disabled="printing" @click="doPrint">
        <Printer :size="15" /> {{ printing ? t('inventory.labels.sending') : (batchCount > 1 ? t('inventory.labels.print_batch') : t('inventory.purchases.print_btn')) }}
      </button>
    </div>

    <div v-if="!job" class="no-job no-print">
      {{ t('inventory.labels.no_job') }}
    </div>

    <!-- Label sheet -->
    <div v-else class="label-sheet">
      <div
        v-for="(label, i) in flatLabels"
        :key="batchIdx + '-' + i"
        class="label-card"
        :style="labelStyle"
      >
        <div v-if="preset.show_store_name" class="lbl-store">{{ label.store_name }}</div>
        <div v-if="preset.show_product_name" class="lbl-name">{{ label.product_name }}</div>
        <!-- s168 Upgrade 9: the category's specs on one line, when the preset (or this print) asks for it -->
        <div v-if="preset.show_specs && label.specs" class="lbl-name lbl-specs" data-testid="label-specs">{{ label.specs }}</div>
        <svg v-if="preset.show_barcode" :ref="el => { if (el) barcodeSvgs[i] = el }" class="lbl-barcode" />
        <div v-if="preset.show_sku || preset.show_price" class="lbl-footer">
          <span v-if="preset.show_sku" class="lbl-sku">{{ label.sku }}</span>
          <span v-if="label.sku2" class="lbl-sku">{{ label.sku2 }}</span>
          <span v-if="preset.show_price" class="lbl-price">{{ fmtPrice(label.sell_price) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft, Printer, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import JsBarcode from 'jsbarcode'
import { useLabelsStore, LABEL_BATCH } from '@/stores/labels'
import { useFormatStore } from '@/stores/format'
import { useQZTray } from '@/composables/useQZTray'
import api from '@/api/axios'

const { t } = useI18n()
const router = useRouter()
const labelsStore = useLabelsStore()
const fmt = useFormatStore()
const { sendRaw, isAvailable } = useQZTray()

const printing = ref(false)
const labelPrinterName = ref('')

const job    = computed(() => labelsStore.job)
const preset = computed(() => job.value?.preset ?? {})

const barcodeSvgs = ref([])

const labelCount = item => Math.max(1, Math.round(Number(item.quantity) || 0))

const totalLabels = computed(() =>
  job.value ? job.value.items.reduce((s, item) => s + labelCount(item), 0) : 0)

// s167: never put more than LABEL_BATCH stickers (each with an SVG barcode) on the page at once.
const batchIdx   = ref(0)
const batchCount = computed(() => Math.max(1, Math.ceil(totalLabels.value / LABEL_BATCH)))
const batchFrom  = computed(() => batchIdx.value * LABEL_BATCH)
const batchTo    = computed(() => Math.min(totalLabels.value, batchFrom.value + LABEL_BATCH))

// Expand each item by its quantity into individual label objects — only the current batch is built.
const flatLabels = computed(() => {
  if (!job.value) return []
  const from = batchFrom.value, to = batchTo.value
  const out = []
  let pos = 0
  for (const item of job.value.items) {
    const count = labelCount(item)
    if (pos + count <= from) { pos += count; continue }
    for (let n = 0; n < count && pos < to; n++, pos++) {
      if (pos >= from) out.push({ ...item, store_name: job.value.store_name })
    }
    if (pos >= to) break
  }
  return out
})

const labelStyle = computed(() => {
  const p = preset.value
  return {
    width:  `${p.width_mm  ?? 40}mm`,
    height: `${p.height_mm ?? 20}mm`,
  }
})

function fmtPrice(val) {
  const n = parseFloat(val) || 0
  return `${n.toFixed(2)} ${fmt.symbol ?? 'EGP'}`
}

function goBack() { router.back() }

function buildTSPL(labels, storeName) {
  let out = 'SIZE 50 mm, 25 mm\r\nGAP 2 mm, 0 mm\r\nDIRECTION 1\r\n'
  for (const label of labels) {
    // Same shop currency symbol as the on-screen label (fmtPrice) — not a hard-coded EGP.
    const price = fmtPrice(label.sell_price).trim().replace(/"/g, '')
    const sku   = (label.barcode || label.sku || '').replace(/"/g, '')
    const store = (storeName || '').replace(/"/g, '')
    out += `CLS\r\n`
    out += `TEXT 400,20,"ROMAN.TTF",0,1,1,"${store}"\r\n`
    out += `BARCODE 400,60,"128",80,1,0,2,2,"${sku}"\r\n`
    out += `TEXT 400,160,"ROMAN.TTF",0,1,1,"${price}"\r\n`
    if (label.sku2) out += `TEXT 20,160,"ROMAN.TTF",0,1,1,"${String(label.sku2).replace(/"/g, '')}"\r\n`
    out += `PRINT 1,1\r\n`
  }
  return out
}

async function doPrint() {
  if (!job.value || printing.value) return
  printing.value = true
  try {
    const available = await isAvailable()
    if (available && labelPrinterName.value) {
      const tspl = buildTSPL(flatLabels.value, job.value.store_name)
      await sendRaw(labelPrinterName.value, tspl)
    } else {
      if (!available) {
        alert('QZ Tray is not running. Falling back to browser print.\nInstall QZ Tray for direct silent printing.')
      } else if (!labelPrinterName.value) {
        alert('No label printer configured. Set the "Label Printer Name" in Settings → Service Types.\nFalling back to browser print.')
      }
      window.print()
    }
  } catch (err) {
    alert('Print error: ' + (err.message || err))
  } finally {
    printing.value = false
  }
}

// Draw the barcodes of the batch on screen (the template's ref callback keeps barcodeSvgs[i] current).
async function renderBarcodes() {
  await nextTick()
  if (!preset.value.show_barcode) return
  flatLabels.value.forEach((label, i) => {
    const el = barcodeSvgs.value[i]
    if (!el) return
    try {
      JsBarcode(el, label.barcode || label.sku, {
        format:       'CODE128',
        displayValue: false,
        margin:       1,
        height:       Math.max(12, (preset.value.height_mm ?? 20) * 1.5),
        width:        1.2,
      })
    } catch {
      // barcode value was empty or invalid — skip silently
    }
  })
}

watch(batchIdx, () => { renderBarcodes(); window.scrollTo(0, 0) })

onMounted(() => {
  // Load printer name from store settings (non-blocking — screen still renders)
  api.get('/api/core/settings/').then(r => {
    labelPrinterName.value = r.data.label_printer_name || ''
  }).catch(() => {})
  renderBarcodes()
})
</script>

<style scoped>
.label-page { min-height: 100vh; background: #f1f5f9; }

/* ── Screen toolbar ── */
.print-toolbar {
  position: sticky; top: 0; z-index: 5;
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  padding: 12px 18px;
  background: #fff; border-bottom: 1px solid #e2e8f0;
}
.tb-info   { display: flex; flex-direction: column; align-items: center; }
.tb-title  { font-size: 14px; font-weight: 700; color: #0f172a; }
.tb-meta   { font-size: 12px; color: #64748b; }
.tb-batch  { display: flex; align-items: center; gap: 8px; }
.tb-btn:disabled { opacity: .45; cursor: default; }
.tb-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 600;
  border: 1px solid #e2e8f0; background: #fff; color: #0f172a;
  cursor: pointer; transition: transform 70ms;
}
.tb-btn:active  { transform: scale(0.95); }
.tb-btn.primary { background: var(--accent); border-color: var(--accent); color: #fff; }

.no-job {
  max-width: 500px; margin: 80px auto; text-align: center;
  font-size: 14px; color: #94a3b8; line-height: 1.6;
}

/* ── Label sheet ── */
.label-sheet {
  display: flex; flex-wrap: wrap; gap: 0;
  padding: 8mm;
  background: #fff;
}

.label-card {
  display: flex; flex-direction: column; justify-content: center; align-items: center;
  padding: 1.5mm 2mm;
  border: 0.3mm dashed #cbd5e1; /* visible on screen only */
  box-sizing: border-box;
  overflow: hidden;
  page-break-inside: avoid;
  break-inside: avoid;
}

.lbl-store  { font-size: 5.5pt; font-weight: 700; text-transform: uppercase; color: #475569; letter-spacing: .04em; }
.lbl-name   { font-size: 6.5pt; font-weight: 600; text-align: center; line-height: 1.2; color: #0f172a; max-width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lbl-specs  { font-size: 5pt; font-weight: 500; }
.lbl-barcode { width: 100%; max-height: 40%; }
.lbl-footer { display: flex; justify-content: space-between; width: 100%; gap: 4px; }
.lbl-sku    { font-size: 5pt; color: #64748b; font-family: monospace; }
.lbl-price  { font-size: 6.5pt; font-weight: 700; color: #0f172a; white-space: nowrap; }

/* ── Print ── */
@media print {
  .no-print    { display: none !important; }
  .label-page  { background: #fff; }
  .label-sheet { padding: 0; }
  .label-card  { border: none; }
}
</style>
