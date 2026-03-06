<!-- AGENT_CONTEXT
generated_by: "agentforge"
dependencies: ["docs\planning\PRD.md"]
token_estimate: 2468
-->

# LeylCafeDashboard — Development Roadmap

| Field   | Value      |
|---------|------------|
| Version | 0.1.0 |
| Date    | 2026-03-04    |
| Status  | Draft  |

---

## Overview

LeylCafeDashboard will become the single operational truth for small-to-medium café owners: within 12 months, a café operator will open one screen and instantly see today's gross profit, which products are running low, and where costs are drifting — all without touching a spreadsheet. The product will move from a manual-entry MVP to a semi-automated data layer (POS webhook or scheduled CSV sync), giving managers a reliable daily closing routine and reducing the cognitive load of running a profitable café to under 5 minutes per day.

We build in three deliberate steps, each de-risking the next. Phase 1 (Months 1–3) ships the MVP: manual data entry, CSV/Excel import, KPI cards, and critical stock alerts — because the fastest way to validate value is to eliminate the nightly spreadsheet ritual for a real operator. Phase 2 (Months 4–7) hardens the data model with recipe-based cost tracking and automated gross-margin reporting, turning raw sales figures into actionable product-level profitability. Phase 3 (Months 8–12) introduces lightweight POS integration hooks and multi-period trend analytics, so the dashboard graduates from a reporting tool to an early-warning system. Scope is intentionally cut at each phase boundary: we do not touch full accounting, franchise management, or ERP until a validated user base demands it.

---

## Milestones

| Milestone | Target Date | Key Deliverables | Success Criteria |
|-----------|-------------|------------------|------------------|
| **MVP** | 2026-06-04 | • Sales tracking: product-level counts/amounts, day/week/month filters, category breakdown<br>• Stock management: manual entry/exit records, critical stock alert threshold, low-stock notifications<br>• Revenue & expense dashboard: expense categories (rent, utilities, materials, wages), net profit card<br>• KPI card layout + pie chart (expense distribution) + bar/trend chart<br>• CSV/Excel bulk import for products, stock entries, sales (20 MB limit, row-level error report)<br>• Responsive web app: mobile-optimised day-end and stock-alert screens<br>• Docker + GitHub Actions CI/CD pipeline (dev / prod environments) | • Day-end report generated in ≤ 2 minutes<br>• Stock-out-driven lost-sale incidents drop from 3/week to ≤ 1/week<br>• Product-level gross-profit report matches stock entries + sales with 0 discrepancy<br>• System handles 3–10 concurrent users on a single branch without degradation |
| **v1.0** | 2026-09-04 | • Recipe / BOM-based automatic stock deduction on each sale<br>• Role-based access: Owner (full) and Manager (operational) permission levels<br>• Dark / light theme toggle<br>• Advanced date-range filter + category filter bar across all views<br>• Azure App Service / Container Apps production deployment with environment-separated configs<br>• Pagination (offset/limit) on product list, stock movements, and sales records | • ≥ 80% of active Owner/Manager users open the dashboard ≥ 3 times per week (measured over a 4-week window)<br>• BOM-based stock deductions reduce manual stock adjustment entries by ≥ 50%<br>• Zero critical P0 bugs open for > 48 hours in production |
| **v2.0** | 2026-12-04 | • PDF and Excel report export (day-end, monthly P&L, stock status)<br>• Year-over-year and period-over-period comparison charts<br>• Audit log: who changed what and when (all data-mutation actions)<br>• Basic supplier / purchase-order tracking (GRN creation, invoice matching)<br>• Performance hardening: query optimisation, index review, response-time SLA enforcement | • Monthly P&L export generates a ready-to-share PDF in ≤ 10 seconds<br>• All data mutations traceable in audit log with user, timestamp, and delta<br>• Supplier GRN workflow reduces manual stock-entry time by ≥ 30% vs. v1.0 baseline |

**Milestone rationale:**
- **MVP (3 months, by 2026-06-04):** Covers the complete core loop — data entry, stock alerts, P&L, and the ≤ 2-minute day-end report. Validates whether users will adopt the product.
- **v1.0 (3 months, by 2026-09-04):** Adds BOM-based auto-deduction and role access once usage patterns are confirmed; targets the 80%/3x-per-week engagement criterion.
- **v2.0 (3 months, by 2026-12-04):** Adds export, audit trail, and supplier workflow only after v1.0 data proves what operators actually need beyond the core loop.

---

## Sprint Plan

### Sprint 1 — Foundation & Auth (Weeks 1–2)

