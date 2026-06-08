<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">UX Settings</h1>
        <p class="page-sub">Keyboard shortcuts and behaviour for POS and app-wide navigation</p>
      </div>
      <div style="display:flex;gap:10px;">
        <button class="btn-secondary" @click="restoreDefaults">Restore Defaults</button>
        <button class="btn-primary" :disabled="saving" @click="save">{{ saving ? 'Saving…' : 'Save' }}</button>
      </div>
    </div>

    <!-- Tabs -->
    <div class="tab-bar" style="margin-bottom:24px;">
      <button class="tab-btn" :class="{ active: activeTab === 'pos' }" @click="activeTab = 'pos'">POS UX</button>
      <button class="tab-btn" :class="{ active: activeTab === 'general' }" @click="activeTab = 'general'">General UX</button>
    </div>

    <!-- ═══ POS UX TAB ═══ -->
    <div v-if="activeTab === 'pos'" style="display:flex; flex-direction:column; gap:24px; max-width:720px;">
      <!-- Keyboard shortcuts -->
      <div class="settings-card">
        <div class="card-title">POS Keyboard Shortcuts</div>
        <p class="card-sub">Pick any key for each POS action. Conflicts are flagged before applying.</p>

        <template v-for="group in posShortcutGroups" :key="group.label">
          <div class="sc-group-label">{{ group.label }}</div>
          <table class="shortcuts-table">
            <tbody>
              <tr v-for="row in group.rows" :key="row.key">
                <td class="st-action">{{ row.label }}</td>
                <td class="st-key">
                  <select
                    v-model="form.shortcuts[row.key]"
                    @mousedown="onSelectMousedown(row.key)"
                    @change="onKeyChange(row.key)"
                    class="shortcut-select"
                  >
                    <option value="">— None —</option>
                    <optgroup label="Function Keys">
                      <option v-for="k in fKeys" :key="k" :value="k">{{ k }}</option>
                    </optgroup>
                    <optgroup label="Ctrl+">
                      <option v-for="k in ctrlKeys" :key="k" :value="k">{{ k }}</option>
                    </optgroup>
                    <optgroup label="Alt+">
                      <option v-for="k in altKeys" :key="k" :value="k">{{ k }}</option>
                    </optgroup>
                  </select>
                </td>
              </tr>
            </tbody>
          </table>
        </template>
      </div>

      <!-- Behaviour toggles -->
      <div class="settings-card">
        <div class="card-title">Behaviour</div>
        <div v-for="t in toggleRows" :key="t.key" class="toggle-row">
          <div>
            <div class="toggle-label">{{ t.label }}</div>
            <div class="toggle-sub">{{ t.sub }}</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" v-model="form.ux[t.key]" />
            <span class="toggle-track"></span>
          </label>
        </div>
      </div>

      <!-- Apply to all -->
      <div class="settings-card" v-if="isOwnerOrAdmin">
        <div class="card-title">Share Settings</div>
        <div style="display:flex; align-items:center; justify-content:space-between; gap:16px;">
          <div>
            <div class="toggle-label">Apply my settings to all cashiers</div>
            <div class="toggle-sub">Copies your shortcuts and behaviour to every staff member in this store</div>
          </div>
          <button class="btn-secondary" @click="applyToAll">Apply to All</button>
        </div>
      </div>
    </div>

    <!-- ═══ GENERAL UX TAB ═══ -->
    <div v-if="activeTab === 'general'" style="display:flex; flex-direction:column; gap:24px; max-width:720px;">
      <div class="settings-card">
        <div class="card-title">App-Wide Navigation Shortcuts</div>
        <p class="card-sub">Launch POS or Services from anywhere in the app. These shortcuts work on every page.</p>

        <table class="shortcuts-table">
          <tbody>
            <tr v-for="row in generalRows" :key="row.key">
              <td class="st-action">{{ row.label }}</td>
              <td class="st-key">
                <select
                  v-model="form.shortcuts[row.key]"
                  @change="onKeyChange(row.key, $event)"
                  class="shortcut-select"
                >
                  <option value="">— None —</option>
                  <optgroup label="Function Keys">
                    <option v-for="k in fKeys" :key="k" :value="k">{{ k }}</option>
                  </optgroup>
                  <optgroup label="Ctrl+">
                    <option v-for="k in ctrlKeys" :key="k" :value="k">{{ k }}</option>
                  </optgroup>
                  <optgroup label="Alt+">
                    <option v-for="k in altKeys" :key="k" :value="k">{{ k }}</option>
                  </optgroup>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ═══ CONFLICT WARNING MODAL ═══ -->
    <AppModal :open="conflictModal.open" title="Shortcut Conflict" width="400px" @close="cancelConflict">
      <div style="display:flex;flex-direction:column;gap:12px;">
        <p style="font-size:14px;color:var(--text-primary);margin:0;line-height:1.55;">
          <strong>{{ conflictModal.key }}</strong> is already assigned to
          <strong>"{{ conflictModal.takenBy }}"</strong>.
        </p>
        <p style="font-size:13px;color:var(--text-muted);margin:0;">
          Do you want to reassign it? The previous action will be unset.
        </p>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="cancelConflict">Cancel</button>
        <button class="btn-primary" @click="confirmConflict">Assign</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import AppModal from '@/components/ui/AppModal.vue'

