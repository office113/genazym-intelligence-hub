import { useState } from "react";
import SubNav from "@/components/layout/SubNav";
import KPICard from "@/components/dashboard/KPICard";
import DrillDownDrawer from "@/components/dashboard/DrillDownDrawer";
import { books } from "@/data/mockData";
import { Search, Filter, Sparkles, Eye, Heart, Tag } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const tabs = [
  { key: "search", label: "חיפוש חכם" },
  { key: "categories", label: "קטגוריות" },
  { key: "relations", label: "קשרי לקוחות" },
  { key: "performance", label: "ביצועים" },
  { key: "ai-tags", label: "תגיות AI" },
];

const catData = [
  { cat: "חסידות", count: 85, revenue: 420 },
  { cat: "כתבי יד", count: 32, revenue: 380 },
  { cat: "דפוסים ראשונים", count: 28, revenue: 520 },
  { cat: "הגדות", count: 45, revenue: 290 },
  { cat: "הלכה", count: 62, revenue: 185 },
  { cat: "גמרא", count: 48, revenue: 210 },
];

export default function Books() {
  const [activeTab, setActiveTab] = useState("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<any>(null);

  const filtered = books.filter(b =>
    !searchQuery || b.title.includes(searchQuery) || b.category.includes(searchQuery) || b.aiTags.some(t => t.includes(searchQuery))
  );

  const openBook = (b: any) => { setSelectedBook(b); setDrawerOpen(true); };

  return (
    <div className="min-h-screen">
      <SubNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} title="ספרים" />
      <div className="p-8 animate-fade-in">
        {activeTab === "search" && (
          <>
            <div className="chart-card mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="חיפוש לפי כותרת, תיאור, מחבר, מדפיס, קטגוריה, או תגית..."
                    className="w-full pr-10 pl-4 py-3 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
                  />
                </div>
                <button className="inline-flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg border border-border bg-card hover:bg-secondary transition-colors">
                  <Filter className="w-4 h-4" /> מסננים
                </button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground ml-2 mt-1">דוגמאות:</span>
                {["חסידות", "כתב יד", "ונציה", "דפוס ראשון", "ר' אלימלך"].map(q => (
                  <button key={q} onClick={() => setSearchQuery(q)} className="filter-chip text-xs">{q}</button>
                ))}
              </div>
            </div>

            <div className="text-sm text-muted-foreground mb-4">{filtered.length} תוצאות</div>

            <div className="grid grid-cols-1 gap-4">
              {filtered.map((b) => (
                <div key={b.id} className="action-card flex items-start gap-4" onClick={() => openBook(b)}>
                  <div className="w-16 h-20 rounded-md flex items-center justify-center text-2xl flex-shrink-0" style={{ background: "hsl(var(--accent) / 0.08)" }}>📜</div>
                  <div className="flex-1">
                    <div className="font-semibold mb-1">{b.title}</div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                      <span className="filter-chip text-xs py-0.5">{b.category}</span>
                      <span>{b.estimate}</span>
                      <span>{b.sale}</span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {b.aiTags.map((tag) => (
                        <span key={tag} className="badge-ai text-xs"><Tag className="w-2.5 h-2.5" />{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground flex-shrink-0">
                    <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{b.watchers}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{b.bids} הצעות</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "categories" && (
          <div className="chart-card">
            <div className="chart-title">פריטים לפי קטגוריה</div>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={catData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                <XAxis dataKey="cat" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(220,35%,18%)" radius={[4,4,0,0]} name="פריטים" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {activeTab === "relations" && (
          <div className="space-y-4">
            {books.slice(0, 4).map((b) => (
              <div key={b.id} className="chart-card">
                <div className="chart-title">{b.title}</div>
                <div className="flex gap-2 flex-wrap">
                  {["אברהם גולדשטיין", "שלמה רוזנברג", "יצחק לוי"].slice(0, Math.floor(Math.random()*3)+1).map(name => (
                    <span key={name} className="filter-chip text-xs">{name}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "performance" && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <KPICard label="ממוצע הצעות לפריט" value="6.2" trend="up" trendValue="+1.1" />
              <KPICard label="שיעור מכירה" value="89%" />
              <KPICard label="ממוצע עליית מחיר" value="95%" />
            </div>
            <div className="chart-card">
              <div className="chart-title">הכנסות לפי קטגוריה (אלפי $)</div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={catData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="cat" type="category" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="hsl(38,65%,52%)" radius={[0,4,4,0]} name="הכנסות (K$)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {activeTab === "ai-tags" && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <KPICard label="תגיות AI" value="156" subtitle="תגיות ייחודיות" />
              <KPICard label="פריטים מתויגים" value="94%" />
              <KPICard label="ממוצע תגיות/פריט" value="4.2" />
            </div>
            <div className="chart-card">
              <div className="chart-title flex items-center gap-2"><Sparkles className="w-4 h-4" /> תגיות נפוצות</div>
              <div className="flex gap-2 flex-wrap mt-4">
                {["חסידות", "דפוס ראשון", "כתב יד", "קבלה", "הלכה", "ונציה", "אמסטרדם", "סלאוויטא", "תהלים", "הגדה", "איורים", "נדיר", "קלף", "תלמוד", "ראשונים"].map((tag, i) => (
                  <span key={tag} className="badge-ai text-sm px-3 py-1.5" style={{ fontSize: Math.max(11, 16 - i * 0.3) }}>
                    <Sparkles className="w-3 h-3" /> {tag}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <DrillDownDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={selectedBook?.title || ""}>
        {selectedBook && (
          <div className="space-y-6">
            <div className="text-center p-8 rounded-lg" style={{ background: "hsl(var(--accent) / 0.06)" }}>
              <div className="text-4xl mb-3">📜</div>
              <div className="font-display font-bold text-lg">{selectedBook.title}</div>
              <div className="text-sm text-muted-foreground mt-1">{selectedBook.category} · {selectedBook.estimate}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="kpi-card"><div className="kpi-value text-xl">{selectedBook.bids}</div><div className="kpi-label">הצעות</div></div>
              <div className="kpi-card"><div className="kpi-value text-xl">{selectedBook.watchers}</div><div className="kpi-label">במעקב</div></div>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-2">תגיות AI</h4>
              <div className="flex gap-1.5 flex-wrap">
                {selectedBook.aiTags.map((tag: string) => (
                  <span key={tag} className="badge-ai"><Tag className="w-3 h-3" />{tag}</span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-2">לקוחות מתאימים</h4>
              <div className="space-y-2">
                {["אברהם גולדשטיין — 92%", "יצחק לוי — 88%", "שלמה רוזנברג — 85%"].map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 text-sm cursor-pointer hover:bg-secondary/30 rounded px-2">
                    <span>{c.split(" — ")[0]}</span>
                    <span className="font-bold" style={{ color: "hsl(var(--accent))" }}>{c.split(" — ")[1]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DrillDownDrawer>
    </div>
  );
}
