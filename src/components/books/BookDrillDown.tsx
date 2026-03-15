import { useState, useEffect } from "react";
import { X, BookOpen, Users, Tag, MapPin, Calendar, DollarSign, Hash, Award } from "lucide-react";
import { type BookRecord } from "@/data/booksData";
import { supabase } from "@/lib/supabaseClient";

interface BookDrillDownProps {
  book: BookRecord | null;
  open: boolean;
  onClose: () => void;
}

interface BidderRow {
  customerName: string;
  bidType: string;
  bidsOnBook: number;
  maxBid: number;
  lastActivityDate: string;
  won: boolean;
}

const bidderSegments = [
  { key: "all", label: "כולם" },
];

export default function BookDrillDown({ book, open, onClose }: BookDrillDownProps) {
  const [activeTab, setActiveTab] = useState<"details" | "bidders">("details");
  const [bidders, setBidders] = useState<BidderRow[]>([]);
  const [biddersLoading, setBiddersLoading] = useState(false);
  const [biddersError, setBiddersError] = useState<string | null>(null);

  const bookId = book?.bookIdBidspirit ?? book?.id;

  useEffect(() => {
    if (!open || !bookId) return;
    let cancelled = false;

    async function fetchBidders() {
      setBiddersLoading(true);
      setBiddersError(null);

      // Fetch bids from events table
      const { data: eventsData, error: eventsErr } = await supabase
        .from("events")
        .select("*")
        .eq("book_id_bidspirit", bookId);

      // Fetch winner from winners table
      const { data: winnersData, error: winnersErr } = await supabase
        .from("winners")
        .select("*")
        .eq("book_id_bidspirit", bookId);

      if (cancelled) return;

      if (eventsErr) {
        setBiddersError(eventsErr.message);
        setBidders([]);
        setBiddersLoading(false);
        return;
      }

      const winnerIds = new Set((winnersData ?? []).map((w: any) => w.customer_id ?? w.bidder_id));

      setBidders(
        (eventsData ?? []).map((row: any) => ({
          customerName: row.customer_name ?? row.bidder_name ?? row.name ?? "—",
          bidType: row.bid_type ?? row.type ?? "—",
          bidsOnBook: row.bids_count ?? 1,
          maxBid: row.max_bid ?? row.amount ?? row.bid_amount ?? 0,
          lastActivityDate: row.created_at ?? row.event_date ?? "",
          won: winnerIds.has(row.customer_id ?? row.bidder_id),
        }))
      );
      setBiddersLoading(false);
    }

    fetchBidders();
    return () => { cancelled = true; };
  }, [open, bookId]);

  if (!open || !book) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-foreground/30 backdrop-blur-sm" onClick={onClose} />

      {/* Bottom Sheet */}
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
        <div className="flex items-center justify-between px-8 py-5 border-b border-border flex-shrink-0" style={{ background: "hsl(var(--primary))" }}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "hsl(var(--accent) / 0.2)" }}>
              <BookOpen className="w-5 h-5" style={{ color: "hsl(var(--accent))" }} />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg" style={{ color: "hsl(var(--primary-foreground))" }}>{book.title}</h2>
              <div className="flex items-center gap-3 text-xs mt-0.5" style={{ color: "hsl(var(--primary-foreground) / 0.7)" }}>
                <span>{book.brand} · {book.saleName}</span>
                <span>לוט #{book.lotNumber}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg transition-colors" style={{ color: "hsl(var(--primary-foreground) / 0.7)" }}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Internal Tabs */}
        <div className="flex gap-1 px-8 pt-4 pb-0 flex-shrink-0">
          {([
            { key: "details" as const, label: "פרטי הספר", icon: BookOpen },
            { key: "bidders" as const, label: "בידרים וזוכים", icon: Users },
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
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
              {/* KPI Summary */}
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

              {/* Status */}
              <div className="flex items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full`}
                  style={book.sold
                    ? { background: "hsl(var(--success))", color: "white" }
                    : { background: "hsl(var(--warning) / 0.15)", color: "hsl(var(--warning))" }
                  }>
                  {book.sold ? "נמכר" : "לא נמכר"}
                </span>
                {book.winnerName && (
                  <span className="text-sm">
                    זוכה: <strong style={{ color: "hsl(var(--accent))" }}>{book.winnerName}</strong>
                  </span>
                )}
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <DetailRow icon={BookOpen} label="שם הספר / לוט" value={book.title} />
                <DetailRow icon={Hash} label="מספר לוט" value={`#${book.lotNumber}`} />
                <DetailRow icon={Award} label="מותג" value={book.brand} />
                <DetailRow icon={Hash} label="מכירה" value={book.saleName} />
                <DetailRow icon={Users} label="מחבר" value={book.author} />
                <DetailRow icon={Calendar} label="שנת הוצאה" value={book.year || "—"} />
                <DetailRow icon={MapPin} label="ארץ מוצא" value={book.origin} />
                <DetailRow icon={DollarSign} label="מחיר פתיחה" value={`$${book.openingPrice.toLocaleString()}`} />
              </div>

              {/* Descriptions */}
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

              {/* Tags */}
              <div className="space-y-3">
                <TagSection label="תגיות" items={book.tags} />
                <TagSection label="קהילות" items={book.communities} />
                <TagSection label="ייחודיות" items={book.uniqueness} />
              </div>
            </div>
          )}

          {activeTab === "bidders" && (
            <div className="space-y-5">
              {biddersLoading && (
                <div className="text-center py-12 text-muted-foreground">טוען נתוני בידרים...</div>
              )}
              {biddersError && (
                <div className="text-center py-12 text-destructive">
                  <p className="font-semibold mb-1">שגיאה בטעינת בידרים</p>
                  <p className="text-sm">{biddersError}</p>
                </div>
              )}
              {!biddersLoading && !biddersError && (
                <>
                  {/* Summary KPIs */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="kpi-card text-center">
                      <div className="kpi-value text-xl">{bidders.length}</div>
                      <div className="kpi-label">מעורבים</div>
                    </div>
                    <div className="kpi-card text-center">
                      <div className="kpi-value text-xl">{bidders.filter(b => b.won).length}</div>
                      <div className="kpi-label">זוכים</div>
                    </div>
                    <div className="kpi-card text-center">
                      <div className="kpi-value text-xl">{bidders.reduce((sum, b) => sum + b.bidsOnBook, 0)}</div>
                      <div className="kpi-label">סה״כ בידים</div>
                    </div>
                  </div>

                  {/* Bidders Table */}
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
                        {bidders.length === 0 ? (
                          <tr><td colSpan={6} className="text-center text-muted-foreground py-8">אין בידרים לספר זה</td></tr>
                        ) : bidders.map((bidder, i) => (
                          <tr key={i} className="cursor-pointer hover:bg-secondary/50">
                            <td className="font-semibold">{bidder.customerName}</td>
                            <td>
                              <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full"
                                style={{ background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }}>
                                {bidder.bidType}
                              </span>
                            </td>
                            <td>{bidder.bidsOnBook}</td>
                            <td className="font-semibold">{bidder.maxBid ? `$${bidder.maxBid.toLocaleString()}` : "—"}</td>
                            <td className="text-muted-foreground text-xs">{bidder.lastActivityDate || "—"}</td>
                            <td>
                              {bidder.won ? (
                                <Award className="w-4 h-4" style={{ color: "hsl(var(--accent))" }} />
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
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

function TagSection({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1.5">{label}</div>
      <div className="flex gap-1.5 flex-wrap">
        {items.map(tag => (
          <span key={tag} className="badge-ai text-xs"><Tag className="w-2.5 h-2.5" />{tag}</span>
        ))}
      </div>
    </div>
  );
}
