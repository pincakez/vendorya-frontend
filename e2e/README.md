# Vendorya E2E (headless Playwright)

Real-browser checks against the **dev** app on the workshop box. Headless — they verify behaviour; they do **not** replace a
human visual sign-off (that lives in `MustTest.md`). ⛔ Never point them at prod. Updated 2026-10-14 (s167).

## Before you run
- Dev runs all the time as systemd `vendorya-dev-api` (Django :8001) + `vendorya-dev-web` (Vite :4456) — nothing to start.
  Every test drives `http://localhost:4456` (override with `BASE=`), **except** `offline-pos.test.mjs` (needs the built PWA, below).
- Playwright lives in `vendorya-frontend/node_modules`; tests launch the real `/usr/bin/google-chrome` (or `$CHROME_PATH`) with `--no-sandbox`.
- Exit code 0 = pass, 1 = fail. Screenshots land in `/tmp/vendorya-e2e/` (or `SHOTS=`).

## Dev test logins (all in the GATES shop, dev DB only)
| user | role | used by |
|---|---|---|
| `alexcashier` | CASHIER | default for most tests (`E2E_USER` / `E2E_TILL_USER` / `SHOP_USER`) |
| `s167admin` | ADMIN | role checks, receipts, statements (`E2E_USER=s167admin`) |
| `s167cashier` | CASHIER | a spare cashier — use it when another run is switching `alexcashier`'s role |
| `ehab` | OWNER | `mb-twin` (`E2E_AS`; logs in through the dev Django shell, no password read) |

Password for the first three = `E2E_CASHIER_PASSWORD` in the dev `vendorya-backend/.env` (read in code — never print it). Reset one:
`cd ../vendorya-backend && E2E=$(grep -m1 '^E2E_CASHIER_PASSWORD=' .env | cut -d= -f2-) venv/bin/python manage.py shell -c "import os; from users.models import User; u=User.objects.get(username='alexcashier'); u.set_password(os.environ['E2E']); u.save()"`

⚠️ `labels-from-products` and `nav-by-role` switch the test user's ROLE on the dev DB and switch it back in a `finally` — don't run two
of them at once on the same user (use `E2E_USER=s167cashier` for one).

## Tests
| file | since | what it proves | user env |
|---|---|---|---|
| `till-cashier.test.mjs` | s156 | cashier rings 3 lines + pays cash; the server invoice holds the WHOLE cart, paid in the same step; Ajel on Walk-in is refused | `E2E_TILL_USER` |
| `split-payment-window.test.mjs` | s167 | payment window: one-line fast path, cash + card split, change on cash, Ajel rest; desktop + phone (blocks checkout, voids its draft) | `E2E_TILL_USER` |
| `pos-phone.test.mjs` | s167 | till below 768px: cart full width, pay bar, keypad drawer; 1440px unchanged | `E2E_TILL_USER` |
| `offline-pos.test.mjs` | s155 | offline POS doesn't dead-end on the branch picker (needs the built PWA — below) | `alexcashier` |
| `labels-from-products.test.mjs` | s167 | stickers from the product list / product page / a purchase | `E2E_USER` |
| `nav-by-role.test.mjs` | s167 | each role opens every menu page with no 403; hidden pages redirect | `E2E_USER`, `ROLES` |
| `products-by-role.test.mjs` | s167 | Products + product page buttons per role; a cashier gets no cost | `E2E_USER` |
| `receipt-language.test.mjs` | s167 | the receipt prints in the shop's language (stubs the language, never changes the shop) | `E2E_USER`, `INVOICE_ID` |
| `mb-twin.test.mjs` | s166 | Memory Base autocomplete: a shop's own product hides its MB copy | `E2E_AS` |
| `sku-setup.test.mjs` | s160 | SKU Management + SKU2 (makes a throwaway "SKU Test" shop — delete it afterwards) | `SKU_SHOP` / `SKU_OWNER` |
| `screen-sweep.mjs` | s156 | not pass/fail: opens every screen (sudo admin area + a shop login) at 390 + 1440, logs console errors / failed API calls / overflow + screenshots | `SHOP_USER` / `SHOP_PASS` |

## The offline test (built PWA)
```bash
cd vendorya-frontend
npm run build                 # the service worker only registers on the build — rebuild after any src change
node e2e/serve-pwa.mjs &      # serves dist/ + proxies /api → :8001 at http://localhost:4173
node e2e/offline-pos.test.mjs
```

## Gotchas (hard-won)
- The offline step must be an **in-app SPA click**, never `page.goto()` — a full reload re-runs the auth bootstrap, which needs the
  network and bounces to `/login` offline (the access token is memory-only by design).
- ESM import: `import pw from '/home/ubuntu/vendorya-dev/vendorya-frontend/node_modules/playwright/index.js'; const { chromium } = pw`.
- Type into the till search key by key (a one-shot `fill()` doesn't fire its search handler).
- Expected noise: 400 (a deliberate Ajel refusal) and 401 (the first call after a `/pos` reload — the app refreshes the token and retries).
