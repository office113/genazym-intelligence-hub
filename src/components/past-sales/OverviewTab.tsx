import { useMemo, useState } from "react";
import KPICard from "@/components/dashboard/KPICard";
import InvestigationPanel from "@/components/dashboard/InvestigationPanel";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";
import {
  MOCK_CUSTOMER_AUCTION_DATA,
  INVOLVEMENT_LABELS,
  type CustomerAuctionRow,
} from "@/data/pastSalesMockData";

// ─── Props ───
interface OverviewTabProps {
  brand: "genazym" | "zaidy";
  auctionData?: CustomerAuctionRow[];
  isLoading: boolean;
}

type DrillDownMode = "involved" | "winners" | "churned";

// ─── Helpers ───
const brandHebrew: Record<string, string> = { genazym: "גנזים", zaidy: "זיידי" };
const formatNum = (n: number) => n.toLocaleString("he-IL");
const formatCurrency = (n: number) => `$${n.toLocaleString("he-IL")}`;

// ─── Aggregation: per-auction stats from customer-level rows ───
interface AuctionAgg {
  auction_name: string;
  auction_number: number;
  involved: number;
  winners: number;
  avg_max_bid: number;
}

function aggregateByAuction(rows: CustomerAuctionRow[]): AuctionAgg[] {
  const map = new Map<string, CustomerAuctionRow[]>();
  for (const r of rows) {
    const key = r.auction_name;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return Array.from(map.entries())
    .map(([name, rs]) => ({
      auction_name: name,
      auction_number: rs[0]?.auction_number ?? 0,
      involved: rs.length,
      winners: rs.filter((r) => r.is_winner).length,
      avg_max_bid: rs.reduce((s, r) => s + r.max_bid, 0) / rs.length,
    }))
    .sort((a, b) => a.auction_number - b.auction_number);
}

// ─── Churn: customers in auction N-1 but NOT in auction N ───
interface ChurnEntry {
  auction_name: string;
  auction_number: number;
  churned: number;
  churned_customers: CustomerAuctionRow[];
}

function computeChurn(rows: CustomerAuctionRow[]): ChurnEntry[] {
  const auctionMap = new Map<number, Set<string>>();
  const auctionNames = new Map<number, string>();
  for (const r of rows) {
    if (!auctionMap.has(r.auction_number)) auctionMap.set(r.auction_number, new Set());
    auctionMap.get(r.auction_number)!.add(r.customer_id);
    auctionNames.set(r.auction_number, r.auction_name);
  }
  const numbers = Array.from(auctionMap.keys()).sort((a, b) => a - b);
  const results: ChurnEntry[] = [];
  for (let i = 1; i < numbers.length; i++) {
    const prev = auctionMap.get(numbers[i - 1])!;
    const curr = auctionMap.get(numbers[i])!;
    const churnedIds = new Set([...prev].filter((id) => !curr.has(id)));
    // Get the previous auction data for those who churned
    const churnedCustomers = rows.filter(
      (r) => r.auction_number === numbers[i - 1] && churnedIds.has(r.customer_id)
    );
    results.push({
      auction_name: auctionNames.get(numbers[i])!,
      auction_number: numbers[i],
      churned: churnedIds.size,
      churned_customers: churnedCustomers,
    });
  }
  return results;
}

export default function OverviewTab({ brand, auctionData, isLoading }: OverviewTabProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [drillMode, setDrillMode] = useState<DrillDownMode>("involved");
  const [selectedAuction, setSelectedAuction] = useState<string>("");
  const [selectedChurnEntry, setSelectedChurnEntry] = useState<ChurnEntry | null>(null);

  // ─── Data source ───
  const allRows = useMemo(() => {
    const source = auctionData?.length ? auctionData : MOCK_CUSTOMER_AUCTION_DATA;
    return source.filter((r) => r.brand === brand);
  }, [auctionData, brand]);

  const auctionAggs = useMemo(() => aggregateByAuction(allRows), [allRows]);
  const churnEntries = useMemo(() => computeChurn(allRows), [allRows]);

  // ─── KPIs (computed from customer rows) ───
  const uniqueCustomers = useMemo(() => new Set(allRows.map((r) => r.customer_id)).size, [allRows]);
  const avgInvolvedPerAuction = useMemo(
    () => (auctionAggs.length ? Math.round(auctionAggs.reduce((s, a) => s + a.involved, 0) / auctionAggs.length) : 0),
    [auctionAggs]
  );
  const avgMaxBid = useMemo(
    () => (allRows.length ? Math.round(allRows.reduce((s, r) => s + r.max_bid, 0) / allRows.length) : 0),
    [allRows]
  );
  const avgGap = useMemo(() => {
    // gap between avg max_bid of winners vs non-winners as proxy for open→close gap
    const winners = allRows.filter((r) => r.is_winner);
    const nonWinners = allRows.filter((r) => !r.is_winner);
    if (!winners.length || !nonWinners.length) return 0;
    const avgWin = winners.reduce((s, r) => s + r.max_bid, 0) / winners.length;
    const avgNon = nonWinners.reduce((s, r) => s + r.max_bid, 0) / nonWinners.length;
    return Math.round(avgWin - avgNon);
  }, [allRows]);

  // ─── Chart data ───
  const involvedWinnersData = useMemo(
    () => auctionAggs.map((a) => ({ name: a.auction_name, מעורבים: a.involved, זוכים: a.winners })),
    [auctionAggs]
  );
  const churnChartData = useMemo(
    () => churnEntries.map((c) => ({ name: c.auction_name, "לא חזרו": c.churned })),
    [churnEntries]
  );

  // ─── Drill-down data ───
  const drillDownRows = useMemo(() => {
    if (drillMode === "churned" && selectedChurnEntry) {
      return selectedChurnEntry.churned_customers;
    }
    const rows = allRows.filter((r) => r.auction_name === selectedAuction);
    if (drillMode === "winners") return rows.filter((r) => r.is_winner);
    return rows;
  }, [allRows, selectedAuction, drillMode, selectedChurnEntry]);

  // ─── Open drill-downs ───
  const openAuctionDrillDown = (auctionName: string, mode: DrillDownMode) => {
    setSelectedAuction(auctionName);
    setDrillMode(mode);
    setSelectedChurnEntry(null);
    setPanelOpen(true);
  };

  const openChurnDrillDown = (entry: ChurnEntry) => {
    setSelectedAuction(entry.auction_name);
    setDrillMode("churned");
    setSelectedChurnEntry(entry);
    setPanelOpen(true);
  };

  // ─── Loading skeleton ───
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="kpi-card animate-pulse">
              <div className="h-8 bg-muted rounded w-20 mb-2" />
              <div className="h-4 bg-muted rounded w-32" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="chart-card h-72 animate-pulse" />
          <div className="chart-card h-72 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ═══ KPI Cards ═══ */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <KPICard label="מחיר פתיחה ממוצע לפריט" value={formatCurrency(avgMaxBid)} subtitle={brandHebrew[brand]} />
        <KPICard label="פער ממוצע בסך המכירה" value={formatCurrency(avgGap)} subtitle="בין פתיחה לסגירה" />
        <KPICard label="מעורבים ייחודיים במותג" value={formatNum(uniqueCustomers)} subtitle={`סה״כ ב${brandHebrew[brand]}`} />
        <KPICard label="ממוצע מעורבים למכירה" value={formatNum(avgInvolvedPerAuction)} subtitle="ממוצע על כל המכירות" />
      </div>

      {/* ═══ Charts ═══ */}
      <div className="grid grid-cols-2 gap-6">
        {/* מעורבים וזוכים */}
        <div className="chart-card">
          <div className="chart-title">מעורבים וזוכים בכל מכירה</div>
          <p className="text-xs text-muted-foreground mb-4 -mt-2">לחץ על עמודה לפירוט</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={involvedWinnersData} barGap={2} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 13,
                    direction: "rtl",
                  }}
                />
                <Bar
                  dataKey="מעורבים"
                  fill="hsl(var(--chart-1))"
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(_d: unknown, idx: number) => openAuctionDrillDown(auctionAggs[idx].auction_name, "involved")}
                >
                  <LabelList dataKey="מעורבים" position="top" style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                </Bar>
                <Bar
                  dataKey="זוכים"
                  fill="hsl(var(--chart-2))"
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(_d: unknown, idx: number) => openAuctionDrillDown(auctionAggs[idx].auction_name, "winners")}
                >
                  <LabelList dataKey="זוכים" position="top" style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* לא חזרו */}
        <div className="chart-card">
          <div className="chart-title">לא חזרו מהמכירה הקודמת</div>
          <p className="text-xs text-muted-foreground mb-4 -mt-2">לחץ על עמודה לרשימת הלקוחות</p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={churnChartData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 13,
                    direction: "rtl",
                  }}
                />
                <Bar
                  dataKey="לא חזרו"
                  radius={[4, 4, 0, 0]}
                  cursor="pointer"
                  onClick={(_d: unknown, idx: number) => openChurnDrillDown(churnEntries[idx])}
                >
                  {churnChartData.map((_, index) => (
                    <Cell key={index} fill="hsl(var(--chart-4))" />
                  ))}
                  <LabelList dataKey="לא חזרו" position="top" style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ═══ Investigation Panel (Bottom-Sheet Drill-Down) ═══ */}
      <InvestigationPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={drillMode === "churned" ? `לא חזרו — ${selectedAuction}` : selectedAuction}
        subtitle={`${brandHebrew[brand]} — ${drillMode === "involved" ? "מעורבים" : drillMode === "winners" ? "זוכים" : "לקוחות שלא חזרו מהמכירה הקודמת"}`}
      >
        <div className="space-y-4">
          {/* Mode switcher (only for involved/winners) */}
          {drillMode !== "churned" && (
            <div className="sub-nav inline-flex mb-2">
              <button
                onClick={() => setDrillMode("involved")}
                className={`sub-nav-item ${drillMode === "involved" ? "sub-nav-item-active" : ""}`}
              >
                מעורבים ({allRows.filter((r) => r.auction_name === selectedAuction).length})
              </button>
              <button
                onClick={() => setDrillMode("winners")}
                className={`sub-nav-item ${drillMode === "winners" ? "sub-nav-item-active" : ""}`}
              >
                זוכים ({allRows.filter((r) => r.auction_name === selectedAuction && r.is_winner).length})
              </button>
            </div>
          )}

          {/* Summary KPIs */}
          <div className="grid grid-cols-4 gap-3">
            <KPICard label="לקוחות" value={formatNum(drillDownRows.length)} />
            <KPICard
              label="ביד מקסימלי ממוצע"
              value={formatCurrency(
                drillDownRows.length ? Math.round(drillDownRows.reduce((s, r) => s + r.max_bid, 0) / drillDownRows.length) : 0
              )}
            />
            <KPICard
              label="סה״כ לוטים"
              value={formatNum(drillDownRows.reduce((s, r) => s + r.lots_involved, 0))}
            />
            <KPICard
              label={drillMode === "winners" ? "סה״כ זכיות" : "זוכים"}
              value={
                drillMode === "winners"
                  ? formatCurrency(drillDownRows.reduce((s, r) => s + r.total_win_value, 0))
                  : formatNum(drillDownRows.filter((r) => r.is_winner).length)
              }
            />
          </div>

          {/* Data table */}
          <div className="chart-card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr style={{ background: "hsl(var(--secondary) / 0.5)" }}>
                    <th>שם לקוח</th>
                    <th>אימייל</th>
                    {drillMode === "winners" ? (
                      <>
                        <th>לוטים שזכה</th>
                        <th>סכום זכייה כולל</th>
                        <th>מס׳ בידים</th>
                        <th>סוג מעורבות</th>
                        <th>ביד ראשון במותג</th>
                      </>
                    ) : drillMode === "churned" ? (
                      <>
                        <th>מס׳ בידים{"\n"}(מכירה קודמת)</th>
                        <th>סוג מעורבות{"\n"}(מכירה קודמת)</th>
                        <th>לוטים מעורבים{"\n"}(מכירה קודמת)</th>
                        <th>ביד מקסימלי{"\n"}(מכירה קודמת)</th>
                        <th>זכה{"\n"}(מכירה קודמת)</th>
                        <th>ביד ראשון במותג</th>
                      </>
                    ) : (
                      <>
                        <th>מס׳ בידים</th>
                        <th>סוג מעורבות</th>
                        <th>לוטים מעורבים</th>
                        <th>ביד מקסימלי</th>
                        <th>האם זכה</th>
                        <th>ביד ראשון במותג</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {drillDownRows.map((row, i) => (
                    <tr key={`${row.customer_id}-${i}`} className={i % 2 === 0 ? "" : "bg-secondary/20"}>
                      <td className="font-medium">{row.full_name}</td>
                      <td className="text-muted-foreground text-xs" dir="ltr">{row.email}</td>
                      {drillMode === "winners" ? (
                        <>
                          <td>{formatNum(row.win_count)}</td>
                          <td className="font-semibold" style={{ color: "hsl(var(--accent))" }}>{formatCurrency(row.total_win_value)}</td>
                          <td>{formatNum(row.bid_count)}</td>
                          <td>{INVOLVEMENT_LABELS[row.involvement_type] ?? row.involvement_type}</td>
                          <td className="text-muted-foreground text-xs">{row.first_bid_at_brand}</td>
                        </>
                      ) : drillMode === "churned" ? (
                        <>
                          <td>{formatNum(row.bid_count)}</td>
                          <td>{INVOLVEMENT_LABELS[row.involvement_type] ?? row.involvement_type}</td>
                          <td>{formatNum(row.lots_involved)}</td>
                          <td className="font-semibold" style={{ color: "hsl(var(--accent))" }}>{formatCurrency(row.max_bid)}</td>
                          <td>{row.is_winner ? "✓" : "—"}</td>
                          <td className="text-muted-foreground text-xs">{row.first_bid_at_brand}</td>
                        </>
                      ) : (
                        <>
                          <td>{formatNum(row.bid_count)}</td>
                          <td>{INVOLVEMENT_LABELS[row.involvement_type] ?? row.involvement_type}</td>
                          <td>{formatNum(row.lots_involved)}</td>
                          <td className="font-semibold" style={{ color: "hsl(var(--accent))" }}>{formatCurrency(row.max_bid)}</td>
                          <td>{row.is_winner ? "✓" : "—"}</td>
                          <td className="text-muted-foreground text-xs">{row.first_bid_at_brand}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </InvestigationPanel>
    </>
  );
}