**Goals**
- Scaffold project: Next.js frontend + backend + PostgreSQL/SQLite, Docker Compose, GitHub Actions pipeline (test → build → deploy to dev)
- Implement user authentication: login, role-based access (owner, manager), session management
- Build Product & Category CRUD: name, sale price, unit cost, category; paginated list view (offset/limit)

**Definition of Done**
- CI pipeline passes on every push to `main`; `docker compose up` produces a working dev environment with no manual steps
- Owner and manager roles can log in; unauthenticated routes redirect to login
- Products can be created, updated, and listed via API and UI; pagination works correctly on the product list

---

### Sprint 2 — Sales Entry, Stock Movement & CSV Import (Weeks 3–4)

**Goals**
- Manual sales entry: record product, quantity, date/time; filterable list with day/week/month filters and category breakdown
- Stock entry/exit records: incoming stock and consumption tracking; configurable critical-stock threshold with visible alert
- CSV/Excel bulk import for products, stock entries, and sales — single fixed template per entity; row-level error report (rejected rows + reason); 20 MB limit enforced

**Definition of Done**
- Sales recorded manually are retrievable with correct totals per product across all date filters
- Stock movements (in/out) are persisted; a low-stock alert appears in the UI when stock falls below the configured threshold
- CSV import rejects invalid rows with a downloadable error report; valid rows are saved; files over 20 MB are blocked

---

### Sprint 3 — Expenses, P&L & KPI Dashboard (Weeks 5–6)

**Goals**
- Expense module: manual entry with category (rent, utilities, wages, materials), date, and amount
- Net profit calculation: Revenue − COGS (stock entries × unit cost) − Expenses; gross margin visible per product
- KPI dashboard: summary cards + pie chart (expense distribution) + trend chart (revenue/profit by day/week/month); date-range and category filters update all widgets

**Definition of Done**
- Expense entries appear in P&L; net profit matches manual cross-check for a provided test dataset
- Gross profit per product is accurate: cross-validated against stock entries + sales for ≥ 5 test products with 0 discrepancy
- Dashboard renders cards, pie chart, and trend chart; all widgets respond correctly to filter changes

---

### Sprint 4 — Reporting, Mobile Polish & Production Deploy (Weeks 7–8)

**Goals**
- EOD (end-of-day) report: filterable by date range and category; generation time ≤ 2 minutes for ≥ 200 sales rows
- Responsive layout audit and fixes for critical screens (EOD report, stock alerts, KPI dashboard) on 375 px–768 px viewports; optional dark/light theme toggle
- Production deployment to Azure App Service or Container Apps with dev/prod environment separation; smoke-test checklist executed against prod

**Definition of Done**
- EOD report renders in under 2 minutes confirmed with ≥ 200-row test dataset
- Critical screens pass visual review on 375 px (mobile) and 768 px (tablet) viewports; no horizontal scroll or overflow
- Prod environment live; GitHub Actions deploys to prod on merge to `main`; 3–10 test users can log in and access role-appropriate views without error

---

**Sequencing rationale:**
- S1 unblocks everything — no feature work without auth + product model
- S2 validates the core data-entry loop before analytics is built on top
- S3 delivers business value (P&L, dashboard) only after clean data exists
- S4 hardens for production and validates the primary success metric (EOD report ≤ 2 min)

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Kullanıcı benimseme başarısızlığı — manuel veri girişi yükü nedeniyle owner/manager dashboard'u terk eder | Yüksek | Yüksek | Onboarding'de CSV import'u ön plana çıkar; ilk hafta günlük giriş akışını 3 adımın altında tut; haftalık kullanım oranını (≥%80) sprint review'da izle |
| Kapsam kayması — stok reçetesi, çoklu şube veya POS entegrasyonu talepleri MVP'ye sızar | Yüksek | Orta | Non-goals listesini yazılı olarak paydaşlara onaylat; her sprint backlog refinement'ında yeni talepleri "post-MVP" etiketiyle park et |
| Veri tutarsızlığı — manuel giriş hatası veya CSV import uyuşmazlığı nedeniyle stok ve satış kayıtları örtüşmez | Orta | Yüksek | Satır bazlı import hata raporu (reject + reason) MVP'de zorunlu; ürün bazlı brüt kâr tutarlılık kontrolü otomatik test ile kapsanır |
| Teknik kapasite riski — 1 fullstack geliştirici hastalık/ayrılma durumunda proje durma noktasına gelir | Orta | Yüksek | Managed servisler (Azure App Service, hosted PostgreSQL) seç; Docker ile ortam taşınabilirliğini garanti al; kritik karar ve konfigürasyonları README + ADR ile dokümante et |
