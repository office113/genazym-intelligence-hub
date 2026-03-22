import { ReactNode, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import {
  History,
  Gavel,
  Target,
  Users,
  UserCheck,
  UserPlus,
  BookOpen,
  Activity,
  RefreshCw,
  Settings,
  ChevronDown,
} from "lucide-react";
import { useStatusThresholds } from "@/contexts/StatusThresholdsContext";

const navItems = [
  { label: "מכירות עבר", path: "/past-sales", icon: History },
  { label: "מכירה נוכחית", path: "/current-sale", icon: Gavel },
  { label: "טרגוט", path: "/targeting", icon: Target },
  { label: "לקוחות", path: "/customers", icon: Users },
  { label: "מפקידים", path: "/consignors", icon: UserCheck },
  { label: "נרשמים", path: "/registrants", icon: UserPlus },
  { label: "ספרים", path: "/books", icon: BookOpen },
  { label: "פעילות", path: "/activity", icon: Activity },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isFetching = useIsFetching({ queryKey: ["brandData"] });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showStatusSettings, setShowStatusSettings] = useState(false);
  const { thresholds, setThresholds } = useStatusThresholds();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["brandData"] });
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const spinning = isRefreshing || isFetching > 0;

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar */}
      <aside className="fixed right-0 top-0 h-screen w-56 flex-shrink-0 z-30 flex flex-col"
        style={{ background: "hsl(var(--sidebar-background))" }}>
        {/* Logo */}
        <div className="flex items-center justify-center h-16 border-b"
          style={{ borderColor: "hsl(var(--sidebar-border))" }}>
          <h1 className="text-lg font-bold tracking-wide font-display"
            style={{ color: "hsl(var(--sidebar-primary))" }}>
            GENAZYM
          </h1>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <div
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`sidebar-item relative ${isActive ? "sidebar-item-active" : ""}`}
              >
                <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>

        {/* Status Rules Section */}
        <div className="px-3 pb-2">
          <button
            onClick={() => setShowStatusSettings(s => !s)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 border"
            style={{
              borderColor: "hsl(var(--sidebar-border))",
              color: "hsl(var(--sidebar-foreground))",
              background: "hsl(var(--sidebar-accent))",
            }}
          >
            <div className="flex items-center gap-2">
              <Settings className="w-3.5 h-3.5 flex-shrink-0" />
              <span>כללי סטטוס</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showStatusSettings ? "rotate-180" : ""}`} />
          </button>

          {showStatusSettings && (
            <div className="mt-2 p-3 rounded-lg border space-y-2.5"
              style={{
                borderColor: "hsl(var(--sidebar-border))",
                background: "hsl(var(--sidebar-accent) / 0.5)",
              }}>
              <div>
                <label className="text-[10px] block mb-0.5" style={{ color: "hsl(var(--sidebar-muted))" }}>VIP — סף הוצאות ($)</label>
                <input
                  type="number"
                  value={thresholds.vipSpend}
                  onChange={e => setThresholds({ ...thresholds, vipSpend: Number(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 rounded border text-xs focus:outline-none focus:ring-1"
                  style={{
                    borderColor: "hsl(var(--sidebar-border))",
                    background: "hsl(var(--sidebar-background))",
                    color: "hsl(var(--sidebar-foreground))",
                  }}
                />
              </div>
              <div>
                <label className="text-[10px] block mb-0.5" style={{ color: "hsl(var(--sidebar-muted))" }}>VIP — סף מכירות</label>
                <input
                  type="number"
                  value={thresholds.vipAuctions}
                  onChange={e => setThresholds({ ...thresholds, vipAuctions: Number(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 rounded border text-xs focus:outline-none focus:ring-1"
                  style={{
                    borderColor: "hsl(var(--sidebar-border))",
                    background: "hsl(var(--sidebar-background))",
                    color: "hsl(var(--sidebar-foreground))",
                  }}
                />
              </div>
              <div>
                <label className="text-[10px] block mb-0.5" style={{ color: "hsl(var(--sidebar-muted))" }}>פעיל — סף מכירות</label>
                <input
                  type="number"
                  value={thresholds.activeAuctions}
                  onChange={e => setThresholds({ ...thresholds, activeAuctions: Number(e.target.value) || 0 })}
                  className="w-full px-2 py-1.5 rounded border text-xs focus:outline-none focus:ring-1"
                  style={{
                    borderColor: "hsl(var(--sidebar-border))",
                    background: "hsl(var(--sidebar-background))",
                    color: "hsl(var(--sidebar-foreground))",
                  }}
                />
              </div>
              <div className="text-[10px] p-1.5 rounded border"
                style={{
                  borderColor: "hsl(var(--sidebar-border))",
                  color: "hsl(var(--sidebar-muted))",
                  background: "hsl(var(--sidebar-background))",
                }}>
                VIP = ${thresholds.vipSpend.toLocaleString()}+ או {thresholds.vipAuctions}+ · פעיל = {thresholds.activeAuctions}+
              </div>
            </div>
          )}
        </div>

        {/* Refresh Button */}
        <div className="px-3 pb-2">
          <button
            onClick={handleRefresh}
            disabled={spinning}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 border disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90"
            style={{
              borderColor: "hsl(var(--sidebar-border))",
              color: "hsl(var(--sidebar-foreground))",
              background: "hsl(var(--sidebar-accent))",
            }}
          >
            <RefreshCw className={`w-4 h-4 flex-shrink-0 ${spinning ? "animate-spin" : ""}`} />
            <span>{spinning ? "מרענן..." : "רענון נתונים"}</span>
          </button>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t text-xs"
          style={{
            borderColor: "hsl(var(--sidebar-border))",
            color: "hsl(var(--sidebar-muted))"
          }}>
          <div>Genazym Intelligence</div>
          <div className="mt-0.5 opacity-60">v2.0</div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 mr-56 min-h-screen bg-background">
        {children}
      </main>
    </div>
  );
}
