<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('settings.store.title') }}</h1>
        <p class="page-sub">{{ t('settings.store.sub') }}</p>
      </div>
    </div>

    <div class="tab-bar">
      <button v-for="tab in tabs" :key="tab.id" class="tab-btn" :class="{ active: activeTab === tab.id }" @click="activeTab = tab.id">
        <component :is="tab.icon" :size="15" />
        {{ tab.label }}
      </button>
    </div>

    <!-- ══ TAB: Store Info ══ -->
    <div v-if="activeTab === 'store'">
      <div v-if="storeLoading" class="form-skeleton" />
      <div v-else class="settings-card">
        <div class="section-divider">{{ t('settings.store.basic') }}</div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">{{ t('settings.store.store_name') }}</label>
            <input v-model="storeForm.name" class="form-input" placeholder="e.g. Trenda Fashion" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('settings.store.currency') }}</label>
            <select v-model="storeForm.currency_id" class="form-input" style="width:220px;">
              <option v-for="c in currencies" :key="c.id" :value="c.id">
                {{ c.symbol }} — {{ c.name }} ({{ c.code }})
              </option>
            </select>
            <p class="form-hint">{{ t('settings.store.sample') }} <strong>{{ sampleAmount }}</strong></p>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('settings.store.timezone') }}</label>
            <select v-model="storeForm.timezone" class="form-input" style="width:220px;">
              <option v-for="tz in timezones" :key="tz" :value="tz">{{ tz }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('settings.store.default_language') }}</label>
            <select v-model="storeForm.default_language" class="form-input" style="width:160px;">
              <option value="ar">{{ t('settings.store.lang_ar') }}</option>
              <option value="en">{{ t('settings.store.lang_en') }}</option>
            </select>
          </div>
        </div>

        <div class="section-divider">{{ t('settings.store.contact') }}</div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">{{ t('settings.store.phone') }}</label>
            <input v-model="storeForm.phone_number" class="form-input" placeholder="e.g. 01012345678" type="tel" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('settings.store.whatsapp') }}</label>
            <input v-model="storeForm.whatsapp_number" class="form-input" placeholder="e.g. 01012345678" type="tel" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('settings.store.email') }}</label>
            <input v-model="storeForm.email" class="form-input" placeholder="store@example.com" type="email" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('settings.store.website') }}</label>
            <input v-model="storeForm.website" class="form-input" placeholder="https://…" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('settings.store.city') }}</label>
            <select v-model="storeForm.city" class="form-input">
              <option value="">{{ t('settings.store.select_city') }}</option>
              <option v-for="c in egyptCities" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('settings.store.country') }}</label>
            <input value="Egypt" class="form-input" disabled style="opacity:.55;cursor:not-allowed;" />
          </div>
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">{{ t('settings.store.address') }}</label>
            <input v-model="storeForm.address_line" class="form-input" :placeholder="t('settings.store.address_ph')" />
          </div>
        </div>

        <div class="section-divider">{{ t('settings.store.social') }}</div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">{{ t('settings.store.facebook') }}</label>
            <input v-model="storeForm.fb_page" class="form-input" placeholder="https://facebook.com/…" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('settings.store.instagram') }}</label>
            <input v-model="storeForm.instagram" class="form-input" :placeholder="t('settings.store.instagram_ph')" />
          </div>
        </div>

        <div class="form-footer">
          <button class="btn-primary" :disabled="storeSaving" @click="saveStore">
            {{ storeSaving ? t('common.saving') : t('settings.store.save_store') }}
          </button>
        </div>
      </div>
    </div>

    <!-- ══ TAB: Branches & Owners ══ -->
    <div v-if="activeTab === 'branches'">
      <!-- Owners section -->
      <div class="section-heading-row">
        <span class="section-group-title">{{ t('settings.store.owners') }}</span>
      </div>
      <div class="table-wrap" style="margin-bottom:20px;">
        <div v-if="ownersLoading" class="table-skeleton"><div v-for="i in 2" :key="i" class="skeleton-row" /></div>
        <table v-else class="data-table">
          <thead><tr><th>{{ t('common.name') }}</th><th>{{ t('settings.branch_detail.username') }}</th><th>{{ t('settings.store.phone') }}</th><th>{{ t('settings.store.whatsapp') }}</th><th style="width:50px;"></th></tr></thead>
          <tbody>
            <tr v-if="owners.length === 0">
              <td colspan="5" class="table-empty"><UserCog :size="28" style="opacity:.3;margin-bottom:6px;" /><div>{{ t('settings.store.no_owners') }}</div></td>
            </tr>
            <tr v-for="o in owners" :key="o.id" class="table-row">
              <td class="col-name">{{ o.full_name }}</td>
              <td>{{ o.username }}</td>
              <td>{{ o.phone_number || '—' }}</td>
              <td>{{ o.whatsapp_number || '—' }}</td>
              <td><button class="row-action" @click="openEditOwner(o)"><Pencil :size="13" /></button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Branches section -->
      <div class="section-heading-row">
        <span class="section-group-title">{{ t('settings.store.branches') }}</span>
        <button class="btn-primary btn-sm" @click="openNewBranch"><Plus :size="14" /> {{ t('settings.store.new_branch') }}</button>
      </div>
      <div class="table-wrap">
        <div v-if="branchLoading" class="table-skeleton"><div v-for="i in 3" :key="i" class="skeleton-row" /></div>
        <table v-else class="data-table">
          <thead><tr><th>{{ t('common.name') }}</th><th>{{ t('settings.store.city') }}</th><th>{{ t('settings.store.street') }}</th><th>{{ t('settings.store.main') }}</th><th style="width:50px;"></th></tr></thead>
          <tbody>
            <tr v-if="branches.length === 0">
              <td colspan="5" class="table-empty">
                <GitBranch :size="32" style="opacity:.2;margin-bottom:8px;" />
                <div style="font-size:14px;font-weight:600;color:var(--text-primary);">{{ t('settings.store.no_branches') }}</div>
                <div style="font-size:12.5px;">{{ t('settings.store.no_branches_sub') }}</div>
              </td>
            </tr>
            <tr v-for="b in branches" :key="b.id" class="table-row" @click="router.push('/settings/branches/' + b.id)" style="cursor:pointer;">
              <td class="col-name" style="color:var(--accent);font-weight:600;">{{ b.name }}</td>
              <td>{{ b.address_city }}</td>
              <td class="col-street">{{ b.address_street_1 }}</td>
              <td><span v-if="b.is_main_branch" class="badge-main">{{ t('settings.store.main') }}</span></td>
              <td><button class="row-action" @click="openEditBranch(b)"><Pencil :size="13" /></button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══ TAB: Branding ══ -->
    <div v-if="activeTab === 'branding'">
      <div class="settings-card">
        <p style="font-size:13px;color:var(--text-muted);margin:0 0 20px;">
          {{ t('settings.store.logo_intro') }}<br>
          {{ t('settings.store.logo_size_a') }} <strong>480 × 112 px</strong> {{ t('settings.store.logo_size_b') }}
        </p>
        <div class="logo-upload-grid">
          <div class="logo-upload-card">
            <div class="logo-upload-label"><span>{{ t('settings.store.light_logo') }}</span><span class="logo-hint">{{ t('settings.store.light_logo_hint') }}</span></div>
            <div class="logo-preview-wrap light-bg">
              <img v-if="logoPreview.light" :src="logoPreview.light" class="logo-preview-img" alt="Light logo" />
              <div v-else class="logo-placeholder"><ImageIcon :size="28" style="opacity:.3;" /><span>{{ t('settings.store.no_logo') }}</span></div>
            </div>
            <div class="logo-upload-actions">
              <label class="btn-upload">{{ t('settings.store.choose_file') }}<input type="file" accept="image/*" style="display:none;" @change="onLogoFile('light', $event)" /></label>
              <button v-if="logoPreview.light" class="btn-logo-clear" @click="clearLogo('light')"><X :size="13" /> {{ t('common.delete') }}</button>
            </div>
          </div>
          <div class="logo-upload-card">
            <div class="logo-upload-label"><span>{{ t('settings.store.dark_logo') }}</span><span class="logo-hint">{{ t('settings.store.dark_logo_hint') }}</span></div>
            <div class="logo-preview-wrap dark-bg">
              <img v-if="logoPreview.dark" :src="logoPreview.dark" class="logo-preview-img" alt="Dark logo" />
              <div v-else class="logo-placeholder"><ImageIcon :size="28" style="opacity:.3;" /><span>{{ t('settings.store.no_logo') }}</span></div>
            </div>
            <div class="logo-upload-actions">
              <label class="btn-upload">{{ t('settings.store.choose_file') }}<input type="file" accept="image/*" style="display:none;" @change="onLogoFile('dark', $event)" /></label>
              <button v-if="logoPreview.dark" class="btn-logo-clear" @click="clearLogo('dark')"><X :size="13" /> {{ t('common.delete') }}</button>
            </div>
          </div>
        </div>
        <p class="form-hint" style="margin-top:12px;">{{ t('settings.store.logo_apply_hint') }}</p>
        <div class="form-footer">
          <button class="btn-primary" :disabled="logoSaving" @click="saveLogos">{{ logoSaving ? t('settings.store.uploading') : t('settings.store.save_logos') }}</button>
        </div>
      </div>
    </div>

    <!-- ══ TAB: Business Rules ══ -->
    <div v-if="activeTab === 'rules'">
      <div class="settings-card">
        <div class="section-divider">{{ t('settings.store.display_fmt') }}</div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">{{ t('settings.store.decimals') }}</label>
            <select v-model.number="settingsForm.decimals" class="form-input" style="width:120px;">
              <option :value="0">0 (e.g. 100)</option>
              <option :value="1">1 (e.g. 100.5)</option>
              <option :value="2">2 (e.g. 100.50)</option>
              <option :value="3">3 (e.g. 100.500)</option>
              <option :value="4">4 (e.g. 100.5000)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('settings.store.thousands') }}</label>
            <div style="display:flex;align-items:center;gap:10px;height:34px;">
              <button class="toggle-btn" :class="{ on: settingsForm.thousands_separator }" @click="settingsForm.thousands_separator = !settingsForm.thousands_separator"><span class="toggle-knob" /></button>
              <span style="font-size:12.5px;color:var(--text-muted);">{{ settingsForm.thousands_separator ? '1,234,567.89' : '1234567.89' }}</span>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('settings.store.item_noun') }}</label>
            <select v-model="settingsForm.item_noun" class="form-input" style="width:160px;">
              <option value="NAME">{{ t('settings.store.noun_name') }}</option>
              <option value="PRODUCT">{{ t('settings.store.noun_product') }}</option>
              <option value="ITEM">{{ t('settings.store.noun_item') }}</option>
              <option value="MODEL">{{ t('settings.store.noun_model') }}</option>
            </select>
            <p class="form-hint">{{ t('settings.store.item_noun_hint') }}</p>
          </div>
          <div class="form-group" style="grid-column:1/-1;">
            <label class="form-label">{{ t('settings.store.cat_levels') }}</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <input v-for="(lvl, i) in settingsForm.category_level_names" :key="i" v-model="settingsForm.category_level_names[i]" class="form-input" style="width:150px;" :placeholder="t('settings.store.tier', { n: i + 1 })" />
            </div>
            <p class="form-hint">{{ t('settings.store.cat_levels_hint') }}</p>
          </div>
        </div>

        <div class="section-divider">{{ t('settings.store.tax_reg') }}</div>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">{{ t('settings.store.default_tax') }}</label>
            <select v-model="settingsForm.default_tax" class="form-input">
              <option value="">{{ t('settings.store.none') }}</option>
              <option v-for="tx in taxes" :key="tx.id" :value="tx.id">{{ tx.name }} ({{ tx.rate }}%)</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('settings.store.tax_id') }}</label>
            <input v-model="settingsForm.tax_id" class="form-input" :placeholder="t('common.optional')" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('settings.store.commercial_reg') }}</label>
            <input v-model="settingsForm.commercial_reg" class="form-input" :placeholder="t('common.optional')" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('settings.policies.numbering_title') }}</label>
            <div style="display:flex;gap:8px;margin-top:4px;">
              <button class="mode-btn" :class="{ active: settingsForm.product_numbering_mode === 'PROGRESSIVE' }" @click="settingsForm.product_numbering_mode = 'PROGRESSIVE'">{{ t('settings.policies.progressive') }}</button>
              <button class="mode-btn" :class="{ active: settingsForm.product_numbering_mode === 'RANDOM' }" @click="settingsForm.product_numbering_mode = 'RANDOM'">{{ t('settings.policies.random') }}</button>
            </div>
            <p class="form-hint">{{ settingsForm.product_numbering_mode === 'PROGRESSIVE' ? '0001, 0002, 0003…' : t('settings.policies.random_slot') }}</p>
          </div>
        </div>

        <div class="section-divider">{{ t('settings.store.stock_credit') }}</div>
        <div class="toggle-row">
          <div class="toggle-item">
            <div><div class="toggle-label">{{ t('settings.policies.neg_stock_title') }}</div><div class="toggle-desc">{{ t('settings.store.neg_stock_desc') }}</div></div>
            <button class="toggle-btn" :class="{ on: settingsForm.allow_negative_stock }" @click="settingsForm.allow_negative_stock = !settingsForm.allow_negative_stock"><span class="toggle-knob" /></button>
          </div>
          <div class="toggle-item">
            <div><div class="toggle-label">{{ t('settings.policies.agel_title') }}</div><div class="toggle-desc">{{ t('settings.store.agel_desc') }}</div></div>
            <button class="toggle-btn" :class="{ on: settingsForm.enable_agel_selling }" @click="settingsForm.enable_agel_selling = !settingsForm.enable_agel_selling"><span class="toggle-knob" /></button>
          </div>
        </div>

        <div class="form-grid" style="margin-top:16px;">
          <div class="form-group">
            <label class="form-label">{{ t('settings.policies.credit_limit_title') }}</label>
            <div style="display:flex;gap:8px;margin-top:4px;">
              <button v-for="opt in creditPolicyOptions" :key="opt.value" class="mode-btn" :class="{ active: settingsForm.credit_policy === opt.value }" @click="settingsForm.credit_policy = opt.value">{{ opt.label }}</button>
            </div>
            <p class="form-hint">{{ t('settings.store.credit_policy_hint') }}</p>
          </div>
          <div class="form-group" v-if="settingsForm.credit_policy !== 'ALLOW'">
            <label class="form-label">{{ t('settings.store.default_credit_limit') }}</label>
            <input v-model.number="settingsForm.default_credit_limit" type="number" min="0" step="100" class="form-input" style="width:130px;" placeholder="e.g. 5000" />
            <p class="form-hint">{{ t('settings.store.no_limit_hint') }}</p>
          </div>
        </div>

        <div class="form-grid" style="margin-top:16px;">
          <div class="form-group">
            <label class="form-label">{{ t('settings.store.return_window') }}</label>
            <input v-model.number="settingsForm.return_window_days" type="number" min="0" step="1" class="form-input" style="width:130px;" placeholder="0" />
            <p class="form-hint">{{ t('settings.store.return_window_hint') }}</p>
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('settings.store.restock_fee') }}</label>
            <input v-model.number="settingsForm.restocking_fee_percent" type="number" min="0" max="100" step="0.5" class="form-input" style="width:130px;" placeholder="0" />
            <p class="form-hint">{{ t('settings.store.restock_fee_hint') }}</p>
          </div>
        </div>

        <div class="form-footer">
          <button class="btn-primary" :disabled="storeSaving" @click="saveRules">{{ storeSaving ? t('common.saving') : t('settings.store.save_rules') }}</button>
        </div>
      </div>
    </div>

    <!-- ══ TAB: Printing Setup ══ -->
    <div v-if="activeTab === 'printing'">
      <!-- Sub-tab bar -->
      <div class="sub-tab-bar">
        <button class="sub-tab-btn" :class="{ active: printingTab === 'setup' }"    @click="printingTab = 'setup'"><Printer :size="14" /> {{ t('settings.store.print_tabs.setup') }}</button>
        <button class="sub-tab-btn" :class="{ active: printingTab === 'receipt' }"  @click="printingTab = 'receipt'"><Receipt :size="14" /> {{ t('settings.store.print_tabs.receipt') }}</button>
        <button class="sub-tab-btn" :class="{ active: printingTab === 'labels' }"   @click="printingTab = 'labels'"><Tag :size="14" /> {{ t('settings.store.print_tabs.labels') }}</button>
        <button class="sub-tab-btn" :class="{ active: printingTab === 'designs' }"  @click="printingTab = 'designs'"><Palette :size="14" /> {{ t('settings.store.print_tabs.designs') }}</button>
      </div>

      <!-- Sub-tab: Receipt -->
      <div v-if="printingTab === 'receipt'">
        <div class="settings-card">
          <div class="form-group" style="margin-bottom:16px;">
            <label class="form-label">{{ t('settings.store.receipt_header') }}</label>
            <p class="form-hint">{{ t('settings.store.receipt_header_hint') }}</p>
            <textarea v-model="settingsForm.receipt_header" class="form-input" rows="4" placeholder="e.g. Welcome to Trenda Fashion&#10;Port-Said — Tel: 01234567890" />
          </div>
          <div class="form-group">
            <label class="form-label">{{ t('settings.store.receipt_footer') }}</label>
            <p class="form-hint">{{ t('settings.store.receipt_footer_hint') }}</p>
            <textarea v-model="settingsForm.receipt_footer" class="form-input" rows="4" placeholder="e.g. No returns after 7 days. Thank you!" />
          </div>
          <div class="toggle-row">
            <div class="toggle-item">
              <div>
                <div class="toggle-label">{{ t('settings.store.print_tax_id') }}</div>
                <div class="toggle-desc">{{ t('settings.store.print_tax_id_hint') }}</div>
              </div>
              <button class="toggle-btn" :class="{ on: settingsForm.print_tax_id }" @click="settingsForm.print_tax_id = !settingsForm.print_tax_id"><span class="toggle-knob" /></button>
            </div>
          </div>
          <div class="form-footer">
            <button class="btn-primary" :disabled="storeSaving" @click="saveReceipt">{{ storeSaving ? t('common.saving') : t('settings.store.save_receipt') }}</button>
          </div>
        </div>
      </div>

      <!-- Sub-tab: Label Presets -->
      <div v-if="printingTab === 'labels'">
        <div class="section-heading-row">
          <span class="section-group-title">{{ t('settings.store.label_presets') }}</span>
          <button class="btn-primary btn-sm" @click="openNewPreset"><Plus :size="14" /> {{ t('settings.store.new_preset') }}</button>
        </div>
        <p style="font-size:13px;color:var(--text-muted);margin:0 0 14px;">{{ t('settings.store.label_presets_intro') }}</p>
        <div class="table-wrap">
          <div v-if="presetsLoading" class="table-skeleton"><div v-for="i in 3" :key="i" class="skeleton-row" /></div>
          <table v-else class="data-table">
            <thead><tr><th>{{ t('common.name') }}</th><th>{{ t('settings.store.size_mm') }}</th><th>{{ t('settings.store.shows') }}</th><th>{{ t('settings.store.default') }}</th><th style="width:70px;"></th></tr></thead>
            <tbody>
              <tr v-if="presets.length === 0">
                <td colspan="5" class="table-empty"><Tag :size="28" style="opacity:.3;margin-bottom:8px;" /><div>{{ t('settings.store.no_presets') }}</div></td>
              </tr>
              <tr v-for="p in presets" :key="p.id" class="table-row">
                <td class="col-name">{{ p.name }}</td>
                <td style="font-variant-numeric:tabular-nums;">{{ p.width_mm }} × {{ p.height_mm }}</td>
                <td style="font-size:12px;color:var(--text-muted);">
                  <span v-if="p.show_store_name">{{ t('settings.store.label_fields.store') }}</span>
                  <span v-if="p.show_product_name"> · {{ t('settings.store.label_fields.name') }}</span>
                  <span v-if="p.show_sku"> · {{ t('settings.store.label_fields.sku') }}</span>
                  <span v-if="p.show_barcode"> · {{ t('settings.store.label_fields.barcode') }}</span>
                  <span v-if="p.show_price"> · {{ t('settings.store.label_fields.price') }}</span>
                </td>
                <td><span v-if="p.is_default" class="badge-cash">{{ t('settings.store.default') }}</span><span v-else class="text-muted-sm">—</span></td>
                <td>
                  <button class="row-action" :title="t('common.edit')" @click="openEditPreset(p)"><Pencil :size="13" /></button>
                  <button class="row-action danger" :title="t('common.delete')" @click="deletePreset(p.id)"><Trash2 :size="13" /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Sub-tab: Initial Setup (printers + QZ Tray) -->
      <div v-if="printingTab === 'setup'">
        <div class="settings-card">
          <!-- QZ Tray status + actions row -->
          <div class="section-divider" style="display:flex;align-items:center;gap:10px;">
            QZ Tray
            <span v-if="qzStatus === true"  class="qz-dot qz-ok">● {{ t('settings.store.qz_connected') }}</span>
            <span v-else-if="qzStatus === false" class="qz-dot qz-off">● {{ t('settings.store.qz_not_running') }}</span>
          </div>
          <p class="form-hint" style="margin-bottom:14px;">
            {{ t('settings.store.qz_intro') }}
          </p>
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px;flex-wrap:wrap;">
            <a
              href="/downloads/qz-tray-2.2.6.exe"
              download="qz-tray-2.2.6.exe"
              class="btn-primary btn-sm"
              style="text-decoration:none;"
            >
              <Download :size="14" /> {{ t('settings.store.qz_download') }}
            </a>
            <a
              href="/downloads/vendorya-qztray-setup.bat"
              download="vendorya-qztray-setup.bat"
              class="btn-secondary btn-sm"
              style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;"
            >
              <Settings2 :size="14" /> {{ t('settings.store.qz_script') }}
            </a>
            <button class="btn-secondary btn-sm" :disabled="qzTesting" @click="testQZTray">
              <span v-if="qzTesting">{{ t('settings.store.testing') }}</span>
              <span v-else>{{ t('settings.store.test_connection') }}</span>
            </button>
          </div>
          <p class="form-hint" style="margin-bottom:20px;">
            {{ t('settings.store.qz_steps') }}
          </p>

          <div class="section-divider">{{ t('settings.store.printers') }}</div>
          <p class="form-hint" style="margin-bottom:16px;">
            {{ t('settings.store.printers_hint') }}
          </p>

          <!-- Label Printer -->
          <div style="margin-bottom:20px;">
            <label class="form-label">{{ t('settings.store.label_printer') }}</label>
            <div style="display:flex;gap:8px;align-items:flex-start;max-width:480px;">
              <input v-model="settingsForm.label_printer_name" class="form-input" placeholder="e.g. XPrinter XP-420B" style="flex:1;" />
              <button
                class="btn-secondary btn-sm"
                style="white-space:nowrap;flex-shrink:0;"
                :disabled="printerTesting.label || !settingsForm.label_printer_name"
                @click="testPrinter('label')"
              >
                <span v-if="printerTesting.label">{{ t('settings.store.testing') }}</span>
                <span v-else>{{ t('settings.store.test_print') }}</span>
              </button>
            </div>
            <p class="form-hint">{{ t('settings.store.label_printer_hint') }}</p>
            <p v-if="printerTestResult.label === 'ok'" class="save-ok" style="margin-top:4px;">{{ t('settings.store.test_ok') }}</p>
            <p v-else-if="printerTestResult.label" class="field-error" style="margin-top:4px;">{{ printerTestResult.label }}</p>
          </div>

          <!-- Receipt Printer -->
          <div style="margin-bottom:20px;">
            <label class="form-label">{{ t('settings.store.receipt_printer') }}</label>
            <div style="display:flex;gap:8px;align-items:flex-start;max-width:480px;">
              <input v-model="settingsForm.receipt_printer_name" class="form-input" placeholder="e.g. XPrinter XP-58" style="flex:1;" />
              <button
                class="btn-secondary btn-sm"
                style="white-space:nowrap;flex-shrink:0;"
                :disabled="printerTesting.receipt || !settingsForm.receipt_printer_name"
                @click="testPrinter('receipt')"
              >
                <span v-if="printerTesting.receipt">{{ t('settings.store.testing') }}</span>
                <span v-else>{{ t('settings.store.test_print') }}</span>
              </button>
            </div>
            <p class="form-hint">{{ t('settings.store.receipt_printer_hint') }}</p>
            <p v-if="printerTestResult.receipt === 'ok'" class="save-ok" style="margin-top:4px;">{{ t('settings.store.test_ok') }}</p>
            <p v-else-if="printerTestResult.receipt" class="field-error" style="margin-top:4px;">{{ printerTestResult.receipt }}</p>
          </div>

          <!-- Receipt Output Controls -->
          <div class="section-divider">{{ t('settings.store.output_controls') }}</div>
          <p class="form-hint" style="margin-bottom:16px;">
            {{ t('settings.store.output_controls_hint') }}
          </p>
          <div class="print-ctrl-grid">
            <div class="print-ctrl-row">
              <label class="form-label" style="margin-bottom:0;min-width:130px;">{{ t('settings.store.copies') }}</label>
              <select v-model.number="settingsForm.receipt_copies" class="form-input" style="width:100px;">
                <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
              </select>
              <span class="form-hint" style="margin:0;">{{ t('settings.store.copies_hint') }}</span>
            </div>
            <div class="print-ctrl-row">
              <label class="form-label" style="margin-bottom:0;min-width:130px;">{{ t('settings.store.auto_cut') }}</label>
              <button
                class="toggle-btn" :class="{ on: settingsForm.receipt_auto_cut }"
                @click="settingsForm.receipt_auto_cut = !settingsForm.receipt_auto_cut"
              ><span class="toggle-knob" /></button>
              <span class="form-hint" style="margin:0;">{{ t('settings.store.auto_cut_hint') }}</span>
            </div>
            <div class="print-ctrl-row">
              <label class="form-label" style="margin-bottom:0;min-width:130px;">{{ t('settings.store.cut_feed') }}</label>
              <input
                v-model.number="settingsForm.receipt_cut_feed"
                type="number" min="0" max="20" step="1"
                class="form-input" style="width:100px;"
              />
              <span class="form-hint" style="margin:0;">{{ t('settings.store.cut_feed_hint') }}</span>
            </div>
          </div>

          <div class="section-divider">{{ t('settings.store.print_defaults') }}</div>
          <p class="form-hint" style="margin-bottom:16px;">
            {{ t('settings.store.print_defaults_hint') }}
          </p>

          <div class="print-defaults-grid">
            <div class="print-defaults-col">
              <div class="print-defaults-head">{{ t('settings.store.pos_head') }}</div>
              <label class="print-default-cb">
                <input type="checkbox" v-model="settingsForm.pos_print_default" />
                <span>{{ t('settings.store.print_default') }}</span>
              </label>
              <label class="print-default-cb">
                <input type="checkbox" v-model="settingsForm.pos_double_print_default" />
                <span>{{ t('settings.store.double_default') }}</span>
              </label>
            </div>
            <div class="print-defaults-col">
              <div class="print-defaults-head">{{ t('settings.store.srv_head') }}</div>
              <label class="print-default-cb">
                <input type="checkbox" v-model="settingsForm.srv_print_default" />
                <span>{{ t('settings.store.print_default') }}</span>
              </label>
              <label class="print-default-cb">
                <input type="checkbox" v-model="settingsForm.srv_double_print_default" />
                <span>{{ t('settings.store.double_default') }}</span>
              </label>
            </div>
          </div>

          <div class="form-footer">
            <button class="btn-primary" :disabled="serviceSaving" @click="savePrinters">
              {{ serviceSaving ? t('common.saving') : t('settings.store.save_printers') }}
            </button>
            <span v-if="serviceSuccess" class="save-ok">{{ t('settings.store.saved') }}</span>
            <span v-if="serviceError" class="field-error">{{ serviceError }}</span>
          </div>
        </div>
      </div>

      <!-- Sub-tab: Print Designs -->
      <div v-if="printingTab === 'designs'">
        <p style="font-size:13px;color:var(--text-muted);margin:0 0 20px;">{{ t('settings.store.designs_intro') }}</p>

        <!-- Receipt Designs -->
        <div class="section-heading-row" style="margin-bottom:14px;">
          <span class="section-group-title">{{ t('settings.store.receipt_designs') }}</span>
        </div>
        <div class="design-grid" style="margin-bottom:32px;">
          <div v-for="d in receiptDesigns" :key="d.id"
               class="design-card" :class="{ active: activeReceiptDesign === d.id }"
               @click="activeReceiptDesign = d.id; saveDesignPref()">
            <div class="design-preview" v-html="d.preview"></div>
            <div class="design-info">
              <span class="design-name">{{ d.name }}</span>
              <span class="design-desc">{{ d.desc }}</span>
            </div>
            <div class="design-actions">
              <span v-if="activeReceiptDesign === d.id" class="design-active-badge">{{ t('settings.store.active') }}</span>
              <button class="btn-secondary btn-sm" @click.stop="testDesign('receipt', d.id)">
                <Printer :size="13" /> {{ t('settings.store.test') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Label Designs — driven by LabelPreset model records -->
        <div class="section-heading-row" style="margin-bottom:14px;">
          <span class="section-group-title">{{ t('settings.store.label_designs') }}</span>
          <button class="btn-ghost btn-sm" @click="printingTab = 'labels'">{{ t('settings.store.manage_presets') }}</button>
        </div>
        <div v-if="presetsLoading" class="design-grid">
          <div v-for="i in 2" :key="i" class="design-card" style="min-height:160px;animation:shimmer 1.4s infinite;background:var(--border);" />
        </div>
        <div v-else-if="presets.length === 0" class="design-empty">
          <Tag :size="28" style="opacity:.3;margin-bottom:8px;" />
          <span>{{ t('settings.store.no_presets_dot') }}</span>
          <button class="btn-ghost btn-sm" @click="printingTab = 'labels'">{{ t('settings.store.add_first_preset') }}</button>
        </div>
        <div v-else class="design-grid">
          <div v-for="p in presets" :key="p.id"
               class="design-card" :class="{ active: p.is_default }">
            <div class="design-preview design-preview--label" v-html="buildLabelPreview(p)"></div>
            <div class="design-info">
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                <span class="design-name">{{ p.name }}</span>
                <span class="design-size-badge">{{ p.width_mm }}×{{ p.height_mm }}mm</span>
              </div>
              <span class="design-desc">{{ labelPresetDesc(p) }}</span>
            </div>
            <div class="design-actions">
              <span v-if="p.is_default" class="design-active-badge">{{ t('settings.store.default') }}</span>
              <button v-else class="btn-ghost btn-sm" @click.stop="setDefaultPreset(p.id)">{{ t('settings.store.set_default') }}</button>
              <button
                class="btn-secondary btn-sm"
                :disabled="!settingsForm.label_printer_name || labelTestingId === p.id"
                :title="!settingsForm.label_printer_name ? t('settings.store.set_printer_first') : ''"
                @click.stop="testLabelPreset(p)"
              >
                <Printer :size="13" /> {{ labelTestingId === p.id ? '…' : t('settings.store.test') }}
              </button>
            </div>
          </div>
        </div>

        <p v-if="designSaveMsg" class="save-ok" style="margin-top:16px;">{{ designSaveMsg }}</p>
      </div>
    </div>

    <!-- ══ TAB: Payment Methods ══ -->
    <div v-if="activeTab === 'payments'">
      <div class="section-heading-row">
        <span class="section-group-title">{{ t('settings.payment_methods.title') }}</span>
        <button class="btn-primary btn-sm" @click="openNewPM"><Plus :size="14" /> {{ t('settings.store.new_method') }}</button>
      </div>
      <div class="table-wrap">
        <div v-if="pmLoading" class="table-skeleton"><div v-for="i in 3" :key="i" class="skeleton-row" /></div>
        <table v-else class="data-table">
          <thead><tr><th>{{ t('common.name') }}</th><th>{{ t('settings.payment_methods.type') }}</th><th>{{ t('settings.store.agel') }}</th><th style="width:70px;"></th></tr></thead>
          <tbody>
            <tr v-if="paymentMethods.length === 0">
              <td colspan="4" class="table-empty"><CreditCard :size="28" style="opacity:.3;margin-bottom:8px;" /><div>{{ t('settings.payment_methods.empty') }}</div></td>
            </tr>
            <tr v-for="pm in paymentMethods" :key="pm.id" class="table-row">
              <td class="col-name">{{ pm.name }}</td>
              <td><span :class="pm.is_cash ? 'badge-cash' : 'badge-digital'">{{ pm.is_cash ? t('settings.payment_methods.cash') : t('settings.store.digital') }}</span></td>
              <td><span v-if="pm.is_agel" class="badge-agel">{{ t('settings.store.agel') }}</span><span v-else class="text-muted-sm">—</span></td>
              <td>
                <button class="row-action" @click="openEditPM(pm)"><Pencil :size="13" /></button>
                <button class="row-action danger" @click="deletePM(pm.id)"><Trash2 :size="13" /></button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══ TAB: Service Types ══ -->
    <div v-if="activeTab === 'services'">
      <div class="settings-card">
        <div class="section-divider">{{ t('settings.store.service_types') }}</div>
        <p class="form-hint">{{ t('settings.store.service_types_hint') }}</p>

        <div v-if="serviceLoading" class="skeleton-row" style="height:120px;border-radius:8px;max-width:480px;" />
        <template v-else>
          <div class="service-types-list">
            <div v-if="settingsForm.service_types.length === 0" class="empty-types">
              <p>{{ t('settings.store.no_service_types') }}</p>
            </div>
            <div v-for="(type, i) in settingsForm.service_types" :key="i" class="service-type-item">
              <span>{{ type }}</span>
              <button class="btn-remove" @click="removeServiceType(i)" :title="t('settings.store.remove')"><Trash :size="13" /></button>
            </div>
          </div>

          <div class="add-service-type">
            <input
              v-model="newServiceType"
              class="form-input"
              :placeholder="t('settings.store.service_type_ph')"
              @keyup.enter="addServiceType"
              style="max-width:280px;"
            />
            <button class="btn-secondary btn-sm" @click="addServiceType" :disabled="!newServiceType.trim()">
              <Plus :size="14" /> {{ t('settings.store.add_type') }}
            </button>
          </div>
        </template>

        <div class="section-divider" style="margin-top:24px;">{{ t('settings.store.notif_timing') }}</div>
        <div style="display:flex;gap:12px;align-items:flex-end;max-width:400px;">
          <div style="flex:1;">
            <label class="form-label">{{ t('settings.store.notify_before') }}</label>
            <input
              v-model.number="settingsForm.service_notify_hours"
              type="number"
              min="0"
              max="168"
              class="form-input"
            />
            <p class="form-hint">{{ t('settings.store.notify_before_hint') }}</p>
          </div>
        </div>

        <div style="margin-top:24px;padding-top:16px;border-top:1px solid var(--border);">
          <button class="btn-secondary" :disabled="notifyRunning" @click="runNotifications">
            <span v-if="notifyRunning">{{ t('settings.store.running') }}</span>
            <span v-else>{{ t('settings.store.run_notif') }}</span>
          </button>
          <span v-if="notifyOk" class="save-ok" style="margin-left:12px;">{{ t('settings.store.notif_checked') }}</span>
        </div>

        <div class="form-footer">
          <button class="btn-primary" :disabled="serviceSaving" @click="saveServiceSettings">
            {{ serviceSaving ? t('common.saving') : t('settings.store.save_service') }}
          </button>
          <span v-if="serviceError" class="field-error">{{ serviceError }}</span>
          <span v-if="serviceSuccess" class="save-ok">{{ t('settings.store.settings_saved') }}</span>
        </div>
      </div>
    </div>

    <!-- ══ TAB: Security ══ -->
    <div v-if="activeTab === 'security'">
      <div class="settings-card">
        <div class="form-group" style="margin-bottom:20px;">
          <label class="form-label">{{ t('settings.policies.session_title') }}</label>
          <p class="form-hint">{{ t('settings.store.session_hint') }}</p>
          <div style="display:flex;align-items:center;gap:10px;">
            <input v-model.number="settingsForm.session_timeout_minutes" type="number" min="0" max="1440" class="form-input" style="width:90px;" />
            <span style="font-size:13px;color:var(--text-muted);">{{ t('settings.policies.minutes') }}</span>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">{{ t('settings.policies.ip_title') }}</label>
          <p class="form-hint">{{ t('settings.store.ip_hint') }}</p>
          <textarea v-model="settingsForm.login_ip_allowlist" class="form-input" rows="4" placeholder="e.g. 197.45.0.0/16&#10;102.40.21.7" />
        </div>
        <div class="form-footer">
          <button class="btn-primary" :disabled="storeSaving" @click="saveSecurity">{{ storeSaving ? t('common.saving') : t('settings.store.save_security') }}</button>
        </div>
      </div>
    </div>

    <!-- ══ FIELD ACCESS / VISIBILITY ══ -->
    <div v-if="activeTab === 'visibility'">
      <div class="settings-card" v-for="(table, tableId) in FIELD_CATALOG" :key="tableId" style="margin-bottom:16px;">
        <div style="margin-bottom:16px;">
          <div class="form-label" style="font-size:14px;font-weight:700;">{{ table.label }}</div>
          <p class="form-hint">{{ table.desc }}</p>
        </div>

        <div class="fv-grid">
          <!-- Header row -->
          <div class="fv-cell fv-head">{{ t('settings.store.fv.field') }}</div>
          <div class="fv-cell fv-head fv-center" v-for="role in CONFIGURABLE_ROLES" :key="role">
            {{ t('people.staff.roles.' + role.toLowerCase()) }}
          </div>
          <div class="fv-cell fv-head fv-center fv-locked-head">{{ t('settings.store.fv.owner_admin') }}</div>

          <!-- Field rows -->
          <template v-for="f in table.fields" :key="f.key">
            <div class="fv-cell">
              <span class="fv-field-label">{{ f.label }}</span>
              <span class="fv-field-hint">{{ f.hint }}</span>
            </div>
            <div class="fv-cell fv-center" v-for="role in CONFIGURABLE_ROLES" :key="role">
              <label class="fv-check">
                <input
                  type="checkbox"
                  :checked="isHidden(tableId, role, f.key)"
                  @change="toggleHidden(tableId, role, f.key)"
                />
                <span class="fv-check-box"></span>
              </label>
            </div>
            <div class="fv-cell fv-center">
              <span class="fv-lock-badge">{{ t('settings.store.fv.always_visible') }}</span>
            </div>
          </template>
        </div>
      </div>

      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <button class="btn-primary" :disabled="visibilitySaving" @click="saveVisibility">
          {{ visibilitySaving ? t('common.saving') : t('settings.store.fv.save_btn') }}
        </button>
        <button class="btn-ghost" @click="resetVisibility">{{ t('settings.store.fv.reset') }}</button>
        <span v-if="visibilitySaveMsg" style="font-size:13px;color:var(--success);font-weight:600;">{{ visibilitySaveMsg }}</span>
      </div>
    </div>

    <!-- ══ MODALS ══ -->

    <!-- Owner edit modal -->
    <AppModal :open="ownerModal.open" :title="t('settings.store.edit_owner')" no-backdrop-close @close="ownerModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div><label class="form-label">{{ t('settings.profile.first_name') }}</label><input v-model="ownerModal.first_name" class="form-input" /></div>
          <div><label class="form-label">{{ t('settings.profile.last_name') }}</label><input v-model="ownerModal.last_name" class="form-input" /></div>
        </div>
        <div><label class="form-label">{{ t('settings.store.phone') }}</label><input v-model="ownerModal.phone_number" class="form-input" type="tel" placeholder="e.g. 01012345678" /></div>
        <div><label class="form-label">{{ t('settings.store.whatsapp') }}</label><input v-model="ownerModal.whatsapp_number" class="form-input" type="tel" placeholder="e.g. 01012345678" /></div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="ownerModal.open = false">{{ t('common.cancel') }}</button>
        <button class="btn-primary" :disabled="ownerSaving" @click="saveOwner">{{ ownerSaving ? t('common.saving') : t('common.save') }}</button>
      </template>
    </AppModal>

    <!-- Branch modal -->
    <AppModal :open="branchModal.open" :title="branchModal.id ? t('settings.store.edit_branch') : t('settings.store.new_branch')" no-backdrop-close @close="branchModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div><label class="form-label">{{ t('settings.store.branch_name') }}</label><input v-model="branchModal.name" class="form-input" :placeholder="t('settings.store.branch_name_ph')" /></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div><label class="form-label">{{ t('settings.store.city') }} <span class="req">*</span></label>
            <select v-model="branchModal.city" class="form-input"><option value="">{{ t('settings.store.select_city') }}</option><option v-for="c in egyptCities" :key="c" :value="c">{{ c }}</option></select></div>
          <div><label class="form-label">{{ t('settings.store.country') }}</label><input value="Egypt" class="form-input" disabled style="opacity:.55;" /></div>
        </div>
        <div><label class="form-label">{{ t('settings.store.street_address') }}</label><input v-model="branchModal.street_1" class="form-input" :placeholder="t('settings.store.street_address')" /></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div><label class="form-label">{{ t('settings.store.phone') }} <span class="req">*</span></label><input v-model="branchModal.phone_number" class="form-input" type="tel" /></div>
          <div><label class="form-label">{{ t('settings.store.email') }} <span class="req">*</span></label><input v-model="branchModal.email" class="form-input" type="email" /></div>
        </div>
        <div class="toggle-row" style="padding:0;">
          <div class="toggle-item" style="padding:0;">
            <div><div class="toggle-label">{{ t('settings.store.main_branch') }}</div></div>
            <button class="toggle-btn" :class="{ on: branchModal.is_main_branch }" @click="branchModal.is_main_branch = !branchModal.is_main_branch"><span class="toggle-knob" /></button>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="branchModal.open = false">{{ t('common.cancel') }}</button>
        <button class="btn-primary" :disabled="!branchModal.name.trim() || !branchModal.phone_number.trim() || !branchModal.email.trim() || branchSaving" @click="saveBranch">{{ branchSaving ? t('common.saving') : (branchModal.id ? t('settings.store.save_changes') : t('settings.store.add_branch')) }}</button>
      </template>
    </AppModal>

    <!-- Label Preset modal -->
    <AppModal :open="presetModal.open" :title="presetModal.id ? t('settings.store.edit_preset') : t('settings.store.new_preset')" no-backdrop-close @close="presetModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div><label class="form-label">{{ t('settings.store.preset_name') }}</label><input v-model="presetModal.name" class="form-input" :placeholder="t('settings.store.preset_name_ph')" /></div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div><label class="form-label">{{ t('settings.store.width_mm') }}</label><input v-model.number="presetModal.width_mm" type="number" min="10" max="300" class="form-input" /></div>
          <div><label class="form-label">{{ t('settings.store.height_mm') }}</label><input v-model.number="presetModal.height_mm" type="number" min="5" max="300" class="form-input" /></div>
        </div>
        <div class="section-divider" style="margin:4px 0;">{{ t('settings.store.show_on_label') }}</div>
        <div class="toggle-row" style="padding:0;flex-direction:column;gap:8px;">
          <label class="check-row"><input type="checkbox" v-model="presetModal.show_store_name" /> {{ t('settings.store.cb_store_name') }}</label>
          <label class="check-row"><input type="checkbox" v-model="presetModal.show_product_name" /> {{ t('settings.store.cb_product_name') }}</label>
          <label class="check-row"><input type="checkbox" v-model="presetModal.show_sku" /> {{ t('settings.store.cb_sku') }}</label>
          <label class="check-row"><input type="checkbox" v-model="presetModal.show_barcode" /> {{ t('settings.store.cb_barcode') }}</label>
          <label class="check-row"><input type="checkbox" v-model="presetModal.show_price" /> {{ t('settings.store.cb_price') }}</label>
        </div>
        <div class="toggle-row" style="padding:0;">
          <div class="toggle-item" style="padding:0;">
            <div><div class="toggle-label">{{ t('settings.store.set_as_default') }}</div><div class="toggle-desc">{{ t('settings.store.set_as_default_hint') }}</div></div>
            <button class="toggle-btn" :class="{ on: presetModal.is_default }" @click="presetModal.is_default = !presetModal.is_default"><span class="toggle-knob" /></button>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="presetModal.open = false">{{ t('common.cancel') }}</button>
        <button class="btn-primary" :disabled="!presetModal.name.trim() || presetSaving" @click="savePreset">{{ presetSaving ? t('common.saving') : (presetModal.id ? t('settings.store.save_changes') : t('settings.store.add_preset')) }}</button>
      </template>
    </AppModal>

    <!-- Payment Method modal -->
    <AppModal :open="pmModal.open" :title="pmModal.id ? t('settings.store.edit_pm') : t('settings.store.new_pm')" no-backdrop-close @close="pmModal.open = false">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div><label class="form-label">{{ t('common.name') }}</label><input v-model="pmModal.name" class="form-input" :placeholder="t('settings.store.pm_name_ph')" /></div>
        <div class="toggle-row" style="padding:0;">
          <div class="toggle-item" style="padding:0;">
            <div><div class="toggle-label">{{ t('settings.store.is_cash') }}</div><div class="toggle-desc">{{ t('settings.store.is_cash_hint') }}</div></div>
            <button class="toggle-btn" :class="{ on: pmModal.is_cash }" @click="pmModal.is_cash = !pmModal.is_cash"><span class="toggle-knob" /></button>
          </div>
          <div class="toggle-item" style="padding:0;">
            <div><div class="toggle-label">{{ t('settings.store.is_agel') }}</div><div class="toggle-desc">{{ t('settings.store.is_agel_hint') }}</div></div>
            <button class="toggle-btn" :class="{ on: pmModal.is_agel }" @click="pmModal.is_agel = !pmModal.is_agel"><span class="toggle-knob" /></button>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="pmModal.open = false">{{ t('common.cancel') }}</button>
        <button class="btn-primary" :disabled="!pmModal.name.trim() || pmSaving" @click="savePM">{{ pmSaving ? t('common.saving') : (pmModal.id ? t('settings.store.save_changes') : t('settings.store.new_method')) }}</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  Store, Receipt, GitBranch, CreditCard, Pencil, Trash2, ImageIcon, X,
  Settings2, Shield, Plus, UserCog, Tag, Briefcase, Trash, Download, Printer, Palette, Eye,
} from 'lucide-vue-next'
import api from '@/api/axios'
import { useFormatStore } from '@/stores/format'
import { useAuthStore } from '@/stores/auth'
import { formatCurrency } from '@/utils/format'
import AppModal from '@/components/ui/AppModal.vue'
import { useQZTray, buildLabelTSPL } from '@/composables/useQZTray'

const { t } = useI18n()
const router = useRouter()
const fmt  = useFormatStore()
const auth = useAuthStore()

const tabs = computed(() => [
  { id: 'store',    label: t('settings.store.tabs.store'),     icon: Store },
  { id: 'branches', label: t('settings.store.tabs.branches'),  icon: GitBranch },
  { id: 'branding', label: t('settings.store.tabs.branding'),  icon: ImageIcon },
  { id: 'rules',    label: t('settings.store.tabs.rules'),     icon: Settings2 },
  { id: 'printing', label: t('settings.store.tabs.printing'),  icon: Printer },
  { id: 'payments', label: t('settings.store.tabs.payments'),  icon: CreditCard },
  { id: 'services', label: t('settings.store.tabs.services'),  icon: Briefcase },
  { id: 'security', label: t('settings.store.tabs.security'),  icon: Shield },
  { id: 'visibility', label: t('settings.store.tabs.visibility'), icon: Eye },
])
const activeTab   = ref('store')
const printingTab = ref('setup')

/* ── Print Designs ─────────────────────────────────────────────────── */
const activeReceiptDesign = ref(localStorage.getItem('vya_receipt_design') || 'classic')
const designSaveMsg       = ref('')

const receiptDesigns = computed(() => [
  {
    id: 'classic',
    name: t('settings.store.designs.classic_name'),
    desc: t('settings.store.designs.classic_desc'),
    preview: `<div class="dp-receipt"><div class="dp-store">My Store</div><div class="dp-line"></div><div class="dp-row"><span>Item A</span><span>100.00</span></div><div class="dp-row"><span>Item B</span><span>50.00</span></div><div class="dp-line"></div><div class="dp-total">Total: 150.00</div><div class="dp-footer">Thank you!</div></div>`,
  },
  {
    id: 'compact',
    name: t('settings.store.designs.compact_name'),
    desc: t('settings.store.designs.compact_desc'),
    preview: `<div class="dp-receipt dp-compact"><div class="dp-store dp-sm">Store</div><div class="dp-row dp-sm"><span>Item A</span><span>100</span></div><div class="dp-row dp-sm"><span>Item B</span><span>50</span></div><div class="dp-total dp-sm">Total 150</div></div>`,
  },
  {
    id: 'modern',
    name: t('settings.store.designs.modern_name'),
    desc: t('settings.store.designs.modern_desc'),
    preview: `<div class="dp-receipt dp-modern"><div class="dp-store dp-lg">MY STORE</div><div class="dp-badge">★ RECEIPT ★</div><div class="dp-line"></div><div class="dp-row"><span>Item A</span><span>100.00</span></div><div class="dp-row"><span>Item B</span><span>50.00</span></div><div class="dp-line"></div><div class="dp-total dp-lg">150.00 EGP</div></div>`,
  },
])

// Build an HTML preview string from a LabelPreset record.
function buildLabelPreview(p) {
  const parts = ['<div class="dp-label">']
  if (p.show_store_name)   parts.push('<div class="dp-lstore">My Store</div>')
  if (p.show_product_name) parts.push('<div class="dp-lname">Product Name</div>')
  if (p.show_barcode)      parts.push('<div class="dp-lbarcode">|||||||||||||||</div>')
  if (p.show_sku)          parts.push('<div class="dp-lsku">SKU-001</div>')
  if (p.show_price)        parts.push('<div class="dp-lprice">150.00 EGP</div>')
  parts.push('</div>')
  return parts.join('')
}

function labelPresetDesc(p) {
  const fields = []
  if (p.show_store_name)   fields.push(t('settings.store.label_fields.store'))
  if (p.show_product_name) fields.push(t('settings.store.label_fields.name'))
  if (p.show_barcode)      fields.push(t('settings.store.label_fields.barcode'))
  if (p.show_sku)          fields.push(t('settings.store.label_fields.sku'))
  if (p.show_price)        fields.push(t('settings.store.label_fields.price'))
  return `${p.width_mm}×${p.height_mm} mm · ${fields.join(', ')}`
}

async function setDefaultPreset(id) {
  try {
    await api.patch(`/api/core/label-presets/${id}/`, { is_default: true })
    await fetchPresets()
  } catch { /* silent */ }
}

const labelTestingId = ref(null)

async function testLabelPreset(p) {
  if (!settingsForm.label_printer_name) return
  labelTestingId.value = p.id
  try {
    await qzSendRaw(settingsForm.label_printer_name, buildLabelTSPL(p))
  } catch (e) {
    alert(e.message || t('settings.store.err.print_failed'))
  } finally {
    labelTestingId.value = null
  }
}

function saveDesignPref() {
  localStorage.setItem('vya_receipt_design', activeReceiptDesign.value)
  designSaveMsg.value = t('settings.store.design_saved')
  setTimeout(() => { designSaveMsg.value = '' }, 2000)
}

function testDesign(type, id) {
  if (type === 'receipt') {
    if (!settingsForm.receipt_printer_name) {
      alert(t('settings.store.err.set_receipt_printer'))
      return
    }
    qzTestPrinter(settingsForm.receipt_printer_name, 'receipt', {
      copies:     settingsForm.receipt_copies,
      autoCut:    settingsForm.receipt_auto_cut,
      cutFeedMm:  settingsForm.receipt_cut_feed,
    }).catch(e => alert(e.message || t('settings.store.err.print_failed')))
  }
}

const egyptCities = [
  'Cairo', 'Alexandria', 'Giza', 'Port Said', 'Suez', 'Luxor', 'Aswan',
  'Ismailia', 'Mansoura', 'Tanta', 'Asyut', 'Fayoum', 'Zagazig', 'Damanhur',
  'Minya', 'Beni Suef', 'Sohag', 'Qena', 'Hurghada', 'Sharm El Sheikh',
  '6th of October City', 'New Cairo', 'Arish', 'Banha', 'Kafr El Sheikh',
  'Shibin El Kom', 'Marsa Matruh', 'Edfu', 'Kom Ombo', 'Qusair',
]

const timezones = [
  'Africa/Cairo', 'Africa/Casablanca', 'Africa/Tripoli',
  'Asia/Riyadh', 'Asia/Dubai', 'Asia/Kuwait', 'Asia/Qatar', 'Asia/Baghdad', 'Asia/Beirut',
  'Asia/Amman', 'Asia/Damascus', 'Asia/Jerusalem',
  'Europe/London', 'Europe/Paris', 'Europe/Istanbul',
  'America/New_York', 'America/Los_Angeles', 'UTC',
]

const creditPolicyOptions = computed(() => [
  { value: 'ALLOW', label: t('settings.policies.allow') },
  { value: 'WARN',  label: t('settings.policies.warn') },
  { value: 'BLOCK', label: t('settings.policies.block') },
])

// ── Branding ─────────────────────────────────────────────────────────────
const logoSaving  = ref(false)
const logoFiles   = reactive({ light: null, dark: null })
const logoPreview = reactive({ light: null, dark: null })
const logoClear   = reactive({ light: false, dark: false })

function onLogoFile(mode, e) {
  const file = e.target.files?.[0]
  if (!file) return
  logoFiles[mode]   = file
  logoClear[mode]   = false
  logoPreview[mode] = URL.createObjectURL(file)
}
function clearLogo(mode) { logoFiles[mode] = null; logoPreview[mode] = null; logoClear[mode] = true }
async function saveLogos() {
  logoSaving.value = true
  try {
    const fd = new FormData()
    if (logoFiles.light) fd.append('logo_light', logoFiles.light)
    if (logoFiles.dark)  fd.append('logo_dark',  logoFiles.dark)
    if (logoClear.light) fd.append('clear_logo_light', 'true')
    if (logoClear.dark)  fd.append('clear_logo_dark',  'true')
    const res = await api.patch('/api/core/store/logo/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    if (auth.user?.store) { auth.user.store.logo_light_url = res.data.logo_light_url; auth.user.store.logo_dark_url = res.data.logo_dark_url }
    logoFiles.light = null; logoFiles.dark = null; logoClear.light = false; logoClear.dark = false
  } catch (e) { alert(e.response?.data?.detail || t('settings.store.err.save_logos')) } finally { logoSaving.value = false }
}
function initLogoPreviews() {
  const store = auth.user?.store
  if (!store) return
  logoPreview.light = store.logo_light_url || null
  logoPreview.dark  = store.logo_dark_url  || null
}

// ── Store Info ────────────────────────────────────────────────────────────
const storeLoading = ref(false)
const storeSaving  = ref(false)
const storeForm    = reactive({
  name: '', currency_id: '', default_language: 'ar', timezone: 'Africa/Cairo',
  phone_number: '', whatsapp_number: '', city: '', country: 'Egypt',
  address_line: '', email: '', website: '', fb_page: '', instagram: '',
})
const settingsForm = reactive({
  allow_negative_stock: false, enable_agel_selling: true,
  decimals: 2, thousands_separator: false, item_noun: 'NAME',
  category_level_names: ['Category', 'Sub-category', 'Sub-category 2', 'Sub-category 3'],
  default_tax: '', tax_id: '', commercial_reg: '', print_tax_id: true,
  receipt_header: '', receipt_footer: '',
  credit_policy: 'ALLOW', default_credit_limit: null,
  return_window_days: 0, restocking_fee_percent: 0,
  product_numbering_mode: 'PROGRESSIVE',
  session_timeout_minutes: 0, login_ip_allowlist: '',
  service_types: [], service_notify_hours: 1,
  label_printer_name: '', receipt_printer_name: '',
  pos_print_default: true, pos_double_print_default: false,
  srv_print_default: true, srv_double_print_default: true,
  receipt_copies: 1, receipt_auto_cut: true, receipt_cut_feed: 0,
  field_visibility: {},
})
const taxes      = ref([])
const currencies = ref([])

const sampleAmount = computed(() => {
  const cur = currencies.value.find(c => c.id === storeForm.currency_id)
  return formatCurrency(1234.5, { symbol: cur?.symbol ?? fmt.symbol, position: cur?.position ?? fmt.position, decimals: settingsForm.decimals, separator: settingsForm.thousands_separator })
})

async function loadStore() {
  storeLoading.value = true
  try {
    const [storeRes, settingsRes, taxRes, curRes] = await Promise.all([
      api.get('/api/core/store/'),
      api.get('/api/core/settings/'),
      api.get('/api/inventory/taxes/'),
      api.get('/api/core/currencies/'),
    ])
    Object.assign(storeForm, {
      name: storeRes.data.name,
      currency_id: storeRes.data.currency?.id || '',
      default_language: storeRes.data.default_language,
      timezone: storeRes.data.timezone || 'Africa/Cairo',
      phone_number: storeRes.data.phone_number || '',
      whatsapp_number: storeRes.data.whatsapp_number || '',
      city: storeRes.data.city || '',
      country: storeRes.data.country || 'Egypt',
      address_line: storeRes.data.address_line || '',
      email: storeRes.data.email || '',
      website: storeRes.data.website || '',
      fb_page: storeRes.data.fb_page || '',
      instagram: storeRes.data.instagram || '',
    })
    Object.assign(settingsForm, settingsRes.data)
    taxes.value      = taxRes.data.results ?? taxRes.data
    currencies.value = (curRes.data.results ?? curRes.data).filter(c => c.is_active)
  } finally { storeLoading.value = false }
}

async function saveStore() {
  storeSaving.value = true
  try {
    const [storeRes, settingsRes] = await Promise.all([
      api.patch('/api/core/store/', {
        name: storeForm.name, currency_id: storeForm.currency_id || null,
        default_language: storeForm.default_language, timezone: storeForm.timezone,
        phone_number: storeForm.phone_number, whatsapp_number: storeForm.whatsapp_number,
        city: storeForm.city, country: 'Egypt',
        address_line: storeForm.address_line, email: storeForm.email,
        website: storeForm.website, fb_page: storeForm.fb_page, instagram: storeForm.instagram,
      }),
      api.patch('/api/core/settings/', {
        decimals: settingsForm.decimals, thousands_separator: settingsForm.thousands_separator,
        item_noun: settingsForm.item_noun, category_level_names: settingsForm.category_level_names,
      }),
    ])
    const cur = storeRes.data.currency
    fmt.apply({
      symbol: cur?.symbol, position: cur?.position,
      decimals: settingsRes.data.decimals, thousands_separator: settingsRes.data.thousands_separator,
      item_noun: settingsRes.data.item_noun, category_level_names: settingsRes.data.category_level_names,
    })
    if (auth.user?.store) { auth.user.store = { ...auth.user.store, currency: cur, timezone: storeRes.data.timezone }; localStorage.setItem('vendorya_user', JSON.stringify(auth.user)) }
  } catch (e) { alert(e.response?.data ? JSON.stringify(e.response.data) : t('settings.store.err.save')) } finally { storeSaving.value = false }
}

async function saveRules() {
  storeSaving.value = true
  try {
    await api.patch('/api/core/settings/', {
      allow_negative_stock: settingsForm.allow_negative_stock,
      enable_agel_selling:  settingsForm.enable_agel_selling,
      credit_policy:        settingsForm.credit_policy,
      default_credit_limit: (settingsForm.credit_policy !== 'ALLOW' && settingsForm.default_credit_limit) ? settingsForm.default_credit_limit : null,
      return_window_days:   settingsForm.return_window_days || 0,
      restocking_fee_percent: settingsForm.restocking_fee_percent || 0,
      default_tax:          settingsForm.default_tax || null,
      tax_id:               settingsForm.tax_id,
      commercial_reg:       settingsForm.commercial_reg,
      product_numbering_mode: settingsForm.product_numbering_mode,
      decimals:             settingsForm.decimals,
      thousands_separator:  settingsForm.thousands_separator,
      item_noun:            settingsForm.item_noun,
      category_level_names: settingsForm.category_level_names,
    })
    fmt.apply({ decimals: settingsForm.decimals, thousands_separator: settingsForm.thousands_separator, item_noun: settingsForm.item_noun, category_level_names: settingsForm.category_level_names })
  } catch (e) { alert(e.response?.data ? JSON.stringify(e.response.data) : t('settings.store.err.save')) } finally { storeSaving.value = false }
}

async function saveReceipt() {
  storeSaving.value = true
  try { await api.patch('/api/core/settings/', { receipt_header: settingsForm.receipt_header, receipt_footer: settingsForm.receipt_footer, print_tax_id: settingsForm.print_tax_id }) }
  catch (e) { alert(t('settings.store.err.save')) } finally { storeSaving.value = false }
}

async function saveSecurity() {
  storeSaving.value = true
  try { await api.patch('/api/core/settings/', { session_timeout_minutes: settingsForm.session_timeout_minutes || 0, login_ip_allowlist: settingsForm.login_ip_allowlist || '' }) }
  catch (e) { alert(t('settings.store.err.save')) } finally { storeSaving.value = false }
}

// ── Field Visibility (Layer 1) ────────────────────────────────────────────
const CONFIGURABLE_ROLES = ['CASHIER', 'MANAGER']

const FIELD_CATALOG = computed(() => ({
  inventory_products: {
    label: t('settings.store.fv.catalog_label'),
    desc:  t('settings.store.fv.catalog_desc'),
    fields: [
      { key: 'cost_display',   label: t('settings.store.fv.cost_label'),    hint: t('settings.store.fv.cost_hint') },
      { key: 'profit_display', label: t('settings.store.fv.profit_label'),  hint: t('settings.store.fv.profit_hint') },
      { key: 'supplier_name',  label: t('settings.store.fv.supplier_label'), hint: t('settings.store.fv.supplier_hint') },
      { key: 'total_stock',    label: t('settings.store.fv.stock_label'),   hint: t('settings.store.fv.stock_hint') },
    ],
  },
}))

const visibilitySaving  = ref(false)
const visibilitySaveMsg = ref('')

function isHidden(tableId, role, field) {
  return (settingsForm.field_visibility?.[tableId]?.[role] ?? []).includes(field)
}

function toggleHidden(tableId, role, field) {
  if (!settingsForm.field_visibility)              settingsForm.field_visibility = {}
  if (!settingsForm.field_visibility[tableId])     settingsForm.field_visibility[tableId] = {}
  const arr = settingsForm.field_visibility[tableId][role] ?? []
  const idx = arr.indexOf(field)
  settingsForm.field_visibility[tableId][role] = idx >= 0
    ? arr.filter(f => f !== field)
    : [...arr, field]
}

function resetVisibility() {
  settingsForm.field_visibility = {}
}

async function saveVisibility() {
  visibilitySaving.value = true
  try {
    await api.patch('/api/core/settings/', { field_visibility: settingsForm.field_visibility })
    visibilitySaveMsg.value = t('settings.store.saved_bang')
    setTimeout(() => { visibilitySaveMsg.value = '' }, 2500)
  } catch (e) {
    alert(e.response?.data?.detail || t('settings.store.err.save_fv'))
  } finally {
    visibilitySaving.value = false
  }
}

// ── Owners ────────────────────────────────────────────────────────────────
const owners       = ref([])
const ownersLoading = ref(false)
const ownerSaving  = ref(false)
const ownerModal   = reactive({ open: false, id: null, first_name: '', last_name: '', phone_number: '', whatsapp_number: '' })

async function fetchOwners() {
  ownersLoading.value = true
  try {
    const res = await api.get('/api/auth/staff/', { params: { page: 1, page_size: 50 } })
    const all = res.data.results ?? res.data
    owners.value = all.filter(u => u.role === 'OWNER')
  } finally { ownersLoading.value = false }
}
function openEditOwner(o) { Object.assign(ownerModal, { open: true, id: o.id, first_name: o.first_name || '', last_name: o.last_name || '', phone_number: o.phone_number || '', whatsapp_number: o.whatsapp_number || '' }) }
async function saveOwner() {
  ownerSaving.value = true
  try {
    await api.patch(`/api/auth/staff/${ownerModal.id}/`, { first_name: ownerModal.first_name, last_name: ownerModal.last_name, phone_number: ownerModal.phone_number, whatsapp_number: ownerModal.whatsapp_number })
    ownerModal.open = false; fetchOwners()
  } catch (e) { alert(e.response?.data ? JSON.stringify(e.response.data) : t('settings.store.err.generic')) } finally { ownerSaving.value = false }
}

// ── Branches ──────────────────────────────────────────────────────────────
const branches      = ref([])
const branchLoading = ref(false)
const branchSaving  = ref(false)
const branchModal   = reactive({ open: false, id: null, name: '', city: '', country: 'Egypt', street_1: '', is_main_branch: false, phone_number: '', email: '' })

async function fetchBranches() {
  branchLoading.value = true
  try { const res = await api.get('/api/core/branches/'); branches.value = res.data.results ?? res.data } finally { branchLoading.value = false }
}
function openNewBranch()   { Object.assign(branchModal, { open: true, id: null, name: '', city: '', country: 'Egypt', street_1: '', is_main_branch: false, phone_number: '', email: '' }) }
function openEditBranch(b) { Object.assign(branchModal, { open: true, id: b.id, name: b.name, city: b.address_city, country: b.address_country, street_1: b.address_street_1, is_main_branch: b.is_main_branch, phone_number: b.phone_number || '', email: b.email || '' }) }
async function saveBranch() {
  branchSaving.value = true
  try {
    const payload = { name: branchModal.name, city: branchModal.city, country: 'Egypt', street_1: branchModal.street_1, is_main_branch: branchModal.is_main_branch, phone_number: branchModal.phone_number, email: branchModal.email }
    branchModal.id ? await api.patch(`/api/core/branches/${branchModal.id}/`, payload) : await api.post('/api/core/branches/', payload)
    branchModal.open = false; fetchBranches()
  } catch (e) { alert(e.response?.data ? JSON.stringify(e.response.data) : t('settings.store.err.generic')) } finally { branchSaving.value = false }
}

// ── Payment Methods ───────────────────────────────────────────────────────
const paymentMethods = ref([])
const pmLoading      = ref(false)
const pmSaving       = ref(false)
const pmModal        = reactive({ open: false, id: null, name: '', is_cash: false, is_agel: false })

async function fetchPMs() {
  pmLoading.value = true
  try { const res = await api.get('/api/finance/payment-methods/'); paymentMethods.value = res.data.results ?? res.data } finally { pmLoading.value = false }
}
function openNewPM()    { Object.assign(pmModal, { open: true, id: null, name: '', is_cash: false, is_agel: false }) }
function openEditPM(pm) { Object.assign(pmModal, { open: true, id: pm.id, name: pm.name, is_cash: pm.is_cash, is_agel: pm.is_agel ?? false }) }
async function savePM() {
  pmSaving.value = true
  try {
    const payload = { name: pmModal.name, is_cash: pmModal.is_cash, is_agel: pmModal.is_agel }
    pmModal.id ? await api.patch(`/api/finance/payment-methods/${pmModal.id}/`, payload) : await api.post('/api/finance/payment-methods/', payload)
    pmModal.open = false; fetchPMs()
  } catch (e) { alert(e.response?.data ? JSON.stringify(e.response.data) : t('settings.store.err.generic')) } finally { pmSaving.value = false }
}
async function deletePM(id) {
  if (!confirm(t('settings.store.confirm_delete_pm'))) return
  try { await api.delete(`/api/finance/payment-methods/${id}/`); fetchPMs() } catch (e) { alert(e.response?.data?.detail || t('settings.store.err.delete_in_use')) }
}

// ── Label Presets ─────────────────────────────────────────────────────────
const presets       = ref([])
const presetsLoading = ref(false)
const presetSaving  = ref(false)
const presetModal   = reactive({ open: false, id: null, name: '', width_mm: 40, height_mm: 20, show_store_name: true, show_product_name: true, show_sku: true, show_barcode: true, show_price: true, is_default: false })

async function fetchPresets() {
  presetsLoading.value = true
  try { const res = await api.get('/api/core/label-presets/'); presets.value = res.data.results ?? res.data } finally { presetsLoading.value = false }
}
function openNewPreset() { Object.assign(presetModal, { open: true, id: null, name: '', width_mm: 40, height_mm: 20, show_store_name: true, show_product_name: true, show_sku: true, show_barcode: true, show_price: true, is_default: false }) }
function openEditPreset(p) { Object.assign(presetModal, { open: true, id: p.id, name: p.name, width_mm: p.width_mm, height_mm: p.height_mm, show_store_name: p.show_store_name, show_product_name: p.show_product_name, show_sku: p.show_sku, show_barcode: p.show_barcode, show_price: p.show_price, is_default: p.is_default }) }
async function savePreset() {
  presetSaving.value = true
  try {
    const payload = { name: presetModal.name, width_mm: presetModal.width_mm, height_mm: presetModal.height_mm, show_store_name: presetModal.show_store_name, show_product_name: presetModal.show_product_name, show_sku: presetModal.show_sku, show_barcode: presetModal.show_barcode, show_price: presetModal.show_price, is_default: presetModal.is_default }
    presetModal.id ? await api.patch(`/api/core/label-presets/${presetModal.id}/`, payload) : await api.post('/api/core/label-presets/', payload)
    presetModal.open = false; fetchPresets()
  } catch (e) { alert(e.response?.data ? JSON.stringify(e.response.data) : t('settings.store.err.generic')) } finally { presetSaving.value = false }
}
async function deletePreset(id) {
  if (!confirm(t('settings.store.confirm_delete_preset'))) return
  try { await api.delete(`/api/core/label-presets/${id}/`); fetchPresets() } catch { alert(t('settings.store.err.deleting')) }
}

// ── Service Types ────────────────────────────────────────────────────────
const serviceLoading = ref(false)
const serviceSaving  = ref(false)
const serviceError   = ref('')
const serviceSuccess = ref(false)
const notifyRunning  = ref(false)
const notifyOk       = ref(false)
const newServiceType = ref('')

// QZ Tray
const { isAvailable: qzIsAvailable, testPrinter: qzTestPrinter, sendRaw: qzSendRaw } = useQZTray()
const qzStatus  = ref(null)   // null = untested, true = connected, false = not running
const qzTesting = ref(false)
const printerTesting = reactive({ label: false, receipt: false })
const printerTestResult = reactive({ label: null, receipt: null })

async function testQZTray() {
  qzTesting.value = true
  qzStatus.value  = await qzIsAvailable()
  qzTesting.value = false
}

async function testPrinter(type) {
  const name = type === 'label' ? settingsForm.label_printer_name : settingsForm.receipt_printer_name
  printerTesting[type]    = true
  printerTestResult[type] = null
  try {
    const opts = type === 'receipt'
      ? { copies: settingsForm.receipt_copies, autoCut: settingsForm.receipt_auto_cut, cutFeedMm: settingsForm.receipt_cut_feed }
      : {}
    await qzTestPrinter(name, type, opts)
    printerTestResult[type] = 'ok'
  } catch (e) {
    printerTestResult[type] = e.message || 'Error'
  } finally {
    printerTesting[type] = false
    setTimeout(() => { printerTestResult[type] = null }, 4000)
  }
}

async function savePrinters() {
  serviceSaving.value = true
  serviceError.value = ''
  serviceSuccess.value = false
  try {
    await api.patch('/api/core/settings/', {
      label_printer_name:   settingsForm.label_printer_name,
      receipt_printer_name: settingsForm.receipt_printer_name,
      pos_print_default:        settingsForm.pos_print_default,
      pos_double_print_default: settingsForm.pos_double_print_default,
      srv_print_default:        settingsForm.srv_print_default,
      srv_double_print_default: settingsForm.srv_double_print_default,
      receipt_copies:   settingsForm.receipt_copies,
      receipt_auto_cut: settingsForm.receipt_auto_cut,
      receipt_cut_feed: settingsForm.receipt_cut_feed,
    })
    serviceSuccess.value = true
    setTimeout(() => (serviceSuccess.value = false), 2500)
  } catch (e) {
    serviceError.value = e.response?.data?.detail || t('settings.store.err.save_printers')
  } finally {
    serviceSaving.value = false
  }
}

function addServiceType() {
  const type = newServiceType.value.trim()
  if (!type || settingsForm.service_types.includes(type)) return
  settingsForm.service_types.push(type)
  newServiceType.value = ''
}

function removeServiceType(i) {
  settingsForm.service_types.splice(i, 1)
}

async function saveServiceSettings() {
  serviceError.value = ''
  serviceSuccess.value = false
  serviceSaving.value = true
  try {
    await api.patch('/api/core/settings/', {
      service_types:        settingsForm.service_types,
      service_notify_hours: settingsForm.service_notify_hours,
    })
    serviceSuccess.value = true
    setTimeout(() => (serviceSuccess.value = false), 2500)
  } catch (e) {
    serviceError.value = e.response?.data?.detail || t('settings.store.err.save_service')
  } finally {
    serviceSaving.value = false
  }
}

async function runNotifications() {
  notifyOk.value = false
  notifyRunning.value = true
  try {
    await api.post('/api/services/run-notifications/')
    notifyOk.value = true
    setTimeout(() => (notifyOk.value = false), 3000)
  } catch (e) {
    serviceError.value = e.response?.data?.detail || t('settings.store.err.run_notif')
  } finally {
    notifyRunning.value = false
  }
}

// Load on tab switch
watch(activeTab, tab => {
  if (tab === 'branches' && branches.value.length === 0) { fetchBranches(); fetchOwners() }
  if (tab === 'payments' && paymentMethods.value.length === 0) fetchPMs()
  if (tab === 'printing' && presets.value.length === 0) fetchPresets()
}, { immediate: true })

onMounted(() => { loadStore(); initLogoPreviews() })
</script>

<style scoped>

.tab-bar { display:flex; gap:2px; border-bottom:1px solid var(--border); margin-bottom:20px; flex-wrap:wrap; }
.tab-btn { display:flex; align-items:center; gap:6px; padding:9px 14px; font-size:13px; font-weight:500; color:var(--text-muted); border:none; background:none; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; transition:color 120ms,border-color 120ms; }
.tab-btn:hover  { color:var(--text-primary); }
.tab-btn.active { color:var(--accent); border-bottom-color:var(--accent); font-weight:600; }

.settings-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:24px; }
.form-skeleton { height:320px; border-radius:12px; background:linear-gradient(90deg,var(--border) 25%,var(--bg-app) 50%,var(--border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position:-200% 0; } }

.form-grid  { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:16px; margin-bottom:20px; }
.form-group { display:flex; flex-direction:column; }
.form-label { font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.form-hint  { font-size:12px; color:var(--text-muted); margin:4px 0 0; }
.form-input { padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; width:100%; box-sizing:border-box; transition:border-color 120ms; resize:vertical; }
.form-input:focus { border-color:var(--accent); }

.section-divider { font-size:var(--typo-h4-size,14px); font-weight:var(--typo-h4-weight,700); font-style:var(--typo-h4-style,normal); text-transform:uppercase; letter-spacing:.07em; color:var(--text-muted); margin:8px 0 16px; padding-bottom:8px; border-bottom:1px solid var(--border); }
.check-row { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text-secondary); cursor:pointer; }

.section-heading-row { display:flex; align-items:center; justify-content:space-between; margin-bottom:12px; }
.section-group-title { font-size:var(--typo-h3-size,15px); font-weight:var(--typo-h3-weight,700); font-style:var(--typo-h3-style,normal); color:var(--text-primary); }

.toggle-row  { display:flex; flex-direction:column; gap:12px; padding:16px 0; border-top:1px solid var(--border); margin-top:4px; }
.toggle-item { display:flex; align-items:center; justify-content:space-between; gap:16px; }
.toggle-label { font-size:13px; font-weight:500; color:var(--text-primary); }
.toggle-desc  { font-size:12px; color:var(--text-muted); margin-top:2px; }
.toggle-btn  { width:40px; height:22px; border-radius:11px; border:none; background:var(--border); cursor:pointer; position:relative; transition:background 200ms; padding:0; flex-shrink:0; }
.toggle-btn.on { background:var(--accent); }
.toggle-knob { position:absolute; width:16px; height:16px; border-radius:50%; background:#fff; top:3px; left:3px; transition:left 200ms; box-shadow:0 1px 3px rgba(0,0,0,.2); }
.toggle-btn.on .toggle-knob { left:21px; }

.mode-btn { padding:6px 14px; border-radius:8px; border:1px solid var(--border); background:var(--bg-app); color:var(--text-muted); font-size:12.5px; font-weight:600; cursor:pointer; transition:background 100ms,border-color 100ms,color 100ms; }
.mode-btn:hover { border-color:var(--accent); color:var(--accent); }
.mode-btn.active { background:var(--accent); border-color:var(--accent); color:#fff; }

.form-footer { display:flex; justify-content:flex-end; align-items:center; gap:12px; margin-top:20px; padding-top:16px; border-top:1px solid var(--border); }

.print-defaults-grid { display:grid; grid-template-columns:1fr 1fr; gap:24px; max-width:560px; }
@media (max-width:560px) { .print-defaults-grid { grid-template-columns:1fr; } }
.print-defaults-col { display:flex; flex-direction:column; gap:10px; }
.print-defaults-head { font-size:12.5px; font-weight:700; color:var(--text-primary); }
.print-default-cb { display:flex; align-items:center; gap:9px; font-size:13px; color:var(--text-secondary); cursor:pointer; user-select:none; }
.print-default-cb input { width:16px; height:16px; accent-color:var(--accent); cursor:pointer; flex-shrink:0; }

.print-ctrl-grid { display:flex; flex-direction:column; gap:14px; max-width:640px; margin-bottom:4px; }
.print-ctrl-row  { display:flex; align-items:center; gap:16px; }
.print-ctrl-row .form-hint { flex:1; }

.table-wrap { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.data-table { width:100%; border-collapse:collapse; font-size:13px; }
.data-table thead th { padding:10px 14px; text-align:left; font-size:11.5px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); background:var(--bg-app); border-bottom:1px solid var(--border); }
.data-table tbody tr.table-row { border-bottom:1px solid var(--border); transition:background 100ms; }
.data-table tbody tr.table-row:last-child { border-bottom:none; }
.data-table tbody tr.table-row:hover { background:var(--bg-app); }
.data-table tbody td { padding:10px 14px; color:var(--text-primary); }
.table-empty { text-align:center; padding:36px 20px; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; }
.table-skeleton { padding:8px 0; }
.skeleton-row { height:40px; margin:4px 16px; border-radius:6px; background:linear-gradient(90deg,var(--border) 25%,var(--bg-app) 50%,var(--border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }

.col-name   { font-weight:500; }
.col-street { color:var(--text-muted); font-size:12px; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.text-muted-sm { color:var(--text-muted); font-size:12px; }

.badge-main    { display:inline-block; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:700; background:var(--accent-soft); color:var(--accent-hover); }
.badge-cash    { display:inline-block; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:700; background:var(--success-soft); color:#166534; }
.badge-digital { display:inline-block; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:700; background:#f3f4f6; color:#6b7280; }
.badge-agel    { display:inline-block; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:700; background:#ede9fe; color:#7c3aed; }

.row-action { width:28px; height:28px; border:none; background:none; border-radius:6px; cursor:pointer; color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; transition:background 100ms,color 100ms; }
.row-action:hover        { background:var(--border); color:var(--text-primary); }
.row-action.danger:hover { background:var(--danger-soft); color:var(--danger); }

.req { color:var(--danger); font-weight:700; }

/* Branding */
.logo-upload-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
@media (max-width:640px) { .logo-upload-grid { grid-template-columns:1fr; } }
.logo-upload-card { display:flex; flex-direction:column; gap:10px; }
.logo-upload-label { display:flex; flex-direction:column; gap:2px; }
.logo-upload-label span:first-child { font-size:13px; font-weight:600; color:var(--text-primary); }
.logo-hint { font-size:11.5px; color:var(--text-muted); }
.logo-preview-wrap { border:1.5px dashed var(--border); border-radius:10px; height:80px; display:flex; align-items:center; justify-content:center; overflow:hidden; }
.logo-preview-wrap.light-bg { background:#f9fafb; }
.logo-preview-wrap.dark-bg  { background:#18181a; }
.logo-preview-img { max-height:60px; max-width:100%; object-fit:contain; padding:6px; }
.logo-placeholder { display:flex; flex-direction:column; align-items:center; gap:5px; color:var(--text-muted); font-size:12px; }
.logo-upload-actions { display:flex; align-items:center; gap:8px; }
.btn-upload { display:inline-flex; align-items:center; padding:6px 12px; border-radius:7px; font-size:12.5px; font-weight:600; border:1px solid var(--border); background:var(--bg-app); color:var(--text-primary); cursor:pointer; transition:background 100ms,border-color 100ms; }
.btn-upload:hover { background:var(--accent-soft); border-color:var(--accent); color:var(--accent); }
.btn-logo-clear { display:inline-flex; align-items:center; gap:4px; padding:5px 10px; border-radius:7px; font-size:12px; font-weight:500; border:1px solid rgba(220,38,38,0.3); background:rgba(220,38,38,0.06); color:var(--danger); cursor:pointer; }
.btn-logo-clear:hover { background:rgba(220,38,38,0.14); }

/* Service Types */
.service-types-list { display:flex; flex-direction:column; gap:8px; margin-bottom:16px; }
.empty-types { color:var(--text-muted); font-size:13px; padding:12px; text-align:center; }
.service-type-item { display:flex; align-items:center; justify-content:space-between; padding:8px 12px; border-radius:8px; background:var(--bg-app); border:1px solid var(--border); }
.service-type-item span { font-size:13px; font-weight:500; }
.btn-remove { width:28px; height:28px; border-radius:6px; border:none; background:transparent; color:var(--text-muted); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 100ms,color 100ms; }
.btn-remove:hover { background:rgba(220,38,38,0.1); color:var(--danger); }
.add-service-type { display:flex; gap:8px; align-items:center; margin-bottom:16px; }
.save-ok { font-size:12.5px; color:var(--success, var(--success)); }
.field-error { font-size:12.5px; color:var(--danger, var(--danger)); }
.qz-dot { font-size:12px; font-weight:600; letter-spacing:.01em; }
.qz-ok  { color:var(--success); }
.qz-off { color:var(--danger); }

.sub-tab-bar { display:flex; gap:2px; border-bottom:1px solid var(--border); margin-bottom:18px; }
.sub-tab-btn { display:inline-flex; align-items:center; gap:6px; padding:7px 14px; font-size:12.5px; font-weight:500; color:var(--text-muted); border:none; background:none; cursor:pointer; border-bottom:2px solid transparent; margin-bottom:-1px; transition:color 120ms,border-color 120ms; border-radius:6px 6px 0 0; }
.sub-tab-btn:hover  { color:var(--text-primary); }
.sub-tab-btn.active { color:var(--accent); border-bottom-color:var(--accent); font-weight:600; }

/* Print Designs tab */
.design-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:16px; }
.design-card {
  border:2px solid var(--border); border-radius:14px; padding:14px; cursor:pointer;
  background:var(--bg-card); transition:border-color 140ms,box-shadow 140ms;
  display:flex; flex-direction:column; gap:10px;
}
.design-card:hover { border-color:var(--accent); box-shadow:0 2px 12px var(--accent-soft); }
.design-card.active { border-color:var(--accent); background:var(--accent-soft); }
.design-preview {
  background:#ffffff; border:1px solid var(--border); border-radius:8px;
  padding:10px; min-height:110px; font-family:monospace; overflow:hidden;
  font-size:10px; color:#222; line-height:1.4;
}
.design-preview--label { min-height:70px; }
.design-info { display:flex; flex-direction:column; gap:3px; }
.design-name { font-size:13.5px; font-weight:700; color:var(--text-primary); }
.design-desc { font-size:11.5px; color:var(--text-muted); }
.design-actions { display:flex; align-items:center; justify-content:space-between; }
.design-active-badge { font-size:11px; font-weight:700; color:var(--accent); background:var(--accent-soft); padding:2px 8px; border-radius:20px; }
.design-size-badge   { font-size:10px; font-weight:600; color:var(--text-muted); background:var(--bg-app); border:1px solid var(--border); border-radius:4px; padding:1px 5px; }
.design-empty        { display:flex; flex-direction:column; align-items:center; gap:8px; padding:36px 0; color:var(--text-muted); font-size:13px; }

/* mini receipt / label preview elements */
:deep(.dp-receipt) { display:flex; flex-direction:column; gap:3px; font-family:monospace; }
:deep(.dp-store)   { font-weight:bold; text-align:center; font-size:11px; }
:deep(.dp-lg)      { font-size:12px; }
:deep(.dp-sm)      { font-size:9px; }
:deep(.dp-line)    { border-top:1px dashed #ccc; margin:3px 0; }
:deep(.dp-row)     { display:flex; justify-content:space-between; font-size:9.5px; }
:deep(.dp-total)   { font-weight:bold; font-size:10px; text-align:right; }
:deep(.dp-footer)  { text-align:center; font-size:9px; color:#888; }
:deep(.dp-badge)   { text-align:center; font-size:8px; letter-spacing:.1em; color:#888; }
:deep(.dp-label)   { display:flex; flex-direction:column; gap:2px; font-family:monospace; }
:deep(.dp-lname)   { font-weight:bold; font-size:11px; }
:deep(.dp-lbarcode){ font-size:13px; letter-spacing:-.5px; color:#333; }
:deep(.dp-lprice)  { font-size:13px; font-weight:bold; }
:deep(.dp-lsku)    { font-size:9px; color:#888; }
:deep(.dp-lstore)  { font-size:9px; color:#888; font-weight:bold; }
:deep(.dp-compact) { gap:2px; }

/* ── Field Visibility grid ───────────────────────────────────────────── */
.fv-grid {
  display: grid;
  grid-template-columns: 1fr repeat(2, 120px) 140px;
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}
.fv-cell {
  padding: 11px 14px;
  border-bottom: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-size: 13px;
}
.fv-cell:nth-last-child(-n+4) { border-bottom: none; }
.fv-head {
  background: var(--bg-app);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  text-transform: uppercase;
  flex-direction: row;
  align-items: center;
}
.fv-center { align-items: center; flex-direction: row; justify-content: center; }
.fv-locked-head { color: var(--text-muted); opacity: 0.6; }
.fv-field-label { font-weight: 600; color: var(--text-primary); }
.fv-field-hint  { font-size: 11.5px; color: var(--text-muted); margin-top: 2px; }
.fv-lock-badge  { font-size: 11px; font-weight: 600; color: var(--text-muted); background: var(--bg-app); border: 1px solid var(--border); border-radius: 5px; padding: 3px 8px; }
.fv-check       { display: flex; align-items: center; cursor: pointer; }
.fv-check input { display: none; }
.fv-check-box   { width: 18px; height: 18px; border: 2px solid var(--border); border-radius: 5px; background: var(--bg-card); transition: background 120ms, border-color 120ms; position: relative; }
.fv-check input:checked + .fv-check-box { background: var(--danger); border-color: var(--danger); }
.fv-check input:checked + .fv-check-box::after { content: ''; position: absolute; left: 4px; top: 1px; width: 5px; height: 9px; border: 2px solid #fff; border-top: none; border-left: none; transform: rotate(45deg); }
</style>
