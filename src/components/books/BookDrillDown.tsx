import { useState } from "react";
import { X, BookOpen, Users, Tag, MapPin, Calendar, DollarSign, Hash, Award, ChevronLeft } from "lucide-react";
import { type BookRecord, bookBidders, type BookBidder } from "@/data/booksData";

interface BookDrillDownProps {
  book: BookRecord | null;
  open: boolean;
  onClose: () => void;
}

const bidTypeLabels: Record<string, string> = {
  early: "מוקדם",
  live: "חי",
  winner: "זוכה",
};

const bidderSegments = [
  { key: "all", label: "כולם" },
  { key: "early", label: "מוקדם" },
  { key: "live", label: "חי" },
  { key: "winner", label: "זוכה" },
];

export default function BookDrillDown({ book, open, onClose }: BookDrillDownProps) {
  const [activeTab, setActiveTab] = useState<"details" | "bidders">("details");
  const [bidderFilter, setBidderFilter] = useState("all");

  if (!open || !book) return null;

  const bidders = bookBidders.filter(b => b.bookId === book.id);
  const filteredBidders = bidderFilter === "all" ? bidders : bidders.filter(b => b.bidType === bidderFilter);

  const earlyCount = bidders.filter(b => b.bidType === "early").length;
  const liveCount = bidders.filter(b => b.bidType === "live").length;
  const winnerCount = bidders.filter(b => b.bidType === "winner").length;

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
              onClick={() => { setActiveTab(tab.key); setBidderFilter("all"); }}
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
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full ${book.sold ? "text-white" : ""}`}
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
                <DetailRow icon={Calendar} label="שנת הוצאה" value={String(book.year)} />
                <DetailRow icon={MapPin} label="ארץ מוצא" value={book.origin} />
                <DetailRow icon={DollarSign} label="מחיר פתיחה" value={`$${book.openingPrice.toLocaleString()}`} />
              </div>

              {/* Descriptions */}
              <div className="space-y-4">
                <div className="chart-card">
                  <div className="chart-title">תיאור בעברית</div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{book.descriptionHe}</p>
                </div>
                <div className="chart-card" dir="ltr">
                  <div className="chart-title text-left">English Description</div>
                  <p className="text-sm leading-relaxed text-muted-foreground text-left">{book.descriptionEn}</p>
                </div>
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
              {/* Summary KPIs */}
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
                  <div className="kpi-value text-xl" style={{ color: "hsl(var(--accent))" }}>{winnerCount}</div>
                  <div className="kpi-label">זוכה</div>
                </div>
              </div>

              {/* Segment Filter */}
              <div className="sub-nav inline-flex">
                {bidderSegments.map(seg => (
                  <button
                    key={seg.key}
                    onClick={() => setBidderFilter(seg.key)}
                    className={`sub-nav-item ${bidderFilter === seg.key ? "sub-nav-item-active" : ""}`}
                  >
                    {seg.label}
                  </button>
                ))}
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
                      <th>מכירות קודמות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBidders.length === 0 ? (
                      <tr><td colSpan={7} className="text-center text-muted-foreground py-8">אין תוצאות</td></tr>
                    ) : filteredBidders.map((bidder, i) => (
                      <tr key={`${bidder.customerId}-${i}`} className="cursor-pointer hover:bg-secondary/50">
                        <td className="font-semibold">{bidder.customerName}</td>
                        <td>
                          <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            bidder.bidType === "winner" ? "text-white" : ""
                          }`} style={
                            bidder.bidType === "winner"
                              ? { background: "hsl(var(--accent))", color: "hsl(var(--primary))" }
                              : bidder.bidType === "live"
                                ? { background: "hsl(var(--success) / 0.12)", color: "hsl(var(--success))" }
                                : { background: "hsl(var(--secondary))", color: "hsl(var(--muted-foreground))" }
                          }>
                            {bidTypeLabels[bidder.bidType]}
                          </span>
                        </td>
                        <td>{bidder.bidsOnBook}</td>
                        <td className="font-semibold">${bidder.maxBid.toLocaleString()}</td>
                        <td className="text-muted-foreground text-xs">{bidder.lastActivityDate}</td>
                        <td>
                          {bidder.won ? (
                            <Award className="w-4 h-4" style={{ color: "hsl(var(--accent))" }} />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td>
                          <div className="flex gap-1 flex-wrap">
                            {bidder.previousSalesInvolved.slice(0, 3).map(s => (
                              <span key={s} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "hsl(var(--secondary))" }}>{s}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