const auth   = useAuthStore()
const saving = ref(false)
const activeTab = ref('pos')

const isOwnerOrAdmin = computed(() => ['OWNER', 'ADMIN'].includes(auth.userRole))

// ── Defaults ────────────────────────────────────────────────
const DEFAULT_SETTINGS = {
  shortcuts: {
    // Core POS
    focus_search: 'F1',
    pay:          'F9',
    discount:     'F8',
    hold:         'F4',
    reprint:      'F2',
    // Cart
    remove_last:  'F10',
    undo:         'Ctrl+Z',
    redo:         'Ctrl+Y',
    // Navigate
    returns:      'Alt+R',
    // Favorites 1–10
    fav_1:  'Alt+1', fav_2:  'Alt+2', fav_3:  'Alt+3',
    fav_4:  'Alt+4', fav_5:  'Alt+5', fav_6:  'Alt+6',
    fav_7:  'Alt+7', fav_8:  'Alt+8', fav_9:  'Alt+9',
    fav_10: 'Alt+0',
    // General UX — app-wide navigation
    open_pos: 'F5',
    open_srv: 'F6',
  },
  ux: {
    autofocus_after_add: true,
    scan_beep:           true,
    scan_flash:          true,
    auto_walkin:         true,
    show_quick_panel:    true,
    auto_print:          false,
  },
}

const form = ref(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)))

// ── Key pools ───────────────────────────────────────────────
const fKeys    = ['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12']
const ctrlKeys = [
  'Ctrl+A','Ctrl+B','Ctrl+C','Ctrl+D','Ctrl+E','Ctrl+F','Ctrl+G','Ctrl+H',
  'Ctrl+J','Ctrl+K','Ctrl+L','Ctrl+M','Ctrl+N','Ctrl+O','Ctrl+P','Ctrl+Q',
  'Ctrl+S','Ctrl+T','Ctrl+U','Ctrl+V','Ctrl+W','Ctrl+X','Ctrl+Y','Ctrl+Z',
  'Ctrl+/',
]
const altKeys  = [
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(c => `Alt+${c}`),
  ...'0123456789'.split('').map(d => `Alt+${d}`),
]

