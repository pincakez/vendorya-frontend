# Vendorya

A multi-tenant fashion retail ERP — built for small and mid-size stores. Covers inventory, sales, purchasing, finance, people management, and store settings. POS is the final phase.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Django 6 + Django REST Framework + PostgreSQL |
| Auth | JWT (SimpleJWT) — access 1d, refresh 7d, rotate on refresh |
| Frontend | Vue 3 (Composition API) + Vite + Tailwind v4 + Pinia + Vue Router 4 |
| Icons | Lucide Vue Next |
| HTTP | Axios (auto token refresh interceptor) |

---

## Project Structure

```
vendorya/
├── vendorya-backend/        Django project
│   ├── core/                Store, Branch, Address, ActivityLog, StoreSettings
│   ├── users/               User (staff), Customer — JWT auth
│   ├── inventory/           Product, Variant, StockLevel, Category, Supplier, Tax, Attributes
│   ├── finance/             SalesInvoice, PurchaseInvoice, Payment, Expense, WorkShift, RefundInvoice
│   ├── smart_analysis/      TablePreference (Phase 10+)
│   └── vendorya_project/    Django settings + root URLs
│
├── vendorya-frontend/       Vue 3 app
│   └── src/
│       ├── views/
│       │   ├── inventory/   Products, Purchases, Categories, Attributes (stubs)
│       │   ├── finance/     SalesInvoices, Returns, Expenses, Shifts, CashDrawer
│       │   ├── people/      Customers, Suppliers, Staff
│       │   └── settings/    StoreSettings, Taxes, Profile, Policies (stub)
│       ├── components/      AppModal, AppPagination, QAB, Sidebar, Header
│       ├── layouts/         DefaultLayout, POSLayout
│       ├── stores/          auth, qab, theme (Pinia)
│       └── api/             Axios instance with JWT interceptor
│
└── backups/                 PostgreSQL snapshots (max 10, auto-committed)
```

---

## Key Design Decisions

- **Multi-tenant**: shared DB, every model has a `store` FK, enforced in every ViewSet
- **Soft deletes**: `.delete()` sets `is_deleted=True` — nothing is ever hard-deleted
- **UUID PKs** on all major models
- **Sequential invoice numbers** per store (1001, 1002…) with `select_for_update` to prevent race conditions
- **SKU format**: supplier code prefix (2 digits) + incremental (e.g. `13001`)
- **Stock movement rules**: stock only moves via PurchaseInvoice (in), SalesInvoice (out), StockAdjustment (correction)
- **Dynamic attributes**: products support per-store attributes (season, gender, size, etc.) via `AttributeDefinition`

---

## Local Development (WSL)

### Prerequisites
- Python 3.12, Node 18+, PostgreSQL 14+

### Backend
```bash
# Start PostgreSQL
sudo service postgresql start

# Run migrations
/path/to/venv/bin/python vendorya-backend/manage.py migrate

# Start dev server (port 8000)
/path/to/venv/bin/python vendorya-backend/manage.py runserver
```

### Frontend
```bash
cd vendorya-frontend
npm install
npm run dev        # port 5173
```

---

## API Overview

### Auth
```
POST   /api/auth/token/           Login → access + refresh + full user object
POST   /api/auth/token/refresh/   Refresh access token
GET    /api/auth/me/              Current user profile
PATCH  /api/auth/me/              Update own profile / password
```

### Core
```
GET/PATCH  /api/core/store/        Store info (name, currency, language)
GET/PATCH  /api/core/settings/     StoreSettings (receipts, tax rules, agel selling)
CRUD       /api/core/branches/     Branches (with inline address)
GET        /api/core/logs/         Activity log (read-only, paginated)
```

### Inventory
```
CRUD  /api/inventory/products/     Products (search, dynamic attr filters)
CRUD  /api/inventory/variants/     Product variants
CRUD  /api/inventory/categories/   Categories
CRUD  /api/inventory/suppliers/    Suppliers (with outstanding balance annotation)
CRUD  /api/inventory/attributes/   Attribute definitions
CRUD  /api/inventory/taxes/        Tax rates
```

### Finance
```
CRUD       /api/finance/invoices/              Sales invoices (nested items)
POST       /api/finance/invoices/{id}/void/    Void invoice
CRUD       /api/finance/payments/              Payments
CRUD       /api/finance/payment-methods/       Payment methods
CRUD       /api/finance/purchases/             Purchase invoices (nested items)
POST       /api/finance/purchases/{id}/receive/ Receive stock (DRAFT → RECEIVED)
CRUD       /api/finance/expenses/              Expenses
CRUD       /api/finance/expense-categories/    Expense categories
GET/POST   /api/finance/shifts/                Work shifts (open shift)
POST       /api/finance/shifts/{id}/close/     Close shift
CRUD       /api/finance/refunds/               Refund invoices (auto-restock)
```

### People
```
CRUD  /api/auth/customers/    Customers (search, balance)
CRUD  /api/auth/staff/        Staff (search, roles, deactivate)
```

---

## Build Status

| Phase | Description | Status |
|---|---|---|
| 1 | FE Shell — Layout, Sidebar, Login, Theme | ✅ Done |
| 2 | Inventory Module — Products, Categories, Suppliers | ✅ Done |
| 3 | Finance API — all 8 ViewSets | ✅ Done |
| 4 | Finance Pages — Sales, Purchases, Expenses, Shifts, Returns, Cash Drawer | ✅ Done |
| 5 | People API — Customers, Staff, Supplier balance | ✅ Done |
| 6 | People Pages — Customers, Suppliers, Staff | ✅ Done |
| 7 | Core API — Store, Branches, StoreSettings, Taxes, ActivityLog | ✅ Done |
| 8 | Settings Pages — StoreSettings, Taxes, Profile | ✅ Done |
| 9 | Dashboard — API summary endpoint + KPI page | 🔄 Next |
| 10 | POS — Point of Sale (last) | ⏳ Pending |
| 11 | Pre-production hardening | ⏳ Pending |

---

## Security Notes (Dev Only)

All credentials below are temporary WSL dev defaults — **change before any public deployment**.

| Service | User | Password |
|---|---|---|
| Ubuntu | ubuntu | Mashakel1 |
| PostgreSQL | mysqladmin | Mashakel1 |
| Django superuser | sudo | Mashakel1 |
