<template>
  <Teleport to="body">
    <div v-if="colDragMoved && colDragKey" class="col-drag-ghost" :style="{ left: colGhostX + 'px', top: colGhostY + 'px' }">
      {{ colByKey[colDragKey]?.label }}
    </div>
  </Teleport>
  <div class="inv">
    <!-- ── NON-STICKY: title + tabs (scroll away) ── -->
    <div class="inv-head">
      <h1 class="inv-title">Inventory</h1>
      <p class="inv-sub">Manage products, stock, categories, and suppliers</p>
    </div>

    <div class="tab-bar">
      <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
        <component :is="tab.icon" :size="15" /> {{ tab.label }}
      </button>
    </div>

    <!-- ═══════════ PRODUCTS TAB ═══════════ -->
    <div v-if="activeTab === 'products'">
      <!-- STICKY toolbar: search + category quick-filter + Filter -->
      <div class="dt-toolbar" ref="toolbarRef">
        <div class="dt-search">
          <Search :size="15" class="dt-search-icon" />
          <input v-model="search" class="dt-search-input" placeholder="Search by name, SKU…" @input="debouncedFetch" />
          <button v-show="search" class="dt-x" @click="clearSearch"><X :size="13" /></button>
        </div>

        <div class="cat-slider">
          <button v-if="cats.length > catWindow" class="cat-nav" :disabled="catStart === 0" @click="catScroll(-1)"><ChevronLeft :size="18" /></button>
          <div class="cat-track">
            <button
              v-for="c in visibleCats" :key="c.id ?? 'all'"
              class="cat-pill" :class="{ active: activeCatId === c.id }"
              @click="setCat(c.id)"
            >{{ c.name }}</button>
          </div>
          <button v-if="cats.length > catWindow" class="cat-nav" :disabled="catStart >= catMax" @click="catScroll(1)"><ChevronRight :size="18" /></button>
        </div>

        <button v-if="hasAdhoc && !editing" class="dt-filter" title="Reset to assigned layout" @click="resetLayout">
          <RotateCcw :size="14" />
        </button>
        <button class="dt-filter" :class="{ on: showFilters }" @click="showFilters = !showFilters">
          <Filter :size="14" /> Filter
        </button>
        <button v-if="canEdit && !editing" class="dt-filter" @click="enterEdit">
          <Columns3 :size="14" /> Customize
        </button>
        <button v-if="canEdit && !editing" class="dt-filter" :class="{ on: bulkMode }" @click="toggleBulk">
          <CheckSquare :size="14" /> Bulk
        </button>
        <button v-if="canEdit && !editing" class="dt-filter" title="Assign layouts to staff" @click="openAssign">
          <UserCog :size="14" />
        </button>
        <button v-if="!editing" class="dt-add" @click="openAddProduct">
          <Plus :size="15" /> Add Product
        </button>
      </div>

      <!-- EDIT MODE — column chooser -->
      <Transition name="edit-slide">
      <div v-if="editing" class="edit-panel">
        <div class="edit-head">
          <span class="edit-title"><Columns3 :size="15" /> Customize columns</span>
          <div class="edit-actions">
            <select v-if="presets.length" class="edit-select" @change="(e) => { const p = presets.find(x => x.id === e.target.value); if (p) loadPreset(p); e.target.value = '' }">
              <option value="">Load preset…</option>
              <option v-for="p in presets" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <button class="btn-ghost" @click="resetWorking">Reset</button>
            <button class="btn-ghost" @click="cancelEdit">Cancel</button>
            <button class="btn-ghost" @click="saveModal.open = true">Save preset</button>
            <button class="btn-primary" @click="doneEdit">Done</button>
          </div>
        </div>
        <p class="edit-hint">Drag to reorder · uncheck to hide · SKU and Product are locked.</p>
        <div class="chooser">
          <div
            v-for="(key, idx) in working.order" :key="key" class="chooser-row"
            :class="{ disabled: !permittedKeys.includes(key), 'drag-over': dragOver === key && dragKey !== key }"
            @pointerenter="dragOver = key"
          >
            <GripVertical :size="14" class="chooser-grip" @pointerdown.prevent="startDrag(key, $event)" />
            <input
              type="checkbox" class="chooser-cb"
              :checked="!working.hidden.includes(key)"
              :disabled="LOCKED.includes(key) || !permittedKeys.includes(key)"
              @change="toggleHidden(key)"
            />
            <span class="chooser-label">{{ colByKey[key].label }}</span>
            <Lock v-if="LOCKED.includes(key)" :size="12" class="chooser-tag" />
            <span v-else-if="!permittedKeys.includes(key)" class="chooser-na">hidden by role</span>
            <span class="chooser-move">
              <button class="chooser-mv" :disabled="idx === 0" title="Move up" @click="moveCol(key, -1)"><ChevronUp :size="14" /></button>
              <button class="chooser-mv" :disabled="idx === working.order.length - 1" title="Move down" @click="moveCol(key, 1)"><ChevronDown :size="14" /></button>
            </span>
          </div>
        </div>
      </div>
      </Transition>

      <!-- optional advanced (attribute) filters -->
      <div v-if="showFilters && filterableAttrs.length" class="dt-filterpanel">
        <select v-for="attr in filterableAttrs" :key="attr.id" v-model="attrFilters[attr.key]" class="form-input filter-select" @change="fetchProducts(1)">
          <option value="">{{ attr.name }}</option>
          <option v-for="opt in attr.options" :key="opt" :value="opt">{{ opt }}</option>
        </select>
        <button class="btn-ghost" @click="clearFilters"><X :size="13" /> Clear</button>
      </div>

      <!-- BULK ACTION BAR -->
      <Transition name="edit-slide">
        <div v-if="bulkMode" class="bulk-bar">
          <span class="bulk-count">{{ selectedCount }} selected</span>
          <div class="bulk-actions">
            <button class="btn-ghost" :disabled="!selectedCount || bulkBusy" @click="doBulkGhost(true)"><EyeOff :size="14" /> Ghost</button>
            <button class="btn-ghost" :disabled="!selectedCount || bulkBusy" @click="doBulkGhost(false)"><Eye :size="14" /> Un-ghost</button>
            <button class="btn-ghost" :disabled="!selectedCount || bulkBusy" @click="openBulkEdit"><Pencil :size="14" /> Edit</button>
            <button class="btn-ghost danger" :disabled="!selectedCount || bulkBusy" @click="openBulkDelete"><Trash2 :size="14" /> Delete</button>
          </div>
          <button class="bulk-exit" title="Exit bulk mode" @click="toggleBulk"><X :size="15" /></button>
        </div>
      </Transition>

      <!-- TABLE -->
      <div class="dt-card" :class="{ editing }">
        <div class="dt-xscroll">
          <table class="dt" :style="{ minWidth: tableMin + 'px' }">
            <thead :style="{ top: theadTop + 'px' }">
              <tr>
                <th v-if="bulkMode" class="dt-th dt-selcol" :style="{ top: theadTop + 'px' }">
                  <input type="checkbox" class="dt-cb" :checked="allOnPageSelected" @change="toggleSelectAll" />
                </th>
                <th
                  v-for="col in displayColumns" :key="col.key"
                  class="dt-th"
                  :class="[
                    col.align === 'right' ? 'ta-right' : '',
                    col.sort ? 'sortable' : '',
                    colDragKey === col.key ? 'col-dragging' : '',
                    colDragOver === col.key && colDragKey !== col.key && colDragMoved ? 'col-drag-over' : ''
                  ]"
                  :style="{ width: colWidths[col.key] + 'px', top: theadTop + 'px' }"
                  @click="col.sort && handleSort(col)"
                  @pointerdown="startColDrag(col.key, $event)"
                  @pointerenter="colDragKey && (colDragOver = col.key)"
                >
                  <span class="dt-th-inner" :class="{ jend: col.align === 'right' }">
                    <component v-if="col.align === 'right'" :is="arrowFor(col)" :size="13" class="dt-arrow" :class="{ on: sortKey === col.key }" />
                    {{ col.label }}
                    <component v-if="col.align !== 'right'" :is="arrowFor(col)" :size="13" class="dt-arrow" :class="{ on: sortKey === col.key }" />
                  </span>
                  <span class="dt-resize" @mousedown.stop.prevent="startResize(col.key, $event)" @click.stop></span>
                </th>
                <th class="dt-th ta-right dt-actcol">Actions</th>
              </tr>
            </thead>

            <Transition :name="rowTransition" mode="out-in">
              <tbody :key="page">
                <tr v-for="p in products" :key="p.id" class="dt-row" :class="{ clickable: !editing, ghosted: p.hide_from_pos, selected: bulkMode && isSelected(p.id) }" @click="onRowClick(p)">
                  <td v-if="bulkMode" class="dt-selcol" @click.stop>
                    <input type="checkbox" class="dt-cb" :checked="isSelected(p.id)" @change="toggleSelect(p.id)" />
                  </td>
                  <td v-for="col in displayColumns" :key="col.key" :class="[col.cls, col.align === 'right' ? 'ta-right' : '']">
                    <span v-if="col.badge" class="stock-badge">{{ formatQty(p.total_stock) }}</span>
                    <template v-else-if="col.money && p[col.field] !== undefined && p[col.field] !== null && p[col.field] !== ''"><span v-if="col.plus">+</span><Money :value="p[col.field]" /></template>
                    <template v-else>
                      <span v-if="col.key === 'product' && p.hide_from_pos" class="ghost-tag" title="Hidden from POS"><EyeOff :size="11" /></span>{{ cellText(col, p) }}
                    </template>
                  </td>
                  <td class="ta-right dt-actcol">
                    <button class="row-action" :title="p.hide_from_pos ? 'Un-ghost (show in POS)' : 'Ghost (hide from POS)'" @click.stop="toggleGhost(p)">
                      <component :is="p.hide_from_pos ? EyeOff : Eye" :size="14" />
                    </button>
                    <button class="row-action" title="Edit product" @click.stop="openEditProduct(p)"><Pencil :size="14" /></button>
                  </td>
                </tr>
                <tr v-if="!loading && !products.length">
                  <td :colspan="displayColumns.length + (bulkMode ? 2 : 1)" class="dt-empty">
                    <Package :size="40" class="dt-empty-icon" />
                    <div class="dt-empty-title">No products found</div>
                    <div class="dt-empty-sub">Adjust your search or filter.</div>
                  </td>
                </tr>
              </tbody>
            </Transition>
          </table>
        </div>

        <!-- pagination -->
        <div class="dt-foot">
          <div class="dt-perpage">
            <span>PER PAGE</span>
            <select v-model.number="pageSize" @change="fetchProducts(1)">
              <option :value="50">50</option><option :value="75">75</option><option :value="100">100</option>
            </select>
          </div>
          <div class="dt-showing">SHOWING {{ total === 0 ? 0 : from }}-{{ to }} OF {{ total }}</div>
          <div class="dt-pages">
            <button class="dt-pg" :disabled="page === 1" @click="goPage(page - 1)"><ChevronLeft :size="18" /></button>
            <span class="dt-pgnum">{{ page }} / {{ totalPages }}</span>
            <button class="dt-pg" :disabled="page >= totalPages" @click="goPage(page + 1)"><ChevronRight :size="18" /></button>
          </div>
        </div>
      </div>
    </div>

    <!-- ═══════════ CATEGORIES TAB ═══════════ -->
    <div v-if="activeTab === 'categories'">
      <div class="dt-card simple">
        <table class="dt">
          <thead><tr><th class="dt-th">Name</th><th class="dt-th">Parent</th><th class="dt-th ta-right">Actions</th></tr></thead>
          <tbody>
            <tr v-if="!categories.length"><td colspan="3" class="dt-empty"><div class="dt-empty-title">No categories yet</div></td></tr>
            <tr v-for="cat in categories" :key="cat.id" class="dt-row">
              <td class="c-name">{{ cat.name }}</td>
              <td class="c-sup">{{ categories.find(c => c.id === cat.parent)?.name || '—' }}</td>
              <td class="ta-right">
                <button class="row-action" @click="openEditCategory(cat)"><Pencil :size="13" /></button>
                <button class="row-action danger" @click="deleteCategory(cat.id)"><Trash2 :size="13" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ═══════════ SUPPLIERS TAB ═══════════ -->
    <div v-if="activeTab === 'suppliers'">
      <div class="dt-card simple">
        <table class="dt">
          <thead><tr><th class="dt-th">Name</th><th class="dt-th">Code</th><th class="dt-th">Contact</th><th class="dt-th ta-right">Actions</th></tr></thead>
          <tbody>
            <tr v-if="!suppliers.length"><td colspan="4" class="dt-empty"><div class="dt-empty-title">No suppliers yet</div></td></tr>
            <tr v-for="s in suppliers" :key="s.id" class="dt-row">
              <td class="c-name">{{ s.name }}</td>
              <td><span class="code-chip">{{ s.code_prefix }}</span></td>
              <td class="c-sup">{{ s.contact_info || '—' }}</td>
              <td class="ta-right">
                <button class="row-action" @click="openEditSupplier(s)"><Pencil :size="13" /></button>
                <button class="row-action danger" @click="deleteSupplier(s.id)"><Trash2 :size="13" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ═══════════ REPORTS TAB ═══════════ -->
    <div v-if="activeTab === 'reports'" class="dt-empty" style="margin-top:48px;">
      <BarChart3 :size="36" class="dt-empty-icon" />
      <div class="dt-empty-title">Inventory Reports</div>
      <div class="dt-empty-sub">Coming soon</div>
    </div>

    <!-- MODALS -->
    <AppModal :open="saveModal.open" title="Save preset" @close="saveModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">Preset name</label>
          <input v-model="saveModal.name" class="form-input" placeholder="e.g. Cashier view" />
        </div>
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-secondary);cursor:pointer;">
          <input type="checkbox" v-model="saveModal.is_default" />
          Make this the store default (for staff without an assigned preset)
        </label>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="saveModal.open = false">Cancel</button>
        <button class="btn-primary" :disabled="!saveModal.name.trim()" @click="savePreset">Save</button>
      </template>
    </AppModal>

    <AppModal :open="assignModal.open" title="Assign layouts to staff" @close="assignModal.open = false">
      <div class="assign-list">
        <div v-for="row in assignModal.rows" :key="row.user_id" class="assign-row">
          <div class="assign-user">
            <span class="assign-name">{{ row.full_name }}</span>
            <span class="assign-role">{{ row.role }}</span>
          </div>
          <select v-model="row.preset_id" class="form-input assign-sel" @change="assignTo(row)">
            <option :value="null">— Default —</option>
            <option v-for="p in presets" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div v-if="!assignModal.rows.length" style="color:var(--text-muted);font-size:13px;text-align:center;padding:16px;">No staff yet.</div>
      </div>
    </AppModal>

    <AppModal :open="catModal.open" :title="catModal.id ? 'Edit Category' : 'New Category'" @close="catModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div><label class="form-label">Name</label><input v-model="catModal.name" class="form-input" placeholder="Category name" /></div>
        <div><label class="form-label">Parent (optional)</label>
          <select v-model="catModal.parent" class="form-input">
            <option value="">None</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="catModal.open = false">Cancel</button>
        <button class="btn-primary" @click="saveCategory" :disabled="!catModal.name.trim()">Save</button>
      </template>
    </AppModal>

    <AppModal :open="supModal.open" :title="supModal.id ? 'Edit Supplier' : 'New Supplier'" @close="supModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div><label class="form-label">Name</label><input v-model="supModal.name" class="form-input" placeholder="Supplier name" /></div>
        <div><label class="form-label">3-digit code prefix</label><input v-model="supModal.code_prefix" class="form-input" placeholder="e.g. 130" maxlength="3" /></div>
        <div><label class="form-label">Contact info (optional)</label><textarea v-model="supModal.contact_info" class="form-input" rows="2" placeholder="Phone, email…" /></div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="supModal.open = false">Cancel</button>
        <button class="btn-primary" @click="saveSupplier" :disabled="!supModal.name.trim() || supModal.code_prefix.length !== 3">Save</button>
      </template>
    </AppModal>

    <!-- ═══════════ PRODUCT ADD / EDIT ═══════════ -->
    <AppModal :open="prodModal.open" :title="prodModal.id ? 'Edit Product' : 'New Product'" @close="prodModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div><label class="form-label">Name</label><input v-model="prodModal.name" class="form-input" placeholder="Product name" /></div>

        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <div style="flex:1;min-width:160px;">
            <label class="form-label">Category</label>
            <select v-model="prodModal.category" class="form-input">
              <option value="">None</option>
              <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div style="flex:1;min-width:160px;">
            <label class="form-label" style="display:flex;align-items:center;gap:5px;">
              Supplier <Lock v-if="prodModal.id" :size="11" />
            </label>
            <select v-if="!prodModal.id" v-model="prodModal.supplier" class="form-input">
              <option value="">Select supplier…</option>
              <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }} ({{ s.code_prefix }})</option>
            </select>
            <input v-else class="form-input" :value="prodModal.supplierName" disabled title="Supplier is locked — the SKU is built from it" />
          </div>
        </div>

        <div><label class="form-label">Description</label><textarea v-model="prodModal.description" class="form-input" rows="2" placeholder="Optional" /></div>

        <div style="display:flex;gap:12px;flex-wrap:wrap;">
          <div style="flex:1;min-width:110px;"><label class="form-label">Base price</label><input v-model.number="prodModal.base_price" class="form-input" type="number" min="0" step="0.01" /></div>
          <div style="flex:1;min-width:110px;"><label class="form-label">Cost price</label><input v-model.number="prodModal.cost_price" class="form-input" type="number" min="0" step="0.01" /></div>
          <div style="flex:1;min-width:110px;"><label class="form-label">Sell price</label><input v-model.number="prodModal.sell_price" class="form-input" type="number" min="0" step="0.01" /></div>
        </div>

        <div v-if="attributes.length" style="border-top:1px solid var(--border);padding-top:12px;">
          <div class="form-label" style="margin-bottom:8px;">Attributes</div>
          <div style="display:flex;flex-wrap:wrap;gap:12px;">
            <div v-for="def in attributes" :key="def.id" style="flex:1;min-width:140px;">
              <label class="form-label">{{ def.name }}</label>
              <select v-if="def.options && def.options.length" v-model="prodModal.attrs[def.id]" class="form-input">
                <option value="">—</option>
                <option v-for="(o, i) in def.options" :key="i" :value="optText(o)">{{ optText(o) }}</option>
              </select>
              <input v-else v-model="prodModal.attrs[def.id]" class="form-input" :placeholder="def.name" />
            </div>
          </div>
        </div>

        <p v-if="prodModal.error" class="form-label" style="color:var(--danger,#dc2626);">{{ prodModal.error }}</p>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="prodModal.open = false">Cancel</button>
        <button
          class="btn-primary"
          :disabled="!prodModal.name.trim() || (!prodModal.id && !prodModal.supplier) || prodModal.saving"
          @click="saveProduct"
        >{{ prodModal.saving ? 'Saving…' : 'Save' }}</button>
      </template>
    </AppModal>

    <!-- ═══════════ BULK EDIT ═══════════ -->
    <AppModal :open="bulkEditModal.open" title="Bulk edit products" @close="bulkEditModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <p style="font-size:13px;color:var(--text-muted);margin:0;">
          Applies to <strong>all {{ selectedCount }}</strong> selected product(s). Leave a field blank to keep it unchanged.
        </p>
        <div>
          <label class="form-label">Retail price</label>
          <input v-model="bulkEditModal.retail_price" class="form-input" type="number" min="0" step="0.01" placeholder="Unchanged" />
        </div>
        <div>
          <label class="form-label">Category</label>
          <select v-model="bulkEditModal.category" class="form-input">
            <option value="">Unchanged</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="bulkEditModal.open = false">Cancel</button>
        <button
          class="btn-primary"
          :disabled="bulkBusy || (bulkEditModal.retail_price === '' && !bulkEditModal.category)"
          @click="confirmBulkEdit"
        >{{ bulkEditModal.confirming ? 'Click again to apply to all' : 'Apply' }}</button>
      </template>
    </AppModal>

    <!-- ═══════════ BULK DELETE ═══════════ -->
    <AppModal :open="bulkDeleteModal.open" title="Delete products" @close="bulkDeleteModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <p style="font-size:13px;color:var(--text-muted);margin:0;">
          Soft-deleting <strong>{{ selectedCount }}</strong> product(s). They move to Trash and can be restored by an admin.
        </p>
        <div>
          <label class="form-label">Reason</label>
          <select v-model="bulkDeleteModal.reason" class="form-input">
            <option value="">Select a reason…</option>
            <option v-for="r in DELETE_REASONS" :key="r.value" :value="r.value">{{ r.label }}</option>
          </select>
        </div>
        <div v-if="bulkDeleteModal.reason === 'OTHER'">
          <label class="form-label">Note</label>
          <input v-model="bulkDeleteModal.note" class="form-input" placeholder="Briefly, why?" maxlength="255" />
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="bulkDeleteModal.open = false">Cancel</button>
        <button
          class="btn-danger"
          :disabled="bulkBusy || !bulkDeleteModal.reason"
          @click="confirmBulkDelete"
        >{{ bulkDeleteModal.confirming ? 'Click again to delete' : 'Delete' }}</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import {
  Package, BarChart3, Search, X, Filter, Pencil, Trash2, Tags, Truck, Plus,
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, ArrowUp, ArrowDown, ArrowUpDown,
  Columns3, GripVertical, Lock, UserCog, RotateCcw,
  Eye, EyeOff, CheckSquare,
} from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import { formatQty } from '@/utils/format'
import AppModal from '@/components/ui/AppModal.vue'