// ── POS shortcut rows, grouped ──────────────────────────────
const posAllRows = [
  { key: 'focus_search', label: 'Focus Search Bar',        group: 'Core POS' },
  { key: 'pay',          label: 'Pay / Checkout',          group: 'Core POS' },
  { key: 'discount',     label: 'Apply Discount',          group: 'Core POS' },
  { key: 'hold',         label: 'Hold Cart',               group: 'Core POS' },
  { key: 'reprint',      label: 'Reprint Last Receipt',    group: 'Core POS' },
  { key: 'remove_last',  label: 'Remove Last Added Item',  group: 'Cart' },
  { key: 'undo',         label: 'Undo',                    group: 'Cart' },
  { key: 'redo',         label: 'Redo',                    group: 'Cart' },
  { key: 'returns',      label: 'Open Returns',            group: 'Navigate' },
  ...Array.from({ length: 10 }, (_, i) => ({
    key:   `fav_${i + 1}`,
    label: `Favorite Item ${i + 1}`,
    group: 'Favorites',
  })),
]

// ── General UX rows ─────────────────────────────────────────
const generalRows = [
  { key: 'open_pos', label: 'Launch POS (from anywhere)' },
  { key: 'open_srv', label: 'Launch Services (from anywhere)' },
]

// All rows combined (for conflict checking across both tabs)
const allRows = [...posAllRows, ...generalRows]

const posShortcutGroups = computed(() => {
  const groups = {}
  for (const row of posAllRows) {
    if (!groups[row.group]) groups[row.group] = { label: row.group, rows: [] }
    groups[row.group].rows.push(row)
  }
  return Object.values(groups)
})

// ── Conflict detection — warn instead of silently unassigning ──
const conflictModal = ref({ open: false, key: '', takenBy: '', takenByKey: '', pendingValue: '', changedKey: '', prevValue: '' })

// Track the value of each shortcut key just before the user opens the select
const selectPrev = {}

function onSelectMousedown(key) {
  selectPrev[key] = form.value.shortcuts[key]
}

function onKeyChange(changedKey) {
  const val = form.value.shortcuts[changedKey]
  if (!val) return

  for (const row of allRows) {
    if (row.key !== changedKey && form.value.shortcuts[row.key] === val) {
      // Conflict — revert and show warning modal
      const prev = selectPrev[changedKey] ?? ''
      form.value.shortcuts[changedKey] = prev
      conflictModal.value = {
        open: true,
        key: val,
        takenBy: row.label,
        takenByKey: row.key,
        pendingValue: val,
        changedKey,
        prevValue: prev,
      }
      return
    }
  }
}

function cancelConflict() {
  conflictModal.value.open = false
}

function confirmConflict() {
  const { changedKey, takenByKey, pendingValue } = conflictModal.value
  form.value.shortcuts[takenByKey] = ''
  form.value.shortcuts[changedKey] = pendingValue
  conflictModal.value.open = false
}

// ── Load / Save / Reset ─────────────────────────────────────
onMounted(async () => {
  try {
    const res = await api.get('/api/auth/me/')
    const ps = res.data.pos_settings
    if (ps && Object.keys(ps).length) {
      form.value = {
        shortcuts: { ...DEFAULT_SETTINGS.shortcuts, ...(ps.shortcuts || {}) },
        ux:        { ...DEFAULT_SETTINGS.ux,        ...(ps.ux        || {}) },
      }
    }
  } catch { /* ok */ }
})

function restoreDefaults() {
  if (!confirm('Restore all UX settings to defaults?')) return
  form.value = JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
}

async function save() {
  saving.value = true
  try {
    await api.patch('/api/auth/me/', { pos_settings: form.value })
    const res = await api.get('/api/auth/me/')
    auth.setUser(res.data)
  } finally {
    saving.value = false
  }
}

