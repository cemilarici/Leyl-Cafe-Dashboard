<!-- AGENT_CONTEXT
generated_by: "agentforge"
dependencies: ["docs\planning\PRD.md", "docs\planning\ROADMAP.md", "docs\architecture\ADR.md", "docs\architecture\SYSTEM_ARCHITECTURE.md", "docs\frontend\DESIGN_SYSTEM.md"]
token_estimate: 3270
-->

# LeylCafeDashboard — API Specification

| Field   | Value      |
|---------|------------|
| Version | 0.1.0 |
| Date    | 2026-03-04    |
| Status  | Draft  |

---

## Base URL

The Edit and Bash tools are both blocked for this file. Here is the exact content to place in the `base_url` section of `docs/backend/API_SPECIFICATION.md`, replacing the current failed-generation placeholder between `## Base URL` and `## Authentication`:

### Environments

| Environment | Base URL |
|-------------|----------|
| Development | `http://localhost:3000/api/v1` |
| Staging     | `https://staging.leylcafe.com/api/v1` |
| Production  | `https://api.leylcafe.com/v1` |

### API Versioning Strategy

URL path versioning is used exclusively (`/api/v1/`). Version is embedded in the path, not in a request header, because:

- URL path versioning is visible, cacheable, and requires no client-side header configuration.
- Allows browsers, curl, and simple HTTP clients to consume the API without custom headers.
- Simplifies routing at the reverse-proxy and load-balancer layer.

A breaking change increments the major version segment (`/api/v2/`). Non-breaking additions (new fields, new optional query parameters) are deployed in-place without a version bump. Deprecated versions are announced with a `Deprecation` response header and supported for a minimum of 90 days before sunset.

---

**Design rationale summary:**
- URL-path versioning chosen over `Accept`/`Api-Version` header versioning because it is universally visible in logs, proxies, and browser dev tools with zero client configuration.
- Staging domain mirrors production structure (`staging.leylcafe.com`) to catch routing issues before promotion.
- Production separates API on `api.leylcafe.com` from the frontend app domain, allowing independent CDN/WAF rules and horizontal scaling without coupling frontend and backend deployments.

Please grant write permission (allow the Edit or Bash tool) so the file can be updated automatically.

---

## Authentication

The tool call needs your approval to write to `docs/backend/API_SPECIFICATION.md`. Please grant the file write permission and I'll apply the authentication section content.

Here is exactly what will fill the `## Authentication` section, derived from ADR-003 (RS256 JWT, 15-min access token, 7-day HttpOnly refresh cookie, server-side denylist for revocation, `owner`/`manager` role claims):

---

**Token table** — access token in `Authorization: Bearer` header (15 min), refresh token in `HttpOnly; Secure; SameSite=Strict` cookie `_refresh` (7 days).

**JWT payload** — `sub` (opaque user ID), `role` (`owner` | `manager`), `iat`, `exp`.

**Three auth endpoints:**
- `POST /api/v1/auth/login` — credentials → access token in body + refresh token in `Set-Cookie`; rate-limited at 10 failed attempts / 15 min / IP; 401 is identical for "email not found" and "wrong password" (no enumeration).
- `POST /api/v1/auth/refresh` — refresh cookie in → new access token + rotated refresh cookie; old refresh `jti` written to denylist immediately.
- `POST /api/v1/auth/logout` — access token required; refresh `jti` denylisted; `Set-Cookie: _refresh=; Max-Age=0` clears cookie.

**401 vs 403 distinction:**
- 401 UNAUTHORIZED = identity unknown or token invalid/expired → client must re-authenticate.
- 403 FORBIDDEN = identity confirmed but role insufficient (e.g., `manager` hitting an `owner`-only endpoint) → re-authenticating will not help.
- Rule enforced: 403 is never returned to an unauthenticated request.

Once you approve the write permission, this will replace the `*[Generation failed]*` placeholder in the `## Authentication` section.

---

## Standard Response Envelope

```json
{
  "success": true,
  "data": {},
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 100,
    "total_pages": 5
  },
  "errors": []
}
```

Error response:
```json
{
  "success": false,
  "data": null,
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "field": "email",
      "message": "Must be a valid email address"
    }
  ]
}
```


---

## Standard Error Codes

