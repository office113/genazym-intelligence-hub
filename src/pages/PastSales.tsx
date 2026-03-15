import { useState } from "react";
import SubNav from "@/components/layout/SubNav";
import InvestigationPanel from "@/components/dashboard/InvestigationPanel";
import DataStateWrapper from "@/components/dashboard/DataStateWrapper";
import { useCustomerAuctionActivity, useCustomerBrandActivity } from "@/hooks/useSupabaseData";

const tabs = [
  { key: "overview", label: "סקירה" },
  { key: "trends", label: "מגמות" },
  { key: "retention", label: "נטישה ושימור" },
];

type Brand = "genazym" | "zaidy";

export default function PastSales() {
  const [activeTab, setActiveTab] = useState("overview");
  const [brand, setBrand] = useState<Brand>("genazym");
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null);

  // Fetch from Supabase views
  const auctionActivity = useCustomerAuctionActivity();
  const brandActivity = useCustomerBrandActivity();

  const openRow = (row: Record<string, unknown>) => {
    setSelectedRow(row);
    setPanelOpen(true);
  };

  // Helper: render a generic data table from an array of objects
  const renderTable = (data: Record<string, unknown>[], onRowClick?: (row: Record<string, unknown>) => void) => {
    if (!data.length) return null;
    const columns = Object.keys(data[0]);
    return (
      <div className="chart-card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr style={{ background: "hsl(var(--secondary) / 0.5)" }}>
                {columns.map(col => (
                  <th key={col} className="whitespace-nowrap">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} onClick={() => onRowClick?.(row)}>
                  {columns.map(col => (
                    <td key={col} className="whitespace-nowrap">
                      {row[col] == null ? "—" : String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen" dir="rtl">
      {/* Header */}
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
          {tabs.map(tab => (
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
        {/* ═══ סקירה ═══ */}
        {activeTab === "overview" && (
          <DataStateWrapper
            isLoading={auctionActivity.isLoading}
            error={auctionActivity.error as Error | null}
            isEmpty={!auctionActivity.data?.length}
          >
            <div className="mb-4">
              <div className="chart-title">fact_customer_auction_activity</div>
              <p className="text-xs text-muted-foreground mb-4">נתוני פעילות לקוחות לפי מכירה — מקור: Supabase</p>
            </div>
            {auctionActivity.data && renderTable(auctionActivity.data.slice(0, 100) as Record<string, unknown>[], openRow)}
          </DataStateWrapper>
        )}

        {/* ═══ מגמות ═══ */}
        {activeTab === "trends" && (
          <DataStateWrapper
            isLoading={brandActivity.isLoading}
            error={brandActivity.error as Error | null}
            isEmpty={!brandActivity.data?.length}
          >
            <div className="mb-4">
              <div className="chart-title">fact_customer_brand_activity</div>
              <p className="text-xs text-muted-foreground mb-4">נתוני פעילות לקוחות לפי מותג — מקור: Supabase</p>
            </div>
            {brandActivity.data && renderTable(brandActivity.data.slice(0, 100) as Record<string, unknown>[], openRow)}
          </DataStateWrapper>
        )}

        {/* ═══ נטישה ושימור ═══ */}
        {activeTab === "retention" && (
          <DataStateWrapper
            isLoading={auctionActivity.isLoading}
            error={auctionActivity.error as Error | null}
            isEmpty={!auctionActivity.data?.length}
          >
            <div className="mb-4">
              <div className="chart-title">נטישה ושימור — fact_customer_auction_activity</div>
              <p className="text-xs text-muted-foreground mb-4">ניתוח נטישה ושימור לקוחות — מקור: Supabase</p>
            </div>
            {auctionActivity.data && renderTable(auctionActivity.data.slice(0, 100) as Record<string, unknown>[], openRow)}
          </DataStateWrapper>
        )}
      </div>

      {/* Investigation Panel (bottom-sheet drill-down) */}
      <InvestigationPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="פרטי שורה"
        subtitle="לחץ על שדה לחקירה מעמיקה"
      >
        {selectedRow && (
          <div className="space-y-3">
            {Object.entries(selectedRow).map(([key, val]) => (
              <div key={key} className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm font-medium text-muted-foreground">{key}</span>
                <span className="text-sm font-semibold">{val == null ? "—" : String(val)}</span>
              </div>
            ))}
          </div>
        )}
      </InvestigationPanel>
    </div>
  );
}
