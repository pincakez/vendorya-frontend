<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">POS UX Settings</h1>
        <p class="page-sub">Keyboard shortcuts and behaviour toggles for your POS session</p>
      </div>
      <div style="display:flex;gap:10px;">
        <button class="btn-secondary" @click="reset">Reset to Defaults</button>
        <button class="btn-primary" :disabled="saving" @click="save">{{ saving ? 'Saving…' : 'Save' }}</button>
      </div>
    </div>

    <div style="display:flex; flex-direction:column; gap:24px; margin-top:24px; max-width:680px;">
      <!-- Keyboard shortcuts -->
      <div class="settings-card">
        <div class="card-title">Keyboard Shortcuts</div>
        <div v-if="conflictMsg" class="conflict-msg">{{ conflictMsg }}</div>
        <table class="shortcuts-table">
          <tbody>
            <tr v-for="row in shortcutRows" :key="row.key">
              <td class="st-action">{{ row.label }}</td>
              <td>
                <select v-model="form.shortcuts[row.key]" @change="checkConflict(row.key)" class="shortcut-select">
                  <option v-for="k in availableKeys" :key="k" :value="k">{{ k }}</option>
                  <option value="">None</option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
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

const auth  = useAuthStore()
const saving = ref(false)
const conflictMsg = ref('')

const isOwnerOrAdmin = computed(() => ['OWNER', 'ADMIN'].includes(auth.userRole))

const DEFAULT_SETTINGS = {
  shortcuts: { pay: 'F9', discount: 'F8', hold: 'F4', reprint: 'F2', focus_search: 'F1' },
  ux: { autofocus_after_add: true, scan_beep: true, scan_flash: true, auto_walkin: true, show_quick_panel: true, auto_print: false },
}

const form = ref(JSON.parse(JSON.stringify(DEFAULT_SETTINGS)))

const availableKeys = [
  'F1','F2','F4','F6','F7','F8','F9',
  'Ctrl+I','Ctrl+M','Ctrl+Shift+E','Ctrl+Shift+H','Ctrl+Shift+L',
  'Ctrl+Shift+S','Ctrl+Shift+U','Ctrl+Shift+V','Ctrl+Shift+X','Ctrl+Shift+Y',
]

const shortcutRows = [
  { key: 'pay',          label: 'Pay / Checkout' },
  { key: 'discount',     label: 'Apply Discount' },
  { key: 'hold',         label: 'Hold Cart' },
  { key: 'reprint',      label: 'Reprint Last Receipt' },
  { key: 'focus_search', label: 'Focus Search Bar' },
]

const toggleRows = [
  { key: 'autofocus_after_add', label: 'Auto-focus search after adding item',   sub: 'Returns focus to the search bar after each product is added' },
  { key: 'scan_beep',           label: 'Scan beep sound',                       sub: 'Play a short beep tone when a product is added' },
  { key: 'scan_flash',          label: 'Scan flash animation',                  sub: 'Flash the screen briefly when a product is added' },
  { key: 'auto_walkin',         label: 'Auto-select Walk-in on new sale',        sub: 'Automatically set the Walk-in customer at the start of each sale' },
  { key: 'show_quick_panel',    label: 'Show quick-access panel',               sub: 'Display the Top Selling / Favorites left panel' },
  { key: 'auto_print',          label: 'Auto-print receipt after payment',       sub: 'Automatically open the print dialog after a successful sale' },
]

onMounted(async () => {
  try {
    const res = await api.get('/api/auth/me/')
    const ps = res.data.pos_settings
    if (ps && Object.keys(ps).length) {
      form.value = {
        shortcuts: { ...DEFAULT_SETTINGS.shortcuts, ...(ps.shortcuts || {}) },
        ux: { ...DEFAULT_SETTINGS.ux, ...(ps.ux || {}) },
      }
    }
  } catch { /* ok */ }
})

function checkConflict(changedKey) {
  conflictMsg.value = ''
  const val = form.value.shortcuts[changedKey]
  if (!val) return
  for (const row of shortcutRows) {
    if (row.key !== changedKey && form.value.shortcuts[row.key] === val) {
      form.value.shortcuts[row.key] = ''
      conflictMsg.value = `"${val}" was unassigned from "${row.label}"`
      return
    }
  }
}

function reset() {
  if (!confirm('Reset all POS settings to defaults?')) return
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
.card-title { font-size: 14px; font-weight: 800; color: var(--text-primary); margin-bottom: 16px; }
.conflict-msg { font-size: 12px; color: #92400e; background: #fef3c7; border-radius: 8px; padding: 8px 12px; margin-bottom: 12px; }
.shortcuts-table { width: 100%; border-collapse: collapse; }
.shortcuts-table tr + tr td { border-top: 1px solid var(--border); }
.shortcuts-table td { padding: 10px 0; vertical-align: middle; }
.st-action { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.shortcut-select { border: 1.5px solid var(--border); border-radius: 8px; padding: 6px 10px; font-size: 13px; font-weight: 700; background: var(--bg-app); color: var(--text-primary); cursor: pointer; outline: none; }
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
</style>
