<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('inventory.attributes.title') }}</h1>
        <p class="page-sub">{{ t('inventory.attributes.sub') }}</p>
      </div>
      <button class="btn-primary" @click="openNew">
        <Plus :size="14" />
        {{ t('inventory.attributes.add_attribute') }}
      </button>
    </div>

    <div class="dt-card">
      <div v-if="loading" class="table-skeleton">
        <div v-for="i in 4" :key="i" class="skeleton-row" />
      </div>
      <div v-else class="dt-xscroll">
        <table class="dt">
        <thead>
          <tr>
            <th class="dt-th">{{ t('inventory.attributes.table_name') }}</th>
            <th class="dt-th">{{ t('inventory.attributes.table_key') }}</th>
            <th class="dt-th">{{ t('inventory.attributes.table_type') }}</th>
            <th class="dt-th">{{ t('inventory.attributes.table_options') }}</th>
            <th class="dt-th" style="width:60px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="attrs.length === 0">
            <td colspan="5" class="dt-empty">
              <Tag :size="32" style="opacity:.3;margin-bottom:8px;" />
              <div>{{ t('inventory.attributes.empty_title') }}</div>
              <div style="font-size:12px;margin-top:4px;">{{ t('inventory.attributes.empty_sub') }}</div>
            </td>
          </tr>
          <tr v-for="a in attrs" :key="a.id" class="dt-row">
            <td class="col-name">{{ a.name }}</td>
            <td class="col-ref">{{ a.key }}</td>
            <td><span class="type-badge" :class="`type-${a.input_type.toLowerCase()}`">{{ typeLabel(a.input_type) }}</span></td>
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
    </div><!-- dt-xscroll -->
    </div>

    <!-- Modal -->
    <AppModal :open="modal.open" :title="modal.id ? t('inventory.attributes.modal_edit_title') : t('inventory.attributes.modal_new_title')" @close="closeModal">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label class="form-label">{{ t('inventory.attributes.display_name') }}</label>
            <input v-model="modal.name" class="form-input" :placeholder="t('inventory.attributes.display_name_placeholder')" @input="autoKey" />
          </div>
          <div>
            <label class="form-label">{{ t('inventory.attributes.key_label') }} <span class="key-hint">{{ t('inventory.attributes.key_hint') }}</span></label>
            <input v-model="modal.key" class="form-input" :placeholder="t('inventory.attributes.key_placeholder')" />
          </div>
        </div>

        <div>
          <label class="form-label">{{ t('inventory.attributes.input_type') }}</label>
          <div class="type-picker">
            <button
              v-for="it in inputTypes" :key="it.value"
              class="type-option"
              :class="{ active: modal.inputType === it.value }"
              @click="modal.inputType = it.value"
            >
              <component :is="it.icon" :size="14" />
              {{ it.label }}
            </button>
          </div>
        </div>

        <div v-if="modal.inputType === 'SELECT'">
          <label class="form-label">{{ t('inventory.attributes.options_label') }}</label>
          <div class="options-input-row">
            <input
              v-model="optionInput"
              class="form-input"
              :placeholder="t('inventory.attributes.options_placeholder')"
              @keydown.enter.prevent="addOption"
            />
            <button class="btn-add-opt" @click="addOption">{{ t('inventory.attributes.add_option') }}</button>
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
        <button class="btn-ghost" @click="closeModal">{{ t('common.cancel') }}</button>
        <button class="btn-primary" :disabled="!modal.name.trim() || !modal.key.trim() || saving" @click="saveAttr">
          {{ saving ? t('common.saving') : (modal.id ? t('inventory.attributes.save_changes') : t('inventory.attributes.create_attribute')) }}
        </button>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Tag, Pencil, Trash2, AlignLeft, List, Hash, Plus } from 'lucide-vue-next'
import api from '@/api/axios'
import { useCtrlN } from '@/composables/useCtrlN'
useCtrlN(openNew)
import AppModal from '@/components/ui/AppModal.vue'

const { t } = useI18n()
const attrs   = ref([])
const loading = ref(false)
const saving  = ref(false)
const optionInput = ref('')

const inputTypes = computed(() => [
  { value: 'TEXT',   label: t('inventory.attributes.type_free_text'), icon: AlignLeft },
  { value: 'SELECT', label: t('inventory.attributes.type_dropdown'),  icon: List },
  { value: 'NUMBER', label: t('inventory.attributes.type_number'),    icon: Hash },
])
const TYPE_KEYS = { TEXT: 'type_free_text', SELECT: 'type_dropdown', NUMBER: 'type_number' }
function typeLabel(it) { return TYPE_KEYS[it] ? t('inventory.attributes.' + TYPE_KEYS[it]) : it }

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
})
</script>

<style scoped>

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
.row-action.danger:hover { background:var(--danger-soft); color:var(--danger); }

.type-badge { display:inline-block; padding:2px 8px; border-radius:20px; font-size:11px; font-weight:600; }
.type-text   { background:#f3f4f6; color:#4b5563; }
.type-select { background:var(--accent-soft); color:var(--accent-hover); }
.type-number { background:var(--warning-soft); color:#92400e; }

.options-list { display:flex; flex-wrap:wrap; gap:4px; align-items:center; }
.option-chip { display:inline-block; padding:2px 7px; border-radius:999px; font-size:11px; background:var(--bg-app); border:1px solid var(--border); color:var(--text-secondary); }
.option-chip.editable { display:inline-flex; align-items:center; gap:4px; }
.option-more { font-size:11px; color:var(--text-muted); }
.chip-remove { border:none; background:none; cursor:pointer; color:var(--text-muted); font-size:13px; padding:0; line-height:1; display:flex; align-items:center; }
.chip-remove:hover { color:var(--danger); }

/* Form */
.key-hint   { font-size:11px; color:var(--text-muted); font-weight:400; margin-left:4px; }
.form-input { padding:8px 10px; border:1px solid var(--border); border-radius:8px; background:var(--bg-app); color:var(--text-primary); font-size:13px; outline:none; width:100%; box-sizing:border-box; transition:border-color 120ms; }
.form-input:focus { border-color:var(--accent); }

.type-picker { display:flex; gap:6px; }
.type-option { display:inline-flex; align-items:center; gap:6px; padding:7px 14px; border-radius:8px; border:1px solid var(--border); background:var(--bg-app); color:var(--text-muted); font-size:13px; cursor:pointer; transition:all 100ms; }
.type-option:hover  { border-color:var(--accent); color:var(--text-primary); }
.type-option.active { border-color:var(--accent); background:var(--accent-soft); color:var(--accent); font-weight:600; }

.options-input-row { display:flex; gap:8px; margin-bottom:8px; }
.btn-add-opt { padding:8px 14px; border-radius:8px; border:1px solid var(--border); background:var(--bg-app); color:var(--text-secondary); font-size:13px; cursor:pointer; white-space:nowrap; transition:background 100ms; flex-shrink:0; }
.btn-add-opt:hover { background:var(--border); }
.options-chips { display:flex; flex-wrap:wrap; gap:6px; }

</style>
