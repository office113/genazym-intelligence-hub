import { useMemo, useState } from "react";
import KPICard from "@/components/dashboard/KPICard";
import InvestigationPanel from "@/components/dashboard/InvestigationPanel";
import DataStateWrapper from "@/components/dashboard/DataStateWrapper";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";

// ─── Real Supabase row shape (fact_customer_auction_activity) ───
export interface CustomerAuctionRow {
  email: string;
  full_name: string;
  country: string | null;
  purchasing_power: number | null;
  genazym_id: string | null;
  zaidy_id: string | null;
  auction_name: string;
  brand: string;
  auction_date: string;
  auction_number: number;
  total_bids: number;
  early_bids_count: number;
  live_bids_count: number;
  lots_involved: number;
  max_bid: number;
  was_early: boolean;
  was_live: boolean;
  total_wins: number;
  total_win_value: number | null;
  was_winner: boolean;
}

interface OverviewTabProps {
  brand: "genazym" | "zaidy";
  auctionData?: CustomerAuctionRow[];
  isLoading: boolean;
  error?: Error | null;
}

type DrillDownMode = "involved" | "winners" | "churned";

const brandHebrew: Record<string, string> = { genazym: "גנזים", zaidy: "זיידי" };
const formatNum = (n: number) => n.toLocaleString("he-IL");
const formatCurrency = (n: number) => `$${n.toLocaleString("he-IL")}`;

function involvementLabel(row: CustomerAuctionRow): string {
  if (row.was_early && row.was_live) return "גם וגם";
  if (row.was_early) return "מוקדם";
  if (row.was_live) return "לייב";
  return "—";
}

// ─── Aggregation ───
interface AuctionAgg {
  auction_name: string;
  auction_number: number;
  involved: number;
  winners: number;
}

function aggregateByAuction(rows: CustomerAuctionRow[]): AuctionAgg[] {
  const map = new Map<string, CustomerAuctionRow[]>();
  for (const r of rows) {
    if (!map.has(r.auction_name)) map.set(r.auction_name, []);
    map.get(r.auction_name)!.push(r);
  }
  return Array.from(map.entries())
    .map(([name, rs]) => ({
      auction_name: name,
      auction_number: rs[0]?.auction_number ?? 0,
      involved: rs.filter((r) => (r.total_bids ?? 0) > 0).length,
      winners: rs.filter((r) => r.was_winner).length,
    }))
    .sort((a, b) => a.auction_number - b.auction_number);
}

