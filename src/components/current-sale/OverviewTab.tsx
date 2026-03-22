import { useState, useMemo, useEffect } from "react";
import { SaleSnapshot } from "@/data/currentSaleOverviewData";
import { supabase } from "@/lib/supabaseClient";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Search, ChevronDown, CalendarClock, Loader2, Users, UserCheck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { differenceInDays, parseISO } from "date-fns";
import { useStatusThresholds, getCustomerStatus } from "@/contexts/StatusThresholdsContext";

export type DisplayMode = "overview" | "byDX" | "bySale";

// detectCurrentSale is now inline in the component using the derived salesList

function calcCurrentDX(saleDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = differenceInDays(parseISO(saleDate), today);
  return Math.max(0, Math.min(30, diff));
}

// ─── KPI CARD ───
function OverviewKPI({ label, value, comparison, compLabel }: {
  label: string; value: string | number; comparison?: string | number; compLabel?: string;
}) {
  return (
    <div className="kpi-card">
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      {comparison !== undefined && (
        <div className="text-xs text-muted-foreground mt-1.5 opacity-80">
          {compLabel || "ממוצע עבר"}: <span className="font-semibold text-foreground">{comparison}</span>
        </div>
      )}
    </div>
  );
}

// ─── INVESTIGATION PANEL (bottom-sheet) ───
function InvestigationPanel({ open, onClose, title, subtitle, children }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50"
            style={{ background: "rgba(10,15,30,0.55)", backdropFilter: "blur(6px)" }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-2xl border-t border-border overflow-hidden flex flex-col"
            style={{ height: "85vh", boxShadow: "0 -8px 40px rgba(0,0,0,0.15)" }}
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 300 }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1 rounded-full bg-border" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-border">
              <div>
                <h2 className="text-lg font-bold font-display text-foreground">{title}</h2>
                {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            {/* Content */}
            <ScrollArea className="flex-1 px-8 py-6">
              {children}
            </ScrollArea>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── DRILL-DOWN PANEL WITH REAL SUPABASE DATA ───
interface DrillDownState {
  type: string; title: string; subtitle: string; saleName: string; saleId: string; dx: number;
}

type DrillDownView = "sale" | "profile";

// StatusThresholds now provided by global context (StatusThresholdsContext)
function DrillDownPanel({ drillDown, onClose, getSnapshot, benchmarkByDX, selectedBrand }: {
  drillDown: DrillDownState | null;
  onClose: () => void;
  getSnapshot: (saleId: string, dx: number) => SaleSnapshot | undefined;
  benchmarkByDX: Record<number, any>;
  selectedBrand: "גנזים" | "זיידי";
}) {
  const [bidders, setBidders] = useState<any[]>([]);
  const [globalProfiles, setGlobalProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState<DrillDownView>("sale");
  const { thresholds: statusThresholds } = useStatusThresholds();

  // Determine if auction is in the past
  const auctionInPast = useMemo(() => {
    if (!bidders.length || !bidders[0]?.auction_date) return false;
    const auctionDate = new Date(bidders[0].auction_date);
    auctionDate.setHours(23, 59, 59, 999);
    return auctionDate < new Date();
  }, [bidders]);

  // Fetch current-sale bidders
  useEffect(() => {
    if (!drillDown) { setBidders([]); setGlobalProfiles([]); setSearchTerm(""); setView("sale"); return; }

    const fetchBidders = async () => {
      setLoading(true);
      setBidders([]);
      try {
        const { data, error } = await supabase
          .from("fact_customer_auction_activity")
          .select("full_name, email, total_bids, early_bids_count, live_bids_count, lots_involved, max_bid, was_early, was_live, was_winner, total_wins, total_win_value, first_bid_at, auction_date")
          .eq("auction_name", drillDown.saleId)
          .order("max_bid", { ascending: false });

        if (error || !data?.length) {
          setLoading(false);
          return;
        }

        const auctionDate = new Date(data[0].auction_date);
        const snapshotDate = new Date(auctionDate);
        snapshotDate.setDate(snapshotDate.getDate() - drillDown.dx);
        snapshotDate.setHours(23, 59, 59, 999);

        const filtered = data.filter(row => {
          if (!row.first_bid_at) return false;
          return new Date(row.first_bid_at) <= snapshotDate;
        });
        setBidders(filtered);
      } catch (err) {
        console.error("[DrillDown] fetch error:", err);
      }
      setLoading(false);
    };

    fetchBidders();
  }, [drillDown?.saleId, drillDown?.dx]);

  // Fetch global profiles when switching to profile view
  useEffect(() => {
    if (view !== "profile" || !bidders.length) return;
    if (globalProfiles.length) return;

    const fetchGlobal = async () => {
      setLoadingGlobal(true);
      try {
        const emails = [...new Set(bidders.map(b => b.email).filter(Boolean))];
        if (!emails.length) { setLoadingGlobal(false); return; }

        const brandFilter = selectedBrand === "גנזים" ? "Genazym" : "Zaidy";
        const { data, error } = await supabase
          .from("fact_customer_auction_activity")
          .select("full_name, email, total_bids, max_bid, was_winner, total_win_value, first_bid_at, auction_name")
          .eq("brand", brandFilter)
          .in("email", emails);

        if (error || !data?.length) { setLoadingGlobal(false); return; }

        const byEmail: Record<string, { full_name: string; email: string; totalBids: number; totalSpend: number; auctionCount: number; firstSeen: string; lastSeen: string }> = {};
        for (const row of data) {
          if (!row.email) continue;
          if (!byEmail[row.email]) {
            byEmail[row.email] = { full_name: row.full_name, email: row.email, totalBids: 0, totalSpend: 0, auctionCount: 0, firstSeen: row.first_bid_at || "", lastSeen: row.first_bid_at || "" };
          }
          const p = byEmail[row.email];
          p.totalBids += row.total_bids || 0;
          if (row.was_winner) p.totalSpend += row.total_win_value || 0;
          p.auctionCount += 1;
          if (row.first_bid_at && row.first_bid_at < p.firstSeen) p.firstSeen = row.first_bid_at;
          if (row.first_bid_at && row.first_bid_at > p.lastSeen) p.lastSeen = row.first_bid_at;
        }

        const profiles = Object.values(byEmail).sort((a, b) => b.totalSpend - a.totalSpend);
        setGlobalProfiles(profiles);
      } catch (err) {
        console.error("[DrillDown] global fetch error:", err);
      }
      setLoadingGlobal(false);
    };

    fetchGlobal();
  }, [view, bidders, selectedBrand]);

  const drillSnap = drillDown ? getSnapshot(drillDown.saleId, drillDown.dx) : undefined;
  const drillBench = drillDown ? benchmarkByDX[drillDown.dx] : undefined;

  const filteredBidders = useMemo(() => {
    if (!searchTerm) return bidders;
    const term = searchTerm.toLowerCase();
    return bidders.filter(b => b.full_name?.toLowerCase().includes(term) || b.email?.toLowerCase().includes(term));
  }, [bidders, searchTerm]);

  const filteredProfiles = useMemo(() => {
    if (!searchTerm) return globalProfiles;
    const term = searchTerm.toLowerCase();
    return globalProfiles.filter(p => p.full_name?.toLowerCase().includes(term) || p.email?.toLowerCase().includes(term));
  }, [globalProfiles, searchTerm]);

  const fmtCurrency = (n: number) => {
    if (!n) return "—";
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
    return `$${n.toLocaleString()}`;
  };

  const getStatus = (p: typeof globalProfiles[0]) => {
    return getCustomerStatus(p.totalSpend, p.auctionCount, statusThresholds);
  };

  return (
    <InvestigationPanel
      open={!!drillDown}
      onClose={onClose}
      title={drillDown?.title || ""}
      subtitle={drillDown?.subtitle}
    >
      {drillDown && (
        <div className="space-y-5">
          {/* Context bar */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border" style={{ background: "hsl(var(--secondary) / 0.3)" }}>
            <div className="text-sm">
              <span className="font-semibold">{drillDown.saleName}</span>
              <span className="mx-2 text-muted-foreground">·</span>
              <span className="font-bold" style={{ color: "hsl(var(--accent))" }}>D-{drillDown.dx}</span>
            </div>
            {drillSnap && (
              <div className="flex gap-4 mr-auto text-xs text-muted-foreground">
                <span>הצעות: <strong>{drillSnap.earlyBids}</strong>{drillBench?.earlyBids ? ` (ממוצע: ${drillBench.earlyBids})` : ""}</span>
                <span>משתמשים: <strong>{drillSnap.uniqueBidders}</strong>{drillBench?.uniqueBidders ? ` (ממוצע: ${drillBench.uniqueBidders})` : ""}</span>
              </div>
            )}
          </div>

          {/* KPI cards — always from current sale */}
          <div className="grid grid-cols-3 gap-4">
            <div className="kpi-card">
              <div className="kpi-value text-xl">{loading ? "..." : bidders.length}</div>
              <div className="kpi-label">סה״כ בידרים</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value text-xl">{loading ? "..." : bidders.filter(b => b.was_winner).length}</div>
              <div className="kpi-label">זכו בסוף המכירה</div>
            </div>
            <div className="kpi-card">
              <div className="kpi-value text-xl">{loading ? "..." : bidders.filter(b => b.was_early && b.was_live).length}</div>
              <div className="kpi-label">מוקדם + לייב</div>
            </div>
          </div>

          {/* View Toggle + Search row */}
          <div className="flex items-center gap-3">
            <div className="inline-flex rounded-lg border border-border overflow-hidden">
              <button
                onClick={() => setView("sale")}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-colors"
                style={view === "sale"
                  ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }
                  : { background: "hsl(var(--card))", color: "hsl(var(--muted-foreground))" }}
              >
                <Users className="w-3.5 h-3.5" />
                נתוני מכירה זו
              </button>
              <button
                onClick={() => setView("profile")}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold transition-colors"
                style={view === "profile"
                  ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }
                  : { background: "hsl(var(--card))", color: "hsl(var(--muted-foreground))" }}
              >
                <UserCheck className="w-3.5 h-3.5" />
                פרופיל לקוח
              </button>
            </div>
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="חיפוש לפי שם או אימייל..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>
          </div>

          {/* ═══ CURRENT SALE VIEW ═══ */}
          {view === "sale" && (
            <>
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="mr-3 text-sm text-muted-foreground">טוען נתונים...</span>
                </div>
              )}
              {!loading && filteredBidders.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  {searchTerm ? "לא נמצאו תוצאות לחיפוש" : "אין בידרים פעילים בנקודה זו"}
                </div>
              )}
              {!loading && filteredBidders.length > 0 && (
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="data-table w-full">
                    <thead>
                      <tr style={{ background: "hsl(var(--secondary) / 0.5)" }}>
                        <th>שם לקוח</th>
                        <th>סוג מעורבות</th>
                        <th>בידים במכירה</th>
                        <th>מס׳ לוטים</th>
                        <th>הצעה מקסימלית</th>
                        <th>שווי זכיות</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBidders.map((b, i) => {
                        // DX > 0 means auction hasn't happened yet — only show "מוקדם" engagement
                        const engType = !auctionInPast && drillDown && drillDown.dx > 0
                          ? "מוקדם"
                          : (b.was_early && b.was_live ? "גם וגם" : b.was_early ? "מוקדם" : "לייב");
                        // If auction hasn't happened, wins don't exist yet
                        const showWins = auctionInPast && drillDown?.dx === 0;
                        // Bid count: use early_bids_count when DX > 0 (pre-auction)
                        const bidCount = (drillDown && drillDown.dx > 0) ? (b.early_bids_count || 0) : (b.total_bids || 0);
                        return (
                          <tr key={i} className="hover:bg-secondary/20 transition-colors" style={i % 2 === 0 ? { background: "hsl(var(--secondary) / 0.15)" } : undefined}>
                            <td className="font-semibold">{b.full_name}</td>
                            <td>
                              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{
                                  background: engType === "גם וגם" ? "hsl(var(--accent) / 0.12)" : engType === "מוקדם" ? "hsl(var(--primary) / 0.1)" : "hsl(200, 40%, 92%)",
                                  color: engType === "גם וגם" ? "hsl(var(--gold-dark))" : engType === "מוקדם" ? "hsl(var(--primary))" : "hsl(200, 45%, 35%)",
                                }}>
                                {engType}
                              </span>
                            </td>
                            <td className="text-center">{bidCount}</td>
                            <td className="text-center">{b.lots_involved}</td>
                            <td className="font-semibold">{fmtCurrency(b.max_bid || 0)}</td>
                            <td className="font-semibold">{showWins && b.total_win_value ? fmtCurrency(b.total_win_value) : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* ═══ GLOBAL PROFILE VIEW ═══ */}
          {view === "profile" && (
            <>
              {/* Legend */}
              <div className="text-xs text-muted-foreground px-3 py-1.5 rounded border border-border" style={{ background: "hsl(var(--secondary) / 0.2)" }}>
                📋 <strong>מקרא:</strong>{" "}
                <span style={{ color: "hsl(var(--gold-dark))" }}>VIP</span> = ${statusThresholds.vipSpend.toLocaleString()}+ או {statusThresholds.vipAuctions}+ מכירות ·{" "}
                <span style={{ color: "hsl(var(--primary))" }}>פעיל</span> = {statusThresholds.activeAuctions}+ מכירות ·{" "}
                <span style={{ color: "hsl(200, 45%, 35%)" }}>חדש</span> = מתחת לסף
              </div>

              {loadingGlobal && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="mr-3 text-sm text-muted-foreground">טוען פרופילים...</span>
                </div>
              )}
              {!loadingGlobal && filteredProfiles.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  {searchTerm ? "לא נמצאו תוצאות לחיפוש" : "אין נתוני פרופיל זמינים"}
                </div>
              )}
              {!loadingGlobal && filteredProfiles.length > 0 && (
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="data-table w-full">
                    <thead>
                      <tr style={{ background: "hsl(var(--secondary) / 0.5)" }}>
                        <th>שם לקוח</th>
                        <th>סה״כ בידים (היסטורי)</th>
                        <th>מס׳ מכירות</th>
                        <th>תאריך הצטרפות</th>
                        <th>סה״כ רכישות ($)</th>
                        <th>סטטוס</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProfiles.map((p, i) => {
                        const status = getStatus(p);
                        return (
                          <tr key={i} className="hover:bg-secondary/20 transition-colors" style={i % 2 === 0 ? { background: "hsl(var(--secondary) / 0.15)" } : undefined}>
                            <td className="font-semibold">{p.full_name}</td>
                            <td className="text-center">{p.totalBids}</td>
                            <td className="text-center">{p.auctionCount}</td>
                            <td className="text-xs text-muted-foreground">{p.firstSeen?.slice(0, 10) || "—"}</td>
                            <td className="font-semibold">{fmtCurrency(p.totalSpend)}</td>
                            <td>
                              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium"
                                style={{ background: status.bg, color: status.color }}>
                                {status.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </InvestigationPanel>
  );
}

export default function OverviewTab({ selectedBrand, mode, dailySnapshots = [], rawAuctionsData = [] }: { selectedBrand: "גנזים" | "זיידי"; mode: DisplayMode; dailySnapshots?: any[]; rawAuctionsData?: any[] }) {

  // Map rawAuctionsData to salesList format
  const salesList = useMemo(() => {
    const brandFilter = selectedBrand === "גנזים" ? "Genazym" : "Zaidy";
    return rawAuctionsData
      .filter((a: any) => a.brand === brandFilter)
      .map((a: any) => {
        const num = a.auction_name?.match(/\d+/)?.[0] || "";
        return {
          id: a.auction_name,
          name: `מכירה #${num}`,
          brand: selectedBrand,
          date: a.auction_date,
          isCurrent: false, // will be detected dynamically
        };
      })
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [rawAuctionsData, selectedBrand]);

  // Map dailySnapshots to SaleSnapshot format
  const allSaleSnapshots: SaleSnapshot[] = useMemo(() => {
    return dailySnapshots.map((s: any) => {
      const num = s.auction_name?.match(/\d+/)?.[0] || "";
      return {
        saleId: s.auction_name,
        saleName: `מכירה #${num}`,
        brand: selectedBrand,
        saleDate: s.auction_date || "",
        totalLots: s.total_lots || 0,
        dx: Math.round(s.days_before ?? 0),
        earlyBids: s.early_bids_cum || 0,
        uniqueBidders: s.unique_bidders_cum || 0,
        lotsWithBids: s.lots_with_bids_cum || 0,
        lotsBidPct: s.pct_lots_with_bids || 0,
        guaranteedPrice: s.guaranteed_price || 0,
        newRegistrants28d: s.new_registrations_28d || 0,
        newBidders: s.new_bidders_28d || 0,
        newBiddersFromOtherBrand: s.new_bidders_from_other_brand || 0,
      } as SaleSnapshot;
    });
  }, [dailySnapshots, selectedBrand]);

  // Detect current sale per selected brand
  const currentSale = useMemo(() => {
    if (!salesList.length) return { id: "", name: "—", brand: selectedBrand, date: new Date().toISOString().slice(0, 10), isCurrent: false };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureSales = salesList
      .filter(s => s.brand === selectedBrand && parseISO(s.date) >= today)
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    if (futureSales.length > 0) return futureSales[0];
    const brandSales = salesList.filter(s => s.brand === selectedBrand).sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    return brandSales[0] || salesList[0];
  }, [selectedBrand, salesList]);

  const currentSaleId = currentSale.id;
  const autoDX = useMemo(() => calcCurrentDX(currentSale.date), [currentSale.date]);
  const isFutureSale = useMemo(() => parseISO(currentSale.date) >= new Date(new Date().setHours(0,0,0,0)), [currentSale.date]);

  const [selectedDX, setSelectedDX] = useState(autoDX);
  const [selectedSaleId, setSelectedSaleId] = useState(currentSaleId);
  const [drillDown, setDrillDown] = useState<{ type: string; title: string; subtitle: string; saleName: string; saleId: string; dx: number } | null>(null);

  // Reset DX and selected sale when brand changes
  useMemo(() => {
    setSelectedDX(autoDX);
    setSelectedSaleId(currentSaleId);
  }, [selectedBrand]);

  // Get snapshot for a sale at a specific DX
  const getSnapshot = (saleId: string, dx: number): SaleSnapshot | undefined =>
    allSaleSnapshots.find(s => s.saleId === saleId && s.dx === dx);

  // ════════════════════════════════════
  //  MODE 1: By D-X Day — filtered by brand
  // ════════════════════════════════════
  const mode1Data = useMemo(() => {
    if (!currentSaleId || !salesList.length) return { currentSnap: undefined, pastSnapshots: [], pastSales: [], avg: () => 0, median: () => 0 };
    const currentSnap = getSnapshot(currentSaleId, selectedDX);
    const pastSales = salesList
      .filter(s => s.id !== currentSaleId && s.brand === selectedBrand)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
    const pastSnapshots = pastSales.map(s => getSnapshot(s.id, selectedDX)).filter(Boolean) as SaleSnapshot[];

    // DEBUG: Mode 1 breakdown
    console.log(`[Mode1] Brand: ${selectedBrand}, DX: ${selectedDX}, excludes: ${currentSaleId}`);
    console.log(`[Mode1] Past sales used (${pastSales.length}):`, pastSales.map(s => {
      const snap = getSnapshot(s.id, selectedDX);
      return `${s.name} (${s.id}) → earlyBids=${snap?.earlyBids ?? 'MISSING'}`;
    }));
    console.log(`[Mode1] Avg earlyBids = ${pastSnapshots.length ? Math.round(pastSnapshots.reduce((a, s) => a + s.earlyBids, 0) / pastSnapshots.length) : 0} (from ${pastSnapshots.length} snapshots)`);
    const avg = (field: keyof SaleSnapshot) => {
      const vals = pastSnapshots.map(s => s[field] as number).filter(v => !isNaN(v));
      return vals.length ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
    };
    const median = (field: keyof SaleSnapshot) => {
      const vals = pastSnapshots.map(s => s[field] as number).filter(v => !isNaN(v)).sort((a, b) => a - b);
      if (!vals.length) return 0;
      const mid = Math.floor(vals.length / 2);
      return vals.length % 2 ? vals[mid] : Math.round((vals[mid - 1] + vals[mid]) / 2);
    };

    return { currentSnap, pastSnapshots, pastSales, avg, median };
  }, [selectedDX, selectedBrand, currentSaleId, salesList, allSaleSnapshots]);

  // ════════════════════════════════════
  //  MODE 2: By Single Sale
  // ════════════════════════════════════
  const mode2Data = useMemo(() => {
    const fallbackSale = { id: "", name: "—", brand: selectedBrand, date: "", isCurrent: false };
    const selectedSale = salesList.find(s => s.id === selectedSaleId) || salesList.find(s => s.brand === selectedBrand) || salesList[0] || fallbackSale;
    const saleSnapshots = allSaleSnapshots
      .filter(s => s.saleId === selectedSale.id && s.dx <= 30)
      .sort((a, b) => a.dx - b.dx); // D-0 first

    // Get last 5 completed same-brand sales for benchmark (excluding selected AND current active sale)
    const excludeIds = new Set([selectedSale.id, currentSaleId]);
    const sameBrandPast = salesList
      .filter(s => !excludeIds.has(s.id) && s.brand === selectedSale.brand)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    console.log(`[Mode2] Brand: ${selectedSale.brand}, excludes: ${selectedSale.id}`);
    console.log(`[Mode2] Past sales used (${sameBrandPast.length}):`, sameBrandPast.map(s => {
      const snap = getSnapshot(s.id, 0);
      return `${s.name} (${s.id}) → D-0 earlyBids=${snap?.earlyBids ?? 'MISSING'}`;
    }));

    type BenchmarkMetrics = {
      earlyBids?: number;
      uniqueBidders?: number;
      lotsWithBids?: number;
      lotsBidPct?: number;
      guaranteedPrice?: number;
    };

    const avgNonZero = (values: Array<number | null | undefined>) => {
      const valid = values.filter((v): v is number => v !== null && v !== undefined && v > 0);
      if (!valid.length) return undefined;
      return Math.round(valid.reduce((a, v) => a + v, 0) / valid.length);
    };

    // Single source of truth for benchmark values used by BOTH table logic and charts
    const benchmarkByDX: Record<number, BenchmarkMetrics> = {};
    for (let dx = 30; dx >= 0; dx--) {
      const snaps = sameBrandPast.map(s => getSnapshot(s.id, dx)).filter(Boolean) as SaleSnapshot[];
      if (!snaps.length) continue;

      const benchmark: BenchmarkMetrics = {
        earlyBids: avgNonZero(snaps.map(s => s.earlyBids)),
        uniqueBidders: avgNonZero(snaps.map(s => s.uniqueBidders)),
        lotsWithBids: avgNonZero(snaps.map(s => s.lotsWithBids)),
        lotsBidPct: avgNonZero(snaps.map(s => s.lotsBidPct)),
        guaranteedPrice: avgNonZero(snaps.map(s => s.guaranteedPrice)),
      };

      if (Object.values(benchmark).some(v => v !== undefined)) {
        benchmarkByDX[dx] = benchmark;
      }
    }

    // Chart data: direct mapping from the same benchmarkByDX object (no fallback-to-zero)
    const chartData = saleSnapshots.map(s => {
      const dxKey = Math.round(s.dx);
      const bench = benchmarkByDX[dxKey];
      return {
        dx: `D-${dxKey}`,
        dxNum: dxKey,
        earlyBids: s.earlyBids,
        uniqueBidders: s.uniqueBidders,
        lotsWithBids: s.lotsWithBids,
        lotsBidPct: s.lotsBidPct,
        guaranteedPrice: s.guaranteedPrice,
        avgBids: bench?.earlyBids,
        avgBidders: bench?.uniqueBidders,
        avgLots: bench?.lotsWithBids,
        avgPct: bench?.lotsBidPct,
        avgGuaranteed: bench?.guaranteedPrice,
      };
    });

    return { selectedSale, saleSnapshots, chartData: [...chartData].sort((a, b) => b.dxNum - a.dxNum), benchmarkByDX };
  }, [selectedSaleId, selectedBrand, salesList, allSaleSnapshots]);

  const openDrillDown = (type: string, title: string, subtitle: string, saleName?: string, saleId?: string, dx?: number) => {
    setDrillDown({ type, title, subtitle, saleName: saleName || "", saleId: saleId || "", dx: dx ?? selectedDX });
  };

  const fmtPrice = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n.toLocaleString()}`;
  };

  // DX options
  const dxOptions = Array.from({ length: 31 }, (_, i) => 30 - i);

  if (!salesList.length) {
    return <div className="text-center py-20 text-muted-foreground text-sm">טוען נתונים...</div>;
  }

  return (
    <div className="space-y-6">
      {/* ═══ TOP CONTROLS ═══ */}
      <div className="chart-card relative flex items-center justify-between gap-4">
        {/* RIGHT: Sale info */}
        <div className="flex items-center gap-3 border-l border-border pl-5 ml-1">
          <div>
            <div className="text-lg font-bold font-display">{currentSale.name}</div>
            <div className="text-xs text-muted-foreground">{currentSale.brand} · {currentSale.date}</div>
          </div>
        </div>

        {/* CENTER: Current real D-X status */}
        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg border border-accent/30" style={{ background: "hsl(var(--accent) / 0.08)" }}>
            <CalendarClock className="w-3.5 h-3.5" style={{ color: "hsl(var(--accent))" }} />
            <span className="text-xs font-bold whitespace-nowrap" style={{ color: "hsl(var(--accent))" }}>
              {currentSale.name} · אנחנו כעת ב־D-{autoDX}
            </span>
          </div>
        </div>

        {/* LEFT: Mode-specific controls */}
        <div className="flex items-center gap-3">
          {mode === "byDX" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">יום:</span>
              <div className="relative">
                <select
                  value={selectedDX}
                  onChange={e => setSelectedDX(Number(e.target.value))}
                  className="appearance-none bg-card border border-border rounded-lg px-4 py-2 pr-9 text-sm font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  {dxOptions.map(dx => (
                    <option key={dx} value={dx}>D-{dx}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          )}

          {mode === "bySale" && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">מכירה:</span>
              <div className="relative">
                <select
                  value={selectedSaleId}
                  onChange={e => setSelectedSaleId(e.target.value)}
                  className="appearance-none bg-card border border-border rounded-lg px-4 py-2 pr-9 text-sm font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/30"
                >
                  {salesList.filter(s => s.brand === selectedBrand).map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.id === currentSaleId ? " ★" : ""}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══ OVERVIEW MODE ═══ */}
      {mode === "overview" && (
        <>
          {/* KPI Row - current sale at current D-X */}
          <div className="grid grid-cols-6 gap-3">
            {[
              { key: "earlyBids", label: "סה״כ הצעות מוקדמות" },
              { key: "uniqueBidders", label: "משתמשים שונים עם הצעות" },
              { key: "lotsWithBids", label: "מס׳ פריטים עם הצעות" },
              { key: "lotsBidPct", label: "אחוז פריטים עם הצעות", suffix: "%" },
              { key: "guaranteedPrice", label: "מחיר מובטח", format: "price" },
              { key: "newBidders", label: "מס׳ בידרים חדשים" },
            ].map(kpi => {
              const snap = getSnapshot(currentSaleId, autoDX);
              const val = snap ? (snap as any)[kpi.key] : 0;
              const pastSales = salesList.filter(s => s.id !== currentSaleId && s.brand === selectedBrand);
              const pastSnaps = pastSales.map(s => getSnapshot(s.id, autoDX)).filter(Boolean) as SaleSnapshot[];
              const avgVal = pastSnaps.length ? Math.round(pastSnaps.reduce((a, s) => a + (s as any)[kpi.key], 0) / pastSnaps.length) : 0;
              const displayVal = kpi.format === "price" ? fmtPrice(val) : kpi.suffix ? `${val}${kpi.suffix}` : val;
              const displayAvg = kpi.format === "price" ? fmtPrice(avgVal) : kpi.suffix ? `${avgVal}${kpi.suffix}` : avgVal;

              return (
                <div key={kpi.key} className="kpi-card">
                  <div className="kpi-value text-2xl">{displayVal}</div>
                  <div className="kpi-label text-xs">{kpi.label}</div>
                  <div className="text-xs text-muted-foreground mt-1.5 opacity-80">
                    ממוצע עבר ב-D-{autoDX}: <span className="font-semibold text-foreground">{displayAvg}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════ */}
      {/*  MODE 1: BY D-X DAY                   */}
      {/* ═══════════════════════════════════════ */}
      {mode === "byDX" && (() => {
        // Build columns: current sale first, then past sales, then benchmarks
        const currentSnap = getSnapshot(currentSaleId, selectedDX);
        const pastSalesFiltered = salesList.filter(s => s.id !== currentSaleId && s.brand === selectedBrand);
        const pastWithSnaps = pastSalesFiltered.map(s => ({ sale: s, snap: getSnapshot(s.id, selectedDX) })).filter(x => x.snap) as { sale: typeof salesList[0]; snap: SaleSnapshot }[];

        type ColDef = { id: string; label: string; sublabel?: string; isCurrent?: boolean; isBenchmark?: boolean; snap?: SaleSnapshot; getValue: (key: keyof SaleSnapshot) => number };

        const columns: ColDef[] = [];

        // Helper to extract sale number from name like "מכירה #48" -> "48"
        const saleNumber = (name: string) => name.replace(/[^\d]/g, "");

        // Current sale column first (rightmost in RTL, next to metric labels)
        if (currentSnap) {
          columns.push({
            id: currentSaleId,
            label: `${selectedBrand} ${saleNumber(currentSale.name)}`,
            sublabel: currentSale.date,
            isCurrent: true,
            snap: currentSnap,
            getValue: (key) => currentSnap[key] as number,
          });
        }

        // Past sale columns newest to oldest (visible in matrix)
        const pastByDateDesc = [...pastWithSnaps].sort((a, b) => new Date(b.sale.date).getTime() - new Date(a.sale.date).getTime()).slice(0, 5);
        pastByDateDesc.forEach(({ sale, snap }) => {
          columns.push({
            id: sale.id,
            label: `${selectedBrand} ${saleNumber(sale.name)}`,
            sublabel: sale.date,
            snap,
            getValue: (key) => snap[key] as number,
          });
        });

        // Build a map: for each sale ID, find the previous same-brand sale's snapshot (even if not visible)
        const brandSnapshotsAtDX = allSaleSnapshots
          .filter(s => s.brand === selectedBrand && s.dx === selectedDX)
          .sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime());
        const prevSaleSnapMap: Record<string, SaleSnapshot | undefined> = {};
        for (let i = 0; i < brandSnapshotsAtDX.length; i++) {
          const prevSnap = brandSnapshotsAtDX[i + 1];
          if (prevSnap) {
            prevSaleSnapMap[brandSnapshotsAtDX[i].saleId] = prevSnap;
          }
        }

        // Benchmark column last (farthest left in RTL)
        columns.push({
          id: "avg",
          label: "ממוצע 5 מכירות אחרונות",
          isBenchmark: true,
          getValue: (key) => mode1Data.avg(key),
        });

        // Metric rows definition
        const metricRows: { label: string; key: keyof SaleSnapshot; format?: "price" | "pct"; drillType?: string }[] = [
          { label: "סה״כ פריטים במכירה", key: "totalLots" },
          { label: "סה״כ הצעות מוקדמות", key: "earlyBids" },
          { label: "משתמשים שונים עם הצעות", key: "uniqueBidders", drillType: "uniqueBidders" },
          { label: "מס׳ פריטים עם הצעות", key: "lotsWithBids", drillType: "lotsWithBids" },
          { label: "אחוז פריטים עם הצעות", key: "lotsBidPct", format: "pct" },
          { label: "מחיר מובטח", key: "guaranteedPrice", format: "price" },
          { label: "נרשמים חדשים (28 ימים)", key: "newRegistrants28d" },
          { label: "מס׳ בידרים חדשים", key: "newBidders", drillType: "newBidders" },
          { label: "מעורבות חדשה מהמותג השני", key: "newBiddersFromOtherBrand", drillType: "newBiddersFromOtherBrand" },
        ];

        const formatVal = (v: number, format?: "price" | "pct") => {
          if (format === "price") return fmtPrice(v);
          if (format === "pct") return `${v}%`;
          return v.toLocaleString();
        };

        return (
          <div className="chart-card">
            <div className="chart-title">השוואת מכירות ב-D-{selectedDX}</div>
            <div className="overflow-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th className="sticky right-0 bg-card z-10 min-w-[180px]">מדד</th>
                    {columns.map(col => (
                      <th
                        key={col.id}
                        className={`text-center min-w-[100px] ${col.isCurrent ? "font-bold" : ""} ${col.isBenchmark ? "text-muted-foreground" : ""}`}
                        style={col.isCurrent ? { background: "hsl(var(--accent) / 0.08)", borderTop: "3px solid hsl(var(--accent))" } : col.isBenchmark ? { background: "hsl(var(--secondary) / 0.4)" } : {}}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span>{col.label}</span>
                          {col.isCurrent && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: "hsl(var(--accent) / 0.15)", color: "hsl(var(--gold-dark))" }}>נוכחית</span>
                          )}
                          {col.sublabel && !col.isBenchmark && (
                            <span className="text-[10px] text-muted-foreground font-normal">{col.sublabel}</span>
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metricRows.map(metric => (
                    <tr key={metric.key}>
                      <td className="sticky right-0 bg-card z-10 font-semibold text-sm">{metric.label}</td>
                      {columns.map((col, colIdx) => {
                        const val = col.getValue(metric.key);
                        const isDrillable = !col.isBenchmark && !!metric.drillType;

                        // Trend color: compare to previous same-brand sale (even if not visible in matrix)
                        let trendColor = "";
                        if (!col.isBenchmark) {
                          const prevSnap = prevSaleSnapMap[col.id];
                          if (prevSnap) {
                            const prevVal = prevSnap[metric.key] as number;
                            if (val > prevVal) trendColor = "hsl(142, 60%, 40%)";
                            else if (val < prevVal) trendColor = "hsl(0, 65%, 48%)";
                          }
                        }

                        const saleName = col.label;
                        const saleId = col.id;

                        return (
                          <td
                            key={col.id}
                            className={`text-center ${col.isCurrent ? "font-bold" : ""} ${col.isBenchmark ? "text-muted-foreground font-semibold" : ""} ${isDrillable ? "cursor-pointer" : ""}`}
                            style={{
                              ...(col.isCurrent ? { background: "hsl(var(--accent) / 0.04)" } : {}),
                              ...(col.isBenchmark ? { background: "hsl(var(--secondary) / 0.3)" } : {}),
                              ...(trendColor && !isDrillable ? { color: trendColor } : {}),
                            }}
                            onClick={() => isDrillable && openDrillDown(metric.drillType!, metric.label, `${saleName} | מצב ב-D-${selectedDX}`, saleName, saleId, selectedDX)}
                          >
                            {isDrillable ? (
                              <span
                                className="inline-block px-2 py-0.5 rounded-md border border-accent/20 cursor-pointer transition-colors hover:border-accent/40 hover:shadow-sm"
                                style={{ background: "hsl(var(--accent) / 0.08)", color: trendColor || "hsl(var(--accent))" }}
                              >
                                {formatVal(val, metric.format)}
                              </span>
                            ) : (
                              formatVal(val, metric.format)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* ═══════════════════════════════════════ */}
      {/*  MODE 2: BY SINGLE SALE               */}
      {/* ═══════════════════════════════════════ */}
      {mode === "bySale" && (
        <>
          {/* Sale info bar */}
          <div className="flex items-center gap-4 mb-2">
            <div className="text-2xl font-bold font-display">{mode2Data.selectedSale.name}</div>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: mode2Data.selectedSale.brand === "גנזים" ? "hsl(var(--primary) / 0.1)" : "hsl(var(--accent) / 0.12)", color: mode2Data.selectedSale.brand === "גנזים" ? "hsl(var(--primary))" : "hsl(var(--gold-dark))" }}>
              {mode2Data.selectedSale.brand}
            </span>
            <span className="text-sm text-muted-foreground">{mode2Data.selectedSale.date}</span>
            {mode2Data.selectedSale.isCurrent && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "hsl(var(--accent) / 0.15)", color: "hsl(var(--gold-dark))" }}>מכירה נוכחית</span>
            )}
          </div>

          {/* KPI Row - latest available snapshot */}
          {(() => {
            // saleSnapshots sorted D-0 first, so [0] = D-0 (most recent data)
            const latestSnap = mode2Data.saleSnapshots[0]; // D-0
            // For future sales with no bids yet, find first snapshot with data, else fall back to D-0
            const displaySnap = mode2Data.saleSnapshots.find(s => s.earlyBids > 0) || latestSnap;
            if (!displaySnap) return null;
            const dxKey = Math.round(displaySnap.dx);
            const bench = mode2Data.benchmarkByDX[dxKey];
            console.log(`[KPI Cards] Brand=${selectedBrand}, Sale=${mode2Data.selectedSale.name}, DX=${dxKey}, hasBench=${!!bench}`);
            return (
              <div className="grid grid-cols-6 gap-3">
                <OverviewKPI label="סה״כ הצעות מוקדמות" value={displaySnap.earlyBids} comparison={bench?.earlyBids} />
                <OverviewKPI label="משתמשים שונים עם הצעות" value={displaySnap.uniqueBidders} comparison={bench?.uniqueBidders} />
                <OverviewKPI label="מס׳ פריטים עם הצעות" value={displaySnap.lotsWithBids} comparison={bench?.lotsWithBids} />
                <OverviewKPI label="אחוז פריטים עם הצעות" value={`${displaySnap.lotsBidPct}%`} comparison={bench?.lotsBidPct !== undefined ? `${bench.lotsBidPct}%` : undefined} />
                <OverviewKPI label="מחיר מובטח" value={fmtPrice(displaySnap.guaranteedPrice)} comparison={bench?.guaranteedPrice !== undefined ? fmtPrice(bench.guaranteedPrice) : undefined} />
                <OverviewKPI label="מס׳ בידרים חדשים" value={displaySnap.newBidders} />
              </div>
            );
          })()}

          {/* Timeline Charts */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: "earlyBids", avgKey: "avgBids", label: "סה״כ הצעות מוקדמות", color: "hsl(220,35%,18%)" },
              { key: "uniqueBidders", avgKey: "avgBidders", label: "משתמשים שונים עם הצעות", color: "hsl(var(--accent))" },
              { key: "lotsWithBids", avgKey: "avgLots", label: "מס׳ פריטים עם הצעות", color: "hsl(152,55%,42%)" },
              { key: "guaranteedPrice", avgKey: "avgGuaranteed", label: "מחיר מובטח", color: "hsl(220,25%,55%)" },
            ].map(chart => (
              <div key={chart.key} className="chart-card">
                <div className="chart-title text-xs">{chart.label}</div>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={mode2Data.chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                    <XAxis
                      dataKey="dx"
                      tick={{ fontSize: 10 }}
                      interval={5}
                      reversed
                    />
                    <YAxis tick={{ fontSize: 10 }} width={45} tickFormatter={chart.key === "guaranteedPrice" ? (v: number) => fmtPrice(v) : undefined} />
                    <Tooltip formatter={(v: number) => chart.key === "guaranteedPrice" ? fmtPrice(v) : v} />
                    <Line type="monotone" dataKey={chart.avgKey} stroke="hsl(40,8%,75%)" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="ממוצע מותג" />
                    <Line type="monotone" dataKey={chart.key} stroke={chart.color} strokeWidth={2.5} dot={false} name={mode2Data.selectedSale.name} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>

          {/* Full D-X progression table */}
          <div className="chart-card">
            <div className="chart-title">מעקב התקדמות — {mode2Data.selectedSale.name}</div>
            <div className="overflow-auto max-h-[500px]">
              <table className="data-table w-full">
                <thead className="sticky top-0 bg-card z-10">
                  <tr>
                    <th className="sticky right-0 bg-card z-20">D-X</th>
                    <th>סה״כ פריטים</th>
                    <th>סה״כ הצעות מוקדמות</th>
                    <th>משתמשים שונים</th>
                    <th>פריטים עם הצעות</th>
                    <th>% פריטים עם הצעות</th>
                    <th>מחיר מובטח</th>
                    <th>נרשמים חדשים (28י׳)</th>
                    <th>בידרים חדשים</th>
                    <th>חדשים מהמותג השני</th>
                  </tr>
                </thead>
                <tbody>
                  {mode2Data.saleSnapshots.map((snap, idx) => {
                    const isToday = mode2Data.selectedSale.isCurrent && snap.dx === selectedDX;
                    return (
                      <tr
                        key={snap.dx}
                        className={`cursor-pointer ${snap.dx % 5 === 0 ? "font-medium" : ""}`}
                        style={snap.dx <= 2 ? { background: "hsl(var(--accent) / 0.04)" } : undefined}
                        onClick={() => openDrillDown(
                          "uniqueBidders",
                          `נתוני משתמשים עבור ${mode2Data.selectedSale.name} ביום D-${snap.dx}`,
                          `${snap.uniqueBidders} משתמשים שונים · ${snap.earlyBids} הצעות · ${snap.lotsWithBids} פריטים`,
                          mode2Data.selectedSale.name,
                          mode2Data.selectedSale.id,
                          snap.dx
                        )}
                      >
                        <td className="sticky right-0 bg-card z-10">
                          <span className="font-bold font-display" style={snap.dx <= 2 ? { color: "hsl(var(--accent))" } : undefined}>D-{snap.dx}</span>
                        </td>
                        <td>{snap.totalLots}</td>
                        <td className="font-semibold">{snap.earlyBids}</td>
                        <td>{snap.uniqueBidders}</td>
                        <td>{snap.lotsWithBids}</td>
                        <td>{snap.lotsBidPct}%</td>
                        <td>{fmtPrice(snap.guaranteedPrice)}</td>
                        <td>{snap.newRegistrants28d}</td>
                        <td>{snap.newBidders}</td>
                        <td>{snap.newBiddersFromOtherBrand}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ═══ DRILL-DOWN INVESTIGATION PANEL ═══ */}
      <DrillDownPanel
        drillDown={drillDown}
        onClose={() => setDrillDown(null)}
        getSnapshot={getSnapshot}
        benchmarkByDX={mode2Data.benchmarkByDX}
        selectedBrand={selectedBrand}
      />
    </div>
  );
}