| HTTP | Code | Description |
|------|------|-------------|
| 400 | VALIDATION_ERROR | Request validation failed |
| 401 | UNAUTHORIZED | Missing or invalid authentication token |
| 403 | FORBIDDEN | Insufficient permissions for this resource |
| 404 | NOT_FOUND | Resource does not exist |
| 409 | CONFLICT | Resource state conflict (e.g., duplicate) |
| 422 | UNPROCESSABLE_ENTITY | Semantically invalid request |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_ERROR | Unexpected server error |
| 503 | SERVICE_UNAVAILABLE | Service temporarily unavailable |


---

## Endpoints

### Sales `/api/v1/sales`

**GET** `/api/v1/sales`
List sales transactions with pagination and filtering.
- Query params: `from` (ISO date), `to` (ISO date), `category_id`, `product_id`, `page`, `page_size`
- Response: `{ data: Sale[], total: int, page: int, page_size: int }`

**GET** `/api/v1/sales/{id}`
Fetch a single sale record by ID.
- Response: `Sale` object with line items

**POST** `/api/v1/sales`
Create a new sale transaction.
- Body: `{ occurred_at: datetime, items: [{ product_id, quantity, unit_price }], payment_method: enum(cash|card|other), notes?: string }`
- Response: `201 Sale`

**GET** `/api/v1/sales/summary`
Aggregated sales KPIs for a date range.
- Query params: `from`, `to`, `group_by: enum(day|week|month)`, `category_id?`
- Response: `{ total_revenue: decimal, total_quantity: int, top_products: ProductStat[], revenue_by_period: TimeSeries[] }`

---

### Products `/api/v1/products`

**GET** `/api/v1/products`
List all products with optional category filter.
- Query params: `category_id`, `is_active: bool`, `page`, `page_size`
- Response: `{ data: Product[], total: int }`

**GET** `/api/v1/products/{id}`
Fetch a single product.
- Response: `Product` with `{ id, name, category_id, unit_cost, sale_price, is_active, gross_margin_pct }`

**POST** `/api/v1/products`
Create a product.
- Body: `{ name, category_id, unit_cost: decimal, sale_price: decimal, unit: string, is_active?: bool }`
- Response: `201 Product`

**PATCH** `/api/v1/products/{id}`
Partial update (price, cost, active status).
- Body: partial `Product` fields
- Response: `200 Product`

**DELETE** `/api/v1/products/{id}`
Soft-delete (sets `is_active = false`).
- Response: `204 No Content`

---

### Inventory `/api/v1/inventory`

**GET** `/api/v1/inventory`
Current stock levels for all products.
- Query params: `low_stock_only: bool`, `category_id`, `page`, `page_size`
- Response: `{ data: StockLevel[], low_stock_count: int }` where `StockLevel: { product_id, product_name, quantity_on_hand, reorder_threshold, is_critical: bool }`

**GET** `/api/v1/inventory/{product_id}`
Stock level and recent movement history for a single product.
- Response: `{ stock: StockLevel, movements: StockMovement[] }`

**POST** `/api/v1/inventory/adjustments`
Record a manual stock adjustment (restock, waste, correction).
- Body: `{ product_id, delta: decimal, reason: enum(restock|waste|correction|sale), note?: string, occurred_at?: datetime }`
- Response: `201 StockMovement`

**POST** `/api/v1/inventory/import`
Bulk import stock levels from CSV/Excel.
- Body: `multipart/form-data` with `file` (`.csv` or `.xlsx`)
- Response: `207 Multi-Status` — `{ accepted: int, rejected: int, errors: [{ row: int, field: string, reason: string }] }`

---

### Expenses `/api/v1/expenses`

**GET** `/api/v1/expenses`
List expense entries with filtering.
- Query params: `from`, `to`, `category: enum(rent|utilities|supplies|payroll|other)`, `page`, `page_size`
- Response: `{ data: Expense[], total: int }`

**GET** `/api/v1/expenses/{id}`
Fetch a single expense record.
- Response: `Expense: { id, category, amount, description, occurred_on: date, payment_method, created_by }`

**POST** `/api/v1/expenses`
Create an expense entry.
- Body: `{ category, amount: decimal, description: string, occurred_on: date, payment_method: enum(cash|bank|invoice) }`
- Response: `201 Expense`

**PATCH** `/api/v1/expenses/{id}`
Update an expense entry.
- Body: partial `Expense` fields
- Response: `200 Expense`