// ─── Churn ───
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
    auctionMap.get(r.auction_number)!.add(r.email);
    auctionNames.set(r.auction_number, r.auction_name);
  }
  const numbers = Array.from(auctionMap.keys()).sort((a, b) => a - b);
  const results: ChurnEntry[] = [];
  for (let i = 1; i < numbers.length; i++) {
    const prev = auctionMap.get(numbers[i - 1])!;
    const curr = auctionMap.get(numbers[i])!;
    const churnedIds = new Set([...prev].filter((id) => !curr.has(id)));
    const churnedCustomers = rows.filter(
      (r) => r.auction_number === numbers[i - 1] && churnedIds.has(r.email)
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

export default function OverviewTab({ brand, auctionData, isLoading, error }: OverviewTabProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [drillMode, setDrillMode] = useState<DrillDownMode>("involved");
  const [selectedAuction, setSelectedAuction] = useState<string>("");
  const [selectedChurnEntry, setSelectedChurnEntry] = useState<ChurnEntry | null>(null);

  // ─── Filter by brand (case-insensitive match) ───
  const allRows = useMemo(() => {
    if (!auctionData?.length) return [];
    const brandLower = brand.toLowerCase();
    return auctionData.filter((r) => r.brand?.toLowerCase() === brandLower);
  }, [auctionData, brand]);

  const auctionAggs = useMemo(() => aggregateByAuction(allRows), [allRows]);
  const churnEntries = useMemo(() => computeChurn(allRows), [allRows]);

  // ─── KPIs ───
  const uniqueCustomers = useMemo(() => new Set(allRows.map((r) => r.email)).size, [allRows]);
  const avgInvolvedPerAuction = useMemo(
    () => (auctionAggs.length ? Math.round(auctionAggs.reduce((s, a) => s + a.involved, 0) / auctionAggs.length) : 0),
    [auctionAggs]
  );
  const avgMaxBid = useMemo(
    () => (allRows.length ? Math.round(allRows.reduce((s, r) => s + (r.max_bid ?? 0), 0) / allRows.length) : 0),
    [allRows]
  );
  const avgGap = useMemo(() => {
    const winners = allRows.filter((r) => r.was_winner);
    const nonWinners = allRows.filter((r) => !r.was_winner);
    if (!winners.length || !nonWinners.length) return 0;
    const avgWin = winners.reduce((s, r) => s + (r.max_bid ?? 0), 0) / winners.length;
    const avgNon = nonWinners.reduce((s, r) => s + (r.max_bid ?? 0), 0) / nonWinners.length;
    return Math.round(avgWin - avgNon);
  }, [allRows]);

  // ─── Chart data ───
  // Short display label: "גנזים 21" or "זיידי 7"
  const shortLabel = (name: string) => {
    const match = name.match(/(\d+)/);
    const num = match ? match[1] : "";
    const bHeb = brandHebrew[brand] || brand;
    return num ? `${bHeb} ${num}` : name;
  };

  // Chart data — limited to last 7 auctions
  const recentAggs = useMemo(() => auctionAggs.slice(-7), [auctionAggs]);
  const recentChurn = useMemo(() => churnEntries.slice(-7), [churnEntries]);

  const involvedWinnersData = useMemo(
    () => recentAggs.map((a) => ({ name: a.auction_name, label: shortLabel(a.auction_name), מעורבים: a.involved, זוכים: a.winners })),
    [recentAggs, brand]
  );
  const churnChartData = useMemo(
    () => recentChurn.map((c) => ({ name: c.auction_name, label: shortLabel(c.auction_name), "לא חזרו": c.churned })),
    [recentChurn, brand]
  );

  // ─── Drill-down data ───
  const drillDownRows = useMemo(() => {
    if (drillMode === "churned" && selectedChurnEntry) {
      return selectedChurnEntry.churned_customers;
    }
    const rows = allRows.filter((r) => r.auction_name === selectedAuction);
    if (drillMode === "winners") return rows.filter((r) => r.was_winner);
    return rows;
  }, [allRows, selectedAuction, drillMode, selectedChurnEntry]);

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

  return (
    <DataStateWrapper isLoading={isLoading} error={error ?? null} isEmpty={!allRows.length && !isLoading}>
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
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={involvedWinnersData} barGap={2} barCategoryGap="20%" margin={{ top: 24, right: 8, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }} tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }} height={40} interval={0} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={40} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13, direction: "rtl", boxShadow: "0 4px 20px hsl(var(--foreground) / 0.08)" }} />
                <Bar dataKey="מעורבים" fill="hsl(var(--chart-1))" radius={[6, 6, 0, 0]} cursor="pointer"
                  onClick={(_d: unknown, idx: number) => openAuctionDrillDown(recentAggs[idx].auction_name, "involved")}>
                  <LabelList dataKey="מעורבים" position="top" style={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 600 }} offset={6} />
                </Bar>
                <Bar dataKey="זוכים" fill="hsl(var(--chart-2))" radius={[6, 6, 0, 0]} cursor="pointer"
                  onClick={(_d: unknown, idx: number) => openAuctionDrillDown(recentAggs[idx].auction_name, "winners")}>
                  <LabelList dataKey="זוכים" position="top" style={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 600 }} offset={6} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* DEBUG TABLE — remove after verification */}
        <div className="chart-card">
          <h3 className="text-sm font-semibold mb-2 text-destructive">🐛 DEBUG: involvedWinnersData (chart input)</h3>
          <table className="w-full text-xs border border-border">
            <thead><tr className="bg-muted"><th className="p-1 border border-border">auction_name</th><th className="p-1 border border-border">involved_count</th><th className="p-1 border border-border">winners_count</th></tr></thead>
            <tbody>
              {recentAggs.map((a) => (
                <tr key={a.auction_name}><td className="p-1 border border-border">{a.auction_name}</td><td className="p-1 border border-border">{a.involved}</td><td className="p-1 border border-border">{a.winners}</td></tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* לא חזרו */}
        <div className="chart-card">
          <div className="chart-title">לא חזרו מהמכירה הקודמת</div>
          <p className="text-xs text-muted-foreground mb-4 -mt-2">לחץ על עמודה לרשימת הלקוחות</p>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={churnChartData} barCategoryGap="30%" margin={{ top: 24, right: 8, bottom: 8, left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} opacity={0.4} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))", fontWeight: 500 }} tickLine={false} axisLine={{ stroke: "hsl(var(--border))" }} height={40} interval={0} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickLine={false} axisLine={false} width={40} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 13, direction: "rtl", boxShadow: "0 4px 20px hsl(var(--foreground) / 0.08)" }} />
                <Bar dataKey="לא חזרו" radius={[6, 6, 0, 0]} cursor="pointer"
                  onClick={(_d: unknown, idx: number) => openChurnDrillDown(recentChurn[idx])}>
                  {churnChartData.map((_, index) => (
                    <Cell key={index} fill="hsl(var(--chart-4))" />
                  ))}
                  <LabelList dataKey="לא חזרו" position="top" style={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 600 }} offset={6} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ═══ Drill-Down ═══ */}
      <InvestigationPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={drillMode === "churned" ? `לא חזרו — ${selectedAuction}` : selectedAuction}
        subtitle={`${brandHebrew[brand]} — ${drillMode === "involved" ? "מעורבים" : drillMode === "winners" ? "זוכים" : "לקוחות שלא חזרו מהמכירה הקודמת"}`}
      >
        <div className="space-y-4">
          {drillMode !== "churned" && (
            <div className="sub-nav inline-flex mb-2">
              <button onClick={() => setDrillMode("involved")}
                className={`sub-nav-item ${drillMode === "involved" ? "sub-nav-item-active" : ""}`}>
                מעורבים ({allRows.filter((r) => r.auction_name === selectedAuction).length})
              </button>
              <button onClick={() => setDrillMode("winners")}
                className={`sub-nav-item ${drillMode === "winners" ? "sub-nav-item-active" : ""}`}>
                זוכים ({allRows.filter((r) => r.auction_name === selectedAuction && r.was_winner).length})
              </button>
            </div>
          )}

          <div className="grid grid-cols-4 gap-3">
            <KPICard label="לקוחות" value={formatNum(drillDownRows.length)} />
            <KPICard label="ביד מקסימלי ממוצע"
              value={formatCurrency(drillDownRows.length ? Math.round(drillDownRows.reduce((s, r) => s + (r.max_bid ?? 0), 0) / drillDownRows.length) : 0)} />
            <KPICard label="סה״כ לוטים" value={formatNum(drillDownRows.reduce((s, r) => s + (r.lots_involved ?? 0), 0))} />
            <KPICard
              label={drillMode === "winners" ? "סה״כ זכיות" : "זוכים"}
              value={drillMode === "winners"
                ? formatCurrency(drillDownRows.reduce((s, r) => s + (r.total_win_value ?? 0), 0))
                : formatNum(drillDownRows.filter((r) => r.was_winner).length)} />
          </div>

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
                      </>
                    ) : drillMode === "churned" ? (
                      <>
                        <th>מס׳ בידים (מכירה קודמת)</th>
                        <th>סוג מעורבות (מכירה קודמת)</th>
                        <th>לוטים מעורבים (מכירה קודמת)</th>
                        <th>ביד מקסימלי (מכירה קודמת)</th>
                        <th>זכה (מכירה קודמת)</th>
                      </>
                    ) : (
                      <>
                        <th>מס׳ בידים</th>
                        <th>סוג מעורבות</th>
                        <th>לוטים מעורבים</th>
                        <th>ביד מקסימלי</th>
                        <th>האם זכה</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {drillDownRows.map((row, i) => (
                    <tr key={`${row.email}-${i}`} className={i % 2 === 0 ? "" : "bg-secondary/20"}>
                      <td className="font-medium">{row.full_name}</td>
                      <td className="text-muted-foreground text-xs" dir="ltr">{row.email}</td>
                      {drillMode === "winners" ? (
                        <>
                          <td>{formatNum(row.total_wins)}</td>
                          <td className="font-semibold" style={{ color: "hsl(var(--accent))" }}>{formatCurrency(row.total_win_value ?? 0)}</td>
                          <td>{formatNum(row.total_bids)}</td>
                          <td>{involvementLabel(row)}</td>
                        </>
                      ) : drillMode === "churned" ? (
                        <>
                          <td>{formatNum(row.total_bids)}</td>
                          <td>{involvementLabel(row)}</td>
                          <td>{formatNum(row.lots_involved)}</td>
                          <td className="font-semibold" style={{ color: "hsl(var(--accent))" }}>{formatCurrency(row.max_bid)}</td>
                          <td>{row.was_winner ? "✓" : "—"}</td>
                        </>
                      ) : (
                        <>
                          <td>{formatNum(row.total_bids)}</td>
                          <td>{involvementLabel(row)}</td>
                          <td>{formatNum(row.lots_involved)}</td>
                          <td className="font-semibold" style={{ color: "hsl(var(--accent))" }}>{formatCurrency(row.max_bid)}</td>
                          <td>{row.was_winner ? "✓" : "—"}</td>
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
    </DataStateWrapper>
  );
}
