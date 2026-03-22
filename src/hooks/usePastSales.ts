import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";

export interface SaleRow {
  id: string;
  name: string;
  date: string;
  lots: number;
  sold: number;
  unsold: number;
  revenue: number;
  winners: number;
  bidders: number;
  newReg: number;
  auctionName: string;
  brand: string;
}

export interface InvolvedBarData {
  sale: string;
  saleNumber: number;
  involved: number;
  winners: number;
  customers: any[];
}

export interface ChurnBarData {
  sale: string;
  saleNumber: number;
  notReturned: number;
  prevSale: string;
  prevInvolved: number;
  customers: any[];
}

export interface BrandKPIs {
  avgOpeningPrice: string;
  avgUplift: string;
  uniqueInvolved: string;
  avgInvolvedPerSale: string;
}

export interface YearlyData {
  year: number;
  salesCount: number;
  totalRevenue: number;
  uniqueInvolved: number;
  uniqueWinners: number;
  avgPricePerItem: number;
  medianPrice: number;
  booksSold: number;
  newInvolved: number;
  newRegistrants: number;
  churned: number;
}

function extractSaleNumber(auctionName: string): number {
  const match = auctionName.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}

function formatSaleLabel(auctionName: string): string {
  const num = extractSaleNumber(auctionName);
  return num ? `#${num}` : auctionName;
}

