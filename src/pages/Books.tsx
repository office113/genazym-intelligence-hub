import { useState } from "react";
import SubNav from "@/components/layout/SubNav";
import InvestigationPanel from "@/components/dashboard/InvestigationPanel";
import DataStateWrapper from "@/components/dashboard/DataStateWrapper";
import { useBookAuctionSummary } from "@/hooks/useSupabaseData";
import { Search } from "lucide-react";

const tabs = [
  { key: "search", label: "חיפוש חכם" },
  { key: "gallery", label: "תצוגת ספרים" },
];

export default function Books() {
  const [activeTab, setActiveTab] = useState("search");
  const [panelOpen, setPanelOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<Record<string, unknown> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const bookData = useBookAuctionSummary();

  const openRow = (row: Record<string, unknown>) => {
    setSelectedRow(row);
    setPanelOpen(true);
  };

  // Simple client-side search across all string fields
  const filtered = (bookData.data || []).filter((row: Record<string, unknown>) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return Object.values(row).some(v => v != null && String(v).toLowerCase().includes(q));
  });

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

  const renderCards = (data: Record<string, unknown>[]) => {
    if (!data.length) return <div className="text-center py-16 text-muted-foreground text-sm">אין נתונים להצגה</div>;
    const columns = Object.keys(data[0]);
    // Pick key display fields heuristically
    const titleCol = columns.find(c => /title|name|שם/i.test(c)) || columns[0];
    const descCols = columns.filter(c => c !== titleCol).slice(0, 4);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {data.slice(0, 50).map((row, i) => (
          <div key={i} className="action-card cursor-pointer" onClick={() => openRow(row)}>
            <div className="font-display font-bold text-sm mb-2">{String(row[titleCol] ?? `שורה ${i + 1}`)}</div>
            <div className="space-y-1">
              {descCols.map(col => (
                <div key={col} className="flex justify-between text-xs">
                  <span className="text-muted-foreground">{col}</span>
                  <span className="font-medium">{row[col] == null ? "—" : String(row[col])}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen" dir="rtl">
      <SubNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} title="ספרים" />

      <div className="p-8 animate-fade-in">
        {/* Search bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="חיפוש חכם בכל השדות..."
              className="filter-input pr-10"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            מקור: fact_book_auction_summary · {filtered.length} תוצאות
          </p>
        </div>

        <DataStateWrapper
          isLoading={bookData.isLoading}
          error={bookData.error as Error | null}
          isEmpty={!filtered.length}
        >
          {activeTab === "search" && renderTable(filtered.slice(0, 100) as Record<string, unknown>[], openRow)}
          {activeTab === "gallery" && renderCards(filtered as Record<string, unknown>[])}
        </DataStateWrapper>
      </div>

      <InvestigationPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        title="פרטי ספר"
        subtitle="fact_book_auction_summary"
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
