# Graph Report - vendorya-frontend  (2026-06-13)

## Corpus Check
- 116 files · ~127,265 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 451 nodes · 411 edges · 101 communities (86 shown, 15 thin omitted)
- Extraction: 97% EXTRACTED · 3% INFERRED · 0% AMBIGUOUS · INFERRED: 11 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8bf2e0b8`
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

## God Nodes (most connected - your core abstractions)
1. `buildInvoiceESCPOS()` - 7 edges
2. `useAuthStore` - 6 edges
3. `emit` - 5 edges
4. `buildServiceESCPOS()` - 5 edges
5. `resolveOpts()` - 5 edges
6. `formatNumber()` - 5 edges
7. `formatCurrency()` - 5 edges
8. `displayValue()` - 5 edges
9. `✦ Getting Started` - 5 edges
10. `scripts` - 4 edges

## Surprising Connections (you probably didn't know these)
- `apply()` --calls--> `emit`  [INFERRED]
  src/components/pos/DiscountModal.vue → src/components/pos/BranchPickerModal.vue
- `confirm()` --calls--> `emit`  [INFERRED]
  src/components/pos/PaymentModal.vue → src/components/pos/BranchPickerModal.vue
- `save()` --calls--> `emit`  [INFERRED]
  src/views/services/ServiceFormModal.vue → src/components/pos/BranchPickerModal.vue
- `useDataTable()` --calls--> `useAuthStore`  [INFERRED]
  src/composables/useDataTable.js → src/stores/auth.js
- `useIdleTimeout()` --calls--> `useAuthStore`  [INFERRED]
  src/composables/useIdleTimeout.js → src/stores/auth.js

## Communities (101 total, 15 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (34): dependencies, axios, date-fns, flyonui, @headlessui/vue, jsbarcode, jspdf, jspdf-autotable (+26 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (21): applyUiPrefs(), clamp(), UI_DEFAULTS, useDataTable(), ACTIVITY_EVENTS, useIdleTimeout(), auth, router (+13 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (23): 1 — Backend, 2 — Frontend, 3 — Database, ✦ AI Co-Admin (V-Pilot), ✦ API Surface, ✦ Architecture, code:block1 (┌──────────────────────────────┐), code:block2 (~/vendorya/) (+15 more)

### Community 3 - "Community 3"
Cohesion: 0.09
Nodes (19): branches, confirm(), emit, loading, selected, setDefault, amount, apply() (+11 more)

### Community 4 - "Community 4"
Cohesion: 0.11
Nodes (20): balance, buildInvoiceESCPOS(), copies, doPrint(), error, esc_dashes(), esc_line(), esc_money() (+12 more)

### Community 5 - "Community 5"
Cohesion: 0.18
Nodes (10): displayValue(), exportCSV(), triggerDownload(), formatDate(), formatDateTime(), resolveTz(), formatCurrency(), formatNumber() (+2 more)

### Community 6 - "Community 6"
Cohesion: 0.15
Nodes (12): buildServiceESCPOS(), canSave, customerQuery, customerResults, _dashes(), doServicePrint(), form, _ln() (+4 more)

### Community 7 - "Community 7"
Cohesion: 0.12
Nodes (12): extraModels, hasKey, hiddenModels, loading, maskedKey, modelsError, modelsSaved, newKey (+4 more)

### Community 8 - "Community 8"
Cohesion: 0.13
Nodes (10): acting, adminGroups, canBilling, displayGroups, groups, open, soloLabel, soloTo (+2 more)

### Community 9 - "Community 9"
Cohesion: 0.18
Nodes (13): apply(), form, lastRunAt, lastRunDisplay, load(), loading, runCycle(), running (+5 more)

### Community 10 - "Community 10"
Cohesion: 0.18
Nodes (6): avatarColor, COLORS, photoFile, photoPreview, saved, saving

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

## Knowledge Gaps
- **206 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+201 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `emit` connect `Community 3` to `Community 6`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **Why does `useAuthStore` connect `Community 1` to `Community 5`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Are the 3 inferred relationships involving `useAuthStore` (e.g. with `useDataTable()` and `useIdleTimeout()`) actually correct?**
  _`useAuthStore` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `emit` (e.g. with `apply()` and `confirm()`) actually correct?**
  _`emit` has 3 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _206 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05714285714285714 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.08712121212121213 - nodes in this community are weakly interconnected._