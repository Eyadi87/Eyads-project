# Allo Health (Inventory Reservation System)

A Next.js 16 App Router application that solves the checkout race-condition problem for multi-warehouse retail. When a customer proceeds to checkout, units are atomically reserved for 10 minutes. Payment confirmation permanently decrements stock; cancellation or expiry returns units to available inventory.

---

## Live Demo

> **https://allo-health-by-eyad22mis0287.vercel.app/**

---

## Local Setup

### Prerequisites

- Node.js 18+
- A PostgreSQL database (Supabase, Neon, or Railway)

### 1. Clone and install

```bash
git clone <repo-url>
cd allo-health
npm install
```

### 2. Environment variables

Create a `.env` file:

```env
DATABASE_URL="postgresql://user:pass@host:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://user:pass@host:5432/postgres"
RESERVATION_TTL_MINUTES=10
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Pooled Postgres URL (runtime queries) |
| `DIRECT_URL` | Direct Postgres URL (migrations only) |
| `RESERVATION_TTL_MINUTES` | Hold duration in minutes (default: 10) |

### 3. Run migrations

```bash
npx prisma migrate deploy
```

### 4. Seed the database

```bash
npm run seed
```

Creates 3 warehouses, 6 products, 14 stock entries with varied availability.

### 5. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Concurrency Approach

The reservation endpoint is race-condition-free via a single atomic SQL `UPDATE`:

```sql
UPDATE "StockItem"
SET reserved = reserved + $quantity
WHERE "productId" = $productId
  AND "warehouseId" = $warehouseId
  AND (total - reserved) >= $quantity
RETURNING id
```

**Why this works:** PostgreSQL row-level locking means only one transaction can modify a given `StockItem` row at a time. The `WHERE` guard `(total - reserved) >= quantity` is evaluated inside the lock — if two requests race for the last unit, exactly one satisfies the condition and gets a row back. The other gets an empty result and returns 409.

No application-level locks or Redis needed for correctness.

---

## Expiry Mechanism

### Approach: Lazy cleanup on read

When a reservation is accessed (GET reservation page, GET API, or POST confirm), the server checks `expiresAt < now`. If expired and still `PENDING`, it atomically:

1. Sets `status = RELEASED`
2. Decrements `StockItem.reserved`

Both steps run in a Prisma `$transaction` so they're atomic.

**Trade-off:** Reserved units appear unavailable until that reservation is touched. For production I'd add a Vercel Cron job at `/api/cron/expire` running every 60 seconds to batch-release all expired reservations via a single SQL statement.

---

## Idempotency (Bonus)

Both `POST /api/reservations` and `POST /api/reservations/:id/confirm` support an `Idempotency-Key` header.

**How it works:**
1. First request: run the operation, store `{ key, reservationId, response }` in `IdempotencyRecord` table
2. Retry with same key: return stored response immediately — no side effect repeated

**Storage:** Postgres `IdempotencyRecord` table with `UNIQUE` constraint on `key`. In production I'd add a TTL and cleanup job, or switch to Redis with `SET key value EX 86400`.

---

## API Reference

| Method | Path | Behaviour |
|--------|------|-----------|
| `GET` | `/api/products` | List products with stock per warehouse |
| `GET` | `/api/warehouses` | List warehouses |
| `POST` | `/api/reservations` | Reserve units — 409 if insufficient |
| `GET` | `/api/reservations/:id` | Get reservation details |
| `POST` | `/api/reservations/:id/confirm` | Confirm — 410 if expired |
| `POST` | `/api/reservations/:id/release` | Release early |

---

## Stack

- **Next.js 16** App Router — server components + route handlers
- **Prisma 7** + **@prisma/adapter-pg** — ORM with pg driver adapter (Prisma 7 requires adapter)
- **Supabase** — hosted PostgreSQL
- **Zod** — request validation
- **Tailwind CSS v4** + **shadcn/ui** — styling
- **sonner** — toast notifications

---

## Trade-offs & What I'd Do Differently

| Area | Decision | With More Time |
|------|----------|----------------|
| **Expiry** | Lazy cleanup on read | Vercel Cron + batch SQL every 60s |
| **Idempotency storage** | Postgres table | Redis with TTL |
| **Auth** | None (exercise scope) | Clerk/NextAuth, user-scoped reservations |
| **Quantity** | Fixed at 1 | Input with max = available |
| **Observability** | `console.error` | Structured logging + Sentry |
| **Tests** | None | Unit test atomic UPDATE, integration test concurrent reserve |
