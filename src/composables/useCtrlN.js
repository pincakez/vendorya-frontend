import { onMounted, onUnmounted } from 'vue'

export function useCtrlN(handler) {
  function onKeydown(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey && !e.altKey) {
      const tag = document.activeElement?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return
      e.preventDefault()
      handler()
    }
  }
  onMounted(()   => document.addEventListener('keydown', onKeydown))
  onUnmounted(() => document.removeEventListener('keydown', onKeydown))
}
