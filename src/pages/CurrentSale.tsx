import { useState, useMemo, useEffect } from "react";
import KPICard from "@/components/dashboard/KPICard";
import DrillDownDrawer from "@/components/dashboard/DrillDownDrawer";
import OverviewTab, { type DisplayMode } from "@/components/current-sale/OverviewTab";
import { usePastSales } from "@/hooks/usePastSales";
import { supabase } from "@/lib/supabaseClient";

const tabs = [
  { key: "overview", label: "סקירה" },
  { key: "byDX", label: "לפי יום לפני מכירה" },
  { key: "bySale", label: "לפי מכירה אחת" },
  { key: "missing", label: "לקוחות חסרים" },
];

type Brand = "genazym" | "zaidy";

const MISSING_PAGE_SIZE = 25;

export default function CurrentSale() {
  const [activeTab, setActiveTab] = useState("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [brand, setBrand] = useState<Brand>("genazym");

  const { rawActivityData, rawAuctionsData, dailySnapshots, pastSalesData, loading, error } = usePastSales(brand);

  // Missing customers state
  const [missingData, setMissingData] = useState<any[]>([]);
  const [missingLoading, setMissingLoading] = useState(false);
  const [missingError, setMissingError] = useState<string | null>(null);
  const [missingPage, setMissingPage] = useState(0);
  const [missingTotal, setMissingTotal] = useState(0);

  useEffect(() => {
    if (activeTab !== "missing") return;
    const fetchMissing = async () => {
      setMissingLoading(true);
      setMissingError(null);
      try {
        const from = missingPage * MISSING_PAGE_SIZE;
        const to = from + MISSING_PAGE_SIZE - 1;

        const { data, error: err, count } = await supabase
          .from("view_missing_customers")
          .select("*", { count: "exact" })
          .order("total_spend_all_time", { ascending: false })
          .range(from, to);

        if (err) throw new Error(err.message);
        setMissingData(data ?? []);
        setMissingTotal(count ?? 0);
      } catch (e: any) {
        setMissingError(e.message);
      } finally {
        setMissingLoading(false);
      }
    };
    fetchMissing();
  }, [activeTab, missingPage]);

  const openCustomer = (c: any) => { setSelectedCustomer(c); setDrawerOpen(true); };
  const selectedBrand = brand === "genazym" ? "גנזים" as const : "זיידי" as const;

  const totalPages = Math.ceil(missingTotal / MISSING_PAGE_SIZE);

  // KPIs for missing tab
  const missingKpis = useMemo(() => ({
    count: missingTotal,
  }), [missingTotal]);

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

        {activeTab === "missing" && (
          <>
            {missingLoading && <div className="text-center py-20 text-muted-foreground text-sm">טוען נתונים...</div>}
            {missingError && <div className="text-center py-20 text-destructive text-sm">שגיאה: {missingError}</div>}
            {!missingLoading && !missingError && (
              <>
                <div className="grid grid-cols-3 gap-4 mb-8">
                  <KPICard label="לקוחות חסרים" value={missingKpis.count.toString()} />
                </div>
                <div className="chart-card">
                  <div className="chart-title">לקוחות חסרים — ממוינים לפי סה״כ הוצאות</div>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>מזהה</th>
                        <th>שם</th>
                        <th>סה״כ הוצאות ($)</th>
                        <th>מכירות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {missingData.map((c, i) => (
                        <tr key={c.customer_email || i} onClick={() => openCustomer({ name: c.customer_name, email: c.customer_email, totalSpend: c.total_spend_all_time, displayId: c.display_id })}>
                          <td className="text-center text-xs text-muted-foreground">{c.display_id || "—"}</td>
                          <td className="font-semibold">{c.customer_name || c.customer_email || "—"}</td>
                          <td>${(c.total_spend_all_time ?? 0).toLocaleString()}</td>
                          <td>{c.auctions_participated ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-4 pb-2">
                      <button disabled={missingPage === 0} onClick={() => setMissingPage(p => p - 1)} className="px-3 py-1 text-sm rounded-md border border-border bg-card disabled:opacity-40 hover:bg-muted transition-colors">הקודם</button>
                      <span className="text-sm text-muted-foreground">עמוד {missingPage + 1} מתוך {totalPages}</span>
                      <button disabled={missingPage >= totalPages - 1} onClick={() => setMissingPage(p => p + 1)} className="px-3 py-1 text-sm rounded-md border border-border bg-card disabled:opacity-40 hover:bg-muted transition-colors">הבא</button>
                    </div>
                  )}
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
              <div className="kpi-card"><div className="kpi-value">${(selectedCustomer.totalSpend ?? 0).toLocaleString()}</div><div className="kpi-label">סה״כ הוצאות</div></div>
              <div className="kpi-card"><div className="kpi-value">{selectedCustomer.displayId || "—"}</div><div className="kpi-label">מזהה</div></div>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-3">מידע נוסף</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">אימייל</span><span dir="ltr" className="text-xs">{selectedCustomer.email}</span></div>
              </div>
            </div>
          </div>
        )}
      </DrillDownDrawer>
    </div>
  );
}