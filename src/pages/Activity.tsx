import { useState } from "react";
import SubNav from "@/components/layout/SubNav";
import KPICard from "@/components/dashboard/KPICard";
import { events } from "@/data/mockData";
import { Zap, Eye, UserPlus, Gavel, AlertCircle } from "lucide-react";

const tabs = [
  { key: "stream", label: "זרם פעילות" },
  { key: "families", label: "משפחות אירועים" },
  { key: "by-customer", label: "לפי לקוח" },
  { key: "by-book", label: "לפי ספר" },
  { key: "by-sale", label: "לפי מכירה" },
];

const eventIcons: Record<string, any> = {
  bid: Gavel,
  registration: UserPlus,
  watch: Eye,
  view: Eye,
  outbid: AlertCircle,
};

const eventColors: Record<string, string> = {
  bid: "hsl(var(--accent))",
  registration: "hsl(var(--success))",
  watch: "hsl(var(--chart-5))",
  view: "hsl(var(--muted-foreground))",
  outbid: "hsl(var(--destructive))",
};

const familyData = [
  { family: "הצעות", count: 245, pct: 42 },
  { family: "צפיות", count: 180, pct: 31 },
  { family: "מעקב", count: 85, pct: 15 },
  { family: "הרשמות", count: 45, pct: 8 },
  { family: "הוצאו מהצעה", count: 28, pct: 4 },
];

export default function Activity() {
  const [activeTab, setActiveTab] = useState("stream");

  return (
    <div className="min-h-screen">
      <SubNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} title="פעילות" />
      <div className="p-8 animate-fade-in">
        {activeTab === "stream" && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-8">
              <KPICard label="אירועים היום" value="87" trend="up" trendValue="+12%" />
              <KPICard label="הצעות" value="34" />
              <KPICard label="הרשמות חדשות" value="8" />
              <KPICard label="לקוחות פעילים" value="52" />
            </div>
            <div className="chart-card">
              <div className="chart-title flex items-center gap-2"><Zap className="w-4 h-4" /> זרם אירועים</div>
              <div className="space-y-1 mt-4">
                {events.map((e) => {
                  const Icon = eventIcons[e.type] || Zap;
                  return (
                    <div key={e.id} className="flex items-center gap-4 py-3 border-b border-border/30 hover:bg-secondary/30 rounded-lg px-3 cursor-pointer transition-colors">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${eventColors[e.type]}20` }}>
                        <Icon className="w-4 h-4" style={{ color: eventColors[e.type] }} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm"><span className="font-semibold">{e.customer}</span> {e.lot && <span className="text-muted-foreground">· {e.lot}</span>}</div>
                        <div className="text-xs text-muted-foreground">{e.details}</div>
                      </div>
                      <div className="text-xs text-muted-foreground flex-shrink-0">{e.timestamp}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {activeTab === "families" && (
          <div className="chart-card">
            <div className="chart-title">התפלגות סוגי אירועים</div>
            <div className="space-y-4 mt-6">
              {familyData.map((f) => (
                <div key={f.family}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold">{f.family}</span>
                    <span className="text-sm">{f.count} ({f.pct}%)</span>
                  </div>
                  <div className="h-6 rounded-lg overflow-hidden bg-secondary">
                    <div className="h-full rounded-lg" style={{ width: `${f.pct}%`, background: "hsl(220,35%,18%)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "by-customer" && (
          <div className="chart-card">
            <div className="chart-title">פעילות לפי לקוח</div>
            <table className="data-table">
              <thead><tr><th>לקוח</th><th>הצעות</th><th>צפיות</th><th>מעקב</th><th>סה״כ</th></tr></thead>
              <tbody>
                {[
                  { name: "אברהם גולדשטיין", bids: 12, views: 28, watches: 8, total: 48 },
                  { name: "שלמה רוזנברג", bids: 18, views: 42, watches: 15, total: 75 },
                  { name: "יצחק לוי", bids: 8, views: 22, watches: 5, total: 35 },
                  { name: "נתן שטרן", bids: 14, views: 35, watches: 12, total: 61 },
                  { name: "משה כהן", bids: 6, views: 18, watches: 4, total: 28 },
                ].map((c) => (
                  <tr key={c.name}>
                    <td className="font-semibold">{c.name}</td>
                    <td>{c.bids}</td>
                    <td>{c.views}</td>
                    <td>{c.watches}</td>
                    <td className="font-bold">{c.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "by-book" && (
          <div className="chart-card">
            <div className="chart-title">פעילות לפי ספר</div>
            <table className="data-table">
              <thead><tr><th>ספר</th><th>הצעות</th><th>צפיות</th><th>במעקב</th></tr></thead>
              <tbody>
                {[
                  { title: "ספר נועם אלימלך", bids: 12, views: 85, watches: 45 },
                  { title: "הגדה מאוירת אמסטרדם", bids: 8, views: 62, watches: 32 },
                  { title: "שולחן ערוך ונציה", bids: 3, views: 48, watches: 28 },
                  { title: "כתב יד תהלים", bids: 5, views: 38, watches: 18 },
                ].map((b) => (
                  <tr key={b.title}>
                    <td className="font-semibold">{b.title}</td>
                    <td>{b.bids}</td>
                    <td>{b.views}</td>
                    <td>{b.watches}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "by-sale" && (
          <div className="chart-card">
            <div className="chart-title">פעילות לפי מכירה</div>
            <table className="data-table">
              <thead><tr><th>מכירה</th><th>אירועים</th><th>הצעות</th><th>נרשמים</th><th>צפיות</th></tr></thead>
              <tbody>
                {[
                  { sale: "מכירה #48", events: 583, bids: 245, reg: 45, views: 1250 },
                  { sale: "מכירה #47", events: 520, bids: 310, reg: 45, views: 1100 },
                  { sale: "מכירה #46", events: 445, bids: 265, reg: 38, views: 950 },
                ].map((s) => (
                  <tr key={s.sale}>
                    <td className="font-semibold">{s.sale}</td>
                    <td>{s.events}</td>
                    <td>{s.bids}</td>
                    <td>{s.reg}</td>
                    <td>{s.views}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
