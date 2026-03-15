import { useMemo, useState } from "react";
import KPICard from "@/components/dashboard/KPICard";
import InvestigationPanel from "@/components/dashboard/InvestigationPanel";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList,
} from "recharts";

// ─── Types matching fact_customer_auction_activity / fact_customer_brand_activity ───
interface AuctionRow {
  auction_name?: string;
  brand?: string;
  total_involved?: number;
  total_winners?: number;
  avg_opening_price?: number;
  avg_closing_price?: number;
  total_opening_value?: number;
  total_closing_value?: number;
  unique_involved?: number;
  churned_count?: number;
  [key: string]: unknown;
}

interface BrandRow {
  brand?: string;
  unique_involved?: number;
  avg_involved_per_sale?: number;
  avg_opening_price?: number;
  avg_gap_open_close?: number;
  [key: string]: unknown;
}

interface OverviewTabProps {
  brand: "genazym" | "zaidy";
  auctionData?: AuctionRow[];
  brandData?: BrandRow[];
  isLoading: boolean;
}

// ─── Fallback mock data (renders until Supabase permissions are fixed) ───
const MOCK_AUCTION: AuctionRow[] = [
  { auction_name: "מכירה #47", brand: "genazym", total_involved: 298, total_winners: 142, avg_opening_price: 850, avg_closing_price: 1420, total_opening_value: 272000, total_closing_value: 404700, churned_count: 28 },
  { auction_name: "מכירה #46", brand: "genazym", total_involved: 265, total_winners: 128, avg_opening_price: 780, avg_closing_price: 1350, total_opening_value: 218400, total_closing_value: 324000, churned_count: 35 },
  { auction_name: "מכירה #45", brand: "genazym", total_involved: 340, total_winners: 165, avg_opening_price: 920, avg_closing_price: 1580, total_opening_value: 322000, total_closing_value: 490000, churned_count: 22 },
  { auction_name: "מכירה #44", brand: "genazym", total_involved: 280, total_winners: 135, avg_opening_price: 810, avg_closing_price: 1390, total_opening_value: 235000, total_closing_value: 354000, churned_count: 31 },
  { auction_name: "מכירה #43", brand: "genazym", total_involved: 310, total_winners: 148, avg_opening_price: 870, avg_closing_price: 1480, total_opening_value: 269700, total_closing_value: 399600, churned_count: 26 },
  { auction_name: "מכירה #47", brand: "zaidy", total_involved: 185, total_winners: 92, avg_opening_price: 620, avg_closing_price: 980, total_opening_value: 114700, total_closing_value: 180000, churned_count: 18 },
  { auction_name: "מכירה #46", brand: "zaidy", total_involved: 172, total_winners: 85, avg_opening_price: 590, avg_closing_price: 920, total_opening_value: 101480, total_closing_value: 158000, churned_count: 22 },
  { auction_name: "מכירה #45", brand: "zaidy", total_involved: 210, total_winners: 105, avg_opening_price: 650, avg_closing_price: 1050, total_opening_value: 136500, total_closing_value: 220500, churned_count: 15 },
  { auction_name: "מכירה #44", brand: "zaidy", total_involved: 168, total_winners: 82, avg_opening_price: 580, avg_closing_price: 910, total_opening_value: 97440, total_closing_value: 152880, churned_count: 20 },
  { auction_name: "מכירה #43", brand: "zaidy", total_involved: 195, total_winners: 95, avg_opening_price: 640, avg_closing_price: 1020, total_opening_value: 124800, total_closing_value: 198900, churned_count: 17 },
];

const MOCK_BRAND: BrandRow[] = [
  { brand: "genazym", unique_involved: 482, avg_involved_per_sale: 299, avg_opening_price: 846, avg_gap_open_close: 68400 },
  { brand: "zaidy", unique_involved: 312, avg_involved_per_sale: 186, avg_opening_price: 616, avg_gap_open_close: 42300 },
];

const brandHebrew = { genazym: "גנזים", zaidy: "זיידי" };

const formatNum = (n: number) => n.toLocaleString("he-IL");
const formatCurrency = (n: number) => `$${n.toLocaleString("he-IL")}`;

