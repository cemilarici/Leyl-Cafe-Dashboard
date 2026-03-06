<!-- AGENT_CONTEXT
generated_by: "agentforge"
dependencies: ["docs/planning/PRD.md", "docs/architecture/ADR.md", "docs/frontend/DESIGN_SYSTEM.md"]
token_estimate: 3200
-->

# LeylCafeDashboard — Routing & Navigation

| Field   | Value      |
|---------|------------|
| Version | 0.1.0 |
| Date    | 2026-03-05    |
| Status  | Draft  |

---

## Route Structure

| Path | Page Component | Role Access | Description |
|---|---|---|---|
| `/login` | `LoginPage` | Public | Email + password login form |
| `/` | redirect → `/dashboard` | Any | Root redirect |
| `/dashboard` | `DashboardPage` | owner, manager | KPI cards, charts, stock alerts |
| `/sales` | `SalesListPage` | owner, manager | Sales list with date/category filters |
| `/sales/new` | `SaleEntryPage` | owner, manager | Manual sale entry form |
| `/sales/import` | `SalesImportPage` | owner, manager | CSV/Excel bulk import |
| `/inventory` | `InventoryPage` | owner, manager | Stock levels, low-stock alerts |
| `/inventory/movements` | `StockMovementsPage` | owner, manager | Full stock movement log |
| `/inventory/adjust` | `StockAdjustPage` | owner, manager | Manual stock in/out entry |
| `/inventory/import` | `InventoryImportPage` | owner, manager | CSV/Excel stock import |
| `/expenses` | `ExpensesPage` | owner | Expense list (owner only — wages visible) |
| `/expenses/new` | `ExpenseEntryPage` | owner | New expense form |
| `/products` | `ProductsPage` | owner, manager | Product + category list |
| `/products/new` | `ProductFormPage` | owner | Create product |
| `/products/[id]` | `ProductFormPage` | owner | Edit product |
| `/reports/eod` | `EodReportPage` | owner, manager | End-of-day report (≤ 2 min) |
| `/settings` | `SettingsPage` | owner | User management, profile |
| `*` | `NotFoundPage` | Any | 404 |

---

## Next.js App Router File Layout

```
src/frontend/app/
├── layout.tsx                  # Root layout — ThemeProvider, QueryClientProvider, AuthProvider
├── (auth)/
│   └── login/
│       └── page.tsx            # Public login page
├── (app)/
│   ├── layout.tsx              # App shell — sidebar (desktop), bottom nav (mobile)
│   ├── dashboard/
│   │   └── page.tsx
│   ├── sales/
│   │   ├── page.tsx            # Sales list
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── import/
│   │       └── page.tsx
│   ├── inventory/
│   │   ├── page.tsx
│   │   ├── movements/
│   │   │   └── page.tsx
│   │   ├── adjust/
│   │   │   └── page.tsx
│   │   └── import/
│   │       └── page.tsx
│   ├── expenses/
│   │   ├── page.tsx
│   │   └── new/
│   │       └── page.tsx
│   ├── products/
│   │   ├── page.tsx
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   ├── reports/
│   │   └── eod/
│   │       └── page.tsx
│   └── settings/
│       └── page.tsx
└── not-found.tsx
```

---

## Auth Guard — `middleware.ts`

```ts
// middleware.ts (Next.js root)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_ROUTES = ['/login']
const OWNER_ONLY = ['/expenses', '/expenses/new', '/products/new', '/settings']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isPublic = PUBLIC_ROUTES.some(r => pathname.startsWith(r))

  // Check session cookie (presence only; JWT verified server-side)
  const hasSession = request.cookies.has('refresh_token')

  if (!isPublic && !hasSession) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role-based guard for owner-only routes
  // Full role check happens in the page via useAuth() + server action
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
```

Client-side role enforcement in pages:
```ts
const { user } = useAuth()
if (user?.role !== 'owner') redirect('/dashboard')
```

---

## Navigation Components

### Desktop — Sidebar (`components/layout/Sidebar.tsx`)

Vertical navigation, 240 px wide, collapsible to 64 px icon-only mode.

| Section | Items | Role |
|---|---|---|
| Ana Menü | Dashboard, Satışlar, Stok, Giderler | owner: all; manager: no Giderler |
| Ürünler | Ürün Listesi | both |
| Raporlar | Gün Sonu Raporu | both |
| Sistem | Ayarlar | owner only |

Active route: `aria-current="page"` + `bg-primary/10 text-primary` Tailwind classes.

### Mobile — Bottom Tab Bar (`components/layout/BottomNav.tsx`)

5 tabs maximum (critical paths only): Dashboard · Satışlar · Stok · Giderler · Menü(…).
Hidden on `md:` breakpoint and above. Fixed at bottom, `h-16`, safe-area inset.

### Breadcrumbs

Used on detail/form pages only (e.g. `Satışlar > Yeni Giriş`). Auto-generated from route segments via `usePathname()`. Not shown on dashboard or top-level list pages.

---

## Loading & Error Boundaries

Each `(app)` route segment has:
- `loading.tsx` — skeleton component matching the page layout (prevents layout shift)
- `error.tsx` — friendly error card with retry button; logs to console in dev

```
(app)/sales/
├── page.tsx
├── loading.tsx    # <SalesListSkeleton />
└── error.tsx      # <PageError reset={reset} />
```

Global unhandled errors (network failures, 500s) surface as a toast via TanStack Query's `onError` global handler in `QueryClientProvider`.
