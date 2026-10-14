// In-memory access token (httpOnly migration #10 complete).
//
// The short-lived access token lives ONLY here — never in localStorage — so a
// page script (e.g. XSS) can't read it from storage, and it dies on tab close.
// The 60-day refresh token lives solely in the httpOnly cookie and is exchanged
// for a fresh access token on reload (see bootstrap in stores/auth.js).
let accessToken = null

export function getAccessToken() { return accessToken }
export function setAccessToken(token) { accessToken = token || null }

// Auth-boot gate. On a reload the access token is empty until the router's first
// navigation trades the refresh cookie for a new one (auth.bootstrap()). Anything
// that fires an API call earlier (App.vue's lockscreen watcher, layout composables)
// would go out without a token → 401 → refresh → retry, with a red console error.
// The axios request interceptor awaits this promise, so early callers simply wait
// for the boot to finish. bootstrap() opens it in its `finally`; the timer is only
// a safety net so a stuck boot can never freeze every request.
let openAuthGate
export const authReady = new Promise(resolve => { openAuthGate = resolve })
export function markAuthReady() { openAuthGate() }
setTimeout(markAuthReady, 15000)
