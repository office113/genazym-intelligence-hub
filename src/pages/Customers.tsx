import { useState, useMemo } from "react";
import SubNav from "@/components/layout/SubNav";
import KPICard from "@/components/dashboard/KPICard";
import DrillDownDrawer from "@/components/dashboard/DrillDownDrawer";
import { usePastSales } from "@/hooks/usePastSales";
import { Search, X, Plus, Filter, Star, TrendingUp, BookOpen, Clock, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import CustomerLink from "@/components/customers/CustomerLink";

const tabs = [
  { key: "search", label: "חיפוש חכם" },
  { key: "profile", label: "פרופיל לקוח" },
  { key: "preferences", label: "העדפות" },
  { key: "activity", label: "פעילות" },
  { key: "segments", label: "פלחים" },
];

const suggestedQueries = [
  "לקוחות שהציעו מעל $100,000",
  "לקוחות שזכו ב-5+ מכירות",
  "לקוחות שלא פעילים במכירה האחרונה",
  "לקוחות עם הצעות מוקדמות בד״כ",
];

type Brand = "genazym" | "zaidy";

export default function Customers() {
  const [activeTab, setActiveTab] = useState("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [brand, setBrand] = useState<Brand>("genazym");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({ genazymId: '', zaidyId: '', minSpend: '', maxSpend: '' });

  const { rawActivityData, rawAuctionsData, loading, error } = usePastSales(brand);

  // Aggregate activity data into customer profiles
  const customers = useMemo(() => {
    if (!rawActivityData.length) return [];

    const byEmail: Record<string, any[]> = {};
    rawActivityData.forEach((r: any) => {
      if (!byEmail[r.email]) byEmail[r.email] = [];
      byEmail[r.email].push(r);
    });

    // Sort auctions by date for "last active" lookup
    const auctionDateMap: Record<string, string> = {};
    rawAuctionsData.forEach((a: any) => {
      auctionDateMap[a.auction_name] = a.auction_date;
    });

    return Object.entries(byEmail).map(([email, rows]) => {
      const totalBids = rows.reduce((s, r) => s + (r.total_bids || 0), 0);
      const totalWins = rows.reduce((s, r) => s + (r.total_wins || 0), 0);
      // totalHistoricalWins: sum max_bid where was_winner is true
      const totalSpend = rows.reduce((s, r) => r.was_winner ? s + (r.max_bid || 0) : s, 0);
      const auctionsInvolved = rows.length;
      const lastActiveDate = rows.reduce((latest, r) => {
        const d = auctionDateMap[r.auction_name] || r.auction_date || "";
        return d > latest ? d : latest;
      }, "");
      const name = rows[0].full_name || email;
      const country = rows[0].country || "—";

      // Segment by spend
      let segment = "רגיל";
      if (totalSpend >= 100000) segment = "VIP";
      else if (totalSpend >= 20000) segment = "פעיל";

      return {
        email,
        name,
        country,
        totalBids,
        totalWins,
        totalSpend,
        auctionsInvolved,
        lastActive: lastActiveDate,
        segment,
        genazym_id: rows[0]?.genazym_id,
        zaidy_id: rows[0]?.zaidy_id,
      };
    }).sort((a, b) => b.totalSpend - a.totalSpend);
  }, [rawActivityData, rawAuctionsData]);

  // Segment data for chart
  const segmentData = useMemo(() => {
    const counts: Record<string, number> = { "VIP": 0, "פעיל": 0, "רגיל": 0 };
    customers.forEach(c => { counts[c.segment] = (counts[c.segment] || 0) + 1; });
    return Object.entries(counts).map(([segment, count]) => ({ segment, count }));
  }, [customers]);

  // Activity KPIs
  const activityKpis = useMemo(() => {
    if (!rawActivityData.length || !rawAuctionsData.length) return null;
    const latestAuction = [...rawAuctionsData].sort((a: any, b: any) => (b.auction_date || "").localeCompare(a.auction_date || ""))[0];
    const latestEmails = new Set(rawActivityData.filter((r: any) => r.auction_name === latestAuction?.auction_name).map((r: any) => r.email));
    const activeInLatest = latestEmails.size;

    // Returning customers: in both latest and previous
    const sorted = [...rawAuctionsData].sort((a: any, b: any) => (b.auction_date || "").localeCompare(a.auction_date || ""));
    const prevAuction = sorted[1];
    let returning = 0;
    if (prevAuction) {
      const prevEmails = new Set(rawActivityData.filter((r: any) => r.auction_name === prevAuction.auction_name).map((r: any) => r.email));
      returning = [...latestEmails].filter(e => prevEmails.has(e)).length;
    }

    return {
      activeInLatest,
      avgBidsPerCustomer: customers.length > 0 ? (customers.reduce((s, c) => s + c.totalBids, 0) / customers.length).toFixed(1) : "0",
      returningPct: activeInLatest > 0 && prevAuction ? `${Math.round(returning / activeInLatest * 100)}%` : "—",
      totalCustomers: customers.length,
    };
  }, [rawActivityData, rawAuctionsData, customers]);

  const addFilter = (f: string) => { if (!activeFilters.includes(f)) setActiveFilters([...activeFilters, f]); };
  const removeFilter = (f: string) => setActiveFilters(activeFilters.filter(x => x !== f));
  const openCustomer = (c: any) => { setSelectedCustomer(c); setDrawerOpen(true); setActiveTab("profile"); };

  const filtered = useMemo(() => {
    try {
      let result = customers || [];
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        result = result.filter(c =>
          (c?.name || '').toLowerCase().includes(q) ||
          (c?.email || '').toLowerCase().includes(q) ||
          (c?.country || '').toLowerCase().includes(q)
        );
      }
      if (advancedFilters?.genazymId) {
        const id = Number(advancedFilters.genazymId);
        if (!isNaN(id)) result = result.filter(c => c?.genazym_id === id);
      }
      if (advancedFilters?.zaidyId) {
        const id = Number(advancedFilters.zaidyId);
        if (!isNaN(id)) result = result.filter(c => c?.zaidy_id === id);
      }
      if (advancedFilters?.minSpend) {
        const min = Number(advancedFilters.minSpend);
        if (!isNaN(min)) result = result.filter(c => (c?.totalSpend || 0) >= min);
      }
      if (advancedFilters?.maxSpend) {
        const max = Number(advancedFilters.maxSpend);
        if (!isNaN(max)) result = result.filter(c => (c?.totalSpend || 0) <= max);
      }
      return result;
    } catch (error) {
      console.error('Filtering error:', error);
      return customers || [];
    }
  }, [customers, searchQuery, advancedFilters]);

  // Build customer timeline from raw activity
  const customerTimeline = useMemo(() => {
    if (!selectedCustomer) return [];
    const rows = rawActivityData.filter((r: any) => r.email === selectedCustomer.email);
    return rows
      .map((r: any) => ({
        date: r.auction_date || "",
        auction: r.auction_name,
        bids: r.total_bids,
        wins: r.total_wins,
        maxBid: r.max_bid,
        wasWinner: r.was_winner,
        type: r.was_winner ? "win" : "bid",
      }))
      .sort((a: any, b: any) => (b.date || "").localeCompare(a.date || ""));
  }, [selectedCustomer, rawActivityData]);

  return (
    <div className="min-h-screen">
      {/* ═══ STICKY HEADER ═══ */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border px-8 pt-6 pb-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="section-title">לקוחות</h2>
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

        {!loading && !error && activeTab === "search" && (
          <>
            <div className="chart-card mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="חיפוש לפי שם, אימייל, או מדינה..."
                    className="w-full pr-10 pl-4 py-3 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all" />
                </div>
                <button
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-1.5 px-4 py-3 text-sm border border-border rounded-lg bg-background hover:bg-muted transition-all text-muted-foreground"
                >
                  <Filter className="w-4 h-4" />
                  חיפוש מתקדם
                  {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {showAdvanced && (
                <div className="border border-border rounded-lg p-4 mb-4 bg-muted/30">
                  <div className="grid grid-cols-4 gap-4 mb-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">מזהה גנזים</label>
                      <input type="number" value={advancedFilters.genazymId} onChange={e => setAdvancedFilters(f => ({ ...f, genazymId: e.target.value }))}
                        placeholder="Genazym ID" className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent/30" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">מזהה זיידי</label>
                      <input type="number" value={advancedFilters.zaidyId} onChange={e => setAdvancedFilters(f => ({ ...f, zaidyId: e.target.value }))}
                        placeholder="Zaidy ID" className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent/30" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">מינימום סה״כ זכיות ($)</label>
                      <input type="number" value={advancedFilters.minSpend} onChange={e => setAdvancedFilters(f => ({ ...f, minSpend: e.target.value }))}
                        placeholder="0" className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent/30" />
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">מקסימום סה״כ זכיות ($)</label>
                      <input type="number" value={advancedFilters.maxSpend} onChange={e => setAdvancedFilters(f => ({ ...f, maxSpend: e.target.value }))}
                        placeholder="∞" className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent/30" />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setAdvancedFilters({ genazymId: '', zaidyId: '', minSpend: '', maxSpend: '' })}
                      className="px-3 py-1.5 text-xs border border-border rounded-md hover:bg-muted transition-all text-muted-foreground">
                      נקה הכל
                    </button>
                  </div>
                </div>
              )}

              {activeFilters.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-4">
                  {activeFilters.map((f) => (<span key={f} className="filter-chip filter-chip-active">{f}<X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter(f)} /></span>))}
                </div>
              )}
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground ml-2 mt-1">הצעות:</span>
                {suggestedQueries.map((q) => (<button key={q} onClick={() => addFilter(q)} className="filter-chip text-xs"><Plus className="w-3 h-3" /> {q}</button>))}
              </div>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">{filtered.length} לקוחות</div>
            </div>

            <div className="chart-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>שם</th>
                    <th>מדינה</th>
                    <th>סה״כ הצעות</th>
                    <th>זכיות</th>
                    <th>סה״כ זכיות ($)</th>
                    <th>מכירות</th>
                    <th>פלח</th>
                    <th>פעילות אחרונה</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 100).map((c) => (
                    <tr key={c.email} onClick={() => openCustomer(c)}>
                      <td className="font-semibold"><CustomerLink email={c.email}>{c.name}</CustomerLink></td>
                      <td>{c.country}</td>
                      <td>{c.totalBids.toLocaleString()}</td>
                      <td>{c.totalWins.toLocaleString()}</td>
                      <td>${c.totalSpend.toLocaleString()}</td>
                      <td>{c.auctionsInvolved}</td>
                      <td>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${c.segment === "VIP" ? "badge-ai" : "badge-rule"}`}>
                          {c.segment === "VIP" && <Star className="w-3 h-3" />}{c.segment}
                        </span>
                      </td>
                      <td className="text-xs text-muted-foreground">{c.lastActive ? new Date(c.lastActive).toLocaleDateString("he-IL") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!loading && !error && activeTab === "profile" && selectedCustomer && (
          <div className="max-w-4xl">
            <div className="chart-card mb-6">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold font-display" style={{ background: "hsl(var(--accent) / 0.12)", color: "hsl(var(--gold-dark))" }}>
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold font-display">{selectedCustomer.name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>{selectedCustomer.country}</span>
                    <span>{selectedCustomer.email}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${selectedCustomer.segment === "VIP" ? "badge-ai" : "badge-rule"}`}>
                      {selectedCustomer.segment === "VIP" && <Star className="w-3 h-3" />}{selectedCustomer.segment}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <KPICard label="סה״כ הצעות" value={selectedCustomer.totalBids.toLocaleString()} />
              <KPICard label="זכיות" value={selectedCustomer.totalWins.toLocaleString()} />
              <KPICard label="שיעור זכייה" value={selectedCustomer.totalBids > 0 ? `${Math.round(selectedCustomer.totalWins / selectedCustomer.totalBids * 100)}%` : "0%"} />
              <KPICard label="סה״כ זכיות" value={`$${selectedCustomer.totalSpend.toLocaleString()}`} />
            </div>

            <div className="chart-card">
              <div className="chart-title flex items-center gap-2"><Clock className="w-4 h-4" /> היסטוריית מכירות</div>
              <div className="space-y-3 mt-4">
                {customerTimeline.map((event: any, i: number) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full ${event.wasWinner ? "bg-success" : "bg-accent"}`} />
                      {i < customerTimeline.length - 1 && <div className="w-px h-8 bg-border mt-1" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm">
                        <span className="font-semibold">{event.auction}</span>
                        {" — "}
                        {event.bids} הצעות, מקסימום ${(event.maxBid || 0).toLocaleString()}
                        {event.wasWinner && <span className="text-success font-medium"> · זוכה ({event.wins} פריטים)</span>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">{event.date ? new Date(event.date).toLocaleDateString("he-IL") : ""}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!loading && !error && activeTab === "profile" && !selectedCustomer && (
          <div className="text-center py-20 text-muted-foreground">
            <div className="text-lg font-display font-semibold mb-2">בחר לקוח</div>
            <div className="text-sm">לחץ על לקוח בחיפוש החכם כדי לראות את הפרופיל</div>
          </div>
        )}

        {!loading && !error && activeTab === "activity" && activityKpis && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-8">
              <KPICard label="סה״כ לקוחות" value={activityKpis.totalCustomers.toLocaleString()} />
              <KPICard label="פעילים במכירה האחרונה" value={activityKpis.activeInLatest.toLocaleString()} />
              <KPICard label="ממוצע הצעות ללקוח" value={activityKpis.avgBidsPerCustomer} />
              <KPICard label="חוזרים (%)" value={activityKpis.returningPct} />
            </div>
          </>
        )}

        {!loading && !error && activeTab === "segments" && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              {segmentData.map((s) => (
                <KPICard key={s.segment} label={s.segment} value={s.count.toLocaleString()} />
              ))}
            </div>
            <div className="chart-card">
              <div className="chart-title">התפלגות פלחים</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={segmentData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                  <XAxis dataKey="segment" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(38,65%,52%)" radius={[4, 4, 0, 0]} name="לקוחות" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {!loading && !error && activeTab === "preferences" && (
          <div className="text-center py-20 text-muted-foreground text-sm">
            <div className="font-display font-semibold text-lg mb-2">העדפות לקוחות</div>
            <div>נתוני העדפות יתווספו כאשר יהיו קטגוריות ספרים זמינות בנתונים</div>
          </div>
        )}
      </div>

      <DrillDownDrawer open={drawerOpen} onClose={() => { setDrawerOpen(false); }} title={selectedCustomer?.name || ""}>
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold font-display" style={{ background: "hsl(var(--accent) / 0.12)", color: "hsl(var(--gold-dark))" }}>
                {selectedCustomer.name.charAt(0)}
              </div>
              <div>
                <div className="font-bold">{selectedCustomer.name}</div>
                <div className="text-sm text-muted-foreground">{selectedCustomer.country} · {selectedCustomer.segment}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="kpi-card"><div className="kpi-value text-xl">{selectedCustomer.totalBids.toLocaleString()}</div><div className="kpi-label">הצעות</div></div>
              <div className="kpi-card"><div className="kpi-value text-xl">{selectedCustomer.totalWins.toLocaleString()}</div><div className="kpi-label">זכיות</div></div>
              <div className="kpi-card"><div className="kpi-value text-xl">${selectedCustomer.totalSpend.toLocaleString()}</div><div className="kpi-label">סה״כ זכיות</div></div>
              <div className="kpi-card"><div className="kpi-value text-xl">{selectedCustomer.totalBids > 0 ? Math.round(selectedCustomer.totalWins / selectedCustomer.totalBids * 100) : 0}%</div><div className="kpi-label">שיעור זכייה</div></div>
            </div>
            <div className="text-xs text-muted-foreground">{selectedCustomer.email}</div>
          </div>
        )}
      </DrillDownDrawer>
    </div>
  );
}
