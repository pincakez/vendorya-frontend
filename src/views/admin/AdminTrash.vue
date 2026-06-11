<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Trash</h1>
        <p class="page-sub">Restore soft-deleted records for a store. Deleted items are hidden, never erased — pick a store to see and recover them.</p>
      </div>
      <div class="header-right">
        <select v-model="storeFilter" class="filter-select" @change="fetchTrash">
          <option value="">Select a store…</option>
          <option v-for="s in stores" :key="s.id" :value="s.id">{{ s.name }}</option>
        </select>
      </div>
    </div>

    <div v-if="!storeFilter" class="empty-hint">
      <Trash2 :size="32" style="opacity:.3;margin-bottom:8px;" />
      <div>Choose a store to view its deleted records.</div>
    </div>

    <div v-else-if="loading" class="dt-card">
      <div class="table-skeleton"><div v-for="i in 4" :key="i" class="skeleton-row" /></div>
    </div>

    <div v-else-if="!groups.length" class="empty-hint">
      <Trash2 :size="32" style="opacity:.3;margin-bottom:8px;" />
      <div>Nothing in the trash for this store.</div>
    </div>

    <div v-else class="groups">
      <div v-for="g in groups" :key="g.model" class="dt-card">
        <div class="group-head">
          <span class="group-title">{{ g.label }}</span>
          <span class="group-count">{{ g.count }}</span>
        </div>
        <div class="dt-xscroll">
        <table class="dt">
          <thead>
            <tr>
              <th class="dt-th">Record</th>
              <th class="dt-th">Deleted</th>
              <th class="dt-th" style="width:110px;"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in g.rows" :key="row.id" class="dt-row">
              <td><span style="font-weight:600;">{{ row.label || '—' }}</span></td>
              <td style="color:var(--text-secondary);">{{ fmtDate(row.deleted_at) }}</td>
              <td>
                <button class="btn-restore" :disabled="busyKey === g.model + row.id" @click="restore(g, row)">
                  <RotateCcw :size="13" /> {{ busyKey === g.model + row.id ? 'Restoring…' : 'Restore' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div><!-- dt-xscroll -->
      </div><!-- existing -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Trash2, RotateCcw } from 'lucide-vue-next'
import api from '@/api/axios'

const stores      = ref([])
const groups      = ref([])
const storeFilter = ref('')
const loading     = ref(false)
const busyKey     = ref('')

function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

async function fetchStores() {
  try {
    const res = await api.get('/api/admin/stores/')
    stores.value = Array.isArray(res.data) ? res.data : (res.data.results || [])
  } catch { stores.value = [] }
}

async function fetchTrash() {
  groups.value = []
  if (!storeFilter.value) return
  loading.value = true
  try {
    const res = await api.get('/api/admin/trash/', { params: { store: storeFilter.value } })
    groups.value = res.data.groups || []
  } catch (e) {
    alert(e.response?.data?.detail || 'Could not load trash.')
  } finally {
    loading.value = false
  }
}

async function restore(group, row) {
  if (!confirm(`Restore this ${group.label.replace(/s$/, '').toLowerCase()}: "${row.label}"?`)) return
  busyKey.value = group.model + row.id
  try {
    await api.post('/api/admin/trash/restore/', { model: group.model, id: row.id })
    await fetchTrash()
  } catch (e) {
    alert(e.response?.data?.detail || 'Restore failed.')
  } finally {
    busyKey.value = ''
  }
}

onMounted(fetchStores)
</script>

<style scoped>
.page-sub     { font-size:13px; color:var(--text-muted); margin:2px 0 0; max-width:560px; }
.header-right { display:flex; align-items:center; gap:10px; }
.filter-select { padding:7px 12px; border:1px solid var(--border); border-radius:8px; background:var(--bg-card); color:var(--text-primary); font-size:13px; outline:none; min-width:200px; }

.empty-hint { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:48px 20px; text-align:center; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; }

.groups { display:flex; flex-direction:column; gap:16px; }
.group-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.group-head { display:flex; align-items:center; gap:10px; padding:12px 16px; border-bottom:1px solid var(--border); background:var(--bg-app); }
.group-title { font-size:13px; font-weight:700; color:var(--text-primary); }
.group-count { display:inline-block; min-width:20px; text-align:center; padding:1px 8px; border-radius:20px; font-size:11px; font-weight:700; background:var(--admin-accent-soft); color:var(--admin-accent); }


.table-skeleton { padding:8px 0; }
.skeleton-row { height:40px; margin:4px 16px; border-radius:6px; background:linear-gradient(90deg,var(--border) 25%,var(--bg-app) 50%,var(--border) 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
@keyframes shimmer { to { background-position:-200% 0; } }

.btn-restore { display:inline-flex; align-items:center; gap:5px; padding:6px 12px; border-radius:8px; font-size:12.5px; font-weight:600; border:1px solid var(--border); background:var(--bg-card); color:var(--text-primary); cursor:pointer; transition:background 100ms, border-color 100ms, transform 70ms; }
.btn-restore:hover { border-color:var(--admin-accent); color:var(--admin-accent); background:var(--admin-accent-soft); }
.btn-restore:active { transform:scale(0.95); }
.btn-restore:disabled { opacity:.5; cursor:default; }
</style>