const toggleRows = [
  { key: 'autofocus_after_add', label: 'Auto-focus search after adding item',   sub: 'Returns focus to the search bar after each product is added' },
  { key: 'scan_beep',           label: 'Scan beep sound',                       sub: 'Play a short beep tone when a product is added' },
  { key: 'scan_flash',          label: 'Scan flash animation',                  sub: 'Flash the screen briefly when a product is added' },
  { key: 'auto_walkin',         label: 'Auto-select Walk-in on new sale',        sub: 'Automatically set the Walk-in customer at the start of each sale' },
  { key: 'show_quick_panel',    label: 'Show quick-access panel',               sub: 'Display the Top Selling / Favorites left panel' },
  { key: 'auto_print',          label: 'Auto-print receipt after payment',       sub: 'Automatically open the print dialog after a successful sale' },
]

async function applyToAll() {
  if (!confirm('Copy your UX settings to all staff in this store?')) return
  await save()
  await api.post('/api/auth/apply-pos-settings/')
  alert('Settings applied to all staff.')
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: flex-start; }
.tab-bar { display: flex; gap: 4px; border-bottom: 1px solid var(--border); }
.tab-btn { display: flex; align-items: center; gap: 6px; padding: 10px 14px; font-size: 13.5px; font-weight: 500; color: var(--text-muted); border: none; background: none; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: color 120ms, border-color 120ms; }
.tab-btn:hover { color: var(--text-primary); }
.tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }
.settings-card { background: var(--bg-card); border: 1px solid var(--border); border-radius: 16px; padding: 20px 24px; }
.card-title { font-size: 14px; font-weight: 800; color: var(--text-primary); margin-bottom: 4px; }
.card-sub { font-size: 12px; color: var(--text-muted); margin-bottom: 16px; }

.sc-group-label {
  font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase;
  color: var(--text-muted); padding: 14px 0 6px;
}
.sc-group-label:first-of-type { padding-top: 0; }

.shortcuts-table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
.shortcuts-table tr + tr td { border-top: 1px solid var(--border); }
.shortcuts-table td { padding: 9px 0; vertical-align: middle; }
.st-action { font-size: 13px; font-weight: 600; color: var(--text-primary); width: 220px; }
.st-key    { width: 180px; }

.shortcut-select {
  border: 1.5px solid var(--border); border-radius: 8px; padding: 6px 10px;
  font-size: 13px; font-weight: 700; background: var(--bg-app); color: var(--text-primary);
  cursor: pointer; outline: none; min-width: 150px;
}
.shortcut-select:focus { border-color: var(--accent); }

.toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 0; border-bottom: 1px solid var(--border); }
.toggle-row:last-child { border-bottom: none; }
.toggle-label { font-size: 13px; font-weight: 700; color: var(--text-primary); }
.toggle-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.toggle-switch { position: relative; width: 44px; height: 24px; flex-shrink: 0; cursor: pointer; }
.toggle-switch input { opacity: 0; width: 0; height: 0; }
.toggle-track {
  position: absolute; inset: 0; border-radius: 999px; background: var(--border);
  transition: background 200ms;
}
.toggle-track::after {
  content: ''; position: absolute; top: 3px; left: 3px;
  width: 18px; height: 18px; border-radius: 50%; background: #fff;
  transition: transform 200ms; box-shadow: 0 1px 3px rgba(0,0,0,.2);
}
.toggle-switch input:checked + .toggle-track { background: var(--accent); }
.toggle-switch input:checked + .toggle-track::after { transform: translateX(20px); }

.btn-ghost { display: inline-flex; align-items: center; gap: 5px; padding: 8px 12px; border-radius: 9px; font-size: 13px; font-weight: 500; border: 1px solid var(--border); background: none; color: var(--text-secondary); cursor: pointer; }
.btn-ghost:hover { background: var(--border); color: var(--text-primary); }
.btn-primary { display: inline-flex; align-items: center; gap: 5px; padding: 8px 16px; border-radius: 9px; font-size: 13px; font-weight: 600; border: none; background: var(--accent); color: #1a1208; cursor: pointer; }
.btn-primary:hover { background: var(--accent-hover); }
.btn-primary:disabled { opacity: .5; cursor: default; }
</style>
