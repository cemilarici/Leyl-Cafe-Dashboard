import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface SaleItem {
  id: string;
  product_id: string;
  product_name: string | null;
  quantity: number;
  unit_price: number;
  unit_cogs: number;
  line_total: number;
}

export interface Sale {
  id: string;
  slug: string;
  payment_method: string;
  total_amount: number;
  total_cogs: number;
  gross_profit: number;
  note: string | null;
  recorded_by: string;
  sold_at: string;
  created_at: string;
  items: SaleItem[];
}

export interface SaleListOut {
  items: Sale[];
  total: number;
  page: number;
  page_size: number;
}

export interface SaleCreatePayload {
  payment_method: "cash" | "card" | "other";
  items: { product_id: string; quantity: number; unit_price?: number }[];
  note?: string;
}

export function useSales(params?: {
  page?: number;
  page_size?: number;
  date_from?: string;
  date_to?: string;
  payment_method?: string;
}) {
  return useQuery({
    queryKey: ["sales", params],
    queryFn: async () => {
      const { data } = await api.get<SaleListOut>("/sales", { params });
      return data;
    },
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: SaleCreatePayload) =>
      api.post<Sale>("/sales", payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/sales/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