const auth = useAuthStore()

const tabs = [
  { id: 'products', label: 'Products', icon: Package },
  { id: 'categories', label: 'Categories', icon: Tags },
  { id: 'suppliers', label: 'Suppliers', icon: Truck },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
]
const activeTab = ref('products')

/* ── columns ── */
const columns = [
  { key: 'sku',       label: 'SKU',       sort: 'o_sku',          align: 'left',  field: 'sku_display',   cls: 'c-sku' },
  { key: 'product',   label: 'PRODUCT',   sort: 'name',           align: 'left',  field: 'name',          cls: 'c-name' },
  { key: 'supplier',  label: 'SUPPLIER',  sort: 'supplier__name', align: 'left',  field: 'supplier_name', cls: 'c-sup' },
  { key: 'wholesale', label: 'WHOLESALE', sort: 'o_wholesale',    align: 'left',  field: 'cost_display',  cls: 'c-mono c-muted', money: true },
  { key: 'retail',    label: 'RETAIL',    sort: 'o_retail',       align: 'left',  field: 'price_display', cls: 'c-mono c-retail', money: true },
  { key: 'profit',    label: 'PROFIT',    sort: 'o_profit',       align: 'left',  field: 'profit_display',cls: 'c-mono c-profit', money: true, plus: true },
  { key: 'inStock',   label: 'IN STOCK',  sort: 'o_stock',        align: 'right', field: 'total_stock',   cls: '', badge: true },
]
const DEFAULT_WIDTHS = { sku: 130, product: 300, supplier: 170, wholesale: 120, retail: 120, profit: 120, inStock: 110 }
const colWidths = reactive({ ...DEFAULT_WIDTHS })