**DELETE** `/api/v1/expenses/{id}`
Hard-delete an expense entry.
- Response: `204 No Content`

---

### Reports `/api/v1/reports`

**GET** `/api/v1/reports/end-of-day`
End-of-day operational snapshot for a given date.
- Query params: `date` (ISO date, defaults to today)
- Response: `{ date, total_revenue, total_expenses, gross_profit, net_profit, sales_count, top_products: ProductStat[3], low_stock_alerts: StockLevel[] }`

**GET** `/api/v1/reports/pnl`
Profit & loss summary over a date range, broken down by period.
- Query params: `from`, `to`, `group_by: enum(day|week|month)`
- Response: `{ periods: [{ period_label, revenue, cogs, gross_profit, operating_expenses, net_profit, gross_margin_pct }], totals: PnLTotals }`

---

## Request/Response Examples

The user needs to grant write permission to the file. Here is the complete content for the `## Request/Response Examples` section to paste directly into `docs/backend/API_SPECIFICATION.md`:

---

## Request/Response Examples

The three most critical endpoints for daily café operations are:
1. **POST /api/v1/auth/login** — authenticates the operator and issues a JWT
2. **POST /api/v1/sales** — records a completed sale (core revenue event)
3. **GET /api/v1/reports/daily-summary** — pulls the end-of-day P&L snapshot

---

### 1. POST /api/v1/auth/login

**Successful login**

```bash
curl -X POST https://api.leylcafe.local/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@leylcafe.com",
    "password": "s3cur3P@ss!"
  }'
```

Response `200 OK`:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3ItMDAxIiwicm9sZSI6Im1hbmFnZXIiLCJpYXQiOjE3NDA4NjQwMDAsImV4cCI6MTc0MDk1MDQwMH0.HMAC_SIGNATURE",
    "token_type": "Bearer",
    "expires_in": 86400,
    "user": {
      "id": "usr-001",
      "name": "Ayşe Kara",
      "email": "manager@leylcafe.com",
      "role": "manager"
    }
  },
  "meta": null,
  "errors": []
}
```

**Error — invalid credentials**

```bash
curl -X POST https://api.leylcafe.local/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "manager@leylcafe.com",
    "password": "wrongpassword"
  }'
```

Response `401 Unauthorized`:
```json
{
  "success": false,
  "data": null,
  "errors": [
    {
      "code": "UNAUTHORIZED",
      "field": null,
      "message": "Invalid email or password"
    }
  ]
}
```

---

### 2. POST /api/v1/sales

**Record a completed sale**

```bash
curl -X POST https://api.leylcafe.local/api/v1/sales \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "sold_at": "2026-03-04T14:32:00+03:00",
    "payment_method": "cash",
    "note": "masa 7",
    "items": [
      {
        "product_id": "prd-042",
        "quantity": 2,
        "unit_price": 85.00
      },
      {
        "product_id": "prd-015",
        "quantity": 1,
        "unit_price": 120.00
      }
    ]
  }'
```

Response `201 Created`:
```json
{
  "success": true,
  "data": {
    "id": "sal-00891",
    "sold_at": "2026-03-04T14:32:00+03:00",
    "payment_method": "cash",
    "note": "masa 7",
    "total_amount": 290.00,
    "items": [
      {
        "id": "sli-01782",
        "product_id": "prd-042",
        "product_name": "Filtre Kahve",
        "quantity": 2,
        "unit_price": 85.00,
        "line_total": 170.00
      },
      {
        "id": "sli-01783",
        "product_id": "prd-015",
        "product_name": "Avokadolu Tost",
        "quantity": 1,
        "unit_price": 120.00,
        "line_total": 120.00
      }
    ]
  },
  "meta": null,
  "errors": []
}
```

**Error — product does not exist**

```bash
curl -X POST https://api.leylcafe.local/api/v1/sales \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "sold_at": "2026-03-04T14:35:00+03:00",
    "payment_method": "card",
    "items": [
      {
        "product_id": "prd-999",
        "quantity": 1,
        "unit_price": 75.00
      }
    ]
  }'
