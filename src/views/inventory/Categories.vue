<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('inventory.categories.title') }}</h1>
        <p class="page-sub">{{ t('inventory.categories.browse_hint') }}</p>
      </div>
      <button class="btn-primary" @click="openNew()"><Plus :size="15" /> {{ t('inventory.categories.add_category') }}</button>
    </div>

    <div class="miller-wrap" style="margin-top:20px;">
      <div v-if="loading" class="table-skeleton">
        <div v-for="i in 5" :key="i" class="skeleton-row" />
      </div>

      <div v-else-if="!categories.length" class="tree-empty">
        <FolderTree :size="34" style="opacity:.3;margin-bottom:10px;" />
        <div class="tree-empty-title">{{ t('inventory.categories.empty_title') }}</div>
        <div class="tree-empty-sub">{{ t('inventory.categories.empty_sub') }}</div>
        <button class="btn-primary" style="margin-top:14px;" @click="openNew()"><Plus :size="15" /> {{ t('inventory.categories.add_category') }}</button>
      </div>

      <!-- Mac-Finder-style Miller columns: each selection opens the column to its right. -->
      <div v-else class="miller" ref="millerEl">
        <div v-for="col in columns" :key="col.parentId || 'root'" class="mcol">
          <div class="mcol-head">
            {{ col.parentId ? (byId[col.parentId]?.name || '') : t('inventory.categories.title') }}
          </div>

          <div class="mcol-body">
            <!-- sub-categories (folders) -->
            <button
              v-for="cat in col.cats"
              :key="cat.id"
              class="mrow"
              :class="{ active: path[col.idx] === cat.id }"
              @click="selectCategory(cat, col.idx)"
            >
              <Tag :size="14" class="mrow-icon cat" />
              <span class="mrow-name">{{ cat.name }}</span>
              <span class="mrow-actions">
                <span class="row-action" :title="t('common.edit')" @click.stop="openEdit(cat)"><Pencil :size="12" /></span>
                <span class="row-action danger" :title="t('common.delete')" @click.stop="del(cat)"><Trash2 :size="12" /></span>
              </span>
              <ChevronRight :size="14" class="mrow-caret" />
            </button>

            <!-- this column's own products (files), under a divider -->
            <template v-if="col.parentId">
              <div v-if="col.cats.length && (loadingProducts.has(col.parentId) || (productsByCat[col.parentId]?.length))" class="mcol-divider">
                {{ t('inventory.categories.products_divider') }}
              </div>

              <div v-if="loadingProducts.has(col.parentId)" class="mcol-note">{{ t('inventory.categories.loading_products') }}</div>

              <button
                v-for="p in (productsByCat[col.parentId] || [])"
                :key="p.id"
                class="mrow product"
                :class="{ active: selectedProduct === p.id }"
                @click.stop="selectedProduct = p.id"
                @mouseenter="showTip($event, p)"
                @mouseleave="hideTip"
              >
                <Package :size="14" class="mrow-icon prod" />
                <span class="mrow-name">{{ p.name }}</span>
              </button>

              <!-- empty column -->
              <div
                v-if="!loadingProducts.has(col.parentId) && !col.cats.length && !(productsByCat[col.parentId]?.length)"
                class="mcol-note empty"
              >{{ t('inventory.categories.column_empty') }}</div>
            </template>
          </div>

          <!-- per-column add: a bucket at root, a sub-category inside an open category -->
          <button
            v-if="!col.parentId || col.idx < MAX_DEPTH"
            class="mcol-add"
            @click="col.parentId ? openNew(byId[col.parentId]) : openNew()"
          >
            <Plus :size="13" />
            {{ col.parentId ? t('inventory.categories.add_sub_here') : t('inventory.categories.add_category') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Hover-a-product → its attributes (active ingredient / brand / manufacturer …) -->
    <Teleport to="body">
      <div v-if="hover" class="prod-tip" :style="{ left: hover.x + 'px', top: hover.y + 'px' }">
        <div class="prod-tip-name">{{ hover.product.name }}</div>
        <template v-if="attrRows(hover.product).length">
          <div v-for="r in attrRows(hover.product)" :key="r.label" class="prod-tip-row">
            <span class="prod-tip-k">{{ r.label }}</span>
            <span class="prod-tip-v">{{ r.value }}</span>
          </div>
        </template>
        <div v-else class="prod-tip-empty">{{ t('inventory.categories.no_attributes') }}</div>
      </div>
    </Teleport>

    <!-- Add / Edit -->
    <AppModal :open="modal.open" :title="modal.id ? t('inventory.categories.modal_edit_title') : t('inventory.categories.modal_new_title')" @close="closeModal">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">{{ t('inventory.categories.name_label') }}</label>
          <input
            v-model="modal.name"
            class="form-input"
            :placeholder="t('inventory.categories.name_placeholder')"
            @keyup.enter="save"
          />
        </div>
        <div>
          <label class="form-label">{{ t('inventory.categories.parent_label') }}</label>
          <select v-model="modal.parent" class="form-input">
            <option :value="null">{{ t('inventory.categories.parent_none') }}</option>
            <option v-for="opt in parentOptions" :key="opt.id" :value="opt.id">
              {{ opt.path }}
            </option>
          </select>
          <p class="field-hint">{{ t('inventory.categories.parent_hint', { max: MAX_DEPTH }) }}</p>
        </div>
        <p v-if="error" class="form-error">{{ error }}</p>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="closeModal">{{ t('common.cancel') }}</button>
        <button class="btn-primary" :disabled="!modal.name.trim() || saving" @click="save">
          {{ saving ? t('common.saving') : (modal.id ? t('inventory.categories.save_changes') : t('inventory.categories.add_category_btn')) }}
        </button>
      </template>
    </AppModal>

    <!-- Delete a non-empty category: move up vs purge -->
    <AppModal :open="resolve.open" :title="t('inventory.categories.resolve_title', { name: resolve.name })" width="470px" @close="closeResolve">
      <div v-if="resolve.step === 'choose'" style="display:flex;flex-direction:column;gap:12px;">
        <p class="resolve-summary">
          {{ t('inventory.categories.not_empty_summary', { name: resolve.name, contents: resolveContents }) }}
        </p>
        <button class="resolve-opt" :disabled="busy" @click="doMove">
          <CornerUpLeft :size="17" />
          <span class="resolve-opt-text">
            <span class="resolve-opt-title">{{ t('inventory.categories.move_up_title', { parent: resolve.parent ? resolve.parent.name : t('inventory.categories.uncategorized') }) }}</span>
            <span class="resolve-opt-sub">{{ t('inventory.categories.move_up_sub') }}</span>
          </span>
        </button>
        <button class="resolve-opt danger" :disabled="busy" @click="resolve.step = 'purge'">
          <Trash2 :size="17" />
          <span class="resolve-opt-text">
            <span class="resolve-opt-title">{{ t('inventory.categories.delete_all_title') }}</span>
            <span class="resolve-opt-sub">{{ t('inventory.categories.delete_all_sub') }}</span>
          </span>
        </button>
        <p v-if="error" class="form-error">{{ error }}</p>
      </div>

      <div v-else style="display:flex;flex-direction:column;gap:13px;">
        <p class="resolve-summary">
          {{ t('inventory.categories.purge_summary', { contents: resolveContents }) }}
        </p>
        <div>
          <label class="form-label">{{ t('inventory.categories.reason_label') }}</label>
          <select v-model="resolve.reason" class="form-input">
            <option value="DISCONTINUED">{{ t('inventory.categories.reason_discontinued') }}</option>
            <option value="DUPLICATE">{{ t('inventory.categories.reason_duplicate') }}</option>
            <option value="MISTAKE">{{ t('inventory.categories.reason_mistake') }}</option>
            <option value="OTHER">{{ t('inventory.categories.reason_other') }}</option>
          </select>
        </div>
        <div>
          <label class="form-label">{{ t('inventory.categories.note_label') }}</label>
          <input v-model="resolve.note" class="form-input" :placeholder="t('inventory.categories.note_placeholder')" />
        </div>
        <p v-if="error" class="form-error">{{ error }}</p>
      </div>

      <template #footer>
        <template v-if="resolve.step === 'choose'">
          <button class="btn-ghost" @click="closeResolve">{{ t('common.cancel') }}</button>
        </template>
        <template v-else>
          <button class="btn-ghost" @click="resolve.step = 'choose'; resolve.confirming = false">{{ t('common.back') }}</button>
          <button class="btn-danger" :disabled="busy" @click="doPurge">
            {{ busy ? t('inventory.categories.deleting') : (resolve.confirming ? t('inventory.categories.confirm_delete') : t('inventory.categories.delete_with_items')) }}
          </button>
        </template>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Pencil, Trash2, Tag, Package, FolderTree, ChevronRight, CornerUpLeft } from 'lucide-vue-next'
import api from '@/api/axios'
import { useCtrlN } from '@/composables/useCtrlN'
useCtrlN(openNew)
import AppModal from '@/components/ui/AppModal.vue'

const { t } = useI18n()
const MAX_DEPTH = 4

const categories = ref([])
const loading    = ref(true)
const saving     = ref(false)
const error      = ref('')

// --- Miller-column state -------------------------------------------------
const path            = ref([])              // selected category id per column (col 0 = root buckets)
const productsByCat   = reactive({})         // category id -> product[] (cached)
const loadingProducts = ref(new Set())
const selectedProduct = ref(null)
const millerEl        = ref(null)

// --- product hover tooltip (Step C) --------------------------------------
const attrLabels = ref({})       // attribute key -> display name (per-store)
const hover      = ref(null)     // { product, x, y }
// Show the pharmacy-relevant attributes first, then anything else.
const ATTR_ORDER = ['active_ing', 'active_ing_ar', 'brand', 'brand_ar', 'manufacturer']

async function loadAttrLabels() {
  try {
    const res = await api.get('/api/inventory/attributes/')
    const m = {}
    for (const a of (res.data.results ?? res.data)) m[a.key] = a.name
    attrLabels.value = m
  } catch { /* labels fall back to the prettified key */ }
}

function attrRows(p) {
  const s = p.attributes_summary || {}
  return Object.keys(s)
    .filter(k => s[k] && s[k].length)
    .sort((a, b) => {
      const ia = ATTR_ORDER.indexOf(a), ib = ATTR_ORDER.indexOf(b)
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b)
    })
    .map(k => ({
      label: attrLabels.value[k] || k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      value: s[k].join(', '),
    }))
}

