import { useState, useMemo } from "react";
import KPICard from "@/components/dashboard/KPICard";
import DrillDownDrawer from "@/components/dashboard/DrillDownDrawer";
import OverviewTab, { type DisplayMode } from "@/components/current-sale/OverviewTab";
import { usePastSales } from "@/hooks/usePastSales";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Phone, Mail, AlertTriangle } from "lucide-react";

const tabs = [
  { key: "overview", label: "סקירה" },
  { key: "byDX", label: "לפי יום לפני מכירה" },
  { key: "bySale", label: "לפי מכירה אחת" },
  { key: "pace", label: "קצב התקדמות" },
  { key: "missing", label: "לקוחות חסרים" },
];

type Brand = "genazym" | "zaidy";

export default function CurrentSale() {
  const [activeTab, setActiveTab] = useState("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [brand, setBrand] = useState<Brand>("genazym");

  const { rawActivityData, rawAuctionsData, dailySnapshots, pastSalesData, loading, error } = usePastSales(brand);

  const openCustomer = (c: any) => { setSelectedCustomer(c); setDrawerOpen(true); };
  const selectedBrand = brand === "genazym" ? "גנזים" as const : "זיידי" as const;

  // Find the latest auction (reference) and the one before it
  const { latestAuction, prevAuction } = useMemo(() => {
    const sorted = [...rawAuctionsData].sort((a: any, b: any) => (b.auction_date || "").localeCompare(a.auction_date || ""));
    return { latestAuction: sorted[0], prevAuction: sorted[1] };
  }, [rawAuctionsData]);

  // Missing customers: active in previous auctions but NOT in the latest
  const missingCustomers = useMemo(() => {
    if (!latestAuction || !rawActivityData.length) return [];

    const latestEmails = new Set(
      rawActivityData.filter((r: any) => r.auction_name === latestAuction.auction_name).map((r: any) => r.email)
    );

    // Get all customers who were active in any of the last 3 auctions (excluding latest)
    const sorted = [...rawAuctionsData].sort((a: any, b: any) => (b.auction_date || "").localeCompare(a.auction_date || ""));
    const recentPrevAuctions = sorted.slice(1, 4).map((a: any) => a.auction_name);
    const recentPrevSet = new Set(recentPrevAuctions);

    // Group activity by email for recent previous auctions
    const prevCustomers: Record<string, any[]> = {};
    rawActivityData.forEach((r: any) => {
      if (recentPrevSet.has(r.auction_name) && !latestEmails.has(r.email)) {
        if (!prevCustomers[r.email]) prevCustomers[r.email] = [];
        prevCustomers[r.email].push(r);
      }
    });

    return Object.entries(prevCustomers).map(([email, rows]) => {
      const allRows = rawActivityData.filter((r: any) => r.email === email);
      const totalBids = allRows.reduce((s: number, r: any) => s + (r.total_bids || 0), 0);
      const totalWinValue = allRows.reduce((s: number, r: any) => r.was_winner ? s + (r.max_bid || 0) : s, 0);
      const auctionsCount = allRows.length;
      const avgBids = auctionsCount > 0 ? Math.round(totalBids / auctionsCount) : 0;
      const lastRow = rows.sort((a: any, b: any) => (b.auction_date || "").localeCompare(a.auction_date || ""))[0];
      const lastAuctionName = lastRow?.auction_name || "";
      const num = lastAuctionName.match(/\d+/)?.[0] || "";

      return {
        email,
        name: rows[0].full_name || email,
        country: rows[0].country || "—",
        lastSale: `מכירה #${num}`,
        avgBids,
        totalSpend: totalWinValue,
        auctionsCount,
      };
    }).sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 50);
  }, [rawActivityData, rawAuctionsData, latestAuction]);

  // Pace data: bids per auction (last 7 auctions)
  const paceData = useMemo(() => {
    if (!rawAuctionsData.length) return [];
    const sorted = [...rawAuctionsData].sort((a: any, b: any) => (a.auction_date || "").localeCompare(b.auction_date || "")).slice(-7);
    return sorted.map((auction: any) => {
      const rows = rawActivityData.filter((r: any) => r.auction_name === auction.auction_name);
      const totalBids = rows.reduce((s: number, r: any) => s + (r.total_bids || 0), 0);
      const num = auction.auction_name.match(/\d+/)?.[0] || "";
      return { sale: `#${num}`, bids: totalBids, involved: rows.length };
    });
  }, [rawActivityData, rawAuctionsData]);

  // KPIs for missing tab
  const missingKpis = useMemo(() => {
    const totalSpend = missingCustomers.reduce((s, c) => s + c.totalSpend, 0);
    const avgBids = missingCustomers.length > 0
      ? (missingCustomers.reduce((s, c) => s + c.avgBids, 0) / missingCustomers.length).toFixed(1)
      : "0";
    return {
      count: missingCustomers.length,
      totalSpend: `$${Math.round(totalSpend / 1000).toLocaleString()}K`,
      avgBids,
    };
  }, [missingCustomers]);

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border px-8 pt-6 pb-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="section-title">מכירה נוכחית</h2>
          <div className="flex items-center bg-card border border-border rounded-lg p-0.5 shadow-sm">
            <button onClick={() => setBrand("genazym")} className={`px-5 py-2 text-sm font-medium rounded-md transition-all duration-200 ${brand === "genazym" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>גנזים</button>
            <button onClick={() => setBrand("zaidy")} className={`px-5 py-2 text-sm font-medium rounded-md transition-all duration-200 ${brand === "zaidy" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>זיידי</button>
          </div>
        </div>
        <div className="sub-nav mb-0 inline-flex mt-4">
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`sub-nav-item ${activeTab === tab.key ? "sub-nav-item-active" : ""}`}>{tab.label}</button>
          ))}
        </div>
      </div>

      <div className="p-8 animate-fade-in">
        {(activeTab === "overview" || activeTab === "byDX" || activeTab === "bySale") && (
          <OverviewTab selectedBrand={selectedBrand} mode={activeTab as DisplayMode} dailySnapshots={dailySnapshots} rawAuctionsData={rawAuctionsData} />
        )}

        {activeTab === "pace" && (
          <>
            {loading && <div className="text-center py-20 text-muted-foreground text-sm">טוען נתונים...</div>}
            {error && <div className="text-center py-20 text-destructive text-sm">שגיאה: {error}</div>}
            {!loading && !error && (
              <>
                <div className="grid grid-cols-4 gap-4 mb-8">
                  <KPICard label="מכירות (מותג)" value={rawAuctionsData.length.toString()} />
                  <KPICard label="מכירה אחרונה" value={latestAuction ? `#${latestAuction.auction_name.match(/\d+/)?.[0] || ""}` : "—"} />
                  <KPICard label="מעורבים במכירה האחרונה" value={rawActivityData.filter((r: any) => r.auction_name === latestAuction?.auction_name).length.toString()} />
                  <KPICard label="זוכים במכירה האחרונה" value={rawActivityData.filter((r: any) => r.auction_name === latestAuction?.auction_name && r.was_winner).length.toString()} />
                </div>
                <div className="chart-card">
                  <div className="chart-title">הצעות לפי מכירה (7 אחרונות)</div>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={paceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                      <XAxis dataKey="sale" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="bids" fill="hsl(220,35%,18%)" radius={[4, 4, 0, 0]} name="הצעות" />
                      <Bar dataKey="involved" fill="hsl(38,65%,52%)" radius={[4, 4, 0, 0]} name="מעורבים" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === "missing" && (
          <>
            {loading && <div className="text-center py-20 text-muted-foreground text-sm">טוען נתונים...</div>}
            {error && <div className="text-center py-20 text-destructive text-sm">שגיאה: {error}</div>}
            {!loading && !error && (
              <>
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <KPICard label="לקוחות חסרים" value={missingKpis.count.toString()} />
                  <KPICard label="סה״כ זכיות חסרים" value={missingKpis.totalSpend} subtitle="ערך מצטבר" />
                  <KPICard label="ממוצע הצעות/מכירה" value={missingKpis.avgBids} />
                </div>
                <div className="chart-card">
                  <div className="chart-title">לקוחות שהיו פעילים לאחרונה אך חסרים במכירה האחרונה ({latestAuction ? `#${latestAuction.auction_name.match(/\d+/)?.[0]}` : ""})</div>
                  <table className="data-table">
                    <thead>
                      <tr><th>שם</th><th>מדינה</th><th>מכירה אחרונה</th><th>ממוצע הצעות</th><th>סה״כ זכיות ($)</th><th>מכירות</th></tr>
                    </thead>
                    <tbody>
                      {missingCustomers.map((c) => (
                        <tr key={c.email} onClick={() => openCustomer(c)}>
                          <td className="font-semibold">{c.name}</td>
                          <td>{c.country}</td>
                          <td>{c.lastSale}</td>
                          <td>{c.avgBids}</td>
                          <td>${c.totalSpend.toLocaleString()}</td>
                          <td>{c.auctionsCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>

      <DrillDownDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={selectedCustomer?.name || ""}>
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="kpi-card"><div className="kpi-value">{selectedCustomer.avgBids}</div><div className="kpi-label">ממוצע הצעות</div></div>
              <div className="kpi-card"><div className="kpi-value">${selectedCustomer.totalSpend.toLocaleString()}</div><div className="kpi-label">סה״כ זכיות</div></div>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-3">מידע נוסף</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">מכירה אחרונה</span><span>{selectedCustomer.lastSale}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">מדינה</span><span>{selectedCustomer.country}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">אימייל</span><span dir="ltr" className="text-xs">{selectedCustomer.email}</span></div>
              </div>
            </div>
          </div>
        )}
      </DrillDownDrawer>
    </div>
  );
}
