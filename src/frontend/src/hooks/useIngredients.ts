import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  stock_balance: number;
  low_stock_threshold: number;
  cost_per_unit: number;
  created_at: string;
}

export interface StockMovement {
  id: string;
  ingredient_id: string;
  movement_type: "purchase" | "consumption" | "adjustment" | "waste";
  quantity_delta: number;
  unit_cost: number | null;
  note: string | null;
  performed_by: string;
  moved_at: string;
  created_at: string;
}

export interface StockMovementListOut {
  items: StockMovement[];
  total: number;
  page: number;
  page_size: number;
}

export function useIngredients() {
  return useQuery({
    queryKey: ["ingredients"],
    queryFn: async () => {
      const { data } = await api.get<Ingredient[]>("/ingredients");
      return data;
    },
  });
}

export function useStockMovements(ingredientId?: string, page = 1) {
  return useQuery({
    queryKey: ["inventory", "movements", ingredientId, page],
    queryFn: async () => {
      const { data } = await api.get<StockMovementListOut>("/inventory/movements", {
        params: { ingredient_id: ingredientId, page, page_size: 20 },
      });
      return data;
    },
  });
}

export function useCreateIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      unit: string;
      stock_balance?: number;
      low_stock_threshold?: number;
      cost_per_unit?: number;
    }) => api.post<Ingredient>("/ingredients", payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ingredients"] }),
  });
}

export function useUpdateIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<Ingredient>) =>
      api.patch<Ingredient>(`/ingredients/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ingredients"] }),
  });
}

export function useDeleteIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/ingredients/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["ingredients"] }),
  });
}

export function useAddStockMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      ingredient_id: string;
      movement_type: "purchase" | "consumption" | "adjustment" | "waste";
      quantity_delta: number;
      unit_cost?: number;
      note?: string;
    }) => api.post<StockMovement>("/inventory/movements", payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ingredients"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}
