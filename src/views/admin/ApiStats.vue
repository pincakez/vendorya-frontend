<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">API Stats</h1>
        <p class="page-sub">Gemini drug enrichment progress &amp; catalog health</p>
      </div>
      <BaseButton variant="refresh" :loading="loading" @click="load">
        <RefreshCw :size="14" /> Update
      </BaseButton>
    </div>

    <div v-if="loading && !stats" class="as-loading">Loading…</div>

    <template v-else-if="stats">
      <!-- Progress bar -->
      <div class="as-progress-card">
        <div class="as-progress-head">
          <span class="as-progress-label">§DE Enrichment — Solid-dose drugs</span>
          <span class="as-progress-pct">{{ stats.catalog.pct_complete }}%</span>
        </div>
        <div class="as-bar-bg">
          <div class="as-bar-fill" :style="{ width: stats.catalog.pct_complete + '%' }" />
        </div>
        <div class="as-progress-sub">
          {{ fmt(stats.catalog.solid_enriched) }} of {{ fmt(stats.catalog.solid_dose_total) }} solid-dose drugs enriched
        </div>
      </div>

      <!-- Stat cards row 1 -->
      <div class="as-grid">
        <div class="as-card">
          <div class="as-card-icon accent"><BookOpen :size="20" /></div>
          <div class="as-card-body">
            <div class="as-card-val">{{ fmt(stats.enrichment.total_profiles) }}</div>
            <div class="as-card-label">Drug Profiles Created</div>
          </div>
        </div>

        <div class="as-card">
          <div class="as-card-icon warning"><AlertTriangle :size="20" /></div>
          <div class="as-card-body">
            <div class="as-card-val">{{ fmt(stats.enrichment.needs_review) }}</div>
            <div class="as-card-label">Need Review</div>
            <div class="as-card-sub">Suspicious packaging values</div>
          </div>
        </div>

        <div class="as-card">
          <div class="as-card-icon muted"><Database :size="20" /></div>
          <div class="as-card-body">
            <div class="as-card-val">{{ fmt(stats.catalog.unenriched) }}</div>
            <div class="as-card-label">Still Unenriched</div>
            <div class="as-card-sub">All MB products (incl. liquid/topical)</div>
          </div>
        </div>

        <div class="as-card">
          <div class="as-card-icon success"><Layers :size="20" /></div>
          <div class="as-card-body">
            <div class="as-card-val">{{ fmt(stats.catalog.total_mb) }}</div>
            <div class="as-card-label">Total MB Catalog</div>
            <div class="as-card-sub">{{ fmt(stats.catalog.solid_dose_total) }} solid-dose</div>
          </div>
        </div>
      </div>

      <!-- Model breakdown + last run -->
      <div class="as-row-2">
        <!-- Model breakdown -->
        <div class="as-section-card">
          <div class="as-sec-title"><Cpu :size="14" /> Model Breakdown</div>
          <div v-if="stats.enrichment.by_model.length" class="as-model-list">
            <div v-for="m in stats.enrichment.by_model" :key="m.model_used" class="as-model-row">
              <span class="as-model-name">{{ m.model_used || '(unknown)' }}</span>
              <span class="as-model-count">{{ fmt(m.count) }} profiles</span>
            </div>
          </div>
          <div v-else class="as-empty-note">No enrichments yet — run the script to start.</div>
        </div>

        <!-- Last run + run instructions -->
        <div class="as-section-card">
          <div class="as-sec-title"><Clock :size="14" /> Last Enrichment</div>
          <div v-if="stats.enrichment.last_enriched_at" class="as-last-run">
            {{ fmtDate(stats.enrichment.last_enriched_at) }}
          </div>
          <div v-else class="as-empty-note">Not run yet.</div>

          <div class="as-sec-title" style="margin-top:20px;"><Terminal :size="14" /> How to Run</div>
          <pre class="as-code">cd vendorya-backend
venv/bin/python manage.py shell -c \
  "exec(open('../meds_catalog/enrich_drugs.py').read())"</pre>
          <div class="as-code-note">Runs up to 1,400 profiles/day · 30 RPM · resumes automatically</div>
        </div>
      </div>

      <div class="as-updated">
        Last updated: {{ fmtDate(stats.as_of) }}
      </div>
    </template>

    <div v-else-if="error" class="as-error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { RefreshCw, BookOpen, AlertTriangle, Database, Layers, Cpu, Clock, Terminal } from 'lucide-vue-next'
