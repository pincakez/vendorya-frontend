<template>
  <Teleport to="body">
    <div v-if="colDragMoved && colDragKey" class="col-drag-ghost" :style="{ left: colGhostX + 'px', top: colGhostY + 'px' }">
      {{ colByKey[colDragKey]?.label }}
    </div>
  </Teleport>
  <div class="inv">
    <!-- ── NON-STICKY: title + tabs (scroll away) ── -->
    <div class="inv-head">
      <h1 class="inv-title">{{ t('inventory.products.title') }}</h1>
      <p class="inv-sub">{{ t('inventory.products.sub') }}</p>
    </div>

    <div class="tab-bar">
      <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
        <component :is="tab.icon" :size="15" /> {{ tab.label }}
      </button>
    </div>

    <!-- ═══════════ PRODUCTS TAB ═══════════ -->
    <div v-if="activeTab === 'products'">
      <!-- STICKY toolbar: search + category quick-filter + Filter -->
      <div class="dt-toolbar">
        <div class="dt-search">
          <Search :size="15" class="dt-search-icon" />
          <input v-model="search" class="dt-search-input" :placeholder="t('inventory.products.toolbar.search_placeholder')" @input="debouncedFetch" />
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

        <button v-if="hasAdhoc && !editing" class="dt-filter" :title="t('inventory.products.toolbar.reset_layout')" @click="resetLayout">
          <RotateCcw :size="14" />
        </button>
        <button class="dt-filter" :class="{ on: showFilters }" @click="showFilters = !showFilters">
          <Filter :size="14" /> {{ t('inventory.products.toolbar.filter') }}
        </button>
        <button v-if="canEdit && !editing" class="dt-filter" @click="enterEdit">
          <Columns3 :size="14" /> {{ t('inventory.products.toolbar.customize') }}
        </button>
        <button v-if="canEdit && !editing" class="dt-filter" :class="{ on: bulkMode }" @click="toggleBulk">
          <CheckSquare :size="14" /> {{ t('inventory.products.toolbar.bulk') }}
        </button>
        <button v-if="canEdit && !editing" class="dt-filter" :title="t('inventory.products.toolbar.assign_layouts')" @click="openAssign">
          <UserCog :size="14" />
        </button>
        <button v-if="!editing" class="dt-add" @click="openAddProduct">
          <Plus :size="15" /> {{ t('inventory.products.toolbar.add_product') }}
        </button>
      </div>

      <!-- EDIT MODE — column chooser -->
      <Transition name="edit-slide">
      <div v-if="editing" class="edit-panel">
        <div class="edit-head">
          <span class="edit-title"><Columns3 :size="15" /> {{ t('inventory.products.customize.title') }}</span>
          <div class="edit-actions">
            <select v-if="presets.length" class="edit-select" @change="(e) => { const p = presets.find(x => x.id === e.target.value); if (p) loadPreset(p); e.target.value = '' }">
              <option value="">{{ t('inventory.products.customize.load_preset') }}</option>
              <option v-for="p in presets" :key="p.id" :value="p.id">{{ p.name }}</option>
            </select>
            <button class="btn-ghost" @click="resetWorking">{{ t('inventory.products.customize.reset') }}</button>
            <button class="btn-ghost" @click="cancelEdit">{{ t('common.cancel') }}</button>
            <button class="btn-ghost" @click="saveModal.open = true">{{ t('inventory.products.customize.save_preset') }}</button>
            <button class="btn-primary" @click="doneEdit">{{ t('inventory.products.customize.done') }}</button>
          </div>
        </div>
        <p class="edit-hint">{{ t('inventory.products.customize.hint') }}</p>
        <div class="chooser">
          <div
            v-for="key in chooserOrder" :key="key" class="chooser-row"
            :class="{ disabled: !permittedKeys.includes(key), 'drag-over': dragOver === key && dragKey !== key }"
            @pointerenter="dragOver = key"
          >
            <GripVertical :size="13" class="chooser-grip" @pointerdown.prevent="startDrag(key, $event)" />
            <input
              type="checkbox" class="chooser-cb"
              :checked="!working.hidden.includes(key)"
              :disabled="LOCKED.includes(key) || !permittedKeys.includes(key)"
              @change="toggleHidden(key)"
            />
            <span class="chooser-label">{{ headerLabel(key, colByKey[key]?.label ?? key) }}</span>
            <Lock v-if="LOCKED.includes(key)" :size="11" class="chooser-tag" />
            <span v-else-if="!permittedKeys.includes(key)" class="chooser-na">{{ t('inventory.products.customize.role_na') }}</span>
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
        <button class="btn-ghost" @click="clearFilters"><X :size="13" /> {{ t('common.clear') }}</button>
      </div>

      <!-- BULK ACTION BAR -->
      <Transition name="edit-slide">
        <div v-if="bulkMode" class="bulk-bar">
          <span class="bulk-count">{{ t('inventory.products.bulk_bar.n_selected', { count: selectedCount }) }}</span>
          <div class="bulk-actions">
            <button class="btn-ghost" :disabled="!selectedCount || bulkBusy" @click="doBulkGhost(true)"><EyeOff :size="14" /> {{ t('inventory.products.bulk_bar.ghost') }}</button>
            <button class="btn-ghost" :disabled="!selectedCount || bulkBusy" @click="doBulkGhost(false)"><Eye :size="14" /> {{ t('inventory.products.bulk_bar.unghost') }}</button>
            <button class="btn-ghost" :disabled="!selectedCount || bulkBusy" @click="openBulkEdit"><Pencil :size="14" /> {{ t('common.edit') }}</button>
            <button class="btn-ghost danger" :disabled="!selectedCount || bulkBusy" @click="openBulkDelete"><Trash2 :size="14" /> {{ t('common.delete') }}</button>
          </div>
          <button class="bulk-exit" :title="t('inventory.products.bulk_bar.exit_hint')" @click="toggleBulk"><X :size="15" /></button>
        </div>
      </Transition>

      <!-- TABLE -->
      <div class="dt-card" :class="{ editing }">
        <div class="dt-xscroll">
          <table class="dt">
            <thead>
              <tr>
                <th v-if="bulkMode" class="dt-th dt-selcol">
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
                  :style="col.key === 'product'
                    ? { minWidth: colWidths[col.key] + 'px', position: 'sticky', left: '0', zIndex: 22, background: 'var(--bg-app)' }
                    : { width: colWidths[col.key] + 'px' }"
                  @click="col.sort && handleSort(col)"
                  @pointerdown="startColDrag(col.key, $event)"
                  @pointerenter="colDragKey && (colDragOver = col.key)"
                >
                  <span class="dt-th-inner" :class="{ jend: col.align === 'right' }">
                    {{ headerLabel(col.key, col.label) }}
                    <component v-if="col.sort" :is="arrowFor(col)" :size="13" class="dt-arrow" :class="{ on: sortKey === col.key }" />
                  </span>
                  <span class="dt-resize" @mousedown.stop.prevent="startResize(col.key, $event)" @click.stop></span>
                </th>
                <th class="dt-th ta-right dt-actcol">{{ t('inventory.products.table.actions') }}</th>
              </tr>
            </thead>

            <Transition :name="rowTransition" mode="out-in">
              <tbody :key="page">
                <tr v-for="p in products" :key="p.id" class="dt-row" :class="{ clickable: !editing, ghosted: p.hide_from_pos, selected: bulkMode && isSelected(p.id) }" @click="onRowClick(p)">
                  <td v-if="bulkMode" class="dt-selcol" @click.stop>
                    <input type="checkbox" class="dt-cb" :checked="isSelected(p.id)" @change="toggleSelect(p.id)" />
                  </td>
                  <td v-for="col in displayColumns" :key="col.key" :class="[col.cls, col.align === 'right' ? 'ta-right' : '', col.key === 'product' ? 'col-frozen' : '']" :title="cellText(col, p)">
                    <span v-if="col.badge" class="stock-badge" :title="stockTitle(p)">{{ stockBadge(p) }}</span>
                    <span v-else-if="col.isTier" class="tier-cell">{{ tierCell(p, col) }}</span>
                    <template v-else-if="col.money && p[col.field] !== undefined && p[col.field] !== null && p[col.field] !== ''"><span v-if="col.plus">+</span><Money :value="p[col.field]" /></template>
                    <template v-else>
                      <span v-if="col.key === 'product' && p.hide_from_pos" class="ghost-tag" :title="t('inventory.products.table.ghost_hint')"><EyeOff :size="11" /></span>{{ cellText(col, p) }}
                    </template>
                  </td>
                  <td class="ta-right dt-actcol">
                    <button class="row-action" :title="p.hide_from_pos ? t('inventory.products.table.unghost_hint') : t('inventory.products.table.ghost_action')" @click.stop="toggleGhost(p)">
                      <component :is="p.hide_from_pos ? EyeOff : Eye" :size="14" />
                    </button>
                    <button class="row-action" :title="t('inventory.products.table.edit_hint')" @click.stop="openEditProduct(p)"><Pencil :size="14" /></button>
                  </td>
                </tr>
                <tr v-if="!loading && !products.length">
                  <td :colspan="displayColumns.length + (bulkMode ? 2 : 1)" class="dt-empty">
                    <Package :size="40" class="dt-empty-icon" />
                    <div class="dt-empty-title">{{ t('inventory.products.table.empty_title') }}</div>
                    <div class="dt-empty-sub">{{ t('inventory.products.table.empty_sub') }}</div>
                  </td>
                </tr>
              </tbody>
            </Transition>
          </table>
        </div>

        <!-- pagination -->
        <div class="dt-foot">
          <div class="dt-perpage">
            <span>{{ t('inventory.products.table.per_page') }}</span>
            <select v-model.number="pageSize" @change="fetchProducts(1); saveAdhoc()">
              <option :value="50">50</option><option :value="75">75</option><option :value="100">100</option>
            </select>
          </div>
          <div class="dt-showing">{{ t('inventory.products.table.showing', { from: total === 0 ? 0 : from, to, total }) }}</div>
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
        <div class="dt-xscroll">
        <table class="dt">
          <thead><tr><th class="dt-th">{{ t('inventory.products.categories_tab.name_col') }}</th><th class="dt-th">{{ t('inventory.products.categories_tab.parent_col') }}</th><th class="dt-th ta-right">{{ t('inventory.products.table.actions') }}</th></tr></thead>
          <tbody>
            <tr v-if="!categories.length"><td colspan="3" class="dt-empty"><div class="dt-empty-title">{{ t('inventory.products.categories_tab.empty') }}</div></td></tr>
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
    </div>

    <!-- ═══════════ SUPPLIERS TAB ═══════════ -->
    <div v-if="activeTab === 'suppliers'">
      <div class="dt-card simple">
        <div class="dt-xscroll">
        <table class="dt">
          <thead><tr><th class="dt-th">{{ t('inventory.products.suppliers_tab.name_col') }}</th><th class="dt-th">{{ t('inventory.products.suppliers_tab.code_col') }}</th><th class="dt-th">{{ t('inventory.products.suppliers_tab.contact_col') }}</th><th class="dt-th ta-right">{{ t('inventory.products.table.actions') }}</th></tr></thead>
          <tbody>
            <tr v-if="!suppliers.length"><td colspan="4" class="dt-empty"><div class="dt-empty-title">{{ t('inventory.products.suppliers_tab.empty') }}</div></td></tr>
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
    </div>

    <!-- ═══════════ REPORTS TAB ═══════════ -->
    <div v-if="activeTab === 'reports'" class="dt-empty" style="margin-top:48px;">
      <BarChart3 :size="36" class="dt-empty-icon" />
      <div class="dt-empty-title">{{ t('inventory.products.reports_tab.title') }}</div>
      <div class="dt-empty-sub">{{ t('inventory.products.reports_tab.coming_soon') }}</div>
    </div>

    <!-- MODALS -->
    <AppModal :open="saveModal.open" :title="t('inventory.products.save_preset_modal.title')" @close="saveModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div>
          <label class="form-label">{{ t('inventory.products.save_preset_modal.name_label') }}</label>
          <input v-model="saveModal.name" class="form-input" :placeholder="t('inventory.products.save_preset_modal.name_placeholder')" />
        </div>
        <label style="display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-secondary);cursor:pointer;">
          <input type="checkbox" v-model="saveModal.is_default" />
          {{ t('inventory.products.save_preset_modal.is_default_label') }}
        </label>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="saveModal.open = false">{{ t('common.cancel') }}</button>
        <button class="btn-primary" :disabled="!saveModal.name.trim()" @click="savePreset">{{ t('common.save') }}</button>
      </template>
    </AppModal>

    <AppModal :open="assignModal.open" :title="t('inventory.products.assign_modal.title')" @close="assignModal.open = false; assignConflict = null">
      <div class="assign-list">
        <div v-for="row in assignModal.rows" :key="row.user_id" class="assign-row">
          <div class="assign-user">
            <span class="assign-name">{{ row.full_name }}</span>
            <span class="assign-role">{{ row.role }}</span>
          </div>
          <select v-model="row.preset_id" class="form-input assign-sel" @change="assignTo(row)">
            <option :value="null">{{ t('inventory.products.assign_modal.default_option') }}</option>
            <option v-for="p in presets" :key="p.id" :value="p.id">{{ p.name }}</option>
          </select>
        </div>
        <div v-if="!assignModal.rows.length" style="color:var(--text-muted);font-size:13px;text-align:center;padding:16px;">{{ t('inventory.products.assign_modal.no_staff') }}</div>
      </div>
      <div v-if="assignConflict" class="assign-conflict-banner">
        <span style="font-size:13px;">⚠</span>
        <span><strong>{{ assignConflict.user }}</strong> ({{ assignConflict.role }}) {{ t('inventory.products.assign_modal.conflict_cant_see') }}
          <em>{{ assignConflict.cols }}</em> {{ t('inventory.products.assign_modal.conflict_suffix') }}</span>
        <button style="background:none;border:none;cursor:pointer;color:inherit;font-size:14px;line-height:1;padding:0 2px;" @click="assignConflict = null">✕</button>
      </div>
    </AppModal>

    <AppModal :open="catModal.open" :title="catModal.id ? t('inventory.products.category_modal.edit_title') : t('inventory.products.category_modal.new_title')" @close="catModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div><label class="form-label">{{ t('common.name') }}</label><input v-model="catModal.name" class="form-input" :placeholder="t('inventory.products.category_modal.name_placeholder')" /></div>
        <div><label class="form-label">{{ t('inventory.products.category_modal.parent_label') }}</label>
          <select v-model="catModal.parent" class="form-input">
            <option value="">{{ t('inventory.products.category_modal.parent_none') }}</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="catModal.open = false">{{ t('common.cancel') }}</button>
        <button class="btn-primary" @click="saveCategory" :disabled="!catModal.name.trim()">{{ t('common.save') }}</button>
      </template>
    </AppModal>

    <AppModal :open="supModal.open" :title="supModal.id ? t('inventory.products.supplier_modal.edit_title') : t('inventory.products.supplier_modal.new_title')" @close="supModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div><label class="form-label">{{ t('common.name') }}</label><input v-model="supModal.name" class="form-input" :placeholder="t('inventory.products.supplier_modal.name_placeholder')" /></div>
        <div><label class="form-label">{{ t('inventory.products.supplier_modal.code_prefix_label') }}</label><input v-model="supModal.code_prefix" class="form-input" :placeholder="t('inventory.products.supplier_modal.code_prefix_placeholder')" maxlength="3" /></div>
        <div><label class="form-label">{{ t('inventory.products.supplier_modal.contact_label') }}</label><textarea v-model="supModal.contact_info" class="form-input" rows="2" :placeholder="t('inventory.products.supplier_modal.contact_placeholder')" /></div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="supModal.open = false">{{ t('common.cancel') }}</button>
        <button class="btn-primary" @click="saveSupplier" :disabled="!supModal.name.trim() || supModal.code_prefix.length !== 3">{{ t('common.save') }}</button>
      </template>
    </AppModal>

    <!-- ═══════════ PRODUCT ADD / EDIT ═══════════ -->
    <AppModal :open="prodModal.open" :title="prodModal.id ? t('inventory.products.product_modal.edit_title') : t('inventory.products.product_modal.new_title')" width="900px" :noBackdropClose="true" @close="prodModal.open = false">
      <div class="pm2-grid">

        <!-- ── LEFT: Identity + Pricing + Units ── -->
        <div class="pm2-col">

          <div class="pm2-section">{{ fmtStore.itemLabel }}</div>

          <div class="pm2-field">
            <div class="pm2-fh">
              <label class="pm2-label">Name</label>
              <button type="button" class="pm2-pin" :class="{ on: prodDefaults.name_enabled }"
                      :title="t('inventory.products.product_modal.default_hint')"
                      @click="prodDefaults.name_enabled = !prodDefaults.name_enabled; saveDefaults()">★</button>
            </div>
            <!-- Memory Base autocomplete: typing a name suggests reference-pool
                 entries; picking one autofills the attributes (active ingredient,
                 brand, manufacturer…). Only when creating, never when editing. -->
            <div class="pm2-name-ac">
              <input v-model="prodModal.name" class="pm2-input" :placeholder="`${fmtStore.itemLabel} name`"
                     autocomplete="off"
                     @input="onProdNameInput"
                     @focus="nameAC.open = nameAC.results.length > 0"
                     @blur="closeNameAcSoon" />
              <div v-if="nameAC.open && nameAC.results.length" class="ac-dropdown">
                <button v-for="r in nameAC.results" :key="r.id" type="button" class="ac-item"
                        @mousedown.prevent="pickFromMemory(r)">
                  <span class="ac-name">{{ r.name }}</span>
                  <span v-if="acIngredient(r)" class="ac-meta">{{ acIngredient(r) }}</span>
                </button>
              </div>
            </div>
          </div>

          <div class="pm2-field">
            <label class="pm2-label">{{ t('common.description') }}</label>
            <textarea v-model="prodModal.description" class="pm2-input pm2-textarea" rows="3"
                      :placeholder="t('inventory.products.product_modal.description_placeholder')" />
          </div>

          <div class="pm2-section">Pricing</div>

          <div class="pm2-price-band">
            <div class="pm2-price-cell">
              <label class="pm2-label">{{ t('inventory.products.product_modal.base_price') }}</label>
              <div class="pm2-adorn">
                <span class="pm2-sym">$</span>
                <input v-model.number="prodModal.base_price" type="number" min="0" step="0.01"
                       placeholder="0.00" class="pm2-price-in" />
              </div>
            </div>
            <div class="pm2-price-cell">
              <label class="pm2-label">{{ t('inventory.products.product_modal.cost_price') }}</label>
              <div class="pm2-adorn">
                <span class="pm2-sym">$</span>
                <input v-model.number="prodModal.cost_price" type="number" min="0" step="0.01"
                       placeholder="0.00" class="pm2-price-in" />
              </div>
            </div>
            <div class="pm2-price-cell">
              <label class="pm2-label">{{ t('inventory.products.product_modal.sell_price') }}</label>
              <div class="pm2-adorn">
                <span class="pm2-sym">$</span>
                <input v-model.number="prodModal.sell_price" type="number" min="0" step="0.01"
                       placeholder="0.00" class="pm2-price-in" />
              </div>
            </div>
          </div>

          <!-- Selling Units (multi-unit stores, new + edit) -->
          <div v-if="storeSettings.multi_unit_enabled" class="pm2-units">
            <div class="pm2-units-head">
              <div class="pm2-section" style="margin-bottom:0">Selling Units</div>
              <button type="button" class="pm2-add-unit-btn" @click="addUnitRow">+ Add unit</button>
            </div>
            <div class="pm2-units-sub">Bigger units for this product (e.g. Strip = 10 pcs). Stock is always stored in pcs.</div>
            <table v-if="prodModal.units.length" class="pm2-units-table">
              <thead><tr>
                <th>Unit name</th>
                <th>= how many pcs</th>
                <th>Sell Price</th>
                <th></th>
              </tr></thead>
              <tbody>
                <tr v-for="(u, i) in prodModal.units" :key="i">
                  <td><input v-model="u.name" class="pm2-input" placeholder="Strip" /></td>
                  <td><input v-model.number="u.factor" type="number" min="1" step="1" class="pm2-input" placeholder="10" /></td>
                  <td><input v-model.number="u.sell_price" type="number" min="0" step="0.01" class="pm2-input" placeholder="0" /></td>
                  <td><button type="button" class="pm2-unit-del" @click="prodModal.units.splice(i, 1)">×</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ── RIGHT: Organization + Stock + Attributes ── -->
        <div class="pm2-col">

          <div class="pm2-section">Organization</div>

          <div class="pm2-field">
            <div class="pm2-fh">
              <label class="pm2-label">{{ t('inventory.products.product_modal.category_label') }}</label>
              <button type="button" class="pm2-pin" :class="{ on: prodDefaults.category_enabled }"
                      :title="t('inventory.products.product_modal.default_hint')"
                      @click="prodDefaults.category_enabled = !prodDefaults.category_enabled; saveDefaults()">★</button>
            </div>
            <div class="pm2-sel-wrap">
              <select v-model="prodModal.category" class="pm2-input pm2-sel"
                      @change="prodDefaults.category_enabled && saveDefaults()">
                <option value="">{{ t('inventory.products.product_modal.category_none') }}</option>
                <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
              </select>
            </div>
          </div>

          <div class="pm2-field">
            <div class="pm2-fh">
              <label class="pm2-label" style="display:flex;align-items:center;gap:5px;">
                {{ t('inventory.products.product_modal.supplier_label') }}
                <Lock v-if="prodModal.id" :size="11" />
              </label>
              <button v-if="!prodModal.id" type="button" class="pm2-pin" :class="{ on: prodDefaults.supplier_enabled }"
                      :title="t('inventory.products.product_modal.default_hint')"
                      @click="prodDefaults.supplier_enabled = !prodDefaults.supplier_enabled; saveDefaults()">★</button>
            </div>
            <div class="pm2-sel-wrap">
              <select v-if="!prodModal.id" v-model="prodModal.supplier" class="pm2-input pm2-sel"
                      @change="prodDefaults.supplier_enabled && saveDefaults()">
                <option value="">{{ t('inventory.products.product_modal.select_supplier') }}</option>
                <option v-for="s in suppliers" :key="s.id" :value="s.id">{{ s.name }} ({{ s.code_prefix }})</option>
              </select>
              <input v-else class="pm2-input" :value="prodModal.supplierName" disabled
                     :title="t('inventory.products.product_modal.supplier_locked')"
                     style="opacity:.6;cursor:not-allowed" />
            </div>
          </div>

          <div class="pm2-section">Stock</div>

          <div class="pm2-stock-row">
            <div class="pm2-field">
              <div class="pm2-fh">
                <label class="pm2-label">{{ t('inventory.products.product_modal.reorder_label') }}</label>
                <button type="button" class="pm2-pin" :class="{ on: prodDefaults.reorder_enabled }"
                        :title="t('inventory.products.product_modal.default_hint')"
                        @click="prodDefaults.reorder_enabled = !prodDefaults.reorder_enabled; saveDefaults()">★</button>
              </div>
              <input v-model.number="prodModal.reorder_level" class="pm2-input" type="number" min="0" step="1"
                     placeholder="0" :title="t('inventory.products.product_modal.reorder_hint')" />
            </div>
            <div v-if="!prodModal.id" class="pm2-field">
              <div class="pm2-fh">
                <label class="pm2-label">{{ t('inventory.products.product_modal.initial_stock_label') }}</label>
                <button type="button" class="pm2-pin" :class="{ on: prodDefaults.stock_enabled }"
                        :title="t('inventory.products.product_modal.default_hint')"
                        @click="prodDefaults.stock_enabled = !prodDefaults.stock_enabled; saveDefaults()">★</button>
              </div>
              <input v-model.number="prodModal.initial_stock" class="pm2-input" type="number" min="0" step="1"
                     placeholder="1" :title="t('inventory.products.product_modal.initial_stock_hint')" />
            </div>
          </div>

          <!-- Attributes -->
          <div v-if="attributes.length" class="pm2-attrs">
            <div class="pm2-section">{{ t('inventory.products.product_modal.attributes_label') }}</div>
            <div class="pm2-attrs-grid">
              <div v-for="def in attributes" :key="def.id" class="pm2-field">
                <label class="pm2-label">{{ def.name }}</label>
                <div v-if="def.options && def.options.length" class="pm2-attr-row">
                  <div class="pm2-sel-wrap" style="flex:1">
                    <select v-model="prodModal.attrs[def.id]" class="pm2-input pm2-sel">
                      <option value="">—</option>
                      <option v-for="(o, i) in def.options" :key="i" :value="optText(o)">{{ optText(o) }}</option>
                    </select>
                  </div>
                  <button class="pm2-attr-add" :title="t('inventory.products.product_modal.add_option_hint')"
                          @click.stop="openAddOption(def)">
                    <Plus :size="13" />
                  </button>
                </div>
                <input v-else v-model="prodModal.attrs[def.id]" class="pm2-input" :placeholder="def.name" />
              </div>
            </div>
          </div>

        </div>
      </div>
      <p v-if="prodModal.error" style="font-size:12.5px;color:var(--danger);margin-top:4px;">{{ prodModal.error }}</p>
      <template #footer>
        <span style="font-size:11.5px;color:var(--text-muted);margin-right:auto;">{{ t('inventory.products.product_modal.alt_s_hint') }}</span>
        <button class="btn-ghost" @click="prodModal.open = false">{{ t('common.cancel') }}</button>
        <button
          class="btn-primary"
          :disabled="!prodModal.name.trim() || (!prodModal.id && !prodModal.supplier) || prodModal.saving"
          @click="saveProduct"
        >{{ prodModal.saving ? t('common.saving') : t('common.save') }}</button>
      </template>
    </AppModal>

    <!-- Add new attribute option mini-modal -->
    <AppModal :open="addOptModal.open" :title="t('inventory.products.add_option_modal.title', { name: addOptModal.defName })" width="380px" @close="addOptModal.open = false">
      <div>
        <label class="form-label">{{ t('inventory.products.add_option_modal.new_option_label') }}</label>
        <input ref="addOptInput" v-model="addOptModal.value" class="form-input" :placeholder="t('inventory.products.add_option_modal.placeholder')" @keyup.enter="confirmAddOption" />
        <p v-if="addOptModal.error" class="form-label" style="color:var(--danger,#dc2626);margin-top:6px;">{{ addOptModal.error }}</p>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="addOptModal.open = false">{{ t('common.cancel') }}</button>
        <button class="btn-primary" :disabled="!addOptModal.value.trim() || addOptModal.saving" @click="confirmAddOption">
          {{ addOptModal.saving ? t('common.saving') : t('common.add') }}
        </button>
      </template>
    </AppModal>

    <!-- ═══════════ BULK EDIT ═══════════ -->
    <AppModal :open="bulkEditModal.open" :title="t('inventory.products.bulk_edit_modal.title')" @close="bulkEditModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <p style="font-size:13px;color:var(--text-muted);margin:0;">
          {{ t('inventory.products.bulk_edit_modal.intro', { count: selectedCount }) }}
        </p>
        <div>
          <label class="form-label">{{ t('inventory.products.bulk_edit_modal.retail_price') }}</label>
          <input v-model="bulkEditModal.retail_price" class="form-input" type="number" min="0" step="0.01" :placeholder="t('inventory.products.bulk_edit_modal.unchanged')" />
        </div>
        <div>
          <label class="form-label">{{ t('inventory.products.bulk_edit_modal.category_label') }}</label>
          <select v-model="bulkEditModal.category" class="form-input">
            <option value="">{{ t('inventory.products.bulk_edit_modal.unchanged') }}</option>
            <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="bulkEditModal.open = false">{{ t('common.cancel') }}</button>
        <button
          class="btn-primary"
          :disabled="bulkBusy || (bulkEditModal.retail_price === '' && !bulkEditModal.category)"
          @click="confirmBulkEdit"
        >{{ bulkEditModal.confirming ? t('inventory.products.bulk_edit_modal.confirm_apply') : t('inventory.products.bulk_edit_modal.apply') }}</button>
      </template>
    </AppModal>

    <!-- ═══════════ BULK DELETE ═══════════ -->
    <ReasonModal
      :key="rmIdx"
      :open="rmOpen"
      :item-name="rmQueue[rmIdx]?.name || ''"
      :reasons="DELETE_REASONS"
      mistake-value="MISTAKE"
      :current="rmIdx + 1"
      :total="rmQueue.length"
      @confirm="onRMConfirm"
      @cancel="onRMCancel"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  Package, BarChart3, Search, X, Filter, Pencil, Trash2, Tags, Truck, Plus,
  ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowUpDown,
  Columns3, GripVertical, Lock, UserCog, RotateCcw,
  Eye, EyeOff, CheckSquare,
} from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import { useFormatStore } from '@/stores/format'
import { formatQty } from '@/utils/format'
import { decomposeStock, headlineLabel, formatBreakdown } from '@/utils/units'
import { showSuccessToast, showWarningToast } from '@/utils/toast'
import { useFormDirty } from '@/composables/useFormDirty'
import { useCtrlN } from '@/composables/useCtrlN'
useCtrlN(openAddProduct)

