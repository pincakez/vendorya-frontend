<template>
  <div class="dt-card" :class="cardClass">
    <!-- Skeleton -->
    <div v-if="loading" class="table-skeleton">
      <div v-for="i in skeletonRows" :key="i" class="skeleton-row" />
    </div>
    <!-- Table -->
    <div v-else class="dt-xscroll">
      <table class="dt" :style="minWidth ? `min-width:${minWidth}px` : undefined">
        <thead>
          <tr><slot name="head" /></tr>
        </thead>
        <tbody>
          <tr v-if="empty">
            <td :colspan="cols" class="dt-empty">
              <slot name="empty">
                <slot name="empty-icon" />
                <div>{{ emptyText }}</div>
              </slot>
            </td>
          </tr>
          <slot />
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
defineProps({
  loading:      { type: Boolean, default: false },
  empty:        { type: Boolean, default: false },
  emptyText:    { type: String,  default: 'No items yet' },
  cols:         { type: Number,  required: true },
  skeletonRows: { type: Number,  default: 5 },
  minWidth:     { type: Number,  default: null },
  cardClass:    { type: String,  default: '' },
})
</script>
