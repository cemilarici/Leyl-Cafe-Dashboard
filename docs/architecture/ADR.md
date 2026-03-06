<!-- AGENT_CONTEXT
generated_by: "agentforge"
dependencies: ["docs\planning\PRD.md", "docs\planning\ROADMAP.md"]
token_estimate: 3573
-->

# LeylCafeDashboard — Architecture Decision Records

| Field   | Value      |
|---------|------------|
| Version | 0.1.0 |
| Date    | 2026-03-04    |
| Status  | Draft  |

---

## Overview

Three foundational architectural decisions — SQLite as the database, a FastAPI/Python backend, and a Next.js frontend — were selected to serve a 3–10 user, single-branch café dashboard that demands zero operational overhead, simple deployment, and a small fullstack team. These choices directly reflect PRD constraints: relational integrity for sales-stock-cost reconciliation, file import pipelines (CSV/Excel up to 20MB), offset/limit pagination, and a responsive KPI-first UI deployable via GitHub Actions to Azure App Service or Container Apps.

---

## Decisions

### ADR-001: Database Selection
**Status:** Accepted
**Date:** 2026-03-04
**Context:** The PRD specifies single-branch MVP with 3-10 concurrent users, manual data entry, and no real-time requirements. Team is small (1 fullstack, possibly +1 BI), so operational overhead must be minimized. Transactional integrity is required for stock-deduction-on-sale and cost reconciliation (Success Criterion #3).
**Decision:** Use SQLite 3 with WAL (Write-Ahead Logging) mode. Schema covers: products, categories, recipes, stock_movements, sales, sale_items, expenses, and users. Database file stored at `data/leylcafe.db`; persisted via Docker volume mount.
**Consequences:**
- Positive: Zero infrastructure cost; no separate DB server or managed service needed; single file backup/restore; Alembic + aiosqlite integrates cleanly with FastAPI async stack; ACID transactions with WAL handle 3-10 concurrent users without lock contention
- Negative: Not suitable if concurrent write load exceeds single-branch scale; no built-in JSON aggregation functions (mitigated by Python-side aggregation in report endpoints)
**Alternatives considered:** PostgreSQL — considered for ACID guarantees and Azure Flexible Server managed service, but $15-30/mo overhead and DBA configuration burden are disproportionate for a 3-10 user single-branch MVP; MongoDB — rejected because relational joins across sales/stock/expenses are core to every report query.

---

### ADR-002: Backend Framework Selection
**Status:** Accepted
**Date:** 2026-03-04
**Context:** Team expertise is "typical small team: 1 fullstack." The PRD requires CSV/Excel import with row-level error reporting, offset/limit pagination, and scheduled or on-demand report generation. Framework must support managed Azure deployment and Docker containerization (CI constraint).
**Decision:** Use FastAPI (Python 3.12) with SQLAlchemy 2.0 (async) and Alembic for migrations. Background tasks (CSV processing, stock alert checks) handled via FastAPI BackgroundTasks for MVP; upgrade to Celery only if job queue exceeds 30-second P95.
**Consequences:**
- Positive: Auto-generated OpenAPI docs accelerate frontend integration; async I/O handles file-upload processing without blocking; Python ecosystem covers pandas/openpyxl for Excel import natively; single language with BI/data work if team has data engineer
- Negative: Python is slower than Go/Node for CPU-bound work — acceptable at 3-10 users but becomes a ceiling above ~200 RPS; FastAPI's dependency injection model has a learning curve for junior developers
**Alternatives considered:** Node.js + Express — rejected because Python's data processing libraries (pandas, openpyxl) are superior for the CSV/Excel import requirement and BI reporting; Django — rejected because Django ORM's sync-first model conflicts with async file upload handling and adds unnecessary admin/ORM overhead for a lean API.

---

### ADR-003: Authentication Strategy
**Status:** Accepted
**Date:** 2026-03-04
**Context:** PRD defines two roles: Owner and Manager (3-10 users total). Non-goals explicitly exclude complex ERP/multi-tenant scenarios. No SSO or social login requirement exists. Team is small; maintaining a full identity provider adds ops burden disproportionate to scale.
**Decision:** Use JWT-based authentication (RS256, 15-minute access token + 7-day refresh token stored in HttpOnly cookie) with role claims (`owner`, `manager`) embedded in the token. User management (create/reset) is handled via an admin-only API endpoint. No external identity provider for MVP.
**Consequences:**
- Positive: Zero external service dependency; stateless tokens scale horizontally without session store; HttpOnly cookie mitigates XSS token theft; RS256 allows future service-to-service verification
- Negative: Token revocation requires a server-side denylist (Redis or DB table) — must be implemented from day one for logout and role-change scenarios, adding one table/cache dependency; rotating refresh tokens requires careful client-side handling
**Alternatives considered:** Azure Active Directory B2C — rejected because it introduces tenant configuration complexity and per-MAU cost for a fixed 3-10 user audience; session-based auth — rejected because stateful sessions complicate horizontal scaling on Container Apps and require sticky sessions or external session store.

---

### ADR-004: Frontend Framework Selection
**Status:** Accepted
**Date:** 2026-03-04
**Context:** PRD mandates responsive layout optimized for tablet/phone (cashier at counter), KPI cards + table + chart layout, dark/light theme toggle, and date-range + category filter bar. Team is 1 fullstack developer. Build pipeline is GitHub Actions targeting Azure Static Web Apps or App Service static files.
**Decision:** Use Next.js 14 (App Router) with TypeScript, Tailwind CSS for styling, Recharts for in-app charts, and React Hook Form + Zod for form validation. Static export or Node runtime on Azure App Service depending on whether SSR is needed for initial load performance.
**Consequences:**
- Positive: App Router enables per-route loading states and server components for initial data fetch, reducing client bundle size; Tailwind utility classes accelerate responsive layout without custom CSS; Recharts is lightweight and sufficient for bar/line/pie charts at this data volume; TypeScript catches API contract mismatches at compile time
- Negative: Next.js App Router has higher learning curve than Pages Router and community patterns are still stabilizing (as of 2026); Recharts has limited customization for complex annotation scenarios — acceptable for MVP bar/line/pie but must be revisited for advanced BI views
**Alternatives considered:** React + Vite (SPA) — rejected because lack of SSR means longer time-to-first-meaningful-paint on mobile connections, which conflicts with the "2-minute end-of-day report" success criterion; Vue 3 + Nuxt — rejected because team expertise assumption defaults to React ecosystem for fullstack JavaScript developers.

---

### ADR-005: API Style Selection
**Status:** Accepted
**Date:** 2026-03-04
**Context:** The dashboard requires filtered list endpoints (sales by date/category), aggregation endpoints (daily P&L, stock summary), and a file upload endpoint for CSV/Excel import. Client is a single Next.js frontend. No third-party API consumers are planned for MVP.
**Decision:** Use REST over HTTPS with resource-oriented routes (`/api/v1/sales`, `/api/v1/stock/movements`, `/api/v1/reports/daily-pnl`). Versioning via URL prefix (`/v1`). Aggregation endpoints are dedicated query endpoints, not generic filter chains.
**Consequences:**
- Positive: REST is universally understood, requires no client-side query library, and maps cleanly to FastAPI route decorators; dedicated report endpoints allow query optimization (materialized views or indexed CTEs) without exposing raw table structure; multipart file upload is natively supported in REST without workarounds
- Negative: Report endpoints risk proliferating into a non-standard RPC surface if discipline is not maintained — enforce by requiring ADR amendment for any endpoint that does not map to a resource or named report
**Alternatives considered:** GraphQL — rejected because the client is a single known consumer (no need for field selection flexibility), and GraphQL adds resolver complexity for aggregation queries that are better handled as optimized SQL views; tRPC — rejected because it requires TypeScript on both client and server end-to-end, creating a coupling that complicates future API consumers (e.g., a mobile app or third-party integration).

---

### ADR-006: Hosting and Deployment Strategy
**Status:** Accepted
**Date:** 2026-03-04
**Context:** Infrastructure preference is Azure App Service or Container Apps. Team uses GitHub Actions for CI/CD with dev/prod environment separation. Docker is required for development portability. Scale expectation is 3-10 users with no large-scale growth target for MVP.
**Decision:** Deploy backend (FastAPI) and frontend (Next.js, Node runtime) as separate Docker containers on Azure Container Apps (Consumption plan). SQLite database file stored in a persistent Azure Files volume mounted at `/app/data/`. GitHub Actions pipeline: `test → build → push to ACR → deploy to Container Apps` with environment-specific secrets. Dev environment uses `docker-compose` with volume-mounted SQLite file.
**Consequences:**
- Positive: Container Apps Consumption plan scales to zero, minimizing cost at low traffic; separate containers allow independent scaling and deployment of frontend/backend; ACR + Container Apps is a first-class Azure integration with managed TLS and ingress; `docker-compose` parity ensures dev/prod environment consistency
- Negative: Container Apps cold-start latency (2-5 seconds from zero) is perceptible if usage is infrequent — mitigate with minimum replica count of 1 if budget allows (~$15/mo); managing two container registrations and two Container Apps increases CI/CD configuration surface area compared to a monolithic App Service deploy
**Alternatives considered:** Azure App Service (Web Apps for Containers) — rejected because it lacks native scale-to-zero on the Basic tier and costs more at idle than Container Apps Consumption; single-container monolith (serve Next.js static files from FastAPI) — rejected because it couples frontend and backend deployment cycles, blocking independent hotfixes and violating separation of concerns that the team will need as the product grows.

---

## Technology Stack Summary

I need write permission to `docs/architecture/ADR.md`. Please approve the file write, then I'll apply the changes.

Here is exactly what will be written to replace the broken `## Technology Stack Summary` and `## Rejected Alternatives` sections:

---

**Technology Stack Summary table (7 rows):**

| Layer | Technology | Version | Reason |
|---|---|---|---|
| Backend | Python + FastAPI | latest stable | Async I/O for CSV/Excel streaming; Pydantic validation at import boundary; `openpyxl`/`pandas` for row-level error reporting; Azure App Service native Python runtime |
| Database | SQLite 3 (WAL mode) | 3.45+ | ACID atomicity for stock + sales; zero-cost, zero-ops; single file backup; FK referential integrity across products → recipes → stock → sales; aiosqlite for async FastAPI |
| Frontend | Next.js + TypeScript + Tailwind CSS + Recharts + shadcn/ui | Next.js 14 (App Router) | Server components reduce KPI bundle; Tailwind `dark:` variants for theme; copy-owned shadcn/ui; Recharts bar/line/pie covers PRD chart requirements |
| Auth | Stateless JWT (access + refresh, `httpOnly` cookies) | — | Zero external dependency; role claims (`owner`/`manager`) in payload; XSS-safe cookie storage; RBAC via single `require_role` FastAPI dependency |
| API | REST + JSON / HTTPS (OpenAPI 3.1 auto-generated by FastAPI) | OpenAPI 3.1 | Mature tooling; `offset`/`limit` matches PRD spec; `multipart/form-data` on `/import` isolates file logic; composite `/dashboard/summary` prevents over-fetching |
| DevOps / CI | GitHub Actions + Docker + Azure Container Registry | — | `test → build → push → deploy` pipeline; OIDC federation eliminates long-lived secrets; Docker ensures dev/prod parity |
| Hosting | Azure App Service B2 tier + Deployment Slots | — | Zero-downtime slot swap; managed TLS; ~$75/mo predictable cost for 3–10 users; Always On mitigates cold starts; Container Apps upgrade path as documented technical debt |

**Rejected Alternatives section** will cover all six ADRs with per-ADR tables listing each rejected option and the concrete rejection reason derived from the ADR context.

---

## Rejected Alternatives

The permission prompt should appear — please approve the write to `docs/architecture/ADR.md`. The edit replaces the placeholder "Rejected Alternatives" section with this table:

| Alternative | Why Considered | Why Rejected |
|---|---|---|
| **PostgreSQL** (vs. SQLite — ADR-001) | ACID guarantees; Azure Flexible Server managed service; JSON columns | $15-30/mo minimum cost; requires separate DB container or managed service; DBA overhead disproportionate for 3-10 user single-branch MVP |
| **Django** (vs. FastAPI — ADR-002) | Batteries-included; built-in ORM/admin; large hiring pool | Admin panel and sync-by-default view layer are dead weight in an API-first architecture; async Django negates the simplicity argument; admin panel diverges from product UI over time |
| **React + Vite SPA** (vs. Next.js 14 — ADR-004) | Simpler mental model; faster local dev; no server/client component boundary | Empty-shell SPA causes waterfall fetches on mobile/tablet at the register; server components pre-render KPI aggregates in one round-trip — one-time learning cost vs. recurring UX penalty |
| **GraphQL** (vs. REST — ADR-005) | Solves dashboard over-fetching in one query; strongly typed schema; popular in React ecosystem | Single first-party client doesn't justify resolver complexity or N+1 risk; over-fetching solved by two composite REST endpoints; introspection adds attack surface with no external consumers |
| **Vercel + Railway** (vs. Azure App Service — ADR-006) | Lowest-friction deployment; generous free tiers; Railway supports Docker natively | Splits billing/monitoring across providers; cross-origin latency between Vercel edge and Railway US-east; PRD explicitly states Azure preference; Railway free tier cold-starts under day-end report load spike |

Once you approve the file write, the section will be applied. If you'd like me to adjust any row's framing, let me know.
