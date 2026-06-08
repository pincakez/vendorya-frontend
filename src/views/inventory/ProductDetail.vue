<template>
  <div>
    <div class="page-header">
      <div class="header-left">
        <button class="back-btn" @click="$router.back()">
          <ChevronLeft :size="16" /> Back
        </button>
        <div v-if="product">
          <h1 class="page-title">{{ product.name }}</h1>
          <p class="page-sub">
            <span v-if="product.category_name">{{ product.category_name }} · </span>
            <span v-if="product.supplier_name">{{ product.supplier_name }} · </span>
            {{ product.product_type }}
          </p>
        </div>
        <div v-else class="page-title">Product</div>
      </div>
    </div>

    <div v-if="loading" class="skeleton-block" />
    <div v-else-if="!product" class="empty-state">Product not found.</div>
    <div v-else class="detail-layout">

      <!-- Info -->
      <div class="info-card">
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Unit</div>
            <div class="info-value">{{ product.unit || '—' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Category</div>
            <div class="info-value">{{ product.category_name || '—' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Supplier</div>
            <div class="info-value">{{ product.supplier_name || '—' }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Type</div>
            <div class="info-value">{{ product.product_type }}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Total Stock</div>
            <div class="info-value">{{ totalStock }}</div>
          </div>
          <div v-if="product.description" class="info-item" style="grid-column:1/-1;">
            <div class="info-label">Description</div>
            <div class="info-value">{{ product.description }}</div>
          </div>
        </div>
      </div>

      <!-- Variants -->
      <div class="section-card">
        <div class="section-header">
          <h2 class="section-title">Variants</h2>
          <span class="count-badge">{{ product.variants.length }}</span>
        </div>
        <div class="dt-xscroll">
        <table class="dt">
          <thead>
            <tr>
              <th class="dt-th">SKU</th>
              <th class="dt-th">Barcode</th>
              <th class="dt-th">Attributes</th>
              <th class="dt-th">Cost</th>
              <th class="dt-th">Price</th>
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
              <td class="mono text-muted">{{ v.barcode || '—' }}</td>
              <td>
                <span v-for="a in v.attributes" :key="a.id" class="attr-tag">{{ a.definition_name }}: {{ a.value }}</span>
                <span v-if="!v.attributes.length" class="text-muted">—</span>
              </td>
              <td><Money :value="v.cost_price" /></td>
              <td><Money :value="v.sell_price" /></td>
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
      </div><!-- dt-xscroll -->
      </div><!-- existing -->
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ChevronLeft } from 'lucide-vue-next'
import api from '@/api/axios'
import Money from '@/components/ui/Money.vue'

const props = defineProps({ id: String })

const product = ref(null)
const loading = ref(true)

const totalStock = computed(() => {
  if (!product.value) return 0
  return product.value.variants.reduce((s, v) => s + (v.total_stock || 0), 0)
})

async function fetchProduct() {
  loading.value = true
  try {
    const r = await api.get(`/api/inventory/products/${props.id}/`)
    product.value = r.data
  } catch { product.value = null }
  finally { loading.value = false }
}

onMounted(fetchProduct)
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
.header-left { display:flex; align-items:flex-start; gap:12px; }
.back-btn { display:inline-flex; align-items:center; gap:4px; padding:6px 10px; border-radius:8px; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; font-size:13px; font-weight:500; transition:background 100ms; margin-top:2px; }
.back-btn:hover { background:var(--border); }
.page-title { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub { font-size:13px; color:var(--text-muted); margin:2px 0 0; }

.detail-layout { display:flex; flex-direction:column; gap:20px; }
.skeleton-block { height:200px; border-radius:12px; background:var(--border); }
.empty-state { text-align:center; padding:60px 20px; color:var(--text-muted); }

.info-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:20px 22px; }
.info-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(180px, 1fr)); gap:16px; }
.info-label { font-size:11px; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); font-weight:600; }
.info-value { font-size:14px; color:var(--text-primary); margin-top:3px; }

.section-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.section-header { display:flex; align-items:center; gap:10px; padding:14px 18px; border-bottom:1px solid var(--border); }
.section-title { font-size:15px; font-weight:600; color:var(--text-primary); margin:0; }
.count-badge { padding:2px 8px; border-radius:20px; background:var(--border); font-size:12px; font-weight:600; color:var(--text-muted); }

.table-empty { text-align:center; padding:40px 20px; color:var(--text-muted); }
.mono { font-family:ui-monospace,monospace; font-size:12px; }
.text-muted { color:var(--text-muted); }
.fw6 { font-weight:600; }

.attr-tag { display:inline-block; padding:2px 8px; border-radius:20px; background:var(--accent-soft,rgba(247,143,30,0.10)); color:var(--accent); font-size:11px; font-weight:600; margin:1px 3px 1px 0; }
.branch-stock { display:flex; flex-wrap:wrap; gap:4px; }
.branch-chip { display:inline-block; padding:2px 8px; border-radius:6px; background:var(--border); color:var(--text-secondary); font-size:11.5px; font-weight:500; }
</style>
