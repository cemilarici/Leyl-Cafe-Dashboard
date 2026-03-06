<!-- AGENT_CONTEXT
generated_by: "agentforge"
dependencies: []
token_estimate: 2698
-->

# LeylCafeDashboard — Product Requirements Document

| Field   | Value          |
|---------|----------------|
| Version | 0.1.0     |
| Date    | 2026-03-04        |
| Status  | Draft      |
| Author  | AgentForge      |

---

## 1. Executive Summary

Küçük-orta ölçekli kafe işletmeleri satış, stok ve gider verilerini defter, Excel ve POS gibi birbirinden kopuk sistemlerde tuttuğu için gün sonu kârlılık ve stok durumu ancak saatler sonra—çoğu zaman kayıp gerçekleştikten sonra—netleşiyor. Leyl Café Dashboard, bu verileri tek bir web arayüzünde birleştirerek işletme sahibine ve şube müdürüne ürün bazlı satış, gerçek zamanlı stok uyarıları ve net kâr görünümünü 2 dakika içinde sunan operasyonel bir raporlama aracıdır. Rakip muhasebe veya ERP çözümlerinin aksine kurulum karmaşıklığı olmadan çalışır: manuel CSV/Excel import ile mevcut iş akışına entegre olur, tam POS değişimi gerektirmez ve kasa başında telefon veya tabletle kullanılabilecek kadar sade bir arayüz sunar.

---

## 2. Problem Statement

1. **Fragmented data silos across sales channels**: Kafe sahibi/şube müdürü, satış verilerini POS, defter ve Excel gibi birbirinden bağımsız sistemlerde yönetmektedir. Gün sonu kârlılık hesabı manuel birleştirme gerektirdiğinden ortalama 15-30 dakika sürmekte; hata oranı yüksektir. Mevcut çözüm: manuel hesap-kitap veya birden fazla Excel dosyası.

2. **Stok tükenmesinin geç fark edilmesi**: İşletme yöneticisi, kritik stok seviyelerini gerçek zamanlı izleyemediğinden haftada ortalama 3+ kez stok yetersizliği kaynaklı satış kaybı yaşanmaktadır. Mevcut çözüm: gözle kontrol veya gün sonu sayım; uyarı mekanizması yoktur.

3. **Ürün bazlı brüt kâr görünürlüğünün olmaması**: Kafe sahibi, hangi ürünün gerçekte kârlı olduğunu bilmemektedir çünkü stok girişleri (maliyet) ile satış verileri hiçbir zaman sistematik olarak eşleştirilmemektedir. Etki: düşük kârlı ürünler menüde kalmaya devam eder, fiyatlama kararları sezgiye dayanır.

4. **Gider kalemlerinin dağınık takibi**: Kira, elektrik, malzeme ve personel ücretleri farklı kanallardan (banka, nakit, fatura) girilmekte; tek bir gelir-gider özeti oluşturmak için manuel konsolidasyon yapılmaktadır. Sonuç: maliyet sapmaları haftalarca fark edilmeden devam edebilmektedir.

5. **Periyodik raporların yokluğu nedeniyle geç karar alma**: Yönetici, haftalık veya aylık trend analizine erişemediğinden operasyonel kararlar (menü değişikliği, personel düzenlemesi, ek sipariş) reaktif biçimde alınmaktadır. Ölçülebilir etki: büyüme fırsatları ve maliyet tasarrufları gözden kaçmaktadır.

---

## 3. Target Audience

**Primary Persona**

Name: Ayşe Kara
Role: Kafe Sahibi / Operasyon Yöneticisi
Age: 38
Goal: Günün sonunda kâr/zarar durumunu, hangi ürünün ne kadar sattığını ve stok kritik noktalarını 5 dakika içinde görmek; yalnızca sorun varsa müdahale etmek.
Frustration: Satış rakamları POS'ta, malzeme giderleri cepte defterde, personel ücretleri Excel'de — ayın sonunda hepsini birleştirmeye çalışırken saatler geçiyor, yine de rakamlar tutmuyor.
Day-in-the-life: Ayşe sabah 08:30'da dükkana gelir, kasiyerin bıraktığı el yazılı stok notunu okur ve önceki günün satışlarını POS'tan tek tek not alır. Akşam eve dönerken telefonda o günkü gerçek kârı hâlâ bilmez, çünkü elektrik faturası ve nakliye masrafını henüz Excel'e işlememiştir.

