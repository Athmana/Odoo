# Brightloop Software — System Architecture & API Reference

## 1. Overview
Brightloop Software provides a centralized, high-performance platform automating the complete subscription lifecycle:
- **User & Role Management** (`ADMIN`, `STAFF`, `CUSTOMER`)
- **Product & Variant Catalog** (`SAAS`, `SERVICE`, `LICENSE`, `DIGITAL`)
- **Multi-Interval Billing Plans** (`DAILY`, `WEEKLY`, `MONTHLY`, `YEARLY`)
- **Subscription Lifecycle State Machine** (`DRAFT` → `QUOTATION` → `CONFIRMED` → `ACTIVE` → `PAUSED` → `CLOSED`)
- **Idempotent Recurring Billing Engine** (`billingPeriodKey` uniqueness guarantees zero duplicate invoices)
- **Automated Tax & Conditional Discount Calculation**
- **Payment Recording & Automatic Invoice Reconciliation**
- **Real-Time Revenue Analytics & CSV Ledger Exports**

---

## 2. REST API Endpoints

| Endpoint | Methods | Access Roles | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/register` | `POST` | Public | Customer self-registration with unique email & strong password validation |
| `/api/auth/login` | `POST` | Public | Authenticates user and sets HTTP-only JWT session cookie |
| `/api/auth/logout` | `POST` | Authenticated | Clears session cookie |
| `/api/auth/me` | `GET` | Authenticated | Returns active session profile and role |
| `/api/auth/reset-password` | `POST` | Public | 2-step password reset via registered email verification code |
| `/api/users` | `GET`, `POST`, `PATCH` | `ADMIN`, `STAFF` | Manage users; only `ADMIN` can create `STAFF` accounts |
| `/api/products` | `GET`, `POST`, `PATCH` | `ADMIN` (write) | Manage products, base prices, costs, and product variants |
| `/api/plans` | `GET`, `POST`, `PATCH` | `ADMIN` (write) | Manage `DAILY`, `WEEKLY`, `MONTHLY`, and `YEARLY` billing plans |
| `/api/taxes` | `GET`, `POST`, `PATCH` | `ADMIN` (write) | Configure regional tax rates and default automatic tax rules |
| `/api/discounts` | `GET`, `POST`, `PATCH` | `ADMIN` (write) | Configure fixed/percentage discounts with min spend, quantity, date & usage limits |
| `/api/subscriptions` | `GET`, `POST`, `PATCH` | `ADMIN`, `STAFF`, `CUSTOMER` | Create quotations/subscriptions and execute lifecycle transitions |
| `/api/invoices` | `GET`, `POST`, `PATCH` | `ADMIN`, `STAFF`, `CUSTOMER` | List invoices, confirm/send, and trigger automated billing runs |
| `/api/invoices/overdue` | `GET`, `POST` | `ADMIN`, `STAFF` | Overdue receivables aging analysis and batch reminder dispatch |
| `/api/payments` | `GET`, `POST` | `ADMIN`, `STAFF`, `CUSTOMER` | Record payments and automatically reconcile invoices to `PAID` |
| `/api/reports` | `GET` | `ADMIN`, `STAFF`, `CUSTOMER` | Real-time revenue, active subscriptions, outstanding & overdue metrics |
| `/api/reports/export` | `GET` | `ADMIN`, `STAFF`, `CUSTOMER` | Download CSV ledgers for subscriptions and invoices |
| `/api/seed-benchmark` | `POST` | `ADMIN` | High-volume benchmark generator verifying `< 2000ms` response SLA |
| `/api/health` | `GET` | Public | Database connectivity, entity counts, and query latency verification |
