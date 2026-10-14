import { ref } from 'vue'

// Phone handling for the shared sidebar (store AND admin layouts).
// On a phone-width screen (≤ 768px) the sidebar leaves the page flow and becomes
// a slide-in drawer: hidden by default, opened by the header's menu button,
// closed by a backdrop tap, Escape, or any navigation. Desktop is untouched —
// there the normal collapse/expand (ui store / localStorage) still applies.
//
// Module-level singletons: AppSidebar and AppHeader share one state.
const PHONE_QUERY = '(max-width: 768px)'
const mq = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(PHONE_QUERY) : null

const isPhone    = ref(!!mq?.matches)
const mobileOpen = ref(false)

mq?.addEventListener?.('change', e => {
  isPhone.value = e.matches
  if (!e.matches) mobileOpen.value = false   // back to desktop → no stale drawer
})

export function usePhoneSidebar() {
  return {
    isPhone,
    mobileOpen,
    openMobile:   () => { mobileOpen.value = true },
    closeMobile:  () => { mobileOpen.value = false },
    toggleMobile: () => { mobileOpen.value = !mobileOpen.value },
  }
}