function showTip(e, p) {
  const r = e.currentTarget.getBoundingClientRect()
  const W = 240
  let x = r.right + 8
  if (x + W > window.innerWidth) x = Math.max(8, r.left - W - 8)  // flip left if no room
  hover.value = { product: p, x, y: r.top }
}
function hideTip() { hover.value = null }

// --- load ----------------------------------------------------------------
async function load() {
  loading.value = true
  try {
    const res = await api.get('/api/inventory/categories/')
    categories.value = res.data.results ?? res.data
  } finally {
    loading.value = false
  }
  // drop any open columns whose category no longer exists, then refresh their products
  path.value = path.value.filter(id => byId.value[id])
  for (const k of Object.keys(productsByCat)) delete productsByCat[k]
  path.value.forEach(id => ensureProducts(id))
}
onMounted(load)
onMounted(loadAttrLabels)

// --- tree helpers --------------------------------------------------------
const byId = computed(() => {
  const m = {}
  for (const c of categories.value) m[c.id] = c
  return m
})
const childrenMap = computed(() => {
  const m = {}
  for (const c of [...categories.value].sort((a, b) => a.name.localeCompare(b.name))) {
    const key = c.parent ?? 'root'
    ;(m[key] ||= []).push(c)
  }
  return m
})

function depthOf(id) {            // 0-based depth (root = 0)
  let d = 0, node = byId.value[id]
  while (node && node.parent && d < 50) { d++; node = byId.value[node.parent] }
  return d
}
function descendantIds(id) {
  const out = new Set()
  const walk = (pid) => { for (const c of (childrenMap.value[pid] || [])) { out.add(c.id); walk(c.id) } }
  walk(id)
  return out
}
function subtreeHeight(id) {
  const kids = childrenMap.value[id] || []
  return kids.length ? 1 + Math.max(...kids.map(c => subtreeHeight(c.id))) : 0
}
function pathOf(id) {             // "Electronics > Computers"
  const parts = []
  let node = byId.value[id], guard = 0
  while (node && guard < 50) { parts.unshift(node.name); node = byId.value[node.parent]; guard++ }
  return parts.join(' > ')
}

