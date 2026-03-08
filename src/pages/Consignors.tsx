import { useState } from "react";
import SubNav from "@/components/layout/SubNav";
import KPICard from "@/components/dashboard/KPICard";
import DrillDownDrawer from "@/components/dashboard/DrillDownDrawer";
import { consignors } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const tabs = [
  { key: "overview", label: "סקירה" },
  { key: "performance", label: "ביצועי מפקיד" },
  { key: "inventory", label: "מלאי" },
  { key: "compare", label: "השוואת מכירות" },
];

export default function Consignors() {
  const [activeTab, setActiveTab] = useState("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);

  const totalLots = consignors.reduce((a, b) => a + b.lots, 0);
  const totalRevenue = consignors.reduce((a, b) => a + b.revenue, 0);
  const totalSold = consignors.reduce((a, b) => a + b.sold, 0);

  return (
    <div className="min-h-screen">
      <SubNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} title="מפקידים" />
      <div className="p-8 animate-fade-in">
        {activeTab === "overview" && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-8">
              <KPICard label="מפקידים פעילים" value={consignors.length} />
              <KPICard label="סה״כ פריטים" value={totalLots} />
              <KPICard label="שיעור מכירה" value={`${Math.round(totalSold/totalLots*100)}%`} trend="up" trendValue="+2%" />
              <KPICard label="הכנסות כוללות" value={`$${(totalRevenue/1000).toFixed(0)}K`} />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="chart-card">
                <div className="chart-title">הכנסות לפי מפקיד</div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={consignors} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={160} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="hsl(220,35%,18%)" radius={[0,4,4,0]} name="הכנסות ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-card">
                <div className="chart-title">טבלת מפקידים</div>
                <table className="data-table">
                  <thead><tr><th>שם</th><th>פריטים</th><th>נמכרו</th><th>הכנסות</th><th>מכירות פעילות</th></tr></thead>
                  <tbody>
                    {consignors.map((c) => (
                      <tr key={c.id} onClick={() => { setSelected(c); setDrawerOpen(true); }}>
                        <td className="font-semibold">{c.name}</td>
                        <td>{c.lots}</td>
                        <td>{c.sold}</td>
                        <td>${c.revenue.toLocaleString()}</td>
                        <td>{c.activeSales}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        {activeTab === "performance" && (
          <div className="chart-card">
            <div className="chart-title">ביצועים — ממוצע מחיר לפריט</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={consignors}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="avgPrice" fill="hsl(38,65%,52%)" radius={[4,4,0,0]} name="ממוצע מחיר ($)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {activeTab === "inventory" && (
          <div className="chart-card">
            <div className="chart-title">מלאי נותר</div>
            <table className="data-table">
              <thead><tr><th>מפקיד</th><th>פריטים שהופקדו</th><th>נמכרו</th><th>נותרו</th><th>שיעור מכירה</th></tr></thead>
              <tbody>
                {consignors.map((c) => (
                  <tr key={c.id}>
                    <td className="font-semibold">{c.name}</td>
                    <td>{c.lots}</td>
                    <td>{c.sold}</td>
                    <td>{c.lots - c.sold}</td>
                    <td>{Math.round(c.sold/c.lots*100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {activeTab === "compare" && (
          <div className="text-center py-20 text-muted-foreground text-sm">
            <div className="font-display font-semibold text-lg mb-2">השוואת מכירות</div>
            <div>בחר מפקיד כדי לראות ביצועים לאורך מכירות שונות</div>
          </div>
        )}
      </div>

      <DrillDownDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={selected?.name || ""}>
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="kpi-card"><div className="kpi-value text-xl">{selected.lots}</div><div className="kpi-label">פריטים</div></div>
              <div className="kpi-card"><div className="kpi-value text-xl">{selected.sold}</div><div className="kpi-label">נמכרו</div></div>
              <div className="kpi-card"><div className="kpi-value text-xl">${selected.revenue.toLocaleString()}</div><div className="kpi-label">הכנסות</div></div>
              <div className="kpi-card"><div className="kpi-value text-xl">${selected.avgPrice.toLocaleString()}</div><div className="kpi-label">ממוצע לפריט</div></div>
            </div>
          </div>
        )}
      </DrillDownDrawer>
    </div>
  );
}