// Stock badge: lead with the biggest unit (packs) for tiered products; plain
// base number for everything else. Full ladder shows on hover.
function stockBadge(p) {
  const d = decomposeStock(p.total_stock, p.selling_units)
  return d.hasTiers ? headlineLabel(d.headline) : formatQty(p.total_stock)
}
function stockTitle(p) {
  const d = decomposeStock(p.total_stock, p.selling_units)
  return d.hasTiers ? formatBreakdown(d.parts) : ''
}
// One tier column's value = that tier's slice of the stock ladder. Products that
// don't carry the tier (e.g. a laptop in a pharmacy) show a dash.
function tierCell(p, col) {
  const d = decomposeStock(p.total_stock, p.selling_units)
  if (!d.hasTiers) return '—'
  const part = d.parts.find(pt => pt.name === col.tierName)
  return part ? formatQty(part.count) : '—'
}
import AppModal from '@/components/ui/AppModal.vue'
import ReasonModal from '@/components/ui/ReasonModal.vue'

const { t } = useI18n()
const auth = useAuthStore()
const fmtStore = useFormatStore()
const router = useRouter()
const { isDirty, setDirty } = useFormDirty()

// Alt+S global shortcut — save product modal when open
function handleGlobalKey(e) {
  if (e.altKey && e.key === 's' && prodModal.open && !prodModal.saving) {
    e.preventDefault()
    saveProduct()
  }
}
onMounted(() => document.addEventListener('keydown', handleGlobalKey))
onUnmounted(() => document.removeEventListener('keydown', handleGlobalKey))

