export function showToast(message, type = 'success', duration = 2000) {
  const toast = document.createElement('div')
  toast.className = `app-toast app-toast-${type}`
  toast.textContent = message
  document.body.appendChild(toast)

  setTimeout(() => toast.classList.add('show'), 10)
  setTimeout(() => {
    toast.classList.remove('show')
    setTimeout(() => document.body.removeChild(toast), 200)
  }, duration)
}

export function showSuccessToast(message, duration = 2000) {
  showToast(message, 'success', duration)
}

export function showErrorToast(message, duration = 2500) {
  showToast(message, 'error', duration)
}
