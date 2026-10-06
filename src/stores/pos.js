import { defineStore } from 'pinia'

const BRANCH_KEY = 'vendorya_pos_branch'

// Restore the last-used POS branch from localStorage so an offline PWA reload
// (where /api/core/branches/ can't be reached) can reopen POS without the
// server. Shape: { id, name }.
function loadStoredBranch() {
  try {
    const raw = localStorage.getItem(BRANCH_KEY)
    if (!raw) return { id: null, name: '' }
    const b = JSON.parse(raw)
    return { id: b.id ?? null, name: b.name ?? '' }
  } catch {
    return { id: null, name: '' }
  }
}

export const usePosStore = defineStore('pos', {
  state: () => {
    const stored = loadStoredBranch()
    return {
      branchId: stored.id,
      branchName: stored.name,
      currentInvoiceId: null,
      paymentMethods: [],
      topSelling: [],
      favorites: [],
      animateScan: false,
      lastPostedInvoiceId: null,  // for reprint
      checkoutKey: { invoice: null, key: null },  // s157 A5: one Idempotency-Key per sale, kept across retries
    }
  },
  actions: {
    initSession(branch) {
      this.branchId = branch.id
      this.branchName = branch.name
      this.currentInvoiceId = null
      // Remember this branch on the device — this is what lets offline POS
      // skip the (network-only) branch picker on the next open.
      try {
        localStorage.setItem(BRANCH_KEY, JSON.stringify({ id: branch.id, name: branch.name }))
      } catch { /* storage full / disabled — non-fatal */ }
    },
    setCurrentInvoice(id) {
      this.currentInvoiceId = id
    },
    clearSession() {
      this.currentInvoiceId = null
    },
    triggerScan() {
      this.animateScan = true
      setTimeout(() => { this.animateScan = false }, 500)
    },
  },
})
