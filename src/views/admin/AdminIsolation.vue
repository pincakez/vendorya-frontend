<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">Isolation Check</h1>
        <p class="page-sub">
          Proves one store can never see another store's data. The check builds a private
          test world (two throwaway stores), tries to peek across them on every screen, then
          deletes the whole thing — nothing touches your real data.
        </p>
      </div>
      <div class="header-right">
        <button class="btn-run" :disabled="loading" @click="runCheck">
          <ShieldCheck :size="16" />
          {{ loading ? 'Checking…' : 'Run Check' }}
        </button>
      </div>
    </div>

    <!-- first load / idle -->
    <div v-if="!report && !loading" class="empty-hint">
      <ShieldCheck :size="32" style="opacity:.3;margin-bottom:8px;" />
      <div>Press <strong>Run Check</strong> to scan every screen for cross-store leaks.</div>
    </div>

    <!-- running -->
    <div v-else-if="loading" class="empty-hint">
      <div class="spinner" />
      <div>Building the test world and inspecting {{ lastCount || 23 }} screens…</div>
    </div>

    <!-- results -->
    <template v-else>
      <!-- verdict banner -->
      <div class="verdict" :class="verdictClass">
        <div class="verdict-icon">
          <ShieldCheck v-if="report.status === 'PASS'" :size="28" />
          <ShieldAlert v-else-if="report.status === 'FAIL'" :size="28" />
          <ShieldQuestion v-else :size="28" />
        </div>
        <div class="verdict-body">
          <div class="verdict-title">{{ verdictTitle }}</div>
          <div class="verdict-text">{{ verdictText }}</div>
        </div>
        <div class="verdict-stats">
          <div class="stat"><span class="stat-num">{{ report.isolated }}</span><span class="stat-lbl">isolated</span></div>
          <div class="stat" :class="{ bad: report.leaks }"><span class="stat-num">{{ report.leaks }}</span><span class="stat-lbl">leaks</span></div>
          <div class="stat" v-if="report.errors"><span class="stat-num">{{ report.errors }}</span><span class="stat-lbl">errors</span></div>
        </div>
      </div>

      <!-- per-endpoint table -->
      <div class="table-wrap group-card">
        <div class="group-head">
          <span class="group-title">Per-screen results</span>
          <span class="group-count">{{ report.endpoints_checked }}</span>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Screen</th>
              <th>Result</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="e in report.endpoints" :key="e.endpoint" class="table-row">
              <td><span style="font-weight:600;">{{ e.endpoint }}</span></td>
              <td><span class="pill" :class="statusClass(e.status)">{{ statusLabel(e.status) }}</span></td>
              <td style="color:var(--text-secondary);">{{ detailText(e) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- seed warnings, only if any -->
      <div v-if="report.seed_warnings && report.seed_warnings.length" class="table-wrap warn-card">
        <div class="group-head"><span class="group-title">Notes</span></div>
        <ul class="warn-list">
          <li v-for="(w, i) in report.seed_warnings" :key="i">{{ w }}</li>
        </ul>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-vue-next'
import api from '@/api/axios'

const report    = ref(null)
const loading   = ref(false)
const lastCount = ref(0)

async function runCheck() {
  loading.value = true
  try {
    const res = await api.post('/api/admin/isolation-check/')
    report.value = res.data
    lastCount.value = res.data.endpoints_checked
  } catch (e) {
    alert(e.response?.data?.detail || 'Isolation check failed to run.')
  } finally {
    loading.value = false
  }
}

const verdictClass = computed(() => ({
  pass: report.value?.status === 'PASS',
  fail: report.value?.status === 'FAIL',
  warn: report.value?.status === 'INCONCLUSIVE',
}))

const verdictTitle = computed(() => ({
  PASS: 'Isolated — no leaks found',
  FAIL: 'Leak detected!',
  INCONCLUSIVE: 'Inconclusive',
}[report.value?.status] || ''))

const verdictText = computed(() => ({
  PASS: `All ${report.value?.isolated} tested screens correctly hid the other store's data. Store A cannot see Store B.`,
  FAIL: `${report.value?.leaks} screen(s) returned another store's data. Fix the highlighted screens below before going live.`,
  INCONCLUSIVE: 'The check ran but had no foreign data to test against. Try again, or report this.',
}[report.value?.status] || ''))

function statusClass(s) {
  return { ok: s === 'isolated', bad: s === 'leak', muted: s === 'no_foreign_data', err: s === 'error' }
}
function statusLabel(s) {
  return { isolated: 'Isolated', leak: 'LEAK', no_foreign_data: 'No data', error: 'Error' }[s] || s
}
function detailText(e) {
  if (e.status === 'leak')  return `Returned ${e.leaked} row(s) from another store`
  if (e.status === 'error') return e.error || 'Could not test'
  if (e.status === 'isolated') return `Hid ${e.foreign_available} foreign row(s)`
  if (e.status === 'no_foreign_data') return 'No other-store data to test against'
  return ''
}
</script>

<style scoped>
.page-header  { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:20px; flex-wrap:wrap; gap:12px; }
.page-title   { font-size:22px; font-weight:700; color:var(--text-primary); margin:0; }
.page-sub     { font-size:13px; color:var(--text-muted); margin:2px 0 0; max-width:620px; line-height:1.5; }
.header-right { display:flex; align-items:center; gap:10px; }

.btn-run { display:inline-flex; align-items:center; gap:7px; padding:9px 18px; border-radius:9px; font-size:13.5px; font-weight:600; border:1px solid var(--admin-accent); background:var(--admin-accent); color:#fff; cursor:pointer; transition:opacity 100ms, transform 70ms; }
.btn-run:hover:not(:disabled) { opacity:.9; }
.btn-run:active:not(:disabled) { transform:scale(0.97); }
.btn-run:disabled { opacity:.55; cursor:default; }

.empty-hint { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; padding:48px 20px; text-align:center; color:var(--text-muted); display:flex; flex-direction:column; align-items:center; gap:6px; }
.spinner { width:28px; height:28px; border:3px solid var(--border); border-top-color:var(--admin-accent); border-radius:50%; animation:spin .8s linear infinite; margin-bottom:6px; }
@keyframes spin { to { transform:rotate(360deg); } }

.verdict { display:flex; align-items:center; gap:16px; padding:18px 20px; border-radius:12px; border:1px solid var(--border); margin-bottom:16px; }
.verdict.pass { background:rgba(34,197,94,.08);  border-color:rgba(34,197,94,.35); }
.verdict.fail { background:rgba(239,68,68,.08);  border-color:rgba(239,68,68,.4); }
.verdict.warn { background:rgba(234,179,8,.08);  border-color:rgba(234,179,8,.35); }
.verdict-icon { flex-shrink:0; }
.verdict.pass .verdict-icon { color:#16a34a; }
.verdict.fail .verdict-icon { color:#dc2626; }
.verdict.warn .verdict-icon { color:#ca8a04; }
.verdict-body { flex:1; }
.verdict-title { font-size:16px; font-weight:700; color:var(--text-primary); }
.verdict-text  { font-size:13px; color:var(--text-secondary); margin-top:3px; line-height:1.5; }
.verdict-stats { display:flex; gap:18px; flex-shrink:0; }
.stat { text-align:center; }
.stat-num { display:block; font-size:20px; font-weight:700; color:var(--text-primary); }
.stat.bad .stat-num { color:#dc2626; }
.stat-lbl { font-size:11px; text-transform:uppercase; letter-spacing:.04em; color:var(--text-muted); }

.group-card { background:var(--bg-card); border:1px solid var(--border); border-radius:12px; overflow:hidden; }
.group-head { display:flex; align-items:center; gap:10px; padding:12px 16px; border-bottom:1px solid var(--border); background:var(--bg-app); }
.group-title { font-size:13px; font-weight:700; color:var(--text-primary); }
.group-count { display:inline-block; min-width:20px; text-align:center; padding:1px 8px; border-radius:20px; font-size:11px; font-weight:700; background:var(--admin-accent-soft); color:var(--admin-accent); }

.data-table { width:100%; border-collapse:collapse; font-size:13px; }
.data-table thead th { padding:10px 16px; text-align:left; font-size:11.5px; font-weight:600; text-transform:uppercase; letter-spacing:.05em; color:var(--text-muted); border-bottom:1px solid var(--border); }
.data-table tbody tr.table-row { border-bottom:1px solid var(--border); }
.data-table tbody tr.table-row:last-child { border-bottom:none; }
.data-table tbody tr.table-row:hover { background:var(--bg-app); }
.data-table tbody td { padding:10px 16px; color:var(--text-primary); }

.pill { display:inline-block; padding:2px 10px; border-radius:20px; font-size:11px; font-weight:700; }
.pill.ok    { background:rgba(34,197,94,.14);  color:#16a34a; }
.pill.bad   { background:rgba(239,68,68,.14);  color:#dc2626; }
.pill.muted { background:var(--bg-app); color:var(--text-muted); }
.pill.err   { background:rgba(234,179,8,.14);  color:#ca8a04; }

.warn-card { margin-top:16px; }
.warn-list { margin:0; padding:12px 16px 16px 32px; font-size:12.5px; color:var(--text-secondary); line-height:1.6; }
</style>
