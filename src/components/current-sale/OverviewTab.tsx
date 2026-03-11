import { useState, useMemo } from "react";
import { allSaleSnapshots, salesList, drillDownCustomers, SaleSnapshot } from "@/data/currentSaleOverviewData";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Search, ChevronDown, CalendarClock } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { differenceInDays, parseISO } from "date-fns";

export type DisplayMode = "overview" | "byDX" | "bySale";

// Auto-detect current sale: latest sale with a future date
function detectCurrentSale() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const futureSales = salesList
    .filter(s => parseISO(s.date) >= today)
    .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
  return futureSales.length > 0 ? futureSales[0] : salesList[0];
}

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

export default function OverviewTab({ selectedBrand, mode }: { selectedBrand: "גנזים" | "זיידי"; mode: DisplayMode }) {

  // Detect current sale per selected brand
  const currentSale = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const futureSales = salesList
      .filter(s => s.brand === selectedBrand && parseISO(s.date) >= today)
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    if (futureSales.length > 0) return futureSales[0];
    // Fallback: latest sale of this brand
    const brandSales = salesList.filter(s => s.brand === selectedBrand).sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    return brandSales[0] || salesList[0];
  }, [selectedBrand]);

  const currentSaleId = currentSale.id;
  const autoDX = useMemo(() => calcCurrentDX(currentSale.date), [currentSale.date]);
  const isFutureSale = useMemo(() => parseISO(currentSale.date) >= new Date(new Date().setHours(0,0,0,0)), [currentSale.date]);

  const [selectedDX, setSelectedDX] = useState(autoDX);
  const [selectedSaleId, setSelectedSaleId] = useState(currentSaleId);
  const [drillDown, setDrillDown] = useState<{ type: string; title: string; subtitle: string } | null>(null);

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
    const currentSnap = getSnapshot(currentSaleId, selectedDX);
    const pastSales = salesList.filter(s => s.id !== currentSaleId && s.brand === selectedBrand);
    const pastSnapshots = pastSales.map(s => getSnapshot(s.id, selectedDX)).filter(Boolean) as SaleSnapshot[];

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
  }, [selectedDX, selectedBrand, currentSaleId]);

  // ════════════════════════════════════
  //  MODE 2: By Single Sale
  // ════════════════════════════════════
  const mode2Data = useMemo(() => {
    const selectedSale = salesList.find(s => s.id === selectedSaleId)!;
    const saleSnapshots = allSaleSnapshots
      .filter(s => s.saleId === selectedSaleId)
      .sort((a, b) => b.dx - a.dx); // D-30 first

    // Get same-brand past sales for benchmark
    const sameBrandPast = salesList.filter(s => s.id !== selectedSaleId && s.brand === selectedSale.brand);
    const benchmarkByDX: Record<number, { earlyBids: number; uniqueBidders: number; lotsWithBids: number; lotsBidPct: number; guaranteedPrice: number }> = {};
    for (let dx = 30; dx >= 0; dx--) {
      const snaps = sameBrandPast.map(s => getSnapshot(s.id, dx)).filter(Boolean) as SaleSnapshot[];
      if (snaps.length) {
        benchmarkByDX[dx] = {
          earlyBids: Math.round(snaps.reduce((a, s) => a + s.earlyBids, 0) / snaps.length),
          uniqueBidders: Math.round(snaps.reduce((a, s) => a + s.uniqueBidders, 0) / snaps.length),
          lotsWithBids: Math.round(snaps.reduce((a, s) => a + s.lotsWithBids, 0) / snaps.length),
          lotsBidPct: Math.round(snaps.reduce((a, s) => a + s.lotsBidPct, 0) / snaps.length),
          guaranteedPrice: Math.round(snaps.reduce((a, s) => a + s.guaranteedPrice, 0) / snaps.length),
        };
      }
    }

    // Chart data: merge sale + benchmark
    const chartData = saleSnapshots.map(s => ({
      dx: `D-${s.dx}`,
      dxNum: s.dx,
      earlyBids: s.earlyBids,
      uniqueBidders: s.uniqueBidders,
      lotsWithBids: s.lotsWithBids,
      lotsBidPct: s.lotsBidPct,
      guaranteedPrice: s.guaranteedPrice,
      avgBids: benchmarkByDX[s.dx]?.earlyBids || 0,
      avgBidders: benchmarkByDX[s.dx]?.uniqueBidders || 0,
      avgLots: benchmarkByDX[s.dx]?.lotsWithBids || 0,
      avgPct: benchmarkByDX[s.dx]?.lotsBidPct || 0,
      avgGuaranteed: benchmarkByDX[s.dx]?.guaranteedPrice || 0,
    }));

    return { selectedSale, saleSnapshots, chartData, benchmarkByDX };
  }, [selectedSaleId]);

  const openDrillDown = (type: string, title: string, subtitle: string) => {
    setDrillDown({ type, title, subtitle });
  };

  const fmtPrice = (n: number) => {
    if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
    return `$${n.toLocaleString()}`;
  };

  // DX options
  const dxOptions = Array.from({ length: 31 }, (_, i) => 30 - i);

  return (
    <div className="space-y-6">
      {/* ═══ TOP CONTROLS ═══ */}
      <div className="chart-card flex flex-wrap items-center gap-4">
        {/* Sale info */}
        <div className="flex items-center gap-3 border-l border-border pl-5 ml-1">
          <div>
            <div className="text-lg font-bold font-display">{currentSale.name}</div>
            <div className="text-xs text-muted-foreground">{currentSale.brand} · {currentSale.date}</div>
          </div>
        </div>

        {/* Mode-specific controls + D-X indicator cluster */}
        <div className="flex items-center gap-3 mr-auto">
          {/* Current D-X status badge */}
          {isFutureSale && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-accent/30" style={{ background: "hsl(var(--accent) / 0.1)" }}>
              <CalendarClock className="w-3.5 h-3.5" style={{ color: "hsl(var(--accent))" }} />
              <span className="text-xs font-bold" style={{ color: "hsl(var(--accent))" }}>
                D-{autoDX}
              </span>
            </div>
          )}

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
      {mode === "byDX" && (
        <>
          {/* D-X indicator */}
          <div className="flex items-center gap-4 mb-2">
            <div className="text-4xl font-bold font-display" style={{ color: "hsl(var(--accent))" }}>
              D-{selectedDX}
            </div>
            <div className="text-sm text-muted-foreground">
              השוואת כל המכירות כפי שנראו {selectedDX} ימים לפני המכירה
            </div>
          </div>

          {/* KPI Row */}
          <div className="grid grid-cols-6 gap-3">
            {[
              { key: "earlyBids", label: "סה״כ הצעות מוקדמות" },
              { key: "uniqueBidders", label: "משתמשים שונים עם הצעות" },
              { key: "lotsWithBids", label: "מס׳ פריטים עם הצעות" },
              { key: "lotsBidPct", label: "אחוז פריטים עם הצעות", suffix: "%" },
              { key: "guaranteedPrice", label: "מחיר מובטח", format: "price" },
              { key: "newBidders", label: "מס׳ בידרים חדשים" },
            ].map(kpi => {
              const curr = mode1Data.currentSnap;
              const val = curr ? (curr as any)[kpi.key] : 0;
              const avgVal = mode1Data.avg(kpi.key as keyof SaleSnapshot);
              const displayVal = kpi.format === "price" ? fmtPrice(val) : kpi.suffix ? `${val}${kpi.suffix}` : val;
              const displayAvg = kpi.format === "price" ? fmtPrice(avgVal) : kpi.suffix ? `${avgVal}${kpi.suffix}` : avgVal;

              const drillType = kpi.key === "uniqueBidders" ? "uniqueBidders" : kpi.key === "lotsWithBids" ? "lotsWithBids" : kpi.key === "newBidders" ? "newBidders" : null;

              return (
                <div
                  key={kpi.key}
                  className={`kpi-card ${drillType ? "cursor-pointer" : ""}`}
                  onClick={() => drillType && openDrillDown(drillType, kpi.label, `${currentSale.name} · D-${selectedDX}`)}
                >
                  <div className="kpi-value text-2xl">{displayVal}</div>
                  <div className="kpi-label text-xs">{kpi.label}</div>
                  <div className="text-xs text-muted-foreground mt-1.5 opacity-80">
                    ממוצע: <span className="font-semibold text-foreground">{displayAvg}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Comparison Table */}
          <div className="chart-card">
            <div className="chart-title">השוואת מכירות ב-D-{selectedDX}</div>
            <div className="overflow-auto">
              <table className="data-table w-full">
                <thead>
                  <tr>
                    <th className="sticky right-0 bg-card z-10">מכירה</th>
                    <th>מותג</th>
                    <th>תאריך מכירה</th>
                    <th>סה״כ פריטים</th>
                    <th
                      className="cursor-pointer hover:text-foreground transition-colors"
                      style={{ color: "hsl(var(--accent))" }}
                      onClick={() => openDrillDown("uniqueBidders", "סה״כ הצעות מוקדמות", `D-${selectedDX}`)}
                    >סה״כ הצעות מוקדמות</th>
                    <th
                      className="cursor-pointer hover:text-foreground transition-colors"
                      style={{ color: "hsl(var(--accent))" }}
                      onClick={() => openDrillDown("uniqueBidders", "משתמשים שונים עם הצעות", `D-${selectedDX}`)}
                    >משתמשים שונים</th>
                    <th>מס׳ פריטים עם הצעות</th>
                    <th>% פריטים עם הצעות</th>
                    <th>מחיר מובטח</th>
                    <th>נרשמים חדשים (28י׳)</th>
                    <th>בידרים חדשים</th>
                    <th>חדשים מהמותג השני</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Current sale - highlighted */}
                  {(() => {
                    const snap = getSnapshot(currentSaleId, selectedDX);
                    const sale = currentSale;
                    if (!snap) return null;
                    return (
                      <tr
                        key={sale.id}
                        className="font-semibold"
                        style={{ background: "hsl(var(--accent) / 0.08)", borderRight: "3px solid hsl(var(--accent))" }}
                      >
                        <td className="sticky right-0 z-10" style={{ background: "hsl(var(--accent) / 0.08)" }}>
                          <span className="font-bold">{sale.name}</span>
                          <span className="text-xs mr-2 px-1.5 py-0.5 rounded-full" style={{ background: "hsl(var(--accent) / 0.15)", color: "hsl(var(--gold-dark))" }}>נוכחית</span>
                        </td>
                        <td>{sale.brand}</td>
                        <td>{sale.date}</td>
                        <td>{snap.totalLots}</td>
                        <td className="font-bold">{snap.earlyBids}</td>
                        <td className="font-bold cursor-pointer" style={{ color: "hsl(var(--accent))" }} onClick={() => openDrillDown("uniqueBidders", "משתמשים שונים עם הצעות", `${sale.name} · D-${selectedDX}`)}>{snap.uniqueBidders}</td>
                        <td className="cursor-pointer" style={{ color: "hsl(var(--accent))" }} onClick={() => openDrillDown("lotsWithBids", "מס׳ פריטים עם הצעות", `${sale.name} · D-${selectedDX}`)}>{snap.lotsWithBids}</td>
                        <td>{snap.lotsBidPct}%</td>
                        <td className="font-bold">{fmtPrice(snap.guaranteedPrice)}</td>
                        <td>{snap.newRegistrants28d}</td>
                        <td className="cursor-pointer" style={{ color: "hsl(var(--accent))" }} onClick={() => openDrillDown("newBidders", "מס׳ בידרים חדשים", `${sale.name} · D-${selectedDX}`)}>{snap.newBidders}</td>
                        <td>{snap.newBiddersFromOtherBrand}</td>
                      </tr>
                    );
                  })()}

                  {/* Past sales */}
                  {salesList.filter(s => !s.isCurrent).map(sale => {
                    const snap = getSnapshot(sale.id, selectedDX);
                    if (!snap) return null;
                    return (
                      <tr key={sale.id}>
                        <td className="sticky right-0 bg-card z-10 font-semibold">{sale.name}</td>
                        <td>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: sale.brand === "גנזים" ? "hsl(var(--primary) / 0.08)" : "hsl(var(--accent) / 0.1)", color: sale.brand === "גנזים" ? "hsl(var(--primary))" : "hsl(var(--gold-dark))" }}>
                            {sale.brand}
                          </span>
                        </td>
                        <td className="text-muted-foreground">{sale.date}</td>
                        <td>{snap.totalLots}</td>
                        <td>{snap.earlyBids}</td>
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

                  {/* Benchmark rows */}
                  <tr className="border-t-2 border-border" style={{ background: "hsl(var(--secondary) / 0.5)" }}>
                    <td className="sticky right-0 z-10 font-bold text-muted-foreground" style={{ background: "hsl(var(--secondary) / 0.5)" }}>ממוצע עבר</td>
                    <td></td><td></td>
                    <td className="font-semibold">{mode1Data.avg("totalLots")}</td>
                    <td className="font-semibold">{mode1Data.avg("earlyBids")}</td>
                    <td className="font-semibold">{mode1Data.avg("uniqueBidders")}</td>
                    <td className="font-semibold">{mode1Data.avg("lotsWithBids")}</td>
                    <td className="font-semibold">{mode1Data.avg("lotsBidPct")}%</td>
                    <td className="font-semibold">{fmtPrice(mode1Data.avg("guaranteedPrice"))}</td>
                    <td className="font-semibold">{mode1Data.avg("newRegistrants28d")}</td>
                    <td className="font-semibold">{mode1Data.avg("newBidders")}</td>
                    <td className="font-semibold">{mode1Data.avg("newBiddersFromOtherBrand")}</td>
                  </tr>
                  <tr style={{ background: "hsl(var(--secondary) / 0.3)" }}>
                    <td className="sticky right-0 z-10 font-bold text-muted-foreground" style={{ background: "hsl(var(--secondary) / 0.3)" }}>חציון עבר</td>
                    <td></td><td></td>
                    <td>{mode1Data.median("totalLots")}</td>
                    <td>{mode1Data.median("earlyBids")}</td>
                    <td>{mode1Data.median("uniqueBidders")}</td>
                    <td>{mode1Data.median("lotsWithBids")}</td>
                    <td>{mode1Data.median("lotsBidPct")}%</td>
                    <td>{fmtPrice(mode1Data.median("guaranteedPrice"))}</td>
                    <td>{mode1Data.median("newRegistrants28d")}</td>
                    <td>{mode1Data.median("newBidders")}</td>
                    <td>{mode1Data.median("newBiddersFromOtherBrand")}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

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
            const latestSnap = mode2Data.saleSnapshots[mode2Data.saleSnapshots.length - 1]; // D-0
            const latestAvail = mode2Data.saleSnapshots.find(s => s.earlyBids > 0) ? mode2Data.saleSnapshots[mode2Data.saleSnapshots.length - 1] : mode2Data.saleSnapshots[0];
            if (!latestSnap) return null;
            const bench = mode2Data.benchmarkByDX[latestSnap.dx];
            return (
              <div className="grid grid-cols-6 gap-3">
                <OverviewKPI label="סה״כ הצעות מוקדמות" value={latestSnap.earlyBids} comparison={bench?.earlyBids} />
                <OverviewKPI label="משתמשים שונים עם הצעות" value={latestSnap.uniqueBidders} comparison={bench?.uniqueBidders} />
                <OverviewKPI label="מס׳ פריטים עם הצעות" value={latestSnap.lotsWithBids} comparison={bench?.lotsWithBids} />
                <OverviewKPI label="אחוז פריטים עם הצעות" value={`${latestSnap.lotsBidPct}%`} comparison={bench ? `${bench.lotsBidPct}%` : undefined} />
                <OverviewKPI label="מחיר מובטח" value={fmtPrice(latestSnap.guaranteedPrice)} comparison={bench ? fmtPrice(bench.guaranteedPrice) : undefined} />
                <OverviewKPI label="מס׳ בידרים חדשים" value={latestSnap.newBidders} />
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
                      interval={4}
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
                        onClick={() => openDrillDown("uniqueBidders", `D-${snap.dx} Snapshot`, `${mode2Data.selectedSale.name}`)}
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
      <InvestigationPanel
        open={!!drillDown}
        onClose={() => setDrillDown(null)}
        title={drillDown?.title || ""}
        subtitle={drillDown?.subtitle}
      >
        {drillDown && (
          <div className="space-y-6">
            {/* Summary KPIs */}
            <div className="grid grid-cols-3 gap-4">
              <div className="kpi-card">
                <div className="kpi-value text-xl">{(drillDownCustomers[drillDown.type] || drillDownCustomers.uniqueBidders).length}</div>
                <div className="kpi-label">סה״כ רשומות</div>
              </div>
              {drillDown.type === "newBidders" && (
                <>
                  <div className="kpi-card">
                    <div className="kpi-value text-xl">
                      {drillDownCustomers.newBidders.filter(c => c.activeInOtherBrand).length}
                    </div>
                    <div className="kpi-label">פעילים במותג השני</div>
                  </div>
                  <div className="kpi-card">
                    <div className="kpi-value text-xl">
                      {drillDownCustomers.newBidders.filter(c => !c.activeInOtherBrand).length}
                    </div>
                    <div className="kpi-label">חדשים לגמרי</div>
                  </div>
                </>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="חיפוש..."
                className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </div>

            {/* Data table */}
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="data-table w-full">
                <thead>
                  <tr style={{ background: "hsl(var(--secondary) / 0.5)" }}>
                    <th>שם</th>
                    {drillDown.type === "lotsWithBids" ? (
                      <>
                        <th>הצעה ראשונה</th>
                        <th>הצעה מקסימלית</th>
                        <th>מס׳ הצעות</th>
                      </>
                    ) : (
                      <>
                        <th>תאריך ביד ראשון</th>
                        <th>מקסימום ביד היסטורי</th>
                        <th>מס׳ זכיות</th>
                        <th>מכירה אחרונה</th>
                        {drillDown.type === "newBidders" && <th>פעיל במותג השני</th>}
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(drillDownCustomers[drillDown.type] || drillDownCustomers.uniqueBidders).map((c, i) => (
                    <tr key={i} style={i % 2 === 0 ? { background: "hsl(var(--secondary) / 0.15)" } : undefined}>
                      <td className="font-semibold">{c.name}</td>
                      {drillDown.type === "lotsWithBids" ? (
                        <>
                          <td>{c.firstBidDate}</td>
                          <td className="font-semibold">{c.maxHistoricalBid}</td>
                          <td>{c.totalWins}</td>
                        </>
                      ) : (
                        <>
                          <td>{c.firstBidDate}</td>
                          <td className="font-semibold">{c.maxHistoricalBid}</td>
                          <td>{c.totalWins}</td>
                          <td>{c.lastActiveSale}</td>
                          {drillDown.type === "newBidders" && (
                            <td>
                              {c.activeInOtherBrand ? (
                                <span className="badge-ai">כן</span>
                              ) : (
                                <span className="text-muted-foreground text-xs">לא</span>
                              )}
                            </td>
                          )}
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </InvestigationPanel>
    </div>
  );
}
