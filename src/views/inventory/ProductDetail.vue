<template>
  <div>
    <!-- ── PAGE HEADER ── -->
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="$router.back()">
          <ChevronLeft :size="16" /> {{ t('common.back') }}
        </button>
        <div v-if="product">
          <h1 class="page-title">{{ product.name }}</h1>
          <p class="page-sub">
            <span v-if="product.category_name">{{ product.category_name }} · </span>
            {{ product.product_type }}
          </p>
        </div>
        <div v-else class="page-title">{{ t('inventory.product_detail.product_fallback') }}</div>
      </div>
      <div v-if="product" style="display:flex;gap:8px;align-items:center;">
        <!-- Edit Product button -->
        <button class="edit-prod-btn" @click="openEditModal" :title="t('inventory.product_detail.edit_product_btn')">
          <Pencil :size="14" /> {{ t('inventory.product_detail.edit_product_btn') }}
        </button>
        <!-- Secret S button — reveals cost/supplier panel -->
        <button class="s-btn" :class="{ active: showSecret }" @click="showSecret = !showSecret" :title="t('inventory.product_detail.show_cost_title')">S</button>
      </div>
    </div>

    <div v-if="loading" class="skeleton-block" />
    <div v-else-if="!product" class="empty-state">{{ t('inventory.product_detail.product_not_found') }}</div>
    <div v-else class="showcase-layout">

      <!-- ══ LEFT: SHOWCASE GALLERY ══ -->
      <div class="showcase-panel">
        <!-- HERO: video (natural aspect) or current slideshow image (fixed frame, center-cropped) -->
        <div class="sc-hero" :class="{ 'is-video': activeIsVideo }" :style="heroStyle">
          <template v-if="activeIsVideo">
            <video ref="heroVideo" :src="videoMedia.file_url" :poster="videoMedia.poster_url || ''"
                   class="sc-video" muted loop playsinline preload="metadata"
                   @click="toggleMute" @volumechange="onVolChange" />
            <button class="sc-mute" @click.stop="toggleMute"
                    :title="muted ? t('inventory.product_detail.showcase.unmute') : t('inventory.product_detail.showcase.mute')">
              <VolumeX v-if="muted" :size="15" /><Volume2 v-else :size="15" />
            </button>
          </template>
          <img v-else-if="currentImage" :src="currentImage.file_url" class="sc-img" alt="" />
          <div v-else class="sc-empty">
            <ImageIcon :size="38" />
            <span>{{ t('inventory.product_detail.showcase.empty') }}</span>
          </div>
          <!-- slideshow dots -->
          <div v-if="!activeIsVideo && displayImages.length > 1" class="sc-dots">
            <button v-for="(im, i) in displayImages" :key="im.id || 'legacy'" class="sc-dot"
                    :class="{ on: i === slideIdx }" @click="showImage(i)" aria-label="slide"></button>
          </div>
        </div>

        <!-- THUMBNAIL STRIP -->
        <div class="sc-thumbs">
          <button v-if="videoMedia" class="sc-thumb" :class="{ on: activeIsVideo }" @click="showVideo()">
            <img v-if="videoMedia.poster_url" :src="videoMedia.poster_url" alt="" />
            <span class="sc-thumb-play"><Play :size="13" /></span>
            <span class="sc-thumb-x" @click.stop="removeMedia(videoMedia)"><X :size="11" /></span>
          </button>
          <button v-for="(im, i) in displayImages" :key="im.id || 'legacy'" class="sc-thumb"
                  :class="{ on: !activeIsVideo && i === slideIdx }" @click="showImage(i)">
            <img :src="im.file_url" alt="" />
            <span class="sc-thumb-x" @click.stop="removeMedia(im)"><X :size="11" /></span>
          </button>
          <button v-if="imageCount < (specs.max_images || 5)" class="sc-add"
                  :title="t('inventory.product_detail.showcase.add_photos')" @click="pickImages">
            <ImagePlus :size="17" />
          </button>
          <button v-if="!videoMedia" class="sc-add"
                  :title="t('inventory.product_detail.showcase.add_video')" @click="pickVideo">
            <Video :size="17" />
          </button>
        </div>

        <!-- upload / convert progress -->
        <div v-if="uploading" class="sc-progress">
          <div class="sc-progress-track"><div class="sc-progress-bar" :style="{ width: uploadPct + '%' }"></div></div>
          <span class="sc-progress-txt">{{ uploadLabel }}</span>
        </div>

        <!-- showcase display settings: two radios -->
        <div class="sc-settings">
          <div class="sc-set-row">
            <span class="sc-set-label">{{ t('inventory.product_detail.showcase.lead') }}</span>
            <div class="sc-seg">
              <button :class="{ on: lead === 'video' }" :disabled="!videoMedia" @click="setLead('video')">
                {{ t('inventory.product_detail.showcase.lead_video') }}
              </button>
              <button :class="{ on: lead === 'slideshow' }" @click="setLead('slideshow')">
                {{ t('inventory.product_detail.showcase.lead_slideshow') }}
              </button>
            </div>
          </div>
          <div class="sc-set-row">
            <span class="sc-set-label">{{ t('inventory.product_detail.showcase.autoplay') }}</span>
            <div class="sc-seg">
              <button :class="{ on: autoplay }" @click="setAutoplay(true)">{{ t('common.on') }}</button>
              <button :class="{ on: !autoplay }" @click="setAutoplay(false)">{{ t('common.off') }}</button>
            </div>
          </div>
        </div>

        <!-- specs / info note -->
        <div class="sc-note">
          <Info :size="13" />
          <span>{{ specsLine }}</span>
        </div>

        <input ref="imgInput" type="file" accept="image/*" multiple style="display:none" @change="onPickImages" />
        <input ref="vidInput" type="file" accept="video/*" style="display:none" @change="onPickVideo" />

        <!-- Quick stats under gallery -->
        <div class="quick-stats">
          <div class="quick-stat">
            <div class="qs-label">{{ t('inventory.product_detail.total_stock') }}</div>
            <div class="qs-val" :title="stockBreakdown.hasTiers ? formatBreakdown(stockBreakdown.parts) : ''">
              {{ stockBreakdown.hasTiers ? headlineLabel(stockBreakdown.headline) : totalStock }}
            </div>
          </div>
          <div class="quick-stat">
            <div class="qs-label">{{ t('inventory.product_detail.variants_label') }}</div>
            <div class="qs-val">{{ product.variants.length }}</div>
          </div>
          <div class="quick-stat">
            <div class="qs-label">{{ t('inventory.product_detail.unit') }}</div>
            <div class="qs-val">{{ product.unit || '—' }}</div>
          </div>
        </div>
      </div>

      <!-- ══ RIGHT: PRODUCT INFO ══ -->
      <div class="info-panel">
        <!-- Public-facing info (client-safe) -->
        <div class="info-section">
          <div class="info-row big-name">{{ product.name }}</div>
          <div v-if="product.description" class="info-row description">{{ product.description }}</div>

          <div class="info-grid">
            <div class="info-item" v-if="product.category_name">
              <div class="info-label">{{ t('inventory.product_detail.category') }}</div>
              <div class="info-value">{{ product.category_name }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">{{ t('inventory.product_detail.type') }}</div>
              <div class="info-value">{{ product.product_type }}</div>
            </div>
            <!-- Retail price always visible -->
            <div v-if="primaryVariant" class="info-item">
              <div class="info-label">{{ t('inventory.product_detail.retail_price') }}</div>
              <div class="info-value retail-price-val"><Money :value="primaryVariant.sell_price" /></div>
            </div>
          </div>
        </div>

        <!-- Attributes -->
        <div v-if="attributeSummary.length" class="info-section attrs-section">
          <div class="section-mini-title">{{ t('inventory.product_detail.attributes') }}</div>
          <div class="attrs-grid">
            <div v-for="a in attributeSummary" :key="a.name" class="attr-item">
              <span class="attr-name">{{ a.name }}</span>
              <span class="attr-val">{{ a.values.join(', ') }}</span>
            </div>
          </div>
        </div>

        <!-- Secret panel: cost + supplier + base price (NOT retail — it's always shown above) -->
        <Transition name="secret-slide">
          <div v-if="showSecret" class="secret-panel">
            <div class="secret-title"><Eye :size="13" /> {{ t('inventory.product_detail.cost_supplier') }}</div>
            <div class="secret-grid">
              <div class="secret-item">
                <div class="info-label">{{ t('inventory.product_detail.base_price') }}</div>
                <div class="info-value"><Money :value="product.base_price" /></div>
              </div>
              <div v-if="primaryVariant" class="secret-item">
                <div class="info-label">{{ t('inventory.product_detail.cost_price') }}</div>
                <div class="info-value cost-val"><Money :value="primaryVariant.cost_price" /></div>
              </div>
              <div v-if="product.supplier_name" class="secret-item">
                <div class="info-label">{{ t('inventory.product_detail.supplier') }}</div>
                <div class="info-value">{{ product.supplier_name }}</div>
              </div>
              <div v-if="product.supplier_contact" class="secret-item" style="grid-column:1/-1;">
                <div class="info-label">{{ t('inventory.product_detail.contact') }}</div>
                <div class="info-value">{{ product.supplier_contact }}</div>
              </div>
            </div>
          </div>
        </Transition>
      </div>

    </div><!-- /showcase-layout -->

    <!-- ══ STOCK BREAKDOWN (only for multi-tier products) ══ -->
    <div v-if="product && stockBreakdown.hasTiers" class="variants-card stock-units-card">
      <div class="section-header">
        <h2 class="section-title">{{ t('inventory.product_detail.stock_breakdown_section') }}</h2>
      </div>
      <div class="su-body">
        <div v-if="conversionLine" class="su-conversion">
          <Layers :size="15" />
          <span class="su-conversion-label">{{ t('inventory.product_detail.pack_contents') }}:</span>
          <span class="su-conversion-line">{{ conversionLine }}</span>
        </div>
        <div class="su-stock">
          <span class="su-stock-label">{{ t('inventory.product_detail.in_stock_label') }}</span>
          <span class="su-parts">
            <span v-for="(part, i) in stockBreakdown.parts" :key="i" class="su-part">
              <span class="su-part-count">{{ part.count.toLocaleString('en-US') }}</span>
              <span class="su-part-name">{{ part.name }}</span>
            </span>
          </span>
        </div>
      </div>
    </div>

    <!-- ══ VARIANTS TABLE (full width) ══ -->
    <div v-if="product" class="variants-card">
      <div class="section-header">
        <h2 class="section-title">{{ t('inventory.product_detail.variants_section') }}</h2>
        <span class="count-badge">{{ product.variants.length }}</span>
      </div>
      <div class="dt-xscroll">
        <table class="dt">
          <thead>
            <tr>
              <th class="dt-th">{{ t('inventory.product_detail.sku_col') }}</th>
              <th class="dt-th">{{ t('inventory.product_detail.attrs_col') }}</th>
              <th class="dt-th">{{ t('inventory.product_detail.cost_col') }}</th>
              <th class="dt-th">{{ t('inventory.product_detail.sell_price_col') }}</th>
              <th class="dt-th">{{ t('inventory.product_detail.reorder_col') }}</th>
              <th class="dt-th">{{ t('inventory.product_detail.stock_col') }}</th>
              <th class="dt-th">{{ t('inventory.product_detail.per_branch_col') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="product.variants.length === 0">
              <td colspan="7" class="dt-empty">{{ t('inventory.product_detail.no_variants') }}</td>
            </tr>
            <tr v-for="v in product.variants" :key="v.id" class="dt-row">
              <td class="mono">{{ v.sku }}</td>
              <td>
                <span v-for="a in v.attributes" :key="a.id" class="attr-tag">{{ a.definition_name }}: {{ a.value }}</span>
                <span v-if="!v.attributes.length" class="text-muted">—</span>
              </td>
              <td class="text-muted"><Money :value="v.cost_price" /></td>
              <td class="fw6"><Money :value="v.sell_price" /></td>
              <td class="text-muted">{{ v.reorder_level ?? 0 }}</td>
              <td class="fw6" :title="variantStock(v).title">{{ variantStock(v).label }}</td>
              <td>
                <div class="branch-stock">
                  <span v-for="sl in v.stock_levels" :key="sl.id" class="branch-chip">
                    {{ sl.branch_name }}: {{ sl.quantity }}
                  </span>
                  <span v-if="!v.stock_levels.length" class="text-muted">—</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══ EXPIRY BATCHES (FEFO) ══ -->
    <div v-if="product && product.track_expiry" class="variants-card">
      <div class="section-header">
        <h2 class="section-title">{{ t('inventory.product_detail.batches_section') }}</h2>
        <span class="count-badge">{{ (product.batches || []).length }}</span>
      </div>
      <div class="dt-xscroll">
        <table class="dt">
          <thead>
            <tr>
              <th class="dt-th">{{ t('inventory.product_detail.batch_expiry') }}</th>
              <th class="dt-th">{{ t('inventory.product_detail.batch_no') }}</th>
              <th class="dt-th">{{ t('inventory.product_detail.batch_branch') }}</th>
              <th class="dt-th">{{ t('inventory.product_detail.batch_qty') }}</th>
              <th class="dt-th">{{ t('inventory.product_detail.batch_status') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!(product.batches || []).length">
              <td colspan="5" class="dt-empty">{{ t('inventory.product_detail.no_batches') }}</td>
            </tr>
            <tr v-for="b in (product.batches || [])" :key="b.id" class="dt-row">
              <td class="fw6">{{ b.expiry_date || '—' }}</td>
              <td class="mono">{{ b.batch_number || '—' }}</td>
              <td class="text-muted">{{ b.branch }}</td>
              <td class="fw6">{{ b.quantity_remaining }}</td>
              <td>
                <span v-if="b.is_expired" class="batch-pill batch-expired">{{ t('inventory.product_detail.batch_expired') }}</span>
                <span v-else-if="b.days_left != null && b.days_left <= 60" class="batch-pill batch-soon">{{ t('inventory.product_detail.batch_days_left', { n: b.days_left }) }}</span>
                <span v-else class="batch-pill batch-ok">{{ t('inventory.product_detail.batch_ok') }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══ EDIT PRODUCT MODAL ══ -->
    <AppModal v-if="product" :open="editModal.open" :title="t('inventory.product_detail.edit_product_btn')" width="900px" :noBackdropClose="true" @close="editModal.open = false">
      <div class="prod-modal-grid">
        <!-- LEFT COLUMN -->
        <div class="prod-modal-col">
          <div>
            <label class="form-label">{{ t('inventory.product_detail.product_name_label') }}</label>
            <input v-model="editModal.name" class="form-input" :placeholder="t('inventory.product_detail.product_name_placeholder')" />
          </div>
          <div>
            <label class="form-label">{{ t('common.description') }}</label>
            <textarea v-model="editModal.description" class="form-input" rows="3" :placeholder="t('common.optional')" />
          </div>
          <div class="prod-prices-row">
            <div><label class="form-label">{{ t('inventory.product_detail.base_price_label') }}</label><input v-model.number="editModal.base_price" class="form-input" type="number" min="0" step="0.01" /></div>
            <div><label class="form-label">{{ t('inventory.product_detail.cost_price_label') }}</label><input v-model.number="editModal.cost_price" class="form-input" type="number" min="0" step="0.01" /></div>
            <div><label class="form-label">{{ isWeightMode ? t('inventory.product_detail.sell_price_per_kg') : t('inventory.product_detail.sell_price_label') }}</label><input v-model.number="editModal.sell_price" class="form-input" type="number" min="0" step="0.01" /></div>
          </div>
        </div>
        <!-- RIGHT COLUMN -->
        <div class="prod-modal-col">
          <div>
            <label class="form-label">{{ t('inventory.product_detail.category') }}</label>
            <select v-model="editModal.category" class="form-input">
              <option value="">{{ t('inventory.product_detail.category_none') }}</option>
              <option v-for="c in editCategories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div>
            <label class="form-label" style="display:flex;align-items:center;gap:5px;">
              {{ t('inventory.product_detail.supplier') }} <Lock :size="11" />
            </label>
            <input class="form-input" :value="editModal.supplierName" disabled :title="t('inventory.product_detail.supplier_locked')" />
          </div>
          <div>
            <label class="form-label">{{ t('inventory.product_detail.reorder_level') }}</label>
            <input v-model.number="editModal.reorder_level" class="form-input" type="number" min="0" step="1" />
          </div>
          <!-- Attributes -->
          <div v-if="editAttributes.length" class="prod-attrs-section">
            <div class="form-label" style="margin-bottom:8px;">{{ t('inventory.product_detail.attributes') }}</div>
            <div class="prod-attrs-grid">
              <div v-for="def in editAttributes" :key="def.id">
                <label class="form-label">{{ def.name }}</label>
                <select v-if="def.options && def.options.length" v-model="editModal.attrs[def.id]" class="form-input">
                  <option value="">—</option>
                  <option v-for="(o, i) in def.options" :key="i" :value="optText(o)">{{ optText(o) }}</option>
                </select>
                <input v-else v-model="editModal.attrs[def.id]" class="form-input" :placeholder="def.name" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ══ Selling mode (opt-in weight selling, gated by store switch) ══ -->
      <div v-if="weightEnabled" class="prod-expiry-row">
        <div style="display:flex;flex-direction:column;gap:6px;width:100%;">
          <span class="form-label" style="margin-bottom:0;">{{ t('inventory.product_detail.selling_mode') }}</span>
          <div class="prod-mode-toggle">
            <button type="button" class="prod-mode-btn" :class="{ active: editModal.selling_mode !== 'WEIGHT' }"
                    @click="editModal.selling_mode = 'UNIT'">{{ t('inventory.product_detail.mode_unit') }}</button>
            <button type="button" class="prod-mode-btn" :class="{ active: editModal.selling_mode === 'WEIGHT' }"
                    @click="editModal.selling_mode = 'WEIGHT'">{{ t('inventory.product_detail.mode_weight') }}</button>
          </div>
          <span class="prod-units-hint">{{ isWeightMode ? t('inventory.product_detail.mode_weight_hint') : t('inventory.product_detail.mode_unit_hint') }}</span>
        </div>
      </div>

      <!-- ══ Expiry / batch tracking (opt-in, gated by store switch) ══ -->
      <div v-if="expiryEnabled" class="prod-expiry-row">
        <label class="prod-expiry-toggle">
          <input type="checkbox" v-model="editModal.track_expiry" />
          <span>
            <span class="form-label" style="margin-bottom:2px;">{{ t('inventory.product_detail.track_expiry') }}</span>
            <span class="prod-units-hint">{{ t('inventory.product_detail.track_expiry_hint') }}</span>
          </span>
        </label>
      </div>

      <!-- ══ Selling units (opt-in multi-UoM) — hidden in weight mode (mutually exclusive) ══ -->
      <div v-if="!isWeightMode" class="prod-units-section">
        <div class="prod-units-head">
          <div>
            <div class="form-label" style="margin-bottom:2px;">{{ t('inventory.product_detail.selling_units') }}</div>
            <div class="prod-units-hint">{{ t('inventory.product_detail.selling_units_hint', { unit: editModal.unit || 'pcs' }) }}</div>
          </div>
          <button class="btn-ghost btn-sm" type="button" @click="addUnitRow">+ {{ t('inventory.product_detail.add_unit') }}</button>
        </div>
        <table v-if="editModal.units.length" class="prod-units-table">
          <thead>
            <tr>
              <th>{{ t('inventory.product_detail.unit_name') }}</th>
              <th>{{ t('inventory.product_detail.unit_factor', { unit: editModal.unit || 'pcs' }) }}</th>
              <th>{{ t('inventory.product_detail.sell_price_col') }}</th>
              <th>{{ t('inventory.product_detail.barcode') }}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(u, i) in editModal.units" :key="i">
              <td><input v-model="u.name" class="form-input" placeholder="Strip" /></td>
              <td><input v-model.number="u.factor" class="form-input" type="number" min="0" step="0.001" placeholder="10" /></td>
              <td><input v-model.number="u.sell_price" class="form-input" type="number" min="0" step="0.01" /></td>
              <td><input v-model="u.barcode" class="form-input" :placeholder="t('common.optional')" /></td>
              <td><button class="pcr-del-sm" type="button" @click="removeUnitRow(i)"><X :size="13" /></button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <p v-if="editModal.error" class="form-label" style="color:var(--danger,#dc2626);margin-top:4px;">{{ editModal.error }}</p>
      <template #footer>
        <span style="font-size:11.5px;color:var(--text-muted);margin-right:auto;">{{ t('inventory.product_detail.alt_s_hint') }}</span>
        <button class="btn-ghost" @click="editModal.open = false">{{ t('common.cancel') }}</button>
        <button class="btn-primary" :disabled="!editModal.name.trim() || editModal.saving" @click="saveEdit">
          {{ editModal.saving ? t('common.saving') : t('common.save') }}
        </button>
      </template>
    </AppModal>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { ChevronLeft, Eye, X, Camera, Image as ImageIcon, Pencil, Lock, Layers,
         Volume2, VolumeX, Play, ImagePlus, Video, Info } from 'lucide-vue-next'
import api from '@/api/axios'
import Money from '@/components/ui/Money.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { showSuccessToast } from '@/utils/toast'
import { decomposeStock, headlineLabel, formatBreakdown, unitConversionLine } from '@/utils/units'

const { t } = useI18n()
const props = defineProps({ id: String })

const product = ref(null)
const loading = ref(true)
const showSecret = ref(false)
const imgInput = ref(null)

// ── Showcase gallery state ──
const vidInput   = ref(null)
const heroVideo  = ref(null)
const specs      = ref({ max_images: 5 })
const lead       = ref('video')          // 'video' | 'slideshow'
const autoplay   = ref(true)
const activeView = ref('image')          // what the hero currently shows: 'video' | 'image'
const slideIdx   = ref(0)
const muted      = ref(true)
const uploading  = ref(false)
const uploadPct  = ref(0)
const uploadLabel = ref('')
let slideTimer = null

const mediaList    = computed(() => product.value?.media || [])
const galleryImages = computed(() => mediaList.value.filter(m => m.kind === 'image'))
const videoMedia   = computed(() => mediaList.value.find(m => m.kind === 'video') || null)
const imageCount   = computed(() => galleryImages.value.length)
// Legacy single image (pre-gallery products) shown read-only when no gallery photos exist yet.
const legacyImage  = computed(() =>
  (!galleryImages.value.length && product.value?.image_url)
    ? { id: null, file_url: product.value.image_url, legacy: true } : null)
const displayImages = computed(() =>
  galleryImages.value.length ? galleryImages.value : (legacyImage.value ? [legacyImage.value] : []))
const currentImage = computed(() => displayImages.value[slideIdx.value] || null)
const activeIsVideo = computed(() => activeView.value === 'video' && !!videoMedia.value)

// Hero shape: video uses its own (clamped) aspect so 16:9 goes wide / 9:16 goes tall;
// the image slideshow uses a stable square frame with center-crop (no stretch).
const heroStyle = computed(() => {
  if (activeIsVideo.value && videoMedia.value?.aspect) {
    const a = Math.min(Math.max(videoMedia.value.aspect, 0.5), 2)
    return { aspectRatio: String(a) }
  }
  return { aspectRatio: '1 / 1' }
})

const specsLine = computed(() => {
  const s = specs.value
  return t('inventory.product_detail.showcase.specs', {
    imgs: s.max_images, imgmb: s.max_image_mb, vidmb: s.max_video_mb, vidsec: s.max_video_seconds,
  })
})

const totalStock = computed(() => {
  if (!product.value) return 0
  return product.value.variants.reduce((s, v) => s + (v.total_stock || 0), 0)
})

// Unit ladder for this product (base + any pack/strip tiers, from the API).
const sellingUnits = computed(() => product.value?.selling_units || [])
// Whole-product stock broken into packs · strips · pills.
const stockBreakdown = computed(() => decomposeStock(totalStock.value, sellingUnits.value))
// "1 pack = 2 strips = 20 pills" — empty when the product has no extra tiers.
const conversionLine = computed(() => unitConversionLine(sellingUnits.value))
// Per-variant breakdown for the variants table (reuses the product ladder).
function variantStock(v) {
  const d = decomposeStock(v.total_stock || 0, sellingUnits.value)
  return d.hasTiers
    ? { label: headlineLabel(d.headline), title: formatBreakdown(d.parts) }
    : { label: String(v.total_stock ?? 0), title: '' }
}

const primaryVariant = computed(() =>
  product.value?.variants?.[0] ?? null
)

const attributeSummary = computed(() => {
  if (!product.value?.variants) return []
  const map = {}
  for (const v of product.value.variants) {
    for (const a of v.attributes || []) {
      if (!map[a.definition_name]) map[a.definition_name] = new Set()
      map[a.definition_name].add(a.value)
    }
  }
  return Object.entries(map).map(([name, vals]) => ({ name, values: [...vals] }))
})

async function fetchProduct() {
  loading.value = true
  try {
    const r = await api.get(`/api/inventory/products/${props.id}/`)
    product.value = r.data
    hydrateShowcase()
  } catch { product.value = null }
  finally { loading.value = false }
}

// ── Showcase gallery actions ──
function pickImages() { imgInput.value?.click() }
function pickVideo()  { vidInput.value?.click() }

function showVideo() {
  activeView.value = 'video'
  stopSlideshow()
}
function showImage(i) {
  activeView.value = 'image'
  slideIdx.value = i
  restartSlideshow()
}

async function uploadOne(file, kind) {
  if (uploading.value) return
  uploading.value = true
  uploadPct.value = 0
  uploadLabel.value = t('inventory.product_detail.showcase.uploading')
  const fd = new FormData()
  fd.append('file', file)
  fd.append('kind', kind)
  try {
    const { data } = await api.post(`/api/inventory/products/${props.id}/upload-media/`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (!e.total) return
        uploadPct.value = Math.round((e.loaded / e.total) * 100)
        // Once bytes are up, the server is busy converting (esp. video).
        if (uploadPct.value >= 100) uploadLabel.value = t('inventory.product_detail.showcase.converting')
      },
    })
    product.value.media = [...mediaList.value, data]
    if (kind === 'video') { showVideo() } else { showImage(galleryImages.value.length - 1) }
    showSuccessToast(t('inventory.product_detail.showcase.added'))
  } catch (err) {
    const msg = err?.response?.data?.detail || t('inventory.product_detail.showcase.upload_failed')
    showSuccessToast(msg)
  } finally {
    uploading.value = false
    uploadPct.value = 0
  }
}

async function onPickImages(e) {
  const files = Array.from(e.target.files || [])
  e.target.value = ''
  for (const f of files) {
    if (imageCount.value >= (specs.value.max_images || 5)) {
      showSuccessToast(t('inventory.product_detail.showcase.max_photos', { n: specs.value.max_images }))
      break
    }
    await uploadOne(f, 'image')
  }
}
async function onPickVideo(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (file) await uploadOne(file, 'video')
}

async function removeMedia(m) {
  if (m.legacy) {                                   // pre-gallery single image
    try { await api.delete(`/api/inventory/products/${props.id}/remove-image/`) } catch {}
    product.value.image_url = null
    slideIdx.value = 0
    return
  }
  try {
    await api.delete(`/api/inventory/products/${props.id}/media/${m.id}/`)
    product.value.media = mediaList.value.filter(x => x.id !== m.id)
    if (m.kind === 'video' && activeView.value === 'video') activeView.value = 'image'
    if (slideIdx.value >= displayImages.value.length) slideIdx.value = Math.max(0, displayImages.value.length - 1)
    syncActiveView()
  } catch (err) {
    showSuccessToast(err?.response?.data?.detail || t('inventory.product_detail.showcase.upload_failed'))
  }
}

async function setLead(v) {
  if (v === 'video' && !videoMedia.value) return
  lead.value = v
  syncActiveView()
  try { await api.post(`/api/inventory/products/${props.id}/showcase-settings/`, { showcase_lead: v }) } catch {}
}
async function setAutoplay(v) {
  autoplay.value = v
  restartSlideshow()
  applyVideoAutoplay()
  try { await api.post(`/api/inventory/products/${props.id}/showcase-settings/`, { showcase_autoplay: v }) } catch {}
}

function toggleMute() {
  const el = heroVideo.value
  if (!el) return
  el.muted = !el.muted
  muted.value = el.muted
  if (!el.muted && el.paused) el.play().catch(() => {})
}
function onVolChange() {
  if (heroVideo.value) muted.value = heroVideo.value.muted
}

// ── Slideshow + autoplay orchestration ──
function stopSlideshow() { if (slideTimer) { clearInterval(slideTimer); slideTimer = null } }
function restartSlideshow() {
  stopSlideshow()
  if (activeView.value === 'image' && autoplay.value && displayImages.value.length > 1) {
    slideTimer = setInterval(() => {
      slideIdx.value = (slideIdx.value + 1) % displayImages.value.length
    }, 3000)
  }
}
function applyVideoAutoplay() {
  const el = heroVideo.value
  if (!el) return
  if (activeIsVideo.value && autoplay.value) el.play().catch(() => {})
  else el.pause()
}
// Decide what the hero opens on, honoring the lead setting.
function syncActiveView() {
  activeView.value = (lead.value === 'video' && videoMedia.value) ? 'video' : 'image'
  if (activeView.value === 'image') restartSlideshow()
  else stopSlideshow()
  nextTick(() => applyVideoAutoplay())
}

function hydrateShowcase() {
  if (!product.value) return
  lead.value = product.value.showcase_lead || 'video'
  autoplay.value = product.value.showcase_autoplay !== false
  slideIdx.value = 0
  syncActiveView()
}

/* ── Edit modal ── */
const editModal = reactive({
  open: false, name: '', description: '', category: '',
  supplierName: '', base_price: 0, cost_price: 0, sell_price: 0,
  reorder_level: 0, attrs: {}, unit: 'pcs', units: [], track_expiry: false,
  selling_mode: 'UNIT', saving: false, error: '',
})

// Store master switches — gate the per-product expiry checkbox + batch panel and
// the weight-selling mode toggle so stores that don't use them never see the option.
const expiryEnabled = ref(false)
const weightEnabled = ref(false)
const isWeightMode = computed(() => editModal.selling_mode === 'WEIGHT')

function addUnitRow() {
  editModal.units.push({ id: null, name: '', factor: null, sell_price: 0, barcode: '' })
}
function removeUnitRow(i) { editModal.units.splice(i, 1) }
const editCategories = ref([])
const editAttributes = ref([])

function optText(o) { return typeof o === 'string' ? o : (o?.value ?? o?.label ?? String(o)) }

async function openEditModal() {
  if (!product.value) return
  editModal.error = ''
  editModal.saving = false

  // Lazy-load categories and attributes if not yet loaded
  if (!editCategories.value.length) {
    try {
      const [catRes, attrRes] = await Promise.all([
        api.get('/api/inventory/categories/'),
        api.get('/api/inventory/attributes/'),
      ])
      editCategories.value = catRes.data.results ?? catRes.data
      editAttributes.value = attrRes.data.results ?? attrRes.data
    } catch { /* noop */ }
  }
  try {
    const s = await api.get('/api/core/settings/')
    expiryEnabled.value = !!s.data.expiry_tracking_enabled
    weightEnabled.value = !!s.data.weight_selling_enabled
  } catch { /* noop */ }

  const p = product.value
  const v = p.variants?.[0]
  editModal.name = p.name || ''
  editModal.description = p.description || ''
  editModal.category = p.category || ''
  editModal.supplierName = p.supplier_name || '—'
  editModal.base_price = Number(p.base_price || 0)
  editModal.cost_price = v ? Number(v.cost_price || 0) : 0
  editModal.sell_price = v ? Number(v.sell_price || 0) : 0
  editModal.reorder_level = v ? Number(v.reorder_level ?? 0) : 0
  editModal.unit = p.unit || 'pcs'
  editModal.track_expiry = !!p.track_expiry
  editModal.selling_mode = p.selling_mode || 'UNIT'
  // Opt-in alternate units come back in selling_units; the base unit (is_base)
  // is implicit and excluded from the editable rows.
  editModal.units = (p.selling_units || [])
    .filter(u => !u.is_base)
    .map(u => ({ id: u.id, name: u.name, factor: Number(u.factor), sell_price: Number(u.price), barcode: u.barcode || '' }))

  // Build attrs map
  const a = {}
  for (const def of editAttributes.value) a[def.id] = ''
  if (v?.attributes) for (const attr of v.attributes) a[attr.definition] = attr.value
  editModal.attrs = a

  editModal.open = true
}

async function saveEdit() {
  editModal.error = ''
  editModal.saving = true
  const attributes_payload = Object.entries(editModal.attrs)
    .filter(([, val]) => val !== '' && val != null)
    .map(([definition, value]) => ({ definition, value }))
  const payload = {
    name: editModal.name.trim(),
    description: editModal.description || '',
    category: editModal.category || null,
    base_price: editModal.base_price || 0,
    cost_price: editModal.cost_price || 0,
    sell_price: editModal.sell_price || 0,
    reorder_level: editModal.reorder_level ?? 0,
    track_expiry: editModal.track_expiry,
    selling_mode: editModal.selling_mode,
    attributes: attributes_payload,
    // Only send rows that have a name + a positive factor; backend reconciles
    // (creates new, updates by id, soft-deletes any the user removed).
    // Weight products are per-kg only — packs are mutually exclusive, so send none.
    selling_units: isWeightMode.value ? [] : editModal.units
      .filter(u => (u.name || '').trim() && Number(u.factor) > 0)
      .map(u => ({ id: u.id || undefined, name: u.name.trim(), factor: u.factor,
                   sell_price: u.sell_price || 0, barcode: u.barcode || '' })),
  }
  try {
    await api.patch(`/api/inventory/products/${props.id}/`, payload)
    showSuccessToast(t('inventory.product_detail.toast_saved'))
    editModal.open = false
    await fetchProduct()
  } catch (e) {
    editModal.error = e.response?.data?.detail || t('inventory.product_detail.err_save')
  } finally { editModal.saving = false }
}

// Alt+S to save edit modal
function handleKey(e) {
  if (e.altKey && e.key === 's' && editModal.open && !editModal.saving) {
    e.preventDefault()
    saveEdit()
  }
}
async function loadSpecs() {
  try {
    const { data } = await api.get('/api/inventory/products/media-specs/')
    specs.value = data
  } catch { /* keep defaults */ }
}
onMounted(() => {
  loadSpecs()
  fetchProduct()
  document.addEventListener('keydown', handleKey)
})
onUnmounted(() => {
  document.removeEventListener('keydown', handleKey)
  stopSlideshow()
})
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:12px; }
.header-left { display:flex; align-items:flex-start; gap:12px; }
.back-btn { display:inline-flex; align-items:center; gap:4px; padding:6px 10px; border-radius:8px; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; font-size:13px; font-weight:500; transition:background 100ms; margin-top:2px; }
.back-btn:hover { background:var(--border); }

/* Edit product button */
.edit-prod-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 8px; border: 1px solid var(--border);
  background: none; color: var(--text-secondary); cursor: pointer;
  font-size: 13px; font-weight: 500; transition: background 100ms, color 100ms;
}
.edit-prod-btn:hover { background: var(--border); color: var(--text-primary); }

/* S secret button */
.s-btn {
  width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--border);
  background: none; cursor: pointer; font-size: 11px; font-weight: 800;
  color: var(--text-muted); letter-spacing: .04em; transition: all 100ms;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.s-btn:hover { border-color: var(--accent); color: var(--accent); }
.s-btn.active { background: var(--accent); color: #1a1208; border-color: var(--accent); }

.skeleton-block { height: 400px; border-radius: 12px; background: var(--border); }
.empty-state { text-align:center; padding:60px 20px; color:var(--text-muted); }

/* ── Showcase layout: image left, info right ── */
.showcase-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
  margin-bottom: 24px;
  align-items: start;
}
@media (max-width: 768px) {
  .showcase-layout { grid-template-columns: 1fr; }
}

/* ── Showcase gallery panel ── */
.showcase-panel { display: flex; flex-direction: column; gap: 12px; }

/* Hero — image slideshow frame (square) or video (its own clamped aspect) */
.sc-hero {
  position: relative; border-radius: 14px; overflow: hidden;
  border: 1px solid var(--border); background: var(--bg-card);
  max-height: 560px; display: flex; align-items: center; justify-content: center;
}
.sc-hero.is-video { background: #000; }
.sc-img   { width: 100%; height: 100%; object-fit: cover; display: block; }   /* center-crop, no stretch */
.sc-video { width: 100%; height: 100%; object-fit: contain; display: block; cursor: pointer; background: #000; }
.sc-empty {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  color: var(--text-muted); font-size: 13px;
}

.sc-mute {
  position: absolute; bottom: 10px; right: 10px; z-index: 2;
  width: 34px; height: 34px; border-radius: 50%; border: none;
  background: rgba(0,0,0,0.55); color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: background 120ms, transform 120ms;
}
.sc-mute:hover { background: rgba(0,0,0,0.8); transform: scale(1.06); }

.sc-dots {
  position: absolute; bottom: 9px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 6px; z-index: 2;
}
.sc-dot {
  width: 7px; height: 7px; border-radius: 50%; border: none; padding: 0; cursor: pointer;
  background: rgba(255,255,255,0.5); box-shadow: 0 0 2px rgba(0,0,0,0.4); transition: background 120ms;
}
.sc-dot.on { background: #fff; }

/* Thumbnail strip */
.sc-thumbs { display: flex; flex-wrap: wrap; gap: 8px; }
.sc-thumb {
  position: relative; width: 54px; height: 54px; border-radius: 9px; overflow: hidden;
  border: 2px solid var(--border); background: var(--bg-card); cursor: pointer; padding: 0;
  transition: border-color 120ms;
}
.sc-thumb.on { border-color: var(--accent); }
.sc-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
.sc-thumb-play {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  color: #fff; background: rgba(0,0,0,0.35);
}
.sc-thumb-x {
  position: absolute; top: 2px; right: 2px; width: 16px; height: 16px; border-radius: 50%;
  background: rgba(0,0,0,0.6); color: #fff; display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 120ms;
}
.sc-thumb:hover .sc-thumb-x { opacity: 1; }
.sc-add {
  width: 54px; height: 54px; border-radius: 9px; cursor: pointer;
  border: 2px dashed var(--border); background: var(--bg-card); color: var(--text-muted);
  display: flex; align-items: center; justify-content: center; transition: border-color 120ms, color 120ms;
}
.sc-add:hover { border-color: var(--accent); color: var(--accent); }

/* Upload / convert progress */
.sc-progress { display: flex; flex-direction: column; gap: 4px; }
.sc-progress-track { height: 6px; border-radius: 4px; background: var(--border); overflow: hidden; }
.sc-progress-bar { height: 100%; background: var(--accent); border-radius: 4px; transition: width 150ms; }
.sc-progress-txt { font-size: 11px; color: var(--text-muted); }

/* Display settings (two radios) */
.sc-settings {
  display: flex; flex-direction: column; gap: 8px;
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 12px; padding: 12px;
}
.sc-set-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
.sc-set-label { font-size: 12px; font-weight: 600; color: var(--text-secondary); }
.sc-seg { display: inline-flex; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
.sc-seg button {
  border: none; background: none; padding: 5px 11px; font-size: 12px; font-weight: 600;
  color: var(--text-muted); cursor: pointer; transition: background 100ms, color 100ms;
}
.sc-seg button + button { border-left: 1px solid var(--border); }
.sc-seg button.on { background: var(--accent); color: #fff; }
.sc-seg button:disabled { opacity: 0.4; cursor: not-allowed; }

/* Specs note */
.sc-note {
  display: flex; align-items: flex-start; gap: 6px; font-size: 11px; line-height: 1.5;
  color: var(--text-muted); padding: 2px 2px 0;
}
.sc-note svg { flex-shrink: 0; margin-top: 1px; }

.quick-stats {
  display: grid; grid-template-columns: 1fr 1fr 1fr;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 12px; overflow: hidden;
}
.quick-stat { padding: 12px 8px; text-align: center; border-right: 1px solid var(--border); }
.quick-stat:last-child { border-right: none; }
.qs-label { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: var(--text-muted); font-weight: 600; }
.qs-val { font-size: 18px; font-weight: 800; color: var(--text-primary); margin-top: 2px; }

/* ── Info panel ── */
.info-panel { display: flex; flex-direction: column; gap: 20px; }

.info-section {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 14px; padding: 20px 22px;
  display: flex; flex-direction: column; gap: 12px;
}

.big-name { font-size: 20px; font-weight: 800; color: var(--text-primary); }
.description { font-size: 14px; color: var(--text-secondary); line-height: 1.6; }

.info-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 14px; }
.info-item { }
.info-label { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: var(--text-muted); font-weight: 600; }
.info-value { font-size: 14px; color: var(--text-primary); margin-top: 2px; font-weight: 500; }
.retail-price-val { color: var(--success); font-weight: 700; font-size: 16px; }
.dark .retail-price-val { color: #4ade80; }

/* Attributes */
.attrs-section { }
.section-mini-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--text-muted); margin-bottom: 10px; }
.attrs-grid { display: flex; flex-wrap: wrap; gap: 8px; }
.attr-item { display: flex; align-items: center; gap: 6px; background: var(--bg-app); border: 1px solid var(--border); border-radius: 8px; padding: 6px 12px; }
.attr-name { font-size: 12px; color: var(--text-muted); font-weight: 600; }
.attr-val { font-size: 13px; color: var(--text-primary); font-weight: 600; }

/* Secret panel */
.secret-panel {
  background: var(--bg-card); border: 1px solid var(--accent);
  border-radius: 14px; padding: 16px 20px;
  box-shadow: 0 4px 20px var(--accent-soft);
}
.secret-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .06em; color: var(--accent); margin-bottom: 12px;
}
.secret-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 12px; }
.secret-item { }
.cost-val { color: var(--danger); font-weight: 700; }

.secret-slide-enter-active { transition: opacity 180ms, transform 180ms cubic-bezier(0.34,1.56,0.64,1); }
.secret-slide-leave-active { transition: opacity 120ms ease; }
.secret-slide-enter-from { opacity: 0; transform: translateY(-8px); }
.secret-slide-leave-to { opacity: 0; }

/* ── Variants full-width card ── */
.variants-card {
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: 14px; overflow: hidden;
}
.section-header { display:flex; align-items:center; gap:10px; padding:14px 18px; border-bottom:1px solid var(--border); }
.section-title { font-size:15px; font-weight:600; color:var(--text-primary); margin:0; }
.count-badge { padding:2px 8px; border-radius:20px; background:var(--border); font-size:12px; font-weight:600; color:var(--text-muted); }

/* Stock breakdown (multi-tier products) */
.su-body { display:flex; flex-direction:column; gap:14px; padding:16px 18px; }
.su-conversion { display:flex; align-items:center; gap:8px; flex-wrap:wrap; color:var(--text-secondary); font-size:13px; }
.su-conversion svg { color:var(--accent); flex-shrink:0; }
.su-conversion-label { font-weight:600; color:var(--text-muted); }
.su-conversion-line { font-weight:600; color:var(--text-primary); }
.su-stock { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
.su-stock-label { font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; color:var(--text-muted); }
.su-parts { display:flex; gap:8px; flex-wrap:wrap; }
.su-part { display:inline-flex; align-items:baseline; gap:5px; padding:5px 12px; border-radius:10px; background:var(--accent-soft,rgba(247,143,30,0.10)); }
.su-part-count { font-size:18px; font-weight:700; color:var(--text-primary); font-variant-numeric:tabular-nums; }
.su-part-name { font-size:12px; font-weight:600; color:var(--accent); }
.su-part:not(:first-child) { background:var(--border); }
.su-part:not(:first-child) .su-part-name { color:var(--text-secondary); }

.mono { font-family:ui-monospace,monospace; font-size:12px; }
.text-muted { color:var(--text-muted); }
.fw6 { font-weight:600; }

.attr-tag { display:inline-block; padding:2px 8px; border-radius:20px; background:var(--accent-soft,rgba(247,143,30,0.10)); color:var(--accent); font-size:11px; font-weight:600; margin:1px 3px 1px 0; }
.branch-stock { display:flex; flex-wrap:wrap; gap:4px; }
.branch-chip { display:inline-block; padding:2px 8px; border-radius:6px; background:var(--border); color:var(--text-secondary); font-size:11.5px; font-weight:500; }

.batch-pill { display:inline-block; padding:2px 9px; border-radius:20px; font-size:11px; font-weight:700; }
.batch-expired { background:#fee2e2; color:#dc2626; }
.batch-soon { background:#fef3c7; color:#d97706; }
.batch-ok { background:#dcfce7; color:#16a34a; }
.prod-expiry-row { border-top:1px solid var(--border); padding-top:14px; margin-top:4px; }
.prod-expiry-toggle { display:flex; gap:10px; align-items:flex-start; cursor:pointer; }
.prod-expiry-toggle input { margin-top:3px; width:16px; height:16px; accent-color:var(--accent); }
.prod-expiry-toggle > span { display:flex; flex-direction:column; }
.prod-mode-toggle { display:inline-flex; border:1px solid var(--border); border-radius:8px; overflow:hidden; width:max-content; }
.prod-mode-btn { padding:7px 18px; font-size:13px; font-weight:600; background:var(--surface,transparent); color:var(--text-muted); border:none; cursor:pointer; transition:background .15s, color .15s; }
.prod-mode-btn + .prod-mode-btn { border-left:1px solid var(--border); }
.prod-mode-btn.active { background:var(--accent); color:#fff; }

/* ── Edit modal shared styles ── */
.prod-modal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 640px) { .prod-modal-grid { grid-template-columns: 1fr; } }
.prod-modal-col { display: flex; flex-direction: column; gap: 14px; }
.prod-prices-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.prod-attrs-section { border-top: 1px solid var(--border); padding-top: 12px; }
.prod-attrs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

/* Selling units (opt-in multi-UoM) */
.prod-units-section { border-top: 1px solid var(--border); margin-top: 16px; padding-top: 14px; }
.prod-units-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 10px; }
.prod-units-hint { font-size: 11.5px; color: var(--text-muted); max-width: 560px; line-height: 1.45; }
.btn-sm { font-size: 12px; padding: 5px 10px; white-space: nowrap; }
.prod-units-table { width: 100%; border-collapse: collapse; }
.prod-units-table th {
  font-size: 11px; font-weight: 600; color: var(--text-muted); text-align: left;
  padding: 4px 8px 6px; white-space: nowrap;
}
.prod-units-table td { padding: 3px 8px; vertical-align: middle; }
.prod-units-table td:nth-child(2) { width: 130px; }
.prod-units-table td:nth-child(3) { width: 120px; }
.prod-units-table td:last-child { width: 34px; text-align: center; }
.pcr-del-sm {
  width: 26px; height: 26px; border-radius: 6px; border: 1px solid var(--border);
  background: var(--bg-card); color: var(--text-muted); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
}
.pcr-del-sm:hover { color: var(--danger, #dc2626); border-color: var(--danger, #dc2626); }
</style>
