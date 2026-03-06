"use client";

import { useState } from "react";
import { useSales, useCreateSale, useDeleteSale } from "@/hooks/useSales";
import { useProducts } from "@/hooks/useProducts";
import { formatCurrency, formatDate } from "@/lib/utils";

type CartItem = {
  product_id: string;
  quantity: number;
  product_name: string;
  unit_price: number;
  unit: string;
};

export default function SalesPage() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const { data, isLoading } = useSales({ page, page_size: 20 });
  const { data: productsData } = useProducts({ page_size: 200, is_active: true });
  const createSale = useCreateSale();
  const deleteSale = useDeleteSale();

  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "other">("cash");
  const [note, setNote] = useState("");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const filteredProducts = (productsData?.items ?? []).filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const addToCart = (productId: string, qty: number) => {
    const product = productsData?.items.find((p) => p.id === productId);
    if (!product) return;
    setCartItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product_id === product.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          quantity: qty,
          product_name: product.name,
          unit_price: product.sale_price,
          unit: product.unit,
        },
      ];
    });
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((i) => i.product_id !== productId));
  };

  const changeQty = (productId: string, qty: number) => {
    if (qty <= 0) { removeFromCart(productId); return; }
    setCartItems((prev) =>
      prev.map((i) => i.product_id === productId ? { ...i, quantity: qty } : i)
    );
  };

  const submitSale = async () => {
    if (cartItems.length === 0) return;
    await createSale.mutateAsync({
      payment_method: paymentMethod,
      items: cartItems.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
      note: note || undefined,
    });
    setCartItems([]);
    setNote("");
    setShowForm(false);
    setProductSearch("");
  };

  const totalAmount = cartItems.reduce((s, i) => s + i.unit_price * i.quantity, 0);
  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  const paymentLabel = (m: string) =>
    m === "cash" ? "Nakit" : m === "card" ? "Kart" : "Diğer";

  return (
    <div className="p-4 md:p-8 space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "var(--espresso)" }}
          >
            Satışlar
          </h1>
          {data && (
            <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
              Toplam {data.total} kayıt
            </p>
          )}
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Vazgeç" : "+ Yeni Satış"}
        </button>
      </div>

      {/* New Sale Form */}
      {showForm && (
        <div className="card p-5 space-y-5">
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "var(--espresso)" }}
          >
            Yeni Satış
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Left — Product Picker */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                Ürün Seç
              </p>
              <input
                type="text"
                placeholder="Ürün ara..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="input"
              />
              <div
                className="rounded-xl overflow-y-auto space-y-1"
                style={{
                  maxHeight: 280,
                  border: `1.5px solid var(--border)`,
                  background: "var(--cream)",
                  padding: "6px",
                }}
              >
                {filteredProducts.length === 0 && (
                  <p className="text-sm text-center py-6" style={{ color: "var(--muted)" }}>
                    Ürün bulunamadı
                  </p>
                )}
                {filteredProducts.map((p) => {
                  const inCart = cartItems.find((i) => i.product_id === p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => addToCart(p.id, 1)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-all"
                      style={{
                        background: inCart ? "var(--amber-pale)" : "transparent",
                        border: inCart ? `1px solid var(--amber)` : "1px solid transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (!inCart) (e.currentTarget as HTMLElement).style.background = "#fff";
                      }}
                      onMouseLeave={(e) => {
                        if (!inCart) (e.currentTarget as HTMLElement).style.background = "transparent";
                      }}
                    >
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--espresso)" }}>
                          {p.name}
                        </p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>
                          {p.category?.name} · {p.unit}
                        </p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p
                          className="text-sm font-semibold font-mono"
                          style={{ color: inCart ? "var(--amber)" : "var(--espresso)" }}
                        >
                          {formatCurrency(p.sale_price)}
                        </p>
                        {inCart && (
                          <p className="text-xs font-semibold" style={{ color: "var(--amber)" }}>
                            + Sepete ekle
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right — Cart */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                Sepet {cartItems.length > 0 && `(${cartItems.length} ürün)`}
              </p>

              {cartItems.length === 0 ? (
                <div
                  className="rounded-xl flex items-center justify-center"
                  style={{
                    height: 120,
                    border: `1.5px dashed var(--border)`,
                    color: "var(--muted)",
                    fontSize: "0.8rem",
                  }}
                >
                  Sol taraftan ürün seçin
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden" style={{ border: `1.5px solid var(--border)` }}>
                  {cartItems.map((item, idx) => (
                    <div
                      key={item.product_id}
                      className="flex items-center gap-3 px-3 py-2.5"
                      style={{
                        borderTop: idx > 0 ? `1px solid var(--border)` : "none",
                        background: "#fff",
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--espresso)" }}>
                          {item.product_name}
                        </p>
                        <p className="text-xs" style={{ color: "var(--muted)" }}>
                          {formatCurrency(item.unit_price)} / {item.unit}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => changeQty(item.product_id, item.quantity - 1)}
                          className="w-6 h-6 rounded-md text-sm font-bold flex items-center justify-center transition-colors"
                          style={{ background: "var(--cream)", color: "var(--espresso)", border: `1px solid var(--border)` }}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={item.quantity}
                          onChange={(e) => changeQty(item.product_id, Number(e.target.value))}
                          className="w-10 text-center text-sm font-semibold outline-none"
                          style={{ color: "var(--espresso)", background: "transparent", border: "none" }}
                        />
                        <button
                          onClick={() => changeQty(item.product_id, item.quantity + 1)}
                          className="w-6 h-6 rounded-md text-sm font-bold flex items-center justify-center transition-colors"
                          style={{ background: "var(--amber)", color: "#fff", border: "none" }}
                        >
                          +
                        </button>
                      </div>
                      <p className="text-sm font-semibold font-mono w-16 text-right" style={{ color: "var(--espresso)" }}>
                        {formatCurrency(item.unit_price * item.quantity)}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.product_id)}
                        className="text-xs w-5 h-5 flex items-center justify-center rounded transition-colors"
                        style={{ color: "var(--muted)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--danger)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <div
                    className="flex justify-between px-3 py-3"
                    style={{ background: "var(--cream)", borderTop: `1px solid var(--border)` }}
                  >
                    <span className="text-sm font-semibold" style={{ color: "var(--muted)" }}>Toplam</span>
                    <span
                      className="text-lg font-semibold font-mono"
                      style={{ color: "var(--amber)", fontFamily: "var(--font-display)" }}
                    >
                      {formatCurrency(totalAmount)}
                    </span>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-1">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as "cash" | "card" | "other")}
                  className="input w-auto"
                  style={{ color: "#16100B", background: "#FBF5EC" }}
                >
                  <option value="cash">Nakit</option>
                  <option value="card">Kart</option>
                  <option value="other">Diğer</option>
                </select>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Not (opsiyonel)"
                  className="input flex-1"
                />
              </div>

              <button
                onClick={submitSale}
                disabled={cartItems.length === 0 || createSale.isPending}
                className="btn-primary w-full mt-1"
              >
                {createSale.isPending ? "Kaydediliyor..." : `Satışı Kaydet — ${formatCurrency(totalAmount)}`}
              </button>
              {createSale.isError && (
                <p className="text-xs text-center" style={{ color: "var(--danger)" }}>
                  Hata oluştu. Lütfen tekrar deneyin.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sales Cards */}
      {isLoading ? (
        <div className="p-8 text-center text-sm blink" style={{ color: "var(--muted)" }}>
          Yükleniyor...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 stagger">
            {data?.items.map((sale) => (
              <div key={sale.id} className="card p-4 flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    {formatDate(sale.sold_at)}
                  </span>
                  <span
                    className={
                      sale.payment_method === "cash"
                        ? "badge-success"
                        : sale.payment_method === "card"
                        ? "badge-amber"
                        : "badge-muted"
                    }
                  >
                    {paymentLabel(sale.payment_method)}
                  </span>
                </div>

                {/* Amounts */}
                <div
                  className="grid grid-cols-2 gap-2 rounded-lg p-3"
                  style={{ background: "var(--cream)", border: `1px solid var(--border)` }}
                >
                  <div>
                    <div className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>Tutar</div>
                    <div
                      className="font-semibold font-mono"
                      style={{ color: "var(--espresso)", fontFamily: "var(--font-display)" }}
                    >
                      {formatCurrency(sale.total_amount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>Kâr</div>
                    <div className="font-semibold font-mono text-sm" style={{ color: "var(--sage)" }}>
                      {formatCurrency(Number(sale.gross_profit))}
                    </div>
                  </div>
                </div>

                {/* Delete */}
                <div className="flex justify-end pt-1 border-t" style={{ borderColor: "var(--border)" }}>
                  <button
                    onClick={() => deleteSale.mutate(sale.id)}
                    className="text-xs transition-colors"
                    style={{ color: "var(--muted)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--danger)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))}
            {data?.items.length === 0 && (
              <div className="col-span-full py-12 text-center text-sm" style={{ color: "var(--muted)" }}>
                Henüz satış kaydı yok.
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="btn-ghost disabled:opacity-40 px-3 py-1">‹</button>
              <span className="px-3 py-1 text-sm" style={{ color: "var(--muted)" }}>
                {page} / {totalPages}
              </span>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                className="btn-ghost disabled:opacity-40 px-3 py-1">›</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
