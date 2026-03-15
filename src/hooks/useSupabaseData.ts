import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

// Generic fetch from any Supabase view/table
async function fetchView<T = Record<string, unknown>>(
  viewName: string,
  filters?: Record<string, unknown>,
  orderBy?: { column: string; ascending?: boolean },
  limit?: number
): Promise<T[]> {
  let query = supabase.from(viewName).select("*");

  if (filters) {
    for (const [key, val] of Object.entries(filters)) {
      if (val !== undefined && val !== null && val !== "") {
        query = query.eq(key, val);
      }
    }
  }

  if (orderBy) {
    query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as T[];
}

// ─── Typed hooks for each view ───

export function useCustomerBrandActivity(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["fact_customer_brand_activity", filters],
    queryFn: () => fetchView("fact_customer_brand_activity", filters),
  });
}

export function useCustomerAuctionActivity(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["fact_customer_auction_activity", filters],
    queryFn: () => fetchView("fact_customer_auction_activity", filters),
  });
}

export function useBookAuctionSummary(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["fact_book_auction_summary", filters],
    queryFn: () => fetchView("fact_book_auction_summary", filters),
  });
}

export function useAuctionDailySnapshot(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["fact_auction_daily_snapshot", filters],
    queryFn: () => fetchView("fact_auction_daily_snapshot", filters),
  });
}

// Re-export for ad-hoc queries
export { fetchView };