const TABLE_ID = 'inventory_products'
const ADHOC_KEY = 'dt_inventory_adhoc'
const LOCKED = ['sku', 'product']           // can't be hidden
const colByKey = Object.fromEntries(columns.map(c => [c.key, c]))

const colOrder = ref(columns.map(c => c.key))
const colHidden = ref([])

// Layer 1: a column is *permitted* only if its field is present in the data.
// The server omits role-hidden fields, so a preset can never reveal them.
const permittedKeys = computed(() => {
  const sample = products.value[0]
  return columns.filter(c => !c.field || !sample || sample[c.field] !== undefined).map(c => c.key)
})

// Edit mode previews live off the working copy.
const editing = ref(false)
const working = reactive({ order: [], hidden: [] })
const activeOrder = computed(() => (editing.value ? working.order : colOrder.value))
const activeHidden = computed(() => (editing.value ? working.hidden : colHidden.value))

const displayColumns = computed(() =>
  activeOrder.value
    .filter(k => permittedKeys.value.includes(k) && !activeHidden.value.includes(k))
    .map(k => colByKey[k])
)
const tableMin = computed(() => displayColumns.value.reduce((a, c) => a + colWidths[c.key], 0))
const canEdit = computed(() => ['OWNER', 'ADMIN'].includes(auth.userRole) || auth.isSuperadmin)

