"use client";

import { useState } from "react";
import { useDashboard } from "@/hooks/useDashboard";
import { useProducts } from "@/hooks/useProducts";
import { useIngredients } from "@/hooks/useIngredients";
import { KPICard } from "@/components/ui/KPICard";
import { formatCurrency, formatPercent } from "@/lib/utils";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function monthStartStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}
function weekStartStr() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + 1);
  return d.toISOString().slice(0, 10);
}
function lastMonthRange(): [string, string] {
  const d = new Date();
  const first = new Date(d.getFullYear(), d.getMonth() - 1, 1);
  const last = new Date(d.getFullYear(), d.getMonth(), 0);
  return [first.toISOString().slice(0, 10), last.toISOString().slice(0, 10)];
}

const PRESETS = [
  { label: "Bugün",       from: () => todayStr(),      to: () => todayStr() },
  { label: "Bu Hafta",    from: () => weekStartStr(),   to: () => todayStr() },
  { label: "Bu Ay",       from: () => monthStartStr(),  to: () => todayStr() },
  { label: "Geçen Ay",    from: () => lastMonthRange()[0], to: () => lastMonthRange()[1] },
];
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, Legend,
} from "recharts";

const PALETTE = ["#CB6B2C", "#4A7A5A", "#E8946A", "#8B7355", "#C44A35", "#6B9080", "#D4A373"];

