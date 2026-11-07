<div align="center">

# SwiftCart

### A modern full-stack e-commerce storefront

**React · Express · MongoDB · JWT · Transaction-safe orders**

[![Quality checks](https://github.com/Syed-Nazeer-07/SwiftCart/actions/workflows/quality.yml/badge.svg)](https://github.com/Syed-Nazeer-07/SwiftCart/actions/workflows/quality.yml)
[![GitHub source](https://img.shields.io/badge/Source-GitHub-181717?logo=github)](https://github.com/Syed-Nazeer-07/SwiftCart)

*An e-commerce engineering project focused on a clean shopping experience and correct server-side commerce logic.*

</div>

---

## Overview

SwiftCart is a full-stack online shopping demonstration with a responsive product catalog, JWT customer accounts, a persistent MongoDB shopping cart, checkout, order history, and an administrator dashboard.

The important architecture rule is simple: **the browser cannot decide what an order costs**. The Express API reads the authenticated customer's cart and the actual product prices from MongoDB, then creates the order and reserves stock inside a transaction.

> **Project status:** Engineering portfolio / demo application. Orders do **not** charge a card, process payments, book real shipments, or initiate refunds. Do not operate it as a live shop until payments, operational policies, abuse protection and deployment security have been implemented and reviewed.

## Features

| Area | Current capabilities |
|---|---|
| Shopping | Responsive catalog, product detail pages, search and filtering |
| Accounts | Registration and login with hashed passwords and JWT authorization |
| Cart | Account-specific MongoDB cart, quantity validation, inventory checks |
| Checkout | Server-priced order totals, 10% **demo** tax, validated shipping information |
| Inventory | Atomic conditional stock decrements and transactional order placement |
| Fulfillment | Admin status transitions, cancellation and inventory restoration for unshipped orders |
| History | Order records preserve product names, prices and images from the time of purchase |
| Administration | Manage products, orders and registered users (password hashes never returned) |
| Verification | Native Node regression tests and GitHub Actions frontend/backend checks |

## Architecture

```text
             React + Vite storefront
             Authentication / cart UI
                       |
                   REST / JWT
                       |
               Express API (Node.js)
                       |
                 MongoDB Atlas
             /          |          \
        Products       Cart        Orders
             \          |          /
                  Transaction
       reserve stock + create order + clear cart
```

**Checkout uses MongoDB transactions and requires a replica set** (such as MongoDB Atlas). A standalone MongoDB server without replica-set transactions is not supported for order placement.

## Stack

| Layer | Technology |
|---|---|
| Client | React 18, Vite, Tailwind CSS, React Router |
| Interface | Framer Motion, Lucide icons |
| API | Node.js, Express |
| Database | MongoDB / Mongoose |
| Authentication | bcryptjs, JWT |
| Tests and CI | Node.js built-in test runner, GitHub Actions |

## Getting started

**Requirements:** Node.js 22+, npm, and a MongoDB Atlas database or local replica set.

### 1. Clone

```bash
git clone https://github.com/Syed-Nazeer-07/SwiftCart.git
cd SwiftCart
```

### 2. Configure and start backend

```bash
cd backend
npm ci
cp .env.example .env
```

Edit `backend/.env`:

```env
PORT=5000
MONGO_URI=mongodb+srv://YOUR_CONNECTION_STRING
JWT_SECRET=GENERATE_A_LONG_RANDOM_SECRET
FRONTEND_ORIGINS=http://localhost:5173
```

`JWT_SECRET` should be a unique, randomly generated secret of at least 32 bytes. Keep `.env` out of Git.

```bash
npm run seed
npm run dev
```

The API listens on `http://localhost:5000`. A health endpoint is available at `GET /api/health`.

### 3. Start frontend

In another terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open the Vite URL, normally `http://localhost:5173`. Optionally set `VITE_API_URL` in `frontend/.env.local` if your API uses a different host:

```env
VITE_API_URL=http://localhost:5000/api
```

## Order handling

1. The user edits an authenticated cart. The backend validates products and quantities against stock.
2. At checkout, the client sends **only the shipping address**.
3. Inside a MongoDB transaction, the server reads the cart and live catalog, verifies the stock, calculates subtotal and tax using integer cents, decrements inventory using conditional updates, creates the order, and clears the cart.
4. If any step fails, the transaction is aborted so orders are not created without their stock reservation.
5. If the administrator cancels an unshipped transaction-backed order, the inventory is restored in the same transaction. Orders marked shipped or delivered cannot be cancelled through this workflow.

**Demo commerce assumptions:** Currency displayed is USD; shipping is shown as free; tax uses a flat 10% illustrative rate. These are not jurisdiction-specific tax, delivery or payment rules. Existing orders from before the inventory-reservation implementation do not have reservations, and their cancellation does not inflate stock.

## Testing

```bash
cd backend
npm ci
npm test
```

The regression suite covers shipping and cart validation, price calculations, tampered browser totals, out-of-stock checkout, stock restoration, status rules, and literal product-search handling. Controller tests use mocks; they are **not** a substitute for testing transactions against a real MongoDB replica set.

```bash
cd frontend
npm ci
npm run build
```

GitHub Actions runs backend syntax checks, regression tests and the frontend production build on pushes to `main` and on pull requests.

## Security notes

- API requests require JWT authentication for account-specific carts and orders.
- Admin actions require a server-verified admin role; public registration cannot assign admin roles.
- Admin user listings expose only profile fields, **never password hashes**.
- Price totals and inventory checks are controlled by the backend, not by request-body fields.
- The CORS allowlist can be configured with comma-separated `FRONTEND_ORIGINS`; CORS by itself is not an access-control system.
- Before allowing public use: add request rate limiting, robust input validation across all endpoints, payment-provider integration with verified webhooks, operational logging/monitoring, and a real DB-backed integration test environment.

## Project structure

```text
backend/
  controllers/      # Auth, product, cart and order endpoints
  lib/orderRules.js # Pure pricing, validation and status logic
  middleware/       # JWT authentication and admin authorization
  models/           # Mongoose models
  routes/           # REST routes
  tests/            # Regression tests

frontend/
  src/components/   # Reusable storefront components
  src/context/      # Account and cart state
  src/pages/        # Shopping, checkout, orders and admin screens

.github/workflows/quality.yml
```

## Roadmap

- [ ] Real payments via a payment provider and verified webhooks
- [ ] Integration tests against a MongoDB replica set
- [ ] Production-ready rate limiting, audit logs and error monitoring
- [ ] Pagination, accessible loading/error states and realistic product reviews
- [ ] Inventory reservation expiration and more complete returns/refunds handling
- [ ] Production deployment, uptime monitoring and validated backups

---

Built as a full-stack software engineering portfolio project by **Syed Nazeer**.
