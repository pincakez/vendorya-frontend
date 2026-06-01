// In-memory access token (httpOnly migration #10 complete).
//
// The short-lived access token lives ONLY here — never in localStorage — so a
// page script (e.g. XSS) can't read it from storage, and it dies on tab close.
// The 60-day refresh token lives solely in the httpOnly cookie and is exchanged
// for a fresh access token on reload (see bootstrap in stores/auth.js).
let accessToken = null

export function getAccessToken() { return accessToken }
export function setAccessToken(token) { accessToken = token || null }
