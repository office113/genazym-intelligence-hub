import { useState, useEffect } from "react";
import { X, BookOpen, Users, Tag, MapPin, Calendar, DollarSign, Hash, Award } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { type BookRecord } from "@/hooks/useBookSearch";

interface BookDrillDownProps {
  book: BookRecord | null;
  open: boolean;
  onClose: () => void;
}

interface Bidder {
  customerName: string;
  customerEmail: string;
  bidType: string;
  bidsOnBook: number;
  maxBid: number;
  lastActivityDate: string;
  won: boolean;
}

const bidderSegments = [
  { key: "all", label: "כולם" },
  { key: "early_bid", label: "מוקדם" },
  { key: "live_bid", label: "חי" },
  { key: "winner", label: "זוכה" },
];

const bidTypeLabels: Record<string, string> = {
  early_bid: "מוקדם",
  live_bid: "חי",
  winner: "זוכה",
};

export default function BookDrillDown({ book, open, onClose }: BookDrillDownProps) {
  const [activeTab, setActiveTab] = useState<"details" | "bidders">("details");
  const [bidderFilter, setBidderFilter] = useState("all");
  const [bidders, setBidders] = useState<Bidder[]>([]);
  const [loadingBidders, setLoadingBidders] = useState(false);
  const [errorBidders, setErrorBidders] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !book?.bookIdBidspirit) return;

    let cancelled = false;

    async function fetchBidders() {
      setLoadingBidders(true);
      setErrorBidders(null);

      // שליפת בידים מטבלת events
      const { data: eventsData, error: eventsErr } = await supabase
        .from("events")
        .select("customer_email, bid_type, bid_price, bid_time")
        .eq("book_id_bidspirit", book!.bookIdBidspirit);

      if (cancelled) return;

      if (eventsErr) {
        setErrorBidders(eventsErr.message);
        setLoadingBidders(false);
        return;
      }

      // שליפת זוכה מטבלת winners
      const { data: winnersData } = await supabase
        .from("winners")
        .select("customer_email, winner_name, sold_price, win_time")
        .eq("book_id_bidspirit", book!.bookIdBidspirit);

      if (cancelled) return;

      // שליפת שמות לקוחות
      const emails = [...new Set((eventsData ?? []).map((e: any) => e.customer_email).filter(Boolean))];
      let customerNames: Record<string, string> = {};

      if (emails.length > 0) {
        const { data: customersData } = await supabase.from("customers").select("email, full_name").in("email", emails);

        (customersData ?? []).forEach((c: any) => {
          customerNames[c.email] = c.full_name;
        });
      }

      // בניית רשימת בידרים מקובצת לפי email
      const grouped: Record<string, Bidder> = {};

      (eventsData ?? []).forEach((e: any) => {
        const email = e.customer_email ?? "";
        if (!email || email === "floor_crowd@aa.co") return;

        if (!grouped[email]) {
          grouped[email] = {
            customerName: customerNames[email] ?? email,
            customerEmail: email,
            bidType: e.bid_type,
            bidsOnBook: 0,
            maxBid: 0,
            lastActivityDate: "",
            won: false,
          };
        }

        grouped[email].bidsOnBook++;
        if (Number(e.bid_price) > grouped[email].maxBid) {
          grouped[email].maxBid = Number(e.bid_price);
        }
        if (!grouped[email].lastActivityDate || e.bid_time > grouped[email].lastActivityDate) {
          grouped[email].lastActivityDate = e.bid_time;
          grouped[email].bidType = e.bid_type;
        }
      });

      // סימון זוכים
      const winnerEmails = new Set((winnersData ?? []).map((w: any) => w.customer_email));
      Object.values(grouped).forEach((b) => {
        if (winnerEmails.has(b.customerEmail)) {
          b.won = true;
          b.bidType = "winner";
        }
      });

      // הוספת זוכים שלא שמו ביד כלל
      (winnersData ?? []).forEach((w: any) => {
        const email = w.customer_email ?? "";
        if (!email || email === "floor_crowd@aa.co") return;
        if (!grouped[email]) {
          grouped[email] = {
            customerName: customerNames[email] ?? w.winner_name ?? email,
            customerEmail: email,
            bidType: "winner",
            bidsOnBook: 0,
            maxBid: Number(w.sold_price) || 0,
            lastActivityDate: w.win_time ?? "",
            won: true,
          };
        }
      });

      // מיון כרונולוגי
      const sortedBidders = Object.values(grouped).sort((a, b) => {
        if (!a.lastActivityDate) return 1;
        if (!b.lastActivityDate) return -1;
        return a.lastActivityDate.localeCompare(b.lastActivityDate);
      });

      if (!cancelled) {
        setBidders(sortedBidders);
        setLoadingBidders(false);
      }
    }

    fetchBidders();
    return () => {
      cancelled = true;
    };
  }, [open, book?.bookIdBidspirit]);

  if (!open || !book) return null;

  const filteredBidders =
    bidderFilter === "all"
      ? bidders
      : bidderFilter === "winner"
        ? bidders.filter((b) => b.won)
        : bidders.filter((b) => b.bidType === bidderFilter && !b.won);

  const earlyCount = bidders.filter((b) => b.bidType === "early_bid" && !b.won).length;
  const liveCount = bidders.filter((b) => b.bidType === "live_bid" && !b.won).length;
  const winnerCount = bidders.filter((b) => b.won).length;

  const formatDate = (ts: string) => {
    if (!ts) return "—";
    try {
      return new Date(ts).toLocaleDateString("he-IL");
    } catch {
      return ts;
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />

      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 z-50 rounded-t-2xl border border-border border-b-0 overflow-hidden flex flex-col"
        style={{
          width: "min(90vw, 1200px)",
          height: "85vh",
          background: "hsl(var(--card))",
          boxShadow: "0 -8px 40px rgba(0,0,0,0.15)",
          animation: "slideUp 0.35s ease-out",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-8 py-5 border-b border-border flex-shrink-0"
          style={{ background: "hsl(var(--primary))" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: "hsl(var(--accent) / 0.2)" }}
            >
              <BookOpen className="w-5 h-5" style={{ color: "hsl(var(--accent))" }} />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg" style={{ color: "hsl(var(--primary-foreground))" }}>
                {book.title}
              </h2>
              <div
                className="flex items-center gap-3 text-xs mt-0.5"
                style={{ color: "hsl(var(--primary-foreground) / 0.7)" }}
              >
                <span>
                  {book.brand} · {book.saleName}
                </span>
                <span>לוט #{book.lotNumber}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-colors"
            style={{ color: "hsl(var(--primary-foreground) / 0.7)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-8 pt-4 pb-0 flex-shrink-0">
          {[
            { key: "details" as const, label: "פרטי הספר", icon: BookOpen },
            { key: "bidders" as const, label: "בידרים וזוכים", icon: Users },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setBidderFilter("all");
              }}
              className={`sub-nav-item flex items-center gap-2 ${activeTab === tab.key ? "sub-nav-item-active" : ""}`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {activeTab === "details" && (
            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-4">
                <div className="kpi-card text-center">
                  <div className="kpi-value text-xl">${book.openingPrice.toLocaleString()}</div>
                  <div className="kpi-label">מחיר פתיחה</div>
                </div>
                <div className="kpi-card text-center">
                  <div className="kpi-value text-xl" style={book.finalPrice ? { color: "hsl(var(--success))" } : {}}>
                    {book.finalPrice ? `$${book.finalPrice.toLocaleString()}` : "—"}
                  </div>
                  <div className="kpi-label">מחיר סופי</div>
                </div>
                <div className="kpi-card text-center">
                  <div className="kpi-value text-xl">{book.involvedCustomers}</div>
                  <div className="kpi-label">מעורבים</div>
                </div>
                <div className="kpi-card text-center">
                  <div className="kpi-value text-xl">{book.bidsCount}</div>
                  <div className="kpi-label">בידים</div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full"
                  style={
                    book.sold
                      ? { background: "hsl(var(--success))", color: "white" }
                      : { background: "hsl(var(--warning) / 0.15)", color: "hsl(var(--warning))" }
                  }
                >
                  {book.sold ? "נמכר" : "לא נמכר"}
                </span>
                {book.winnerName && (
                  <span className="text-sm">
                    זוכה: <strong style={{ color: "hsl(var(--accent))" }}>{book.winnerName}</strong>
                  </span>
                )}
                {book.upliftPct != null && (
                  <span className="text-sm text-muted-foreground">
                    עלייה: <strong>{book.upliftPct.toFixed(0)}%</strong>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <DetailRow icon={Hash} label="מספר לוט" value={`#${book.lotNumber}`} />
                <DetailRow icon={Award} label="מותג" value={book.brand} />
                <DetailRow icon={Hash} label="מכירה" value={book.saleName} />
                <DetailRow icon={Users} label="מחבר" value={book.author || "—"} />
                <DetailRow icon={Calendar} label="שנה" value={book.year || "—"} />
                <DetailRow icon={MapPin} label="ארץ מוצא" value={book.origin || "—"} />
                <DetailRow icon={DollarSign} label="מחיר פתיחה" value={`$${book.openingPrice.toLocaleString()}`} />
                {book.maxBid && (
                  <DetailRow icon={DollarSign} label="ביד מקסימלי" value={`$${book.maxBid.toLocaleString()}`} />
                )}
              </div>

              <div className="space-y-4">
                {book.descriptionHe && (
                  <div className="chart-card">
                    <div className="chart-title">תיאור בעברית</div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{book.descriptionHe}</p>
                  </div>
                )}
                {book.descriptionEn && (
                  <div className="chart-card" dir="ltr">
                    <div className="chart-title text-left">English Description</div>
                    <p className="text-sm leading-relaxed text-muted-foreground text-left">{book.descriptionEn}</p>
                  </div>
                )}
              </div>

              {book.tags.length > 0 && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1.5">תגיות</div>
                  <div className="flex gap-1.5 flex-wrap">
                    {book.tags.map((tag) => (
                      <span key={tag} className="badge-ai text-xs">
                        <Tag className="w-2.5 h-2.5" />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {book.siteLink && (
                <a
                  href={book.siteLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  צפה בפריט באתר ←
                </a>
              )}
            </div>
          )}

          {activeTab === "bidders" && (
            <div className="space-y-5">
              {loadingBidders ? (
                <div className="text-center py-12 text-muted-foreground">טוען נתונים...</div>
              ) : errorBidders ? (
                <div className="text-center py-12 text-destructive">{errorBidders}</div>
              ) : (
                <>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="kpi-card text-center">
                      <div className="kpi-value text-xl">{bidders.length}</div>
                      <div className="kpi-label">מעורבים</div>
                    </div>
                    <div className="kpi-card text-center">
                      <div className="kpi-value text-xl">{earlyCount}</div>
                      <div className="kpi-label">בידי מוקדם</div>
                    </div>
                    <div className="kpi-card text-center">
                      <div className="kpi-value text-xl">{liveCount}</div>
                      <div className="kpi-label">בידי חי</div>
                    </div>
                    <div className="kpi-card text-center">
                      <div className="kpi-value text-xl" style={{ color: "hsl(var(--accent))" }}>
                        {winnerCount}
                      </div>
                      <div className="kpi-label">זוכה</div>
                    </div>
                  </div>

                  <div className="sub-nav inline-flex">
                    {bidderSegments.map((seg) => (
                      <button
                        key={seg.key}
                        onClick={() => setBidderFilter(seg.key)}
                        className={`sub-nav-item ${bidderFilter === seg.key ? "sub-nav-item-active" : ""}`}
                      >
                        {seg.label}
                      </button>
                    ))}
                  </div>

                  <div className="chart-card p-0 overflow-hidden">
                    <table className="data-table">
                      <thead>
                        <tr style={{ background: "hsl(var(--secondary) / 0.5)" }}>
                          <th>שם לקוח</th>
                          <th>סוג ביד</th>
                          <th>מס׳ בידים</th>
                          <th>ביד מקסימלי</th>
                          <th>פעילות אחרונה</th>
                          <th>זכה</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBidders.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center text-muted-foreground py-8">
                              אין תוצאות
                            </td>
                          </tr>
                        ) : (
                          filteredBidders.map((bidder, i) => (
                            <tr key={`${bidder.customerEmail}-${i}`} className="cursor-pointer hover:bg-secondary/50">
                              <td className="font-semibold">{bidder.customerName}</td>
                              <td>
                                <span
                                  className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full"
                                  style={
                                    bidder.won
                                      ? { background: "hsl(var(--accent))", color: "hsl(var(--primary))" }
                                      : bidder.bidType === "live_bid"
                                        ? { background: "hsl(var(--success) / 0.12)", color: "hsl(var(--success))" }
                                        : { background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }
                                  }
                                >
                                  {bidder.won ? "זוכה" : (bidTypeLabels[bidder.bidType] ?? bidder.bidType)}
                                </span>
                              </td>
                              <td>{bidder.bidsOnBook}</td>
                              <td className="font-semibold">${bidder.maxBid.toLocaleString()}</td>
                              <td className="text-muted-foreground text-xs">{formatDate(bidder.lastActivityDate)}</td>
                              <td>
                                {bidder.won ? (
                                  <Award className="w-4 h-4" style={{ color: "hsl(var(--accent))" }} />
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translate(-50%, 100%); }
          to { transform: translate(-50%, 0); }
        }
      `}</style>
    </>
  );
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0 text-muted-foreground" />
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}
