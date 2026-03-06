<!-- AGENT_CONTEXT
generated_by: "agentforge"
dependencies: ["docs/frontend/COMPONENT_LIBRARY.md", "docs/frontend/STATE_MANAGEMENT.md", "docs/frontend/ROUTING_AND_NAVIGATION.md"]
token_estimate: 3000
-->

# LeylCafeDashboard — Frontend Testing Strategy

| Field   | Value      |
|---------|------------|
| Version | 0.1.0 |
| Date    | 2026-03-05    |
| Status  | Draft  |

---

## Philosophy

**Test user-visible behaviour, not implementation details.**

- Test what the user sees and does (renders, clicks, form submission, error messages).
- Do NOT test internal state, private functions, or Tailwind class names.
- Mock the API layer (MSW) — never mock React hooks or TanStack Query internals.
- Small team → lean pyramid: high unit/component coverage on critical logic, minimal E2E on happy paths only.

---

## Test Pyramid

| Layer | Tool | Scope | Target Count |
|---|---|---|---|
| Unit | Vitest | Zod schemas, date utils, `cn()`, number formatters | ~30 |
| Component | Vitest + RTL | KPICard, DataTable, FilterBar, SaleForm, ImportDropzone | ~50 |
| Integration | Vitest + MSW | TanStack Query hooks with mocked API responses | ~20 |
| E2E | Playwright | Login, dashboard load, create sale, stock alert visible | ~8 |

**Coverage target:** 70% statements for `components/` and `lib/`. E2E covers 4 critical user journeys.

---

## Tool Setup

```jsonc
// package.json (frontend)
{
  "devDependencies": {
    "vitest": "^1.6",
    "@vitest/coverage-v8": "^1.6",
    "@testing-library/react": "^15",
    "@testing-library/user-event": "^14",
    "msw": "^2.3",
    "@playwright/test": "^1.44",
    "jsdom": "^24"
  }
}
```

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: { provider: 'v8', thresholds: { statements: 70 } },
  },
})
```

---

## MSW API Mocking

```ts
// src/test/handlers.ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/v1/dashboard/summary', () =>
    HttpResponse.json({ revenue: 4200, netProfit: 1800, stockAlerts: 2 })
  ),
  http.post('/api/v1/sales', () =>
    HttpResponse.json({ id: 'sal-001' }, { status: 201 })
  ),
  http.post('/api/v1/import/sales', () =>
    HttpResponse.json({ imported: 10, rejected: [{ row: 3, reason: 'product_id not found' }] }, { status: 207 })
  ),
]

// src/test/setup.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'
export const server = setupServer(...handlers)
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

---

## Key Test Cases

### Auth

```ts
// Unit: role guard
it('redirects manager away from /expenses', () => { ... })
it('allows owner to access /expenses', () => { ... })

// Component: LoginForm
it('shows error on invalid credentials (401 response)', async () => {
  server.use(http.post('/api/v1/auth/login', () =>
    HttpResponse.json({ code: 'INVALID_CREDENTIALS' }, { status: 401 })
  ))
  // render, fill form, submit, assert error message visible
})
```

### Sales

```ts
// Component: SaleForm validation
it('shows error when quantity is 0', async () => { ... })
it('shows server error mapped to field on 422', async () => { ... })

// Integration: useCreateSale mutation
it('invalidates sales and dashboard cache on success', async () => { ... })

// Component: ImportDropzone
it('rejects files over 20 MB before upload', async () => { ... })
it('renders rejected rows table on 207 response', async () => { ... })
```

### Dashboard

```ts
// Component: KPICard
it('renders correct value and trend indicator', () => { ... })
it('renders skeleton when loading=true', () => { ... })

// Integration: useDashboard hook
it('polls every 30 seconds', async () => {
  vi.useFakeTimers()
  // render hook, assert initial fetch, advance 30s, assert refetch
})
```

### Stock Alerts

```ts
// Component: StockAlertBanner
it('renders alert items from props', () => { ... })
it('renders nothing when items array is empty', () => { ... })
```

---

## File Naming Convention

- Co-locate tests with source: `KPICard.tsx` → `KPICard.test.tsx`
- Integration hooks: `hooks/__tests__/useSales.test.ts`
- E2E: `e2e/` directory at project root

---

## CI Integration

```yaml
# .github/workflows/frontend.yml
on: [push, pull_request]

jobs:
  test:
    steps:
      - run: npm ci
      - run: npm run test:unit        # Vitest unit + component + integration
      - run: npm run test:coverage    # fail if < 70%

  e2e:
    if: github.ref == 'refs/heads/main'   # E2E only on merge to main
    steps:
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

E2E tests run against a local `docker compose up` stack (backend + SQLite seeded with `seed_dev.py`). Not run on every PR to keep CI fast (unit tests run on every push).

---

## E2E Critical Paths (Playwright)

| Test | Steps |
|---|---|
| Login | Navigate `/login`, enter credentials, assert redirect to `/dashboard` |
| Dashboard load | Assert KPI cards visible, no console errors |
| Create sale | Open `/sales/new`, fill form, submit, assert new row in `/sales` list |
| Stock alert visible | Seed low-stock ingredient, load `/dashboard`, assert alert banner appears |
| CSV import (happy path) | Upload valid sales CSV, assert "X satır içe aktarıldı" message |
| CSV import (partial reject) | Upload CSV with 1 bad row, assert reject table with row + reason |
| Role guard | Login as manager, attempt to navigate `/expenses`, assert redirect |
| Logout | Click logout, assert redirect to `/login`, assert protected routes blocked |
