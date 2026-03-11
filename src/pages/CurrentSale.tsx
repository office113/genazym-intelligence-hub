import { useState } from "react";
import SubNav from "@/components/layout/SubNav";
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

export default function CurrentSale() {
  const [activeTab, setActiveTab] = useState("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const openCustomer = (c: any) => { setSelectedCustomer(c); setDrawerOpen(true); };

  return (
    <div className="min-h-screen">
      <SubNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} title="מכירה נוכחית — מכירה #48" />

      <div className="p-8 animate-fade-in">
        {activeTab === "overview" && (
          <>
            {/* D-X Banner */}
            <div className="chart-card mb-6 flex items-center gap-8">
              <div className="flex-shrink-0 text-center px-6 py-2 border-l border-border">
                <div className="text-5xl font-bold font-display" style={{ color: "hsl(var(--accent))" }}>D-4</div>
                <div className="text-sm text-muted-foreground mt-1">ימים למכירה</div>
              </div>
              <div className="flex-1 grid grid-cols-5 gap-4">
                <KPICard label="הצעות" value="180" trend="down" trendValue="-8% מהממוצע" onClick={() => {}} />
                <KPICard label="מציעים" value="95" trend="neutral" trendValue="כממוצע" onClick={() => {}} />
                <KPICard label="נרשמים חדשים" value="38" trend="up" trendValue="+15%" onClick={() => {}} />
                <KPICard label="פריטים במעקב" value="245" trend="up" trendValue="+5%" onClick={() => {}} />
                <KPICard label="ללא הצעות" value="42" trend="down" trendValue="12% מהפריטים" onClick={() => {}} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="chart-card">
                <div className="chart-title">קצב הצעות: נוכחי מול ממוצע היסטורי</div>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={currentSaleDX}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="avg" stroke="hsl(40,8%,75%)" strokeWidth={2} strokeDasharray="6 3" name="ממוצע היסטורי" dot={false} />
                    <Line type="monotone" dataKey="current" stroke="hsl(220,35%,18%)" strokeWidth={2.5} name="מכירה נוכחית" dot={{ r: 4, fill: "hsl(220,35%,18%)" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <div className="chart-title">התראות מרכזיות</div>
                <div className="space-y-3">
                  <div className="alert-card alert-card-warning flex items-start gap-3">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "hsl(var(--warning))" }} />
                    <div>
                      <div className="text-sm font-semibold">קצב הצעות מתחת לממוצע</div>
                      <div className="text-xs text-muted-foreground mt-0.5">180 הצעות ב-D-4 מול 195 בממוצע (-8%)</div>
                    </div>
                  </div>
                  <div className="alert-card alert-card-danger flex items-start gap-3">
                    <TrendingDown className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "hsl(var(--destructive))" }} />
                    <div>
                      <div className="text-sm font-semibold">5 לקוחות VIP לא פעילים</div>
                      <div className="text-xs text-muted-foreground mt-0.5">בד״כ פעילים עד שלב זה, נדרשת פנייה</div>
                    </div>
                  </div>
                  <div className="alert-card alert-card-success flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "hsl(var(--success))" }} />
                    <div>
                      <div className="text-sm font-semibold">נרשמים חדשים מעל הממוצע</div>
                      <div className="text-xs text-muted-foreground mt-0.5">38 נרשמים חדשים (+15% מהממוצע)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Missing Customers Preview */}
            <div className="chart-card">
              <div className="chart-title flex items-center gap-2">
                <Clock className="w-4 h-4" />
                לקוחות חסרים — בדרך כלל פעילים עד D-4
              </div>
              <table className="data-table">
                <thead>
                  <tr><th>שם</th><th>מכירה אחרונה</th><th>ממוצע הצעות</th><th>פעילות רגילה</th><th>סה״כ הוצאות</th><th>פעולה</th></tr>
                </thead>
                <tbody>
                  {missingCustomers.slice(0, 3).map((c) => (
                    <tr key={c.id} onClick={() => openCustomer(c)}>
                      <td className="font-semibold">{c.name}</td>
                      <td>{c.lastSale}</td>
                      <td>{c.avgBids}</td>
                      <td><span className="filter-chip text-xs">{c.usualDX}</span></td>
                      <td>${c.totalSpend.toLocaleString()}</td>
                      <td>
                        <button className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-md transition-colors"
                          style={{ background: "hsl(var(--accent) / 0.1)", color: "hsl(var(--gold-dark))" }}
                          onClick={(e) => { e.stopPropagation(); }}>
                          <Phone className="w-3 h-3" /> התקשר
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

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
