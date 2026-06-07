<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">POS UX Settings</h1>
        <p class="page-sub">Keyboard shortcuts and behaviour toggles for your POS session</p>
      </div>
      <div style="display:flex;gap:10px;">
        <button class="btn-secondary" @click="restoreDefaults">Restore Defaults</button>
        <button class="btn-primary" :disabled="saving" @click="save">{{ saving ? 'Saving…' : 'Save' }}</button>
      </div>
    </div>

    <div style="display:flex; flex-direction:column; gap:24px; margin-top:24px; max-width:720px;">
      <!-- Keyboard shortcuts -->
      <div class="settings-card">
        <div class="card-title">Keyboard Shortcuts</div>
        <p class="card-sub">Pick any key for each action. Assigning a key to a new action automatically unassigns it from any previous action.</p>

        <template v-for="group in shortcutGroups" :key="group.label">
          <div class="sc-group-label">{{ group.label }}</div>
          <table class="shortcuts-table">
            <tbody>
              <tr v-for="row in group.rows" :key="row.key">
                <td class="st-action">{{ row.label }}</td>
                <td class="st-key">
                  <select
                    v-model="form.shortcuts[row.key]"
                    @change="onKeyChange(row.key)"
                    class="shortcut-select"
                    :class="{ 'sc-conflict': conflictKey === row.key }"
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
                <td class="st-conflict-msg" v-if="conflictKey === row.key">
                  <span class="conflict-chip">Was used by "{{ conflictFromLabel }}"</span>
                </td>
                <td v-else></td>
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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'

const auth   = useAuthStore()
const saving = ref(false)

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
const fKeys    = ['F1','F2','F4','F7','F8','F9','F10']
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

// ── Shortcut rows, grouped ──────────────────────────────────
const allRows = [
  // Core POS
  { key: 'focus_search', label: 'Focus Search Bar',        group: 'Core POS' },
  { key: 'pay',          label: 'Pay / Checkout',          group: 'Core POS' },
  { key: 'discount',     label: 'Apply Discount',          group: 'Core POS' },
  { key: 'hold',         label: 'Hold Cart',               group: 'Core POS' },
  { key: 'reprint',      label: 'Reprint Last Receipt',    group: 'Core POS' },
  // Cart
  { key: 'remove_last',  label: 'Remove Last Added Item',  group: 'Cart' },
  { key: 'undo',         label: 'Undo',                    group: 'Cart' },
  { key: 'redo',         label: 'Redo',                    group: 'Cart' },
  // Navigate
  { key: 'returns',      label: 'Open Returns',            group: 'Navigate' },
  // Favorites
  ...Array.from({ length: 10 }, (_, i) => ({
    key:   `fav_${i + 1}`,
    label: `Favorite Item ${i + 1}`,
    group: 'Favorites',
  })),
]

const shortcutGroups = computed(() => {
  const groups = {}
  for (const row of allRows) {
    if (!groups[row.group]) groups[row.group] = { label: row.group, rows: [] }
    groups[row.group].rows.push(row)
  }
  return Object.values(groups)
})

// ── Conflict detection ──────────────────────────────────────
const conflictKey       = ref('')
const conflictFromLabel = ref('')

function onKeyChange(changedKey) {
  conflictKey.value = ''
  conflictFromLabel.value = ''
  const val = form.value.shortcuts[changedKey]
  if (!val) return

  for (const row of allRows) {
    if (row.key !== changedKey && form.value.shortcuts[row.key] === val) {
      form.value.shortcuts[row.key] = ''  // auto-unassign
      conflictKey.value       = changedKey
      conflictFromLabel.value = row.label
      return
    }
  }
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
  if (!confirm('Restore all POS settings to defaults?')) return
  form.value = JSON.parse(JSON.stringify(DEFAULT_SETTINGS))
  conflictKey.value = ''
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
  if (!confirm('Copy your POS settings to all staff in this store?')) return
  await save()
  await api.post('/api/auth/apply-pos-settings/')
  alert('Settings applied to all staff.')
}
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: flex-start; }
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
.st-conflict-msg { padding-left: 12px; }

.shortcut-select {
  border: 1.5px solid var(--border); border-radius: 8px; padding: 6px 10px;
  font-size: 13px; font-weight: 700; background: var(--bg-app); color: var(--text-primary);
  cursor: pointer; outline: none; min-width: 150px;
}
.shortcut-select:focus { border-color: var(--accent); }
.shortcut-select.sc-conflict { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-soft); }

.conflict-chip {
  font-size: 11px; color: #92400e; background: #fef3c7; border-radius: 6px;
  padding: 3px 8px; white-space: nowrap;
}

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
</style>
