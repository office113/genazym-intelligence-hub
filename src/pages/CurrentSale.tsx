import { useState } from "react";
import KPICard from "@/components/dashboard/KPICard";
import DrillDownDrawer from "@/components/dashboard/DrillDownDrawer";
import OverviewTab from "@/components/current-sale/OverviewTab";
import { currentSaleDX, missingCustomers } from "@/data/mockData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Phone, Mail, AlertTriangle, CheckCircle2, Clock, TrendingDown } from "lucide-react";

const tabs = [
  { key: "overview", label: "סקירה" },
  { key: "pace", label: "קצב התקדמות" },
  { key: "dx", label: "השוואת D-X" },
  { key: "missing", label: "לקוחות חסרים" },
  { key: "actions", label: "פעולות מומלצות" },
];

const recommendedActions = [
  { id: 1, priority: "high", action: "להתקשר לשלמה רוזנברג", reason: "לקוח VIP, בד״כ פעיל ב-D-14, עדיין לא נכנס", type: "call" },
  { id: 2, priority: "high", action: "לשלוח תזכורת ליצחק לוי", reason: "3 פריטים בתחום העניין שלו, לא פעיל מאז מכירה #45", type: "email" },
  { id: 3, priority: "medium", action: "להפנות תשומת לב להגדה מאוירת", reason: "8 לקוחות עם התאמה גבוהה, רק 3 הציעו", type: "alert" },
  { id: 4, priority: "medium", action: "לעדכן הערכות לפריטים עם ביקוש נמוך", reason: "12 פריטים ללא הצעות ב-D-4", type: "alert" },
  { id: 5, priority: "low", action: "לשלוח ניוזלטר סיכום שבועי", reason: "38 נרשמים חדשים השבוע, שיעור צפייה 45%", type: "email" },
];

type Brand = "genazym" | "zaidy";