// Columns: col 0 = root buckets; each selected category opens a column of ITS contents.
const columns = computed(() => {
  const cols = [{ idx: 0, parentId: null, cats: childrenMap.value['root'] || [] }]
  path.value.forEach((catId, i) => {
    cols.push({ idx: i + 1, parentId: catId, cats: childrenMap.value[catId] || [] })
  })
  return cols
})

function ensureProducts(catId) {
  if (productsByCat[catId] !== undefined || loadingProducts.value.has(catId)) return
  const next = new Set(loadingProducts.value); next.add(catId); loadingProducts.value = next
  api.get('/api/inventory/products/', { params: { category: catId } })
    .then(res => { productsByCat[catId] = res.data.results ?? res.data })
    .catch(() => { productsByCat[catId] = [] })
    .finally(() => {
      const n = new Set(loadingProducts.value); n.delete(catId); loadingProducts.value = n
    })
}

function selectCategory(cat, colIdx) {
  path.value = [...path.value.slice(0, colIdx), cat.id]
  selectedProduct.value = null
  ensureProducts(cat.id)
  nextTick(() => {
    if (millerEl.value) millerEl.value.scrollLeft = millerEl.value.scrollWidth
  })
}

// Valid parents for the modal — no self, no descendants, no depth overflow.
const parentOptions = computed(() => {
  const editingId = modal.id
  const banned = editingId ? descendantIds(editingId) : new Set()
  const ownHeight = editingId ? subtreeHeight(editingId) : 0
  return categories.value
    .filter(c => c.id !== editingId && !banned.has(c.id))
    // candidate tier (1-based) + this node + its subtree must stay within MAX_DEPTH
    .filter(c => (depthOf(c.id) + 1) + 1 + ownHeight <= MAX_DEPTH)
    .map(c => ({ id: c.id, path: pathOf(c.id) }))
    .sort((a, b) => a.path.localeCompare(b.path))
})

