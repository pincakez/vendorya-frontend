<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('settings.payment_methods.title') }}</h1>
        <p class="page-sub">{{ t('settings.payment_methods.sub') }}</p>
      </div>
      <button class="btn-primary" @click="openAdd">{{ t('settings.payment_methods.add_btn') }}</button>
    </div>

    <div class="table-wrap" style="margin-top:24px">
      <table class="data-table">
        <thead>
          <tr>
            <th>{{ t('common.name') }}</th>
            <th>{{ t('settings.payment_methods.type') }}</th>
            <th>{{ t('settings.payment_methods.active') }}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="4" class="table-empty">{{ t('settings.payment_methods.loading') }}</td></tr>
          <tr v-else-if="!methods.length"><td colspan="4" class="table-empty">{{ t('settings.payment_methods.empty') }}</td></tr>
          <tr v-for="m in methods" :key="m.id">
            <td style="font-weight:700;">{{ m.name }}</td>
            <td>
              <span v-if="m.is_cash" class="badge badge-blue">{{ t('settings.payment_methods.cash') }}</span>
              <span v-else-if="m.is_agel" class="badge badge-amber">{{ t('settings.payment_methods.agel') }}</span>
              <span v-else class="badge badge-gray">{{ t('settings.payment_methods.standard') }}</span>
            </td>
            <td>
              <span :class="['badge', m.is_deleted ? 'badge-red' : 'badge-green']">
                {{ m.is_deleted ? t('settings.payment_methods.inactive') : t('settings.payment_methods.active') }}
              </span>
            </td>
            <td>
              <button v-if="!m.is_agel && !m.is_cash" class="btn-icon" @click="deleteMethod(m)">
                <Trash2 :size="15" />
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <AppModal v-if="showAdd" :title="t('settings.payment_methods.modal_title')" @close="showAdd = false" @submit="addMethod" :submit-label="t('common.add')">
      <div class="field">
        <label>{{ t('common.name') }}</label>
        <input v-model="form.name" class="form-input" :placeholder="t('settings.payment_methods.name_ph')" />
      </div>
      <div class="field">
        <label class="toggle-label">
          <span>{{ t('settings.payment_methods.mark_agel') }}</span>
          <input type="checkbox" v-model="form.is_agel" />
        </label>
        <p class="field-hint">{{ t('settings.payment_methods.agel_hint') }}</p>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Trash2 } from 'lucide-vue-next'
import api from '@/api/axios'
import AppModal from '@/components/ui/AppModal.vue'

const { t } = useI18n()

const methods = ref([])
const loading = ref(true)
const showAdd = ref(false)
const form    = ref({ name: '', is_agel: false })

async function load() {
  loading.value = true
  try {
    const res = await api.get('/api/finance/payment-methods/')
    methods.value = res.data.results || res.data
  } finally {
    loading.value = false
  }
}
onMounted(load)

function openAdd() { form.value = { name: '', is_agel: false }; showAdd.value = true }

async function addMethod() {
  if (!form.value.name.trim()) return
  await api.post('/api/finance/payment-methods/', form.value)
  showAdd.value = false
  load()
}

async function deleteMethod(m) {
  if (!confirm(t('settings.payment_methods.confirm_delete', { name: m.name }))) return
  await api.delete(`/api/finance/payment-methods/${m.id}/`)
  load()
}
</script>

<style scoped>
.badge { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 6px; }
.badge-blue  { background: var(--info-soft); color: var(--info-hover); }
.badge-amber { background: var(--warning-soft); color: #92400e; }
.badge-gray  { background: var(--bg-app); color: var(--text-muted); border: 1px solid var(--border); }
.badge-green { background: var(--success-soft); color: var(--success-hover); }
.badge-red   { background: var(--danger-soft); color: var(--danger); }
.btn-icon { background: none; border: none; cursor: pointer; color: var(--text-muted); padding: 6px; border-radius: 8px; }
.btn-icon:hover { background: var(--danger-soft); color: var(--danger); }
.field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.field label { font-size: 13px; font-weight: 700; color: var(--text-secondary); }
.toggle-label { display: flex; align-items: center; justify-content: space-between; }
.field-hint { font-size: 12px; color: var(--text-muted); margin: 0; }
</style>
