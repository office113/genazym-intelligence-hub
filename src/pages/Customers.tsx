import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import SubNav from "@/components/layout/SubNav";
import KPICard from "@/components/dashboard/KPICard";
import DrillDownDrawer from "@/components/dashboard/DrillDownDrawer";
import { usePastSales } from "@/hooks/usePastSales";
import { Search, X, Plus, Filter, Star, TrendingUp, BookOpen, Clock, Zap, ChevronDown, ChevronUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import CustomerLink from "@/components/customers/CustomerLink";
import CustomerCardContent from "@/components/customers/CustomerCardContent";
import { supabase } from "@/lib/supabaseClient";

function getSegment(totalSpend: number, rules: { name: string; min_spend: number }[]) {
  if (!rules || rules.length === 0) return 'רשום';
  const sorted = [...rules].sort((a, b) => b.min_spend - a.min_spend);
  for (const rule of sorted) {
    if (totalSpend >= (rule.min_spend ?? 0)) return rule.name;
  }
  return sorted[sorted.length - 1]?.name ?? 'רשום';
}

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
  const [profileSearch, setProfileSearch] = useState("");
  const [filters, setFilters] = useState({
    segment: '', country: '', continent: '',
    genazymId: '', zaidyId: '',
    minSpend: '',
    minMaxBid: '',
  });
  const updateFilter = (key: string, value: string) =>
    setFilters(prev => ({ ...prev, [key]: value }));

  // Hardcoded segment rules since customer_segments table doesn't exist
  const segmentRules = useMemo(() => [
    { name: 'VIP', min_spend: 50000 },
    { name: 'פעיל', min_spend: 5000 },
    { name: 'רגיל', min_spend: 1 },
    { name: 'רשום', min_spend: 0 },
  ], []);

  // Fetch continent lookup from customers table
  const [continentMap, setContinentMap] = useState<Record<string, string>>({});
  useEffect(() => {
    let mounted = true;
    const fetchContinents = async () => {
      try {
        const { data } = await supabase
          .from('customers')
          .select('email, continent')
          .not('continent', 'is', null)
          .limit(50000);
        if (data && mounted) {
          const map: Record<string, string> = {};
          data.forEach(row => { if (row.email && row.continent) map[row.email] = row.continent; });
          setContinentMap(map);
        }
      } catch (err) { console.error('Failed to fetch continents', err); }
    };
    fetchContinents();
    return () => { mounted = false; };
  }, []);

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
      const maxBid = Math.max(...rows.map(r => r.max_bid || 0), 0);
      const auctionsInvolved = rows.length;
      const lastActiveDate = rows.reduce((latest, r) => {
        const d = auctionDateMap[r.auction_name] || r.auction_date || "";
        return d > latest ? d : latest;
      }, "");
      const name = rows[0].full_name || email;
      const country = rows[0].country || "—";
      const continent = continentMap[email] || rows[0].continent || "";

      return {
        email,
        name,
        country,
        continent,
        totalBids,
        totalWins,
        totalSpend,
        maxBid,
        auctionsInvolved,
        lastActive: lastActiveDate,
        segment: getSegment(totalSpend, segmentRules),
        genazym_id: rows[0]?.genazym_id,
        zaidy_id: rows[0]?.zaidy_id,
      };
    }).sort((a, b) => b.totalSpend - a.totalSpend);
  }, [rawActivityData, rawAuctionsData, segmentRules, continentMap]);



  const countryOptions = useMemo(() => {
    const s = new Set<string>();
    for (const c of customers) { if (c.country && c.country !== "—") s.add(c.country); }
    return Array.from(s).sort();
  }, [customers]);

  const continentOptions = useMemo(() => {
    const s = new Set<string>();
    for (const c of customers) { if (c.continent) s.add(c.continent); }
    return Array.from(s).sort();
  }, [customers]);

  const profileResults = useMemo(() => {
    if (profileSearch.length < 2) return [];
    const q = profileSearch.toLowerCase();
    return customers.filter(c =>
      (c?.name || '').toLowerCase().includes(q) ||
      (c?.email || '').toLowerCase().includes(q)
    ).slice(0, 8);
  }, [customers, profileSearch]);


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
      return customers.filter(c => {
        if (filters.segment && c?.segment !== filters.segment) return false;
        if (filters.country && c?.country !== filters.country) return false;
        if (filters.continent && c?.continent !== filters.continent) return false;
        if (filters.genazymId && !String(c?.genazym_id ?? '').includes(filters.genazymId)) return false;
        if (filters.zaidyId && !String(c?.zaidy_id ?? '').includes(filters.zaidyId)) return false;
        if (filters.minSpend !== '' && (c?.totalSpend ?? 0) < Number(filters.minSpend)) return false;
        if (filters.minMaxBid !== '' && (c?.maxBid ?? 0) < Number(filters.minMaxBid)) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          if (!(c?.name || '').toLowerCase().includes(q) &&
              !(c?.email || '').toLowerCase().includes(q) &&
              !(c?.country || '').toLowerCase().includes(q)) return false;
        }
        return true;
      });
    } catch (e) {
      console.error('filter error:', e);
      return customers;
    }
  }, [customers, searchQuery, filters]);

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
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, padding: '12px 0' }}>
                    <select value={filters.segment} onChange={e => updateFilter('segment', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent/30">
                      <option value="">סיווג לקוח — הכל</option>
                      {[...segmentRules].sort((a, b) => b.min_spend - a.min_spend)
                        .map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                    </select>
                    <select value={filters.country} onChange={e => updateFilter('country', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent/30">
                      <option value="">מדינה — הכל</option>
                      {countryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select value={filters.continent} onChange={e => updateFilter('continent', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent/30">
                      <option value="">יבשת — הכל</option>
                      {continentOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input type="number" placeholder="Genazym ID"
                      value={filters.genazymId}
                      onChange={e => updateFilter('genazymId', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent/30" />
                    <input type="number" placeholder="Zaidy ID"
                      value={filters.zaidyId}
                      onChange={e => updateFilter('zaidyId', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent/30" />
                    <input type="number" placeholder="החל מ — סך זכיות"
                      value={filters.minSpend}
                      onChange={e => updateFilter('minSpend', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent/30" />
                    <input type="number" placeholder="החל מ — ביד מקסימלי"
                      value={filters.minMaxBid}
                      onChange={e => updateFilter('minMaxBid', e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-accent/30" />
                    <button onClick={() => setFilters({
                      segment: '', country: '', continent: '',
                      genazymId: '', zaidyId: '',
                      minSpend: '',
                      minMaxBid: '',
                    })}
                      className="px-3 py-2 text-sm border border-border rounded-md hover:bg-muted transition-all text-muted-foreground">
                      נקה פילטרים
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
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => { setSelectedCustomer(null); }}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← חזרה לחיפוש
              </button>
            </div>
            <div className="chart-card p-6">
              <CustomerCardContent email={selectedCustomer.email} />
            </div>
          </div>
        )}

        {!loading && !error && activeTab === "profile" && !selectedCustomer && (
          <div className="max-w-2xl mx-auto py-12">
            <div className="text-center mb-6">
              <div className="text-lg font-display font-semibold mb-2">בחר לקוח</div>
              <div className="text-sm text-muted-foreground">חפש לקוח כדי לראות את הכרטיס המלא</div>
            </div>
            <div className="relative mb-4">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={profileSearch}
                onChange={(e) => setProfileSearch(e.target.value)}
                placeholder="חפש לקוח לפי שם או אימייל..."
                className="w-full pr-10 pl-4 py-3 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              />
            </div>
            {profileSearch.length >= 2 && (
              <div className="chart-card divide-y divide-border">
                {profileResults.length === 0 && (
                  <div className="text-center py-6 text-sm text-muted-foreground">לא נמצאו תוצאות</div>
                )}
                {profileResults.map(c => (
                  <button
                    key={c.email}
                    onClick={() => { setSelectedCustomer(c); setProfileSearch(""); }}
                    className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/50 transition-colors text-right"
                  >
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-xs text-muted-foreground">{c.email}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{c.country}</div>
                  </button>
                ))}
              </div>
            )}
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
