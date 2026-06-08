<template>
  <div>
    <!-- ── PAGE HEADER ── -->
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="$router.back()">
          <ChevronLeft :size="16" /> Back
        </button>
        <div v-if="product">
          <h1 class="page-title">{{ product.name }}</h1>
          <p class="page-sub">
            <span v-if="product.category_name">{{ product.category_name }} · </span>
            {{ product.product_type }}
          </p>
        </div>
        <div v-else class="page-title">Product</div>
      </div>
      <!-- Secret S button — reveals pricing/supplier panel -->
      <button v-if="product" class="s-btn" :class="{ active: showSecret }" @click="showSecret = !showSecret" title="Show cost & supplier info">S</button>
    </div>

    <div v-if="loading" class="skeleton-block" />
    <div v-else-if="!product" class="empty-state">Product not found.</div>
    <div v-else class="showcase-layout">

      <!-- ══ LEFT: IMAGE PANEL ══ -->
      <div class="image-panel">
        <div class="image-well" @click="triggerImagePick" :class="{ 'has-image': !!product.image_url }">
          <img v-if="product.image_url" :src="product.image_url" class="product-img" alt="Product image" />
          <div v-else class="image-placeholder">
            <ImageIcon :size="40" />
            <span>Tap to add photo</span>
          </div>
          <div class="image-overlay">
            <Camera :size="18" /> Change photo
          </div>
        </div>
        <input ref="imgInput" type="file" accept="image/*" style="display:none" @change="uploadImage" />
        <button v-if="product.image_url" class="img-remove-btn" @click.stop="removeImage">
          <X :size="12" /> Remove photo
        </button>

        <!-- Quick stats under image -->
        <div class="quick-stats">
          <div class="quick-stat">
            <div class="qs-label">Total Stock</div>
            <div class="qs-val">{{ totalStock }}</div>
          </div>
          <div class="quick-stat">
            <div class="qs-label">Variants</div>
            <div class="qs-val">{{ product.variants.length }}</div>
          </div>
          <div class="quick-stat">
            <div class="qs-label">Unit</div>
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
              <div class="info-label">Category</div>
              <div class="info-value">{{ product.category_name }}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Type</div>
              <div class="info-value">{{ product.product_type }}</div>
            </div>
          </div>
        </div>

        <!-- Attributes -->
        <div v-if="attributeSummary.length" class="info-section attrs-section">
          <div class="section-mini-title">Attributes</div>
          <div class="attrs-grid">
            <div v-for="a in attributeSummary" :key="a.name" class="attr-item">
              <span class="attr-name">{{ a.name }}</span>
              <span class="attr-val">{{ a.values.join(', ') }}</span>
            </div>
          </div>
        </div>

        <!-- Secret panel: cost + supplier + base price -->
        <Transition name="secret-slide">
          <div v-if="showSecret" class="secret-panel">
            <div class="secret-title"><Eye :size="13" /> Pricing & Supplier</div>
            <div class="secret-grid">
              <div class="secret-item">
                <div class="info-label">Base Price</div>
                <div class="info-value"><Money :value="product.base_price" /></div>
              </div>
              <div v-if="primaryVariant" class="secret-item">
                <div class="info-label">Cost Price</div>
                <div class="info-value cost-val"><Money :value="primaryVariant.cost_price" /></div>
              </div>
              <div v-if="primaryVariant" class="secret-item">
                <div class="info-label">Sell Price</div>
                <div class="info-value"><Money :value="primaryVariant.sell_price" /></div>
              </div>
              <div v-if="product.supplier_name" class="secret-item">
                <div class="info-label">Supplier</div>
                <div class="info-value">{{ product.supplier_name }}</div>
              </div>
              <div v-if="product.supplier_contact" class="secret-item" style="grid-column:1/-1;">
                <div class="info-label">Contact</div>
                <div class="info-value">{{ product.supplier_contact }}</div>
              </div>
            </div>
          </div>
        </Transition>
      </div>

    </div><!-- /showcase-layout -->

    <!-- ══ VARIANTS TABLE (full width) ══ -->
    <div v-if="product" class="variants-card">
      <div class="section-header">
        <h2 class="section-title">Variants</h2>
        <span class="count-badge">{{ product.variants.length }}</span>
      </div>
      <div class="dt-xscroll">
        <table class="dt">
          <thead>
            <tr>
              <th class="dt-th">SKU</th>
              <th class="dt-th">Attributes</th>
              <th class="dt-th">Cost</th>
              <th class="dt-th">Sell Price</th>
              <th class="dt-th">Reorder</th>
              <th class="dt-th">Stock</th>
              <th class="dt-th">Per Branch</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="product.variants.length === 0">
              <td colspan="7" class="dt-empty">No variants.</td>
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
              <td class="fw6">{{ v.total_stock }}</td>
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

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ChevronLeft, Eye, X, Camera, Image as ImageIcon } from 'lucide-vue-next'
import api from '@/api/axios'
import Money from '@/components/ui/Money.vue'

