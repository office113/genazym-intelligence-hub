import { useState } from "react";
import InvestigationPanel from "@/components/dashboard/InvestigationPanel";
import DataStateWrapper from "@/components/dashboard/DataStateWrapper";
import { useAuctionDailySnapshot } from "@/hooks/useSupabaseData";

const tabs = [
  { key: "overview", label: "סקירה" },
  { key: "byDX", label: "לפי יום לפני מכירה" },
  { key: "bySale", label: "לפי מכירה אחת" },
];

type Brand = "genazym" | "zaidy";

export default function CurrentSale() {
  const [activeTab, setActiveTab] = useState("overview");
  const [brand, setBrand] = useState<Brand>("genazym");
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null);

  const snapshot = useAuctionDailySnapshot();

  const openRow = (row: Record<string, unknown>) => {
    setSelectedRow(row);
    setPanelOpen(true);
  };

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
        {/* All tabs show fact_auction_daily_snapshot for now */}
        <DataStateWrapper
          isLoading={snapshot.isLoading}
          error={snapshot.error as Error | null}
          isEmpty={!snapshot.data?.length}
        >
          <div className="mb-4">
            <div className="chart-title">fact_auction_daily_snapshot</div>
            <p className="text-xs text-muted-foreground mb-4">
              {activeTab === "overview" && "סקירת מכירה נוכחית — מקור: Supabase"}
              {activeTab === "byDX" && "נתונים לפי יום לפני מכירה (D-X) — מקור: Supabase"}
              {activeTab === "bySale" && "נתונים לפי מכירה אחת — מקור: Supabase"}
            </p>
          </div>
          {snapshot.data && renderTable(snapshot.data.slice(0, 100) as Record<string, unknown>[], openRow)}
        </DataStateWrapper>
      </div>

      <InvestigationPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="פרטי שורה"
        subtitle="fact_auction_daily_snapshot"
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