// --- modal ---------------------------------------------------------------
const modal = reactive({ open: false, id: null, name: '', parent: null })

function openNew(parentRow = null) {
  error.value = ''
  Object.assign(modal, { open: true, id: null, name: '', parent: parentRow ? parentRow.id : null })
}
function openEdit(row) {
  error.value = ''
  Object.assign(modal, { open: true, id: row.id, name: row.name, parent: row.parent ?? null })
}
function closeModal() { modal.open = false }

async function save() {
  if (!modal.name.trim()) return
  saving.value = true
  error.value = ''
  try {
    const payload = { name: modal.name.trim(), parent: modal.parent || null }
    modal.id
      ? await api.patch(`/api/inventory/categories/${modal.id}/`, payload)
      : await api.post('/api/inventory/categories/', payload)
    closeModal()
    await load()
  } catch (e) {
    const d = e.response?.data
    error.value = d?.parent?.[0] || d?.detail || (d ? JSON.stringify(d) : t('inventory.categories.err_save'))
  } finally {
    saving.value = false
  }
}

// --- delete flow: probe contents, then either a plain delete (empty) or the
//     move-vs-purge modal (has products / sub-categories). -------------------
const busy = ref(false)
const resolve = reactive({
  open: false, id: null, name: '', parent: null,
  productCount: 0, subcatCount: 0, step: 'choose', reason: 'DISCONTINUED', note: '', confirming: false,
})
function closeResolve() { resolve.open = false }