function cellText(col, p) {
  const v = p[col.field]
  if (v === undefined || v === null || v === '') return '—'
  return col.money ? (col.plus ? '+' : '') + auth.currencySymbol + v : v
}

/* ── layout (preset) apply / persist ── */
const baseConfig = ref(null)   // effective preset config, for Reset
const hasAdhoc = ref(!!localStorage.getItem(ADHOC_KEY))

function applyLayout(cfg) {
  if (!cfg) return
  const known = columns.map(c => c.key)
  if (Array.isArray(cfg.order) && cfg.order.length) {
    const ordered = cfg.order.filter(k => known.includes(k))
    for (const k of known) if (!ordered.includes(k)) ordered.push(k)
    colOrder.value = ordered
  }
  colHidden.value = (cfg.hidden || []).filter(k => !LOCKED.includes(k))
  if (cfg.widths) Object.assign(colWidths, cfg.widths)
  if (cfg.sort && cfg.sort.key) { sortKey.value = cfg.sort.key; sortDir.value = cfg.sort.dir || 'asc' }
  if (cfg.page_size) pageSize.value = cfg.page_size
}
function currentConfig() {
  return {
    order: colOrder.value, hidden: colHidden.value, widths: { ...colWidths },
    sort: sortKey.value ? { key: sortKey.value, dir: sortDir.value } : null, page_size: pageSize.value,
  }
}
function saveAdhoc() { if (!editing.value) { localStorage.setItem(ADHOC_KEY, JSON.stringify(currentConfig())); hasAdhoc.value = true } }

async function loadLayout() {
  const adhoc = JSON.parse(localStorage.getItem(ADHOC_KEY) || 'null')
  try {
    const { data } = await api.get('/api/smart/presets/effective/', { params: { table_id: TABLE_ID } })
    baseConfig.value = data && data.config ? data.config : null
  } catch { baseConfig.value = null }
  applyLayout(adhoc || baseConfig.value)
  fetchProducts(1)
}
function resetLayout() {
  localStorage.removeItem(ADHOC_KEY); hasAdhoc.value = false
  colOrder.value = columns.map(c => c.key); colHidden.value = []
  Object.assign(colWidths, DEFAULT_WIDTHS); sortKey.value = null; sortDir.value = 'asc'
  applyLayout(baseConfig.value)
  fetchProducts(1)
}
function resetWorking() { working.order = columns.map(c => c.key); working.hidden = [] }

/* ── edit mode ── */
function enterEdit() { working.order = [...colOrder.value]; working.hidden = [...colHidden.value]; editing.value = true; fetchPresets() }
function cancelEdit() { editing.value = false }
function doneEdit() { colOrder.value = [...working.order]; colHidden.value = [...working.hidden]; editing.value = false; saveAdhoc() }
function toggleHidden(key) {
  if (LOCKED.includes(key)) return
  const i = working.hidden.indexOf(key)
  if (i >= 0) working.hidden.splice(i, 1); else working.hidden.push(key)
}
const dragKey = ref(null)
const dragOver = ref(null)

function startDrag(key, e) {
  dragKey.value = key
  dragOver.value = key
  document.addEventListener('pointerup', endDrag, { once: true })
}
function endDrag() {
  if (dragKey.value && dragOver.value && dragKey.value !== dragOver.value) {
    reorder(dragKey.value, dragOver.value)
  }
  dragKey.value = null
  dragOver.value = null
}
function reorder(fromKey, toKey) {
  if (!fromKey || fromKey === toKey) return
  const arr = [...working.order]
  arr.splice(arr.indexOf(fromKey), 1)
  arr.splice(arr.indexOf(toKey), 0, fromKey)
  working.order = arr
}
function moveCol(key, dir) {
  const arr = [...working.order]
  const i = arr.indexOf(key), j = i + dir
  if (j < 0 || j >= arr.length) return
  ;[arr[i], arr[j]] = [arr[j], arr[i]]
  working.order = arr
}

/* ── presets + assignment ── */
const presets = ref([])
const saveModal = reactive({ open: false, name: '', is_default: false })
const assignModal = reactive({ open: false, rows: [] })

async function fetchPresets() { try { const { data } = await api.get('/api/smart/presets/', { params: { table_id: TABLE_ID } }); presets.value = data.results ?? data } catch { /* noop */ } }
function loadPreset(p) {
  const known = columns.map(c => c.key)
  const ordered = (p.config.order || known).filter(k => known.includes(k))
  for (const k of known) if (!ordered.includes(k)) ordered.push(k)
  working.order = ordered
  working.hidden = (p.config.hidden || []).filter(k => !LOCKED.includes(k))
  if (p.config.widths) Object.assign(colWidths, p.config.widths)
}
async function savePreset() {
  if (!saveModal.name.trim()) return
  const cfg = { order: working.order, hidden: working.hidden, widths: { ...colWidths },
    sort: sortKey.value ? { key: sortKey.value, dir: sortDir.value } : null, page_size: pageSize.value }
  await api.post('/api/smart/presets/', { table_id: TABLE_ID, name: saveModal.name.trim(), config: cfg, is_default: saveModal.is_default })
  saveModal.open = false; saveModal.name = ''; saveModal.is_default = false
  await fetchPresets(); doneEdit()
}
async function openAssign() {
  if (!presets.value.length) await fetchPresets()
  const { data } = await api.get('/api/smart/presets/assignments/', { params: { table_id: TABLE_ID } })
  assignModal.rows = data; assignModal.open = true
}
async function assignTo(row) {
  await api.post('/api/smart/presets/assignments/', { user_id: row.user_id, table_id: TABLE_ID, preset_id: row.preset_id || null })
}

