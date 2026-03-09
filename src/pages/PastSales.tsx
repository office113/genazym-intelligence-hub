import { useState } from "react";
import SubNav from "@/components/layout/SubNav";
import KPICard from "@/components/dashboard/KPICard";
import DrillDownDrawer from "@/components/dashboard/DrillDownDrawer";
import { pastSalesData, saleComparisonChart } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart } from "recharts";

const tabs = [
  { key: "overview", label: "סקירה" },
  { key: "compare", label: "השוואת מכירות" },
  { key: "engagement", label: "מעורבות לקוחות" },
  { key: "financial", label: "ביצועים כספיים" },
  { key: "trends", label: "מגמות" },
];

const upliftData = [
  { lot: "פריט 12", opening: 5000, final: 12000 },
  { lot: "פריט 34", opening: 15000, final: 28000 },
  { lot: "פריט 45", opening: 20000, final: 42000 },
  { lot: "פריט 78", opening: 30000, final: 48000 },
  { lot: "פריט 91", opening: 5000, final: 7500 },
];

const engagementBysale = [
  { sale: "#43", avgBids: 4.2, uniqueBidders: 180, returnRate: 62 },
  { sale: "#44", avgBids: 3.8, uniqueBidders: 165, returnRate: 58 },
  { sale: "#45", avgBids: 5.1, uniqueBidders: 210, returnRate: 68 },
  { sale: "#46", avgBids: 3.5, uniqueBidders: 155, returnRate: 55 },
  { sale: "#47", avgBids: 4.8, uniqueBidders: 195, returnRate: 65 },
];

type Brand = "genazym" | "zaidy";

const brandKPIs: Record<Brand, { avgPrice: string; avgUplift: string; uniqueInvolved: string; avgInvolvedPerSale: string }> = {
  genazym: {
    avgOpeningPrice: "$5,200",
    avgUplift: "87%",
    uniqueInvolved: "482",
    avgInvolvedPerSale: "289",
  },
  zaidy: {
    avgPrice: "$3,820",
    avgUplift: "62%",
    uniqueInvolved: "214",
    avgInvolvedPerSale: "134",
  },
};

