import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

// Slash-command flags for the search boxes (POS + Memory Base). Typing `/sameing`
// or `/sametrade` and pressing Enter latches a mode (shown as a chip); after that a
// plain query + Enter opens the alternatives modal. `/clear` (or the chip ✕) unlatches.
// The active-ingredient discovery itself is per-view (different scope) — this only
// owns the command vocabulary + latched mode so both boxes behave identically.
const FLAGS = { '/sameing': 'sameing', '/sametrade': 'sametrade' }

export function useSearchFlags() {
  const { t } = useI18n()
  const mode = ref('')   // '' | 'sameing' | 'sametrade'

  // Consume a raw search value. If it starts with a command, apply it and return
  // { command: true, query } with the command stripped; otherwise { command: false, query }.
  function parse(raw) {
    const s = (raw || '').trim()
    const lower = s.toLowerCase()
    if (lower === '/clear' || lower.startsWith('/clear ')) {
      mode.value = ''
      return { command: true, query: s.slice(6).trim() }
    }
    for (const [cmd, m] of Object.entries(FLAGS)) {
      if (lower === cmd || lower.startsWith(cmd + ' ')) {
        mode.value = m
        return { command: true, query: s.slice(cmd.length).trim() }
      }
    }
    return { command: false, query: s }
  }

  function chipLabel() {
    if (mode.value === 'sameing')   return t('inventory.alternatives.chip_ing')
    if (mode.value === 'sametrade') return t('inventory.alternatives.chip_trade')
    return ''
  }
  function clear() { mode.value = '' }

  return { mode, parse, chipLabel, clear }
}
