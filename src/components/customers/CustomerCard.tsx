import { useState, useEffect, useMemo } from "react";
import { X } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useCustomerCard } from "@/contexts/CustomerCardContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type BrandTab = "all" | "Genazym" | "Zaidy";
type BookTab = "won" | "lost" | "active";

const PURPLE = { fill: "#EEEDFE", border: "#AFA9EC", text: "#3C3489", dark: "#26215C", main: "#7F77DD" };
const GREEN = { fill: "#E1F5EE", border: "#9FE1CB", text: "#085041" };
const AMBER = { fill: "#FAEEDA", border: "#FAC775", text: "#633806" };
const RED = { fill: "#FCEBEB", border: "#F7C1C1", text: "#A32D2D" };
const GRAY_BG = "#F1EFE8";
const MUTED = "#888780";

function getInitials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2 ? parts[0][0] + parts[1][0] : parts[0][0];
}

function fmt$(v: number | null | undefined) {
  return `$${(v ?? 0).toLocaleString()}`;
}

export default function CustomerCard() {
  const { customerEmail, closeCustomerCard } = useCustomerCard();
  const [brandTab, setBrandTab] = useState<BrandTab>("all");
  const [bookTab, setBookTab] = useState<BookTab>("won");

  // Data state
  const [header, setHeader] = useState<any>(null);
  const [brandKpis, setBrandKpis] = useState<any[]>([]);
  const [auctionActivity, setAuctionActivity] = useState<any[]>([]);
  const [booksWon, setBooksWon] = useState<any[]>([]);
  const [booksLost, setBooksLost] = useState<any[]>([]);
  const [booksActive, setBooksActive] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!customerEmail) return;
    setBrandTab("all");
    setBookTab("won");
    fetchAll(customerEmail);
  }, [customerEmail]);

  async function fetchAll(email: string) {
    setLoading(true);
    try {
      // Header
      const { data: cust } = await supabase
        .from("customers")
        .select("full_name, email, phone, country, city, purchasing_power, receive_catalog, genazym_id, zaidy_id")
        .eq("email", email)
        .maybeSingle();
      setHeader(cust);

      // Brand KPIs
      const { data: kpis } = await supabase
        .from("fact_customer_brand_activity")
        .select("*")
        .eq("email", email)
        .neq("email", "floor_crowd@aa.co");
      setBrandKpis(kpis || []);

      // Auction activity
      const { data: activity } = await supabase
        .from("fact_customer_auction_activity")
        .select("*")
        .eq("email", email)
        .order("auction_date", { ascending: false })
        .limit(1000);
      setAuctionActivity(activity || []);

      // Books WON - using RPC or raw query via supabase
      const { data: won } = await supabase
        .from("winners")
        .select("book_id_bidspirit, auction_name, sold_price, win_time")
        .eq("customer_email", email)
        .order("win_time", { ascending: false })
        .limit(200);

      // Enrich won books with names
      if (won && won.length > 0) {
        const bookKeys = won.map(w => `${w.book_id_bidspirit}|${w.auction_name}`);
        const uniqueKeys = [...new Set(bookKeys)];
        // Fetch book names in batches
        const bookNames: Record<string, string> = {};
        for (let i = 0; i < uniqueKeys.length; i += 50) {
          const batch = uniqueKeys.slice(i, i + 50);
          const ids = batch.map(k => k.split("|")[0]);
          const auctions = batch.map(k => k.split("|")[1]);
          const { data: books } = await supabase
            .from("books")
            .select("book_id_bidspirit, auction_name, book_name")
            .in("book_id_bidspirit", ids)
            .in("auction_name", auctions);
          (books || []).forEach(b => {
            bookNames[`${b.book_id_bidspirit}|${b.auction_name}`] = b.book_name;
          });
        }
        setBooksWon(won.map(w => ({
          ...w,
          book_name: bookNames[`${w.book_id_bidspirit}|${w.auction_name}`] || w.book_id_bidspirit,
        })));
      } else {
        setBooksWon([]);
      }

      // Books LOST - fetch from fact_customer_lost_bids
      const { data: lostData } = await supabase
        .from("fact_customer_lost_bids")
        .select("book_name, auction_name, max_bid, brand, auction_date")
        .eq("customer_email", email)
        .order("auction_date", { ascending: false });

      // Books ACTIVE - filter lost bids for future auctions
      const today = new Date().toISOString().split("T")[0];
      const { data: futureAuctions } = await supabase
        .from("auctions")
        .select("auction_name, auction_date")
        .gt("auction_date", today);
      const futureAuctionNames = new Set((futureAuctions || []).map(a => a.auction_name));

      const allLost = (lostData || []).map(r => ({
        book_name: r.book_name || "—",
        auction_name: r.auction_name,
        max_bid: r.max_bid,
        brand: r.brand,
      }));
      setBooksActive(allLost.filter(b => futureAuctionNames.has(b.auction_name)));
      setBooksLost(allLost.filter(b => !futureAuctionNames.has(b.auction_name)));

    } catch (err) {
      console.error("CustomerCard fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  // Derived data
  const totalWinValue = useMemo(() =>
    brandKpis.reduce((s, k) => s + (k.total_win_value || 0), 0), [brandKpis]);

  const filteredKpis = useMemo(() => {
    if (brandTab === "all") return brandKpis;
    return brandKpis.filter(k => k.brand === brandTab);
  }, [brandKpis, brandTab]);

  const aggregatedKpi = useMemo(() => {
    const rows = filteredKpis;
    if (!rows.length) return {
      auctions_involved_count: 0, total_wins: 0, total_win_value: 0,
      days_since_last_bid: null, max_bid_ever: 0, total_bids: 0,
      auctions_won_count: 0, last_bid_at: null,
    };
    return {
      auctions_involved_count: rows.reduce((s, r) => s + (r.auctions_involved_count || 0), 0),
      total_wins: rows.reduce((s, r) => s + (r.total_wins || 0), 0),
      total_win_value: rows.reduce((s, r) => s + (r.total_win_value || 0), 0),
      days_since_last_bid: Math.min(...rows.map(r => r.days_since_last_bid ?? 9999)),
      max_bid_ever: Math.max(...rows.map(r => r.max_bid_ever || 0)),
      total_bids: rows.reduce((s, r) => s + (r.total_bids || 0), 0),
      auctions_won_count: rows.reduce((s, r) => s + (r.auctions_won_count || 0), 0),
      last_bid_at: rows.reduce((latest, r) => (!latest || (r.last_bid_at && r.last_bid_at > latest)) ? r.last_bid_at : latest, null as string | null),
    };
  }, [filteredKpis]);

  // Sub-label for KPI #1 in "all" tab
  const auctionCountSub = useMemo(() => {
    if (brandTab !== "all") return null;
    const g = brandKpis.find(k => k.brand === "Genazym");
    const z = brandKpis.find(k => k.brand === "Zaidy");
    return `${g?.auctions_involved_count || 0}g + ${z?.auctions_involved_count || 0}z`;
  }, [brandTab, brandKpis]);

  // Filtered auction activity
  const filteredActivity = useMemo(() => {
    if (brandTab === "all") return auctionActivity;
    return auctionActivity.filter(a => a.brand === brandTab);
  }, [auctionActivity, brandTab]);

  // Chart data - last 6 auctions (only in "all" tab)
  const chartData = useMemo(() => {
    const last6 = [...auctionActivity].reverse().slice(-6);
    return last6.map(a => ({
      name: (a.auction_name || "").replace(/^(Genazym|Zaidy)\s*/i, "").slice(0, 12),
      bids: a.total_bids || 0,
      wins: a.total_wins || 0,
    }));
  }, [auctionActivity]);

  // Filter books by brand tab
  const filterBooksByBrand = (books: any[]) => {
    if (brandTab === "all") return books;
    // We don't have brand on individual books easily, so show all for now
    return books;
  };

  const filteredBooksWon = filterBooksByBrand(booksWon);
  const filteredBooksLost = filterBooksByBrand(booksLost);
  const filteredBooksActive = filterBooksByBrand(booksActive);

  // Active auction badge
  const activeBadge = useMemo(() => {
    if (!auctionActivity.length) return null;
    const today = new Date();
    const future = auctionActivity.filter(a => a.auction_date && new Date(a.auction_date) > today);
    if (!future.length) return null;
    const closest = future.reduce((min, a) => {
      const diff = Math.ceil((new Date(a.auction_date).getTime() - today.getTime()) / 86400000);
      return diff < min.days ? { days: diff, name: a.auction_name } : min;
    }, { days: 9999, name: "" });
    if (closest.days > 365) return null;
    return closest.days;
  }, [auctionActivity]);

  if (!customerEmail) return null;

  const today = new Date();

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={closeCustomerCard}
      />
      {/* Drawer */}
      <div
        className="fixed top-0 right-0 h-screen z-50 bg-white overflow-y-auto"
        style={{
          width: 560,
          borderLeft: "0.5px solid rgba(0,0,0,0.15)",
          borderRadius: "12px 0 0 12px",
          boxShadow: "-8px 0 30px rgba(0,0,0,0.12)",
        }}
        dir="rtl"
      >
        {/* Close button */}
        <button
          onClick={closeCustomerCard}
          className="absolute left-4 top-4 z-10 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" style={{ color: MUTED }} />
        </button>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-sm" style={{ color: MUTED }}>טוען...</div>
        ) : (
          <div className="p-6 space-y-5">
            {/* ══════ HEADER ══════ */}
            <div className="flex items-start gap-3">
              <div
                className="flex-shrink-0 rounded-full flex items-center justify-center font-bold text-base"
                style={{
                  width: 46, height: 46,
                  background: "#CECBF6", color: PURPLE.text,
                }}
              >
                {getInitials(header?.full_name || customerEmail)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-base" style={{ color: "#1a1a1a" }}>
                    {header?.full_name || customerEmail}
                  </span>
                  {activeBadge !== null && (
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: AMBER.fill, color: AMBER.text }}
                    >
                      פעיל · D-{activeBadge}
                    </span>
                  )}
                </div>
                <div className="text-xs mt-0.5" style={{ color: MUTED }}>
                  {[header?.country, header?.city, header?.purchasing_power].filter(Boolean).join(" · ")}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {header?.genazym_id && (
                    <button
                      onClick={() => setBrandTab("Genazym")}
                      className="px-2 py-0.5 rounded-full text-xs font-medium border cursor-pointer transition-opacity hover:opacity-80"
                      style={{ background: PURPLE.fill, borderColor: PURPLE.border, color: PURPLE.text }}
                    >
                      Genazym #{header.genazym_id}
                    </button>
                  )}
                  {header?.zaidy_id && (
                    <button
                      onClick={() => setBrandTab("Zaidy")}
                      className="px-2 py-0.5 rounded-full text-xs font-medium border cursor-pointer transition-opacity hover:opacity-80"
                      style={{ background: GREEN.fill, borderColor: GREEN.border, color: GREEN.text }}
                    >
                      Zaidy #{header.zaidy_id}
                    </button>
                  )}
                  {totalWinValue > 10000 && (
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{ background: AMBER.fill, color: AMBER.text }}
                    >
                      VIP · {fmt$(totalWinValue)}
                    </span>
                  )}
                </div>

                {/* Contact chips */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {header?.email && (
                    <span className="px-2 py-0.5 rounded-full text-xs border" style={{ borderColor: "rgba(0,0,0,0.1)", color: MUTED }}>
                      {header.email}
                    </span>
                  )}
                  {header?.phone && (
                    <span className="px-2 py-0.5 rounded-full text-xs border" style={{ borderColor: "rgba(0,0,0,0.1)", color: MUTED }}>
                      {header.phone}
                    </span>
                  )}
                  {header?.receive_catalog && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: GREEN.fill, color: GREEN.text }}>
                      מקבל קטלוג
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ══════ BRAND TABS ══════ */}
            <div className="flex border-b" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
              {(["all", "Genazym", "Zaidy"] as BrandTab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => setBrandTab(tab)}
                  className="px-4 py-2 text-xs font-medium transition-colors"
                  style={{
                    borderBottom: brandTab === tab ? `2px solid ${PURPLE.main}` : "2px solid transparent",
                    color: brandTab === tab ? PURPLE.text : MUTED,
                    background: brandTab === tab ? "white" : "transparent",
                  }}
                >
                  {tab === "all" ? "שני מותגים" : tab}
                </button>
              ))}
            </div>

            {/* ══════ KPI GRID ══════ */}
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  label: "מכירות השתתף",
                  value: aggregatedKpi.auctions_involved_count,
                  sub: auctionCountSub || undefined,
                },
                {
                  label: 'סה"כ זכיות',
                  value: aggregatedKpi.total_wins,
                  sub: fmt$(aggregatedKpi.total_win_value),
                  valueColor: aggregatedKpi.total_wins > 0 ? GREEN.text : undefined,
                },
                {
                  label: "ימים מביד אחרון",
                  value: aggregatedKpi.days_since_last_bid === 9999 ? "—" : aggregatedKpi.days_since_last_bid,
                  valueColor: (aggregatedKpi.days_since_last_bid ?? 0) >= 90 ? RED.text
                    : (aggregatedKpi.days_since_last_bid ?? 0) >= 30 ? AMBER.text : undefined,
                },
                {
                  label: "ביד גבוה ביותר",
                  value: fmt$(aggregatedKpi.max_bid_ever),
                },
                {
                  label: "בידים מוקדמים",
                  value: aggregatedKpi.total_bids.toLocaleString(),
                  sub: 'סה"כ',
                },
                {
                  label: "זכה / השתתף",
                  value: `${aggregatedKpi.auctions_won_count}/${aggregatedKpi.auctions_involved_count}`,
                  sub: "מכירות",
                },
              ].map((kpi, i) => (
                <div
                  key={i}
                  className="rounded-lg p-3 text-center"
                  style={{ background: GRAY_BG }}
                >
                  <div
                    className="text-lg font-bold"
                    style={{ color: kpi.valueColor || "#1a1a1a" }}
                  >
                    {kpi.value}
                  </div>
                  <div className="text-[10px] mt-0.5" style={{ color: MUTED }}>{kpi.label}</div>
                  {kpi.sub && <div className="text-[10px] mt-0.5" style={{ color: MUTED }}>{kpi.sub}</div>}
                </div>
              ))}
            </div>

            {/* ══════ ACTIVITY CHART (all tab only) ══════ */}
            {brandTab === "all" && chartData.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-medium" style={{ color: "#1a1a1a" }}>פעילות ב-6 מכירות אחרונות</span>
                  <div className="flex items-center gap-3 mr-auto">
                    <span className="flex items-center gap-1 text-[10px]" style={{ color: MUTED }}>
                      <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#D4D3CC" }} />בידים
                    </span>
                    <span className="flex items-center gap-1 text-[10px]" style={{ color: MUTED }}>
                      <span className="inline-block w-2 h-2 rounded-full" style={{ background: PURPLE.main }} />זכיות
                    </span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={120}>
                  <BarChart data={chartData} barGap={2}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: MUTED }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: MUTED }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip contentStyle={{ fontSize: 11 }} />
                    <Bar dataKey="bids" fill="#D4D3CC" radius={[2, 2, 0, 0]} name="בידים" />
                    <Bar dataKey="wins" fill={PURPLE.main} radius={[2, 2, 0, 0]} name="זכיות" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* ══════ AUCTION TABLE ══════ */}
            <div>
              <div className="text-xs font-medium mb-2" style={{ color: "#1a1a1a" }}>היסטוריית מכירות</div>
              <div className="rounded-lg overflow-hidden border" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: GRAY_BG }}>
                      <th className="text-right py-2 px-2 font-medium" style={{ color: MUTED }}>מכירה</th>
                      {brandTab === "all" && <th className="text-center py-2 px-1 font-medium" style={{ color: MUTED }}>מותג</th>}
                      <th className="text-center py-2 px-1 font-medium" style={{ color: MUTED }}>בידים</th>
                      <th className="text-center py-2 px-1 font-medium" style={{ color: MUTED }}>לוטים</th>
                      <th className="text-center py-2 px-1 font-medium" style={{ color: MUTED }}>תוצאה</th>
                      <th className="text-center py-2 px-1 font-medium" style={{ color: MUTED }}>D-X</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivity.slice(0, 20).map((a, i) => {
                      const isFuture = a.auction_date && new Date(a.auction_date) > today;
                      const daysUntil = isFuture ? Math.ceil((new Date(a.auction_date).getTime() - today.getTime()) / 86400000) : null;
                      return (
                        <tr key={i} className="border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                          <td className="py-1.5 px-2 font-medium" style={{ color: "#1a1a1a", maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {(a.auction_name || "").replace(/^(Genazym|Zaidy)\s*/i, "").slice(0, 20)}
                          </td>
                          {brandTab === "all" && (
                            <td className="text-center py-1.5 px-1">
                              <span
                                className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                                style={a.brand === "Genazym"
                                  ? { background: PURPLE.fill, color: PURPLE.text }
                                  : { background: GREEN.fill, color: GREEN.text }}
                              >
                                {a.brand === "Genazym" ? "G" : "Z"}
                              </span>
                            </td>
                          )}
                          <td className="text-center py-1.5 px-1">{a.total_bids || 0}</td>
                          <td className="text-center py-1.5 px-1">{a.lots_involved || 0}</td>
                          <td className="text-center py-1.5 px-1">
                            {a.was_winner ? (
                              <span className="font-bold" style={{ color: GREEN.text }}>
                                זכה {fmt$(a.total_win_value)}
                              </span>
                            ) : (
                              <span style={{ color: MUTED }}>לא זכה</span>
                            )}
                          </td>
                          <td className="text-center py-1.5 px-1">
                            {daysUntil !== null ? (
                              <span className="font-bold" style={{ color: AMBER.text }}>D-{daysUntil}</span>
                            ) : ""}
                          </td>
                        </tr>
                      );
                    })}
                    {filteredActivity.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-4" style={{ color: MUTED }}>אין נתונים</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ══════ BOOKS SECTION ══════ */}
            <div>
              <div className="text-xs font-medium mb-2" style={{ color: "#1a1a1a" }}>ספרים</div>
              {/* Book sub-tabs */}
              <div className="flex gap-1 mb-3 p-0.5 rounded-lg" style={{ background: GRAY_BG }}>
                <button
                  onClick={() => setBookTab("won")}
                  className="flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors"
                  style={bookTab === "won"
                    ? { background: GREEN.fill, color: GREEN.text }
                    : { color: MUTED }}
                >
                  זכה ({filteredBooksWon.length})
                </button>
                <button
                  onClick={() => setBookTab("lost")}
                  className="flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors"
                  style={bookTab === "lost"
                    ? { background: RED.fill, color: RED.text }
                    : { color: MUTED }}
                >
                  ניסה ולא זכה ({filteredBooksLost.length})
                </button>
                {filteredBooksActive.length > 0 && (
                  <button
                    onClick={() => setBookTab("active")}
                    className="flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors"
                    style={bookTab === "active"
                      ? { background: AMBER.fill, color: AMBER.text }
                      : { color: MUTED }}
                  >
                    פעיל עכשיו ({filteredBooksActive.length})
                  </button>
                )}
              </div>

              {/* Book rows */}
              <div className="space-y-1.5">
                {(bookTab === "won" ? filteredBooksWon : bookTab === "lost" ? filteredBooksLost : filteredBooksActive)
                  .slice(0, 30)
                  .map((book, i) => {
                    const isWon = bookTab === "won";
                    const isActive = bookTab === "active";
                    const color = isWon ? GREEN : isActive ? AMBER : RED;
                    const label = isWon ? "מחיר זכייה" : isActive ? "ביד נוכחי" : "ביד אחרון";
                    const amount = isWon ? book.sold_price : book.max_bid;

                    return (
                      <div
                        key={`${book.book_id_bidspirit}-${book.auction_name}-${i}`}
                        className="flex items-center justify-between rounded-lg p-2.5"
                        style={{
                          background: GRAY_BG,
                          border: `0.5px solid ${color.border}`,
                        }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium truncate" style={{ color: "#1a1a1a" }}>
                            {book.book_name || book.book_id_bidspirit}
                          </div>
                          <div className="text-[10px] mt-0.5" style={{ color: MUTED }}>
                            {book.auction_name}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 mr-2">
                          <span
                            className="px-1.5 py-0.5 rounded-full text-[10px]"
                            style={{ background: color.fill, color: color.text }}
                          >
                            {label}
                          </span>
                          <span className="text-xs font-bold" style={{ color: color.text }}>
                            {fmt$(amount)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                {(bookTab === "won" ? filteredBooksWon : bookTab === "lost" ? filteredBooksLost : filteredBooksActive).length === 0 && (
                  <div className="text-center py-4 text-xs" style={{ color: MUTED }}>אין נתונים</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
