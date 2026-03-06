"use client";

import { useState } from "react";
import { useProducts, useAdjustProductStock, useUpdateProduct, Product } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useProducts";
import { formatCurrency, cn } from "@/lib/utils";

function ThresholdDisplay({ product }: { product: Product }) {
  const update = useUpdateProduct();
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(String(product.low_stock_threshold));

  const isLow = product.low_stock_threshold > 0 && product.stock_count <= product.low_stock_threshold;

  const save = async () => {
    const num = parseFloat(val);
    if (isNaN(num) || num < 0) { setEditing(false); return; }
    await update.mutateAsync({ id: product.id, low_stock_threshold: num });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number" min="0" step="1"
          value={val}
          onChange={(e) => setVal(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
          autoFocus
          className="input w-20 text-center"
          style={{ fontSize: "0.8rem", padding: "0.3rem 0.4rem", borderColor: "var(--amber)" }}
        />
        <button
          onClick={save}
          disabled={update.isPending}
          className="text-xs px-2 py-1 rounded-lg font-semibold text-white"
          style={{ background: "var(--amber)" }}
        >
          ✓
        </button>
        <button
          onClick={() => setEditing(false)}
          className="text-xs px-1.5 py-1"
          style={{ color: "var(--muted)" }}
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => { setVal(String(product.low_stock_threshold)); setEditing(true); }}
      className="group inline-flex items-center gap-1.5 transition-opacity"
      title="Tıklayarak düzenle"
    >
      {product.low_stock_threshold > 0 ? (
        <span className={isLow ? "badge-danger animate-blink" : "badge-muted"}>
          Min: {product.low_stock_threshold}
        </span>
      ) : (
        <span className="badge-muted">Eşik yok</span>
      )}
      <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: "var(--amber)" }}>
        ✎
      </span>
    </button>
  );
}