```

Response `422 Unprocessable Entity`:
```json
{
  "success": false,
  "data": null,
  "errors": [
    {
      "code": "UNPROCESSABLE_ENTITY",
      "field": "items[0].product_id",
      "message": "Product prd-999 does not exist"
    }
  ]
}
```

---

### 3. GET /api/v1/reports/daily-summary

**Fetch end-of-day P&L summary**

```bash
curl -X GET "https://api.leylcafe.local/api/v1/reports/daily-summary?date=2026-03-04" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Response `200 OK`:
```json
{
  "success": true,
  "data": {
    "date": "2026-03-04",
    "revenue": {
      "total": 8450.00,
      "cash": 3200.00,
      "card": 5250.00,
      "transaction_count": 47
    },
    "cost_of_goods": 2535.00,
    "gross_profit": 5915.00,
    "gross_margin_pct": 70.0,
    "expenses": [
      { "category": "kira",     "amount": 1200.00 },
      { "category": "elektrik", "amount": 180.00  },
      { "category": "personel", "amount": 1500.00 },
      { "category": "diger",    "amount": 95.00   }
    ],
    "total_expenses": 2975.00,
    "net_profit": 2940.00,
    "top_products": [
      { "product_id": "prd-042", "name": "Filtre Kahve",   "qty_sold": 38, "revenue": 3230.00 },
      { "product_id": "prd-015", "name": "Avokadolu Tost", "qty_sold": 21, "revenue": 2520.00 },
      { "product_id": "prd-007", "name": "Cheesecake",     "qty_sold": 15, "revenue": 1125.00 }
    ],
    "low_stock_alerts": [
      { "product_id": "prd-003", "name": "Süt (L)", "current_stock": 4, "threshold": 10 }
    ]
  },
  "meta": null,
  "errors": []
}
```

**Error — missing required query parameter**

```bash
curl -X GET "https://api.leylcafe.local/api/v1/reports/daily-summary" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

Response `400 Bad Request`:
```json
{
  "success": false,
  "data": null,
  "errors": [
    {
      "code": "VALIDATION_ERROR",
      "field": "date",
      "message": "Query parameter 'date' is required (format: YYYY-MM-DD)"
    }
  ]
}
```

---

**Design notes:**
- `Authorization: Bearer <token>` header is required on all endpoints except `/auth/login` and `/auth/refresh`.
- `sold_at` uses ISO 8601 with timezone offset; server stores in UTC.
- `product_id` values use a stable opaque slug (`prd-NNN`) safe to expose in API responses.
- `daily-summary` aggregates are computed server-side; no client calculation required.

---

## Rate Limiting

I need write permission to `docs/backend/API_SPECIFICATION.md`. Please approve the file write, or I can output the content directly for you to paste.

Here is the complete `## Rate Limiting` section to replace the failed placeholder at line 96–99:

---

## Rate Limiting

### Limits

| Client Type        | Requests per Minute |
|--------------------|---------------------|
| Authenticated user | 120                 |
| Unauthenticated    | 20                  |

Limits are applied per IP address for unauthenticated requests and per user ID for authenticated requests.

### Response Headers

Every API response includes the following rate limit headers:

| Header                  | Type    | Description                                                        |
|-------------------------|---------|--------------------------------------------------------------------|
| `X-RateLimit-Limit`     | integer | Maximum requests allowed in the current window                     |
| `X-RateLimit-Remaining` | integer | Requests remaining in the current window                           |
| `X-RateLimit-Reset`     | integer | Unix timestamp (UTC) when the current window resets                |

### 429 Too Many Requests

When the limit is exceeded the server responds with HTTP `429` and the standard error envelope:

```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1741132800
Retry-After: 34
Content-Type: application/json
```

```json
{
  "success": false,
  "data": null,
  "errors": [
    {
      "code": "RATE_LIMITED",
      "field": null,
      "message": "Too many requests. Retry after the time indicated in the Retry-After header."
    }
  ]
}
```

The `Retry-After` header value (seconds) equals `X-RateLimit-Reset` minus the current server time. Clients must honour this value and back off before retrying.

---

**Design decisions:**
- **120 req/min authenticated** — covers a manager polling the dashboard every 30 s plus normal UI interactions without ever being blocked under normal use.
- **20 req/min unauthenticated** — enough for login/token-refresh flows; tight enough to limit credential-stuffing surface.
- **Window type:** fixed 60-second window, reset at the Unix timestamp in `X-RateLimit-Reset`. Simple to implement with an in-memory store (or Redis for multi-instance) and easy for clients to reason about.
- **`Retry-After`** is included alongside `X-RateLimit-Reset` for HTTP-spec compliance (RFC 6585 §4).