export default function CurrentSale() {
  const [activeTab, setActiveTab] = useState("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [brand, setBrand] = useState<Brand>("genazym");

  const openCustomer = (c: any) => { setSelectedCustomer(c); setDrawerOpen(true); };

  const selectedBrand = brand === "genazym" ? "גנזים" as const : "זיידי" as const;

  return (
    <div className="min-h-screen">
      {/* ═══ STICKY HEADER — matches PastSales pattern ═══ */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border px-8 pt-6 pb-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="section-title">מכירה נוכחית</h2>
          <div className="flex items-center bg-card border border-border rounded-lg p-0.5 shadow-sm">
            <button
              onClick={() => setBrand("genazym")}
              className={`px-5 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                brand === "genazym"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              גנזים
            </button>
            <button
              onClick={() => setBrand("zaidy")}
              className={`px-5 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                brand === "zaidy"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              זיידי
            </button>
          </div>
        </div>
        <div className="sub-nav mb-0 inline-flex mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`sub-nav-item ${activeTab === tab.key ? "sub-nav-item-active" : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8 animate-fade-in">
        {activeTab === "overview" && <OverviewTab selectedBrand={selectedBrand} />}

        {activeTab === "pace" && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-8">
              <KPICard label="הצעות היום" value="24" trend="up" trendValue="+8 מאתמול" />
              <KPICard label="הצעות שבוע אחרון" value="112" trend="down" trendValue="-5%" />
              <KPICard label="ממוצע הצעות/יום" value="16" trend="neutral" />
              <KPICard label="פריטים ״חמים״" value="18" subtitle="5+ הצעות" />
            </div>
            <div className="chart-card">
              <div className="chart-title">קצב הצטברות הצעות יומי</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={currentSaleDX.filter(d => d.current > 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="current" fill="hsl(220,35%,18%)" radius={[4, 4, 0, 0]} name="הצעות" />
                  <Bar dataKey="avg" fill="hsl(40,8%,82%)" radius={[4, 4, 0, 0]} name="ממוצע" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {activeTab === "dx" && (
          <>
            <div className="chart-card mb-6">
              <div className="chart-title">השוואת D-X: מכירה נוכחית מול ממוצע היסטורי</div>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={currentSaleDX}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="avg" stroke="hsl(40,8%,75%)" strokeWidth={2} strokeDasharray="6 3" name="ממוצע" dot={false} />
                  <Line type="monotone" dataKey="current" stroke="hsl(38,65%,52%)" strokeWidth={3} name="נוכחית" dot={{ r: 5, fill: "hsl(38,65%,52%)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {currentSaleDX.filter(d => d.current > 0).map((d) => (
                <div key={d.day} className="kpi-card">
                  <div className="text-lg font-bold font-display">{d.day}</div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-muted-foreground">נוכחית: <span className="text-foreground font-semibold">{d.current}</span></span>
                    <span className="text-muted-foreground">ממוצע: <span className="text-foreground font-semibold">{d.avg}</span></span>
                  </div>
                  <div className={`text-xs mt-1 font-medium ${d.current >= d.avg ? "kpi-trend-up" : "kpi-trend-down"}`}>
                    {d.current >= d.avg ? "מעל הממוצע" : `${Math.round((1 - d.current/d.avg)*100)}% מתחת`}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "missing" && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <KPICard label="לקוחות חסרים" value="5" trend="down" trendValue="נדרשת פנייה" />
              <KPICard label="סה״כ הוצאות חסרים" value="$1.19M" subtitle="ערך מצטבר של לקוחות אלו" />
              <KPICard label="ממוצע הצעות חסרים" value="12.2" subtitle="לפי מכירה" />
            </div>
            <div className="chart-card">
              <div className="chart-title">לקוחות שבדרך כלל פעילים עד עכשיו</div>
              <table className="data-table">
                <thead>
                  <tr><th>שם</th><th>מכירה אחרונה</th><th>ממוצע הצעות</th><th>פעילות רגילה</th><th>סה״כ הוצאות</th><th>טלפון</th><th>פעולה</th></tr>
                </thead>
                <tbody>
                  {missingCustomers.map((c) => (
                    <tr key={c.id} onClick={() => openCustomer(c)}>
                      <td className="font-semibold">{c.name}</td>
                      <td>{c.lastSale}</td>
                      <td>{c.avgBids}</td>
                      <td><span className="filter-chip text-xs">{c.usualDX}</span></td>
                      <td>${c.totalSpend.toLocaleString()}</td>
                      <td className="text-muted-foreground text-xs">{c.phone}</td>
                      <td className="flex gap-2">
                        <button className="p-1.5 rounded-md hover:bg-secondary transition-colors"><Phone className="w-3.5 h-3.5" /></button>
                        <button className="p-1.5 rounded-md hover:bg-secondary transition-colors"><Mail className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === "actions" && (
          <>
            <div className="space-y-4">
              {recommendedActions.map((a) => (
                <div key={a.id} className="action-card flex items-start gap-4">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    a.priority === "high" ? "bg-destructive" : a.priority === "medium" ? "bg-warning" : "bg-muted-foreground"
                  }`} />
                  <div className="flex-1">
                    <div className="font-semibold text-sm">{a.action}</div>
                    <div className="text-xs text-muted-foreground mt-1">{a.reason}</div>
                  </div>
                  <button className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg transition-colors"
                    style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                    {a.type === "call" && <Phone className="w-3 h-3" />}
                    {a.type === "email" && <Mail className="w-3 h-3" />}
                    {a.type === "alert" && <AlertTriangle className="w-3 h-3" />}
                    {a.type === "call" ? "התקשר" : a.type === "email" ? "שלח" : "טפל"}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <DrillDownDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={selectedCustomer?.name || ""}>
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="kpi-card"><div className="kpi-value">{selectedCustomer.avgBids}</div><div className="kpi-label">ממוצע הצעות</div></div>
              <div className="kpi-card"><div className="kpi-value">${selectedCustomer.totalSpend.toLocaleString()}</div><div className="kpi-label">סה״כ הוצאות</div></div>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-3">מידע נוסף</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">מכירה אחרונה</span><span>{selectedCustomer.lastSale}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">פעילות רגילה</span><span>{selectedCustomer.usualDX}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">סטטוס</span><span className="text-destructive font-medium">{selectedCustomer.status}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">טלפון</span><span dir="ltr">{selectedCustomer.phone}</span></div>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg"
                style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                <Phone className="w-4 h-4" /> התקשר
              </button>
              <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-border bg-card">
                <Mail className="w-4 h-4" /> שלח אימייל
              </button>
            </div>
          </div>
        )}
      </DrillDownDrawer>
    </div>
  );
}
