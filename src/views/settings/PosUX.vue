<template>
  <div>
    <div v-if="!embedded" class="page-header">
      <div>
        <h1 class="page-title">{{ t('settings.ux.title') }}</h1>
        <p class="page-sub">{{ t('settings.ux.sub') }}</p>
      </div>
      <div style="display:flex;gap:10px;">
        <button class="btn-secondary" @click="restoreDefaults">{{ t('settings.ux.restore_defaults') }}</button>
        <button class="btn-primary" :disabled="saving" @click="save">{{ saving ? t('common.saving') : t('common.save') }}</button>
      </div>
    </div>
    <div v-else style="display:flex;gap:10px;justify-content:flex-end;margin-bottom:16px;">
      <button class="btn-secondary" @click="restoreDefaults">{{ t('settings.ux.restore_defaults') }}</button>
      <button class="btn-primary" :disabled="saving" @click="save">{{ saving ? t('common.saving') : t('common.save') }}</button>
    </div>

    <!-- Tabs -->
    <div class="tab-bar" style="margin-bottom:24px;">
      <button class="tab-btn" :class="{ active: activeTab === 'pos' }" @click="activeTab = 'pos'">{{ t('settings.ux.tab_pos') }}</button>
      <button class="tab-btn" :class="{ active: activeTab === 'general' }" @click="activeTab = 'general'">{{ t('settings.ux.tab_general') }}</button>
    </div>

    <!-- ═══ POS UX TAB ═══ -->
    <div v-if="activeTab === 'pos'" style="display:flex; flex-direction:column; gap:24px; max-width:720px;">
      <!-- Keyboard shortcuts -->
      <div class="settings-card">
        <div class="card-title">{{ t('settings.ux.pos_shortcuts') }}</div>
        <p class="card-sub">{{ t('settings.ux.pos_shortcuts_sub') }}</p>

        <template v-for="group in posShortcutGroups" :key="group.key">
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
                    <option value="">{{ t('settings.ux.none') }}</option>
                    <optgroup :label="t('settings.ux.function_keys')">
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
        <div class="card-title">{{ t('settings.ux.behaviour') }}</div>
        <div v-for="tg in toggleRows" :key="tg.key" class="toggle-row">
          <div>
            <div class="toggle-label">{{ tg.label }}</div>
            <div class="toggle-sub">{{ tg.sub }}</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" v-model="form.ux[tg.key]" />
            <span class="toggle-track"></span>
          </label>
        </div>
      </div>

      <!-- Apply to all -->
      <div class="settings-card" v-if="isOwnerOrAdmin">
        <div class="card-title">{{ t('settings.ux.share_title') }}</div>
        <div style="display:flex; align-items:center; justify-content:space-between; gap:16px;">
          <div>
            <div class="toggle-label">{{ t('settings.ux.apply_label') }}</div>
            <div class="toggle-sub">{{ t('settings.ux.apply_sub') }}</div>
          </div>
          <button class="btn-secondary" @click="applyToAll">{{ t('settings.ux.apply_btn') }}</button>
        </div>
      </div>
    </div>

    <!-- ═══ GENERAL UX TAB ═══ -->
    <div v-if="activeTab === 'general'" style="display:flex; flex-direction:column; gap:24px; max-width:720px;">
      <div class="settings-card">
        <div class="card-title">{{ t('settings.ux.appwide_title') }}</div>
        <p class="card-sub">{{ t('settings.ux.appwide_sub') }}</p>

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
                  <option value="">{{ t('settings.ux.none') }}</option>
                  <optgroup :label="t('settings.ux.function_keys')">
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
    <AppModal :open="conflictModal.open" :title="t('settings.ux.conflict_title')" width="400px" @close="cancelConflict">
      <div style="display:flex;flex-direction:column;gap:12px;">
        <p style="font-size:14px;color:var(--text-primary);margin:0;line-height:1.55;">
          {{ t('settings.ux.conflict_line1_a') }} <strong>{{ conflictModal.key }}</strong> {{ t('settings.ux.conflict_line1_b') }}
          <strong>"{{ conflictModal.takenBy }}"</strong>.
        </p>
        <p style="font-size:13px;color:var(--text-muted);margin:0;">
          {{ t('settings.ux.conflict_line2') }}
        </p>
      </div>
      <template #footer>
        <button class="btn-ghost" @click="cancelConflict">{{ t('common.cancel') }}</button>
        <button class="btn-primary" @click="confirmConflict">{{ t('settings.ux.assign') }}</button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'
import AppModal from '@/components/ui/AppModal.vue'

defineProps({ embedded: { type: Boolean, default: false } })

const { t } = useI18n()
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
const posAllRows = computed(() => [
  { key: 'focus_search', label: t('settings.ux.sc.focus_search'), group: 'core' },
  { key: 'pay',          label: t('settings.ux.sc.pay'),          group: 'core' },
  { key: 'discount',     label: t('settings.ux.sc.discount'),     group: 'core' },
  { key: 'hold',         label: t('settings.ux.sc.hold'),         group: 'core' },
  { key: 'reprint',      label: t('settings.ux.sc.reprint'),      group: 'core' },
  { key: 'remove_last',  label: t('settings.ux.sc.remove_last'),  group: 'cart' },
  { key: 'undo',         label: t('settings.ux.sc.undo'),         group: 'cart' },
  { key: 'redo',         label: t('settings.ux.sc.redo'),         group: 'cart' },
  { key: 'returns',      label: t('settings.ux.sc.returns'),      group: 'navigate' },
  ...Array.from({ length: 10 }, (_, i) => ({
    key:   `fav_${i + 1}`,
    label: t('settings.ux.sc.favorite', { n: i + 1 }),
    group: 'favorites',
  })),
])

// ── General UX rows ─────────────────────────────────────────
const generalRows = computed(() => [
  { key: 'open_pos', label: t('settings.ux.sc.open_pos') },
  { key: 'open_srv', label: t('settings.ux.sc.open_srv') },
])

// All rows combined (for conflict checking across both tabs)
const allRows = computed(() => [...posAllRows.value, ...generalRows.value])

const posShortcutGroups = computed(() => {
  const groups = {}
  for (const row of posAllRows.value) {
    if (!groups[row.group]) groups[row.group] = { key: row.group, label: t('settings.ux.groups.' + row.group), rows: [] }
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

  for (const row of allRows.value) {
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
  if (!confirm(t('settings.ux.confirm_restore'))) return
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

const toggleRows = computed(() => [
  { key: 'autofocus_after_add', label: t('settings.ux.tg.autofocus_label'),  sub: t('settings.ux.tg.autofocus_sub') },
  { key: 'scan_beep',           label: t('settings.ux.tg.beep_label'),       sub: t('settings.ux.tg.beep_sub') },
  { key: 'scan_flash',          label: t('settings.ux.tg.flash_label'),      sub: t('settings.ux.tg.flash_sub') },
  { key: 'auto_walkin',         label: t('settings.ux.tg.walkin_label'),     sub: t('settings.ux.tg.walkin_sub') },
  { key: 'show_quick_panel',    label: t('settings.ux.tg.quick_label'),      sub: t('settings.ux.tg.quick_sub') },
  { key: 'auto_print',          label: t('settings.ux.tg.autoprint_label'),  sub: t('settings.ux.tg.autoprint_sub') },
])

async function applyToAll() {
  if (!confirm(t('settings.ux.confirm_apply'))) return
  await save()
  await api.post('/api/auth/apply-pos-settings/')
  alert(t('settings.ux.applied'))
}
</script>

<style scoped>
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

</style>
