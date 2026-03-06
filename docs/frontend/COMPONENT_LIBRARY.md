<!-- AGENT_CONTEXT
generated_by: "agentforge"
dependencies: ["docs/frontend/DESIGN_SYSTEM.md", "docs/frontend/STATE_MANAGEMENT.md", "docs/backend/API_SPECIFICATION.md"]
token_estimate: 3500
-->

# LeylCafeDashboard — Component Library

| Field   | Value      |
|---------|------------|
| Version | 0.1.0 |
| Date    | 2026-03-05    |
| Status  | Draft  |

---

## File Structure

```
src/frontend/components/
├── ui/                         # Generic, reusable primitives
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Select.tsx
│   ├── Badge.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── Toast.tsx
│   ├── Skeleton.tsx
│   └── Table/
│       ├── DataTable.tsx
│       └── Pagination.tsx
├── charts/                     # Recharts wrappers
│   ├── PieChart.tsx
│   ├── LineChart.tsx
│   └── BarChart.tsx
├── features/                   # Domain-specific components
│   ├── dashboard/
│   │   ├── KPICard.tsx
│   │   ├── StockAlertBanner.tsx
│   │   └── FilterBar.tsx
│   ├── sales/
│   │   ├── SaleForm.tsx
│   │   └── SalesTable.tsx
│   ├── inventory/
│   │   ├── StockAdjustForm.tsx
│   │   └── InventoryTable.tsx
│   ├── expenses/
│   │   └── ExpenseForm.tsx
│   └── import/
│       └── ImportDropzone.tsx
└── layout/
    ├── AppShell.tsx
    ├── Sidebar.tsx
    └── BottomNav.tsx
```

### Utility: `cn()` helper

```ts
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }
```

---

## Component Inventory

| Component | Category | Description |
|---|---|---|
| `KPICard` | Data Display | KPI metric card with label, value, trend indicator |
| `DataTable` | Data Display | Paginated sortable table with loading skeleton |
| `FilterBar` | Forms | Date range + category filter, reset button |
| `StockAlertBanner` | Feedback | Alert strip listing items below threshold |
| `ImportDropzone` | Forms | File upload, progress, row-level error list |
| `SaleForm` | Forms | Manual sale entry — product, qty, date, payment |
| `ExpenseForm` | Forms | Expense entry — category, amount, date, note |
| `StockAdjustForm` | Forms | Stock in/out entry — ingredient, qty, type, note |
| `PieChart` | Charts | Recharts ResponsiveContainer pie with legend |
| `LineChart` | Charts | Multi-series line chart with date x-axis |
| `BarChart` | Charts | Grouped/stacked bar chart for category comparison |
| `Sidebar` | Layout | Collapsible vertical nav (desktop) |
| `BottomNav` | Layout | 5-tab bottom navigation (mobile) |
| `Modal` | Feedback | Accessible dialog with focus trap |
| `Toast` | Feedback | Success / error / info toasts via Sonner |

---

## Core Component Specs

### `KPICard`

```ts
interface KPICardProps {
  label: string
  value: string | number
  unit?: string                         // 'TL', 'adet', '%'
  trend?: 'up' | 'down' | 'neutral'
  delta?: string                        // '+12.4%', '-3 adet'
  variant?: 'default' | 'success' | 'warning' | 'danger'
  loading?: boolean
}
```

Shows `<Skeleton>` when `loading=true`. `variant` maps to border-left color token.

---

### `DataTable<T>`

```ts
interface Column<T> {
  key: keyof T
  header: string
  render?: (value: T[keyof T], row: T) => React.ReactNode
  sortable?: boolean
  width?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  pagination: { page: number; total: number; pageSize: number; onChange: (p: number) => void }
  emptyMessage?: string
}
```

Loading state renders `<Skeleton>` rows matching `pageSize`. Empty state shows centered `emptyMessage`.

---

### `FilterBar`

```ts
interface FilterBarProps {
  dateRange: DateRange
  onDateChange: (range: DateRange) => void
  categories?: string[]
  selectedCategories: string[]
  onCategoryChange: (cats: string[]) => void
  onReset: () => void
}
```

Date range uses a pre-set picker: Bugün / Bu Hafta / Bu Ay + custom range. Category multiselect shows product categories from `/api/v1/products/categories`.

---

### `StockAlertBanner`

```ts
interface StockAlertBannerProps {
  items: { name: string; current: number; threshold: number; unit: string }[]
}
```

Renders as a dismissible amber alert bar. Item count badge in nav sidebar mirrors this list.

---

### `ImportDropzone`

```ts
interface ImportDropzoneProps {
  entityType: 'sales' | 'products' | 'inventory'
  onSuccess: (result: ImportResult) => void
}

interface ImportResult {
  imported: number
  rejected: { row: number; reason: string }[]
}
```

Drag-and-drop + click-to-browse. Enforces 20 MB client-side. Shows progress bar during upload. On 207 response: renders rejected rows table with download-as-CSV button.

---

### `SaleForm`

Fields: product (searchable select from `/products`), quantity (numeric, > 0), payment method (cash/card/other), date-time (defaults to now), optional note.

Validation schema: `SaleFormSchema` (Zod). Server errors mapped to fields via `form.setError`. On success: cache invalidation + toast + form reset.

---

### Chart Wrappers

All charts wrap Recharts inside `ResponsiveContainer width="100%" height={240}`:

```ts
// charts/PieChart.tsx
interface PieChartProps {
  data: { name: string; value: number; color?: string }[]
  unit?: string        // appended to tooltip value
  legend?: boolean
}

// charts/LineChart.tsx
interface LineChartProps {
  data: Record<string, string | number>[]
  xKey: string
  series: { key: string; label: string; color: string }[]
  unit?: string
}
```

Dark mode: chart colors use CSS variable tokens from DESIGN_SYSTEM so they adapt automatically via Tailwind `dark:` variants on the container.

---

## Variant Pattern

Components accept a `variant` prop resolved via `cn()`:

```ts
const variantClasses = {
  default: 'border-border',
  success: 'border-green-500',
  warning: 'border-amber-500',
  danger:  'border-red-500',
} as const

<div className={cn('border-l-4 p-4', variantClasses[variant ?? 'default'])} />
```
