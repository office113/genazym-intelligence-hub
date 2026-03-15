import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

// Generic fetch from any Supabase view/table
async function fetchView<T = Record<string, unknown>>(
  viewName: string,
  filters?: Record<string, unknown>,
  orderBy?: { column: string; ascending?: boolean },
  limit?: number
): Promise<T[]> {
  const buildQuery = () => {
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

    return query;
  };

  if (typeof limit === "number") {
    const { data, error } = await buildQuery().limit(limit);
    if (error) throw error;
    return (data ?? []) as T[];
  }

  const pageSize = 1000;
  let from = 0;
  const allRows: T[] = [];

  while (true) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) throw error;

    const page = (data ?? []) as T[];
    allRows.push(...page);

    if (page.length < pageSize) break;
    from += pageSize;
  }

  return allRows;
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