export default function PastSales() {
  const [activeTab, setActiveTab] = useState("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<any>(null);
  const [brand, setBrand] = useState<Brand>("genazym");

  const kpis = brandKPIs[brand];

  const openSaleDrawer = (sale: any) => {
    setDrawerData(sale);
    setDrawerOpen(true);
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border px-8 pt-6 pb-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="section-title">מכירות עבר</h2>
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
        {activeTab === "overview" && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-8">
              <KPICard label="מחיר ממוצע לפריט" value={kpis.avgPrice} subtitle="ממוצע מחיר סגירה בכל המכירות" />
              <KPICard label="פער ממוצע מפתיחה לסגירה" value={kpis.avgUplift} subtitle="עליית מחיר ממוצעת באחוזים" />
              <KPICard label="מעורבים ייחודיים במותג" value={kpis.uniqueInvolved} subtitle="לקוחות שהציעו לפחות פעם אחת" />
              <KPICard label="ממוצע מעורבים למכירה" value={kpis.avgInvolvedPerSale} subtitle="ממוצע מציעים ייחודיים למכירה" />
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="chart-card">
                <div className="chart-title">הכנסות לפי מכירה (אלפי $)</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={saleComparisonChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                    <XAxis dataKey="sale" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="hsl(220,35%,18%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <div className="chart-title">פריטים שנמכרו מול סה״כ</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={saleComparisonChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                    <XAxis dataKey="sale" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="lots" fill="hsl(40,8%,80%)" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="sold" fill="hsl(38,65%,52%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-title">טבלת מכירות</div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>מכירה</th>
                    <th>תאריך</th>
                    <th>פריטים</th>
                    <th>נמכרו</th>
                    <th>הכנסות</th>
                    <th>זוכים</th>
                    <th>מציעים</th>
                    <th>נרשמים חדשים</th>
                  </tr>
                </thead>
                <tbody>
                  {pastSalesData.map((sale) => (
                    <tr key={sale.id} onClick={() => openSaleDrawer(sale)}>
                      <td className="font-semibold">{sale.name}</td>
                      <td>{sale.date}</td>
                      <td>{sale.lots}</td>
                      <td>{sale.sold}</td>
                      <td>${sale.revenue.toLocaleString()}</td>
                      <td>{sale.winners}</td>
                      <td>{sale.bidders}</td>
                      <td>{sale.newReg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === "compare" && (
          <>
            <div className="chart-card mb-6">
              <div className="chart-title">השוואת הכנסות בין מכירות</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={saleComparisonChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                  <XAxis dataKey="sale" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="hsl(220,35%,18%)" radius={[4, 4, 0, 0]} name="הכנסות (אלפי $)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <div className="chart-title">עליית מחיר: פתיחה מול סגירה</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={upliftData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="lot" type="category" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="opening" fill="hsl(40,8%,80%)" name="מחיר פתיחה" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="final" fill="hsl(38,65%,52%)" name="מחיר סגירה" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {activeTab === "engagement" && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <KPICard label="ממוצע הצעות לפריט" value="4.3" trend="up" trendValue="+8%" />
              <KPICard label="שיעור חזרה" value="62%" trend="up" trendValue="+4%" />
              <KPICard label="מציעים חדשים (%)" value="18%" trend="down" trendValue="-2%" />
            </div>
            <div className="chart-card">
              <div className="chart-title">מעורבות לפי מכירה</div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={engagementBysale}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                  <XAxis dataKey="sale" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgBids" stroke="hsl(220,35%,18%)" strokeWidth={2} name="ממוצע הצעות" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="returnRate" stroke="hsl(38,65%,52%)" strokeWidth={2} name="שיעור חזרה (%)" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {activeTab === "financial" && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-8">
              <KPICard label="ממוצע מחיר פריט" value="$9,450" trend="up" trendValue="+6%" />
              <KPICard label="עלית מחיר ממוצעת" value="87%" subtitle="מפתיחה לסגירה" trend="up" trendValue="+12%" />
              <KPICard label="פריט יקר ביותר" value="$48,000" subtitle="שולחן ערוך - ונציה" />
              <KPICard label="עמלות" value="$1.2M" trend="up" trendValue="+8%" />
            </div>
            <div className="chart-card">
              <div className="chart-title">מגמת הכנסות</div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={saleComparisonChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                  <XAxis dataKey="sale" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(38,65%,52%)" fill="hsl(38,65%,52%,0.12)" strokeWidth={2} name="הכנסות (אלפי $)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {activeTab === "trends" && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <KPICard label="מגמת הכנסות" value="עולה" trend="up" trendValue="+15% YoY" />
              <KPICard label="מגמת מציעים" value="יציבה" trend="neutral" trendValue="±2%" />
              <KPICard label="מגמת פריטים לא נמכרים" value="יורדת" trend="up" trendValue="-3%" subtitle="שיפור" />
            </div>
            <div className="chart-card">
              <div className="chart-title">מגמות לאורך זמן</div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={saleComparisonChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                  <XAxis dataKey="sale" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(220,35%,18%)" strokeWidth={2} name="הכנסות" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="sold" stroke="hsl(38,65%,52%)" strokeWidth={2} name="נמכרו" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      <DrillDownDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={drawerData?.name || ""}>
        {drawerData && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="kpi-card"><div className="kpi-value">{drawerData.lots}</div><div className="kpi-label">פריטים</div></div>
              <div className="kpi-card"><div className="kpi-value">{drawerData.sold}</div><div className="kpi-label">נמכרו</div></div>
              <div className="kpi-card"><div className="kpi-value">${drawerData.revenue.toLocaleString()}</div><div className="kpi-label">הכנסות</div></div>
              <div className="kpi-card"><div className="kpi-value">{drawerData.winners}</div><div className="kpi-label">זוכים</div></div>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-2">פרטי מכירה</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">תאריך</span><span>{drawerData.date}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">מציעים</span><span>{drawerData.bidders}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">נרשמים חדשים</span><span>{drawerData.newReg}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">שיעור מכירה</span><span>{Math.round(drawerData.sold/drawerData.lots*100)}%</span></div>
              </div>
            </div>
          </div>
        )}
      </DrillDownDrawer>
    </div>
  );
}