/* ── column header drag-to-reorder ── */
const colDragKey  = ref(null)
const colDragOver = ref(null)
const colDragMoved = ref(false)
const colGhostX   = ref(0)
const colGhostY   = ref(0)
let colDragStartX = 0
let suppressNextSort = false

function startColDrag(key, e) {
  const rect = e.currentTarget.getBoundingClientRect()
  if (e.clientX > rect.right - 10) return
  colDragKey.value   = key
  colDragOver.value  = key
  colDragMoved.value = false
  colDragStartX      = e.clientX
  document.addEventListener('pointermove', onColDragMove)
  document.addEventListener('pointerup', onColDragEnd, { once: true })
}
function onColDragMove(e) {
  if (!colDragKey.value) return
  colGhostX.value = e.clientX + 14
  colGhostY.value = e.clientY - 18
  if (!colDragMoved.value && Math.abs(e.clientX - colDragStartX) > 5)
    colDragMoved.value = true
}
function onColDragEnd() {
  document.removeEventListener('pointermove', onColDragMove)
  if (colDragMoved.value && colDragKey.value && colDragOver.value && colDragKey.value !== colDragOver.value) {
    const arr = [...colOrder.value]
    arr.splice(arr.indexOf(colDragKey.value), 1)
    arr.splice(arr.indexOf(colDragOver.value), 0, colDragKey.value)
    colOrder.value = arr
    saveAdhoc()
    suppressNextSort = true
    setTimeout(() => { suppressNextSort = false }, 50)
  }
  colDragKey.value   = null
  colDragOver.value  = null
  colDragMoved.value = false
}

/* ── sort (server-side) ── */
const sortKey = ref(null)
const sortDir = ref('asc')   // asc | desc
function handleSort(col) {
  if (suppressNextSort) return
  if (sortKey.value === col.key) {
    if (sortDir.value === 'asc') sortDir.value = 'desc'
    else { sortKey.value = null; sortDir.value = 'asc' }
  } else { sortKey.value = col.key; sortDir.value = 'asc' }
  fetchProducts(1); saveAdhoc()
}
function arrowFor(col) {
  if (sortKey.value !== col.key) return ArrowUpDown
  return sortDir.value === 'asc' ? ArrowUp : ArrowDown
}

/* ── resize ── */
let rz = null
function startResize(key, e) {
  rz = { key, x: e.clientX, w: colWidths[key] }
  document.addEventListener('mousemove', onResize)
  document.addEventListener('mouseup', endResize)
}
function onResize(e) {
  if (!rz) return
  colWidths[rz.key] = Math.max(60, rz.w + (e.clientX - rz.x))
}
function endResize() {
  rz = null
  document.removeEventListener('mousemove', onResize)
  document.removeEventListener('mouseup', endResize)
  saveAdhoc()
}