const PIE_LABEL = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: {
  cx: number; cy: number; midAngle: number;
  innerRadius: number; outerRadius: number; percent: number;
}) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central"
      style={{ fontSize: 11, fontWeight: 600 }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function DashboardPage() {
  const [dateFrom, setDateFrom] = useState(monthStartStr());
  const [dateTo, setDateTo] = useState(todayStr());

  const { data, isLoading, error } = useDashboard(dateFrom, dateTo);
  const { data: productsData } = useProducts({ page_size: 200, is_active: true });
  const { data: ingredients } = useIngredients();

  const pieData = (data?.category_breakdown ?? []).map((r) => ({
    name: r.category,
    value: r.revenue,
  }));

  return (
    <div className="p-4 md:p-8 space-y-6 page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "var(--espresso)" }}>
            Genel Bakış
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
            {data ? `${data.date_from} — ${data.date_to}` : "Yükleniyor..."}
          </p>
        </div>

        {/* Date Filter */}
        <div className="flex flex-col gap-2 sm:items-end">
          {/* Preset buttons */}
          <div className="flex gap-1 flex-wrap">
            {PRESETS.map((p) => {
              const active = dateFrom === p.from() && dateTo === p.to();
              return (
                <button
                  key={p.label}
                  onClick={() => { setDateFrom(p.from()); setDateTo(p.to()); }}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
                  style={{
                    background: active ? "var(--amber)" : "var(--cream)",
                    color: active ? "#fff" : "var(--muted)",
                    border: `1px solid ${active ? "var(--amber)" : "var(--border)"}`,
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
          {/* Custom date range */}
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input"
              style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem", width: 130 }}
            />
            <span className="text-xs" style={{ color: "var(--muted)" }}>—</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input"
              style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem", width: 130 }}
            />
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center h-28">
          <span className="text-sm blink" style={{ color: "var(--muted)" }}>Yükleniyor...</span>
        </div>
      ) : error || !data ? (
        <div className="h-28 flex items-center justify-center">
          <p className="text-sm" style={{ color: "var(--danger)" }}>Veri yüklenemedi.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger">
          <KPICard title="Toplam Gelir" value={formatCurrency(data.total_revenue)}
            sub={`${data.sale_count} satış`} accent="amber" icon="◈" />
          <KPICard title="Brüt Kâr" value={formatCurrency(data.gross_profit)}
            sub={formatPercent(data.gross_margin_pct) + " marj"} accent="sage" icon="◎" />
          <KPICard title="Toplam Gider" value={formatCurrency(data.total_expenses)}
            sub={`${data.expense_count} kayıt`} accent="muted" icon="◉" />
          <KPICard title="Net Kâr" value={formatCurrency(data.net_profit)}
            sub={data.net_profit >= 0 ? "Kârlı dönem" : "Zararlı dönem"}
            accent={data.net_profit >= 0 ? "sage" : "danger"}
            icon={data.net_profit >= 0 ? "◱" : "◧"} />
        </div>
      )}

      {/* Charts row */}
      {data && <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold mb-5"
            style={{ color: "var(--espresso)", fontFamily: "var(--font-body)" }}>
            Kategori Bazlı Gelir
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.category_breakdown ?? []} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <XAxis dataKey="category"
                tick={{ fontSize: 11, fill: "#8B7355", fontFamily: "var(--font-body)" }}
                tickLine={false} axisLine={false} />
              <YAxis
                tick={{ fontSize: 10, fill: "#8B7355", fontFamily: "monospace" }}
                tickLine={false} axisLine={false}
                tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value) => [formatCurrency(Number(value)), "Gelir"]}
                contentStyle={{ background: "#16100B", border: "none", borderRadius: 10, color: "#FBF5EC", fontSize: 12 }}
                labelStyle={{ color: "#E8946A", fontWeight: 600 }}
                cursor={{ fill: "rgba(203,107,44,0.06)" }}
                isAnimationActive={false} />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                {(data?.category_breakdown ?? []).map((_, i) => (
                  <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold mb-5"
            style={{ color: "var(--espresso)", fontFamily: "var(--font-body)" }}>
            Gelir Dağılımı
          </h2>
          {pieData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px] text-sm"
              style={{ color: "var(--muted)" }}>
              Henüz satış verisi yok
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="45%"
                  outerRadius={80}
                  innerRadius={40}
                  dataKey="value"
                  labelLine={false}
                  label={PIE_LABEL}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [formatCurrency(Number(value)), "Gelir"]}
                  contentStyle={{ background: "#16100B", border: "none", borderRadius: 10, color: "#FBF5EC", fontSize: 12 }}
                  labelStyle={{ color: "#E8946A", fontWeight: 600 }}
                  isAnimationActive={false} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, color: "#8B7355", paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>}

      {/* Stock Status */}
      {productsData && productsData.items.length > 0 && (() => {
        const all = productsData.items;
        const withThreshold = all.filter(p => p.low_stock_threshold > 0);
        const lowStock = withThreshold.filter(p => p.stock_count <= p.low_stock_threshold);
        const stockChartData = all
          .filter(p => p.low_stock_threshold > 0)
          .sort((a, b) => {
            const ra = a.stock_count / (a.low_stock_threshold || 1);
            const rb = b.stock_count / (b.low_stock_threshold || 1);
            return ra - rb;
          })
          .slice(0, 10)
          .map(p => ({
            name: p.name.length > 14 ? p.name.slice(0, 13) + "…" : p.name,
            stok: Number(p.stock_count),
            esik: Number(p.low_stock_threshold),
            low: p.stock_count <= p.low_stock_threshold,
          }));

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Low stock warnings */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold" style={{ color: "var(--espresso)" }}>
                  Stok Uyarıları
                </h2>
                {lowStock.length > 0 && (
                  <span className="badge-danger animate-blink">{lowStock.length} kritik</span>
                )}
              </div>
              {lowStock.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 gap-2">
                  <span className="text-2xl">✓</span>
                  <p className="text-sm" style={{ color: "var(--sage)" }}>Tüm stoklar yeterli</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lowStock.slice(0, 6).map(p => (
                    <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded-lg"
                      style={{ background: "var(--danger-light)" }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--danger)" }}>{p.name}</p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>{p.category?.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold font-mono animate-blink" style={{ color: "var(--danger)" }}>
                          {Number(p.stock_count).toFixed(0)}
                        </p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>
                          min: {p.low_stock_threshold}
                        </p>
                      </div>
                    </div>
                  ))}
                  {lowStock.length > 6 && (
                    <p className="text-xs text-center pt-1" style={{ color: "var(--muted)" }}>
                      +{lowStock.length - 6} ürün daha
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Stock bar chart */}
            <div className="card p-5 lg:col-span-2">
              <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--espresso)" }}>
                Stok Seviyeleri {withThreshold.length > 0 && `(eşikli ${withThreshold.length} ürün)`}
              </h2>
              {stockChartData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-sm" style={{ color: "var(--muted)" }}>
                  Eşik değeri girilmiş ürün yok
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(140, stockChartData.length * 32)}>
                  <BarChart data={stockChartData} layout="vertical"
                    margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#8B7355" }}
                      tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" width={100}
                      tick={{ fontSize: 11, fill: "#16100B" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value, name) => [value, name === "stok" ? "Mevcut Stok" : "Min. Eşik"]}
                      contentStyle={{ background: "#16100B", border: "none", borderRadius: 10, color: "#FBF5EC", fontSize: 12 }}
                      labelStyle={{ color: "#E8946A", fontWeight: 600 }}
                      isAnimationActive={false} />
                    <Bar dataKey="stok" radius={[0, 4, 4, 0]} maxBarSize={18}>
                      {stockChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.low ? "#C44A35" : "#4A7A5A"} />
                      ))}
                    </Bar>
                    <Bar dataKey="esik" radius={[0, 4, 4, 0]} maxBarSize={18}
                      fill="rgba(139,115,85,0.2)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
              <div className="flex gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#4A7A5A" }} />
                  Yeterli stok
                </span>
                <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#C44A35" }} />
                  Kritik seviye
                </span>
                <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "rgba(139,115,85,0.2)" }} />
                  Min. eşik
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Ingredients Stock */}
      {ingredients && ingredients.length > 0 && (() => {
        const withThreshold = ingredients.filter(i => i.low_stock_threshold > 0);
        const lowStock = withThreshold.filter(i => i.stock_balance <= i.low_stock_threshold);
        const chartData = withThreshold
          .sort((a, b) => {
            const ra = a.stock_balance / (a.low_stock_threshold || 1);
            const rb = b.stock_balance / (b.low_stock_threshold || 1);
            return ra - rb;
          })
          .slice(0, 10)
          .map(i => ({
            name: i.name.length > 14 ? i.name.slice(0, 13) + "…" : i.name,
            stok: Number(i.stock_balance),
            esik: Number(i.low_stock_threshold),
            low: i.stock_balance <= i.low_stock_threshold,
          }));

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Low ingredient warnings */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold" style={{ color: "var(--espresso)" }}>
                  Hammadde Uyarıları
                </h2>
                {lowStock.length > 0 && (
                  <span className="badge-danger animate-blink">{lowStock.length} kritik</span>
                )}
              </div>
              {lowStock.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 gap-2">
                  <span className="text-2xl">✓</span>
                  <p className="text-sm" style={{ color: "var(--sage)" }}>Tüm hammaddeler yeterli</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lowStock.slice(0, 6).map(i => (
                    <div key={i.id} className="flex items-center justify-between py-2 px-3 rounded-lg"
                      style={{ background: "var(--danger-light)" }}>
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--danger)" }}>{i.name}</p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>{i.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold font-mono animate-blink" style={{ color: "var(--danger)" }}>
                          {Number(i.stock_balance).toFixed(2)}
                        </p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>
                          min: {i.low_stock_threshold}
                        </p>
                      </div>
                    </div>
                  ))}
                  {lowStock.length > 6 && (
                    <p className="text-xs text-center pt-1" style={{ color: "var(--muted)" }}>
                      +{lowStock.length - 6} malzeme daha
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Ingredient bar chart */}
            <div className="card p-5 lg:col-span-2">
              <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--espresso)" }}>
                Hammadde Seviyeleri {withThreshold.length > 0 && `(eşikli ${withThreshold.length} malzeme)`}
              </h2>
              {chartData.length === 0 ? (
                <div className="flex items-center justify-center h-40 text-sm" style={{ color: "var(--muted)" }}>
                  Eşik değeri girilmiş malzeme yok
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(140, chartData.length * 32)}>
                  <BarChart data={chartData} layout="vertical"
                    margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#8B7355" }}
                      tickLine={false} axisLine={false} />
                    <YAxis type="category" dataKey="name" width={100}
                      tick={{ fontSize: 11, fill: "#16100B" }} tickLine={false} axisLine={false} />
                    <Tooltip
                      formatter={(value, name) => [value, name === "stok" ? "Mevcut Stok" : "Min. Eşik"]}
                      contentStyle={{ background: "#16100B", border: "none", borderRadius: 10, color: "#FBF5EC", fontSize: 12 }}
                      labelStyle={{ color: "#E8946A", fontWeight: 600 }}
                      isAnimationActive={false} />
                    <Bar dataKey="stok" radius={[0, 4, 4, 0]} maxBarSize={18}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.low ? "#C44A35" : "#4A7A5A"} />
                      ))}
                    </Bar>
                    <Bar dataKey="esik" radius={[0, 4, 4, 0]} maxBarSize={18}
                      fill="rgba(139,115,85,0.2)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
              <div className="flex gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#4A7A5A" }} />
                  Yeterli stok
                </span>
                <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "#C44A35" }} />
                  Kritik seviye
                </span>
                <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
                  <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: "rgba(139,115,85,0.2)" }} />
                  Min. eşik
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Category Table */}
      {data && <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--espresso)" }}>
            Kategori Detay
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid var(--border)` }}>
                {["Kategori", "Gelir", "Brüt Kâr", "Adet"].map((h, i) => (
                  <th key={i}
                    className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wider ${i === 0 ? "text-left" : "text-right"}`}
                    style={{ color: "var(--muted)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.category_breakdown.map((row, i) => (
                <tr key={row.category} style={{ borderTop: i > 0 ? `1px solid var(--border)` : "none" }}>
                  <td className="px-5 py-3 font-medium text-sm" style={{ color: "var(--espresso)" }}>
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full inline-block"
                        style={{ background: PALETTE[i % PALETTE.length] }} />
                      {row.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-mono" style={{ color: "var(--espresso)" }}>
                    {formatCurrency(row.revenue)}
                  </td>
                  <td className="px-5 py-3 text-right text-sm font-mono" style={{ color: "var(--sage)" }}>
                    {formatCurrency(row.gross_profit)}
                  </td>
                  <td className="px-5 py-3 text-right text-sm" style={{ color: "var(--muted)" }}>
                    {row.item_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>}
    </div>
  );
}