// Column header label: product noun + per-store category tier names are dynamic.
const _CAT_IDX = { cat1: 0, cat2: 1, cat3: 2, cat4: 3 }
const _COL_KEY_MAP = { inStock: 'in_stock' }   // template key → i18n key
function headerLabel(key, fallback) {
  if (key === 'product') return fmtStore.itemLabelUpper
  if (key in _CAT_IDX) {
    const lvl = fmtStore.categoryLevels[_CAT_IDX[key]]
    return (lvl || t('inventory.products.columns.' + key)).toUpperCase()
  }
  // Attribute + tier columns have no i18n key — use the dynamic label
  // (attribute name / store tier name), which relabels live on rename.
  if (key.startsWith('attr_') || key.startsWith('tier_')) return fallback
  const tk = 'inventory.products.columns.' + (_COL_KEY_MAP[key] || key)
  const translated = t(tk)
  return translated === tk ? fallback : translated
}

const tabs = computed(() => [
  { id: 'products', label: t('inventory.products.tabs.products'), icon: Package },
  // Categories now live on their own tree page (/inventory/categories).
  { id: 'suppliers', label: t('inventory.products.tabs.suppliers'), icon: Truck },
  { id: 'reports', label: t('inventory.products.tabs.reports'), icon: BarChart3 },
])
const activeTab = ref('products')