const props = defineProps({ id: String })

const product = ref(null)
const loading = ref(true)
const showSecret = ref(false)
const imgInput = ref(null)

const totalStock = computed(() => {
  if (!product.value) return 0
  return product.value.variants.reduce((s, v) => s + (v.total_stock || 0), 0)
})

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
  } catch { product.value = null }
  finally { loading.value = false }
}

function triggerImagePick() {
  imgInput.value?.click()
}

async function uploadImage(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const fd = new FormData()
  fd.append('image', file)
  try {
    const { data } = await api.post(`/api/inventory/products/${props.id}/upload-image/`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    product.value.image_url = data.image_url
  } catch { /* noop */ }
  e.target.value = ''
}

async function removeImage() {
  try {
    await api.delete(`/api/inventory/products/${props.id}/remove-image/`)
    product.value.image_url = null
  } catch { /* noop */ }
}

onMounted(fetchProduct)
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:24px; flex-wrap:wrap; gap:12px; }
.header-left { display:flex; align-items:flex-start; gap:12px; }
.back-btn { display:inline-flex; align-items:center; gap:4px; padding:6px 10px; border-radius:8px; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; font-size:13px; font-weight:500; transition:background 100ms; margin-top:2px; }
.back-btn:hover { background:var(--border); }
.page-title { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub { font-size:13px; color:var(--text-muted); margin:2px 0 0; }

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
  grid-template-columns: 280px 1fr;
  gap: 24px;
  margin-bottom: 24px;
  align-items: start;
}
@media (max-width: 768px) {
  .showcase-layout { grid-template-columns: 1fr; }
}

/* ── Image panel ── */
.image-panel { display: flex; flex-direction: column; gap: 12px; }

.image-well {
  position: relative; border-radius: 14px; overflow: hidden;
  border: 2px dashed var(--border); background: var(--bg-card);
  aspect-ratio: 1 / 1; cursor: pointer;
  transition: border-color 150ms;
  display: flex; align-items: center; justify-content: center;
}
.image-well:hover { border-color: var(--accent); }
.image-well.has-image { border-style: solid; }

.product-img { width: 100%; height: 100%; object-fit: cover; display: block; }

.image-placeholder {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  color: var(--text-muted); font-size: 13px;
}

.image-overlay {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  gap: 6px; font-size: 13px; font-weight: 600; color: #fff;
  background: rgba(0,0,0,0.45); opacity: 0; transition: opacity 150ms;
}
.image-well:hover .image-overlay { opacity: 1; }

.img-remove-btn {
  display: inline-flex; align-items: center; gap: 4px; font-size: 12px;
  padding: 5px 10px; border-radius: 7px; border: 1px solid var(--border);
  background: none; color: var(--text-muted); cursor: pointer;
  transition: background 100ms, color 100ms;
}
.img-remove-btn:hover { background: #fee2e2; color: #dc2626; border-color: #fca5a5; }

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
.cost-val { color: #dc2626; font-weight: 700; }

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

.mono { font-family:ui-monospace,monospace; font-size:12px; }
.text-muted { color:var(--text-muted); }
.fw6 { font-weight:600; }

.attr-tag { display:inline-block; padding:2px 8px; border-radius:20px; background:var(--accent-soft,rgba(247,143,30,0.10)); color:var(--accent); font-size:11px; font-weight:600; margin:1px 3px 1px 0; }
.branch-stock { display:flex; flex-wrap:wrap; gap:4px; }
.branch-chip { display:inline-block; padding:2px 8px; border-radius:6px; background:var(--border); color:var(--text-secondary); font-size:11.5px; font-weight:500; }
</style>