---

## 4. User Stories

**US-001:** As a cafe owner, I want to view product-based sales totals filtered by day, week, and month,
so that I can identify top-selling items and track revenue trends without manually aggregating data from multiple sources.

**Acceptance Criteria:**
- [ ] Dashboard displays total sales count and revenue per product for the selected date range (day / week / month toggle)
- [ ] Sales are grouped by top-level category (e.g., beverages, food) with drill-down to individual products
- [ ] Filtering by category narrows both the table and the summary KPI cards simultaneously
- [ ] Page loads filtered results within 3 seconds for up to 10,000 sales records

---

**US-002:** As a cafe manager, I want to receive critical stock-level alerts and record stock entries and exits,
so that I can prevent stockout-driven lost sales before they occur.

**Acceptance Criteria:**
- [ ] Each product has a configurable minimum stock threshold; products below threshold appear in a dedicated alert list on the dashboard
- [ ] Manager can record a stock entry (supplier delivery) or manual exit with quantity, unit, date, and optional note
- [ ] Current stock balance per product is derived from initial quantity + entries − exits and displayed on the stock screen
- [ ] Alert list is visible on the main dashboard without requiring navigation to the stock sub-page

---

**US-003:** As a cafe owner, I want to see a net profit summary with an expense breakdown chart,
so that I can understand where money is being lost and make informed cost-cutting decisions.

**Acceptance Criteria:**
- [ ] Owner can enter expense records categorized as rent, utilities, materials, or wages with amount and date
- [ ] Dashboard shows: total revenue, total expenses (per category), and net profit for the selected period
- [ ] A pie chart renders expense distribution by category; a trend line shows net profit week-over-week for the last 8 weeks
- [ ] Gross profit per product (selling price minus recipe/input cost) is available as a sortable table column

---

**US-004:** As a cafe manager, I want to import sales and stock-entry records via a CSV/Excel file,
so that I can bulk-load historical or POS-exported data without re-entering each row manually.

**Acceptance Criteria:**
- [ ] System accepts a single prescribed CSV/Excel template (≤ 20 MB) for each import type: products, stock entries, sales
- [ ] After upload, a row-level validation report is returned listing each rejected row with a specific rejection reason (e.g., "unknown product code", "negative quantity")
- [ ] Valid rows are committed; invalid rows are skipped without rolling back the entire import
- [ ] Import history log shows filename, timestamp, total rows, accepted count, and rejected count

---

**US-005:** As a cafe owner, I want to generate an end-of-day summary report,
so that I can review the day's performance and close out operations in under 2 minutes.