// "{n} products and {m} sub-categories" — built so both locales interpolate cleanly.
const resolveContents = computed(() => {
  let s = t('inventory.categories.product_count', { count: resolve.productCount }, resolve.productCount)
  if (resolve.subcatCount) s += t('inventory.categories.subcat_frag', { count: resolve.subcatCount }, resolve.subcatCount)
  return s
})

async function del(row) {
  error.value = ''
  let contents
  try {
    contents = (await api.get(`/api/inventory/categories/${row.id}/contents/`)).data
  } catch { alert(t('inventory.categories.err_check_contents')); return }

  if (contents.product_count === 0 && contents.subcategory_count === 0) {
    if (!confirm(t('inventory.categories.confirm_delete_simple', { name: row.name }))) return
    try { await api.delete(`/api/inventory/categories/${row.id}/`); await load() }
    catch (e) { alert(e.response?.data?.detail || t('inventory.categories.err_delete')) }
    return
  }
  Object.assign(resolve, {
    open: true, id: row.id, name: row.name, parent: contents.parent,
    productCount: contents.product_count, subcatCount: contents.subcategory_count,
    step: 'choose', reason: 'DISCONTINUED', note: '', confirming: false,
  })
}

async function doMove() {
  busy.value = true; error.value = ''
  try {
    await api.post(`/api/inventory/categories/${resolve.id}/resolve-delete/`, { mode: 'move' })
    closeResolve(); await load()
  } catch (e) { error.value = e.response?.data?.detail || t('inventory.categories.err_move') }
  finally { busy.value = false }
}

async function doPurge() {
  if (!resolve.confirming) { resolve.confirming = true; return }   // second click required
  busy.value = true; error.value = ''
  try {
    await api.post(`/api/inventory/categories/${resolve.id}/resolve-delete/`,
      { mode: 'purge', reason: resolve.reason, note: resolve.note })
    closeResolve(); await load()
  } catch (e) {
    error.value = e.response?.data?.reason?.[0] || e.response?.data?.detail || t('inventory.categories.err_purge')
    resolve.confirming = false
  } finally { busy.value = false }
}
</script>

<style scoped>
.miller-wrap { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }

/* Mac-Finder columns: horizontal strip, each column scrolls vertically. */
.miller       { display:flex; overflow-x:auto; min-height:440px; }
.mcol         { flex:0 0 248px; display:flex; flex-direction:column; border-right:1px solid var(--border); min-height:440px; }
.mcol:last-child { border-right:none; }

.mcol-head    { padding:9px 14px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); background:var(--bg-app); border-bottom:1px solid var(--border); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.mcol-body    { flex:1; overflow-y:auto; padding:5px 0; }

.mrow         { width:100%; display:flex; align-items:center; gap:8px; padding:7px 10px 7px 13px; border:none; background:none; cursor:pointer; text-align:left; transition:background 90ms; }
.mrow:hover   { background:var(--bg-app); }
.mrow.active  { background:var(--accent-soft, var(--bg-app)); }
.mrow.active .mrow-name { color:var(--accent); }
.mrow-icon.cat  { color:var(--accent); flex-shrink:0; }
.mrow-icon.prod { color:var(--text-muted); flex-shrink:0; }
.mrow-name    { font-size:13px; font-weight:600; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; flex:1; }
.mrow.product .mrow-name { font-weight:500; }
.mrow-caret   { color:var(--text-muted); flex-shrink:0; opacity:.55; }
.mrow.active .mrow-caret { color:var(--accent); opacity:1; }

