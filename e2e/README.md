# Vendorya E2E (headless Playwright)

Real-browser tests that drive the **built** PWA (`dist/`) with a live service
worker, proxying `/api` to the dev Django backend. Headless — this verifies
behavior; it does **not** replace a human visual sign-off.

## Prerequisites (one-time, already done on the OVH dev box)
- Playwright + Chromium installed under `vendorya-frontend/node_modules`.
- A store cashier login exists. Tests use `alexcashier` / `TestPass1234`
  (CASHIER @ GATES). Reset the password if needed:
  ```
  cd ../vendorya-backend
  venv/bin/python manage.py shell -c "from django.contrib.auth import get_user_model as g; u=g().objects.get(username='alexcashier'); u.set_password('TestPass1234'); u.save()"
  ```

## Run
```bash
cd vendorya-frontend

# 1. Dev backend on :8001
../vendorya-backend/venv/bin/python ../vendorya-backend/manage.py runserver 8001 --noreload &

# 2. Build the PWA (must rebuild after any src change — SW serves dist/)
npm run build

# 3. Serve built dist + proxy /api → :8001  (http://localhost:4173)
node e2e/serve-pwa.mjs &

# 4. Run a test
PLAYWRIGHT_HOST_PLATFORM_OVERRIDE=ubuntu24.04-x64 node e2e/offline-pos.test.mjs
```
Exit code 0 = pass, 1 = fail. A screenshot lands in the scratchpad.

## Tests
- **offline-pos.test.mjs** — offline POS branch bug. Logs in online, opens POS
  (branch auto-selects + persists), exits, goes offline, then switches back to
  POS via the sidebar (real in-app nav, no reload) and asserts NO dead-end
  "Select Branch" modal appears and the branch chip stays. Verified to FAIL on
  the pre-fix code, so it's a real regression guard.

## Gotchas (hard-won)
- Serve the **built** `dist/`, not `vite dev` — the service worker only
  registers on the build, and `server.proxy` doesn't apply to a static serve.
- The offline step must be an **in-app SPA click**, never `page.goto()`. A full
  reload re-runs the auth bootstrap, which needs the network and bounces to
  `/login` offline (access token is memory-only by design).
- `require('./node_modules/playwright')` is CommonJS — in ESM use
  `import pw from '...'; const { chromium } = pw`.
- Always pass `--no-sandbox` and the `PLAYWRIGHT_HOST_PLATFORM_OVERRIDE` env.
