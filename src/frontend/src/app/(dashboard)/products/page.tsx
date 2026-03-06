"use client";

import { useState } from "react";
import {
  useProducts,
  useCategories,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  Product,
} from "@/hooks/useProducts";
import { formatCurrency } from "@/lib/utils";

const EMPTY_FORM = {
  name: "",
  category_id: "",
  unit: "adet",
  sale_price: "",
  cogs_per_unit: "",
  low_stock_threshold: "",
};

type FormState = typeof EMPTY_FORM;

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        className="block text-xs font-semibold mb-1.5 uppercase tracking-wider"
        style={{ color: "var(--muted)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function ProductForm({
  initial,
  categories,
  onSubmit,
  onCancel,
  loading,
}: {
  initial: FormState;
  categories: { id: string; name: string }[];
  onSubmit: (data: FormState) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const set = (k: keyof FormState, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="card p-5 space-y-4">
      <h2
        className="text-base font-semibold"
        style={{ fontFamily: "var(--font-display)", color: "var(--espresso)" }}
      >
        {initial.name ? "Ürünü Düzenle" : "Yeni Ürün"}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Ürün Adı *">
          <input
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            required
            className="input"
            placeholder="Örn: Latte"
          />
        </Field>
        <Field label="Kategori *">
          <select
            value={form.category_id}
            onChange={(e) => set("category_id", e.target.value)}
            required
            className="input"
          >
            <option value="">Seçin</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Birim">
          <select
            value={form.unit}
            onChange={(e) => set("unit", e.target.value)}
            className="input"
          >
            <option value="adet">Adet</option>
            <option value="porsiyon">Porsiyon</option>
            <option value="kg">Kg</option>
            <option value="lt">Lt</option>
          </select>
        </Field>
        <Field label="Satış Fiyatı (₺) *">
          <input
            type="number" step="0.01" min="0"
            value={form.sale_price}
            onChange={(e) => set("sale_price", e.target.value)}
            required
            className="input"
            placeholder="0.00"
          />
        </Field>
        <Field label="Maliyet (₺)">
          <input
            type="number" step="0.01" min="0"
            value={form.cogs_per_unit}
            onChange={(e) => set("cogs_per_unit", e.target.value)}
            className="input"
            placeholder="0.00"
          />
        </Field>
        <Field label="Min. Stok Eşiği">
          <input
            type="number" step="0.01" min="0"
            value={form.low_stock_threshold}
            onChange={(e) => set("low_stock_threshold", e.target.value)}
            className="input"
            placeholder="0"
          />
        </Field>
      </div>
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost">
          İptal
        </button>
        <button
          onClick={() => onSubmit(form)}
          disabled={loading || !form.name || !form.category_id || !form.sale_price}
          className="btn-primary"
        >
          {loading ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data, isLoading } = useProducts({
    page_size: 200,
    search: search || undefined,
    category_id: categoryFilter || undefined,
  });
  const { data: categories } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

  const handleCreate = async (form: FormState) => {
    await createProduct.mutateAsync({
      name: form.name,
      category_id: form.category_id,
      unit: form.unit,
      sale_price: parseFloat(form.sale_price),
      cogs_per_unit: parseFloat(form.cogs_per_unit || "0"),
      low_stock_threshold: parseFloat(form.low_stock_threshold || "0"),
    });
    setShowForm(false);
  };

  const handleUpdate = async (form: FormState) => {
    if (!editingProduct) return;
    await updateProduct.mutateAsync({
      id: editingProduct.id,
      name: form.name,
      category_id: form.category_id,
      unit: form.unit,
      sale_price: parseFloat(form.sale_price),
      cogs_per_unit: parseFloat(form.cogs_per_unit || "0"),
      low_stock_threshold: parseFloat(form.low_stock_threshold || "0"),
    });
    setEditingProduct(null);
  };

  const handleDelete = async (id: string) => {
    await deleteProduct.mutateAsync(id);
    setDeleteConfirm(null);
  };

  const toggleActive = (id: string, current: boolean) => {
    updateProduct.mutate({ id, is_active: !current });
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(false);
  };

  return (
    <div className="p-4 md:p-8 space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "var(--espresso)" }}
          >
            Ürünler
          </h1>
          {data && (
            <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
              Toplam {data.total} ürün
            </p>
          )}
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingProduct(null); }}
          className="btn-primary"
        >
          + Yeni Ürün
        </button>
      </div>

      {showForm && (
        <ProductForm
          initial={EMPTY_FORM}
          categories={categories ?? []}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          loading={createProduct.isPending}
        />
      )}

      {editingProduct && (
        <ProductForm
          initial={{
            name: editingProduct.name,
            category_id: editingProduct.category_id,
            unit: editingProduct.unit,
            sale_price: String(editingProduct.sale_price),
            cogs_per_unit: String(editingProduct.cogs_per_unit),
            low_stock_threshold: String(editingProduct.low_stock_threshold),
          }}
          categories={categories ?? []}
          onSubmit={handleUpdate}
          onCancel={() => setEditingProduct(null)}
          loading={updateProduct.isPending}
        />
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Ürün ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input w-52"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="">Tüm Kategoriler</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="p-8 text-center text-sm blink" style={{ color: "var(--muted)" }}>
          Yükleniyor...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 stagger">
          {data?.items.map((product) => {
            const margin = product.sale_price - product.cogs_per_unit;
            return (
              <div
                key={product.id}
                className="card p-4 flex flex-col gap-3"
                style={!product.is_active ? { opacity: 0.55 } : {}}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-1">
                  <div className="min-w-0">
                    <h3
                      className="font-semibold text-sm truncate"
                      style={{ color: "var(--espresso)", fontFamily: "var(--font-body)" }}
                    >
                      {product.name}
                    </h3>
                    <span className="text-xs" style={{ color: "var(--muted)" }}>
                      {product.category?.name}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleActive(product.id, product.is_active)}
                    className={product.is_active ? "badge-success" : "badge-muted"}
                    style={{ cursor: "pointer", border: "none" }}
                  >
                    {product.is_active ? "Aktif" : "Pasif"}
                  </button>
                </div>

                {/* Prices */}
                <div
                  className="grid grid-cols-3 gap-1 rounded-lg p-3"
                  style={{ background: "var(--cream)", border: `1px solid var(--border)` }}
                >
                  <div>
                    <div className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>Satış</div>
                    <div className="font-semibold text-sm font-mono" style={{ color: "var(--espresso)" }}>
                      {formatCurrency(product.sale_price)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>Maliyet</div>
                    <div className="text-sm font-mono" style={{ color: "var(--muted)" }}>
                      {formatCurrency(product.cogs_per_unit)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>Kâr</div>
                    <div
                      className="font-semibold text-sm font-mono"
                      style={{ color: margin >= 0 ? "var(--sage)" : "var(--danger)" }}
                    >
                      {formatCurrency(margin)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div
                  className="flex gap-2 pt-1 border-t"
                  style={{ borderColor: "var(--border)" }}
                >
                  <button
                    onClick={() => openEdit(product)}
                    className="flex-1 text-xs text-center py-1 transition-colors"
                    style={{ color: "var(--amber)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#B55A22"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--amber)"; }}
                  >
                    Düzenle
                  </button>
                  {deleteConfirm === product.id ? (
                    <div className="flex gap-1 flex-1 justify-end">
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-xs py-1 px-2"
                        style={{ color: "var(--muted)" }}
                      >
                        Vazgeç
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-xs font-semibold py-1 px-2"
                        style={{ color: "var(--danger)" }}
                      >
                        Sil
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(product.id)}
                      className="flex-1 text-xs text-center py-1 transition-colors"
                      style={{ color: "var(--muted)" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--danger)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
                    >
                      Sil
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {data?.items.length === 0 && (
            <div
              className="col-span-full py-12 text-center text-sm"
              style={{ color: "var(--muted)" }}
            >
              Ürün bulunamadı.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
