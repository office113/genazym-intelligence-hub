import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabaseClient";

const PURPLE = { fill: "#EEEDFE", border: "#AFA9EC", text: "#3C3489" };
const GREEN = { fill: "#E1F5EE", border: "#9FE1CB", text: "#085041" };
const AMBER = { fill: "#FAEEDA", border: "#FAC775", text: "#633806" };
const GRAY_BG = "#F1EFE8";
const MUTED = "#888780";

const TAG_FIELDS = [
  { key: "tag_category", label: "קטגוריה" },
  { key: "tag_community", label: "קהילה" },
  { key: "tag_origin", label: "מוצא" },
  { key: "tag_year", label: "תקופה" },
  { key: "tag_print_house", label: "בית דפוס" },
  { key: "tag_uniqueness", label: "ייחודיות" },
] as const;

type TagField = typeof TAG_FIELDS[number]["key"];

interface TagEntry {
  value: string;
  weight: number;
  source: "won" | "lost" | "both";
}

interface Props {
  email: string;
}

export default function CustomerTasteProfile({ email }: Props) {
  const [wonTags, setWonTags] = useState<any[]>([]);
  const [lostTags, setLostTags] = useState<any[]>([]);
  const [brandActivity, setBrandActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState<{ field: string; value: string } | null>(null);

  useEffect(() => {
    if (!email) return;
    let mounted = true;
    setLoading(true);
    setInsight(null);

    const fetch = async () => {
      try {
        const [wonRes, lostRes, actRes] = await Promise.all([
          supabase
            .from("view_customer_won_books")
            .select("book_id_bidspirit, auction_name, tag_category, tag_community, tag_origin, tag_year, tag_print_house, tag_uniqueness")
            .eq("customer_email", email),
          supabase
            .from("fact_customer_lost_bids")
            .select("book_id_bidspirit, auction_name, tag_category, tag_community, tag_origin, tag_year, tag_print_house, tag_uniqueness, max_bid")
            .eq("customer_email", email),
          supabase
            .from("fact_customer_brand_activity")
            .select("days_since_last_bid")
            .eq("email", email),
        ]);
        if (mounted) {
          setWonTags(wonRes.data || []);
          setLostTags(lostRes.data || []);
          setBrandActivity(actRes.data || []);
          setLoading(false);
        }
      } catch (err) {
        console.error("TasteProfile fetch error:", err);
        if (mounted) setLoading(false);
      }
    };
    fetch();
    return () => { mounted = false; };
  }, [email]);

  // Deduplicate rows by book_id_bidspirit + auction_name
  const dedup = (rows: any[]) => {
    const seen = new Set<string>();
    return rows.filter(r => {
      const key = (r?.book_id_bidspirit ?? '') + '||' + (r?.auction_name ?? '');
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // Build tag frequency maps per field (distinct books only)
  const tagMaps = useMemo(() => {
    const result: Record<TagField, Map<string, { won: number; lost: number }>> = {} as any;
    for (const f of TAG_FIELDS) {
      result[f.key] = new Map();
    }

    const addRows = (rows: any[], source: "won" | "lost", weight: number) => {
      for (const row of dedup(rows)) {
        for (const f of TAG_FIELDS) {
          const val = row?.[f.key];
          if (!val || val === "" || val === "null") continue;
          const map = result[f.key];
          const existing = map.get(val) || { won: 0, lost: 0 };
          existing[source] += weight;
          map.set(val, existing);
        }
      }
    };

    addRows(wonTags, "won", 2);
    addRows(lostTags, "lost", 1);
    return result;
  }, [wonTags, lostTags]);

  // Convert maps to sorted arrays
  const tagArrays = useMemo(() => {
    const result: Record<TagField, TagEntry[]> = {} as any;
    for (const f of TAG_FIELDS) {
      const map = tagMaps[f.key];
      const entries: TagEntry[] = [];
      map.forEach((counts, value) => {
        const weight = counts.won + counts.lost;
        const source = counts.won > 0 && counts.lost > 0 ? "both" : counts.won > 0 ? "won" : "lost";
        entries.push({ value, weight, source });
      });
      entries.sort((a, b) => b.weight - a.weight);
      result[f.key] = entries.slice(0, 8);
    }
    return result;
  }, [tagMaps]);

  // Patterns
  const patterns = useMemo(() => {
    const top = (field: TagField) => {
      const arr = tagArrays[field];
      return arr.length > 0 ? { value: arr[0].value, count: arr[0].weight } : null;
    };

    const avgMaxBid = lostTags.length > 0
      ? Math.round(lostTags.reduce((s, r) => s + (r?.max_bid || 0), 0) / lostTags.length)
      : 0;

    const daysSinceLastBid = brandActivity.length > 0
      ? Math.min(...brandActivity.map(r => r?.days_since_last_bid ?? 9999))
      : null;

    return {
      topCategory: top("tag_category"),
      topCommunity: top("tag_community"),
      topYear: top("tag_year"),
      avgMaxBid,
      daysSinceLastBid,
    };
  }, [tagArrays, lostTags, brandActivity]);

  // Pill styling
  const getPillStyle = (entry: TagEntry, maxWeight: number) => {
    const opacity = Math.max(0.5, Math.min(1, entry.weight / Math.max(maxWeight, 1)));
    if (entry.source === "both") {
      return {
        background: GREEN.fill,
        color: GREEN.text,
        borderRight: `3px solid #7F77DD`,
        borderTop: `0.5px solid ${GREEN.border}`,
        borderBottom: `0.5px solid ${GREEN.border}`,
        borderLeft: `0.5px solid ${GREEN.border}`,
        opacity,
      };
    }
    if (entry.source === "won") {
      return {
        background: GREEN.fill,
        color: GREEN.text,
        border: `0.5px solid ${GREEN.border}`,
        opacity,
      };
    }
    return {
      background: PURPLE.fill,
      color: PURPLE.text,
      border: `0.5px solid ${PURPLE.border}`,
      opacity,
    };
  };

  if (loading) {
    return <div className="flex items-center justify-center h-32 text-xs" style={{ color: MUTED }}>טוען פרופיל טעם...</div>;
  }

  const wonCount = wonTags.length;
  const lostCount = lostTags.length;

  if (wonCount === 0 && lostCount === 0) {
    return <div className="text-center py-8 text-xs" style={{ color: MUTED }}>אין מספיק נתונים לבניית פרופיל טעם</div>;
  }

  return (
    <div className="space-y-5" dir="rtl">
      {/* ══════ SECTION A — TAG CLOUDS ══════ */}
      <div>
        <div className="text-xs font-medium mb-3" style={{ color: "#1a1a1a" }}>פרופיל טעם</div>
        <div className="flex items-center gap-3 mb-3">
          <span className="flex items-center gap-1 text-[10px]" style={{ color: MUTED }}>
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: GREEN.fill, border: `1px solid ${GREEN.border}` }} />זכה בלבד
          </span>
          <span className="flex items-center gap-1 text-[10px]" style={{ color: MUTED }}>
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: PURPLE.fill, border: `1px solid ${PURPLE.border}` }} />ניסה בלבד
          </span>
          <span className="flex items-center gap-1 text-[10px]" style={{ color: MUTED }}>
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: GREEN.fill, border: `1px solid ${GREEN.border}`, borderRight: `2px solid #7F77DD` }} />זכה וגם ניסה
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {TAG_FIELDS.map(f => {
            const entries = tagArrays[f.key];
            if (entries.length === 0) return null;
            const maxW = entries[0]?.weight || 1;
            return (
              <div key={f.key} className="rounded-lg p-2.5" style={{ background: GRAY_BG }}>
                <div className="text-[10px] font-medium mb-1.5" style={{ color: MUTED }}>{f.label}</div>
                <div className="flex flex-wrap gap-1">
                  {entries.map(e => {
                    const style = getPillStyle(e, maxW);
                    const fontSize = e.weight >= maxW * 0.7 ? 11 : e.weight >= maxW * 0.4 ? 10 : 9;
                    const isSelected = selectedTag?.field === f.key && selectedTag?.value === e.value;
                    return (
                      <span key={e.value}
                        className="px-2 py-0.5 rounded-full font-medium cursor-pointer transition-all"
                        onClick={() => setSelectedTag(isSelected ? null : { field: f.key, value: e.value })}
                        style={{
                          ...style,
                          fontSize,
                          ...(isSelected ? { border: '1.5px solid #7F77DD', boxShadow: '0 0 0 2px rgba(127,119,221,0.2)' } : { boxShadow: 'none' }),
                        }}>
                        {e.value}
                        <span className="mr-0.5" style={{ opacity: 0.6 }}>({e.weight})</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════ TAG BOOK PANEL ══════ */}
      {selectedTag && (
        <TagBookPanel
          field={selectedTag.field}
          value={selectedTag.value}
          email={email}
          onClose={() => setSelectedTag(null)}
        />
      )}

      {/* ══════ SECTION B — DETECTED PATTERNS ══════ */}
      <div>
        <div className="text-xs font-medium mb-2" style={{ color: "#1a1a1a" }}>דפוסים שזוהו</div>
        <div className="grid grid-cols-2 gap-2">
          {patterns.topCategory && (
            <PatternCard label="הקטגוריה המובילה" value={patterns.topCategory.value} sub={`${patterns.topCategory.count} אזכורים`} />
          )}
          {patterns.topCommunity && (
            <PatternCard label="הקהילה המובילה" value={patterns.topCommunity.value} sub={`${patterns.topCommunity.count} אזכורים`} />
          )}
          {patterns.topYear && (
            <PatternCard label="תקופה מועדפת" value={patterns.topYear.value} sub={`${patterns.topYear.count} אזכורים`} />
          )}
          <PatternCard label="רמת השקעה" value={`$${patterns.avgMaxBid.toLocaleString()}`} sub="ממוצע ביד מקסימלי" />
          {patterns.daysSinceLastBid !== null && patterns.daysSinceLastBid < 9999 && (
            <PatternCard label="פעילות אחרונה" value={`${patterns.daysSinceLastBid} ימים`} sub="מאז ביד אחרון" />
          )}
        </div>
      </div>

      {/* ══════ SECTION C — AI INSIGHT (placeholder) ══════ */}
      <div>
        <div className="text-xs font-medium mb-2" style={{ color: "#1a1a1a" }}>תובנה</div>
        {insightLoading ? (
          <div className="rounded-lg p-4 text-center text-xs" style={{ background: PURPLE.fill, border: `1px solid ${PURPLE.border}`, color: MUTED }}>
            מייצר תובנה...
          </div>
        ) : insight ? (
          <div className="rounded-lg p-4 text-xs leading-relaxed" style={{ background: PURPLE.fill, border: `1px solid ${PURPLE.border}`, color: PURPLE.text }}>
            {insight}
          </div>
        ) : (
          <div className="rounded-lg p-4 text-xs leading-relaxed" style={{ background: PURPLE.fill, border: `1px solid ${PURPLE.border}`, color: MUTED }}>
            <div className="mb-1 font-medium" style={{ color: PURPLE.text }}>סיכום פרופיל</div>
            {wonCount > 0 || lostCount > 0 ? (
              <span>
                לקוח שזכה ב-{wonCount} ספרים וניסה על {lostCount} ספרים נוספים.
                {patterns.topCategory && ` מתעניין בעיקר ב${patterns.topCategory.value}.`}
                {patterns.topCommunity && ` שייך לקהילת ${patterns.topCommunity.value}.`}
                {patterns.topYear && ` מעדיף ספרים מתקופת ${patterns.topYear.value}.`}
              </span>
            ) : (
              <span>אין מספיק נתונים לתובנה.</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PatternCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="rounded-lg p-3" style={{ background: GRAY_BG }}>
      <div className="text-[10px]" style={{ color: MUTED }}>{label}</div>
      <div className="text-sm font-bold mt-0.5" style={{ color: "#1a1a1a" }}>{value}</div>
      <div className="text-[10px] mt-0.5" style={{ color: MUTED }}>{sub}</div>
    </div>
  );
}

function TagBookPanel({ field, value, email, onClose }: {
  field: string; value: string; email: string; onClose: () => void;
}) {
  const [wonBooks, setWonBooks] = useState<any[]>([]);
  const [lostBooks, setLostBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'won' | 'lost'>('won');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    Promise.all([
      supabase
        .from("view_customer_won_books")
        .select("book_name, head_hebrew, auction_name, sold_price, tag_category, tag_community, tag_origin, tag_year, tag_print_house, tag_uniqueness")
        .eq("customer_email", email)
        .eq(field, value),
      supabase
        .from("fact_customer_lost_bids")
        .select("book_name, head_hebrew, auction_name, max_bid, tag_category, tag_community, tag_origin, tag_year, tag_print_house, tag_uniqueness")
        .eq("customer_email", email)
        .eq(field, value),
    ]).then(([wonRes, lostRes]) => {
      if (mounted) {
        const w = wonRes.data || [];
        const l = lostRes.data || [];
        setWonBooks(w);
        setLostBooks(l);
        setActiveTab(l.length > w.length ? 'lost' : 'won');
        setLoading(false);
      }
    }).catch(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [field, value, email]);

  const items = activeTab === 'won' ? wonBooks : lostBooks;

  return (
    <div style={{ background: '#fff', border: `0.5px solid ${PURPLE.border}`, borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1rem' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-bold" style={{ color: PURPLE.text }}>{value}</div>
        <button onClick={onClose} className="text-xs px-2 py-0.5 rounded" style={{ color: MUTED, background: GRAY_BG }}>✕</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-3" style={{ borderRadius: 8, overflow: 'hidden', border: `0.5px solid rgba(0,0,0,0.1)` }}>
        <button onClick={() => setActiveTab('won')}
          style={{
            flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 500, border: 'none', cursor: 'pointer',
            background: activeTab === 'won' ? GREEN.fill : GRAY_BG,
            color: activeTab === 'won' ? GREEN.text : MUTED,
          }}>
          זכה ({wonBooks.length})
        </button>
        <button onClick={() => setActiveTab('lost')}
          style={{
            flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 500, border: 'none', cursor: 'pointer',
            background: activeTab === 'lost' ? PURPLE.fill : GRAY_BG,
            color: activeTab === 'lost' ? PURPLE.text : MUTED,
          }}>
          ניסה ולא זכה ({lostBooks.length})
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-4 text-[10px]" style={{ color: MUTED }}>טוען...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-4 text-[10px]" style={{ color: MUTED }}>אין נתונים</div>
      ) : (
        <div className="space-y-1.5" style={{ maxHeight: 240, overflowY: 'auto' }}>
          {items.map((book, i) => {
            const isWon = activeTab === 'won';
            const color = isWon ? GREEN : PURPLE;
            const title = book.head_hebrew || book.book_name || '—';
            const amount = isWon ? book.sold_price : book.max_bid;
            const label = isWon ? 'מחיר זכייה' : 'ביד אחרון';
            return (
              <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2"
                style={{ background: color.fill, borderRight: `3px solid ${color.border}` }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div className="text-xs font-medium truncate" style={{ color: '#1a1a1a' }}>{title}</div>
                  {book.auction_name && <div className="text-[10px] truncate" style={{ color: MUTED }}>{book.auction_name}</div>}
                </div>
                <div className="flex items-center gap-1.5 mr-2 shrink-0">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: color.border + '33', color: color.text }}>{label}</span>
                  <span className="text-xs font-bold" style={{ color: color.text }}>${(amount || 0).toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
