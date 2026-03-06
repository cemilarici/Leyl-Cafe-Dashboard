import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface Category {
  id: string;
  name: string;
  sort_order: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category_id: string;
  category: Category | null;
  unit: string;
  sale_price: number;
  cogs_per_unit: number;
  low_stock_threshold: number;
  stock_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductListOut {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
}

export function useProducts(params?: {
  page?: number;
  page_size?: number;
  category_id?: string;
  search?: string;
  is_active?: boolean;
}) {
  return useQuery({
    queryKey: ["products", params],
    queryFn: async () => {
      const { data } = await api.get<ProductListOut>("/products", { params });
      return data;
    },
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["products", "categories"],
    queryFn: async () => {
      const { data } = await api.get<Category[]>("/products/categories");
      return data;
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Product>) =>
      api.post<Product>("/products", payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & Partial<Product>) =>
      api.patch<Product>(`/products/${id}`, payload).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useAdjustProductStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, delta, note }: { id: string; delta: number; note?: string }) =>
      api.post<Product>(`/products/${id}/stock`, { delta, note }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}
