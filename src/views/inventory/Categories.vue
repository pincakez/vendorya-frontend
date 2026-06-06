<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Categories</h1>
        <p class="page-sub">Organize your products into a tree — up to {{ MAX_DEPTH }} levels deep</p>
      </div>
      <button class="btn-primary" @click="openNew()"><Plus :size="15" /> Add Category</button>
    </div>

    <div class="table-wrap" style="margin-top:20px;">
      <div v-if="loading" class="table-skeleton">
        <div v-for="i in 5" :key="i" class="skeleton-row" />
      </div>

      <div v-else-if="!categories.length" class="tree-empty">
        <FolderTree :size="34" style="opacity:.3;margin-bottom:10px;" />
        <div class="tree-empty-title">No categories yet</div>
        <div class="tree-empty-sub">Create your first one to start organizing products.</div>
        <button class="btn-primary" style="margin-top:14px;" @click="openNew()"><Plus :size="15" /> Add Category</button>
      </div>

      <div v-else class="tree">
        <div
          v-for="row in rows"
          :key="row.id"
          class="tree-row"
          :style="{ paddingLeft: (12 + row.depth * 22) + 'px' }"
        >
          <button
            class="tree-caret"
            :class="{ invisible: !row.hasChildren }"
            @click="toggle(row.id)"
          >
            <ChevronDown v-if="!collapsed.has(row.id)" :size="15" />
            <ChevronRight v-else :size="15" />
          </button>

          <Tag :size="14" class="tree-icon" />
          <span class="tree-name">{{ row.name }}</span>
          <span class="tree-tier">tier {{ row.depth + 1 }}</span>

          <div class="tree-actions">
            <button
              v-if="row.depth + 1 < MAX_DEPTH"
              class="row-action"
              title="Add sub-category"
              @click="openNew(row)"
            ><CornerDownRight :size="13" /></button>
            <button class="row-action" title="Edit" @click="openEdit(row)"><Pencil :size="13" /></button>
            <button class="row-action danger" title="Delete" @click="del(row)"><Trash2 :size="13" /></button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add / Edit -->
    <AppModal :open="modal.open" :title="modal.id ? 'Edit Category' : 'New Category'" @close="closeModal">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">Name</label>
          <input
            v-model="modal.name"
            class="form-input"
            placeholder="e.g. Laptops"
            @keyup.enter="save"
          />
        </div>
        <div>
          <label class="form-label">Parent category</label>
          <select v-model="modal.parent" class="form-input">
            <option :value="null">— None (top level) —</option>
            <option v-for="opt in parentOptions" :key="opt.id" :value="opt.id">
              {{ opt.path }}
            </option>
          </select>
          <p class="field-hint">Leave as “None” for a main category. Max {{ MAX_DEPTH }} levels deep.</p>
        </div>
        <p v-if="error" class="form-error">{{ error }}</p>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="closeModal">Cancel</button>
        <button class="btn-primary" :disabled="!modal.name.trim() || saving" @click="save">
          {{ saving ? 'Saving…' : (modal.id ? 'Save Changes' : 'Add Category') }}
        </button>
      </template>
    </AppModal>

    <!-- Delete a non-empty category: move up vs purge -->
    <AppModal :open="resolve.open" :title="`Delete “${resolve.name}”`" width="470px" @close="closeResolve">
      <div v-if="resolve.step === 'choose'" style="display:flex;flex-direction:column;gap:12px;">
        <p class="resolve-summary">
          <strong>{{ resolve.name }}</strong> isn’t empty — it holds
          <strong>{{ resolve.productCount }}</strong> product{{ resolve.productCount === 1 ? '' : 's' }}<template v-if="resolve.subcatCount"> and <strong>{{ resolve.subcatCount }}</strong> sub-categor{{ resolve.subcatCount === 1 ? 'y' : 'ies' }}</template>. What should happen to them?
        </p>
        <button class="resolve-opt" :disabled="busy" @click="doMove">
          <CornerUpLeft :size="17" />
          <span class="resolve-opt-text">
            <span class="resolve-opt-title">Move contents up to {{ resolve.parent ? resolve.parent.name : 'Uncategorized' }}</span>
            <span class="resolve-opt-sub">Keeps everything — just re-tags one level up. No stock change.</span>
          </span>
        </button>
        <button class="resolve-opt danger" :disabled="busy" @click="resolve.step = 'purge'">
          <Trash2 :size="17" />
          <span class="resolve-opt-text">
            <span class="resolve-opt-title">Delete it and everything inside</span>
            <span class="resolve-opt-sub">Removes the products too — a stock write-off, so a reason is required.</span>
          </span>
        </button>
        <p v-if="error" class="form-error">{{ error }}</p>
      </div>

      <div v-else style="display:flex;flex-direction:column;gap:13px;">
        <p class="resolve-summary">
          About to delete <strong>{{ resolve.productCount }}</strong> product{{ resolve.productCount === 1 ? '' : 's' }}<template v-if="resolve.subcatCount"> and <strong>{{ resolve.subcatCount }}</strong> sub-categor{{ resolve.subcatCount === 1 ? 'y' : 'ies' }}</template>. They move to Trash and stay restorable.
        </p>
        <div>
          <label class="form-label">Reason</label>
          <select v-model="resolve.reason" class="form-input">
            <option value="DISCONTINUED">Discontinued</option>
            <option value="DUPLICATE">Duplicate</option>
            <option value="MISTAKE">Created by mistake</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
        <div>
          <label class="form-label">Note (optional)</label>
          <input v-model="resolve.note" class="form-input" placeholder="Add context…" />
        </div>
        <p v-if="error" class="form-error">{{ error }}</p>
      </div>

      <template #footer>
        <template v-if="resolve.step === 'choose'">
          <button class="btn-ghost" @click="closeResolve">Cancel</button>
        </template>
        <template v-else>
          <button class="btn-ghost" @click="resolve.step = 'choose'; resolve.confirming = false">Back</button>
          <button class="btn-danger" :disabled="busy" @click="doPurge">
            {{ busy ? 'Deleting…' : (resolve.confirming ? 'Tap again to confirm delete' : 'Delete with items') }}
          </button>
        </template>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Pencil, Trash2, Tag, FolderTree, ChevronRight, ChevronDown, CornerDownRight, CornerUpLeft } from 'lucide-vue-next'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'

