import { useState } from "react";
import SubNav from "@/components/layout/SubNav";
import KPICard from "@/components/dashboard/KPICard";
import DrillDownDrawer from "@/components/dashboard/DrillDownDrawer";
import { customers } from "@/data/mockData";
import { Search, X, Plus, Filter, Star, TrendingUp, BookOpen, Clock, Zap } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const tabs = [
  { key: "search", label: "חיפוש חכם" },
  { key: "profile", label: "פרופיל לקוח" },
  { key: "preferences", label: "העדפות" },
  { key: "activity", label: "פעילות" },
  { key: "segments", label: "פלחים" },
];

const segmentData = [
  { segment: "VIP", count: 45 },
  { segment: "פעיל", count: 120 },
  { segment: "רגיל", count: 280 },
  { segment: "לא פעיל", count: 85 },
];

const suggestedQueries = [
  "לקוחות שהציעו מעל $100,000",
  "לקוחות עם עניין בחסידות",
  "לקוחות VIP שלא פעילים במכירה הנוכחית",
  "לקוחות שהציעו הצעות מוקדמות בד״כ",
  "לקוחות עם זיקה לכתבי יד",
];

export default function Customers() {
  const [activeTab, setActiveTab] = useState("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const addFilter = (f: string) => { if (!activeFilters.includes(f)) setActiveFilters([...activeFilters, f]); };
  const removeFilter = (f: string) => setActiveFilters(activeFilters.filter(x => x !== f));
  const openCustomer = (c: any) => { setSelectedCustomer(c); setDrawerOpen(true); setActiveTab("profile"); };

  const filtered = customers.filter(c =>
    !searchQuery || c.name.includes(searchQuery) || c.interests.some(i => i.includes(searchQuery))
  );

  const customerTimeline = [
    { date: "2024-12-14", event: "הצעה $22,000 — ספר נועם אלימלך", type: "bid" },
    { date: "2024-12-10", event: "צפייה בקטלוג מכירה #48", type: "view" },
    { date: "2024-11-15", event: "זכייה — כתב יד תהלים — $12,500", type: "win" },
    { date: "2024-10-20", event: "הרשמה למכירה #46", type: "registration" },
    { date: "2024-10-18", event: "הצעה $8,000 — סידור עתיק", type: "bid" },
    { date: "2024-08-10", event: "זכייה — ספר קדושת לוי — $18,000", type: "win" },
  ];

  return (
    <div className="min-h-screen">
      <SubNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} title="לקוחות" />

      <div className="p-8 animate-fade-in">
        {activeTab === "search" && (
          <>
            {/* Smart Search Bar */}
            <div className="chart-card mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="חיפוש חכם — שם, תחום עניין, התנהגות, או שאלה חופשית..."
                    className="w-full pr-10 pl-4 py-3 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                  />
                </div>
                <button className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg border border-border bg-card hover:bg-secondary transition-colors">
                  <Filter className="w-4 h-4" /> מסננים
                </button>
              </div>

              {/* Active Filters */}
              {activeFilters.length > 0 && (
                <div className="flex gap-2 flex-wrap mb-4">
                  {activeFilters.map((f) => (
                    <span key={f} className="filter-chip filter-chip-active">
                      {f}
                      <X className="w-3 h-3 cursor-pointer" onClick={() => removeFilter(f)} />
                    </span>
                  ))}
                </div>
              )}

              {/* Suggested Queries */}
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground ml-2 mt-1">הצעות:</span>
                {suggestedQueries.map((q) => (
                  <button key={q} onClick={() => addFilter(q)} className="filter-chip text-xs">
                    <Plus className="w-3 h-3" /> {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Results Summary */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">{filtered.length} תוצאות</div>
            </div>

            {/* Results Table */}
            <div className="chart-card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>שם</th>
                    <th>עיר</th>
                    <th>סה״כ הצעות</th>
                    <th>זכיות</th>
                    <th>הוצאות</th>
                    <th>פלח</th>
                    <th>תחומי עניין</th>
                    <th>פעילות אחרונה</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.id} onClick={() => openCustomer(c)}>
                      <td className="font-semibold">{c.name}</td>
                      <td>{c.city}</td>
                      <td>{c.totalBids}</td>
                      <td>{c.totalWins}</td>
                      <td>${c.totalSpend.toLocaleString()}</td>
                      <td>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${
                          c.segment === "VIP" ? "badge-ai" : "badge-rule"
                        }`}>
                          {c.segment === "VIP" && <Star className="w-3 h-3" />}
                          {c.segment}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1 flex-wrap">
                          {c.interests.slice(0, 2).map((i) => (
                            <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-secondary">{i}</span>
                          ))}
                          {c.interests.length > 2 && <span className="text-xs text-muted-foreground">+{c.interests.length - 2}</span>}
                        </div>
                      </td>
                      <td className="text-xs text-muted-foreground">{c.lastActive}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === "profile" && selectedCustomer && (
          <div className="max-w-4xl">
            {/* Profile Header */}
            <div className="chart-card mb-6">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold font-display" style={{ background: "hsl(var(--accent) / 0.12)", color: "hsl(var(--gold-dark))" }}>
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold font-display">{selectedCustomer.name}</h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>{selectedCustomer.city}</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${selectedCustomer.segment === "VIP" ? "badge-ai" : "badge-rule"}`}>
                      {selectedCustomer.segment === "VIP" && <Star className="w-3 h-3" />}
                      {selectedCustomer.segment}
                    </span>
                  </div>
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {selectedCustomer.interests.map((i: string) => (
                      <span key={i} className="filter-chip text-xs">{i}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <KPICard label="סה״כ הצעות" value={selectedCustomer.totalBids} trend="up" trendValue="+12%" />
              <KPICard label="זכיות" value={selectedCustomer.totalWins} />
              <KPICard label="שיעור זכייה" value={`${Math.round(selectedCustomer.totalWins/selectedCustomer.totalBids*100)}%`} />
              <KPICard label="סה״כ הוצאות" value={`$${selectedCustomer.totalSpend.toLocaleString()}`} />
            </div>

            {/* Timeline */}
            <div className="chart-card">
              <div className="chart-title flex items-center gap-2"><Clock className="w-4 h-4" /> ציר זמן פעילות</div>
              <div className="space-y-4">
                {customerTimeline.map((event, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full ${
                        event.type === "win" ? "bg-success" : event.type === "bid" ? "bg-accent" : "bg-muted-foreground"
                      }`} />
                      {i < customerTimeline.length - 1 && <div className="w-px h-8 bg-border mt-1" />}
                    </div>
                    <div>
                      <div className="text-sm">{event.event}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{event.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "profile" && !selectedCustomer && (
          <div className="text-center py-20 text-muted-foreground">
            <div className="text-lg font-display font-semibold mb-2">בחר לקוח</div>
            <div className="text-sm">לחץ על לקוח בחיפוש החכם כדי לראות את הפרופיל</div>
          </div>
        )}

        {activeTab === "preferences" && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <KPICard label="קטגוריה פופולרית" value="חסידות" subtitle="38% מהלקוחות" />
              <KPICard label="טווח מחירים ממוצע" value="$5K-15K" />
              <KPICard label="לקוחות עם פרופיל מלא" value="68%" />
            </div>
            <div className="chart-card">
              <div className="chart-title">העדפות לפי קטגוריה</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={[
                  { cat: "חסידות", count: 85 }, { cat: "כתבי יד", count: 45 },
                  { cat: "הלכה", count: 62 }, { cat: "הגדות", count: 38 },
                  { cat: "דפוסים ראשונים", count: 28 }, { cat: "קבלה", count: 42 },
                ]} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="cat" type="category" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(220,35%,18%)" radius={[0, 4, 4, 0]} name="לקוחות" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {activeTab === "activity" && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-8">
              <KPICard label="פעילים החודש" value="186" trend="up" trendValue="+8%" />
              <KPICard label="ממוצע הצעות" value="4.2" />
              <KPICard label="זמן תגובה ממוצע" value="2.3 ימים" />
              <KPICard label="חוזרים (%)" value="62%" trend="up" trendValue="+4%" />
            </div>
          </>
        )}

        {activeTab === "segments" && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-8">
              {segmentData.map((s) => (
                <KPICard key={s.segment} label={s.segment} value={s.count} onClick={() => {}} />
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
                <div className="text-sm text-muted-foreground">{selectedCustomer.city} · {selectedCustomer.segment}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="kpi-card"><div className="kpi-value text-xl">{selectedCustomer.totalBids}</div><div className="kpi-label">הצעות</div></div>
              <div className="kpi-card"><div className="kpi-value text-xl">{selectedCustomer.totalWins}</div><div className="kpi-label">זכיות</div></div>
              <div className="kpi-card"><div className="kpi-value text-xl">${selectedCustomer.totalSpend.toLocaleString()}</div><div className="kpi-label">הוצאות</div></div>
              <div className="kpi-card"><div className="kpi-value text-xl">{Math.round(selectedCustomer.totalWins/selectedCustomer.totalBids*100)}%</div><div className="kpi-label">שיעור זכייה</div></div>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-2">תחומי עניין</h4>
              <div className="flex gap-1.5 flex-wrap">
                {selectedCustomer.interests.map((i: string) => (
                  <span key={i} className="filter-chip text-xs">{i}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </DrillDownDrawer>
    </div>
  );
}
