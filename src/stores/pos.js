import { defineStore } from 'pinia'

export const usePosStore = defineStore('pos', {
  state: () => ({
    branchId: null,
    branchName: '',
    currentInvoiceId: null,
    paymentMethods: [],
    topSelling: [],
    favorites: [],
    animateScan: false,
    lastPostedInvoiceId: null,  // for reprint
  }),
  actions: {
    initSession(branch) {
      this.branchId = branch.id
      this.branchName = branch.name
      this.currentInvoiceId = null
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
