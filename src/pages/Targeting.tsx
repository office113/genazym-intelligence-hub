import { useState } from "react";
import SubNav from "@/components/layout/SubNav";
import KPICard from "@/components/dashboard/KPICard";
import DrillDownDrawer from "@/components/dashboard/DrillDownDrawer";
import { targetingRecommendations } from "@/data/mockData";
import { Sparkles, Shield, Phone, Mail, MessageCircle, ChevronDown, ChevronUp, Send } from "lucide-react";

const tabs = [
  { key: "opportunities", label: "הזדמנויות" },
  { key: "by-book", label: "התאמות לפי ספר" },
  { key: "by-customer", label: "התאמות לפי לקוח" },
  { key: "outreach", label: "ניסוח פנייה" },
  { key: "ai", label: "המלצות AI" },
];

export default function Targeting() {
  const [activeTab, setActiveTab] = useState("opportunities");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedRec, setSelectedRec] = useState<any>(null);

  const openRec = (rec: any) => { setSelectedRec(rec); setDrawerOpen(true); };
  const toggle = (id: string) => setExpandedId(expandedId === id ? null : id);

  return (
    <div className="min-h-screen">
      <SubNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} title="טרגוט" />

      <div className="p-8 animate-fade-in">
        {activeTab === "opportunities" && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-8">
              <KPICard label="המלצות פעילות" value="24" trend="up" trendValue="5 חדשות היום" />
              <KPICard label="התאמה ממוצעת" value="87%" trend="up" trendValue="+3%" />
              <KPICard label="AI מול חוקים" value="65/35" subtitle="% AI / % חוקים" />
              <KPICard label="פניות שנשלחו" value="12" subtitle="מתוך 24 המלצות" />
            </div>

            <div className="space-y-4">
              {targetingRecommendations.map((rec) => (
                <div key={rec.id} className="action-card" onClick={() => toggle(rec.id)}>
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {rec.matchType === "ai" ? (
                          <span className="badge-ai"><Sparkles className="w-3 h-3" />AI</span>
                        ) : (
                          <span className="badge-rule"><Shield className="w-3 h-3" />חוקים</span>
                        )}
                        <span className="text-sm font-semibold">{rec.customerName}</span>
                        <span className="text-muted-foreground text-xs">←</span>
                        <span className="text-sm">{rec.lotTitle}</span>
                      </div>

                      {/* Confidence */}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="confidence-bar w-32">
                          <div className="confidence-fill" style={{ width: `${rec.confidence}%` }} />
                        </div>
                        <span className="text-xs font-medium">{rec.confidence}%</span>
                        <span className="text-xs text-muted-foreground">רמת התאמה</span>
                      </div>

                      {/* Expanded signals */}
                      {expandedId === rec.id && (
                        <div className="mt-4 pt-4 border-t border-border animate-fade-in">
                          <div className="text-xs font-semibold text-muted-foreground mb-2">למה ההתאמה הזו?</div>
                          <ul className="space-y-1.5">
                            {rec.signals.map((s, i) => (
                              <li key={i} className="text-sm flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "hsl(var(--accent))" }} />
                                {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button className="p-2 rounded-lg hover:bg-secondary transition-colors" onClick={(e) => { e.stopPropagation(); openRec(rec); }}>
                        {rec.suggestedAction === "שיחה טלפונית" ? <Phone className="w-4 h-4" /> :
                         rec.suggestedAction === "הודעת וואטסאפ" ? <MessageCircle className="w-4 h-4" /> :
                         <Mail className="w-4 h-4" />}
                      </button>
                      {expandedId === rec.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "by-book" && (
          <div className="space-y-6">
            {["ספר נועם אלימלך - מהדורה ראשונה", "כתב יד על קלף - תהלים עם פירוש", "הגדה של פסח מאוירת"].map((book, i) => (
              <div key={i} className="chart-card">
                <div className="chart-title">{book}</div>
                <div className="flex gap-2 flex-wrap mb-3">
                  {targetingRecommendations.filter((_, j) => j % 3 === i).map((rec) => (
                    <div key={rec.id} className="filter-chip" onClick={() => openRec(rec)}>
                      {rec.customerName}
                      <span className="text-xs opacity-60">{rec.confidence}%</span>
                    </div>
                  ))}
                  <div className="filter-chip opacity-50">+3 נוספים</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "by-customer" && (
          <div className="space-y-6">
            {["אברהם גולדשטיין", "שלמה רוזנברג", "יצחק לוי", "נתן שטרן"].map((name, i) => (
              <div key={i} className="chart-card">
                <div className="chart-title">{name}</div>
                <div className="space-y-2">
                  {targetingRecommendations.filter(r => r.customerName === name || i === 3).slice(0, 2).map((rec) => (
                    <div key={rec.id} className="flex items-center gap-3 py-2 cursor-pointer hover:bg-secondary/30 rounded-lg px-2 transition-colors" onClick={() => openRec(rec)}>
                      {rec.matchType === "ai" ? <span className="badge-ai"><Sparkles className="w-3 h-3" />AI</span> : <span className="badge-rule"><Shield className="w-3 h-3" />חוקים</span>}
                      <span className="text-sm flex-1">{rec.lotTitle}</span>
                      <div className="confidence-bar w-20"><div className="confidence-fill" style={{ width: `${rec.confidence}%` }} /></div>
                      <span className="text-xs font-medium">{rec.confidence}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "outreach" && (
          <div className="grid grid-cols-2 gap-6">
            <div className="chart-card">
              <div className="chart-title">ניסוח פנייה</div>
              <div className="space-y-3 mb-4">
                <div className="text-sm text-muted-foreground">בחר לקוח והמלצה:</div>
                <select className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-card">
                  {targetingRecommendations.map(r => (
                    <option key={r.id}>{r.customerName} ← {r.lotTitle}</option>
                  ))}
                </select>
              </div>
              <div className="border border-border rounded-lg p-4 min-h-[200px] text-sm leading-relaxed">
                <p className="font-semibold mb-2">שלום אברהם,</p>
                <p className="mb-2">שמחנו לראות את העניין שלך בספרי חסידות במכירות הקודמות שלנו.</p>
                <p className="mb-2">רצינו לעדכן אותך שבמכירה הקרובה (#48) יוצע ספר נועם אלימלך במהדורה ראשונה — פריט נדיר במיוחד שיכול להתאים לאוסף שלך.</p>
                <p>נשמח לשוחח ולתת פרטים נוספים.</p>
              </div>
              <div className="flex gap-3 mt-4">
                <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg"
                  style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                  <Send className="w-4 h-4" /> שלח אימייל
                </button>
                <button className="px-4 py-2.5 text-sm font-medium rounded-lg border border-border bg-card">
                  ערוך
                </button>
              </div>
            </div>
            <div className="chart-card">
              <div className="chart-title">סטטיסטיקות פנייה</div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="kpi-card"><div className="kpi-value">12</div><div className="kpi-label">נשלחו</div></div>
                <div className="kpi-card"><div className="kpi-value">8</div><div className="kpi-label">נפתחו</div></div>
                <div className="kpi-card"><div className="kpi-value">3</div><div className="kpi-label">הגיבו</div></div>
                <div className="kpi-card"><div className="kpi-value">2</div><div className="kpi-label">הציעו</div></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "ai" && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <KPICard label="המלצות AI" value="16" subtitle="מתוך 24 סה״כ" />
              <KPICard label="דיוק AI ממוצע" value="89%" trend="up" trendValue="+5% מהמכירה הקודמת" />
              <KPICard label="המרה מ-AI" value="34%" subtitle="מהמלצות שהובילו להצעה" />
            </div>
            <div className="chart-card">
              <div className="chart-title">המלצות AI אחרונות</div>
              <div className="space-y-3">
                {targetingRecommendations.filter(r => r.matchType === "ai").map((rec) => (
                  <div key={rec.id} className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0 cursor-pointer hover:bg-secondary/30 rounded-lg px-3 transition-colors" onClick={() => openRec(rec)}>
                    <span className="badge-ai"><Sparkles className="w-3 h-3" />AI</span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{rec.customerName} ← {rec.lotTitle}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{rec.signals[0]}</div>
                    </div>
                    <div className="confidence-bar w-24"><div className="confidence-fill" style={{ width: `${rec.confidence}%` }} /></div>
                    <span className="text-sm font-bold" style={{ color: "hsl(var(--accent))" }}>{rec.confidence}%</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <DrillDownDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="פרטי המלצה">
        {selectedRec && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                {selectedRec.matchType === "ai" ? <span className="badge-ai"><Sparkles className="w-3 h-3" />AI</span> : <span className="badge-rule"><Shield className="w-3 h-3" />חוקים</span>}
                <div className="confidence-bar w-24"><div className="confidence-fill" style={{ width: `${selectedRec.confidence}%` }} /></div>
                <span className="text-sm font-bold">{selectedRec.confidence}%</span>
              </div>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-2">לקוח</h4>
              <div className="text-lg font-bold">{selectedRec.customerName}</div>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-2">פריט</h4>
              <div className="text-sm">{selectedRec.lotTitle}</div>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-2">סיגנלים</h4>
              <ul className="space-y-2">
                {selectedRec.signals.map((s: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: "hsl(var(--accent))" }} />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-2">פעולה מומלצת</h4>
              <div className="text-sm">{selectedRec.suggestedAction}</div>
            </div>
            <div className="flex gap-3">
              <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg"
                style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
                <Phone className="w-4 h-4" /> בצע פעולה
              </button>
              <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border border-border bg-card">
                <Mail className="w-4 h-4" /> ניסוח פנייה
              </button>
            </div>
          </div>
        )}
      </DrillDownDrawer>
    </div>
  );
}
