import { useState } from "react";
import OverviewTab from "@/components/past-sales/OverviewTab";
import { useCustomerAuctionActivity } from "@/hooks/useSupabaseData";
import type { CustomerAuctionRow } from "@/components/past-sales/OverviewTab";

const tabs = [
  { key: "overview", label: "סקירה" },
  { key: "trends", label: "מגמות" },
  { key: "retention", label: "נטישה ושימור" },
];

type Brand = "genazym" | "zaidy";

export default function PastSales() {
  const [activeTab, setActiveTab] = useState("overview");
  const [brand, setBrand] = useState<Brand>("genazym");

  // Wire to Supabase — will use mock fallback inside OverviewTab until permissions work
  const auctionActivity = useCustomerAuctionActivity();

  return (
    <div className="min-h-screen" dir="rtl">
      {/* ─── Header ─── */}
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

      {/* ─── Content ─── */}
      <div className="p-8 animate-fade-in">
        {activeTab === "overview" && (
          <OverviewTab
            brand={brand}
            auctionData={auctionActivity.data as unknown as CustomerAuctionRow[] | undefined}
            isLoading={auctionActivity.isLoading}
            error={auctionActivity.error as Error | null}
          />
        )}

        {activeTab === "trends" && (
          <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            מגמות — ייבנה בשלב הבא
          </div>
        )}

        {activeTab === "retention" && (
          <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
            נטישה ושימור — ייבנה בשלב הבא
          </div>
        )}
      </div>
    </div>
  );
}
