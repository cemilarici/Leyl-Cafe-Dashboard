"use client";

import { useState } from "react";
import { useExpenses, useCreateExpense, useDeleteExpense } from "@/hooks/useExpenses";
import { formatCurrency } from "@/lib/utils";

const EXPENSE_CATEGORIES = [
  { value: "kira",      label: "Kira" },
  { value: "elektrik",  label: "Elektrik" },
  { value: "personel",  label: "Personel" },
  { value: "malzeme",   label: "Malzeme" },
  { value: "diger",     label: "Diğer" },
];

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

export default function ExpensesPage() {
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading } = useExpenses({ page, page_size: 20 });
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

  const [category, setCategory] = useState("kira");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createExpense.mutateAsync({
      category,
      amount: parseFloat(amount),
      description: description || undefined,
      expense_date: expenseDate,
    });
    setAmount("");
    setDescription("");
    setShowForm(false);
  };

  const totalPages = data ? Math.ceil(data.total / 20) : 1;

  const catLabel = (v: string) =>
    EXPENSE_CATEGORIES.find((c) => c.value === v)?.label ?? v;

  return (
    <div className="p-4 md:p-8 space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "var(--espresso)" }}
          >
            Giderler
          </h1>
          {data && (
            <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
              Toplam {data.total} kayıt
            </p>
          )}
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Vazgeç" : "+ Yeni Gider"}
        </button>
      </div>

      {/* New Expense Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          <h2
            className="text-base font-semibold"
            style={{ fontFamily: "var(--font-display)", color: "var(--espresso)" }}
          >
            Yeni Gider Ekle
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Kategori">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input"
                style={{ color: "#16100B", background: "#FBF5EC" }}
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Tutar (₺)">
              <input
                type="number" step="0.01" min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="input"
                placeholder="0.00"
              />
            </Field>
            <Field label="Tarih">
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Açıklama">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input"
                placeholder="Opsiyonel"
              />
            </Field>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">
              İptal
            </button>
            <button type="submit" disabled={createExpense.isPending} className="btn-primary">
              {createExpense.isPending ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </div>
        </form>
      )}

      {/* Expense Cards */}
      {isLoading ? (
        <div className="p-8 text-center text-sm blink" style={{ color: "var(--muted)" }}>
          Yükleniyor...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 stagger">
            {data?.items.map((expense) => (
              <div key={expense.id} className="card p-4 flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs" style={{ color: "var(--muted)" }}>
                    {expense.expense_date}
                  </span>
                  <span className="badge-amber capitalize shrink-0">
                    {catLabel(expense.category)}
                  </span>
                </div>

                {/* Amount */}
                <div
                  className="rounded-lg p-3"
                  style={{ background: "var(--cream)", border: `1px solid var(--border)` }}
                >
                  <div className="text-xs mb-0.5" style={{ color: "var(--muted)" }}>Tutar</div>
                  <div
                    className="text-xl font-semibold font-mono"
                    style={{ color: "var(--danger)", fontFamily: "var(--font-display)" }}
                  >
                    {formatCurrency(expense.amount)}
                  </div>
                  {expense.description && (
                    <div className="text-xs mt-1.5" style={{ color: "var(--muted)" }}>
                      {expense.description}
                    </div>
                  )}
                </div>

                {/* Delete */}
                <div className="flex justify-end pt-1 border-t" style={{ borderColor: "var(--border)" }}>
                  <button
                    onClick={() => deleteExpense.mutate(expense.id)}
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
                Henüz gider kaydı yok.
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
