<template>
  <div class="label-page">
    <!-- Screen toolbar — hidden when printing -->
    <div class="print-toolbar no-print">
      <button class="tb-btn" @click="goBack"><ArrowLeft :size="15" /> Back</button>
      <div class="tb-info">
        <span class="tb-title">Label Print</span>
        <span class="tb-meta">{{ totalLabels }} label{{ totalLabels !== 1 ? 's' : '' }} · {{ preset.width_mm }}×{{ preset.height_mm }} mm</span>
      </div>
      <button class="tb-btn primary" @click="window.print()"><Printer :size="15" /> Print</button>
    </div>

    <div v-if="!job" class="no-job no-print">
      No label job loaded. Go back to a purchase and click "Print Labels".
    </div>

    <!-- Label sheet -->
    <div v-else class="label-sheet">
      <div
        v-for="(label, i) in flatLabels"
        :key="i"
        class="label-card"
        :style="labelStyle"
      >
        <div v-if="preset.show_store_name" class="lbl-store">{{ label.store_name }}</div>
        <div v-if="preset.show_product_name" class="lbl-name">{{ label.product_name }}</div>
        <svg v-if="preset.show_barcode" :ref="el => { if (el) barcodeSvgs[i] = el }" class="lbl-barcode" />
        <div v-if="preset.show_sku || preset.show_price" class="lbl-footer">
          <span v-if="preset.show_sku" class="lbl-sku">{{ label.sku }}</span>
          <span v-if="preset.show_price" class="lbl-price">{{ fmtPrice(label.sell_price) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, Printer } from 'lucide-vue-next'
import JsBarcode from 'jsbarcode'
import { useLabelsStore } from '@/stores/labels'
import { useFormatStore } from '@/stores/format'

const router = useRouter()
const labelsStore = useLabelsStore()
const fmt = useFormatStore()

const job    = computed(() => labelsStore.job)
const preset = computed(() => job.value?.preset ?? {})

const barcodeSvgs = ref([])

// Expand each item by its quantity into individual label objects
const flatLabels = computed(() => {
  if (!job.value) return []
  const out = []
  for (const item of job.value.items) {
    const count = Math.max(1, Math.round(item.quantity))
    for (let n = 0; n < count; n++) {
      out.push({ ...item, store_name: job.value.store_name })
    }
  }
  return out
})

const totalLabels = computed(() => flatLabels.value.length)

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

onMounted(async () => {
  await nextTick()
  if (!preset.value.show_barcode) return
  flatLabels.value.forEach((label, i) => {
    const el = barcodeSvgs.value[i]
    if (!el) return
    try {
      JsBarcode(el, label.barcode || label.sku, {
        format:      'CODE128',
        displayValue: false,
        margin:       1,
        height:       Math.max(12, (preset.value.height_mm ?? 20) * 1.5),
        width:        1.2,
      })
    } catch {
      // barcode value was empty or invalid — skip silently
    }
  })
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
.tb-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: 8px; font-size: 13px; font-weight: 600;
  border: 1px solid #e2e8f0; background: #fff; color: #0f172a;
  cursor: pointer; transition: transform 70ms;
}
.tb-btn:active  { transform: scale(0.95); }
.tb-btn.primary { background: #f78f1e; border-color: #f78f1e; color: #fff; }

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