import api from '@/api/axios'
import BaseButton from '@/components/base/BaseButton.vue'

const stats   = ref(null)
const loading = ref(false)
const error   = ref('')

function fmt(n) {
  return n == null ? '—' : Number(n).toLocaleString()
}
function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
}

async function load() {
  loading.value = true; error.value = ''
  try {
    const { data } = await api.get('/api/admin/api-stats/')
    stats.value = data
  } catch (e) {
    error.value = e?.response?.data?.detail || 'Failed to load stats'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.page-header { display:flex; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:24px; }

.as-loading { text-align:center; padding:60px 20px; color:var(--text-muted); font-size:14px; }
.as-error   { text-align:center; padding:60px 20px; color:var(--danger); font-size:14px; }

/* Progress bar */
.as-progress-card { background:var(--bg-card); border:1px solid var(--border); border-radius:16px; padding:20px 24px; margin-bottom:20px; }
.as-progress-head { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
.as-progress-label { font-size:14px; font-weight:700; color:var(--text-primary); }
.as-progress-pct { font-size:22px; font-weight:800; color:var(--accent); font-variant-numeric:tabular-nums; }
.as-bar-bg { height:10px; background:var(--border); border-radius:99px; overflow:hidden; }
.as-bar-fill { height:100%; background:var(--accent); border-radius:99px; transition:width 600ms cubic-bezier(0.25,0.8,0.25,1); }
.as-progress-sub { font-size:12px; color:var(--text-muted); margin-top:8px; }

/* Stat cards */
.as-grid { display:grid; grid-template-columns:repeat(4, 1fr); gap:14px; margin-bottom:20px; }
@media (max-width: 900px) { .as-grid { grid-template-columns:repeat(2,1fr); } }
.as-card { display:flex; align-items:center; gap:14px; background:var(--bg-card); border:1px solid var(--border); border-radius:14px; padding:16px 18px; }
.as-card-icon { width:40px; height:40px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.as-card-icon.accent  { background:var(--accent-soft); color:var(--accent); }
.as-card-icon.warning { background:rgba(245,158,11,.12); color:#d97706; }
.as-card-icon.muted   { background:var(--border); color:var(--text-secondary); }
.as-card-icon.success { background:rgba(34,197,94,.12); color:#16a34a; }
.dark .as-card-icon.success { color:#4ade80; }
.as-card-body { min-width:0; }
.as-card-val   { font-size:22px; font-weight:800; color:var(--text-primary); font-variant-numeric:tabular-nums; line-height:1.1; }
.as-card-label { font-size:12px; font-weight:600; color:var(--text-secondary); margin-top:2px; }
.as-card-sub   { font-size:11px; color:var(--text-muted); margin-top:2px; }

/* Bottom row */
.as-row-2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:14px; }
@media (max-width: 700px) { .as-row-2 { grid-template-columns:1fr; } }
.as-section-card { background:var(--bg-card); border:1px solid var(--border); border-radius:14px; padding:18px 20px; }
.as-sec-title { display:flex; align-items:center; gap:6px; font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; color:var(--text-muted); margin-bottom:12px; }

.as-model-list { display:flex; flex-direction:column; gap:8px; }
.as-model-row { display:flex; align-items:center; justify-content:space-between; font-size:13px; }
.as-model-name  { color:var(--text-primary); font-weight:500; font-family:ui-monospace,monospace; font-size:12px; }
.as-model-count { color:var(--text-muted); font-weight:600; }

.as-last-run { font-size:16px; font-weight:700; color:var(--text-primary); }
.as-empty-note { font-size:13px; color:var(--text-muted); font-style:italic; }

.as-code { background:var(--bg-app); border:1px solid var(--border); border-radius:8px; padding:10px 12px; font-size:11.5px; font-family:ui-monospace,monospace; color:var(--text-primary); white-space:pre-wrap; word-break:break-all; margin:0 0 6px; }
.as-code-note { font-size:11px; color:var(--text-muted); }

.as-updated { font-size:11px; color:var(--text-muted); text-align:right; }
</style>