/* ── columns ── */
const BASE_COLUMNS = [
  { key: 'sku',       label: 'SKU',       sort: 'o_sku',          align: 'left',  field: 'sku_display',   cls: 'c-sku' },
  { key: 'product',   label: 'PRODUCT',   sort: 'name',           align: 'left',  field: 'name',          cls: 'c-name' },
  { key: 'supplier',  label: 'SUPPLIER',  sort: 'supplier__name', align: 'left',  field: 'supplier_name', cls: 'c-sup' },
  { key: 'cat1',      label: 'CATEGORY',     align: 'left', field: 'category_l1', cls: 'c-sup' },
  { key: 'cat2',      label: 'SUB-CATEGORY', align: 'left', field: 'category_l2', cls: 'c-sup' },
  { key: 'cat3',      label: 'SUB-CAT 3',    align: 'left', field: 'category_l3', cls: 'c-sup' },
  { key: 'cat4',      label: 'SUB-CAT 4',    align: 'left', field: 'category_l4', cls: 'c-sup' },
  { key: 'wholesale', label: 'WHOLESALE', sort: 'o_wholesale',    align: 'left',  field: 'cost_display',  cls: 'c-mono c-muted', money: true },
  { key: 'retail',    label: 'RETAIL',    sort: 'o_retail',       align: 'left',  field: 'price_display', cls: 'c-mono c-retail', money: true },
  { key: 'profit',    label: 'PROFIT',    sort: 'o_profit',       align: 'left',  field: 'profit_display',cls: 'c-mono c-profit', money: true, plus: true },
  { key: 'inStock',   label: 'IN STOCK',  sort: 'o_stock',        align: 'right', field: 'total_stock',   cls: '', badge: true },
]
const attrCols = ref([])  // dynamically built from loaded attribute definitions

// Selling-unit tier columns: one per named tier (e.g. Strip, Pack), shown beside
// the base IN STOCK quantity. Only exist when the store has multi-unit selling
// enabled — flip the capability off and they vanish from table + Customize.
// Each cell is the tier's slice of the stock ladder (decomposeStock parts),
// matching the breakdown shown on the product page.
const tierCols = computed(() => {
  if (!storeSettings.multi_unit_enabled) return []
  return (storeSettings.unit_tier_names || [])
    .map((name, i) => ({
      key: `tier_${i}`, label: (name || '').toUpperCase(),
      align: 'right', cls: 'c-mono', isTier: true, tierName: name,
    }))
    .filter(c => c.tierName)
})

const columns = computed(() => [...BASE_COLUMNS, ...tierCols.value, ...attrCols.value])

