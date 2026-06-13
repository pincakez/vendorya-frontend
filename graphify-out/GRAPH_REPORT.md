# Graph Report - vendorya-frontend  (2026-06-13)

## Corpus Check
- 121 files · ~132,564 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1412 nodes · 1370 edges · 154 communities (139 shown, 15 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `6396c4c7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 94|Community 94]]
- [[_COMMUNITY_Community 101|Community 101]]
- [[_COMMUNITY_Community 102|Community 102]]
- [[_COMMUNITY_Community 103|Community 103]]
- [[_COMMUNITY_Community 104|Community 104]]
- [[_COMMUNITY_Community 105|Community 105]]
- [[_COMMUNITY_Community 106|Community 106]]
- [[_COMMUNITY_Community 107|Community 107]]
- [[_COMMUNITY_Community 108|Community 108]]
- [[_COMMUNITY_Community 109|Community 109]]
- [[_COMMUNITY_Community 110|Community 110]]
- [[_COMMUNITY_Community 111|Community 111]]
- [[_COMMUNITY_Community 112|Community 112]]
- [[_COMMUNITY_Community 113|Community 113]]
- [[_COMMUNITY_Community 114|Community 114]]
- [[_COMMUNITY_Community 115|Community 115]]
- [[_COMMUNITY_Community 116|Community 116]]
- [[_COMMUNITY_Community 117|Community 117]]
- [[_COMMUNITY_Community 118|Community 118]]
- [[_COMMUNITY_Community 119|Community 119]]
- [[_COMMUNITY_Community 120|Community 120]]
- [[_COMMUNITY_Community 121|Community 121]]
- [[_COMMUNITY_Community 122|Community 122]]
- [[_COMMUNITY_Community 123|Community 123]]
- [[_COMMUNITY_Community 124|Community 124]]
- [[_COMMUNITY_Community 125|Community 125]]
- [[_COMMUNITY_Community 126|Community 126]]
- [[_COMMUNITY_Community 127|Community 127]]
- [[_COMMUNITY_Community 128|Community 128]]
- [[_COMMUNITY_Community 129|Community 129]]
- [[_COMMUNITY_Community 130|Community 130]]
- [[_COMMUNITY_Community 131|Community 131]]
- [[_COMMUNITY_Community 132|Community 132]]
- [[_COMMUNITY_Community 133|Community 133]]
- [[_COMMUNITY_Community 134|Community 134]]
- [[_COMMUNITY_Community 135|Community 135]]
- [[_COMMUNITY_Community 136|Community 136]]
- [[_COMMUNITY_Community 137|Community 137]]
- [[_COMMUNITY_Community 138|Community 138]]
- [[_COMMUNITY_Community 139|Community 139]]
- [[_COMMUNITY_Community 140|Community 140]]
- [[_COMMUNITY_Community 141|Community 141]]
- [[_COMMUNITY_Community 142|Community 142]]
- [[_COMMUNITY_Community 143|Community 143]]
- [[_COMMUNITY_Community 144|Community 144]]
- [[_COMMUNITY_Community 145|Community 145]]
- [[_COMMUNITY_Community 146|Community 146]]
- [[_COMMUNITY_Community 147|Community 147]]
- [[_COMMUNITY_Community 148|Community 148]]
- [[_COMMUNITY_Community 149|Community 149]]
- [[_COMMUNITY_Community 150|Community 150]]
- [[_COMMUNITY_Community 151|Community 151]]

## God Nodes (most connected - your core abstractions)
1. `purchases` - 44 edges
2. `purchases` - 44 edges
3. `categories` - 43 edges
4. `categories` - 43 edges
5. `product_detail` - 40 edges
6. `product_detail` - 40 edges
7. `import_export` - 34 edges
8. `import_export` - 34 edges
9. `adjustments` - 29 edges
10. `adjustments` - 29 edges

## Surprising Connections (you probably didn't know these)
- `apply()` --calls--> `emit`  [INFERRED]
  src/components/pos/DiscountModal.vue → src/components/pos/BranchPickerModal.vue
- `confirm()` --calls--> `emit`  [INFERRED]
  src/components/pos/PaymentModal.vue → src/components/pos/BranchPickerModal.vue
- `useDataTable()` --calls--> `useAuthStore`  [INFERRED]
  src/composables/useDataTable.js → src/stores/auth.js
- `useIdleTimeout()` --calls--> `useAuthStore`  [INFERRED]
  src/composables/useIdleTimeout.js → src/stores/auth.js
- `resolveTz()` --calls--> `useAuthStore`  [INFERRED]
  src/utils/date.js → src/stores/auth.js

## Communities (154 total, 15 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (35): dependencies, axios, date-fns, flyonui, @headlessui/vue, jsbarcode, jspdf, jspdf-autotable (+27 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (21): applyUiPrefs(), clamp(), UI_DEFAULTS, useDataTable(), ACTIVITY_EVENTS, useIdleTimeout(), auth, router (+13 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (23): 1 — Backend, 2 — Frontend, 3 — Database, ✦ AI Co-Admin (V-Pilot), ✦ API Surface, ✦ Architecture, code:block1 (┌──────────────────────────────┐), code:block2 (~/vendorya/) (+15 more)

### Community 3 - "Community 3"
Cohesion: 0.06
Nodes (31): branches, confirm(), emit, loading, selected, setDefault, amount, apply() (+23 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (20): balance, buildInvoiceESCPOS(), copies, doPrint(), error, esc_dashes(), esc_line(), esc_money() (+12 more)

### Community 5 - "Community 5"
Cohesion: 0.18
Nodes (10): displayValue(), exportCSV(), triggerDownload(), formatDate(), formatDateTime(), resolveTz(), formatCurrency(), formatNumber() (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.04
Nodes (51): activity_log, admin_users, ai_profiles, alerts_center, ap_aging, ar_aging, attributes, auth_settings (+43 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (12): extraModels, hasKey, hiddenModels, loading, maskedKey, modelsError, modelsSaved, newKey (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (10): acting, adminGroups, canBilling, displayGroups, groups, open, soloLabel, soloTo (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (13): apply(), form, lastRunAt, lastRunDisplay, load(), loading, runCycle(), running (+5 more)

### Community 10 - "Community 10"
Cohesion: 0.09
Nodes (14): auth, avatarColor, COLORS, CURRENCY_PRESETS, fmt, form, photoFile, photoPreview (+6 more)

### Community 11 - "Community 11"
Cohesion: 0.25
Nodes (5): chatOpen, chatWidth, sidebarCollapsed, matchesKey(), onGlobalKey()

### Community 12 - "Community 12"
Cohesion: 0.25
Nodes (8): columns, fetchData(), filters, loading, meta, onFilters(), rows, totals

### Community 13 - "Community 13"
Cohesion: 0.28
Nodes (7): angleFrom(), btn, onDown(), onMove(), pressed, props, tilt

### Community 14 - "Community 14"
Cohesion: 0.22
Nodes (5): balanceDue, data, loading, props, router

### Community 15 - "Community 15"
Cohesion: 0.25
Nodes (5): loading, prefs, saved, saving, soundOptions

### Community 16 - "Community 16"
Cohesion: 0.29
Nodes (6): allToolNames, form, idx, p, payload, v

### Community 17 - "Community 17"
Cohesion: 0.29
Nodes (3): api, storeId, token

### Community 18 - "Community 18"
Cohesion: 0.29
Nodes (6): ctx, gain, looksLikePhone, osc, payload, q

### Community 19 - "Community 19"
Cohesion: 0.29
Nodes (5): canChange, pw, pwBusy, pwError, pwSaved

### Community 21 - "Community 21"
Cohesion: 0.47
Nodes (5): columns, fetchData(), meta, onFilters(), setTab()

### Community 22 - "Community 22"
Cohesion: 0.50
Nodes (3): columns, fetchData(), onFilters()

### Community 23 - "Community 23"
Cohesion: 0.40
Nodes (4): __dir, pub, svg, targets

### Community 24 - "Community 24"
Cohesion: 0.40
Nodes (3): items, lastSeenIds, prefs

### Community 25 - "Community 25"
Cohesion: 0.50
Nodes (4): all, columns, fetchData(), onFilters()

### Community 27 - "Community 27"
Cohesion: 0.67
Nodes (3): fetchData(), onFilters(), periodTotals

### Community 28 - "Community 28"
Cohesion: 0.67
Nodes (3): fetchData(), onFilters(), periodTotals

### Community 29 - "Community 29"
Cohesion: 0.50
Nodes (3): col, now, params

### Community 31 - "Community 31"
Cohesion: 0.83
Nodes (3): showErrorToast(), showSuccessToast(), showToast()

### Community 32 - "Community 32"
Cohesion: 0.67
Nodes (3): cache, canPlayOgg(), playSound()

### Community 33 - "Community 33"
Cohesion: 0.18
Nodes (10): a, arr, d, existingKeys, newAttrCols, payload, rect, s (+2 more)

### Community 101 - "Community 101"
Cohesion: 0.04
Nodes (51): activity_log, admin_users, ai_profiles, alerts_center, ap_aging, ar_aging, attributes, auth_settings (+43 more)

### Community 102 - "Community 102"
Cohesion: 0.04
Nodes (45): add_attribute, add_option, create_attribute, display_name, display_name_placeholder, empty_sub, empty_title, input_type (+37 more)

### Community 103 - "Community 103"
Cohesion: 0.05
Nodes (44): purchases, add_item, confirm_delete_draft, confirm_receive, cost_placeholder, empty, err_label_data, err_save (+36 more)

### Community 104 - "Community 104"
Cohesion: 0.05
Nodes (42): ai, billing, communication, design, finance, general, inventory, people (+34 more)

### Community 105 - "Community 105"
Cohesion: 0.05
Nodes (44): purchases, add_item, confirm_delete_draft, confirm_receive, cost_placeholder, empty, err_label_data, err_save (+36 more)

### Community 106 - "Community 106"
Cohesion: 0.05
Nodes (43): add_category, add_category_btn, add_sub, confirm_delete, confirm_delete_simple, delete_all_sub, delete_all_title, delete_with_items (+35 more)

### Community 107 - "Community 107"
Cohesion: 0.05
Nodes (43): add_category, add_category_btn, add_sub, confirm_delete, confirm_delete_simple, delete_all_sub, delete_all_title, delete_with_items (+35 more)

### Community 108 - "Community 108"
Cohesion: 0.05
Nodes (40): product_detail, alt_s_hint, attributes, attrs_col, base_price, base_price_label, category, category_none (+32 more)

### Community 109 - "Community 109"
Cohesion: 0.05
Nodes (40): product_detail, alt_s_hint, attributes, attrs_col, base_price, base_price_label, category, category_none (+32 more)

### Community 110 - "Community 110"
Cohesion: 0.06
Nodes (34): check_file, checking, choose_file_hint, clear, errors_title, export_btn, exporting, format_card_title (+26 more)

### Community 111 - "Community 111"
Cohesion: 0.06
Nodes (34): check_file, checking, choose_file_hint, clear, errors_title, export_btn, exporting, format_card_title (+26 more)

### Community 112 - "Community 112"
Cohesion: 0.07
Nodes (29): empty, form_branch, form_product_label, form_product_placeholder, modal_title, notes_label, notes_placeholder, qty_change (+21 more)

### Community 113 - "Community 113"
Cohesion: 0.07
Nodes (29): empty, form_branch, form_product_label, form_product_placeholder, modal_title, notes_label, notes_placeholder, qty_change (+21 more)

### Community 114 - "Community 114"
Cohesion: 0.08
Nodes (26): add_attribute, add_option, create_attribute, display_name, display_name_placeholder, empty_sub, empty_title, input_type (+18 more)

### Community 115 - "Community 115"
Cohesion: 0.08
Nodes (24): add_option_hint, alt_s_hint, attributes_label, base_price, category_label, category_none, cost_price, default_hint (+16 more)

### Community 116 - "Community 116"
Cohesion: 0.08
Nodes (24): add_option_hint, alt_s_hint, attributes_label, base_price, category_label, category_none, cost_price, default_hint (+16 more)

### Community 117 - "Community 117"
Cohesion: 0.09
Nodes (22): ai, billing, communication, design, finance, general, inventory, people (+14 more)

### Community 118 - "Community 118"
Cohesion: 0.11
Nodes (18): reports, empty, kpi_stock_value, kpi_total_products, kpi_total_stock, kpi_total_variants, search_placeholder, sub (+10 more)

### Community 119 - "Community 119"
Cohesion: 0.11
Nodes (18): common, actions, add, back, cancel, clear, close, date (+10 more)

### Community 120 - "Community 120"
Cohesion: 0.17
Nodes (12): cat1, cat2, cat3, cat4, in_stock, product, profit, retail (+4 more)

### Community 121 - "Community 121"
Cohesion: 0.17
Nodes (12): cat1, cat2, cat3, cat4, in_stock, product, profit, retail (+4 more)

### Community 122 - "Community 122"
Cohesion: 0.18
Nodes (11): err_add, new_option_label, placeholder, title, products, add_option_modal, reports_tab, sub (+3 more)

### Community 123 - "Community 123"
Cohesion: 0.20
Nodes (10): products, reports_tab, sub, tabs, title, coming_soon, title, products (+2 more)

### Community 124 - "Community 124"
Cohesion: 0.20
Nodes (10): table, actions, edit_hint, empty_sub, empty_title, ghost_action, ghost_hint, per_page (+2 more)

### Community 125 - "Community 125"
Cohesion: 0.20
Nodes (10): table, actions, edit_hint, empty_sub, empty_title, ghost_action, ghost_hint, per_page (+2 more)

### Community 126 - "Community 126"
Cohesion: 0.25
Nodes (8): confirm_delete, intro, note_label, note_placeholder, reason_label, select_reason, title, bulk_delete_modal

### Community 127 - "Community 127"
Cohesion: 0.25
Nodes (8): apply, category_label, confirm_apply, intro, retail_price, title, unchanged, bulk_edit_modal

### Community 128 - "Community 128"
Cohesion: 0.25
Nodes (8): done, hint, load_preset, reset, role_na, save_preset, title, customize

### Community 129 - "Community 129"
Cohesion: 0.25
Nodes (8): supplier_modal, code_prefix_label, code_prefix_placeholder, contact_label, contact_placeholder, edit_title, name_placeholder, new_title

### Community 130 - "Community 130"
Cohesion: 0.25
Nodes (8): toolbar, add_product, assign_layouts, bulk, customize, filter, reset_layout, search_placeholder

### Community 131 - "Community 131"
Cohesion: 0.25
Nodes (8): confirm_delete, intro, note_label, note_placeholder, reason_label, select_reason, title, bulk_delete_modal

### Community 132 - "Community 132"
Cohesion: 0.25
Nodes (8): apply, category_label, confirm_apply, intro, retail_price, title, unchanged, bulk_edit_modal

### Community 133 - "Community 133"
Cohesion: 0.25
Nodes (8): done, hint, load_preset, reset, role_na, save_preset, title, customize

### Community 134 - "Community 134"
Cohesion: 0.25
Nodes (8): supplier_modal, code_prefix_label, code_prefix_placeholder, contact_label, contact_placeholder, edit_title, name_placeholder, new_title

### Community 135 - "Community 135"
Cohesion: 0.25
Nodes (8): toolbar, add_product, assign_layouts, bulk, customize, filter, reset_layout, search_placeholder

### Community 136 - "Community 136"
Cohesion: 0.33
Nodes (6): conflict_cant_see, conflict_suffix, default_option, no_staff, title, assign_modal

### Community 137 - "Community 137"
Cohesion: 0.33
Nodes (6): edit_title, name_placeholder, new_title, parent_label, parent_none, category_modal

### Community 138 - "Community 138"
Cohesion: 0.33
Nodes (6): suppliers_tab, code_col, confirm_delete, contact_col, empty, name_col

### Community 139 - "Community 139"
Cohesion: 0.33
Nodes (6): conflict_cant_see, conflict_suffix, default_option, no_staff, title, assign_modal

### Community 140 - "Community 140"
Cohesion: 0.33
Nodes (6): edit_title, name_placeholder, new_title, parent_label, parent_none, category_modal

### Community 141 - "Community 141"
Cohesion: 0.33
Nodes (6): suppliers_tab, code_col, confirm_delete, contact_col, empty, name_col

### Community 142 - "Community 142"
Cohesion: 0.40
Nodes (5): err_add, new_option_label, placeholder, title, add_option_modal

### Community 143 - "Community 143"
Cohesion: 0.40
Nodes (5): exit_hint, ghost, n_selected, unghost, bulk_bar

### Community 144 - "Community 144"
Cohesion: 0.40
Nodes (5): confirm_delete, empty, name_col, parent_col, categories_tab

### Community 145 - "Community 145"
Cohesion: 0.40
Nodes (5): discontinued, duplicate, mistake, other, delete_reasons

### Community 146 - "Community 146"
Cohesion: 0.40
Nodes (5): save_preset_modal, is_default_label, name_label, name_placeholder, title

### Community 147 - "Community 147"
Cohesion: 0.40
Nodes (5): exit_hint, ghost, n_selected, unghost, bulk_bar

### Community 148 - "Community 148"
Cohesion: 0.40
Nodes (5): confirm_delete, empty, name_col, parent_col, categories_tab

### Community 149 - "Community 149"
Cohesion: 0.40
Nodes (5): discontinued, duplicate, mistake, other, delete_reasons

### Community 150 - "Community 150"
Cohesion: 0.40
Nodes (5): save_preset_modal, is_default_label, name_label, name_placeholder, title

### Community 151 - "Community 151"
Cohesion: 0.50
Nodes (4): tabs, products, reports, suppliers

## Knowledge Gaps
- **1093 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+1088 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `inventory` connect `Community 104` to `Community 105`, `Community 107`, `Community 109`, `Community 111`, `Community 113`, `Community 114`, `Community 122`?**
  _High betweenness centrality (0.272) - this node is a cross-community bridge._
- **Why does `inventory` connect `Community 102` to `Community 103`, `Community 106`, `Community 108`, `Community 110`, `Community 112`, `Community 118`, `Community 123`?**
  _High betweenness centrality (0.244) - this node is a cross-community bridge._
- **Why does `products` connect `Community 122` to `Community 131`, `Community 132`, `Community 133`, `Community 134`, `Community 135`, `Community 104`, `Community 139`, `Community 140`, `Community 141`, `Community 147`, `Community 148`, `Community 149`, `Community 116`, `Community 150`, `Community 151`, `Community 121`, `Community 125`?**
  _High betweenness centrality (0.128) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _1093 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08712121212121213 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.08333333333333333 - nodes in this community are weakly interconnected._