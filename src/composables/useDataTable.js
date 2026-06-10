import { ref, reactive, computed } from 'vue'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-vue-next'
import api from '@/api/axios'
import { useAuthStore } from '@/stores/auth'

/**
 * Shared DataTable logic: column sort / resize / drag-reorder / layout presets.
 *
 * @param {object} options
 * @param {Array}  options.columns        BASE_COLUMNS array
 * @param {object} options.defaultWidths  { key: px }
 * @param {string} options.tableId        smart-presets table_id
 * @param {string} options.adhocKey       localStorage key for ad-hoc layout
 * @param {Array}  [options.locked]       column keys that cannot be hidden/reordered
 * @param {Array}  [options.defaultHidden] initially hidden column keys
 * @param {number} [options.actionColPx]  extra px added to tableMin for the actions column (default 90)
 */
export function useDataTable({
  columns,
  defaultWidths,
  tableId,
  adhocKey,
  locked = [],
  defaultHidden = [],
  actionColPx = 90,
}) {
  const auth = useAuthStore()

  /* ── column widths ── */
  const colWidths = reactive({ ...defaultWidths })

  /* ── order / hidden ── */
  const colOrder  = ref(columns.map(c => c.key))
  const colHidden = ref([...defaultHidden])

  /* ── edit mode ── */
  const editing = ref(false)
  const working = reactive({ order: [], hidden: [] })

  /* ── derived ── */
  const colByKey = computed(() => Object.fromEntries(columns.map(c => [c.key, c])))
  const activeOrder  = computed(() => editing.value ? working.order  : colOrder.value)
  const activeHidden = computed(() => editing.value ? working.hidden : colHidden.value)
  const displayColumns = computed(() =>
    activeOrder.value.filter(k => !activeHidden.value.includes(k)).map(k => colByKey.value[k]).filter(Boolean)
  )
  const tableMin = computed(() => displayColumns.value.reduce((a, c) => a + (colWidths[c.key] || 100), 0) + actionColPx)
  const canEdit  = computed(() => ['OWNER', 'ADMIN'].includes(auth.userRole) || auth.isSuperadmin)

  /* ── layout persistence ── */
  const baseConfig = ref(null)
  const hasAdhoc   = ref(!!localStorage.getItem(adhocKey))
  const sortKey    = ref(null)
  const sortDir    = ref('asc')
  const pageSize   = ref(20)

  let _fetchFn = null

  function applyLayout(cfg) {
    if (!cfg) return
    const known = columns.map(c => c.key)
    if (Array.isArray(cfg.order) && cfg.order.length) {
      const ordered = cfg.order.filter(k => known.includes(k))
      for (const k of known) if (!ordered.includes(k)) ordered.push(k)
      colOrder.value = ordered
    }
    colHidden.value = (cfg.hidden || []).filter(k => !locked.includes(k))
    if (cfg.widths) Object.assign(colWidths, cfg.widths)
    if (cfg.sort?.key) { sortKey.value = cfg.sort.key; sortDir.value = cfg.sort.dir || 'asc' }
    if (cfg.page_size) pageSize.value = cfg.page_size
  }

  function currentConfig() {
    return {
      order: colOrder.value,
      hidden: colHidden.value,
      widths: { ...colWidths },
      sort: sortKey.value ? { key: sortKey.value, dir: sortDir.value } : null,
      page_size: pageSize.value,
    }
  }

  function saveAdhoc() {
    if (!editing.value) { localStorage.setItem(adhocKey, JSON.stringify(currentConfig())); hasAdhoc.value = true }
  }

  async function loadLayout(fetchFn) {
    _fetchFn = fetchFn
    const adhoc = JSON.parse(localStorage.getItem(adhocKey) || 'null')
    try {
      const { data } = await api.get('/api/smart/presets/effective/', { params: { table_id: tableId } })
      baseConfig.value = data?.config ? data.config : null
    } catch { baseConfig.value = null }
    applyLayout(adhoc || baseConfig.value)
    fetchFn(1)
  }

  function resetLayout() {
    localStorage.removeItem(adhocKey); hasAdhoc.value = false
    colOrder.value = columns.map(c => c.key)
    colHidden.value = [...defaultHidden]
    Object.assign(colWidths, defaultWidths)
    sortKey.value = null; sortDir.value = 'asc'
    applyLayout(baseConfig.value)
    _fetchFn?.(1)
  }

  /* ── edit mode ── */
  function enterEdit()   { working.order = [...colOrder.value]; working.hidden = [...colHidden.value]; editing.value = true; fetchPresets() }
  function cancelEdit()  { editing.value = false }
  function doneEdit()    { colOrder.value = [...working.order]; colHidden.value = [...working.hidden]; editing.value = false; saveAdhoc() }
  function resetWorking(){ working.order = columns.map(c => c.key); working.hidden = [...defaultHidden] }
  function toggleHidden(key) {
    if (locked.includes(key)) return
    const i = working.hidden.indexOf(key)
    if (i >= 0) working.hidden.splice(i, 1); else working.hidden.push(key)
  }

  /* ── row drag in chooser panel ── */
  const dragKey  = ref(null)
  const dragOver = ref(null)
  function startDrag(key) {
    dragKey.value = key; dragOver.value = key
    document.addEventListener('pointerup', _endDrag, { once: true })
  }
  function _endDrag() {
    if (dragKey.value && dragOver.value && dragKey.value !== dragOver.value) _reorderWorking(dragKey.value, dragOver.value)
    dragKey.value = null; dragOver.value = null
  }
  function _reorderWorking(fromKey, toKey) {
    const arr = [...working.order]
    arr.splice(arr.indexOf(fromKey), 1); arr.splice(arr.indexOf(toKey), 0, fromKey)
    working.order = arr
  }

  /* ── presets ── */
  const presets     = ref([])
  const saveModal   = reactive({ open: false, name: '', is_default: false })
  const assignModal = reactive({ open: false, rows: [] })

  async function fetchPresets() {
    try { const { data } = await api.get('/api/smart/presets/', { params: { table_id: tableId } }); presets.value = data.results ?? data }
    catch { /* noop */ }
  }

  function loadPreset(p) {
    const known = columns.map(c => c.key)
    const ordered = (p.config.order || known).filter(k => known.includes(k))
    for (const k of known) if (!ordered.includes(k)) ordered.push(k)
    working.order = ordered
    working.hidden = (p.config.hidden || []).filter(k => !locked.includes(k))
    if (p.config.widths) Object.assign(colWidths, p.config.widths)
  }

  async function savePreset() {
    if (!saveModal.name.trim()) return
    await api.post('/api/smart/presets/', {
      table_id: tableId, name: saveModal.name.trim(), config: currentConfig(), is_default: saveModal.is_default,
    })
    saveModal.open = false; saveModal.name = ''; saveModal.is_default = false
    await fetchPresets(); doneEdit()
  }

  async function openAssign() {
    if (!presets.value.length) await fetchPresets()
    const { data } = await api.get('/api/smart/presets/assignments/', { params: { table_id: tableId } })
    assignModal.rows = data; assignModal.open = true
  }

  async function assignTo(row) {
    await api.post('/api/smart/presets/assignments/', { user_id: row.user_id, table_id: tableId, preset_id: row.preset_id || null })
  }

  /* ── column header drag-to-reorder ── */
  const colDragKey   = ref(null)
  const colDragOver  = ref(null)
  const colDragMoved = ref(false)
  const colGhostX    = ref(0)
  const colGhostY    = ref(0)
  let colDragStartX  = 0
  let suppressNextSort = false

  function startColDrag(key, e) {
    const rect = e.currentTarget.getBoundingClientRect()
    if (e.clientX > rect.right - 10) return
    colDragKey.value = key; colDragOver.value = key; colDragMoved.value = false; colDragStartX = e.clientX
    document.addEventListener('pointermove', _onColDragMove)
    document.addEventListener('pointerup', _onColDragEnd, { once: true })
  }

  function _onColDragMove(e) {
    if (!colDragKey.value) return
    colGhostX.value = e.clientX + 14; colGhostY.value = e.clientY - 18
    if (!colDragMoved.value && Math.abs(e.clientX - colDragStartX) > 5) colDragMoved.value = true
  }

  function _onColDragEnd() {
    document.removeEventListener('pointermove', _onColDragMove)
    if (colDragMoved.value && colDragKey.value && colDragOver.value && colDragKey.value !== colDragOver.value) {
      const arr = [...colOrder.value]
      arr.splice(arr.indexOf(colDragKey.value), 1); arr.splice(arr.indexOf(colDragOver.value), 0, colDragKey.value)
      colOrder.value = arr; saveAdhoc(); suppressNextSort = true; setTimeout(() => { suppressNextSort = false }, 50)
    }
    colDragKey.value = null; colDragOver.value = null; colDragMoved.value = false
  }

  /* ── sort ── */
  function handleSort(col) {
    if (suppressNextSort) return
    if (sortKey.value === col.key) {
      if (sortDir.value === 'asc') sortDir.value = 'desc'
      else { sortKey.value = null; sortDir.value = 'asc' }
    } else { sortKey.value = col.key; sortDir.value = 'asc' }
    _fetchFn?.(1); saveAdhoc()
  }

  function arrowFor(col) {
    if (sortKey.value !== col.key) return ArrowUpDown
    return sortDir.value === 'asc' ? ArrowUp : ArrowDown
  }

  /* ── resize ── */
  let rz = null
  function startResize(key, e) {
    rz = { key, x: e.clientX, w: colWidths[key] }
    document.addEventListener('mousemove', _onResize)
    document.addEventListener('mouseup', _endResize)
  }
  function _onResize(e) { if (!rz) return; colWidths[rz.key] = Math.max(60, rz.w + (e.clientX - rz.x)) }
  function _endResize() {
    rz = null
    document.removeEventListener('mousemove', _onResize)
    document.removeEventListener('mouseup', _endResize)
    saveAdhoc()
  }

  return {
    /* state */
    colWidths, colByKey, colOrder, colHidden,
    editing, working,
    displayColumns, tableMin, canEdit, hasAdhoc,
    sortKey, sortDir, pageSize,
    dragKey, dragOver,
    colDragKey, colDragOver, colDragMoved, colGhostX, colGhostY,
    presets, saveModal, assignModal,
    /* methods */
    loadLayout, saveAdhoc, resetLayout, applyLayout, currentConfig,
    enterEdit, cancelEdit, doneEdit, resetWorking, toggleHidden, startDrag,
    handleSort, arrowFor,
    startResize,
    startColDrag,
    fetchPresets, loadPreset, savePreset, openAssign, assignTo,
  }
}