const DEFAULT_WIDTHS = { sku: 130, product: 300, supplier: 170, cat1: 150, cat2: 150, cat3: 150, cat4: 150, wholesale: 120, retail: 120, profit: 120, inStock: 110 }
const colWidths = reactive({ ...DEFAULT_WIDTHS })

const TABLE_ID = 'inventory_products'
const ADHOC_KEY = 'dt_inventory_adhoc'
const LOCKED = ['sku', 'product']           // can't be hidden
const colByKey = computed(() => Object.fromEntries(columns.value.map(c => [c.key, c])))

const colOrder = ref(BASE_COLUMNS.map(c => c.key))
// Deeper category tiers are available but hidden by default (toggle in Customize
// Columns). Only applies to fresh users — saved layouts/presets take over.
const colHidden = ref(['cat3', 'cat4'])

// Layer 1: attr columns always permitted; cat columns only if the level name is non-empty;
// others permitted if the field is present in data.
const permittedKeys = computed(() => {
  const sample = products.value[0]
  return columns.value.filter(c => {
    if (c.key in _CAT_IDX && !fmtStore.categoryLevels[_CAT_IDX[c.key]]) return false
    return c.isAttr || !c.field || !sample || sample[c.field] !== undefined
  }).map(c => c.key)
})

// Edit mode previews live off the working copy.
const editing = ref(false)
const working = reactive({ order: [], hidden: [] })
const activeOrder = computed(() => (editing.value ? working.order : colOrder.value))
const activeHidden = computed(() => (editing.value ? working.hidden : colHidden.value))

const displayColumns = computed(() =>
  activeOrder.value
    .filter(k => permittedKeys.value.includes(k) && !activeHidden.value.includes(k))
    .map(k => colByKey.value[k])
    .filter(Boolean)
)
// Customize chooser rows: skip any order key with no live column (e.g. a tier
// key left over after the multi-unit capability was switched off).
const chooserOrder = computed(() => working.order.filter(k => colByKey.value[k]))
const tableMin = computed(() => displayColumns.value.reduce((a, c) => a + colWidths[c.key], 0))
const canEdit = computed(() => ['OWNER', 'ADMIN'].includes(auth.userRole) || auth.isSuperadmin)

function cellText(col, p) {
  if (col.isTier) return tierCell(p, col)
  if (col.isAttr) {
    const vals = p.attributes_summary?.[col.attrKey]
    return vals?.length ? vals.join(', ') : '—'
  }
  const v = p[col.field]
  if (v === undefined || v === null || v === '') return '—'
  return col.money ? (col.plus ? '+' : '') + auth.currencySymbol + v : v
}

/* ── layout (preset) apply / persist ── */
const baseConfig = ref(null)   // effective preset config, for Reset
const hasAdhoc = ref(!!localStorage.getItem(ADHOC_KEY))

