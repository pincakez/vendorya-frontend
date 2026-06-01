<script setup>
/**
 * Money — renders a monetary amount with the store's currency symbol tinted
 * a user-chosen colour (Settings › Localization → defaults to light green).
 *
 *   <Money :value="inv.grand_total" />   →   1,200 EGP  (symbol in --currency-color)
 *
 * Honours the store's currency POSITION: SUFFIX → "1200 EGP" (with a space),
 * PREFIX → "$ 1200". The gap is a CSS margin, never sticky to the number.
 * The number itself uses the store's decimals + separator via formatNumber.
 */
import { computed } from 'vue'
import { formatNumber } from '@/utils/format'
import { useFormatStore } from '@/stores/format'

const props = defineProps({
  value: { type: [Number, String], default: 0 },
  // Optional overrides (decimals/separator/symbol/position) for static contexts.
  opts: { type: Object, default: null },
})

let fmt = null
try { fmt = useFormatStore() } catch { /* outside Pinia — fall back to opts */ }

const number   = computed(() => formatNumber(props.value, props.opts))
const symbol   = computed(() => props.opts?.symbol   ?? fmt?.symbol   ?? '')
const position = computed(() => props.opts?.position ?? fmt?.position ?? 'SUFFIX')
const isPrefix = computed(() => position.value === 'PREFIX')
</script>

<template><span class="money"><span v-if="symbol && isPrefix" class="money-sym prefix">{{ symbol }}</span><span class="money-num">{{ number }}</span><span v-if="symbol && !isPrefix" class="money-sym suffix">{{ symbol }}</span></span></template>

<style scoped>
.money { white-space: nowrap; font-variant-numeric: tabular-nums; }
.money-sym { color: var(--currency-color, var(--accent)); font-weight: 600; }
.money-sym.suffix { margin-left: 0.32em; }
.money-sym.prefix { margin-right: 0.32em; }
</style>
