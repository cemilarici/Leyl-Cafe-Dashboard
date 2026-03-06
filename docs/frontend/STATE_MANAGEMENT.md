<!-- AGENT_CONTEXT
generated_by: "agentforge"
dependencies: ["docs/planning/PRD.md", "docs/architecture/ADR.md", "docs/backend/API_SPECIFICATION.md"]
token_estimate: 3800
-->

# LeylCafeDashboard — State Management

| Field   | Value      |
|---------|------------|
| Version | 0.1.0 |
| Date    | 2026-03-05    |
| Status  | Draft  |

---

## Overview

State is split into three tiers — **no global store (Zustand/Redux) is needed** for MVP:

| Tier | Tool | Responsibility |
|---|---|---|
| Server state | TanStack Query v5 | API data, caching, polling, mutations |
| Form state | React Hook Form + Zod | Input validation, submission, field errors |
| UI state | `useState` / `useReducer` | Filters, modals, theme; local to components |
| Auth state | React Context + memory | JWT token, role, refresh flow |

---

## TanStack Query Setup

```ts
// lib/query-client.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,       // 30 s — matches polling interval
      gcTime: 5 * 60_000,      // 5 min cache retention
      retry: 2,
      refetchOnWindowFocus: true,
    },
  },
})
```

Dashboard and inventory queries use `refetchInterval: 30_000` for automatic polling. All other queries rely on `staleTime` + `refetchOnWindowFocus`.

---

## Query Key Conventions

Pattern: `[resource, ...params]` — enables partial-match invalidation.

| Query | Key |
|---|---|
| Dashboard summary | `['dashboard', { from, to }]` |
| Sales list | `['sales', { from, to, category, page }]` |
| Products list | `['products', { page, search }]` |
| Single product | `['products', id]` |
| Inventory alerts | `['inventory', 'alerts']` |
| Stock movements | `['inventory', 'movements', { ingredientId, page }]` |
| Expenses | `['expenses', { from, to, category, page }]` |

Invalidation after any sale mutation:
```ts
queryClient.invalidateQueries({ queryKey: ['sales'] })
queryClient.invalidateQueries({ queryKey: ['dashboard'] })
queryClient.invalidateQueries({ queryKey: ['inventory', 'alerts'] })
```

---

## Key Query Hooks

```ts
// hooks/useDashboard.ts
export function useDashboard(range: DateRange) {
  return useQuery({
    queryKey: ['dashboard', range],
    queryFn: () => api.get('/dashboard/summary', { params: range }),
    refetchInterval: 30_000,
  })
}

// hooks/useSales.ts
export function useSales(filters: SalesFilters) {
  return useQuery({
    queryKey: ['sales', filters],
    queryFn: () => api.get('/sales', { params: filters }),
    placeholderData: keepPreviousData,  // smooth pagination
  })
}

// hooks/useProducts.ts — longer stale time; products change infrequently
export function useProducts(params: ProductsParams) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => api.get('/products', { params }),
    staleTime: 5 * 60_000,
  })
}
```

---

## Mutations

### Create Sale (optimistic update)

```ts
export function useCreateSale() {
  return useMutation({
    mutationFn: (data: SaleFormValues) => api.post('/sales', data),
    onMutate: async (newSale) => {
      await queryClient.cancelQueries({ queryKey: ['sales'] })
      const prev = queryClient.getQueryData(['sales', currentFilters])
      queryClient.setQueryData(['sales', currentFilters], (old) =>
        old ? { ...old, items: [newSale, ...old.items] } : old
      )
      return { prev }
    },
    onError: (_err, _vars, ctx) => {
      queryClient.setQueryData(['sales', currentFilters], ctx?.prev)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['inventory', 'alerts'] })
    },
  })
}
```

Stock adjustment and expense mutations use `onSettled`-only invalidation (no optimistic update — correctness > speed for financial data).

---

## Auth State

```ts
// context/AuthContext.tsx
interface AuthState {
  accessToken: string | null  // memory only — never localStorage
  user: { id: string; name: string; role: 'owner' | 'manager' } | null
}
```

- **Access token**: stored in memory (`useRef` inside `AuthProvider`). Lost on page refresh → re-hydrated via `POST /auth/refresh` on mount.
- **Refresh token**: httpOnly cookie (set by server). Never readable by JS.
- **Role**: embedded in JWT payload; read once on login and stored in context.
- **Silent refresh**: Axios response interceptor catches `401`, calls `/auth/refresh`, retries original request once.

---

## UI State (Local)

All UI state lives in components — no global store:

| State | Location | Tool |
|---|---|---|
| Date range filter | `FilterBar` | `useState<DateRange>` |
| Category filter | `FilterBar` | `useState<string[]>` |
| Modal open/close | parent page | `useState<boolean>` |
| Import file + errors | `ImportDropzone` | `useReducer` |
| Dark/light theme | `ThemeProvider` | `next-themes` |
| Sidebar collapsed | `AppShell` | `useState<boolean>` |

Complex filter objects (3+ fields) use `useReducer` with a `RESET` action to clear all filters at once.

---

## Form State (React Hook Form + Zod)

```ts
// schemas/sale.schema.ts
export const SaleFormSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().positive(),
  paymentMethod: z.enum(['cash', 'card', 'other']),
  soldAt: z.string().datetime(),
  note: z.string().max(200).optional(),
})
export type SaleFormValues = z.infer<typeof SaleFormSchema>
```

Server `422` errors are mapped back to form fields:
```ts
onError: (err) => {
  if (err.response?.status === 422) {
    err.response.data.details.forEach(({ field, message }) =>
      form.setError(field as keyof SaleFormValues, { message })
    )
  }
}
```

Schemas defined for: `SaleFormValues`, `ExpenseFormValues`, `ProductFormValues`, `CsvImportValues` (file + entityType).
