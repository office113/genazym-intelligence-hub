import { useState, useMemo } from "react";
import SubNav from "@/components/layout/SubNav";
import KPICard from "@/components/dashboard/KPICard";
import { usePastSales } from "@/hooks/usePastSales";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const tabs = [
  { key: "overview", label: "סקירה" },
  { key: "funnel", label: "משפך המרה" },
  { key: "cohorts", label: "קוהורטות" },
  { key: "anomalies", label: "חריגים" },
];

type Brand = "genazym" | "zaidy";

export default function Registrants() {
  const [activeTab, setActiveTab] = useState("overview");
  const [brand, setBrand] = useState<Brand>("genazym");

  const { rawRegsData, rawActivityData, rawAuctionsData, loading, error } = usePastSales(brand);

  // Funnel: Total registered → became bidders → became winners
  const funnel = useMemo(() => {
    if (!rawRegsData.length) return [];
    const totalRegs = rawRegsData.length;
    const regEmails = new Set(rawRegsData.map((r: any) => (r.email || "").toLowerCase()));
    const bidderEmails = new Set(rawActivityData.map((r: any) => r.email?.toLowerCase()));
    const winnerEmails = new Set(rawActivityData.filter((r: any) => r.was_winner).map((r: any) => r.email?.toLowerCase()));

    const becameBidders = [...regEmails].filter(e => bidderEmails.has(e)).length;
    const becameWinners = [...regEmails].filter(e => winnerEmails.has(e)).length;

    return [
      { stage: "נרשמו", count: totalRegs, pct: 100 },
      { stage: "הציעו הצעה", count: becameBidders, pct: totalRegs > 0 ? Math.round(becameBidders / totalRegs * 100) : 0 },
      { stage: "זכו בפריט", count: becameWinners, pct: totalRegs > 0 ? Math.round(becameWinners / totalRegs * 100) : 0 },
    ];
  }, [rawRegsData, rawActivityData]);

  // Cohort data: registrants per auction window (30 days before each auction)
  const cohortData = useMemo(() => {
    if (!rawAuctionsData.length || !rawRegsData.length) return [];

    const sortedAuctions = [...rawAuctionsData]
      .sort((a: any, b: any) => (a.auction_date || "").localeCompare(b.auction_date || ""))
      .slice(-7);

    const activityByAuction: Record<string, Set<string>> = {};
    rawActivityData.forEach((r: any) => {
      if (!activityByAuction[r.auction_name]) activityByAuction[r.auction_name] = new Set();
      activityByAuction[r.auction_name].add(r.email?.toLowerCase());
    });

    const winnersByAuction: Record<string, Set<string>> = {};
    rawActivityData.filter((r: any) => r.was_winner).forEach((r: any) => {
      if (!winnersByAuction[r.auction_name]) winnersByAuction[r.auction_name] = new Set();
      winnersByAuction[r.auction_name].add(r.email?.toLowerCase());
    });

    return sortedAuctions.map((auction: any) => {
      const auctionDate = new Date(auction.auction_date);
      const windowStart = new Date(auctionDate);
      windowStart.setDate(windowStart.getDate() - 28);

      const cohortRegs = rawRegsData.filter((r: any) => {
        const joinDate = new Date(r.join_date || r.approved || r.created_at);
        return joinDate >= windowStart && joinDate <= auctionDate;
      });

      const cohortEmails = new Set(cohortRegs.map((r: any) => (r.email || "").toLowerCase()));
      const bidders = activityByAuction[auction.auction_name] || new Set();
      const winners = winnersByAuction[auction.auction_name] || new Set();

      const firstBid = [...cohortEmails].filter(e => bidders.has(e)).length;
      const winner = [...cohortEmails].filter(e => winners.has(e)).length;

      const num = auction.auction_name.match(/\d+/)?.[0] || "";
      return {
        cohort: `#${num}`,
        registered: cohortRegs.length,
        firstBid,
        winner,
      };
    });
  }, [rawAuctionsData, rawRegsData, rawActivityData]);

  // KPIs
  const kpis = useMemo(() => {
    if (!funnel.length) return null;
    const total = funnel[0].count;
    const bidders = funnel[1]?.count || 0;
    const winners = funnel[2]?.count || 0;
    return {
      total,
      bidderPct: total > 0 ? `${Math.round(bidders / total * 100)}%` : "0%",
      bidderCount: bidders,
      winnerPct: total > 0 ? `${Math.round(winners / total * 100)}%` : "0%",
      winnerCount: winners,
    };
  }, [funnel]);

  return (
    <div className="min-h-screen">
      {/* ═══ STICKY HEADER ═══ */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border px-8 pt-6 pb-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="section-title">נרשמים</h2>
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
        {loading && <div className="text-center py-20 text-muted-foreground text-sm">טוען נתונים...</div>}
        {error && <div className="text-center py-20 text-destructive text-sm">שגיאה: {error}</div>}

        {!loading && !error && activeTab === "overview" && kpis && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-8">
              <KPICard label="סה״כ נרשמים" value={kpis.total.toLocaleString()} />
              <KPICard label="הפכו למציעים" value={kpis.bidderPct} subtitle={`${kpis.bidderCount} מתוך ${kpis.total}`} />
              <KPICard label="הפכו לזוכים" value={kpis.winnerPct} subtitle={`${kpis.winnerCount} מתוך ${kpis.total}`} />
              <KPICard label="מכירות" value={rawAuctionsData.length.toString()} />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="chart-card">
                <div className="chart-title">משפך המרה</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={funnel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="stage" type="category" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(220,35%,18%)" radius={[0, 4, 4, 0]} name="כמות" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-card">
                <div className="chart-title">קוהורטות — נרשמים לפי מכירה</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={cohortData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                    <XAxis dataKey="cohort" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="registered" fill="hsl(40,8%,80%)" radius={[4, 4, 0, 0]} name="נרשמו" />
                    <Bar dataKey="firstBid" fill="hsl(220,35%,18%)" radius={[4, 4, 0, 0]} name="הצעה ראשונה" />
                    <Bar dataKey="winner" fill="hsl(38,65%,52%)" radius={[4, 4, 0, 0]} name="זכו" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {!loading && !error && activeTab === "funnel" && (
          <div className="max-w-2xl mx-auto">
            <div className="chart-card">
              <div className="chart-title">משפך המרה מפורט</div>
              <div className="space-y-4 mt-6">
                {funnel.map((stage, i) => (
                  <div key={stage.stage} className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold">{stage.stage}</span>
                      <span className="text-sm font-bold">{stage.count.toLocaleString()} ({stage.pct}%)</span>
                    </div>
                    <div className="h-8 rounded-lg overflow-hidden bg-secondary">
                      <div className="h-full rounded-lg transition-all" style={{
                        width: `${stage.pct}%`,
                        background: i === 0 ? "hsl(220,35%,18%)" : i === funnel.length - 1 ? "hsl(38,65%,52%)" : `hsl(220,35%,${18 + i * 15}%)`
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!loading && !error && activeTab === "cohorts" && (
          <div className="chart-card">
            <div className="chart-title">קוהורטות נרשמים לפי מכירה</div>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={cohortData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                <XAxis dataKey="cohort" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="registered" fill="hsl(40,8%,80%)" radius={[4, 4, 0, 0]} name="נרשמו" />
                <Bar dataKey="firstBid" fill="hsl(220,35%,18%)" radius={[4, 4, 0, 0]} name="הציעו" />
                <Bar dataKey="winner" fill="hsl(38,65%,52%)" radius={[4, 4, 0, 0]} name="זכו" />
              </BarChart>
            </ResponsiveContainer>
            <table className="data-table mt-6">
              <thead>
                <tr><th>מכירה</th><th>נרשמו</th><th>הציעו</th><th>זכו</th><th>שיעור המרה</th></tr>
              </thead>
              <tbody>
                {cohortData.map((c: any) => (
                  <tr key={c.cohort}>
                    <td className="font-semibold">{c.cohort}</td>
                    <td>{c.registered}</td>
                    <td>{c.firstBid}</td>
                    <td>{c.winner}</td>
                    <td>{c.registered > 0 ? `${Math.round(c.firstBid / c.registered * 100)}%` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && activeTab === "anomalies" && (
          <div className="text-center py-20 text-muted-foreground text-sm">
            <div className="font-display font-semibold text-lg mb-2">חריגים</div>
            <div>מערכת זיהוי חריגים תתעדכן עם נתונים נוספים</div>
          </div>
        )}
      </div>
    </div>
  );
}
