// Persist the POS cart to localStorage so a reload never empties it.
//
// Why this exists: the cart was in-memory only, so ANY reload wiped a sale in
// progress — a PWA update reload, Chrome discarding the backgrounded tab when
// the cashier minimises, or an accidental refresh. This plugin hydrates the cart
// on load and saves it on every change, scoped per store so two stores can't mix.
import { useAuthStore } from './auth'

const PERSIST_KEYS = [
  'items', 'customerId', 'customerObj',
  'invDiscType', 'invDiscValue', 'additive', 'heldCarts',
]

export function cartPersist({ store }) {
  if (store.$id !== 'cart') return

  const auth = useAuthStore()
  // Key by the active store id (sudo-in-store uses activeStore; everyone else
  // their own store). 'anon' is a harmless fallback before login.
  const keyFor = () =>
    `vya_cart_${auth.activeStore?.id || auth.user?.store?.id || 'anon'}`

  // ── Hydrate on first use ──────────────────────────────────────
  try {
    const raw = localStorage.getItem(keyFor())
    if (raw) {
      const data = JSON.parse(raw)
      const patch = {}
      for (const k of PERSIST_KEYS) if (k in data) patch[k] = data[k]
      store.$patch(patch)
    }
  } catch { /* corrupt payload → start fresh */ }

  // ── Save on every mutation ────────────────────────────────────
  store.$subscribe((_mutation, state) => {
    try {
      const out = {}
      for (const k of PERSIST_KEYS) out[k] = state[k]
      localStorage.setItem(keyFor(), JSON.stringify(out))
    } catch { /* quota / serialization — non-fatal */ }
  })
}
