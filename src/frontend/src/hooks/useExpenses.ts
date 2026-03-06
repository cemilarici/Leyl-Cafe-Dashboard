import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string | null;
  expense_date: string;
  recorded_by: string;
  created_at: string;
}

export interface ExpenseListOut {
  items: Expense[];
  total: number;
  page: number;
  page_size: number;
}

export function useExpenses(params?: {
  page?: number;
  page_size?: number;
  date_from?: string;
  date_to?: string;
  category?: string;
}) {
  return useQuery({
    queryKey: ["expenses", params],
    queryFn: async () => {
      const { data } = await api.get<ExpenseListOut>("/expenses", { params });
      return data;
    },
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      category: string;
      amount: number;
      description?: string;
      expense_date?: string;
    }) => api.post<Expense>("/expenses", payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/expenses/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
