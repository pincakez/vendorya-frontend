import { ref, onMounted, onUnmounted } from 'vue'

export function useFormDirty() {
  const isDirty = ref(false)

  function setDirty(dirty = true) {
    isDirty.value = dirty
  }

  function handleBeforeUnload(e) {
    if (isDirty.value) {
      e.preventDefault()
      e.returnValue = ''
    }
  }

  onMounted(() => {
    window.addEventListener('beforeunload', handleBeforeUnload)
  })

  onUnmounted(() => {
    window.removeEventListener('beforeunload', handleBeforeUnload)
    isDirty.value = false
  })

  return {
    isDirty,
    setDirty
  }
}