function applyLayout(cfg) {
  if (!cfg) return
  const known = columns.value.map(c => c.key)
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
let _adhocSaveTimer = null
function saveAdhoc() {
  if (editing.value) return
  const cfg = currentConfig()
  localStorage.setItem(ADHOC_KEY, JSON.stringify(cfg))
  hasAdhoc.value = true
  // Debounce server save — avoid hammering on rapid resizes
  clearTimeout(_adhocSaveTimer)
  _adhocSaveTimer = setTimeout(() => {
    api.post('/api/smart/presets/my-config/', { table_id: TABLE_ID, config: cfg }).catch(() => {})
  }, 1500)
}

async function loadLayout() {
  // Priority: localStorage (instant) > server adhoc > assigned preset/default
  const localAdhoc = JSON.parse(localStorage.getItem(ADHOC_KEY) || 'null')
  try {
    const [effectiveRes, serverAdhocRes] = await Promise.all([
      api.get('/api/smart/presets/effective/', { params: { table_id: TABLE_ID } }),
      api.get('/api/smart/presets/my-config/', { params: { table_id: TABLE_ID } }),
    ])
    baseConfig.value = effectiveRes.data?.config ?? null
    const serverAdhoc = serverAdhocRes.data && Object.keys(serverAdhocRes.data).length ? serverAdhocRes.data : null
    // localStorage wins if it exists (most recent); server adhoc next; then preset default
    applyLayout(localAdhoc || serverAdhoc || baseConfig.value)
    // Sync localStorage from server if localStorage was empty
    if (!localAdhoc && serverAdhoc) {
      localStorage.setItem(ADHOC_KEY, JSON.stringify(serverAdhoc))
      hasAdhoc.value = true
    }
  } catch {
    baseConfig.value = null
    applyLayout(localAdhoc)
  }
  fetchProducts(1)
}
function resetLayout() {
  localStorage.removeItem(ADHOC_KEY); hasAdhoc.value = false
  colOrder.value = columns.value.map(c => c.key); colHidden.value = ['cat3', 'cat4', ...attrCols.value.map(c => c.key)]
  Object.assign(colWidths, DEFAULT_WIDTHS); sortKey.value = null; sortDir.value = 'asc'
  // Also clear server adhoc
  api.post('/api/smart/presets/my-config/', { table_id: TABLE_ID, config: {} }).catch(() => {})
  applyLayout(baseConfig.value)
  fetchProducts(1)
}
function resetWorking() { working.order = columns.value.map(c => c.key); working.hidden = ['cat3', 'cat4', ...attrCols.value.map(c => c.key)] }

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

/* ── presets + assignment ── */
const presets = ref([])
const saveModal = reactive({ open: false, name: '', is_default: false })
const assignModal = reactive({ open: false, rows: [] })
const assignConflict = ref(null)

// Mirrors backend DEFAULT_HIDDEN for this table — columns restricted per role.
const ROLE_HIDDEN_KEYS = { CASHIER: ['wholesale', 'profit'] }

async function fetchPresets() { try { const { data } = await api.get('/api/smart/presets/', { params: { table_id: TABLE_ID } }); presets.value = data.results ?? data } catch { /* noop */ } }
function loadPreset(p) {
  const known = columns.value.map(c => c.key)
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
  assignConflict.value = null
  if (row.preset_id) {
    const preset = presets.value.find(p => p.id === row.preset_id)
    const restricted = ROLE_HIDDEN_KEYS[row.role] || []
    if (preset && restricted.length) {
      const presetHidden = preset.config?.hidden || []
      const conflicts = restricted.filter(k => !presetHidden.includes(k))
      if (conflicts.length) {
        const labels = conflicts.map(k => columns.value.find(c => c.key === k)?.label || k).join(', ')
        assignConflict.value = { user: row.full_name, role: row.role, cols: labels }
      }
    }
  }
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
      const col = columns.value.find(c => c.key === sortKey.value)
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

/* ── categories / suppliers CRUD ── */
const categories = ref([])
const suppliers = ref([])
const catModal = reactive({ open: false, id: null, name: '', parent: '' })
const supModal = reactive({ open: false, id: null, name: '', code_prefix: '', contact_info: '' })

async function fetchAttributes() {
  try {
    const r = await api.get('/api/inventory/attributes/')
    attributes.value = r.data.results ?? r.data
    // Build dynamic attribute columns — hidden by default, user opts in via Customize
    const newAttrCols = attributes.value.map(a => ({
      key: `attr_${a.key}`, label: a.name.toUpperCase(), align: 'left',
      field: `attr_${a.key}`, cls: 'c-sup', isAttr: true, attrKey: a.key,
    }))
    attrCols.value = newAttrCols
    // Add to colOrder (hidden by default) if not already present
    const existingKeys = new Set(colOrder.value)
    const toAdd = newAttrCols.filter(c => !existingKeys.has(c.key)).map(c => c.key)
    if (toAdd.length) {
      colOrder.value = [...colOrder.value, ...toAdd]
      colHidden.value = [...colHidden.value, ...toAdd]
    }
    // Ensure colWidths has defaults for attr cols
    for (const c of newAttrCols) if (!colWidths[c.key]) colWidths[c.key] = 130
  } catch { /* noop */ }
}
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
async function deleteCategory(id) { if (!confirm(t('inventory.products.categories_tab.confirm_delete'))) return; await api.delete(`/api/inventory/categories/${id}/`); fetchCategories() }

function openEditSupplier(s) { Object.assign(supModal, { open: true, id: s.id, name: s.name, code_prefix: s.code_prefix, contact_info: s.contact_info || '' }) }
async function saveSupplier() {
  const payload = { name: supModal.name, code_prefix: supModal.code_prefix, contact_info: supModal.contact_info }
  supModal.id ? await api.patch(`/api/inventory/suppliers/${supModal.id}/`, payload) : await api.post('/api/inventory/suppliers/', payload)
  supModal.open = false; fetchSuppliers()
}
async function deleteSupplier(id) { if (!confirm(t('inventory.products.suppliers_tab.confirm_delete'))) return; await api.delete(`/api/inventory/suppliers/${id}/`); fetchSuppliers() }

/* ── store settings (for multi-unit gate) ── */
const storeSettings = reactive({ multi_unit_enabled: false, base_unit_name: 'pcs', unit_tier_names: ['Strip', 'Pack'] })
async function fetchStoreSettings() {
  try {
    const { data } = await api.get('/api/core/settings/')
    storeSettings.multi_unit_enabled = data.multi_unit_enabled ?? false
    storeSettings.base_unit_name = data.base_unit_name || 'pcs'
    storeSettings.unit_tier_names = data.unit_tier_names || ['Strip', 'Pack']
  } catch { /* noop */ }
}

// Keep tier columns wired into the layout as the capability / tier names change:
// give each a default width, drop any tier keys that no longer exist (capability
// turned off, or a tier renamed away), and slot new ones in right after IN STOCK,
// hidden by default so the user opts in via Customize. Declared after
// storeSettings so the immediate run can read it (no temporal-dead-zone).
watch(tierCols, (cols) => {
  const keys = cols.map(c => c.key)
  for (const c of cols) if (!colWidths[c.key]) colWidths[c.key] = 100
  const keep = (k) => !k.startsWith('tier_') || keys.includes(k)
  colOrder.value  = colOrder.value.filter(keep)
  colHidden.value = colHidden.value.filter(keep)
  const missing = keys.filter(k => !colOrder.value.includes(k))
  if (missing.length) {
    const arr = [...colOrder.value]
    const idx = arr.indexOf('inStock')
    arr.splice(idx >= 0 ? idx + 1 : arr.length, 0, ...missing)
    colOrder.value  = arr
    colHidden.value = [...colHidden.value, ...missing]
  }
}, { immediate: true })

/* ── product defaults (persisted in localStorage) ── */
const PROD_DEFAULTS_KEY = 'prod_field_defaults'
const prodDefaults = reactive({
  name_enabled: false,
  category_enabled: false, category_value: '',
  supplier_enabled: false, supplier_value: '',
  reorder_enabled: false, reorder_value: 0,
  stock_enabled: false, stock_value: 1,
})
function loadDefaults() {
  try {
    const d = JSON.parse(localStorage.getItem(PROD_DEFAULTS_KEY) || '{}')
    Object.assign(prodDefaults, d)
  } catch { /* noop */ }
}
function saveDefaults() {
  if (prodDefaults.category_enabled) prodDefaults.category_value = prodModal.category
  if (prodDefaults.supplier_enabled) prodDefaults.supplier_value = prodModal.supplier
  if (prodDefaults.reorder_enabled)  prodDefaults.reorder_value  = prodModal.reorder_level
  if (prodDefaults.stock_enabled)    prodDefaults.stock_value    = prodModal.initial_stock
  localStorage.setItem(PROD_DEFAULTS_KEY, JSON.stringify({ ...prodDefaults }))
}

/* ── product add / edit ── */
const prodModal = reactive({
  open: false, id: null, name: '', description: '', category: '', supplier: '', supplierName: '',
  base_price: null, cost_price: null, sell_price: null, reorder_level: null, initial_stock: 1, attrs: {}, saving: false, error: '',
  units: [],
})
function optText(o) { return typeof o === 'string' ? o : (o?.value ?? o?.label ?? String(o)) }
function resetAttrs() { const a = {}; for (const d of attributes.value) a[d.id] = ''; prodModal.attrs = a }

// ── Memory Base autocomplete (New Product) ───────────────────────────────────
// Reuses the shared products endpoint with ?source=all so it searches both real
// inventory AND the Memory Base reference pool (the seeded catalog the items list
// now hides). Picking a suggestion fills the name + maps its attributes onto the
// new product. Price/cost/stock stay hand-entered. Never runs while editing.
const nameAC = reactive({ results: [], open: false })
let nameAcTimer = null
function acIngredient(r) {
  const v = r?.attributes_summary?.active_ing
  return Array.isArray(v) && v.length ? v[0] : ''
}
function onProdNameInput() {
  clearTimeout(nameAcTimer)
  const q = (prodModal.name || '').trim()
  if (prodModal.id || q.length < 2) { nameAC.results = []; nameAC.open = false; return }
  nameAcTimer = setTimeout(async () => {
    try {
      const { data } = await api.get('/api/inventory/products/', { params: { search: q, page_size: 8, source: 'all' } })
      nameAC.results = data.results ?? data
      nameAC.open = nameAC.results.length > 0
    } catch { nameAC.results = []; nameAC.open = false }
  }, 250)
}
function pickFromMemory(r) {
  prodModal.name = r.name
  const summary = r.attributes_summary || {}
  // attributes_summary is keyed by the attribute KEY (e.g. active_ing); prodModal.attrs
  // is keyed by definition id — map across via each definition's key.
  for (const def of attributes.value) {
    const vals = summary[def.key]
    if (Array.isArray(vals) && vals.length) prodModal.attrs[def.id] = vals[0]
  }
  nameAC.open = false
  nameAC.results = []
}
function closeNameAcSoon() { setTimeout(() => { nameAC.open = false }, 150) }

function openAddProduct() {
  fetchStoreSettings()   // refresh the multi-unit gate so a just-changed capability is respected
  Object.assign(prodModal, {
    open: true, id: null, name: '', description: '',
    category: prodDefaults.category_enabled ? prodDefaults.category_value : '',
    supplier: prodDefaults.supplier_enabled ? prodDefaults.supplier_value : '',
    supplierName: '',
    base_price: null, cost_price: null, sell_price: null,
    reorder_level: prodDefaults.reorder_enabled ? prodDefaults.reorder_value : null,
    initial_stock: prodDefaults.stock_enabled ? prodDefaults.stock_value : 1,
    units: [],
    saving: false, error: '',
  })
  resetAttrs()
  nameAC.results = []; nameAC.open = false
}

/* ── add-option mini modal ── */
const addOptInput = ref(null)
const addOptModal = reactive({ open: false, defId: null, defName: '', value: '', saving: false, error: '' })

function openAddOption(def) {
  Object.assign(addOptModal, { open: true, defId: def.id, defName: def.name, value: '', saving: false, error: '' })
  nextTick(() => addOptInput.value?.focus())
}

async function confirmAddOption() {
  if (!addOptModal.value.trim() || addOptModal.saving) return
  addOptModal.saving = true; addOptModal.error = ''
  try {
    const { data } = await api.post(`/api/inventory/attributes/${addOptModal.defId}/add-option/`, { value: addOptModal.value.trim() })
    // update local attribute definition options
    const def = attributes.value.find(a => a.id === addOptModal.defId)
    if (def) def.options = data.options
    // select the new option in the modal
    prodModal.attrs[addOptModal.defId] = addOptModal.value.trim()
    addOptModal.open = false
  } catch (e) {
    addOptModal.error = e.response?.data?.detail || t('inventory.products.add_option_modal.err_add')
  } finally { addOptModal.saving = false }
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
    prodModal.reorder_level = v ? Number(v.reorder_level ?? 0) : 0
    if (v && v.attributes) for (const a of v.attributes) prodModal.attrs[a.definition] = a.value
    prodModal.units = (data.selling_units || [])
      .filter(u => !u.is_base)
      .map(u => ({ name: u.name, factor: Number(u.factor), sell_price: Number(u.sell_price || 0), barcode: u.barcode || '' }))
  } catch { prodModal.error = t('inventory.products.product_modal.err_load') }
}

function addUnitRow() { prodModal.units.push({ name: '', factor: null, sell_price: 0, barcode: '' }) }

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
    reorder_level: prodModal.reorder_level ?? 0,
    attributes: attributes_payload,
  }
  if (!prodModal.id) {
    payload.supplier = prodModal.supplier   // supplier locked on edit
  }
  if (storeSettings.multi_unit_enabled) {
    payload.selling_units = prodModal.units
      .filter(u => u.name && Number(u.factor) > 0)
      .map(u => ({ name: u.name, factor: Number(u.factor), sell_price: Number(u.sell_price || 0), barcode: u.barcode || '' }))
  }
  let stockWarning = false
  try {
    if (prodModal.id) {
      await api.patch(`/api/inventory/products/${prodModal.id}/`, payload)
    } else {
      const { data: created } = await api.post('/api/inventory/products/', payload)
      // Opening stock is NEVER a direct quantity write — it posts a ledgered
      // StockAdjustment (reason OPENING). If that entry can't be posted, the
      // product still exists but with 0 stock, so we warn instead of lying "saved".
      if (prodModal.initial_stock > 0) {
        try {
          const [detailRes, branchRes] = await Promise.all([
            api.get(`/api/inventory/products/${created.id}/`),
            api.get('/api/core/branches/'),
          ])
          const firstVariant = detailRes.data.variants?.[0]
          const branches = branchRes.data.results ?? branchRes.data
          if (firstVariant && branches.length) {
            await api.post('/api/inventory/adjustments/', {
              variant: firstVariant.id,
              branch: branches[0].id,
              quantity_change: prodModal.initial_stock,
              reason: 'OPENING',
              notes: 'Initial stock on creation',
            })
          } else {
            stockWarning = true   // no variant or no branch to receive the stock
          }
        } catch { stockWarning = true }
      }
    }
    if (stockWarning) {
      showWarningToast(t('inventory.products.product_modal.toast_stock_failed'))
    } else {
      showSuccessToast(t('inventory.products.product_modal.toast_saved'))
    }
    setDirty(false)
    prodModal.open = false
    fetchProducts(prodModal.id ? page.value : 1)
  } catch (e) {
    prodModal.error = e.response?.data?.detail
      || e.response?.data?.supplier?.[0]
      || t('inventory.products.product_modal.err_save')
  } finally { prodModal.saving = false }
}

