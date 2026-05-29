<template>
  <div v-if="totalPages > 1" class="pagination">
    <button class="pg-btn" :disabled="page === 1" @click="$emit('update:page', page - 1)">
      <ChevronLeft :size="14" />
    </button>

    <template v-for="p in pagesToShow" :key="p">
      <span v-if="p === '…'" class="pg-dots">…</span>
      <button
        v-else
        class="pg-btn"
        :class="{ active: p === page }"
        @click="$emit('update:page', p)"
      >{{ p }}</button>
    </template>

    <button class="pg-btn" :disabled="page === totalPages" @click="$emit('update:page', page + 1)">
      <ChevronRight :size="14" />
    </button>

    <span class="pg-info">{{ from }}–{{ to }} of {{ total }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'

const props = defineProps({
  page: { type: Number, required: true },
  pageSize: { type: Number, default: 20 },
  total: { type: Number, default: 0 },
})

defineEmits(['update:page'])

const totalPages = computed(() => Math.ceil(props.total / props.pageSize) || 1)
const from = computed(() => Math.min((props.page - 1) * props.pageSize + 1, props.total))
const to   = computed(() => Math.min(props.page * props.pageSize, props.total))

const pagesToShow = computed(() => {
  const total = totalPages.value
  const cur = props.page
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages = []
  if (cur <= 4) {
    pages.push(1, 2, 3, 4, 5, '…', total)
  } else if (cur >= total - 3) {
    pages.push(1, '…', total - 4, total - 3, total - 2, total - 1, total)
  } else {
    pages.push(1, '…', cur - 1, cur, cur + 1, '…', total)
  }
  return pages
})
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 0 0;
}

.pg-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border-radius: 7px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 100ms, color 100ms, transform 70ms;
}

.pg-btn:hover:not(:disabled) {
  background: var(--border);
  color: var(--text-primary);
}

.pg-btn:active:not(:disabled) { transform: scale(0.93); }

.pg-btn.active {
  background: var(--accent);
  color: #fff;
  border-color: var(--accent);
  font-weight: 600;
}

.pg-btn:disabled {
  opacity: 0.35;
  cursor: default;
}

.pg-dots {
  padding: 0 4px;
  color: var(--text-muted);
  font-size: 13px;
  user-select: none;
}

.pg-info {
  margin-left: 8px;
  font-size: 12px;
  color: var(--text-muted);
  white-space: nowrap;
}
</style>