const MAX_DEPTH = 4

const categories = ref([])
const loading    = ref(true)
const saving     = ref(false)
const error      = ref('')
const collapsed  = ref(new Set())

// --- load ----------------------------------------------------------------
async function load() {
  loading.value = true
  try {
    const res = await api.get('/api/inventory/categories/')
    categories.value = res.data.results ?? res.data
  } finally {
    loading.value = false
  }
}
onMounted(load)

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

// Flattened, expand-aware rows for rendering.
const rows = computed(() => {
  const out = []
  const walk = (key, depth) => {
    for (const c of (childrenMap.value[key] || [])) {
      const hasChildren = (childrenMap.value[c.id] || []).length > 0
      out.push({ id: c.id, name: c.name, parent: c.parent, depth, hasChildren })
      if (hasChildren && !collapsed.value.has(c.id)) walk(c.id, depth + 1)
    }
  }
  walk('root', 0)
  return out
})

function toggle(id) {
  const next = new Set(collapsed.value)
  next.has(id) ? next.delete(id) : next.add(id)
  collapsed.value = next
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
    error.value = d?.parent?.[0] || d?.detail || (d ? JSON.stringify(d) : 'Could not save category.')
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

async function del(row) {
  error.value = ''
  let contents
  try {
    contents = (await api.get(`/api/inventory/categories/${row.id}/contents/`)).data
  } catch { alert('Could not check what this category contains.'); return }

  if (contents.product_count === 0 && contents.subcategory_count === 0) {
    if (!confirm(`Delete “${row.name}”?`)) return
    try { await api.delete(`/api/inventory/categories/${row.id}/`); await load() }
    catch (e) { alert(e.response?.data?.detail || 'Could not delete category.') }
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
  } catch (e) { error.value = e.response?.data?.detail || 'Could not move contents.' }
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
    error.value = e.response?.data?.reason?.[0] || e.response?.data?.detail || 'Could not delete.'
    resolve.confirming = false
  } finally { busy.value = false }
}
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:12px; }
.page-title  { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub    { font-size:13px; color:var(--text-muted); margin:2px 0 0; }

.table-wrap  { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }

.tree        { padding:6px 0; }
.tree-row    { display:flex; align-items:center; gap:8px; padding:7px 14px 7px 0; border-bottom:1px solid var(--border); transition:background 100ms; }
.tree-row:last-child { border-bottom:none; }
.tree-row:hover { background:var(--bg-app); }

.tree-caret  { width:20px; height:20px; flex-shrink:0; border:none; background:none; cursor:pointer; color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; border-radius:5px; }
.tree-caret:hover { background:var(--border); color:var(--text-primary); }
.tree-caret.invisible { visibility:hidden; cursor:default; }

.tree-icon   { color:var(--accent); flex-shrink:0; }
.tree-name   { font-size:13.5px; font-weight:600; color:var(--text-primary); }
.tree-tier   { font-size:10.5px; font-weight:600; text-transform:uppercase; letter-spacing:.04em; color:var(--text-muted); background:var(--bg-app); border:1px solid var(--border); padding:1px 6px; border-radius:10px; }

.tree-actions { margin-left:auto; display:flex; gap:2px; opacity:0; transition:opacity 100ms; padding-right:6px; }
.tree-row:hover .tree-actions { opacity:1; }
.row-action  { width:28px; height:28px; border:none; background:none; border-radius:6px; cursor:pointer; color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; transition:background 100ms,color 100ms; }
.row-action:hover { background:var(--border); color:var(--text-primary); }
.row-action.danger:hover { background:#fef2f2; color:#dc2626; }

.tree-empty  { text-align:center; padding:56px 20px; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; }
.tree-empty-title { font-size:15px; font-weight:700; color:var(--text-secondary); }
.tree-empty-sub   { font-size:12.5px; margin-top:3px; }

.table-skeleton { padding:8px 0; }
.skeleton-row { height:40px; margin:4px 16px; border-radius:6px; background:linear-gradient(90deg,var(--border) 25%,var(--bg-app) 50%,var(--border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position:-200% 0; } }

.form-label  { display:block; font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.form-input  { width:100%; padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; box-sizing:border-box; transition:border-color 120ms; }
.form-input:focus { border-color:var(--accent); }
.field-hint  { font-size:11.5px; color:var(--text-muted); margin:5px 0 0; }
.form-error  { font-size:12.5px; color:#dc2626; margin:0; }

.btn-ghost   { display:inline-flex; align-items:center; gap:5px; padding:7px 12px; border-radius:8px; font-size:13px; font-weight:500; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; transition:background 100ms,color 100ms,transform 70ms; }
.btn-ghost:hover  { background:var(--border); color:var(--text-primary); }
.btn-ghost:active { transform:scale(0.95); }
.btn-primary { display:inline-flex; align-items:center; gap:5px; padding:8px 16px; border-radius:8px; font-size:13px; font-weight:600; border:none; background:var(--accent); color:#fff; cursor:pointer; transition:background 100ms,transform 70ms,opacity 100ms; }
.btn-primary:hover    { background:var(--accent-hover); }
.btn-primary:active   { transform:scale(0.95); }
.btn-primary:disabled { opacity:.5; cursor:default; }
.btn-danger  { display:inline-flex; align-items:center; gap:5px; padding:8px 16px; border-radius:8px; font-size:13px; font-weight:600; border:none; background:#dc2626; color:#fff; cursor:pointer; transition:background 100ms,transform 70ms,opacity 100ms; }
.btn-danger:hover    { background:#b91c1c; }
.btn-danger:active   { transform:scale(0.95); }
.btn-danger:disabled { opacity:.6; cursor:default; }

.resolve-summary { font-size:13px; color:var(--text-secondary); margin:0; line-height:1.5; }
.resolve-opt { display:flex; align-items:flex-start; gap:11px; text-align:left; width:100%; padding:12px 13px; border:1px solid var(--border); border-radius:10px; background:var(--bg-app); color:var(--text-primary); cursor:pointer; transition:border-color 120ms, background 120ms, transform 70ms; }
.resolve-opt:hover  { border-color:var(--accent); }
.resolve-opt:active { transform:scale(0.99); }
.resolve-opt:disabled { opacity:.5; cursor:default; }
.resolve-opt.danger { color:#dc2626; }
.resolve-opt.danger:hover { border-color:#dc2626; background:#fef2f2; }
.resolve-opt-text  { display:flex; flex-direction:column; gap:2px; }
.resolve-opt-title { font-size:13px; font-weight:700; }
.resolve-opt-sub   { font-size:11.5px; color:var(--text-muted); font-weight:400; }
</style>
