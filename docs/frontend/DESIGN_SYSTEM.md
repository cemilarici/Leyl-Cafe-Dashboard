<!-- AGENT_CONTEXT
generated_by: "agentforge"
dependencies: ["docs\planning\PRD.md", "docs\planning\ROADMAP.md", "docs\architecture\ADR.md", "docs\architecture\SYSTEM_ARCHITECTURE.md"]
token_estimate: 5534
-->

# LeylCafeDashboard — Design System

| Field   | Value      |
|---------|------------|
| Version | 0.1.0 |
| Date    | 2026-03-04    |
| Status  | Draft  |

---

## Design Principles

The file needs write permission. The five design principles to fill `design_principles` in `DESIGN_SYSTEM.md` are:

**Operational Clarity First:** Every screen must answer an operational question within seconds — no decorative chrome, no ambiguous labels — KPI cards, tables, and alerts use consistent hierarchy so a manager glancing at their phone during service instantly finds the number that matters.

**Density Without Clutter:** Café operators need many data points on one screen; wasted whitespace is wasted time — components use compact spacing tokens and tight typographic scales so tables, charts, and filter bars coexist without overwhelming, especially on tablet and phone viewports used at the counter.

**Progressive Disclosure:** Surface daily-action data (today's sales, critical stock alerts) at the top level; hide configuration, historical drill-downs, and import flows behind clear secondary navigation — this keeps the default view scannable for an owner checking in between customers.

**Unambiguous State Feedback:** Every write action (save, import, stock adjustment) provides explicit success or error feedback inline — no silent failures — error states include the affected row/field and a recovery instruction, because a missed stock entry at end-of-day has real cost.

**Accessible by Default:** All interactive elements meet WCAG 2.1 AA contrast (4.5:1 text, 3:1 UI components), support full keyboard navigation, and carry semantic ARIA labels — dark/light theme tokens are defined once and applied consistently so contrast requirements hold in both modes without per-component overrides.

Please grant write access to `docs/frontend/DESIGN_SYSTEM.md` and I'll apply the edit to replace the stale preamble with the clean content above.

---

## Color Palette

## Brand Colors

| Token | Light | Dark | Hex (Light) | Hex (Dark) |
|---|---|---|---|---|
| `--color-primary` | Espresso Brown | Warm Cream | `#4A2C17` | `#F5E6D3` |
| `--color-primary-subtle` | Latte | Deep Roast | `#C8956C` | `#6B3A1F` |
| `--color-secondary` | Sage Green | Muted Sage | `#5A7A5C` | `#7FAF82` |
| `--color-secondary-subtle` | Pale Sage | Dark Sage | `#D4E6D5` | `#2E4A30` |
| `--color-accent` | Amber Gold | Soft Amber | `#D4A017` | `#F0C84A` |
| `--color-accent-subtle` | Pale Amber | Deep Amber | `#FBF0CC` | `#5A4000` |

## Semantic Tokens

| Token | Light | Dark | Hex (Light) | Hex (Dark) | Usage |
|---|---|---|---|---|---|
| `--color-success` | `#2D7A4F` | `#4CAF82` | ✅ | ✅ | Profit up, stock OK, payment confirmed |
| `--color-success-subtle` | `#E6F5ED` | `#0D2E1E` | | | Success backgrounds, badges |
| `--color-warning` | `#B45309` | `#FBBF24` | ⚠️ | ⚠️ | Low stock, margin alerts |
| `--color-warning-subtle` | `#FEF3C7` | `#3A2000` | | | Warning banners, row highlights |
| `--color-danger` | `#B91C1C` | `#F87171` | 🔴 | 🔴 | Losses, critical stock-out, errors |
| `--color-danger-subtle` | `#FEE2E2` | `#3B0A0A` | | | Error states, destructive actions |
| `--color-info` | `#1D4ED8` | `#60A5FA` | ℹ️ | ℹ️ | Tooltips, reports, neutral notices |
| `--color-info-subtle` | `#DBEAFE` | `#0D1F4A` | | | Info banners, chart annotations |

## Surface & Text Tokens

| Token | Light | Dark |
|---|---|---|
| `--color-bg` | `#FAF7F4` | `#1A1210` |
| `--color-surface` | `#FFFFFF` | `#2A1F1A` |
| `--color-surface-raised` | `#F5F0EB` | `#362820` |
| `--color-border` | `#E5DDD5` | `#4A3428` |
| `--color-text` | `#1C1009` | `#F0E8E0` |
| `--color-text-muted` | `#7A6358` | `#A08070` |

## CSS Variable Declaration

```css
:root {
  --color-primary: #4A2C17;
  --color-secondary: #5A7A5C;
  --color-accent: #D4A017;
  --color-success: #2D7A4F;
  --color-warning: #B45309;
  --color-danger: #B91C1C;
  --color-info: #1D4ED8;
}

.dark {
  --color-primary: #F5E6D3;
  --color-secondary: #7FAF82;
  --color-accent: #F0C84A;
  --color-success: #4CAF82;
  --color-warning: #FBBF24;
  --color-danger: #F87171;
  --color-info: #60A5FA;
}
```

## Usage Guidelines

**Primary (Espresso Brown / Warm Cream)** — Navigation, primary buttons, headings. Anchors the cafe's warm, artisan identity.

**Secondary (Sage Green)** — Inventory indicators, category tags, secondary actions. Signals freshness and calm.

**Accent (Amber Gold)** — Highlights, active states, KPI callout values. Use sparingly — one accent per card maximum.

**Semantic tokens** — Always use `--color-success/warning/danger/info` over raw hex for status. Never repurpose a semantic color for decorative use.

**Subtle variants** — Use `*-subtle` tokens for backgrounds of alert banners, table row highlights, and badge fills to maintain contrast without visual weight.

---

## Typography

I need write permission to `docs/frontend/DESIGN_SYSTEM.md`. Please approve the file write when prompted, then I'll apply the typography section. Here is the exact content that will replace the failed placeholder:

---

**Font Families**

| Role | Family | Fallback Stack |
|------|--------|----------------|
| Heading | Inter | system-ui, -apple-system, sans-serif |
| Body | Inter | system-ui, -apple-system, sans-serif |
| Mono | JetBrains Mono | "Courier New", Courier, monospace |

Inter for heading + body (operational UI, visual unity). JetBrains Mono for numeric KPI values, table quantity/price cells, and import error output (digit-width alignment).

---

**Type Scale**

| Token | px | rem | Usage |
|-------|----|-----|-------|
| `xs` | 12 | 0.75rem | Labels, badges, helper text |
| `sm` | 14 | 0.875rem | Table cells, secondary metadata |
| `base` | 16 | 1rem | Body text, form inputs |
| `lg` | 18 | 1.125rem | Card subtitles, modal headers |
| `xl` | 20 | 1.25rem | Page sub-headings |
| `2xl` | 24 | 1.5rem | KPI card values, page headings |
| `3xl` | 30 | 1.875rem | Dashboard hero metrics |
| `4xl` | 36 | 2.25rem | Single-stat full-screen views |

---

**Font Weights**

| Token | Value | Usage |
|-------|-------|-------|
| `regular` | 400 | Body, table content |
| `medium` | 500 | Form labels, nav items |
| `semibold` | 600 | KPI labels, table headers, alert titles |
| `bold` | 700 | KPI values, page titles, critical errors |

---

**Line Heights**

| Token | Value | Usage |
|-------|-------|-------|
| `tight` | 1.25 | Headings, KPI values, compact rows |
| `normal` | 1.5 | Body text, forms, general UI |
| `relaxed` | 1.75 | Import error reports, help text |

---

**CSS Custom Properties**

```css
--font-heading:   'Inter', system-ui, -apple-system, sans-serif;
--font-body:      'Inter', system-ui, -apple-system, sans-serif;
--font-mono:      'JetBrains Mono', 'Courier New', Courier, monospace;

--text-xs:   0.75rem;
--text-sm:   0.875rem;
--text-base: 1rem;
--text-lg:   1.125rem;
--text-xl:   1.25rem;
--text-2xl:  1.5rem;
--text-3xl:  1.875rem;
--text-4xl:  2.25rem;

--font-regular:  400;
--font-medium:   500;
--font-semibold: 600;
--font-bold:     700;

--leading-tight:   1.25;
--leading-normal:  1.5;
--leading-relaxed: 1.75;
```

---

**Typographic Pairings**

| Context | Size | Weight | Leading | Font |
|---------|------|--------|---------|------|
| Page title | `xl` | `bold` | `tight` | Heading |
| KPI card value | `3xl` | `bold` | `tight` | Mono |
| KPI card label | `sm` | `semibold` | `normal` | Body |
| Table header | `sm` | `semibold` | `normal` | Body |
| Table cell (text) | `sm` | `regular` | `normal` | Body |
| Table cell (number) | `sm` | `regular` | `normal` | Mono |
| Form label | `sm` | `medium` | `normal` | Body |
| Form input | `base` | `regular` | `normal` | Body |
| Import error report | `sm` | `regular` | `relaxed` | Mono |

---

**Accessibility Notes**
- Minimum rendered text: 12px (`xs`). Never go below for interactive or status-critical text.
- WCAG 2.1 AA: 4.5:1 for normal text; 3:1 for large text (`3xl`/`4xl` bold). Contrast enforced at color-token layer.
- Mono font on numeric cells prevents layout shift when values update.

---

Once you grant write permission to the file, I'll apply this directly. Approve the write when the permission prompt appears.

---

## Spacing & Layout

Here is the `spacing_and_layout` section content to place in `docs/frontend/DESIGN_SYSTEM.md` under **## Spacing & Layout**:

---

### Base Grid

All spacing is derived from a **4px base unit**. Use only scale tokens — never raw pixel values in components.

| Token | Value | Common Use |
|-------|-------|------------|
| `space-1` | 4px | Icon padding, hairline gaps |
| `space-2` | 8px | Inline element gaps, chip padding |
| `space-3` | 12px | Input vertical padding, tight card padding |
| `space-4` | 16px | Default component padding, form field gap |
| `space-5` | 20px | Card body padding (mobile) |
| `space-6` | 24px | Card body padding (desktop), section gap |
| `space-8` | 32px | Between major layout sections |
| `space-10` | 40px | Page top/bottom padding |
| `space-12` | 48px | Large section separators |
| `space-16` | 64px | Hero / empty-state vertical centering |

---

### Breakpoints

| Name | Min-width | Target devices |
|------|-----------|----------------|
| `sm` | 640px | Large phones (landscape), small tablets |
| `md` | 768px | Tablets (portrait) — counter/POS use |
| `lg` | 1024px | Tablets (landscape), small laptops |
| `xl` | 1280px | Desktop dashboards |
| `2xl` | 1536px | Wide monitors |

Default approach is **mobile-first**: base styles target `<640px`, then `sm:`, `md:`, `lg:`, `xl:`, `2xl:` override upward.

Critical screens (end-of-day report, stock alerts, KPI cards) must be fully functional and readable at `< sm` (320–639px).

---

### Maximum Content Width

| Context | Max-width | Rationale |
|---------|-----------|-----------|
| Full-page layout | `1280px` (`max-w-screen-xl`) | Prevents over-wide tables on 2xl monitors |
| Form / wizard panels | `720px` | Keeps label-to-field scan distance short |
| Modal / dialog | `560px` | Comfortable reading width for confirmations |
| Alert / toast | `400px` | Non-intrusive, fits all viewports |

The layout container is horizontally centered with `mx-auto` and horizontal padding of `space-4` (mobile) → `space-6` (md) → `space-8` (lg+).

---

### Grid System

The dashboard uses a **12-column grid** via CSS Grid.

| Viewport | Columns active | Gutter (`gap`) |
|----------|---------------|----------------|
| `< sm` | 4 | `space-4` (16px) |
| `sm` | 6 | `space-4` (16px) |
| `md` | 12 | `space-6` (24px) |
| `lg+` | 12 | `space-6` (24px) |

#### Standard Span Patterns

| Component | Mobile | md | lg |
|-----------|--------|----|----|
| KPI card | span 4 (full / 2-up) | span 3 | span 3 |
| Sales chart | span 4 (full) | span 8 | span 8 |
| Stock alert panel | span 4 (full) | span 4 | span 4 |
| Data table | span 4 (full) | span 12 | span 12 |
| Filter bar | span 4 (full) | span 12 | span 12 |
| Side detail panel | span 4 (stacked) | span 5 | span 4 |

KPI cards render **4-up** at `lg+` (span 3 each), **2-up** at `md` (span 6 each), **1-up stacked** at `< sm` (span 4 on a 4-col grid).

---

### Layout Composition Rules

1. **Page shell**: top nav (`h-14`) + optional side nav (`w-60` at `lg+`, off-canvas at `md-`) + main content area.
2. **Side nav** collapses to a bottom tab bar on `< md` for the four primary routes (Dashboard, Sales, Stock, Reports).
3. **Filter bar** is sticky below the top nav on all viewports; height is `space-12` (48px) to remain thumb-reachable on tablet.
4. **Table rows** have a minimum height of `space-10` (40px) to ensure tap targets ≥ 44px (WCAG 2.1 AA) with vertical padding from `space-2` top/bottom.

---

To write this directly into `docs/frontend/DESIGN_SYSTEM.md`, grant write permission and I'll apply the edit.

---

## Component Guidelines

The file write is being blocked by permissions. Here is the complete `component_guidelines` section content ready to be inserted at line 58–62 of `docs/frontend/DESIGN_SYSTEM.md`:

---

## Component Guidelines

### 1. KPI Card

**Purpose:** Surface a single operational metric (today's revenue, gross profit, low-stock count, total expenses) at a glance. The primary visual anchor on every dashboard view.

**Variants:**

| Variant | When to use |
|---------|-------------|
| `default` | Neutral metric with no threshold (e.g., total orders today) |
| `positive` | Metric above target or indicating a gain (green accent) |
| `warning` | Metric approaching a threshold (amber accent, e.g., stock at 20 % of min) |
| `critical` | Metric breached a threshold requiring immediate action (red accent, e.g., 0 stock) |
| `loading` | Skeleton placeholder while data fetches; never show stale numbers |

**Props:**
```ts
interface KpiCardProps {
  label: string;           // e.g. "Bugünkü Ciro"
  value: string | number;
  unit?: string;           // e.g. "₺", "adet"
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
    label: string;         // e.g. "Dünden %12 fazla"
  };
  variant?: 'default' | 'positive' | 'warning' | 'critical' | 'loading';
  onClick?: () => void;    // navigates to detail view
}
```

**Do:**
- Keep label to ≤ 4 words; use the operator's own vocabulary ("Net Kâr", not "EBITDA")
- Always show unit inline with value (`₺ 4.280`, not a separate label)
- Clicking the card navigates to the relevant detail page; indicate interactivity with `cursor-pointer` and focus ring
- Trend arrow and percentage must have an `aria-label` describing direction and magnitude

**Don't:**
- Never display raw floating-point numbers; always format with locale (`toLocaleString('tr-TR')`)
- Don't use color alone to convey variant state; pair color with an icon (`✓ / ⚠ / ✕`)
- Don't put secondary metrics inside the card; use a tooltip at maximum

---

### 2. Data Table

**Purpose:** Display paginated, filterable rows of operational records — sales transactions, stock movements, expense entries, and import error logs. The primary data-entry verification surface.

**Variants:**

| Variant | When to use |
|---------|-------------|
| `default` | Full-featured with sort, pagination, and row actions |
| `compact` | Reduced row height for mobile/tablet counter use |
| `readonly` | No row actions; read-only drill-down views |
| `error-report` | Highlights rejected rows in red with an inline reason column; used post-import |

**Props:**
```ts
interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  pagination: { page: number; pageSize: number; total: number };
  onPageChange: (page: number) => void;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  rowActions?: RowAction<T>[];
  isLoading?: boolean;
  emptyState?: ReactNode;
  variant?: 'default' | 'compact' | 'readonly' | 'error-report';
}
```

**Do:**
- Every sortable column header must be a `<button>` with `aria-sort` attribute
- Numeric columns (amounts, quantities) must be right-aligned
- Provide an explicit empty-state message with a call-to-action ("Henüz satış yok — CSV içe aktar")
- Use `role="grid"` with `aria-rowcount` and `aria-colcount`
- Sticky first column on horizontal scroll for mobile

**Don't:**
- Never load all rows client-side; always use server-side pagination (offset/limit)
- Don't embed form controls directly in cells; use an inline edit row pattern
- Don't hide pagination when total ≤ pageSize; show it disabled so layout is stable

---

### 3. Filter Bar

**Purpose:** Let operators narrow any list or chart to a specific date range, product category, or staff member without leaving the current view. Appears at the top of every data-heavy page.

**Variants:**

| Variant | When to use |
|---------|-------------|
| `full` | Desktop: all filters visible in one row |
| `collapsed` | Mobile/tablet: filters behind a "Filtrele" button; active filter count badge shown |

**Props:**
```ts
interface FilterBarProps {
  filters: FilterConfig[];
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
  onReset: () => void;
  activeCount?: number;
  variant?: 'full' | 'collapsed';
}

type FilterConfig =
  | { key: string; type: 'daterange'; label: string; presets: DatePreset[] }
  | { key: string; type: 'select';    label: string; options: SelectOption[] }
  | { key: string; type: 'multiselect'; label: string; options: SelectOption[] };

type DatePreset = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom';
```

**Do:**
- Date range must include quick presets (Bugün, Bu Hafta, Bu Ay) above the calendar — these cover 90 % of use cases
- Show "Filtreleri Temizle" only when at least one non-default filter is active
- Persist filter state in URL query params so managers can bookmark filtered views
- All filter controls must be keyboard-reachable; select menus must close on `Escape`

**Don't:**
- Don't trigger a fetch on every keystroke; debounce or apply on "Uygula" press
- Don't allow an empty date range; default to "Bugün" if both dates are cleared
- Don't hide active filter state; always show selected values as chips or populated inputs

---

### 4. Alert / Status Badge

**Purpose:** Communicate stock threshold breaches, import errors, and action confirmations inline — without navigating away. Used in KPI cards, table rows, toasts, and the stock alert panel.

**Variants:**

| Variant | Semantic meaning | Color token |
|---------|-----------------|-------------|
| `info` | Neutral system message | `--color-info` (blue) |
| `success` | Action completed (save, import OK) | `--color-success` (green) |
| `warning` | Approaching threshold, non-blocking | `--color-warning` (amber) |
| `critical` | Threshold breached, action required | `--color-critical` (red) |

**Sub-components:**
- **Badge** — inline pill inside table rows and KPI cards
- **InlineAlert** — full-width banner above a table or below a form section
- **Toast** — transient notification (4 s auto-dismiss + manual close button)
- **AlertPanel** — persistent drawer listing all active stock alerts until acknowledged

**Do:**
- Use `role="alert"` for critical, `role="status"` for success/info
- Toast must include `aria-label="Bildirimi kapat"` close button in addition to auto-dismiss
- Critical stock alerts must persist in AlertPanel until acknowledged; a toast alone is not sufficient
- Always pair icon + text; never icon alone for `warning` and `critical`

**Don't:**
- Don't stack more than 3 toasts simultaneously; queue and show sequentially
- Don't use `critical` color for non-critical UI decoration
- Don't rely on color alone — always pair with text label and icon

---

### 5. Chart

**Purpose:** Visualize trends (revenue over time), distributions (expense breakdown), and comparisons (product gross margin ranking). Used in Kârlılık and Satış pages.

**Variants:**

| Variant | Use case |
|---------|----------|
| `line` | Revenue/profit trend over days or weeks |
| `bar` | Product sales volume comparison, side-by-side periods |
| `donut` | Expense category distribution (% of total spend) |
| `sparkline` | Micro-trend inside a KPI card; no axes, no tooltip |

**Props:**
```ts
interface ChartProps {
  type: 'line' | 'bar' | 'donut' | 'sparkline';
  data: ChartDataset[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  formatValue?: (v: number) => string;   // e.g. "₺4.280"
  height?: number;                        // default: 260px
  isLoading?: boolean;
  emptyState?: ReactNode;
  colorScheme?: 'default' | 'accessible'; // accessible = no red/green pair
}
```

**Do:**
- All chart colors must meet 3:1 contrast ratio against the panel background
- Provide a data table fallback (`<details>` below chart or toggle button) for screen readers
- Label donut segments with both name and percentage
- Use `formatValue` with `tr-TR` locale consistently across all charts
- On mobile, switch line/bar charts to a scrollable single-axis view rather than compressing data

**Don't:**
- Never use a pie/donut with more than 6 segments; collapse the rest into "Diğer"
- Don't animate on every data refresh; animate only on initial mount
- Don't use dual Y-axes; stack separate charts vertically instead
- Never use color as the only series differentiator; add dashed/solid line styles or pattern fills

---

## Accessibility Standards

Here is the complete `accessibility_standards` section content to fill into `DESIGN_SYSTEM.md`:

---

### WCAG Compliance Target

All UI must conform to **WCAG 2.1 Level AA**. This applies to both light and dark themes without per-component overrides. Minimum contrast ratios:

- **4.5:1** — body text, labels, table cell content, form inputs
- **3:1** — large text (≥ 18 pt / 14 pt bold), UI component boundaries (buttons, input borders, chart axes), focus indicators
- **3:1** — non-text UI elements that convey meaning (icons, status indicators, chart series lines)

### Keyboard Navigation

Every interactive element must be reachable and operable via keyboard alone:

- All buttons, links, inputs, selects, and date pickers are in the natural tab order; no `tabindex` values greater than `0`
- Dropdown menus and custom selects open on `Enter`/`Space`, navigate with `ArrowUp`/`ArrowDown`, close on `Escape`
- Modal dialogs trap focus within themselves; `Escape` closes and returns focus to the trigger element
- Data tables support row-level keyboard selection (`Space` to toggle) and sortable column headers activated by `Enter`
- Filter bar date-range pickers support full keyboard date entry in addition to calendar navigation
- Toast/alert notifications do not steal focus; they are reachable via sequential tab order

### Screen Reader Support (ARIA Patterns)

| Component | ARIA Pattern |
|-----------|-------------|
| KPI cards | `role="region"` + `aria-label` describing the metric (e.g., "Today's Revenue") |
| Data tables | Native `<table>` with `<caption>`; sortable `<th>` carry `aria-sort="ascending|descending|none"` |
| Charts | `role="img"` + descriptive `aria-label`; supplementary data table accessible offscreen via `aria-describedby` |
| Alert badges (critical stock) | `role="alert"` with `aria-live="assertive"` for real-time threshold breaches |
| Status tags (in-stock / low / out) | Text label always present inside the element; icon is `aria-hidden="true"` |
| Modal dialogs | `role="dialog"` + `aria-modal="true"` + `aria-labelledby` pointing to dialog title |
| Navigation sidebar | `<nav>` with `aria-label="Main navigation"`; active item carries `aria-current="page"` |
| Import progress / async feedback | `role="status"` with `aria-live="polite"` for non-urgent updates |
| Form validation errors | `aria-invalid="true"` on the field + `aria-describedby` pointing to the error message element |

### Focus Management Rules

- **Visible focus ring** is always rendered — never suppressed globally with `outline: none`. Use `:focus-visible` to show rings only for keyboard navigation; pointer users are exempt.
- Focus ring style: `2px solid` using the brand focus token (`--color-focus-ring`), `2px offset`, with sufficient contrast against both light and dark backgrounds.
- When a modal or drawer opens, focus moves to the first focusable element inside (or the dialog container if no interactive element precedes the content).
- When a modal or drawer closes, focus returns to the element that triggered the open action.
- After a destructive action confirmation (e.g., delete stock entry), focus returns to the next logical row or to the table container — never lost to `<body>`.
- Route/page transitions move focus to the page `<h1>` or a skip-navigation landmark so screen reader users are oriented immediately.

### Color-Independence Requirements

Color must never be the **sole** means of conveying information. Every color-coded element requires a secondary non-color cue:

- **Status indicators** (stock level: OK / Low / Out): use distinct icon shapes (checkmark / warning triangle / ×) alongside color fills
- **Chart series**: distinguish lines/bars with both color and either pattern fill, dashed stroke, or unique marker shape; a legend with both swatch and label is mandatory
- **Trend direction** (profit up/down): accompany colored arrows with `aria-label` text ("revenue up 12%") and a directional icon (▲ / ▼)
- **Form validation**: invalid fields show a colored border **and** an inline error message **and** a warning icon adjacent to the label
- **Table row highlights** (e.g., negative margin rows): apply a background tint **and** a left-border accent stripe **and** a text-based flag in the row
- **Import row-level error report**: rejected rows carry a visible "Error" text label and description, not only a red highlight

---

The file write was blocked by permissions. Once write access is granted to `docs/frontend/DESIGN_SYSTEM.md`, I can apply this directly. The section above replaces the `*[Generation failed...]*` placeholder under `## Accessibility Standards`.