watch(() => prodModal.open, (isOpen) => {
  if (isOpen) setDirty(false)
})

watch([
  () => prodModal.name,
  () => prodModal.description,
  () => prodModal.category,
  () => prodModal.base_price,
  () => prodModal.cost_price,
  () => prodModal.sell_price,
  () => prodModal.reorder_level,
], () => {
  if (prodModal.open && !prodModal.saving) setDirty(true)
})

/* ── ghost (hide from POS) + bulk ops ── */
const bulkMode = ref(false)
const selected = ref(new Set())
const DELETE_REASONS = computed(() => [
  { value: 'DISCONTINUED', label: t('inventory.products.delete_reasons.discontinued') },
  { value: 'DUPLICATE',    label: t('inventory.products.delete_reasons.duplicate') },
  { value: 'MISTAKE',      label: t('inventory.products.delete_reasons.mistake') },
  { value: 'OTHER',        label: t('inventory.products.delete_reasons.other') },
])
const bulkBusy = ref(false)
const rmQueue   = ref([])   // [{id, name}] — items pending a reason
const rmIdx     = ref(0)    // which item is on screen
const rmOpen    = ref(false)
const rmResults = ref([])   // [{id, reason}] collected so far
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
  else router.push('/inventory/products/' + p.id)
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
  rmQueue.value = selectedIds().map(id => {
    const p = products.value.find(x => x.id === id)
    return { id, name: p?.name || id }
  })
  rmIdx.value    = 0
  rmResults.value = []
  rmOpen.value   = true
}

function onRMConfirm(reason, applyToAll, cancelAll) {
  if (cancelAll) { rmOpen.value = false; return }

  const item = rmQueue.value[rmIdx.value]
  if (reason !== 'MISTAKE') rmResults.value.push({ id: item.id, reason })

  if (applyToAll) {
    // Apply same reason to every remaining item (skip MISTAKE scenario handled above)
    for (let i = rmIdx.value + 1; i < rmQueue.value.length; i++) {
      rmResults.value.push({ id: rmQueue.value[i].id, reason })
    }
    executeBulkDelete(); return
  }

  rmIdx.value++
  if (rmIdx.value >= rmQueue.value.length) { executeBulkDelete(); return }
  // else — stay open, watch(:key) on rmIdx resets component state
}

function onRMCancel() { rmOpen.value = false }

async function executeBulkDelete() {
  rmOpen.value = false
  if (!rmResults.value.length) return   // all were skipped (MISTAKE)

  // Group by reason so we make one API call per reason
  const byReason = {}
  for (const { id, reason } of rmResults.value) {
    ;(byReason[reason] ??= []).push(id)
  }

  bulkBusy.value = true
  try {
    for (const [reason, ids] of Object.entries(byReason)) {
      await api.post('/api/inventory/products/bulk_delete/', { ids, reason })
    }
    selected.value = new Set()
    await fetchProducts(1)
  } finally { bulkBusy.value = false }
}

onMounted(() => { fetchAttributes(); loadLayout(); fetchCategories(); fetchSuppliers(); loadDefaults(); fetchStoreSettings() })
</script>

<style scoped>
.inv-head { margin-bottom: 18px; }
.inv-title { font-size: 28px; font-weight: 800; letter-spacing: -0.02em; color: var(--text-primary); margin: 0 0 4px; }
.inv-sub { font-size: 13.5px; color: var(--text-muted); margin: 0; }

.tab-bar { display: flex; gap: 4px; border-bottom: 1px solid var(--border); margin-bottom: 8px; }
.tab-btn { display: flex; align-items: center; gap: 6px; padding: 10px 14px; font-size: 13.5px; font-weight: 500; color: var(--text-muted); border: none; background: none; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 120ms, border-color 120ms; }
.tab-btn:hover { color: var(--text-primary); }
.tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }

/* Toolbar shell (.dt-toolbar/.dt-search/.dt-filter/.dt-add) is global — see src/assets/main.css */
.cat-slider { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; overflow: hidden; }
.cat-nav { display: flex; flex-shrink: 0; border: none; background: none; cursor: pointer; color: var(--text-muted); border-radius: 8px; padding: 6px; transition: background 120ms, color 120ms; }
.cat-nav:hover { background: var(--sb-hover, var(--border)); color: var(--text-primary); }
.cat-nav:disabled { opacity: 0.3; cursor: default; }
.cat-nav:disabled:hover { background: none; color: var(--text-muted); }
.cat-track { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; overflow: hidden; }
.cat-pill { flex: 0 0 auto; padding: 9px 18px; border: 1px solid transparent; background: none; cursor: pointer; border-radius: 10px; font-size: 14px; font-weight: 500; color: var(--text-muted); white-space: nowrap; transition: background 120ms, color 120ms; }
.cat-pill:hover { background: var(--bg-card); color: var(--text-primary); }
.cat-pill.active { background: var(--text-primary); color: var(--bg-card); font-weight: 600; }

.dt-add:active { transform: scale(0.96); }   /* press feedback; base .dt-add is global */
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
.chooser { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
.chooser-row { display: flex; align-items: center; gap: 6px; padding: 5px 8px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-app); cursor: grab; transition: border-color 120ms; }
/* column-header drag visuals (.dt-th.col-dragging / .col-drag-over) are global */

.chooser-row:hover { border-color: var(--accent); }
.chooser-row.drag-over { border-color: var(--accent); background: var(--accent-soft); }
.chooser-row.disabled { opacity: 0.5; }
.chooser-grip { color: var(--text-muted); flex-shrink: 0; }
.chooser-cb { width: 15px; height: 15px; accent-color: var(--accent); cursor: pointer; }
.chooser-label { flex: 1; font-size: 12px; font-weight: 500; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.chooser-tag { color: var(--text-muted); flex-shrink: 0; }
.chooser-na { font-size: 10px; color: var(--text-muted); flex-shrink: 0; }

.assign-list { display: flex; flex-direction: column; gap: 8px; }
.assign-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--border); }
.assign-row:last-child { border-bottom: none; }
.assign-user { display: flex; flex-direction: column; }
.assign-name { font-size: 13.5px; font-weight: 600; color: var(--text-primary); }
.assign-role { font-size: 11px; color: var(--text-muted); text-transform: capitalize; }
.assign-sel { max-width: 180px; }
.assign-conflict-banner {
  display: flex; align-items: flex-start; gap: 8px;
  margin-top: 12px; padding: 10px 12px;
  background: rgba(245,158,11,.1); border: 1px solid rgba(245,158,11,.35);
  border-radius: 8px; font-size: 12.5px; color: var(--text-primary);
}

/* The whole .dt table system (card, scroll, sticky header, rows, empty
   states, pagination) is now global — see src/assets/main.css.
   Only product-specific cell styling lives below. */

.c-sku { font-family: ui-monospace, monospace; font-size: 13.5px; letter-spacing: 0.03em; color: var(--text-muted); }
.c-name { font-weight: 700; }
.col-frozen { position: sticky; left: 0; background: var(--bg-card); z-index: 1; }
.dt-row:hover .col-frozen { background: var(--bg-app); }
.c-sup { color: var(--text-secondary); font-size: 14.5px; }
.c-mono { font-family: ui-monospace, monospace; font-size: 14.5px; font-variant-numeric: tabular-nums; }
.c-muted { color: var(--text-muted); }
.c-retail { color: var(--success); font-weight: 600; }
.c-profit { color: var(--success); font-weight: 700; }
.dark .c-retail, .dark .c-profit { color: #4ade80; }

.stock-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 32px; padding: 3px 9px; border-radius: 8px; background: var(--text-primary); color: var(--bg-card); font-size: 12px; font-weight: 700; font-variant-numeric: tabular-nums; }
.tier-cell { font-variant-numeric: tabular-nums; font-weight: 600; color: var(--text-primary); }

/* empty/loading states + pagination are global — see src/assets/main.css */