/* ── data ── */
const products = ref([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const pageSize = ref(50)
const search = ref('')
const showFilters = ref(false)
const attrFilters = reactive({})
const attributes = ref([])
const rowTransition = ref('slide-left')

const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
const from = computed(() => (page.value - 1) * pageSize.value + 1)
const to = computed(() => Math.min(page.value * pageSize.value, total.value))

const filterableAttrs = computed(() => attributes.value.filter(a => a.input_type === 'SELECT' && a.options?.length))

async function fetchProducts(p = 1) {
  if (p === 1) document.querySelector('.app-content')?.scrollTo({ top: 0, behavior: 'instant' })
  loading.value = true
  page.value = p
  try {
    const params = { page: p, page_size: pageSize.value }
    if (search.value) params.search = search.value
    if (activeCatId.value) params.category = activeCatId.value
    if (sortKey.value) {
      const col = columns.find(c => c.key === sortKey.value)
      params.ordering = (sortDir.value === 'desc' ? '-' : '') + col.sort
    }
    for (const [k, v] of Object.entries(attrFilters)) if (v) params[k] = v
    const res = await api.get('/api/inventory/products/', { params })
    products.value = res.data.results ?? res.data
    total.value = res.data.count ?? products.value.length
  } catch { products.value = [] } finally { loading.value = false }
}
function goPage(p) {
  if (p < 1 || p > totalPages.value) return
  rowTransition.value = p > page.value ? 'slide-left' : 'slide-right'
  fetchProducts(p)
}

let searchTimer = null
function debouncedFetch() { clearTimeout(searchTimer); searchTimer = setTimeout(() => fetchProducts(1), 300) }
function clearSearch() { search.value = ''; fetchProducts(1) }
function clearFilters() { for (const k in attrFilters) attrFilters[k] = ''; fetchProducts(1) }

/* ── category quick-filter slider ── */
const cats = ref([{ id: null, name: 'All' }])
const activeCatId = ref(null)
const catWindow = 5
const catStart = ref(0)
const catMax = computed(() => Math.max(0, cats.value.length - catWindow))
const visibleCats = computed(() =>
  cats.value.length <= catWindow ? cats.value : cats.value.slice(catStart.value, catStart.value + catWindow)
)
function catScroll(d) {
  catStart.value = Math.min(catMax.value, Math.max(0, catStart.value + d * catWindow))
}
function setCat(id) { activeCatId.value = id; fetchProducts(1) }

/* ── sticky thead offset (measure toolbar) ── */
const toolbarRef = ref(null)
const theadTop = ref(64)
let ro = null

/* ── categories / suppliers CRUD ── */
const categories = ref([])
const suppliers = ref([])
const catModal = reactive({ open: false, id: null, name: '', parent: '' })
const supModal = reactive({ open: false, id: null, name: '', code_prefix: '', contact_info: '' })

async function fetchAttributes() { try { const r = await api.get('/api/inventory/attributes/'); attributes.value = r.data.results ?? r.data } catch { /* noop */ } }
async function fetchCategories() {
  try {
    const r = await api.get('/api/inventory/categories/')
    categories.value = r.data.results ?? r.data
    cats.value = [{ id: null, name: 'All' }, ...categories.value.map(c => ({ id: c.id, name: c.name }))]
  } catch { /* noop */ }
}
async function fetchSuppliers() { try { const r = await api.get('/api/inventory/suppliers/'); suppliers.value = r.data.results ?? r.data } catch { /* noop */ } }

function openEditCategory(c) { Object.assign(catModal, { open: true, id: c.id, name: c.name, parent: c.parent || '' }) }
async function saveCategory() {
  const payload = { name: catModal.name, parent: catModal.parent || null }
  catModal.id ? await api.patch(`/api/inventory/categories/${catModal.id}/`, payload) : await api.post('/api/inventory/categories/', payload)
  catModal.open = false; fetchCategories()
}
async function deleteCategory(id) { if (!confirm('Delete this category?')) return; await api.delete(`/api/inventory/categories/${id}/`); fetchCategories() }

function openEditSupplier(s) { Object.assign(supModal, { open: true, id: s.id, name: s.name, code_prefix: s.code_prefix, contact_info: s.contact_info || '' }) }
async function saveSupplier() {
  const payload = { name: supModal.name, code_prefix: supModal.code_prefix, contact_info: supModal.contact_info }
  supModal.id ? await api.patch(`/api/inventory/suppliers/${supModal.id}/`, payload) : await api.post('/api/inventory/suppliers/', payload)
  supModal.open = false; fetchSuppliers()
}
async function deleteSupplier(id) { if (!confirm('Delete this supplier?')) return; await api.delete(`/api/inventory/suppliers/${id}/`); fetchSuppliers() }

/* ── product add / edit ── */
const prodModal = reactive({
  open: false, id: null, name: '', description: '', category: '', supplier: '', supplierName: '',
  base_price: 0, cost_price: 0, sell_price: 0, attrs: {}, saving: false, error: '',
})
function optText(o) { return typeof o === 'string' ? o : (o?.value ?? o?.label ?? String(o)) }
function resetAttrs() { const a = {}; for (const d of attributes.value) a[d.id] = ''; prodModal.attrs = a }

function openAddProduct() {
  Object.assign(prodModal, {
    open: true, id: null, name: '', description: '', category: '', supplier: '', supplierName: '',
    base_price: 0, cost_price: 0, sell_price: 0, saving: false, error: '',
  })
  resetAttrs()
}

async function openEditProduct(p) {
  Object.assign(prodModal, { open: true, id: p.id, saving: false, error: '' })
  resetAttrs()
  try {
    const { data } = await api.get(`/api/inventory/products/${p.id}/`)
    prodModal.name        = data.name || ''
    prodModal.description = data.description || ''
    prodModal.category    = data.category || ''
    prodModal.supplier    = data.supplier || ''
    const sup = suppliers.value.find(s => s.id === data.supplier)
    prodModal.supplierName = sup ? `${sup.name} (${sup.code_prefix})` : '—'
    prodModal.base_price  = Number(data.base_price || 0)
    const v = (data.variants && data.variants[0]) || null
    prodModal.cost_price  = v ? Number(v.cost_price || 0) : 0
    prodModal.sell_price  = v ? Number(v.sell_price || 0) : 0
    if (v && v.attributes) for (const a of v.attributes) prodModal.attrs[a.definition] = a.value
  } catch { prodModal.error = 'Failed to load product details.' }
}

async function saveProduct() {
  prodModal.error = ''; prodModal.saving = true
  const attributes_payload = Object.entries(prodModal.attrs)
    .filter(([, v]) => v !== '' && v != null)
    .map(([definition, value]) => ({ definition, value }))
  const payload = {
    name: prodModal.name.trim(),
    description: prodModal.description || '',
    category: prodModal.category || null,
    base_price: prodModal.base_price || 0,
    cost_price: prodModal.cost_price || 0,
    sell_price: prodModal.sell_price || 0,
    attributes: attributes_payload,
  }
  if (!prodModal.id) payload.supplier = prodModal.supplier   // supplier locked on edit
  try {
    if (prodModal.id) await api.patch(`/api/inventory/products/${prodModal.id}/`, payload)
    else              await api.post('/api/inventory/products/', payload)
    prodModal.open = false
    fetchProducts(prodModal.id ? page.value : 1)
  } catch (e) {
    prodModal.error = e.response?.data?.detail
      || e.response?.data?.supplier?.[0]
      || 'Save failed. Make sure the supplier prefix is confirmed (locked).'
  } finally { prodModal.saving = false }
}

/* ── ghost (hide from POS) + bulk ops ── */
const bulkMode = ref(false)
const selected = ref(new Set())
const DELETE_REASONS = [
  { value: 'DISCONTINUED', label: 'Discontinued' },
  { value: 'DUPLICATE',    label: 'Duplicate' },
  { value: 'MISTAKE',      label: 'Created by mistake' },
  { value: 'OTHER',        label: 'Other' },
]
const bulkBusy = ref(false)
const bulkDeleteModal = reactive({ open: false, reason: '', note: '', confirming: false })
const bulkEditModal = reactive({ open: false, retail_price: '', category: '', confirming: false })

const selectedCount = computed(() => selected.value.size)
const allOnPageSelected = computed(() =>
  products.value.length > 0 && products.value.every(p => selected.value.has(p.id)))

function toggleBulk() {
  bulkMode.value = !bulkMode.value
  if (!bulkMode.value) selected.value = new Set()
}
function isSelected(id) { return selected.value.has(id) }
function toggleSelect(id) {
  const s = new Set(selected.value)
  s.has(id) ? s.delete(id) : s.add(id)
  selected.value = s
}
function toggleSelectAll() {
  const s = new Set(selected.value)
  if (allOnPageSelected.value) products.value.forEach(p => s.delete(p.id))
  else products.value.forEach(p => s.add(p.id))
  selected.value = s
}
function onRowClick(p) {
  if (editing.value) return
  if (bulkMode.value) toggleSelect(p.id)
  else openEditProduct(p)
}

async function toggleGhost(p) {
  try {
    const { data } = await api.post(`/api/inventory/products/${p.id}/toggle_ghost/`)
    p.hide_from_pos = data.hide_from_pos
  } catch { /* noop */ }
}

const selectedIds = () => [...selected.value]

async function doBulkGhost(hide) {
  if (!selectedCount.value || bulkBusy.value) return
  bulkBusy.value = true
  try {
    await api.post('/api/inventory/products/bulk_ghost/', { ids: selectedIds(), hide })
    await fetchProducts(page.value)
  } finally { bulkBusy.value = false }
}

function openBulkEdit() {
  if (!selectedCount.value) return
  Object.assign(bulkEditModal, { open: true, retail_price: '', category: '', confirming: false })
}
async function confirmBulkEdit() {
  const hasRetail = bulkEditModal.retail_price !== '' && bulkEditModal.retail_price != null
  if (!hasRetail && !bulkEditModal.category) return
  if (!bulkEditModal.confirming) { bulkEditModal.confirming = true; return }
  bulkBusy.value = true
  try {
    const payload = { ids: selectedIds() }
    if (hasRetail) payload.retail_price = bulkEditModal.retail_price
    if (bulkEditModal.category) payload.category = bulkEditModal.category
    await api.post('/api/inventory/products/bulk_update/', payload)
    bulkEditModal.open = false
    await fetchProducts(page.value)
  } catch { bulkEditModal.confirming = false } finally { bulkBusy.value = false }
}

function openBulkDelete() {
  if (!selectedCount.value) return
  Object.assign(bulkDeleteModal, { open: true, reason: '', note: '', confirming: false })
}
async function confirmBulkDelete() {
  if (!bulkDeleteModal.reason) return
  if (!bulkDeleteModal.confirming) { bulkDeleteModal.confirming = true; return }
  bulkBusy.value = true
  try {
    await api.post('/api/inventory/products/bulk_delete/', {
      ids: selectedIds(), reason: bulkDeleteModal.reason, note: bulkDeleteModal.note,
    })
    bulkDeleteModal.open = false
    selected.value = new Set()
    await fetchProducts(1)
  } catch { bulkDeleteModal.confirming = false } finally { bulkBusy.value = false }
}

onMounted(() => {
  fetchAttributes(); loadLayout(); fetchCategories(); fetchSuppliers()
  ro = new ResizeObserver(() => { if (toolbarRef.value) theadTop.value = toolbarRef.value.offsetHeight })
  if (toolbarRef.value) ro.observe(toolbarRef.value)
})
onUnmounted(() => { ro?.disconnect() })
</script>

<style scoped>
.inv-head { margin-bottom: 18px; }
.inv-title { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; color: var(--text-primary); margin: 0 0 4px; }
.inv-sub { font-size: 13.5px; color: var(--text-muted); margin: 0; }

.tab-bar { display: flex; gap: 4px; border-bottom: 1px solid var(--border); margin-bottom: 8px; }
.tab-btn { display: flex; align-items: center; gap: 6px; padding: 10px 14px; font-size: 13.5px; font-weight: 500; color: var(--text-muted); border: none; background: none; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 120ms, border-color 120ms; }
.tab-btn:hover { color: var(--text-primary); }
.tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }

/* ── STICKY toolbar ── */
.dt-toolbar {
  position: sticky; top: 0; z-index: 30;
  display: flex; align-items: center; gap: 14px;
  background: var(--bg-app); padding: 14px 0;
}
.dt-search { display: flex; align-items: center; gap: 6px; width: 300px; flex-shrink: 0; position: relative; background: var(--bg-card); border: 1px solid var(--border); border-radius: 11px; padding: 8px 10px; }
.dt-search-icon { color: var(--text-muted); flex-shrink: 0; }
.dt-search-input { flex: 1; border: none; background: none; outline: none; font-size: 13.5px; color: var(--text-primary); min-width: 0; }
.dt-x { display: flex; border: none; cursor: pointer; background: var(--border); color: var(--text-muted); border-radius: 6px; padding: 3px; }

.cat-slider { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; overflow: hidden; }
.cat-nav { display: flex; flex-shrink: 0; border: none; background: none; cursor: pointer; color: var(--text-muted); border-radius: 8px; padding: 6px; transition: background 120ms, color 120ms; }
.cat-nav:hover { background: var(--sb-hover, var(--border)); color: var(--text-primary); }
.cat-nav:disabled { opacity: 0.3; cursor: default; }
.cat-nav:disabled:hover { background: none; color: var(--text-muted); }
.cat-track { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; overflow: hidden; }
.cat-pill { flex: 0 0 auto; padding: 9px 18px; border: 1px solid transparent; background: none; cursor: pointer; border-radius: 10px; font-size: 14px; font-weight: 500; color: var(--text-muted); white-space: nowrap; transition: background 120ms, color 120ms; }
.cat-pill:hover { background: var(--bg-card); color: var(--text-primary); }
.cat-pill.active { background: var(--text-primary); color: var(--bg-card); font-weight: 600; }

.dt-filter { display: flex; align-items: center; gap: 7px; flex-shrink: 0; padding: 10px 16px; border: 1px solid var(--border); background: var(--bg-card); color: var(--text-secondary); border-radius: 11px; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: background 120ms, color 120ms; }
.dt-filter:hover, .dt-filter.on { color: var(--text-primary); border-color: var(--accent); }
.dt-add { display: flex; align-items: center; gap: 7px; flex-shrink: 0; padding: 10px 16px; border: none; background: var(--accent); color: #fff; border-radius: 11px; font-size: 13.5px; font-weight: 700; cursor: pointer; transition: background 120ms, transform 70ms; }
.dt-add:hover { background: var(--accent-hover, var(--accent)); }
.dt-add:active { transform: scale(0.96); }

.dt-filterpanel { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; align-items: center; }
.filter-select { max-width: 150px; }

/* ── TABLE ── */
/* ── EDIT MODE ── */
/* edit panel slide-down animation */
.edit-slide-enter-active { animation: editSlideDown 220ms cubic-bezier(0.25,0.8,0.25,1) both; }
.edit-slide-leave-active { animation: editSlideUp   160ms cubic-bezier(0.4,0,1,1)       both; }
@keyframes editSlideDown {
  from { opacity: 0; transform: translateY(-10px) scaleY(0.96); }
  to   { opacity: 1; transform: translateY(0)     scaleY(1); }
}
@keyframes editSlideUp {
  from { opacity: 1; transform: translateY(0)    scaleY(1); }
  to   { opacity: 0; transform: translateY(-8px) scaleY(0.97); }
}

.edit-panel { background: var(--bg-card); border: 1px solid var(--accent); border-radius: 14px; padding: 14px 16px; margin-bottom: 14px; box-shadow: 0 4px 20px var(--accent-soft); transform-origin: top center; }
.edit-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.edit-title { display: flex; align-items: center; gap: 7px; font-size: 14px; font-weight: 700; color: var(--text-primary); }
.edit-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.edit-select { background: var(--bg-app); border: 1px solid var(--border); border-radius: 8px; padding: 7px 10px; font-size: 13px; color: var(--text-primary); cursor: pointer; outline: none; }
.edit-hint { font-size: 12px; color: var(--text-muted); margin: 8px 0 10px; }
.chooser { display: flex; flex-direction: column; gap: 4px; max-width: 380px; }
.chooser-row { display: flex; align-items: center; gap: 9px; padding: 8px 10px; border: 1px solid var(--border); border-radius: 9px; background: var(--bg-app); cursor: grab; transition: border-color 120ms; }
/* column header drag */
.dt-th.col-dragging  { opacity: 0.35; cursor: grabbing !important; }
.dt-th.col-drag-over { border-left: 3px solid var(--accent); background: var(--accent-soft) !important; }

.chooser-row:hover { border-color: var(--accent); }
.chooser-row.drag-over { border-color: var(--accent); background: var(--accent-soft); }
.chooser-row.disabled { opacity: 0.5; }
.chooser-grip { color: var(--text-muted); flex-shrink: 0; }
.chooser-cb { width: 15px; height: 15px; accent-color: var(--accent); cursor: pointer; }
.chooser-label { flex: 1; font-size: 13.5px; font-weight: 500; color: var(--text-primary); }
.chooser-tag { color: var(--text-muted); }
.chooser-na { font-size: 11px; color: var(--text-muted); }
.chooser-move { display: flex; flex-direction: column; gap: 1px; flex-shrink: 0; margin-left: auto; }
.chooser-mv { display: flex; border: none; background: none; cursor: pointer; color: var(--text-muted); padding: 1px; border-radius: 4px; transition: background 120ms, color 120ms; }
.chooser-mv:hover:not(:disabled) { background: var(--border); color: var(--text-primary); }
.chooser-mv:disabled { opacity: 0.25; cursor: default; }

.assign-list { display: flex; flex-direction: column; gap: 8px; }
.assign-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--border); }
.assign-row:last-child { border-bottom: none; }
.assign-user { display: flex; flex-direction: column; }
.assign-name { font-size: 13.5px; font-weight: 600; color: var(--text-primary); }
.assign-role { font-size: 11px; color: var(--text-muted); text-transform: capitalize; }
.assign-sel { max-width: 180px; }

