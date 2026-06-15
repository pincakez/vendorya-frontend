<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const PALETTE = ['#f78f1e', '#3772ff', '#ba2d0b', '#0e4749', '#2b193d']
const DAYS    = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const WEEKS = [
  { label: 'May 12 – 18',   data: [4200, 3800, 5100, 4600, 6200, 7800, 5400] },
  { label: 'May 19 – 25',   data: [5500, 4900, 5800, 6300, 5100, 8200, 6100] },
  { label: 'May 26 – Jun 1',data: [3900, 5200, 4700, 5900, 7100, 6800, 4300] },
  { label: 'Jun 2 – 8',     data: [6100, 5400, 6800, 5200, 7400, 9100, 6700] },
  { label: 'Jun 9 – 15',    data: [4800, 6200, 5500, 7100, 6300, 8500, 7200] },
  { label: 'Jun 16 – 22',   data: [5200, 4600, 6400, 5800, 8100, 7600, 5900] },
]

const idx   = ref(0)
const color = ref(PALETTE[0])

const weekTotal = computed(() =>
  WEEKS[idx.value].data.reduce((a, b) => a + b, 0)
)

const chartOptions = ref(buildOptions(PALETTE[0]))
const series       = ref([{ name: 'Sales', data: WEEKS[0].data }])

function buildOptions(c) {
  return {
    chart: {
      type: 'area',
      toolbar: { show: false },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 750,
        dynamicAnimation: { enabled: true, speed: 750 },
      },
      background: 'transparent',
    },
    stroke:      { curve: 'smooth', width: 2.5 },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.30, opacityTo: 0.02, stops: [0, 95] },
    },
    colors:      [c],
    xaxis: {
      categories: DAYS,
      labels: { style: { fontSize: '9px', colors: Array(7).fill('#9ca3af') } },
      axisBorder: { show: false },
      axisTicks:  { show: false },
    },
    yaxis:       { show: false },
    grid: {
      borderColor: 'rgba(150,150,150,0.10)',
      strokeDashArray: 4,
      padding: { left: -8, right: 2, top: -10, bottom: 0 },
    },
    tooltip:     { theme: 'dark', y: { formatter: v => `$${v.toLocaleString()}` } },
    dataLabels:  { enabled: false },
    markers:     { size: 0 },
  }
}

let timer = null

function advance() {
  const next = (idx.value + 1) % WEEKS.length
  idx.value    = next
  color.value  = PALETTE[next % PALETTE.length]
  series.value = [{ name: 'Sales', data: [...WEEKS[next].data] }]
  chartOptions.value = buildOptions(PALETTE[next % PALETTE.length])
}

onMounted(()  => { timer = setInterval(advance, 6000) })
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div class="dw-head">
    <div class="dw-labels">
      <span class="dw-tag">Weekly Revenue</span>
      <Transition name="wf">
        <span :key="idx" class="dw-week">{{ WEEKS[idx].label }}</span>
      </Transition>
    </div>
    <Transition name="wf">
      <span :key="idx" class="dw-total" :style="{ color }">
        ${{ weekTotal.toLocaleString() }}
      </span>
    </Transition>
  </div>

  <div class="dw-chart">
    <apexchart type="area" height="118" :options="chartOptions" :series="series" />
  </div>
</template>

<style scoped>
.dw-head   { display: flex; align-items: flex-start; justify-content: space-between; flex-shrink: 0; margin-bottom: 4px; }
.dw-labels { display: flex; flex-direction: column; gap: 2px; }
.dw-tag    { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em; color: var(--text-muted); }
.dw-week   { font-size: 11px; color: var(--text-muted); font-weight: 500; }
.dw-total  { font-size: 22px; font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; transition: color 600ms ease; }
.dw-chart  { flex: 1; min-height: 0; margin: 0 -14px -14px; }

.wf-enter-active { transition: opacity .35s ease, transform .3s ease; }
.wf-leave-active { transition: opacity .25s ease; position: absolute; }
.wf-enter-from   { opacity: 0; transform: translateY(5px); }
.wf-leave-to     { opacity: 0; }
</style>
