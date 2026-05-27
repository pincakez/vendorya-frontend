<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Attributes</h1>
        <p class="page-sub">Define product attributes like Season, Gender, Size, Color</p>
      </div>
    </div>

    <div class="table-wrap">
      <div v-if="loading" class="table-skeleton">
        <div v-for="i in 4" :key="i" class="skeleton-row" />
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Key</th>
            <th>Type</th>
            <th>Options</th>
            <th style="width:60px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="attrs.length === 0">
            <td colspan="5" class="table-empty">
              <Tag :size="32" style="opacity:.3;margin-bottom:8px;" />
              <div>No attributes defined yet</div>
              <div style="font-size:12px;margin-top:4px;">Attributes let you filter products by season, gender, size, etc.</div>
            </td>
          </tr>
          <tr v-for="a in attrs" :key="a.id" class="table-row">
            <td class="col-name">{{ a.name }}</td>
            <td class="col-ref">{{ a.key }}</td>
            <td><span class="type-badge" :class="`type-${a.input_type.toLowerCase()}`">{{ a.input_type }}</span></td>
            <td>
              <span v-if="a.input_type === 'SELECT' && a.options.length" class="options-list">
                <span v-for="opt in a.options.slice(0,4)" :key="opt" class="option-chip">{{ opt }}</span>
                <span v-if="a.options.length > 4" class="option-more">+{{ a.options.length - 4 }}</span>
              </span>
              <span v-else class="col-muted">—</span>
            </td>
            <td class="row-actions">
              <button class="row-action" @click="openEdit(a)"><Pencil :size="13" /></button>
              <button class="row-action danger" @click="deleteAttr(a.id)"><Trash2 :size="13" /></button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal -->
    <AppModal :open="modal.open" :title="modal.id ? 'Edit Attribute' : 'New Attribute'" @close="closeModal">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label class="form-label">Display Name</label>
            <input v-model="modal.name" class="form-input" placeholder="e.g. Season" @input="autoKey" />
          </div>
          <div>
            <label class="form-label">Key <span class="key-hint">used in filters</span></label>
            <input v-model="modal.key" class="form-input" placeholder="e.g. season" />
          </div>
        </div>

        <div>
          <label class="form-label">Input Type</label>
          <div class="type-picker">
            <button
              v-for="t in inputTypes" :key="t.value"
              class="type-option"
              :class="{ active: modal.inputType === t.value }"
              @click="modal.inputType = t.value"
            >
              <component :is="t.icon" :size="14" />
              {{ t.label }}
            </button>
          </div>
        </div>

        <div v-if="modal.inputType === 'SELECT'">
          <label class="form-label">Options</label>
          <div class="options-input-row">
            <input
              v-model="optionInput"
              class="form-input"
              placeholder="Type an option and press Enter"
              @keydown.enter.prevent="addOption"
            />
            <button class="btn-add-opt" @click="addOption">Add</button>
          </div>
          <div class="options-chips" v-if="modal.options.length">
            <span v-for="(opt, i) in modal.options" :key="opt" class="option-chip editable">
              {{ opt }}
              <button class="chip-remove" @click="modal.options.splice(i, 1)">×</button>
            </span>
          </div>
        </div>
      </div>

      <template #footer>
        <button class="btn-ghost" @click="closeModal">Cancel</button>
        <button class="btn-primary" :disabled="!modal.name.trim() || !modal.key.trim() || saving" @click="saveAttr">
          {{ saving ? 'Saving…' : (modal.id ? 'Save Changes' : 'Create Attribute') }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { Tag, Pencil, Trash2, AlignLeft, List, Hash } from 'lucide-vue-next'
import api from '@/api/axios'
import { useQABStore } from '@/stores/qab'
import AppModal from '@/components/ui/AppModal.vue'

const qab = useQABStore()

const attrs   = ref([])
const loading = ref(false)
const saving  = ref(false)
const optionInput = ref('')

const inputTypes = [
  { value: 'TEXT',   label: 'Free Text', icon: AlignLeft },
  { value: 'SELECT', label: 'Dropdown',  icon: List },
  { value: 'NUMBER', label: 'Number',    icon: Hash },
]

const modal = reactive({ open: false, id: null, name: '', key: '', inputType: 'TEXT', options: [] })

async function fetchAttrs() {
  loading.value = true
  try {
    const res = await api.get('/api/inventory/attributes/')
    attrs.value = res.data.results ?? res.data
  } finally { loading.value = false }
}

function autoKey() {
  if (!modal.id) {
    modal.key = modal.name.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
  }
}

function addOption() {
  const v = optionInput.value.trim()
  if (v && !modal.options.includes(v)) modal.options.push(v)
  optionInput.value = ''
}

function openNew()  { Object.assign(modal, { open: true, id: null, name: '', key: '', inputType: 'TEXT', options: [] }); optionInput.value = '' }
function openEdit(a) { Object.assign(modal, { open: true, id: a.id, name: a.name, key: a.key, inputType: a.input_type, options: [...(a.options || [])] }); optionInput.value = '' }
function closeModal() { modal.open = false }

async function saveAttr() {
  saving.value = true
  try {
    const payload = { name: modal.name, key: modal.key, input_type: modal.inputType, options: modal.inputType === 'SELECT' ? modal.options : [] }
    modal.id
      ? await api.patch(`/api/inventory/attributes/${modal.id}/`, payload)
      : await api.post('/api/inventory/attributes/', payload)
    closeModal()
    fetchAttrs()
  } catch (e) {
    alert(e.response?.data ? JSON.stringify(e.response.data) : 'Error saving attribute')
  } finally { saving.value = false }
}

async function deleteAttr(id) {
  if (!confirm('Delete this attribute? This will remove it from all products.')) return
  try {
    await api.delete(`/api/inventory/attributes/${id}/`)
    fetchAttrs()
  } catch (e) {
    alert(e.response?.data?.detail || 'Cannot delete — may be in use.')
  }
}

onMounted(() => {
  fetchAttrs()
  qab.setActions([{ id: 'new-attr', label: 'New Attribute', icon: 'plus', handler: openNew }])
})
onUnmounted(() => qab.clearActions())
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; }
.page-title  { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub    { font-size:13px; color:var(--text-muted); margin:2px 0 0; }

.table-wrap { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.data-table { width:100%; border-collapse:collapse; font-size:13px; }
.data-table thead th { padding:10px 14px; text-align:left; font-size:11.5px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); background:var(--bg-app); border-bottom:1px solid var(--border); }
.data-table tbody tr.table-row { border-bottom:1px solid var(--border); transition:background 100ms; }
.data-table tbody tr.table-row:last-child { border-bottom:none; }
.data-table tbody tr.table-row:hover { background:var(--bg-app); }
.data-table tbody td { padding:10px 14px; color:var(--text-primary); }
.table-empty { text-align:center; padding:48px; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; }
.table-skeleton { padding:8px 0; }
.skeleton-row { height:40px; margin:4px 16px; border-radius:6px; background:var(--border); animation:shimmer 1.4s ease-in-out infinite; }
@keyframes shimmer { 0%,100%{opacity:1} 50%{opacity:.5} }

.col-name  { font-weight:500; }
.col-ref   { font-family:monospace; font-size:12.5px; color:var(--text-muted); }
.col-muted { color:var(--text-muted); font-size:12.5px; }
.row-actions { display:flex; gap:4px; }
.row-action { width:28px; height:28px; border:none; background:none; border-radius:6px; cursor:pointer; color:var(--text-muted); display:inline-flex; align-items:center; justify-content:center; transition:background 100ms,color 100ms; }
.row-action:hover        { background:var(--border); color:var(--text-primary); }
.row-action.danger:hover { background:#fee2e2; color:#dc2626; }

.type-badge { display:inline-block; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:600; }
.type-text   { background:#f3f4f6; color:#4b5563; }
.type-select { background:#dbeafe; color:#1e40af; }
.type-number { background:#fef3c7; color:#92400e; }

.options-list { display:flex; flex-wrap:wrap; gap:4px; align-items:center; }
.option-chip { display:inline-block; padding:2px 7px; border-radius:999px; font-size:11px; background:var(--bg-app); border:1px solid var(--border); color:var(--text-secondary); }
.option-chip.editable { display:inline-flex; align-items:center; gap:4px; }
.option-more { font-size:11px; color:var(--text-muted); }
.chip-remove { border:none; background:none; cursor:pointer; color:var(--text-muted); font-size:13px; padding:0; line-height:1; display:flex; align-items:center; }
.chip-remove:hover { color:#dc2626; }

/* Form */
.form-label { display:block; font-size:12.5px; font-weight:600; color:var(--text-secondary); margin-bottom:5px; }
.key-hint   { font-size:11px; color:var(--text-muted); font-weight:400; margin-left:4px; }
.form-input { padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; width:100%; box-sizing:border-box; transition:border-color 120ms; }
.form-input:focus { border-color:#2563eb; }

.type-picker { display:flex; gap:6px; }
.type-option { display:inline-flex; align-items:center; gap:6px; padding:7px 14px; border-radius:8px; border:1px solid var(--border); background:var(--bg-app); color:var(--text-muted); font-size:13px; cursor:pointer; transition:all 100ms; }
.type-option:hover  { border-color:#93c5fd; color:var(--text-primary); }
.type-option.active { border-color:#2563eb; background:#eff6ff; color:#2563eb; font-weight:600; }

.options-input-row { display:flex; gap:8px; margin-bottom:8px; }
.btn-add-opt { padding:8px 14px; border-radius:8px; border:1px solid var(--border); background:var(--bg-app); color:var(--text-secondary); font-size:13px; cursor:pointer; white-space:nowrap; transition:background 100ms; flex-shrink:0; }
.btn-add-opt:hover { background:var(--border); }
.options-chips { display:flex; flex-wrap:wrap; gap:6px; }

.btn-ghost   { display:inline-flex; align-items:center; gap:5px; padding:7px 14px; border-radius:8px; font-size:13px; font-weight:500; border:1px solid var(--border); background:none; color:var(--text-secondary); cursor:pointer; transition:background 100ms,transform 70ms; }
.btn-ghost:hover  { background:var(--border); }
.btn-ghost:active { transform:scale(.95); }
.btn-primary { display:inline-flex; align-items:center; gap:5px; padding:8px 18px; border-radius:8px; font-size:13px; font-weight:600; border:none; background:#2563eb; color:#fff; cursor:pointer; transition:background 100ms,transform 70ms,opacity 100ms; }
.btn-primary:hover    { background:#1d4ed8; }
.btn-primary:active   { transform:scale(.95); }
.btn-primary:disabled { opacity:.5; cursor:default; }
</style>