/* reused */
.code-chip { font-family: ui-monospace, monospace; font-size: 12px; background: var(--bg-app); border: 1px solid var(--border); border-radius: 5px; padding: 2px 7px; color: var(--text-secondary); }
.dt-actcol { width: 96px; white-space: nowrap; }

/* ── bulk action bar ── */
.bulk-bar { display: flex; align-items: center; gap: 14px; background: var(--bg-card); border: 1px solid var(--accent); border-radius: 14px; padding: 10px 14px; margin-bottom: 12px; box-shadow: 0 4px 20px var(--accent-soft); transform-origin: top center; }
.bulk-count { font-size: 13px; font-weight: 700; color: var(--accent); }
.bulk-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.bulk-exit { display: flex; margin-left: auto; border: none; background: var(--border); color: var(--text-muted); border-radius: 7px; padding: 5px; cursor: pointer; }
.bulk-exit:hover { color: var(--text-primary); }
.btn-ghost.danger { color: var(--danger); border-color: #f3b1b1; }
.btn-ghost.danger:hover { background: var(--danger-soft); color: var(--danger-hover); }

/* ── select column + ghosted rows ── */
.dt-selcol { width: 42px; text-align: center; padding-left: 14px; padding-right: 0; }
.dt-cb { width: 15px; height: 15px; accent-color: var(--accent); cursor: pointer; }
.dt-row.selected { background: var(--accent-soft); }
.dt-row.ghosted td { opacity: 0.5; }
.dt-row.ghosted:hover td { opacity: 0.7; }
.ghost-tag { display: inline-flex; vertical-align: middle; margin-right: 5px; color: var(--text-muted); }
.row-action { width: 28px; height: 28px; border: none; background: none; border-radius: 6px; cursor: pointer; color: var(--text-muted); display: inline-flex; align-items: center; justify-content: center; transition: background 100ms, color 100ms; }
.row-action:hover { background: var(--border); color: var(--text-primary); }
.row-action.danger:hover { background: var(--danger-soft); color: var(--danger); }

/* ── Product add/edit wide modal ── */
/* ── PM2: Add / Edit Product Modal ──────────────────────── */
.pm2-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
@media (max-width: 640px) { .pm2-grid { grid-template-columns: 1fr; } }
.pm2-col { display: flex; flex-direction: column; gap: 12px; }

/* Section labels */
.pm2-section {
  font-size: 10.5px; font-weight: 800; text-transform: uppercase; letter-spacing: .09em;
  color: var(--text-muted); padding-bottom: 7px; border-bottom: 1px solid var(--border);
  margin-top: 4px;
}
.pm2-col > .pm2-section:first-child { margin-top: 0; }

/* Field */
.pm2-field { display: flex; flex-direction: column; gap: 5px; }
.pm2-fh { display: flex; align-items: center; justify-content: space-between; }
.pm2-label { font-size: 12.5px; font-weight: 600; color: var(--text-secondary); }

/* Memory Base name autocomplete */
.pm2-name-ac { position: relative; }
.pm2-name-ac .ac-dropdown {
  position: absolute; top: 100%; left: 0; right: 0; z-index: 30; margin-top: 4px;
  background: var(--bg-card); border: 1px solid var(--border); border-radius: 8px;
  box-shadow: var(--shadow-card, 0 6px 20px rgba(0,0,0,.12));
  overflow: hidden; max-height: 240px; overflow-y: auto;
}
.pm2-name-ac .ac-item {
  display: flex; flex-direction: column; gap: 2px; width: 100%; text-align: left;
  padding: 8px 10px; border: none; background: none; cursor: pointer; transition: background 100ms;
}
.pm2-name-ac .ac-item:hover { background: var(--bg-app); }
.pm2-name-ac .ac-name { font-size: 13px; font-weight: 500; color: var(--text-primary); }
.pm2-name-ac .ac-meta { font-size: 11px; color: var(--text-muted); }

/* Input */
.pm2-input {
  width: 100%; background: var(--bg-app); border: 1.5px solid var(--border);
  border-radius: 9px; padding: 9px 13px; font-size: 14px; color: var(--text-primary);
  outline: none; font-family: inherit; font-variant-numeric: tabular-nums;
  transition: border-color 150ms, box-shadow 150ms;
}
.pm2-input:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
.pm2-input::placeholder { color: var(--text-muted); opacity: .65; }
.pm2-textarea { resize: vertical; min-height: 78px; }

/* Select */
.pm2-sel-wrap { position: relative; }
.pm2-sel { appearance: none; -webkit-appearance: none; cursor: pointer; padding-right: 32px; }
.pm2-sel-wrap::after {
  content: ''; position: absolute; right: 13px; top: 50%; transform: translateY(-50%);
  border-left: 4.5px solid transparent; border-right: 4.5px solid transparent;
  border-top: 5.5px solid var(--text-muted); pointer-events: none;
}

/* Star pin button — replaces the old "Default" checkbox */
.pm2-pin {
  border: none; background: none; cursor: pointer; padding: 2px 4px;
  font-size: 15px; color: var(--text-muted); line-height: 1; border-radius: 5px;
  transition: color 130ms, background 130ms, transform var(--press-back) var(--ease-spring);
  flex-shrink: 0;
}
.pm2-pin:hover { color: var(--accent); background: var(--accent-soft); }
.pm2-pin:active { transform: scale(0.82); transition-duration: var(--press-down); }
.pm2-pin.on { color: var(--accent); }
.pm2-pin-sm { font-size: 13px; }
.pm2-pin-xs { font-size: 11px; margin-top: 2px; }

/* Price band — unified 3-cell card */
.pm2-price-band {
  display: grid; grid-template-columns: 1fr 1fr 1fr;
  border: 1.5px solid var(--border); border-radius: 10px; overflow: hidden;
}
.pm2-price-cell {
  display: flex; flex-direction: column; padding: 9px 12px 8px;
  border-right: 1px solid var(--border); transition: background 130ms;
}
.pm2-price-cell:last-child { border-right: none; }
.pm2-price-cell:has(.pm2-price-in:focus) { background: var(--accent-soft); }
.pm2-price-cell .pm2-label { font-size: 10.5px; letter-spacing: .01em; margin-bottom: 4px; }
.pm2-adorn { display: flex; align-items: baseline; gap: 2px; }
.pm2-sym { font-size: 12px; font-weight: 600; color: var(--text-muted); flex-shrink: 0; }
.pm2-price-in {
  background: none; border: none; outline: none; padding: 0;
  font-size: 16px; font-weight: 600; color: var(--text-primary); width: 100%;
  font-family: inherit; font-variant-numeric: tabular-nums;
  -moz-appearance: textfield; appearance: textfield;
}
.pm2-price-in::-webkit-outer-spin-button,
.pm2-price-in::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.pm2-price-in::placeholder { color: var(--text-muted); opacity: .28; font-weight: 400; font-size: 13px; }

/* Hide spinners on all pm2 number inputs */
.pm2-input[type="number"] { -moz-appearance: textfield; appearance: textfield; }
.pm2-input[type="number"]::-webkit-outer-spin-button,
.pm2-input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }

/* Reorder + Opening Stock side-by-side */
.pm2-stock-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

/* Units section */
.pm2-units { display: flex; flex-direction: column; gap: 8px; }
.pm2-units-head { display: flex; align-items: center; justify-content: space-between; }
.pm2-units-sub { font-size: 11.5px; color: var(--text-muted); }
.pm2-add-unit-btn { font-size: 12px; color: var(--accent); background: none; border: 1px solid var(--accent); border-radius: 5px; padding: 3px 9px; cursor: pointer; }
.pm2-add-unit-btn:hover { background: color-mix(in srgb, var(--accent) 10%, transparent); }
.pm2-units-table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
.pm2-units-table th { text-align: left; color: var(--text-muted); font-weight: 500; padding: 3px 5px 5px; border-bottom: 1px solid var(--border); }
.pm2-units-table td { padding: 4px 5px; }
.pm2-units-table td .pm2-input { font-size: 12px; padding: 5px 7px; }
.pm2-unit-del { background: none; border: none; color: var(--text-muted); font-size: 16px; cursor: pointer; padding: 0 4px; line-height: 1; }
.pm2-unit-del:hover { color: var(--danger); }

/* Attributes */
.pm2-attrs { display: flex; flex-direction: column; gap: 10px; }
.pm2-attrs-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.pm2-attr-row { display: flex; gap: 6px; align-items: center; }
.pm2-attr-add {
  flex-shrink: 0; width: 36px; height: 36px;
  border: 1.5px solid var(--border); background: none; border-radius: 9px;
  cursor: pointer; color: var(--accent);
  display: flex; align-items: center; justify-content: center;
  transition: background 100ms, border-color 100ms;
}
.pm2-attr-add:hover { background: var(--accent-soft); border-color: var(--accent); }

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
