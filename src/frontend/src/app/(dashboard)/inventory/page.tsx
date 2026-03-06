"use client";

import { useState } from "react";
import {
  useIngredients,
  useCreateIngredient,
  useUpdateIngredient,
  useDeleteIngredient,
  useAddStockMovement,
  useStockMovements,
  Ingredient,
} from "@/hooks/useIngredients";
import { cn } from "@/lib/utils";

const MOVEMENT_LABELS: Record<string, string> = {
  purchase: "Satın Alım",
  consumption: "Tüketim",
  adjustment: "Düzeltme",
  waste: "Fire",
};

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

function IngredientForm({
  initial,
  onSubmit,
  onCancel,
  loading,
}: {
  initial: Partial<Ingredient>;
  onSubmit: (data: Partial<Ingredient>) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    name: initial.name ?? "",
    unit: initial.unit ?? "kg",
    stock_balance: String(initial.stock_balance ?? 0),
    low_stock_threshold: String(initial.low_stock_threshold ?? 0),
    cost_per_unit: String(initial.cost_per_unit ?? 0),
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="card p-5 space-y-4">
      <h2
        className="text-base font-semibold"
        style={{ fontFamily: "var(--font-display)", color: "var(--espresso)" }}
      >
        {initial.name ? "Hammadde Düzenle" : "Yeni Hammadde"}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <Field label="Ad *">
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
              className="input"
              placeholder="Kahve"
            />
          </Field>
        </div>
        <Field label="Birim">
          <select value={form.unit} onChange={(e) => set("unit", e.target.value)} className="input">
            <option value="kg">kg</option>
            <option value="lt">lt</option>
            <option value="adet">adet</option>
            <option value="g">g</option>
            <option value="ml">ml</option>
            <option value="paket">paket</option>
          </select>
        </Field>
        <Field label="Başlangıç Stok">
          <input type="number" step="0.001" min="0" value={form.stock_balance}
            onChange={(e) => set("stock_balance", e.target.value)} className="input" />
        </Field>
        <Field label="Min. Eşik">
          <input type="number" step="0.001" min="0" value={form.low_stock_threshold}
            onChange={(e) => set("low_stock_threshold", e.target.value)} className="input" />
        </Field>
        <Field label="Birim Maliyet (₺)">
          <input type="number" step="0.01" min="0" value={form.cost_per_unit}
            onChange={(e) => set("cost_per_unit", e.target.value)} className="input" />
        </Field>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="btn-ghost">İptal</button>
        <button
          onClick={() => onSubmit({
            name: form.name, unit: form.unit,
            stock_balance: parseFloat(form.stock_balance),
            low_stock_threshold: parseFloat(form.low_stock_threshold),
            cost_per_unit: parseFloat(form.cost_per_unit),
          })}
          disabled={loading || !form.name}
          className="btn-primary"
        >
          {loading ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </div>
    </div>
  );
}

function MovementPanel({ ingredient, onClose }: { ingredient: Ingredient; onClose: () => void }) {
  const { data, isLoading } = useStockMovements(ingredient.id);
  const addMovement = useAddStockMovement();
  const [type, setType] = useState<"purchase" | "consumption" | "adjustment" | "waste">("purchase");
  const [qty, setQty] = useState("");
  const [cost, setCost] = useState("");
  const [note, setNote] = useState("");

  const handleSubmit = async () => {
    if (!qty) return;
    const rawQty = parseFloat(qty);
    const delta = type === "consumption" || type === "waste" ? -Math.abs(rawQty) : Math.abs(rawQty);
    await addMovement.mutateAsync({
      ingredient_id: ingredient.id,
      movement_type: type,
      quantity_delta: delta,
      unit_cost: cost ? parseFloat(cost) : undefined,
      note: note || undefined,
    });
    setQty(""); setCost(""); setNote("");
  };

  const movementColor = (t: string) => {
    if (t === "purchase" || t === "adjustment") return "var(--sage)";
    return "var(--danger)";
  };

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2
          className="text-base font-semibold"
          style={{ fontFamily: "var(--font-display)", color: "var(--espresso)" }}
        >
          {ingredient.name} — Stok Hareketleri
        </h2>
        <button
          onClick={onClose}
          className="text-lg w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
          style={{ color: "var(--muted)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--espresso)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
        >
          ✕
        </button>
      </div>

      <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--cream)", border: `1px solid var(--border)` }}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="input">
            <option value="purchase">Satın Alım (+)</option>
            <option value="consumption">Tüketim (−)</option>
            <option value="adjustment">Düzeltme</option>
            <option value="waste">Fire (−)</option>
          </select>
          <input
            type="number" step="0.001" min="0" value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder={`Miktar (${ingredient.unit})`}
            className="input"
          />
          <input
            type="number" step="0.01" min="0" value={cost}
            onChange={(e) => setCost(e.target.value)}
            placeholder="Birim maliyet ₺"
            className="input"
          />
          <input
            value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="Not"
            className="input"
          />
        </div>
        <div className="flex justify-end gap-2">
          {addMovement.isError && (
            <p className="text-xs self-center" style={{ color: "var(--danger)" }}>
              Stok sıfırın altına düşemez.
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={!qty || addMovement.isPending}
            className="btn-primary"
          >
            {addMovement.isPending ? "Kaydediliyor..." : "Hareket Ekle"}
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-4 text-sm blink" style={{ color: "var(--muted)" }}>Yükleniyor...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: `1px solid var(--border)` }}>
                {["Tarih", "Tür", "Miktar", "Birim Maliyet", "Not"].map((h, i) => (
                  <th
                    key={i}
                    className={`px-3 py-2.5 text-xs font-semibold uppercase tracking-wider ${i >= 2 ? "text-right" : "text-left"}`}
                    style={{ color: "var(--muted)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.items.map((m, idx) => (
                <tr key={m.id} style={{ borderTop: idx > 0 ? `1px solid var(--border)` : "none" }}>
                  <td className="px-3 py-2.5 text-xs" style={{ color: "var(--muted)" }}>
                    {new Date(m.moved_at).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="text-xs font-semibold" style={{ color: movementColor(m.movement_type) }}>
                      {MOVEMENT_LABELS[m.movement_type]}
                    </span>
                  </td>
                  <td
                    className="px-3 py-2.5 text-right font-mono text-sm"
                    style={{ color: m.quantity_delta >= 0 ? "var(--sage)" : "var(--danger)" }}
                  >
                    {m.quantity_delta >= 0 ? "+" : ""}{m.quantity_delta} {ingredient.unit}
                  </td>
                  <td className="px-3 py-2.5 text-right text-xs" style={{ color: "var(--muted)" }}>
                    {m.unit_cost ? `₺${m.unit_cost}` : "—"}
                  </td>
                  <td className="px-3 py-2.5 text-xs" style={{ color: "var(--muted)" }}>{m.note ?? "—"}</td>
                </tr>
              ))}
              {!data?.items.length && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-sm" style={{ color: "var(--muted)" }}>
                    Hareket yok
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function IngredientCard({
  ing,
  onEdit,
  onMovement,
  onDelete,
  deleteConfirm,
  setDeleteConfirm,
}: {
  ing: Ingredient;
  onEdit: () => void;
  onMovement: () => void;
  onDelete: () => void;
  deleteConfirm: boolean;
  setDeleteConfirm: (v: boolean) => void;
}) {
  const isLow = ing.low_stock_threshold > 0 && ing.stock_balance <= ing.low_stock_threshold;

  return (
    <div className="card p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-1">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm truncate" style={{ color: "var(--espresso)", fontFamily: "var(--font-body)" }}>
            {ing.name}
          </h3>
          <span className="text-xs" style={{ color: "var(--muted)" }}>{ing.unit}</span>
        </div>
        {isLow ? (
          <span className="badge-danger animate-blink shrink-0">Düşük</span>
        ) : (
          <span className="badge-success shrink-0">Normal</span>
        )}
      </div>

      {/* Stock info */}
      <div
        className="grid grid-cols-3 gap-1 rounded-lg p-3"
        style={{ background: "var(--cream)", border: `1px solid var(--border)` }}
      >
        <div>
          <div className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>Stok</div>
          <div
            className={cn("font-semibold font-mono text-sm", isLow && "animate-blink")}
            style={{ color: isLow ? "var(--danger)" : "var(--espresso)" }}
          >
            {Number(ing.stock_balance).toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>Min. Eşik</div>
          <div className="text-sm font-mono" style={{ color: "var(--muted)" }}>
            {ing.low_stock_threshold}
          </div>
        </div>
        <div>
          <div className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>Maliyet</div>
          <div className="text-sm font-mono" style={{ color: "var(--muted)" }}>
            ₺{Number(ing.cost_per_unit).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t text-xs" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={onMovement}
          className="flex-1 text-center py-1 font-medium transition-colors"
          style={{ color: "var(--amber)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#B55A22"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--amber)"; }}
        >
          Hareket
        </button>
        <button
          onClick={onEdit}
          className="flex-1 text-center py-1 transition-colors"
          style={{ color: "var(--muted)" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--espresso)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--muted)"; }}
        >
          Düzenle
        </button>
        {deleteConfirm ? (
          <div className="flex gap-1 flex-1 justify-end">
            <button onClick={() => setDeleteConfirm(false)} style={{ color: "var(--muted)" }}>Vazgeç</button>
            <button onClick={onDelete} className="font-semibold" style={{ color: "var(--danger)" }}>Sil</button>
          </div>
        ) : (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="flex-1 text-center py-1 transition-colors"
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
}

export default function InventoryPage() {
  const { data: ingredients, isLoading } = useIngredients();
  const createIngredient = useCreateIngredient();
  const updateIngredient = useUpdateIngredient();
  const deleteIngredient = useDeleteIngredient();

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Ingredient | null>(null);
  const [movementPanel, setMovementPanel] = useState<Ingredient | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleCreate = async (data: Partial<Ingredient>) => {
    await createIngredient.mutateAsync(data as Parameters<typeof createIngredient.mutateAsync>[0]);
    setShowForm(false);
  };

  const handleUpdate = async (data: Partial<Ingredient>) => {
    if (!editingItem) return;
    await updateIngredient.mutateAsync({ id: editingItem.id, ...data });
    setEditingItem(null);
  };

  const lowCount = (ingredients ?? []).filter(
    (ing) => ing.low_stock_threshold > 0 && ing.stock_balance <= ing.low_stock_threshold
  ).length;

  return (
    <div className="p-4 md:p-8 space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "var(--espresso)" }}
          >
            Hammadde
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
            Malzeme stok takibi
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lowCount > 0 && (
            <div
              className="flex items-center gap-2 rounded-xl px-3 py-2 animate-blink"
              style={{ background: "var(--danger-light)", border: `1px solid var(--danger)` }}
            >
              <span className="font-bold text-lg" style={{ color: "var(--danger)" }}>{lowCount}</span>
              <span className="text-xs" style={{ color: "var(--danger)" }}>kritik seviye</span>
            </div>
          )}
          <button
            onClick={() => { setShowForm(true); setEditingItem(null); }}
            className="btn-primary"
          >
            + Yeni Hammadde
          </button>
        </div>
      </div>

      {showForm && (
        <IngredientForm initial={{}} onSubmit={handleCreate}
          onCancel={() => setShowForm(false)} loading={createIngredient.isPending} />
      )}
      {editingItem && (
        <IngredientForm initial={editingItem} onSubmit={handleUpdate}
          onCancel={() => setEditingItem(null)} loading={updateIngredient.isPending} />
      )}
      {movementPanel && (
        <MovementPanel ingredient={movementPanel} onClose={() => setMovementPanel(null)} />
      )}

      {/* Cards */}
      {isLoading ? (
        <div className="p-8 text-center text-sm blink" style={{ color: "var(--muted)" }}>Yükleniyor...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 stagger">
          {ingredients?.map((ing) => (
            <IngredientCard
              key={ing.id}
              ing={ing}
              onEdit={() => { setEditingItem(ing); setShowForm(false); }}
              onMovement={() => setMovementPanel(ing)}
              onDelete={() => { deleteIngredient.mutate(ing.id); setDeleteConfirm(null); }}
              deleteConfirm={deleteConfirm === ing.id}
              setDeleteConfirm={(v) => setDeleteConfirm(v ? ing.id : null)}
            />
          ))}
          {!ingredients?.length && (
            <div className="col-span-full py-12 text-center text-sm" style={{ color: "var(--muted)" }}>
              Henüz hammadde yok. &quot;Yeni Hammadde&quot; ile ekleyin.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
