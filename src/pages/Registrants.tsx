import { useState } from "react";
import SubNav from "@/components/layout/SubNav";
import KPICard from "@/components/dashboard/KPICard";
import { registrationFunnel } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const tabs = [
  { key: "overview", label: "סקירה" },
  { key: "funnel", label: "משפך המרה" },
  { key: "journey", label: "מסע לקוח" },
  { key: "sources", label: "מקורות" },
  { key: "anomalies", label: "חריגים" },
];

const cohortData = [
  { cohort: "מכירה #43", registered: 48, firstBid: 22, winner: 8 },
  { cohort: "מכירה #44", registered: 41, firstBid: 18, winner: 6 },
  { cohort: "מכירה #45", registered: 52, firstBid: 28, winner: 12 },
  { cohort: "מכירה #46", registered: 38, firstBid: 15, winner: 5 },
  { cohort: "מכירה #47", registered: 45, firstBid: 20, winner: 9 },
];

const sourceData = [
  { source: "חיפוש אורגני", count: 145, pct: 30 },
  { source: "הפנייה מלקוח", count: 120, pct: 25 },
  { source: "ניוזלטר", count: 95, pct: 20 },
  { source: "רשתות חברתיות", count: 72, pct: 15 },
  { source: "ישיר", count: 53, pct: 10 },
];

export default function Registrants() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen">
      <SubNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} title="נרשמים" />
      <div className="p-8 animate-fade-in">
        {activeTab === "overview" && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-8">
              <KPICard label="סה״כ נרשמים" value="485" trend="up" trendValue="+15%" />
              <KPICard label="הפכו למציעים" value="30%" subtitle="145 מתוך 485" />
              <KPICard label="הפכו לזוכים" value="14%" subtitle="68 מתוך 485" />
              <KPICard label="זמן עד הצעה ראשונה" value="3.2 ימים" trend="down" trendValue="-0.5 ימים" />
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="chart-card">
                <div className="chart-title">משפך המרה</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={registrationFunnel} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="stage" type="category" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(220,35%,18%)" radius={[0,4,4,0]} name="כמות" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="chart-card">
                <div className="chart-title">קוהורטות — נרשמים לפי מכירה</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={cohortData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                    <XAxis dataKey="cohort" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="registered" fill="hsl(40,8%,80%)" radius={[4,4,0,0]} name="נרשמו" />
                    <Bar dataKey="firstBid" fill="hsl(220,35%,18%)" radius={[4,4,0,0]} name="הצעה ראשונה" />
                    <Bar dataKey="winner" fill="hsl(38,65%,52%)" radius={[4,4,0,0]} name="זכו" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
        {activeTab === "funnel" && (
          <div className="max-w-2xl mx-auto">
            <div className="chart-card">
              <div className="chart-title">משפך המרה מפורט</div>
              <div className="space-y-4 mt-6">
                {registrationFunnel.map((stage, i) => (
                  <div key={stage.stage} className="relative">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold">{stage.stage}</span>
                      <span className="text-sm font-bold">{stage.count} ({stage.pct}%)</span>
                    </div>
                    <div className="h-8 rounded-lg overflow-hidden bg-secondary">
                      <div className="h-full rounded-lg transition-all" style={{
                        width: `${stage.pct}%`,
                        background: i === 0 ? "hsl(220,35%,18%)" : i === registrationFunnel.length - 1 ? "hsl(38,65%,52%)" : `hsl(220,35%,${18 + i * 10}%)`
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {activeTab === "journey" && (
          <div className="chart-card">
            <div className="chart-title">זמני מעבר בין שלבים</div>
            <div className="space-y-6 mt-4">
              {[
                { from: "הרשמה", to: "צפייה בקטלוג", avg: "0.5 ימים", pct: "78%" },
                { from: "צפייה בקטלוג", to: "הוספה למעקב", avg: "1.2 ימים", pct: "55%" },
                { from: "הוספה למעקב", to: "הצעה ראשונה", avg: "1.5 ימים", pct: "69%" },
                { from: "הצעה ראשונה", to: "זכייה", avg: "2.8 ימים", pct: "47%" },
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="text-sm font-semibold w-32 text-left">{step.from}</div>
                  <div className="flex-1 h-px bg-border relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 bg-card text-xs text-muted-foreground border border-border rounded">
                      {step.avg} · {step.pct}
                    </div>
                  </div>
                  <div className="text-sm font-semibold w-32">{step.to}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        {activeTab === "sources" && (
          <div className="chart-card">
            <div className="chart-title">מקורות הרשמה</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sourceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis dataKey="source" type="category" tick={{ fontSize: 12 }} width={120} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(38,65%,52%)" radius={[0,4,4,0]} name="נרשמים" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
        {activeTab === "anomalies" && (
          <div className="space-y-4">
            {[
              { title: "עלייה חדה בהרשמות מרשתות חברתיות", desc: "+45% בשבוע האחרון, ייתכן בעקבות פוסט ויראלי", type: "info" },
              { title: "3 נרשמים חדשים עם פרופיל VIP", desc: "היסטוריית רכישות גבוהה בבתי מכירות אחרים", type: "opportunity" },
              { title: "ירידה בשיעור המרה מקוהורט #46", desc: "רק 13% הגיעו להצעה, מתחת לממוצע של 30%", type: "warning" },
            ].map((a, i) => (
              <div key={i} className={`alert-card ${a.type === "warning" ? "alert-card-warning" : a.type === "opportunity" ? "alert-card-success" : "alert-card-warning"}`}>
                <div className="font-semibold text-sm">{a.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{a.desc}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
