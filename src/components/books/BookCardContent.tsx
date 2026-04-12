import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";
import { ExternalLink, Crown } from "lucide-react";
import CustomerLink from "@/components/customers/CustomerLink";

const ORANGE = { fill: "#FEF3C7", border: "#F59E0B", text: "#92400E", main: "#F59E0B" };
const GREEN = { fill: "#E1F5EE", border: "#9FE1CB", text: "#085041" };
const PURPLE = { fill: "#EEEDFE", border: "#AFA9EC", text: "#3C3489" };
const AMBER = { fill: "#FAEEDA", border: "#FAC775", text: "#633806" };
const GRAY_BG = "#F1EFE8";
const MUTED = "#888780";

const winnerTypeHe: Record<string, string> = {
  "Internet user": "מקוון",
  "Floor crowd": "קהל רצפה",
  "Pre sale internet bid": "מוקדם",
  "Phone": "טלפון",
};

interface Props {
  bookId: string;
  auctionName: string;
}

export default function BookCardContent({ bookId, auctionName }: Props) {
  const [view, setView] = useState<"card" | "profile">("card");
  const [summary, setSummary] = useState<any>(null);
  const [bookDetails, setBookDetails] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [winner, setWinner] = useState<any>(null);
  const [winnerLotsInvolved, setWinnerLotsInvolved] = useState<number | null>(null);
  const [winnerTotalWinValue, setWinnerTotalWinValue] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [bidTab, setBidTab] = useState<"all" | "early" | "live">("all");

  useEffect(() => {
    if (!bookId || !auctionName) return;
    setView("card");
    setBidTab("all");
    fetchAll();
  }, [bookId, auctionName]);

  async function fetchAll() {
    setLoading(true);
    setSummary(null);
    setBookDetails(null);
    setBids([]);
    setWinner(null);
    setWinnerLotsInvolved(null);
    setWinnerTotalWinValue(null);

    const winnerSql = [
      "SELECT w.customer_email, w.sold_price, w.win_time, w.winner_type, w.winner_name",
      "FROM winners w",
      `WHERE w.book_id_bidspirit = '${bookId}'`,
      `  AND w.auction_name = '${auctionName}'`,
      "  AND w.customer_email != 'floor_crowd@aa.co'",
    ].join("\n");

    try {
      const summaryPromise = supabase
        .from("fact_book_auction_summary")
        .select("*")
        .eq("book_id_bidspirit", bookId)
        .eq("auction_name", auctionName)
        .maybeSingle();

      const detailsPromise = supabase
        .from("books")
        .select("*")
        .eq("book_id_bidspirit", bookId)
        .eq("auction_name", auctionName)
        .maybeSingle();

      const eventsPromise = supabase
        .from("events")
        .select("customer_email, bid_price, bid_time, bid_type")
        .eq("book_id_bidspirit", bookId)
        .eq("auction_name", auctionName)
        .neq("customer_email", "floor_crowd@aa.co")
        .order("bid_price", { ascending: false });

      const winnerRequest = supabase
        .from("winners")
        .select("customer_email, sold_price, win_time, winner_type, winner_name")
        .eq("book_id_bidspirit", bookId)
        .eq("auction_name", auctionName)
        .neq("customer_email", "floor_crowd@aa.co");

      const winnerRequestUrl = (winnerRequest as any).url?.toString?.() ?? "";
      const winnerPromise = winnerRequest.then((response) => {
        console.log("[BookDrawer] winners query raw response", {
          bookId,
          auctionName,
          sql: winnerSql,
          url: winnerRequestUrl,
          response,
        });
        return response;
      });

      const [
        { data: sum, error: summaryError },
        { data: details, error: detailsError },
        { data: eventsData, error: eventsError },
        { data: winnerRows, error: winnerError },
      ] = await Promise.all([summaryPromise, detailsPromise, eventsPromise, winnerPromise]);

      if (summaryError) console.error("[BookDrawer] summary query error", summaryError);
      if (detailsError) console.error("[BookDrawer] details query error", detailsError);
      if (eventsError) console.error("[BookDrawer] events query error", eventsError);
      if (winnerError) console.error("[BookDrawer] winners query error", winnerError);

      setSummary(sum);
      setBookDetails(details);

      let winnerData = Array.isArray(winnerRows) ? winnerRows[0] ?? null : winnerRows ?? null;
      if (Array.isArray(winnerRows) && winnerRows.length > 1) {
        console.warn("[BookDrawer] multiple winner rows returned", winnerRows);
      }

      // Fallback: if winners table returned nothing, use fact_book_auction_summary
      if (!winnerData && sum?.winner_email && sum?.sold_flag) {
        console.log("[BookDrawer] winners table empty, falling back to summary data", {
          winner_email: sum.winner_email,
          winner_name: sum.winner_name,
          sold_price: sum.sold_price,
          winner_type: sum.winner_type,
        });
        winnerData = {
          customer_email: sum.winner_email,
          sold_price: sum.sold_price,
          win_time: sum.auction_date,
          winner_type: sum.winner_type,
          winner_name: sum.winner_name,
        };
      }

      const allEmails = [
        ...new Set(
          [
            ...(eventsData || []).map((e: any) => e.customer_email),
            ...(winnerData?.customer_email ? [winnerData.customer_email] : []),
          ].filter(Boolean),
        ),
      ];

      const customerMap: Record<string, any> = {};
      if (allEmails.length > 0) {
        const { data: customers, error: customersError } = await supabase
          .from("customers")
          .select("email, full_name, genazym_id, zaidy_id")
          .in("email", allEmails);

        if (customersError) console.error("[BookDrawer] customers query error", customersError);
        (customers || []).forEach((c: any) => {
          customerMap[c.email] = c;
        });
      }

      setBids(
        (eventsData || []).map((e: any) => ({
          ...e,
          full_name: customerMap[e.customer_email]?.full_name || e.customer_email,
          genazym_id: customerMap[e.customer_email]?.genazym_id,
          zaidy_id: customerMap[e.customer_email]?.zaidy_id,
        })),
      );

      if (winnerData !== null) {
        const winnerCustomer = customerMap[winnerData.customer_email];
        setWinner({
          ...winnerData,
          full_name: winnerCustomer?.full_name || winnerData.winner_name || winnerData.customer_email,
          genazym_id: winnerCustomer?.genazym_id,
          zaidy_id: winnerCustomer?.zaidy_id,
        });

        const { data: winnerActivity, error: winnerActivityError } = await supabase
          .from("fact_customer_auction_activity")
          .select("lots_involved, total_win_value")
          .eq("email", winnerData.customer_email)
          .eq("auction_name", auctionName)
          .maybeSingle();

        if (winnerActivityError) {
          console.error("[BookDrawer] winner activity query error", winnerActivityError);
        }
        setWinnerLotsInvolved(winnerActivity?.lots_involved ?? null);
        setWinnerTotalWinValue(winnerActivity?.total_win_value ?? null);
      }
    } catch (err) {
      console.error("BookCardContent fetch error:", err);
    } finally {
      setLoading(false);
    }
  }

  const brand = summary?.brand || "";
  const getCustomerId = (row: any) => {
    if (brand === "Genazym") return row.genazym_id;
    if (brand === "Zaidy") return row.zaidy_id;
    return row.genazym_id || row.zaidy_id;
  };

  const filteredBids = useMemo(() => {
    const winnerEmail = winner?.customer_email;
    let filtered = winnerEmail ? bids.filter((b) => b.customer_email !== winnerEmail) : bids;
    if (bidTab === "early") return filtered.filter((b) => b.bid_type === "early_bid");
    if (bidTab === "live") return filtered.filter((b) => b.bid_type === "live_bid");
    return filtered;
  }, [bids, bidTab, winner]);

  const showWinnerInTab = bidTab === "all" || bidTab === "live";

  const formatDate = (ts: string) => {
    if (!ts) return "—";
    try {
      return new Date(ts).toLocaleDateString("he-IL");
    } catch {
      return ts;
    }
  };

  const fmt$ = (v: number | null | undefined) => v != null ? `$${v.toLocaleString()}` : "—";

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-sm" style={{ color: MUTED }}>טוען...</div>;
  }

  if (!summary) {
    return <div className="flex items-center justify-center h-64 text-sm" style={{ color: MUTED }}>לא נמצאו נתונים</div>;
  }

  const upliftPct = summary.uplift_pct != null ? Number(summary.uplift_pct) : null;
  const headHe = bookDetails?.head_hebrew || summary?.head_hebrew || summary?.book_name || "";
  const headEn = bookDetails?.head_english || summary?.head_english || "";
  const authorHe = bookDetails?.author_hebrew || summary?.author_hebrew || "";
  const authorEn = bookDetails?.author_english || summary?.author_english || "";
  const siteLink = bookDetails?.site_link || summary?.site_link;

  console.log("[BookDrawer] winner state:", winner);

  return (
    <div className="space-y-5" dir="rtl">
      <div>
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-lg leading-snug" style={{ color: "#1a1a1a" }}>{headHe}</h2>
            {headEn && <div className="text-sm mt-0.5" style={{ color: MUTED }} dir="ltr">{headEn}</div>}
            {(authorHe || authorEn) && (
              <div className="text-xs mt-1" style={{ color: MUTED }}>
                {authorHe}{authorEn ? ` / ${authorEn}` : ""}
              </div>
            )}
          </div>
          {siteLink && (
            <a href={siteLink} target="_blank" rel="noopener noreferrer"
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0">
              <ExternalLink className="w-4 h-4" style={{ color: ORANGE.main }} />
            </a>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium border"
            style={{ background: ORANGE.fill, borderColor: ORANGE.border, color: ORANGE.text }}>
            {auctionName}
          </span>
          {brand && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium"
              style={brand === "Genazym"
                ? { background: PURPLE.fill, color: PURPLE.text }
                : { background: GREEN.fill, color: GREEN.text }
              }>
              {brand}
            </span>
          )}
          {summary.auction_date && (
            <span className="px-2 py-0.5 rounded-full text-xs" style={{ background: GRAY_BG, color: MUTED }}>
              {formatDate(summary.auction_date)}
            </span>
          )}
        </div>
      </div>

      <div style={{ display: "flex", border: "0.5px solid rgba(0,0,0,0.12)", borderRadius: 12, overflow: "hidden" }}>
        {(["card", "profile"] as const).map((v) => (
          <button key={v} onClick={() => setView(v)}
            style={{
              flex: 1, padding: "8px 0", fontSize: 12, fontWeight: 500,
              textAlign: "center", border: "none", cursor: "pointer",
              background: view === v ? ORANGE.fill : GRAY_BG,
              color: view === v ? ORANGE.text : MUTED,
            }}>
            {v === "card" ? "כרטיס ספר" : "אפיון ספר"}
          </button>
        ))}
      </div>

      {view === "profile" && (
        <div className="space-y-4">
          {bookDetails?.text_hebrew && (
            <div className="rounded-lg p-4" style={{ background: GRAY_BG }}>
              <div className="text-xs font-bold mb-2" style={{ color: "#1a1a1a" }}>תיאור בעברית</div>
              <p className="text-xs leading-relaxed" style={{ color: MUTED }}>{bookDetails.text_hebrew}</p>
            </div>
          )}
          {bookDetails?.text_english && (
            <div className="rounded-lg p-4" style={{ background: GRAY_BG }} dir="ltr">
              <div className="text-xs font-bold mb-2" style={{ color: "#1a1a1a" }}>English Description</div>
              <p className="text-xs leading-relaxed" style={{ color: MUTED }}>{bookDetails.text_english}</p>
            </div>
          )}
          {bookDetails?.llm_explanation && (
            <div className="rounded-lg p-4" style={{ background: PURPLE.fill, border: `0.5px solid ${PURPLE.border}` }}>
              <div className="text-xs font-bold mb-2" style={{ color: PURPLE.text }}>ניתוח GPT</div>
              <p className="text-xs leading-relaxed" style={{ color: PURPLE.text }}>{bookDetails.llm_explanation}</p>
            </div>
          )}
          <div>
            <div className="text-xs font-bold mb-2" style={{ color: "#1a1a1a" }}>תגיות</div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "קטגוריה", value: bookDetails?.tag_category },
                { label: "קהילה", value: bookDetails?.tag_community },
                { label: "מוצא", value: bookDetails?.tag_origin },
                { label: "תקופה", value: bookDetails?.tag_year },
                { label: "בית דפוס", value: bookDetails?.tag_print_house },
                { label: "ייחודיות", value: bookDetails?.tag_uniqueness },
              ]
                .filter((t) => t.value)
                .map((t) => (
                  <span key={t.label} className="px-2 py-1 rounded-full text-[10px] font-medium"
                    style={{ background: ORANGE.fill, color: ORANGE.text, border: `0.5px solid ${ORANGE.border}` }}>
                    {t.label}: {t.value}
                  </span>
                ))}
            </div>
          </div>
        </div>
      )}

      {view === "card" && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "מעורבים", value: summary.unique_bidders_count || 0 },
              {
                label: "מחיר זכייה",
                value: summary.sold_price != null ? fmt$(summary.sold_price) : "לא נמכר",
                valueColor: summary.sold_price != null ? GREEN.text : MUTED,
              },
              { label: "בידים מוקדמים", value: summary.early_bids_count || 0 },
              { label: "בידים לייב", value: summary.live_bids_count || 0 },
              { label: "תאריך מכירה", value: formatDate(summary.auction_date) },
              { label: "מחיר פתיחה", value: fmt$(summary.opening_price) },
              {
                label: "פרמיה על מחיר הפתיחה",
                value: upliftPct != null ? `${upliftPct.toFixed(0)}%` : "—",
                valueColor: upliftPct != null && upliftPct > 0 ? GREEN.text : MUTED,
              },
            ].map((kpi, i) => (
              <div key={i} className="rounded-lg p-3 text-center" style={{ background: GRAY_BG }}>
                <div className="text-lg font-bold" style={{ color: (kpi as any).valueColor || "#1a1a1a" }}>
                  {kpi.value}
                </div>
                <div className="text-[10px] mt-0.5" style={{ color: MUTED }}>{kpi.label}</div>
              </div>
            ))}
          </div>

          {winner && (
            <div style={{
              margin: "16px 0",
              padding: "14px 16px",
              background: "#fffbeb",
              border: "2px solid #f59e0b",
              borderRadius: "10px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>👑</span>
                <span style={{ fontWeight: 700, fontSize: 13, color: "#92400e" }}>זוכה</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ background: "#fef3c7", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, color: "#78716c", marginBottom: 2 }}>שם הזוכה</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    <CustomerLink email={winner.customer_email}>{winner.full_name}</CustomerLink>
                  </div>
                </div>
                <div style={{ background: "#fef3c7", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, color: "#78716c", marginBottom: 2 }}>מחיר זכייה</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: "#16a34a" }}>{fmt$(winner.sold_price)}</div>
                </div>
                <div style={{ background: "#fef3c7", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, color: "#78716c", marginBottom: 2 }}>לוטים במכירה</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{winnerLotsInvolved ?? "—"}</div>
                </div>
                <div style={{ background: "#fef3c7", borderRadius: 8, padding: "8px 10px" }}>
                  <div style={{ fontSize: 10, color: "#78716c", marginBottom: 2 }}>סך זכיות במכירה</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#1a1a1a" }}>{winnerTotalWinValue != null ? fmt$(winnerTotalWinValue) : "—"}</div>
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="text-xs font-bold mb-2" style={{ color: "#1a1a1a" }}>התחרות על הספר</div>
            <div className="flex gap-0 mb-3" style={{ borderRadius: 8, overflow: "hidden", border: "0.5px solid rgba(0,0,0,0.1)" }}>
              {([
                { key: "all" as const, label: "הכל" },
                { key: "early" as const, label: "מוקדם" },
                { key: "live" as const, label: "לייב" },
              ]).map((tab) => (
                <button key={tab.key} onClick={() => setBidTab(tab.key)}
                  style={{
                    flex: 1, padding: "6px 0", fontSize: 11, fontWeight: 500, border: "none", cursor: "pointer",
                    background: bidTab === tab.key ? ORANGE.fill : GRAY_BG,
                    color: bidTab === tab.key ? ORANGE.text : MUTED,
                  }}>
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="rounded-lg overflow-hidden border" style={{ borderColor: "rgba(0,0,0,0.1)" }}>
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: GRAY_BG }}>
                    <th className="text-right py-2 px-2 font-medium" style={{ color: MUTED }}>שם לקוח</th>
                    <th className="text-center py-2 px-1 font-medium" style={{ color: MUTED }}>מזהה</th>
                    <th className="text-center py-2 px-1 font-medium" style={{ color: MUTED }}>סכום</th>
                    <th className="text-center py-2 px-1 font-medium" style={{ color: MUTED }}>תאריך</th>
                    <th className="text-center py-2 px-1 font-medium" style={{ color: MUTED }}>סוג</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBids.length === 0 && !showWinnerInTab ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4" style={{ color: MUTED }}>אין נתונים</td>
                    </tr>
                  ) : (
                    <>
                      {showWinnerInTab && winner !== null && (
                        <tr style={{ background: "#d1fae5" }}>
                          <td className="py-1.5 px-2 font-medium">
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <span>👑</span>
                              <CustomerLink email={winner.customer_email}>
                                {winner.full_name}
                              </CustomerLink>
                            </span>
                          </td>
                          <td className="text-center py-1.5 px-1" style={{ color: MUTED }}>
                            {getCustomerId(winner) || "—"}
                          </td>
                          <td className="text-center py-1.5 px-1 font-bold" style={{ color: "#065f46" }}>
                            {fmt$(winner.sold_price)}
                          </td>
                          <td className="text-center py-1.5 px-1" style={{ color: MUTED }}>
                            {formatDate(winner.win_time)}
                          </td>
                          <td className="text-center py-1.5 px-1">
                            <span style={{ background: "#16a34a", color: "white", borderRadius: 4, padding: "2px 6px", fontWeight: 700, fontSize: 10 }}>
                              👑 זוכה
                            </span>
                          </td>
                        </tr>
                      )}
                      {filteredBids.map((bid, i) => (
                        <tr key={i} className="border-t" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                          <td className="py-1.5 px-2 font-medium" style={{ color: "#1a1a1a" }}>
                            <CustomerLink email={bid.customer_email}>{bid.full_name}</CustomerLink>
                          </td>
                          <td className="text-center py-1.5 px-1" style={{ color: MUTED }}>
                            {getCustomerId(bid) || "—"}
                          </td>
                          <td className="text-center py-1.5 px-1 font-bold">{fmt$(bid.bid_price)}</td>
                          <td className="text-center py-1.5 px-1" style={{ color: MUTED }}>
                            {formatDate(bid.bid_time)}
                          </td>
                          <td className="text-center py-1.5 px-1">
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium"
                              style={bid.bid_type === "live_bid"
                                ? { background: GREEN.fill, color: GREEN.text }
                                : { background: GRAY_BG, color: MUTED }
                              }>
                              {bid.bid_type === "live_bid" ? "לייב" : "מוקדם"}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {showWinnerInTab && winner !== null && (
                        <tr style={{ background: "#d1fae5" }}>
                          <td className="py-1.5 px-2 font-medium">
                            <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <span>👑</span>
                              <CustomerLink email={winner.customer_email}>
                                {winner.full_name}
                              </CustomerLink>
                            </span>
                          </td>
                          <td className="text-center py-1.5 px-1" style={{ color: MUTED }}>
                            {getCustomerId(winner) || "—"}
                          </td>
                          <td className="text-center py-1.5 px-1 font-bold" style={{ color: "#065f46" }}>
                            {fmt$(winner.sold_price)}
                          </td>
                          <td className="text-center py-1.5 px-1" style={{ color: MUTED }}>
                            {formatDate(winner.win_time)}
                          </td>
                          <td className="text-center py-1.5 px-1">
                            <span style={{ background: "#16a34a", color: "white", borderRadius: 4, padding: "2px 6px", fontWeight: 700, fontSize: 10 }}>
                              👑 זוכה
                            </span>
                          </td>
                        </tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
