import { useState, useEffect } from "react";
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

function extractSaleNumber(auctionName: string): number {
  const match = auctionName.match(/\d+/);
  return match ? parseInt(match[0]) : 0;
}

function formatSaleLabel(auctionName: string): string {
  const num = extractSaleNumber(auctionName);
  return num ? `#${num}` : auctionName;
}

async function fetchAllPages(table: string, filters: Record<string, string>, select = "*") {
  let allData: any[] = [];
  let from = 0;
  const PAGE_SIZE = 1000;
  let hasMore = true;

  while (hasMore) {
    let query = (supabase.from(table) as any).select(select).range(from, from + PAGE_SIZE - 1);
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value);
    });

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    allData = [...allData, ...(data ?? [])];
    hasMore = (data ?? []).length === PAGE_SIZE;
    from += PAGE_SIZE;
  }

  return allData;
}

export function usePastSales(brand: "genazym" | "zaidy") {
  const [pastSalesData, setPastSalesData] = useState<SaleRow[]>([]);
  const [involvedData, setInvolvedData] = useState<InvolvedBarData[]>([]);
  const [churnData, setChurnData] = useState<ChurnBarData[]>([]);
  const [kpis, setKpis] = useState<BrandKPIs>({
    avgOpeningPrice: "—",
    avgUplift: "—",
    uniqueInvolved: "—",
    avgInvolvedPerSale: "—",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const brandFilter = brand === "genazym" ? "Genazym" : "Zaidy";

        // 1. שליפת מכירות
        const { data: auctionsData, error: auctionsErr } = await supabase
          .from("auctions")
          .select("*")
          .eq("brand", brandFilter)
          .order("auction_date", { ascending: false });

        if (auctionsErr) throw new Error(auctionsErr.message);
        if (cancelled) return;

        // 2. שליפת כל נתוני הפעילות עם pagination
        const activityData = await fetchAllPages("fact_customer_auction_activity", { brand: brandFilter });
        if (cancelled) return;

        // 3. שליפת ספרים עם pagination
        const booksData = await fetchAllPages(
          "fact_book_auction_summary",
          { brand: brandFilter },
          "auction_name, sold_flag, sold_price, opening_price",
        );
        if (cancelled) return;

        // 4. שליפת נרשמים עם pagination
        const regsData = await fetchAllPages(
          "registrations",
          { brand: brandFilter },
          "email, brand, join_date, approved",
        );
        if (cancelled) return;

        // קיבוץ לפי auction_name
        const activityByAuction: Record<string, any[]> = {};
        activityData.forEach((row: any) => {
          if (!activityByAuction[row.auction_name]) activityByAuction[row.auction_name] = [];
          activityByAuction[row.auction_name].push(row);
        });

        const booksByAuction: Record<string, any[]> = {};
        booksData.forEach((row: any) => {
          if (!booksByAuction[row.auction_name]) booksByAuction[row.auction_name] = [];
          booksByAuction[row.auction_name].push(row);
        });

        // בניית pastSalesData
        const sales: SaleRow[] = (auctionsData ?? []).map((auction: any) => {
          const auctionActivity = activityByAuction[auction.auction_name] ?? [];
          const auctionBooks = booksByAuction[auction.auction_name] ?? [];
          const winners = auctionActivity.filter((r: any) => r.total_wins > 0).length;

          // ==========================================
          // התיקון הקריטי: חישוב הכנסות מתוך הספרים בלבד!
          // ==========================================
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

        // 5 מכירות אחרונות לגרפים
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

        // נטישה
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

        // KPIs
        const uniqueInvolved = new Set(activityData.map((r: any) => r.email)).size;
        const auctionCount = (auctionsData ?? []).length || 1;
        const soldBooks = booksData.filter((b: any) => b.sold_flag);
        const totalOpening = booksData.reduce((sum: number, b: any) => sum + (Number(b.opening_price) || 0), 0);
        const avgOpeningPrice = booksData.length > 0 ? totalOpening / booksData.length : 0;
        const totalSoldRevenue = soldBooks.reduce((sum: number, b: any) => sum + (Number(b.sold_price) || 0), 0);
        const totalSoldOpening = soldBooks.reduce((sum: number, b: any) => sum + (Number(b.opening_price) || 0), 0);
        const avgUplift =
          totalSoldOpening > 0 ? (((totalSoldRevenue - totalSoldOpening) / totalSoldOpening) * 100).toFixed(0) : "—";

        if (!cancelled) {
          setPastSalesData(sales);
          setInvolvedData(involved);
          setChurnData(churn);
          setKpis({
            avgOpeningPrice: avgOpeningPrice > 0 ? `$${Math.round(avgOpeningPrice).toLocaleString()}` : "—",
            avgUplift: avgUplift !== "—" ? `${avgUplift}%` : "—",
            uniqueInvolved: uniqueInvolved.toLocaleString(),
            avgInvolvedPerSale: Math.round(uniqueInvolved / auctionCount).toLocaleString(),
          });
          setLoading(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [brand]);

  return { pastSalesData, involvedData, churnData, kpis, loading, error };
}