export default function OverviewTab({ brand, auctionData, brandData, isLoading }: OverviewTabProps) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelContext, setPanelContext] = useState<{ title: string; data: AuctionRow | null }>({ title: "", data: null });

  // Use live data if available, fallback to mock
  const auctions = useMemo(() => {
    const source = auctionData?.length ? auctionData : MOCK_AUCTION;
    return source.filter((r) => r.brand === brand);
  }, [auctionData, brand]);

  const brandSummary = useMemo(() => {
    const source = brandData?.length ? brandData : MOCK_BRAND;
    return source.find((r) => r.brand === brand);
  }, [brandData, brand]);

  // ─── KPI calculations ───
  const avgOpeningPrice = brandSummary?.avg_opening_price ?? 0;
  const avgGap = brandSummary?.avg_gap_open_close ?? 0;
  const uniqueInvolved = brandSummary?.unique_involved ?? 0;
  const avgInvolvedPerSale = brandSummary?.avg_involved_per_sale ?? 0;

  // ─── Chart data ───
  const involvedWinnersData = useMemo(
    () =>
      auctions.map((r) => ({
        name: r.auction_name ?? "",
        מעורבים: r.total_involved ?? 0,
        זוכים: r.total_winners ?? 0,
      })),
    [auctions]
  );

  const churnData = useMemo(
    () =>
      auctions.map((r) => ({
        name: r.auction_name ?? "",
        "לא חזרו": r.churned_count ?? 0,
      })),
    [auctions]
  );

  const openDrillDown = (row: AuctionRow) => {
    setPanelContext({ title: row.auction_name ?? "פרטי מכירה", data: row });
    setPanelOpen(true);
  };

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
      {/* ─── KPI Row ─── */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <KPICard
          label="מחיר פתיחה ממוצע לפריט"
          value={formatCurrency(avgOpeningPrice)}
          subtitle={brandHebrew[brand]}
        />
        <KPICard
          label="פער ממוצע בסך המכירה"
          value={formatCurrency(avgGap)}
          subtitle="בין פתיחה לסגירה"
        />
        <KPICard
          label="מעורבים ייחודיים במותג"
          value={formatNum(uniqueInvolved)}
          subtitle={`סה״כ ב${brandHebrew[brand]}`}
        />
        <KPICard
          label="ממוצע מעורבים למכירה"
          value={formatNum(avgInvolvedPerSale)}
          subtitle="ממוצע על כל המכירות"
        />
      </div>

      {/* ─── Charts Row (RTL: right = involved/winners, left = churn) ─── */}
      <div className="grid grid-cols-2 gap-6">
        {/* מעורבים וזוכים */}
        <div className="chart-card">
          <div className="chart-title">מעורבים וזוכים בכל מכירה</div>
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
                <Bar dataKey="מעורבים" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} cursor="pointer"
                  onClick={(_: unknown, idx: number) => openDrillDown(auctions[idx])}>
                  <LabelList dataKey="מעורבים" position="top" style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                </Bar>
                <Bar dataKey="זוכים" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} cursor="pointer"
                  onClick={(_: unknown, idx: number) => openDrillDown(auctions[idx])}>
                  <LabelList dataKey="זוכים" position="top" style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* לא חזרו */}
        <div className="chart-card">
          <div className="chart-title">לא חזרו מהמכירה הקודמת</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={churnData} barCategoryGap="30%">
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
                <Bar dataKey="לא חזרו" radius={[4, 4, 0, 0]} cursor="pointer"
                  onClick={(_: unknown, idx: number) => openDrillDown(auctions[idx])}>
                  {churnData.map((_, index) => (
                    <Cell key={index} fill="hsl(var(--chart-4))" />
                  ))}
                  <LabelList dataKey="לא חזרו" position="top" style={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── Bottom-Sheet Drill-Down ─── */}
      <InvestigationPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title={panelContext.title}
        subtitle={`${brandHebrew[brand]} — ניתוח מכירה`}
      >
        {panelContext.data && (
          <div className="space-y-6">
            {/* Summary KPIs in the drill-down */}
            <div className="grid grid-cols-4 gap-4">
              <KPICard label="מעורבים" value={formatNum(panelContext.data.total_involved ?? 0)} />
              <KPICard label="זוכים" value={formatNum(panelContext.data.total_winners ?? 0)} />
              <KPICard label="מחיר פתיחה ממוצע" value={formatCurrency(panelContext.data.avg_opening_price ?? 0)} />
              <KPICard label="מחיר סגירה ממוצע" value={formatCurrency(panelContext.data.avg_closing_price ?? 0)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="chart-card">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-muted-foreground">סה״כ פתיחה</span>
                  <span className="text-lg font-bold">{formatCurrency(panelContext.data.total_opening_value ?? 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">סה״כ סגירה</span>
                  <span className="text-lg font-bold">{formatCurrency(panelContext.data.total_closing_value ?? 0)}</span>
                </div>
              </div>
              <div className="chart-card">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-muted-foreground">לא חזרו</span>
                  <span className="text-lg font-bold text-destructive">{formatNum(panelContext.data.churned_count ?? 0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">שיעור מעורבים שזכו</span>
                  <span className="text-lg font-bold">
                    {panelContext.data.total_involved
                      ? `${Math.round(((panelContext.data.total_winners ?? 0) / panelContext.data.total_involved) * 100)}%`
                      : "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </InvestigationPanel>
    </>
  );
}
