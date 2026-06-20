<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ t('settings.changelog.title') }}</h1>
        <p class="page-sub">{{ t('settings.changelog.sub') }}</p>
      </div>
    </div>

    <div class="cl-timeline">
      <div v-for="(entry, i) in entries" :key="i" class="cl-entry">
        <div class="cl-rail">
          <span class="cl-dot" :class="`cl-dot--${entry.tag.toLowerCase()}`"></span>
          <span v-if="i < entries.length - 1" class="cl-line"></span>
        </div>

        <div class="settings-card cl-card">
          <div class="cl-head">
            <span class="cl-tag" :class="`cl-tag--${entry.tag.toLowerCase()}`">{{ tagLabel(entry.tag) }}</span>
            <span v-if="entry.version" class="cl-version">v{{ entry.version }}</span>
            <span class="cl-date">{{ fmtDate(entry.date) }}</span>
          </div>
          <h2 class="cl-entry-title" dir="auto">{{ pick(entry).title }}</h2>
          <ul class="cl-points">
            <li v-for="(p, pi) in pick(entry).points" :key="pi" dir="auto">{{ p }}</li>
          </ul>
        </div>
      </div>

      <div v-if="!entries.length" class="cl-empty">{{ t('settings.changelog.empty') }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { changelog } from '@/data/changelog'

const { t, locale } = useI18n()

const entries = computed(() => changelog)

// Active language → the right half of each entry; fall back to English.
function pick(entry) {
  return (locale.value === 'ar' && entry.ar) ? entry.ar : entry.en
}

function tagLabel(tag) {
  return t(`settings.changelog.tag.${tag.toLowerCase()}`)
}

// Western numerals everywhere (localization rule), so format with en-GB regardless of locale.
function fmtDate(d) {
  try {
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch { return d }
}
</script>

<style scoped>
.cl-timeline { max-width: 760px; }
.cl-entry { display: flex; gap: 14px; }

.cl-rail { display: flex; flex-direction: column; align-items: center; padding-top: 6px; }
.cl-dot { width: 12px; height: 12px; border-radius: 50%; flex-shrink: 0; background: var(--accent); }
.cl-dot--new      { background: #15803d; }   /* dark green */
.cl-dot--fixed    { background: #dc2626; }   /* red */
.cl-dot--improved { background: #52525b; }   /* dark grey */
.cl-line { flex: 1; width: 2px; background: var(--border); margin: 6px 0; }

.cl-card { flex: 1; margin-bottom: 18px; }
.cl-head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.cl-tag {
  font-size: 11px; font-weight: 700; letter-spacing: .02em;
  padding: 2px 9px; border-radius: 999px; text-transform: uppercase;
}
/* Tag scheme: New = dark green · Fixed = red · Improved (edit) = dark grey */
.cl-tag--new      { background: rgba(21,128,61,.14);  color: #15803d; }
.cl-tag--fixed    { background: rgba(220,38,38,.14);  color: #dc2626; }
.cl-tag--improved { background: rgba(82,82,91,.14);   color: #52525b; }
.dark .cl-tag--new      { color: #22c55e; }   /* lift for dark-mode legibility */
.dark .cl-tag--fixed    { color: #f87171; }
.dark .cl-tag--improved { color: #a1a1aa; }
.cl-version {
  font-size: 11px; font-weight: 700; font-variant-numeric: tabular-nums;
  padding: 2px 8px; border-radius: 999px;
  background: var(--bg-subtle, rgba(120,120,120,.12)); color: var(--text-secondary);
}
.cl-date { font-size: 12px; color: var(--text-muted); }

.cl-entry-title { font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0 0 10px; }
.cl-points { margin: 0; padding-inline-start: 18px; display: flex; flex-direction: column; gap: 7px; }
.cl-points li { font-size: 13.5px; line-height: 1.55; color: var(--text-secondary); }

.cl-empty { color: var(--text-muted); padding: 30px 0; text-align: center; }
</style>