/* No overflow:hidden — it would trap the sticky thead. Corners rounded via children. */
.dt-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; box-shadow: 0 1px 2px rgba(0,0,0,0.04); transition: box-shadow 150ms; }
.dt-card.editing { box-shadow: 0 0 0 2px var(--accent), 0 8px 30px var(--accent-soft); }
.dt thead tr:first-child .dt-th:first-child { border-top-left-radius: 15px; }
.dt thead tr:first-child .dt-th:last-child  { border-top-right-radius: 15px; }
.dt-foot { border-radius: 0 0 15px 15px; }
.dt-card.simple { margin-top: 14px; }
.dt-xscroll { width: 100%; }
.dt { width: 100%; border-collapse: collapse; table-layout: fixed; font-size: 13px; }

.dt-th {
  position: sticky; z-index: 20;
  padding: 13px 16px; text-align: left; background: var(--bg-app);
  border-bottom: 1px solid var(--border); color: var(--text-primary);
  font-size: 11.5px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em;
  white-space: nowrap; user-select: none;
}
.dt-th.sortable { cursor: pointer; }
/* MUST be opaque — a translucent hover lets scrolling rows bleed through the sticky header. */
.dt-th.sortable:hover { background: #eef2f7; }
.dark .dt-th.sortable:hover { background: #2a2a2e; }
.dt-th.ta-right { text-align: right; }
.dt-th-inner { display: inline-flex; align-items: center; gap: 6px; }
.dt-th-inner.jend { justify-content: flex-end; }
.dt-arrow { color: var(--text-muted); opacity: 0.6; flex-shrink: 0; }
.dt-arrow.on { color: var(--accent); opacity: 1; }
.dt-resize { position: absolute; right: 0; top: 0; bottom: 0; width: 8px; cursor: col-resize; }
.dt-resize:hover { background: var(--accent-soft); }

.dt-row { border-bottom: 1px solid var(--border); transition: background 100ms; }
.dt-row:last-child { border-bottom: none; }
.dt-row:hover { background: var(--bg-app); }
.dt-row.clickable { cursor: pointer; }
.dt td { padding: 12px 16px; color: var(--text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ta-right { text-align: right; }

.c-sku { font-family: ui-monospace, monospace; font-size: 11.5px; letter-spacing: 0.03em; color: var(--text-muted); }
.c-name { font-weight: 700; }
.c-sup { color: var(--text-secondary); font-size: 12.5px; }
.c-mono { font-family: ui-monospace, monospace; font-size: 12.5px; font-variant-numeric: tabular-nums; }
.c-muted { color: var(--text-muted); }
.c-retail { color: #16a34a; font-weight: 600; }
.c-profit { color: #16a34a; font-weight: 700; }
.dark .c-retail, .dark .c-profit { color: #4ade80; }

.stock-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 32px; padding: 3px 9px; border-radius: 8px; background: var(--text-primary); color: var(--bg-card); font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; }

.dt-loading, .dt-empty { text-align: center; padding: 48px 20px; color: var(--text-muted); }
.dt-empty { display: flex; flex-direction: column; align-items: center; }
.dt-empty-icon { color: var(--text-muted); opacity: 0.4; margin-bottom: 10px; }
.dt-empty-title { font-weight: 700; color: var(--text-primary); font-size: 15px; }
.dt-empty-sub { font-size: 13px; margin-top: 3px; }

/* pagination */
.dt-foot { display: flex; align-items: center; justify-content: space-between; gap: 14px; padding: 14px 16px; border-top: 1px solid var(--border); flex-wrap: wrap; }
.dt-perpage { display: flex; align-items: center; gap: 8px; font-size: 11px; font-weight: 700; letter-spacing: 0.06em; color: var(--text-muted); }
.dt-perpage select { background: var(--bg-app); border: 1px solid var(--border); border-radius: 7px; padding: 5px 8px; font-size: 12px; font-weight: 700; color: var(--text-primary); cursor: pointer; outline: none; }
.dt-showing { font-size: 11.5px; font-weight: 600; letter-spacing: 0.04em; color: var(--text-muted); }
.dt-pages { display: flex; align-items: center; gap: 6px; }
.dt-pg { display: flex; border: none; background: none; cursor: pointer; color: var(--text-secondary); border-radius: 7px; padding: 4px; transition: background 120ms; }
.dt-pg:hover:not(:disabled) { background: var(--border); color: var(--text-primary); }
.dt-pg:disabled { opacity: 0.3; cursor: default; }
.dt-pgnum { font-size: 13px; font-weight: 700; color: var(--text-primary); padding: 0 6px; }

/* reused */
.code-chip { font-family: ui-monospace, monospace; font-size: 12px; background: var(--bg-app); border: 1px solid var(--border); border-radius: 5px; padding: 2px 7px; color: var(--text-secondary); }
.dt-actcol { width: 96px; white-space: nowrap; }

/* ── bulk action bar ── */
.bulk-bar { display: flex; align-items: center; gap: 14px; background: var(--bg-card); border: 1px solid var(--accent); border-radius: 14px; padding: 10px 14px; margin-bottom: 12px; box-shadow: 0 4px 20px var(--accent-soft); transform-origin: top center; }
.bulk-count { font-size: 13px; font-weight: 700; color: var(--accent); }
.bulk-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.bulk-exit { display: flex; margin-left: auto; border: none; background: var(--border); color: var(--text-muted); border-radius: 7px; padding: 5px; cursor: pointer; }
.bulk-exit:hover { color: var(--text-primary); }
.btn-ghost.danger { color: #dc2626; border-color: #f3b1b1; }
.btn-ghost.danger:hover { background: #fee2e2; color: #b91c1c; }
.btn-ghost:disabled { opacity: .45; cursor: default; }
.btn-danger { display: inline-flex; align-items: center; gap: 5px; padding: 8px 16px; border-radius: 9px; font-size: 13px; font-weight: 600; border: none; background: #dc2626; color: #fff; cursor: pointer; }
.btn-danger:hover { background: #b91c1c; }
.btn-danger:disabled { opacity: .5; cursor: default; }

/* ── select column + ghosted rows ── */
.dt-selcol { width: 42px; text-align: center; padding-left: 14px; padding-right: 0; }
.dt-cb { width: 15px; height: 15px; accent-color: var(--accent); cursor: pointer; }
.dt-row.selected { background: var(--accent-soft); }
.dt-row.ghosted td { opacity: 0.5; }
.dt-row.ghosted:hover td { opacity: 0.7; }
.ghost-tag { display: inline-flex; vertical-align: middle; margin-right: 5px; color: var(--text-muted); }
.row-action { width: 28px; height: 28px; border: none; background: none; border-radius: 6px; cursor: pointer; color: var(--text-muted); display: inline-flex; align-items: center; justify-content: center; transition: background 100ms, color 100ms; }
.row-action:hover { background: var(--border); color: var(--text-primary); }
.row-action.danger:hover { background: #fee2e2; color: #dc2626; }
.btn-ghost { display: inline-flex; align-items: center; gap: 5px; padding: 8px 12px; border-radius: 9px; font-size: 13px; font-weight: 500; border: 1px solid var(--border); background: none; color: var(--text-secondary); cursor: pointer; }
.btn-ghost:hover { background: var(--border); color: var(--text-primary); }
.btn-primary { display: inline-flex; align-items: center; gap: 5px; padding: 8px 16px; border-radius: 9px; font-size: 13px; font-weight: 600; border: none; background: var(--accent); color: #1a1208; cursor: pointer; }
.btn-primary:hover { background: var(--accent-hover); }
.btn-primary:disabled { opacity: .5; cursor: default; }
.form-label { display: block; font-size: 12.5px; font-weight: 600; color: var(--text-secondary); margin-bottom: 5px; }

/* row page transition */
.slide-left-enter-active, .slide-left-leave-active, .slide-right-enter-active, .slide-right-leave-active { transition: all 0.35s cubic-bezier(0.25,0.8,0.25,1); }
.slide-left-enter-from { opacity: 0; transform: translateX(30px); }
.slide-left-leave-to { opacity: 0; transform: translateX(-30px); }
.slide-right-enter-from { opacity: 0; transform: translateX(-30px); }
.slide-right-leave-to { opacity: 0; transform: translateX(30px); }

/* category slide */
.cat-left-enter-active, .cat-left-leave-active, .cat-right-enter-active, .cat-right-leave-active { transition: all 0.3s ease; }
.cat-left-enter-from { opacity: 0; transform: translateX(20px); }
.cat-left-leave-to { opacity: 0; transform: translateX(-20px); position: absolute; }
.cat-right-enter-from { opacity: 0; transform: translateX(-20px); }
.cat-right-leave-to { opacity: 0; transform: translateX(20px); position: absolute; }
</style>

<style>
.col-drag-ghost {
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  background: var(--bg-card, #fff);
  border: 1.5px solid var(--accent, #f78f1e);
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--accent, #f78f1e);
  box-shadow: 0 8px 28px rgba(0,0,0,.18);
  white-space: nowrap;
  transform: rotate(-2deg) scale(1.04);
  transition: none;
}
</style>