async function fetchAllPages(table: string, filters: Record<string, string>, select = "*", orFilter?: string) {
  let allData: any[] = [];
  let from = 0;
  const PAGE_SIZE = 1000;
  let hasMore = true;

  while (hasMore) {
    let query = (supabase.from(table) as any).select(select).range(from, from + PAGE_SIZE - 1);
    if (orFilter) {
      query = query.or(orFilter);
    } else {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    allData = [...allData, ...(data ?? [])];
    hasMore = (data ?? []).length === PAGE_SIZE;
    from += PAGE_SIZE;
  }

  return allData;
}

async function fetchBrandData(brand: "genazym" | "zaidy") {
  const brandFilter = brand === "genazym" ? "Genazym" : "Zaidy";

  // 1. Fetch auctions
  const { data: auctionsData, error: auctionsErr } = await supabase
    .from("auctions")
    .select("*")
    .eq("brand", brandFilter)
    .order("auction_date", { ascending: false });

  if (auctionsErr) throw new Error(auctionsErr.message);

  // 2. Fetch activity data with pagination
  const activityData = await fetchAllPages("fact_customer_auction_activity", { brand: brandFilter });

  // 3. Fetch books with pagination - including brand=NULL for old sales
  const booksData = await fetchAllPages(
    "fact_book_auction_summary",
    {},
    "auction_name, sold_flag, sold_price, opening_price, brand",
    `brand.eq.${brandFilter},brand.is.null`,
  );

  // Filter books to only valid auctions
  const validAuctionNames = new Set((auctionsData ?? []).map((a: any) => a.auction_name));
  const filteredBooksData = booksData.filter((b: any) => validAuctionNames.has(b.auction_name));

  // 3b. Fetch daily snapshots
  const snapshotsData = await fetchAllPages(
    "fact_auction_daily_snapshot",
    { brand: brandFilter }
  );

  // 4. Fetch registrations
  const regsData = await fetchAllPages(
    "registrations",
    { brand: brand === "genazym" ? "Genazym" : "Zaidy" },
    "id, full_name, email, phone, created_at, join_date, approved, bidspirit_id"
  );

  // 4b. Fetch parallel brand registrations
  const parallelBrandFilter = brand === "genazym" ? "Zaidy" : "Genazym";
  const parallelRegs = await fetchAllPages(
    "registrations",
    { brand: parallelBrandFilter },
    "id, full_name, email, phone, created_at, join_date, approved, bidspirit_id"
  );

  // Group by auction_name
  const activityByAuction: Record<string, any[]> = {};
  activityData.forEach((row: any) => {
    if (!activityByAuction[row.auction_name]) activityByAuction[row.auction_name] = [];
    activityByAuction[row.auction_name].push(row);
  });

  const booksByAuction: Record<string, any[]> = {};
  filteredBooksData.forEach((row: any) => {
    if (!booksByAuction[row.auction_name]) booksByAuction[row.auction_name] = [];
    booksByAuction[row.auction_name].push(row);
  });

  // Build pastSalesData
  const sales: SaleRow[] = (auctionsData ?? []).map((auction: any) => {
    const auctionActivity = activityByAuction[auction.auction_name] ?? [];
    const auctionBooks = booksByAuction[auction.auction_name] ?? [];
    const winners = auctionActivity.filter((r: any) => r.total_wins > 0).length;
    const totalRevenue = auctionBooks.reduce((sum: number, b: any) => sum + (Number(b.sold_price) || 0), 0);
    const totalLots = auctionBooks.length;
    const soldLots = auctionBooks.filter((b: any) => b.sold_flag).length;

    const auctionDate = new Date(auction.auction_date);
    const windowStart = new Date(auctionDate);
    windowStart.setDate(windowStart.getDate() - 28);
    const newRegs = regsData.filter((r: any) => {
      const joinDate = new Date(r.join_date || r.approved);
      return joinDate >= windowStart && joinDate <= auctionDate;
    }).length;

    return {
      id: auction.id,
      name: `מכירה ${formatSaleLabel(auction.auction_name)}`,
      date: auction.auction_date,
      lots: totalLots,
      sold: soldLots,
      unsold: totalLots - soldLots,
      revenue: totalRevenue,
      winners,
      bidders: auctionActivity.length,
      newReg: newRegs,
      auctionName: auction.auction_name,
      brand: auction.brand,
    };
  });

  // Last 5 auctions for charts
  const last5Auctions = [...(auctionsData ?? [])]
    .sort((a: any, b: any) => extractSaleNumber(a.auction_name) - extractSaleNumber(b.auction_name))
    .slice(-5);

  const involved: InvolvedBarData[] = last5Auctions.map((auction: any) => {
    const auctionActivity = activityByAuction[auction.auction_name] ?? [];
    return {
      sale: formatSaleLabel(auction.auction_name),
      saleNumber: extractSaleNumber(auction.auction_name),
      involved: auctionActivity.length,
      winners: auctionActivity.filter((r: any) => r.total_wins > 0).length,
      customers: auctionActivity.map((r: any) => ({
        name: r.full_name ?? r.email,
        email: r.email,
        status: r.total_wins > 0 ? "זוכה" : "מעורב",
        bids: r.total_bids,
        involvementType: r.was_early && r.was_live ? "גם וגם" : r.was_live ? "לייב" : "מוקדם",
        lotsInvolved: r.lots_involved ?? 0,
        maxBidAmount: `$${(r.max_bid ?? 0).toLocaleString()}`,
        firstBidEver: r.first_bid_at ?? "",
        lotsWon: r.total_wins ?? 0,
        totalWinAmount: r.total_win_value > 0 ? `$${Number(r.total_win_value).toLocaleString()}` : undefined,
      })),
    };
  });

  // Churn
  const churn: ChurnBarData[] = [];
  for (let i = 1; i < last5Auctions.length; i++) {
    const currAuction = last5Auctions[i];
    const prevAuction = last5Auctions[i - 1];
    const currEmails = new Set((activityByAuction[currAuction.auction_name] ?? []).map((r: any) => r.email));
    const prevActive = activityByAuction[prevAuction.auction_name] ?? [];
    const notReturned = prevActive.filter((r: any) => !currEmails.has(r.email));

    churn.push({
      sale: formatSaleLabel(currAuction.auction_name),
      saleNumber: extractSaleNumber(currAuction.auction_name),
      notReturned: notReturned.length,
      prevSale: `מכירה ${formatSaleLabel(prevAuction.auction_name)}`,
      prevInvolved: prevActive.length,
      customers: notReturned.map((r: any) => ({
        name: r.full_name ?? r.email,
        email: r.email,
        bidsInPrev: r.total_bids,
        involvementType: r.was_early && r.was_live ? "גם וגם" : r.was_live ? "מוקדם" : "מוקדם",
        lotsInvolved: r.lots_involved ?? 0,
        maxBidAmount: `$${(r.max_bid ?? 0).toLocaleString()}`,
        wonInPrev: r.total_wins > 0,
        firstBidEver: r.first_bid_at ?? "",
      })),
    });
  }

  // Yearly Trends Data
  const auctionsByYear: Record<number, any[]> = {};
  (auctionsData ?? []).forEach((a: any) => {
    const year = new Date(a.auction_date).getFullYear();
    if (!auctionsByYear[year]) auctionsByYear[year] = [];
    auctionsByYear[year].push(a);
  });

  const allYears = Object.keys(auctionsByYear).map(Number).sort((a, b) => a - b);

  const earliestAuctionByEmail: Record<string, number> = {};
  activityData.forEach((r: any) => {
    const auctionEntry = (auctionsData ?? []).find((a: any) => a.auction_name === r.auction_name);
    if (!auctionEntry) return;
    const auctionYear = new Date(auctionEntry.auction_date).getFullYear();
    const prev = earliestAuctionByEmail[r.email];
    if (prev === undefined || auctionYear < prev) {
      earliestAuctionByEmail[r.email] = auctionYear;
    }
  });

  const yearlyTrends: YearlyData[] = allYears.map((year, yearIdx) => {
    const yearAuctions = auctionsByYear[year];
    const yearAuctionNames = new Set(yearAuctions.map((a: any) => a.auction_name));
    const yearBooks = filteredBooksData.filter((b: any) => yearAuctionNames.has(b.auction_name));
    const yearSoldBooks = yearBooks.filter((b: any) => b.sold_flag);
    const totalRevenue = yearSoldBooks.reduce((sum: number, b: any) => sum + (Number(b.sold_price) || 0), 0);
    const booksSold = yearSoldBooks.length;

    const soldPrices = yearSoldBooks.map((b: any) => Number(b.sold_price) || 0).sort((a: number, b: number) => a - b);
    let medianPrice = 0;
    if (soldPrices.length > 0) {
      const mid = Math.floor(soldPrices.length / 2);
      medianPrice = soldPrices.length % 2 === 0
        ? Math.round((soldPrices[mid - 1] + soldPrices[mid]) / 2)
        : soldPrices[mid];
    }

    const yearActivity = activityData.filter((r: any) => yearAuctionNames.has(r.auction_name));
    const uniqueEmails = new Set(yearActivity.map((r: any) => r.email));
    const uniqueInvolvedCount = uniqueEmails.size;
    const uniqueWinnersCount = new Set(yearActivity.filter((r: any) => r.total_wins > 0).map((r: any) => r.email)).size;
    const newInvolvedCount = [...uniqueEmails].filter(email => earliestAuctionByEmail[email] === year).length;

    let churnedCount = 0;
    if (yearIdx > 0) {
      const prevYear = allYears[yearIdx - 1];
      const prevAuctionNames = new Set((auctionsByYear[prevYear] || []).map((a: any) => a.auction_name));
      const prevEmails = new Set(activityData.filter((r: any) => prevAuctionNames.has(r.auction_name)).map((r: any) => r.email));
      churnedCount = [...prevEmails].filter(email => !uniqueEmails.has(email)).length;
    }

    const newRegistrantsCount = regsData.filter((r: any) => {
      const regDate = new Date(r.join_date || r.created_at);
      return regDate.getFullYear() === year;
    }).length;

    return {
      year,
      salesCount: yearAuctions.length,
      totalRevenue,
      booksSold,
      medianPrice,
      uniqueInvolved: uniqueInvolvedCount,
      uniqueWinners: uniqueWinnersCount,
      avgPricePerItem: booksSold > 0 ? Math.round(totalRevenue / booksSold) : 0,
      newInvolved: newInvolvedCount,
      churned: churnedCount,
      newRegistrants: newRegistrantsCount,
    };
  });

  // KPIs
  const uniqueInvolved = new Set(activityData.map((r: any) => r.email)).size;
  const auctionCount = (auctionsData ?? []).length || 1;
  const soldBooks = filteredBooksData.filter((b: any) => b.sold_flag);
  const totalOpening = filteredBooksData.reduce((sum: number, b: any) => sum + (Number(b.opening_price) || 0), 0);
  const avgOpeningPrice = filteredBooksData.length > 0 ? totalOpening / filteredBooksData.length : 0;
  const totalSoldRevenue = soldBooks.reduce((sum: number, b: any) => sum + (Number(b.sold_price) || 0), 0);
  const totalSoldOpening = soldBooks.reduce((sum: number, b: any) => sum + (Number(b.opening_price) || 0), 0);
  const avgUplift =
    totalSoldOpening > 0 ? (((totalSoldRevenue - totalSoldOpening) / totalSoldOpening) * 100).toFixed(0) : "—";

  const kpis: BrandKPIs = {
    avgOpeningPrice: avgOpeningPrice > 0 ? `$${Math.round(avgOpeningPrice).toLocaleString()}` : "—",
    avgUplift: avgUplift !== "—" ? `${avgUplift}%` : "—",
    uniqueInvolved: uniqueInvolved.toLocaleString(),
    avgInvolvedPerSale: Math.round(uniqueInvolved / auctionCount).toLocaleString(),
  };

  return {
    pastSalesData: sales,
    involvedData: involved,
    churnData: churn,
    yearlyTrendsData: yearlyTrends,
    rawActivityData: activityData,
    rawRegsData: regsData,
    parallelRegsData: parallelRegs,
    rawAuctionsData: auctionsData ?? [],
    dailySnapshots: snapshotsData,
    kpis,
  };
}

const STALE_TIME = 10 * 60 * 1000; // 10 minutes

export function usePastSales(brand: "genazym" | "zaidy") {
  const { data, isLoading, error } = useQuery({
    queryKey: ["brandData", brand],
    queryFn: () => fetchBrandData(brand),
    staleTime: STALE_TIME,
    gcTime: STALE_TIME * 2,
  });

  return {
    pastSalesData: data?.pastSalesData ?? [],
    involvedData: data?.involvedData ?? [],
    churnData: data?.churnData ?? [],
    yearlyTrendsData: data?.yearlyTrendsData ?? [],
    rawActivityData: data?.rawActivityData ?? [],
    rawRegsData: data?.rawRegsData ?? [],
    parallelRegsData: data?.parallelRegsData ?? [],
    rawAuctionsData: data?.rawAuctionsData ?? [],
    dailySnapshots: data?.dailySnapshots ?? [],
    kpis: data?.kpis ?? { avgOpeningPrice: "—", avgUplift: "—", uniqueInvolved: "—", avgInvolvedPerSale: "—" },
    loading: isLoading,
    error: error ? (error as Error).message : null,
  };
}

export function useRefreshData() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["brandData"] });
}