.mrow-actions { display:flex; gap:1px; opacity:0; transition:opacity 90ms; flex-shrink:0; }
.mrow:hover .mrow-actions { opacity:1; }
.row-action   { width:24px; height:24px; border:none; background:none; border-radius:6px; cursor:pointer; color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; transition:background 90ms,color 90ms; }
.row-action:hover { background:var(--border); color:var(--text-primary); }
.row-action.danger:hover { background:var(--danger-soft); color:var(--danger); }

.mcol-divider { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); padding:9px 13px 4px; }
.mcol-note    { font-size:12px; color:var(--text-muted); padding:8px 13px; }
.mcol-note.empty { padding:18px 13px; text-align:center; font-style:italic; opacity:.8; }

.mcol-add     { display:flex; align-items:center; gap:6px; width:100%; padding:8px 13px; border:none; border-top:1px solid var(--border); background:none; cursor:pointer; font-size:12px; font-weight:600; color:var(--text-muted); transition:background 90ms,color 90ms; }
.mcol-add:hover { background:var(--bg-app); color:var(--accent); }

/* Hover-a-product attribute tooltip (teleported to body so columns don't clip it). */
.prod-tip { position:fixed; z-index:9999; width:230px; max-height:300px; overflow:hidden; background:var(--bg-card); border:1px solid var(--border); border-radius:10px; box-shadow:0 12px 32px rgba(0,0,0,.20); padding:10px 12px; pointer-events:none; animation:tipIn 110ms ease both; }
@keyframes tipIn { from { opacity:0; transform:translateY(3px); } to { opacity:1; transform:translateY(0); } }
.prod-tip-name { font-size:12.5px; font-weight:700; color:var(--text-primary); margin-bottom:7px; border-bottom:1px solid var(--border); padding-bottom:6px; }
.prod-tip-row  { display:flex; justify-content:space-between; gap:12px; padding:3px 0; font-size:11.5px; }
.prod-tip-k    { color:var(--text-muted); white-space:nowrap; }
.prod-tip-v    { color:var(--text-primary); text-align:right; font-weight:500; word-break:break-word; }
.prod-tip-empty { font-size:11.5px; color:var(--text-muted); font-style:italic; }

.tree-empty  { text-align:center; padding:56px 20px; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; }
.tree-empty-title { font-size:15px; font-weight:700; color:var(--text-secondary); }
.tree-empty-sub   { font-size:12.5px; margin-top:3px; }

.table-skeleton { padding:8px 0; }
.skeleton-row { height:40px; margin:4px 16px; border-radius:6px; background:linear-gradient(90deg,var(--border) 25%,var(--bg-app) 50%,var(--border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position:-200% 0; } }

.form-input  { width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; box-sizing:border-box; transition:border-color 120ms; }
.form-input:focus { border-color:var(--accent); }
.field-hint  { font-size:11.5px; color:var(--text-muted); margin:5px 0 0; }
.form-error  { font-size:12.5px; color:var(--danger); margin:0; }

.resolve-summary { font-size:13px; color:var(--text-secondary); margin:0; line-height:1.5; }
.resolve-opt { display:flex; align-items:flex-start; gap:11px; text-align:left; width:100%; padding:12px 13px; border:1px solid var(--border); border-radius:10px; background:var(--bg-app); color:var(--text-primary); cursor:pointer; transition:border-color 120ms, background 120ms, transform 70ms; }
.resolve-opt:hover  { border-color:var(--accent); }
.resolve-opt:active { transform:scale(0.99); }
.resolve-opt:disabled { opacity:.5; cursor:default; }
.resolve-opt.danger { color:var(--danger); }
.resolve-opt.danger:hover { border-color:var(--danger); background:var(--danger-soft); }
.resolve-opt-text  { display:flex; flex-direction:column; gap:2px; }
.resolve-opt-title { font-size:13px; font-weight:700; }
.resolve-opt-sub   { font-size:11.5px; color:var(--text-muted); font-weight:400; }
</style>