function StockCard({ product }: { product: Product }) {
  const adjust = useAdjustProductStock();
  const [saleQty, setSaleQty] = useState("");
  const [addQty, setAddQty] = useState("");
  const [mode, setMode] = useState<"idle" | "sale" | "add">("idle");

  const isLow = product.low_stock_threshold > 0 && product.stock_count <= product.low_stock_threshold;

  const handleSale = async () => {
    const qty = parseFloat(saleQty);
    if (!qty || qty <= 0) return;
    await adjust.mutateAsync({ id: product.id, delta: -qty, note: "Manuel satış girişi" });
    setSaleQty("");
    setMode("idle");
  };

  const handleAdd = async () => {
    const qty = parseFloat(addQty);
    if (!qty || qty <= 0) return;
    await adjust.mutateAsync({ id: product.id, delta: qty, note: "Stok girişi" });
    setAddQty("");
    setMode("idle");
  };

  return (
    <div className={cn("card p-4 flex flex-col gap-3", !product.is_active && "opacity-50")}>
      {/* Header */}
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm truncate" style={{ color: "var(--espresso)", fontFamily: "var(--font-body)" }}>
            {product.name}
          </h3>
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {product.category?.name} · {product.unit}
          </span>
        </div>
        <ThresholdDisplay product={product} />
      </div>

      {/* Stock + Price */}
      <div
        className="grid grid-cols-2 gap-2 rounded-lg p-3"
        style={{ background: "var(--cream)", border: `1px solid var(--border)` }}
      >
        <div>
          <div className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>Stok</div>
          <div
            className={cn("text-2xl font-semibold font-mono", isLow && "animate-blink")}
            style={{ color: isLow ? "var(--danger)" : "var(--espresso)", fontFamily: "var(--font-display)" }}
          >
            {Number(product.stock_count).toFixed(0)}
          </div>
        </div>
        <div>
          <div className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>Satış Fiyatı</div>
          <div className="font-semibold font-mono text-sm" style={{ color: "var(--espresso)" }}>
            {formatCurrency(product.sale_price)}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t pt-2" style={{ borderColor: "var(--border)" }}>
        {mode === "idle" && (
          <div className="flex gap-2">
            <button
              onClick={() => setMode("sale")}
              className="flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors"
              style={{ background: "var(--danger-light)", color: "var(--danger)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f5cec9"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--danger-light)"; }}
            >
              − Satış
            </button>
            <button
              onClick={() => setMode("add")}
              className="flex-1 text-xs py-1.5 rounded-lg font-medium transition-colors"
              style={{ background: "var(--sage-light)", color: "var(--sage)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#cde3d4"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--sage-light)"; }}
            >
              + Stok
            </button>
          </div>
        )}
        {mode === "sale" && (
          <div className="flex gap-1 items-center">
            <input type="number" min="0.1" step="0.1" value={saleQty}
              onChange={(e) => setSaleQty(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSale(); if (e.key === "Escape") setMode("idle"); }}
              placeholder="Adet" autoFocus className="input flex-1 text-center"
              style={{ borderColor: "var(--danger)", fontSize: "0.8rem", padding: "0.4rem 0.5rem" }} />
            <button onClick={handleSale} disabled={adjust.isPending}
              className="text-xs px-3 py-1.5 rounded-lg font-medium text-white disabled:opacity-60"
              style={{ background: "var(--danger)" }}>Gir</button>
            <button onClick={() => setMode("idle")} className="text-xs px-1.5 py-1"
              style={{ color: "var(--muted)" }}>✕</button>
          </div>
        )}
        {mode === "add" && (
          <div className="flex gap-1 items-center">
            <input type="number" min="0.1" step="0.1" value={addQty}
              onChange={(e) => setAddQty(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setMode("idle"); }}
              placeholder="Adet" autoFocus className="input flex-1 text-center"
              style={{ borderColor: "var(--sage)", fontSize: "0.8rem", padding: "0.4rem 0.5rem" }} />
            <button onClick={handleAdd} disabled={adjust.isPending}
              className="text-xs px-3 py-1.5 rounded-lg font-medium text-white disabled:opacity-60"
              style={{ background: "var(--sage)" }}>Ekle</button>
            <button onClick={() => setMode("idle")} className="text-xs px-1.5 py-1"
              style={{ color: "var(--muted)" }}>✕</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProductStockPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showLowOnly, setShowLowOnly] = useState(false);

  const { data, isLoading } = useProducts({ page_size: 200, is_active: undefined });
  const { data: categories } = useCategories();

  const filtered = (data?.items ?? []).filter((p) => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter && p.category_id !== categoryFilter) return false;
    if (showLowOnly) return p.low_stock_threshold > 0 && p.stock_count <= p.low_stock_threshold;
    return true;
  });

  const lowCount = (data?.items ?? []).filter(
    (p) => p.low_stock_threshold > 0 && p.stock_count <= p.low_stock_threshold
  ).length;

  return (
    <div className="p-4 md:p-8 space-y-5 page-enter">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "var(--espresso)" }}>
            Ürün Stoku
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
            Satış kaydedilince stok otomatik düşer · Uyarı eşiğini karttan düzenleyin
          </p>
        </div>
        {lowCount > 0 && (
          <div className="shrink-0 flex items-center gap-2 rounded-xl px-3 py-2 animate-blink"
            style={{ background: "var(--danger-light)", border: `1px solid var(--danger)` }}>
            <span className="font-bold text-xl" style={{ color: "var(--danger)" }}>{lowCount}</span>
            <span className="text-xs" style={{ color: "var(--danger)" }}>ürün kritik<br />seviyede</span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <input type="text" placeholder="Ürün ara..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="input w-48" />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input w-auto"
          style={{ color: "#16100B", background: "#FBF5EC" }}>
          <option value="">Tüm Kategoriler</option>
          {categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={showLowOnly} onChange={(e) => setShowLowOnly(e.target.checked)}
            className="accent-red-500 w-3.5 h-3.5" />
          <span className="font-semibold text-xs" style={{ color: "var(--danger)" }}>Sadece kritik</span>
        </label>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="p-8 text-center text-sm blink" style={{ color: "var(--muted)" }}>Yükleniyor...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 stagger">
          {filtered.map((product) => <StockCard key={product.id} product={product} />)}
          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center text-sm" style={{ color: "var(--muted)" }}>
              Ürün bulunamadı.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
