import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export interface CategoryBreakdown {
  category: string;
  revenue: number;
  cogs: number;
  gross_profit: number;
  item_count: number;
}

export interface DashboardSummary {
  total_revenue: number;
  total_cogs: number;
  gross_profit: number;
  gross_margin_pct: number;
  total_expenses: number;
  net_profit: number;
  sale_count: number;
  expense_count: number;
  category_breakdown: CategoryBreakdown[];
  stock_alert_count: number;
  date_from: string;
  date_to: string;
}

export function useDashboard(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: ["dashboard", "summary", dateFrom, dateTo],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;
      const { data } = await api.get<DashboardSummary>("/dashboard/summary", { params });
      return data;
    },
  });
}