**Acceptance Criteria:**
- [ ] A single "End of Day" view aggregates: total sales revenue, transaction count, top 5 products by revenue, net cash position (revenue − day's expenses), and any active stock alerts — all for the current calendar day
- [ ] Report is accessible from the main navigation in one tap/click and renders completely within 3 seconds
- [ ] Owner can export the summary as a PDF or share a read-only link valid for 24 hours

---

## 5. Success Criteria

| Metric | Current | Target (3mo) | How Measured |
|--------|---------|--------------|--------------|
| Gün sonu raporu oluşturma süresi | ~15 dk (manuel) | ≤ 2 dakika | Dashboard'da rapor yüklenme timestamp'i |
| Stok tükenmesi kaynaklı satış kaçırma olayı (haftalık) | ~3 olay/hafta | ≤ 1 olay/hafta | Kritik stok uyarısı tetiklenme + yönetici kaydı |
| Ürün bazlı brüt kâr raporu tutarlılığı | Ölçülemiyor | %100 eşleşme (stok girişi + satış) | Otomatik stok mutabakat kontrolü; hata sayısı = 0 |
| Haftalık aktif kullanıcı oranı (owner/manager) | 0 | ≥ %80 kullanıcı haftada ≥ 3 oturum | Oturum logları / analytics |
| CSV/Excel import hata tespit oranı | Ölçülemiyor | Satır bazlı hata raporu her import'ta üretilir | Import işlemi sonrası reject raporu varlığı |

---

## 6. Non-Goals

- **Muhasebe / E-Fatura / E-Arşiv Entegrasyonu** — Yasal muhasebe yükümlülükleri kapsam dışıdır; dashboard yalnızca iç operasyonel kârlılık takibi sunar.
- **POS Sistemi Değişimi veya Tam Entegrasyonu** — Mevcut POS cihazlarının yerini almaz; satış verisi manuel veya CSV import ile girilir.
- **Çok Şubeli / Franchise Yönetimi** — MVP tek şube operasyonuna odaklanır; çapraz şube karşılaştırması v1 dışındadır.
- **ERP / Tedarik Zinciri Modülü** — Otomatik sipariş oluşturma, tedarikçi yönetimi ve satın alma onay akışları kapsam dışıdır.
- **Gerçek Zamanlı (WebSocket) Veri Akışı** — Anlık güncelleme zorunlu değildir; manuel yenileme veya polling yeterlidir, canlı akış v1'e eklenmez.
- **Gelişmiş Kullanıcı İzinleri / Rol Yönetimi** — MVP'de yalnızca owner ve manager rolleri tanımlanır; granüler izin matrisi veya çok katmanlı hiyerarşi eklenmez.
- **Mobil Native Uygulama (iOS / Android)** — Responsive web arayüzü mobil kullanımı karşılar; ayrı native uygulama geliştirmesi v1 kapsamında değildir.
- **Otomatik Stok Düşüm / Reçete Motoru** — Satış gerçekleştiğinde stoktan otomatik malzeme düşümü v1'de yer almaz; stok hareketleri manuel veya CSV ile kaydedilir.

---

## 7. Constraints & Assumptions

## Constraints

**Technical:**
- Stack: Web app (frontend + REST API + DB); SQLite (dev/local) or PostgreSQL (prod); hosted on Azure App Service or Container Apps
- No real-time/WebSocket requirement; polling or manual refresh is sufficient
- Pagination via offset/limit for product lists, stock movements, and sales records
- File import limited to CSV/Excel (single template per entity type), max 20 MB per upload, with row-level error reporting (reject + reason)
- No external POS, accounting, or ERP integration in MVP; all data entry is manual or via import
- Containerized with Docker; CI/CD via GitHub Actions (test → build → deploy) with dev/prod environment separation

**Resource:**
- Team: 1 fullstack developer, optionally paired with 1 data/BI specialist; managed cloud services preferred to reduce ops overhead
- Single branch/location only; no multi-tenant or multi-site architecture required for MVP
- Active user base: 3–10 users (owner, manager, staff roles)

**Business:**
- MVP scope is one café; franchise or multi-branch expansion is explicitly out of scope
- No Turkish e-invoice (e-fatura), e-archive (e-arşiv), or full accounting compliance required
- No external regulatory integrations (tax authority, EFPOS networks) in MVP

---

## Assumptions

1. Users will perform all data entry manually (sales, stock entries, expenses) until a POS integration is scoped in a future phase; data quality depends on disciplined manual input.
2. A single, standardized CSV/Excel import template per entity (products, stock movements, sales) is sufficient and users can be trained to use it without custom format support.
3. The café operates as a single legal entity with one location; all financial calculations (revenue, cost, gross profit) are aggregated at that level.
4. End-of-day reporting latency of up to 5 minutes is acceptable; no sub-minute data freshness is required.
5. The owner/manager has sufficient authority to define product recipes and cost inputs accurately enough to produce trustworthy gross-margin calculations from day one.
