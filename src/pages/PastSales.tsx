import { useState } from "react";
import SubNav from "@/components/layout/SubNav";
import KPICard from "@/components/dashboard/KPICard";
import DrillDownDrawer from "@/components/dashboard/DrillDownDrawer";
import { pastSalesData, saleComparisonChart } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart, Cell, LabelList } from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { X } from "lucide-react";

const tabs = [
  { key: "overview", label: "סקירה" },
  { key: "compare", label: "השוואת מכירות" },
  { key: "engagement", label: "מעורבות לקוחות" },
  { key: "financial", label: "ביצועים כספיים" },
  { key: "trends", label: "מגמות" },
];

const upliftData = [
  { lot: "פריט 12", opening: 5000, final: 12000 },
  { lot: "פריט 34", opening: 15000, final: 28000 },
  { lot: "פריט 45", opening: 20000, final: 42000 },
  { lot: "פריט 78", opening: 30000, final: 48000 },
  { lot: "פריט 91", opening: 5000, final: 7500 },
];

const engagementBysale = [
  { sale: "#43", avgBids: 4.2, uniqueBidders: 180, returnRate: 62 },
  { sale: "#44", avgBids: 3.8, uniqueBidders: 165, returnRate: 58 },
  { sale: "#45", avgBids: 5.1, uniqueBidders: 210, returnRate: 68 },
  { sale: "#46", avgBids: 3.5, uniqueBidders: 155, returnRate: 55 },
  { sale: "#47", avgBids: 4.8, uniqueBidders: 195, returnRate: 65 },
];

type Brand = "genazym" | "zaidy";

const brandKPIs: Record<Brand, { avgOpeningPrice: string; avgUplift: string; uniqueInvolved: string; avgInvolvedPerSale: string }> = {
  genazym: {
    avgOpeningPrice: "$5,200",
    avgUplift: "87%",
    uniqueInvolved: "482",
    avgInvolvedPerSale: "289",
  },
  zaidy: {
    avgOpeningPrice: "$2,150",
    avgUplift: "62%",
    uniqueInvolved: "214",
    avgInvolvedPerSale: "134",
  },
};

interface ChurnCustomer {
  name: string;
  email: string;
  bidsInPrev: number;
  involvementType: "מוקדם" | "לייב" | "גם וגם";
  lotsInvolved: number;
  maxBidAmount: string;
  wonInPrev: boolean;
  firstBidEver: string;
}

interface ChurnBarData {
  sale: string;
  saleNumber: number;
  notReturned: number;
  prevSale: string;
  prevInvolved: number;
  customers: ChurnCustomer[];
}

interface InvolvedCustomer {
  name: string;
  email: string;
  status: "מעורב" | "זוכה";
  bids: number;
  involvementType: "מוקדם" | "לייב" | "גם וגם";
  lotsInvolved: number;
  maxBidAmount: string;
  firstBidEver: string;
}

interface InvolvedBarData {
  sale: string;
  saleNumber: number;
  involved: number;
  winners: number;
  customers: InvolvedCustomer[];
}

const genazymChurnData: ChurnBarData[] = [
  {
    sale: "#44", saleNumber: 44, notReturned: 38, prevSale: "מכירה #43", prevInvolved: 180,
    customers: [
      { name: "אברהם כהן", email: "a.cohen@email.com", bidsInPrev: 12, involvementType: "גם וגם", lotsInvolved: 8, maxBidAmount: "$4,200", wonInPrev: true, firstBidEver: "2021-03-15" },
      { name: "יצחק לוי", email: "y.levi@email.com", bidsInPrev: 5, involvementType: "לייב", lotsInvolved: 3, maxBidAmount: "$1,800", wonInPrev: false, firstBidEver: "2022-07-20" },
      { name: "משה גולדברג", email: "m.goldberg@email.com", bidsInPrev: 8, involvementType: "מוקדם", lotsInvolved: 6, maxBidAmount: "$3,500", wonInPrev: true, firstBidEver: "2020-11-02" },
      { name: "דוד שוורץ", email: "d.schwartz@email.com", bidsInPrev: 3, involvementType: "לייב", lotsInvolved: 2, maxBidAmount: "$950", wonInPrev: false, firstBidEver: "2023-01-10" },
      { name: "שמואל פרידמן", email: "s.friedman@email.com", bidsInPrev: 15, involvementType: "גם וגם", lotsInvolved: 10, maxBidAmount: "$7,800", wonInPrev: true, firstBidEver: "2019-06-22" },
    ],
  },
  {
    sale: "#45", saleNumber: 45, notReturned: 52, prevSale: "מכירה #44", prevInvolved: 165,
    customers: [
      { name: "יעקב רוזנברג", email: "y.rosenberg@email.com", bidsInPrev: 7, involvementType: "מוקדם", lotsInvolved: 5, maxBidAmount: "$2,600", wonInPrev: false, firstBidEver: "2021-09-14" },
      { name: "חיים ויסברג", email: "c.weisberg@email.com", bidsInPrev: 10, involvementType: "גם וגם", lotsInvolved: 7, maxBidAmount: "$5,100", wonInPrev: true, firstBidEver: "2020-02-28" },
      { name: "נחום שטיין", email: "n.stein@email.com", bidsInPrev: 4, involvementType: "לייב", lotsInvolved: 3, maxBidAmount: "$1,200", wonInPrev: false, firstBidEver: "2022-12-05" },
    ],
  },
  {
    sale: "#46", saleNumber: 46, notReturned: 29, prevSale: "מכירה #45", prevInvolved: 210,
    customers: [
      { name: "אליהו קליין", email: "e.klein@email.com", bidsInPrev: 6, involvementType: "גם וגם", lotsInvolved: 4, maxBidAmount: "$3,200", wonInPrev: true, firstBidEver: "2021-05-18" },
      { name: "ברוך הלפרין", email: "b.halperin@email.com", bidsInPrev: 9, involvementType: "מוקדם", lotsInvolved: 6, maxBidAmount: "$4,800", wonInPrev: false, firstBidEver: "2020-08-11" },
    ],
  },
  {
    sale: "#47", saleNumber: 47, notReturned: 45, prevSale: "מכירה #46", prevInvolved: 155,
    customers: [
      { name: "מנחם פלדמן", email: "m.feldman@email.com", bidsInPrev: 11, involvementType: "לייב", lotsInvolved: 8, maxBidAmount: "$6,400", wonInPrev: true, firstBidEver: "2019-12-30" },
      { name: "צבי הורוביץ", email: "z.horowitz@email.com", bidsInPrev: 3, involvementType: "מוקדם", lotsInvolved: 2, maxBidAmount: "$800", wonInPrev: false, firstBidEver: "2023-04-07" },
      { name: "שלמה גרינפלד", email: "s.greenfeld@email.com", bidsInPrev: 7, involvementType: "גם וגם", lotsInvolved: 5, maxBidAmount: "$3,900", wonInPrev: true, firstBidEver: "2021-01-25" },
      { name: "יוסף ברגר", email: "y.berger@email.com", bidsInPrev: 2, involvementType: "לייב", lotsInvolved: 1, maxBidAmount: "$550", wonInPrev: false, firstBidEver: "2023-08-19" },
    ],
  },
];

const zaidiChurnData: ChurnBarData[] = [
  {
    sale: "#44", saleNumber: 44, notReturned: 22, prevSale: "מכירה #43", prevInvolved: 95,
    customers: [
      { name: "רפאל מזרחי", email: "r.mizrachi@email.com", bidsInPrev: 4, involvementType: "לייב", lotsInvolved: 3, maxBidAmount: "$1,100", wonInPrev: false, firstBidEver: "2022-04-12" },
      { name: "עמוס בן דוד", email: "a.bendavid@email.com", bidsInPrev: 8, involvementType: "גם וגם", lotsInvolved: 5, maxBidAmount: "$2,800", wonInPrev: true, firstBidEver: "2021-10-03" },
    ],
  },
  {
    sale: "#45", saleNumber: 45, notReturned: 31, prevSale: "מכירה #44", prevInvolved: 88,
    customers: [
      { name: "נתן אזולאי", email: "n.azoulay@email.com", bidsInPrev: 6, involvementType: "מוקדם", lotsInvolved: 4, maxBidAmount: "$1,900", wonInPrev: false, firstBidEver: "2022-01-17" },
    ],
  },
  {
    sale: "#46", saleNumber: 46, notReturned: 18, prevSale: "מכירה #45", prevInvolved: 102,
    customers: [
      { name: "גד שמעוני", email: "g.shimoni@email.com", bidsInPrev: 5, involvementType: "גם וגם", lotsInvolved: 3, maxBidAmount: "$1,500", wonInPrev: true, firstBidEver: "2021-07-29" },
    ],
  },
  {
    sale: "#47", saleNumber: 47, notReturned: 27, prevSale: "מכירה #46", prevInvolved: 78,
    customers: [
      { name: "אריה כץ", email: "a.katz@email.com", bidsInPrev: 9, involvementType: "לייב", lotsInvolved: 6, maxBidAmount: "$3,400", wonInPrev: true, firstBidEver: "2020-05-14" },
      { name: "פנחס נחמן", email: "p.nachman@email.com", bidsInPrev: 3, involvementType: "מוקדם", lotsInvolved: 2, maxBidAmount: "$720", wonInPrev: false, firstBidEver: "2023-03-21" },
    ],
  },
];

const genazymInvolvedData: InvolvedBarData[] = [
  {
    sale: "#43", saleNumber: 43, involved: 180, winners: 62,
    customers: [
      { name: "אברהם כהן", email: "a.cohen@email.com", status: "זוכה", bids: 12, involvementType: "גם וגם", lotsInvolved: 8, maxBidAmount: "$4,200", firstBidEver: "2021-03-15" },
      { name: "יצחק לוי", email: "y.levi@email.com", status: "מעורב", bids: 5, involvementType: "לייב", lotsInvolved: 3, maxBidAmount: "$1,800", firstBidEver: "2022-07-20" },
      { name: "משה גולדברג", email: "m.goldberg@email.com", status: "זוכה", bids: 8, involvementType: "מוקדם", lotsInvolved: 6, maxBidAmount: "$3,500", firstBidEver: "2020-11-02" },
      { name: "דוד שוורץ", email: "d.schwartz@email.com", status: "מעורב", bids: 3, involvementType: "לייב", lotsInvolved: 2, maxBidAmount: "$950", firstBidEver: "2023-01-10" },
    ],
  },
  {
    sale: "#44", saleNumber: 44, involved: 165, winners: 54,
    customers: [
      { name: "שמואל פרידמן", email: "s.friedman@email.com", status: "זוכה", bids: 15, involvementType: "גם וגם", lotsInvolved: 10, maxBidAmount: "$7,800", firstBidEver: "2019-06-22" },
      { name: "יעקב רוזנברג", email: "y.rosenberg@email.com", status: "מעורב", bids: 7, involvementType: "מוקדם", lotsInvolved: 5, maxBidAmount: "$2,600", firstBidEver: "2021-09-14" },
      { name: "חיים ויסברג", email: "c.weisberg@email.com", status: "זוכה", bids: 10, involvementType: "גם וגם", lotsInvolved: 7, maxBidAmount: "$5,100", firstBidEver: "2020-02-28" },
    ],
  },
  {
    sale: "#45", saleNumber: 45, involved: 210, winners: 78,
    customers: [
      { name: "נחום שטיין", email: "n.stein@email.com", status: "מעורב", bids: 4, involvementType: "לייב", lotsInvolved: 3, maxBidAmount: "$1,200", firstBidEver: "2022-12-05" },
      { name: "אליהו קליין", email: "e.klein@email.com", status: "זוכה", bids: 6, involvementType: "גם וגם", lotsInvolved: 4, maxBidAmount: "$3,200", firstBidEver: "2021-05-18" },
      { name: "ברוך הלפרין", email: "b.halperin@email.com", status: "מעורב", bids: 9, involvementType: "מוקדם", lotsInvolved: 6, maxBidAmount: "$4,800", firstBidEver: "2020-08-11" },
    ],
  },
  {
    sale: "#46", saleNumber: 46, involved: 155, winners: 48,
    customers: [
      { name: "מנחם פלדמן", email: "m.feldman@email.com", status: "זוכה", bids: 11, involvementType: "לייב", lotsInvolved: 8, maxBidAmount: "$6,400", firstBidEver: "2019-12-30" },
      { name: "צבי הורוביץ", email: "z.horowitz@email.com", status: "מעורב", bids: 3, involvementType: "מוקדם", lotsInvolved: 2, maxBidAmount: "$800", firstBidEver: "2023-04-07" },
    ],
  },
  {
    sale: "#47", saleNumber: 47, involved: 195, winners: 71,
    customers: [
      { name: "שלמה גרינפלד", email: "s.greenfeld@email.com", status: "זוכה", bids: 7, involvementType: "גם וגם", lotsInvolved: 5, maxBidAmount: "$3,900", firstBidEver: "2021-01-25" },
      { name: "יוסף ברגר", email: "y.berger@email.com", status: "מעורב", bids: 2, involvementType: "לייב", lotsInvolved: 1, maxBidAmount: "$550", firstBidEver: "2023-08-19" },
    ],
  },
];

const zaidiInvolvedData: InvolvedBarData[] = [
  {
    sale: "#43", saleNumber: 43, involved: 95, winners: 32,
    customers: [
      { name: "רפאל מזרחי", email: "r.mizrachi@email.com", status: "מעורב", bids: 4, involvementType: "לייב", lotsInvolved: 3, maxBidAmount: "$1,100", firstBidEver: "2022-04-12" },
      { name: "עמוס בן דוד", email: "a.bendavid@email.com", status: "זוכה", bids: 8, involvementType: "גם וגם", lotsInvolved: 5, maxBidAmount: "$2,800", firstBidEver: "2021-10-03" },
    ],
  },
  {
    sale: "#44", saleNumber: 44, involved: 88, winners: 28,
    customers: [
      { name: "נתן אזולאי", email: "n.azoulay@email.com", status: "מעורב", bids: 6, involvementType: "מוקדם", lotsInvolved: 4, maxBidAmount: "$1,900", firstBidEver: "2022-01-17" },
    ],
  },
  {
    sale: "#45", saleNumber: 45, involved: 102, winners: 38,
    customers: [
      { name: "גד שמעוני", email: "g.shimoni@email.com", status: "זוכה", bids: 5, involvementType: "גם וגם", lotsInvolved: 3, maxBidAmount: "$1,500", firstBidEver: "2021-07-29" },
    ],
  },
  {
    sale: "#46", saleNumber: 46, involved: 78, winners: 24,
    customers: [
      { name: "אריה כץ", email: "a.katz@email.com", status: "זוכה", bids: 9, involvementType: "לייב", lotsInvolved: 6, maxBidAmount: "$3,400", firstBidEver: "2020-05-14" },
      { name: "פנחס נחמן", email: "p.nachman@email.com", status: "מעורב", bids: 3, involvementType: "מוקדם", lotsInvolved: 2, maxBidAmount: "$720", firstBidEver: "2023-03-21" },
    ],
  },
  {
    sale: "#47", saleNumber: 47, involved: 91, winners: 30,
    customers: [
      { name: "רפאל מזרחי", email: "r.mizrachi@email.com", status: "זוכה", bids: 7, involvementType: "לייב", lotsInvolved: 4, maxBidAmount: "$2,200", firstBidEver: "2022-04-12" },
    ],
  },
];

const brandChurnData: Record<Brand, ChurnBarData[]> = {
  genazym: genazymChurnData,
  zaidy: zaidiChurnData,
};

const brandInvolvedData: Record<Brand, InvolvedBarData[]> = {
  genazym: genazymInvolvedData,
  zaidy: zaidiInvolvedData,
};

// Custom label renderer for bar values
const renderBarLabel = (props: any) => {
  const { x, y, width, value } = props;
  return (
    <text
      x={x + width / 2}
      y={y - 6}
      fill="hsl(var(--muted-foreground))"
      textAnchor="middle"
      fontSize={11}
      fontWeight={600}
    >
      {value}
    </text>
  );
};

// Premium drawer component
function PremiumDrawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={onClose}
      />
      {/* Drawer panel */}
      <div
        className="fixed top-0 right-0 h-screen w-[520px] bg-card z-50 shadow-2xl border-l border-border animate-in slide-in-from-right duration-300 flex flex-col"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-border bg-card/95 backdrop-blur-sm shrink-0">
          <h3 className="font-display font-bold text-base leading-relaxed">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </>
  );
}

export default function PastSales() {
  const [activeTab, setActiveTab] = useState("overview");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerData, setDrawerData] = useState<any>(null);
  const [brand, setBrand] = useState<Brand>("genazym");
  const [churnDrawerOpen, setChurnDrawerOpen] = useState(false);
  const [churnDrawerData, setChurnDrawerData] = useState<ChurnBarData | null>(null);
  const [involvedDrawerOpen, setInvolvedDrawerOpen] = useState(false);
  const [involvedDrawerData, setInvolvedDrawerData] = useState<InvolvedBarData | null>(null);
  const [hoveredChurnBar, setHoveredChurnBar] = useState<number | null>(null);
  const [hoveredInvolvedBar, setHoveredInvolvedBar] = useState<number | null>(null);

  const kpis = brandKPIs[brand];
  const churnData = brandChurnData[brand];
  const involvedData = brandInvolvedData[brand];

  const openSaleDrawer = (sale: any) => {
    setDrawerData(sale);
    setDrawerOpen(true);
  };

  const handleChurnBarClick = (data: ChurnBarData) => {
    setChurnDrawerData(data);
    setChurnDrawerOpen(true);
  };

  const handleInvolvedBarClick = (data: InvolvedBarData) => {
    setInvolvedDrawerData(data);
    setInvolvedDrawerOpen(true);
  };

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border px-8 pt-6 pb-0">
        <div className="flex items-center justify-between mb-1">
          <h2 className="section-title">מכירות עבר</h2>
          <div className="flex items-center bg-card border border-border rounded-lg p-0.5 shadow-sm">
            <button
              onClick={() => setBrand("genazym")}
              className={`px-5 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                brand === "genazym"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              גנזים
            </button>
            <button
              onClick={() => setBrand("zaidy")}
              className={`px-5 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                brand === "zaidy"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              זיידי
            </button>
          </div>
        </div>
        <div className="sub-nav mb-0 inline-flex mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`sub-nav-item ${activeTab === tab.key ? "sub-nav-item-active" : ""}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-8 animate-fade-in">
        {activeTab === "overview" && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-8">
              <KPICard label="מחיר פתיחה ממוצע לפריט" value={kpis.avgOpeningPrice} subtitle="ממוצע מחיר פתיחה בכל המכירות" />
              <KPICard label="פער ממוצע בסך המכירה" value={kpis.avgUplift} subtitle="בין סך הפתיחה לסך הסגירה" />
              <KPICard label="מעורבים ייחודיים במותג" value={kpis.uniqueInvolved} subtitle="לקוחות שהציעו לפחות פעם אחת" />
              <KPICard label="ממוצע מעורבים למכירה" value={kpis.avgInvolvedPerSale} subtitle="ממוצע מציעים ייחודיים למכירה" />
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* LEFT CHART: Churn */}
              <div className="chart-card">
                <div className="chart-title">לא חזרו מהמכירה הקודמת</div>
                <p className="text-xs text-muted-foreground mb-3 px-1">מספר לקוחות שהיו מעורבים במכירה הקודמת ולא חזרו</p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={churnData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="sale" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "13px",
                        direction: "rtl",
                      }}
                      formatter={(value: number) => [`${value} לקוחות`, "לא חזרו"]}
                      labelFormatter={(label) => `מכירה ${label}`}
                    />
                    <Bar
                      dataKey="notReturned"
                      radius={[6, 6, 0, 0]}
                      onClick={(_, index) => handleChurnBarClick(churnData[index])}
                      onMouseEnter={(_, index) => setHoveredChurnBar(index)}
                      onMouseLeave={() => setHoveredChurnBar(null)}
                    >
                      <LabelList dataKey="notReturned" content={renderBarLabel} />
                      {churnData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={hoveredChurnBar === index ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.75)"}
                          style={{ cursor: "pointer", transition: "fill 0.2s ease" }}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* RIGHT CHART: Involved & Winners */}
              <div className="chart-card">
                <div className="chart-title">מעורבים וזוכים בכל מכירה</div>
                <p className="text-xs text-muted-foreground mb-3 px-1">מספר לקוחות מעורבים וזוכים ייחודיים בכל מכירה</p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={involvedData} margin={{ top: 20, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="sale" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "13px",
                        direction: "rtl",
                      }}
                      formatter={(value: number, name: string) => [
                        `${value} לקוחות`,
                        name === "involved" ? "מעורבים" : "זוכים",
                      ]}
                      labelFormatter={(label) => `מכירה ${label}`}
                    />
                    <Bar
                      dataKey="involved"
                      fill="hsl(var(--primary))"
                      radius={[6, 6, 0, 0]}
                      onClick={(_, index) => handleInvolvedBarClick(involvedData[index])}
                      style={{ cursor: "pointer" }}
                      name="מעורבים"
                    >
                      <LabelList dataKey="involved" content={renderBarLabel} />
                    </Bar>
                    <Bar
                      dataKey="winners"
                      fill="hsl(38, 65%, 52%)"
                      radius={[6, 6, 0, 0]}
                      onClick={(_, index) => handleInvolvedBarClick(involvedData[index])}
                      style={{ cursor: "pointer" }}
                      name="זוכים"
                    >
                      <LabelList dataKey="winners" content={renderBarLabel} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                {/* Legend */}
                <div className="flex items-center justify-center gap-6 mt-2 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-primary inline-block" />
                    <span>מעורבים</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: "hsl(38, 65%, 52%)" }} />
                    <span>זוכים</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-title">טבלת מכירות</div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>מכירה</th>
                    <th>תאריך</th>
                    <th>פריטים</th>
                    <th>נמכרו</th>
                    <th>הכנסות</th>
                    <th>זוכים</th>
                    <th>מציעים</th>
                    <th>נרשמים חדשים</th>
                  </tr>
                </thead>
                <tbody>
                  {pastSalesData.map((sale) => (
                    <tr key={sale.id} onClick={() => openSaleDrawer(sale)}>
                      <td className="font-semibold">{sale.name}</td>
                      <td>{sale.date}</td>
                      <td>{sale.lots}</td>
                      <td>{sale.sold}</td>
                      <td>${sale.revenue.toLocaleString()}</td>
                      <td>{sale.winners}</td>
                      <td>{sale.bidders}</td>
                      <td>{sale.newReg}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === "compare" && (
          <>
            <div className="chart-card mb-6">
              <div className="chart-title">השוואת הכנסות בין מכירות</div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={saleComparisonChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                  <XAxis dataKey="sale" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="hsl(220,35%,18%)" radius={[4, 4, 0, 0]} name="הכנסות (אלפי $)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-card">
              <div className="chart-title">עליית מחיר: פתיחה מול סגירה</div>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={upliftData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="lot" type="category" tick={{ fontSize: 12 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="opening" fill="hsl(40,8%,80%)" name="מחיר פתיחה" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="final" fill="hsl(38,65%,52%)" name="מחיר סגירה" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {activeTab === "engagement" && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <KPICard label="ממוצע הצעות לפריט" value="4.3" trend="up" trendValue="+8%" />
              <KPICard label="שיעור חזרה" value="62%" trend="up" trendValue="+4%" />
              <KPICard label="מציעים חדשים (%)" value="18%" trend="down" trendValue="-2%" />
            </div>
            <div className="chart-card">
              <div className="chart-title">מעורבות לפי מכירה</div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={engagementBysale}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                  <XAxis dataKey="sale" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgBids" stroke="hsl(220,35%,18%)" strokeWidth={2} name="ממוצע הצעות" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="returnRate" stroke="hsl(38,65%,52%)" strokeWidth={2} name="שיעור חזרה (%)" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {activeTab === "financial" && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-8">
              <KPICard label="ממוצע מחיר פריט" value="$9,450" trend="up" trendValue="+6%" />
              <KPICard label="עלית מחיר ממוצעת" value="87%" subtitle="מפתיחה לסגירה" trend="up" trendValue="+12%" />
              <KPICard label="פריט יקר ביותר" value="$48,000" subtitle="שולחן ערוך - ונציה" />
              <KPICard label="עמלות" value="$1.2M" trend="up" trendValue="+8%" />
            </div>
            <div className="chart-card">
              <div className="chart-title">מגמת הכנסות</div>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={saleComparisonChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                  <XAxis dataKey="sale" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="hsl(38,65%,52%)" fill="hsl(38,65%,52%,0.12)" strokeWidth={2} name="הכנסות (אלפי $)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {activeTab === "trends" && (
          <>
            <div className="grid grid-cols-3 gap-4 mb-8">
              <KPICard label="מגמת הכנסות" value="עולה" trend="up" trendValue="+15% YoY" />
              <KPICard label="מגמת מציעים" value="יציבה" trend="neutral" trendValue="±2%" />
              <KPICard label="מגמת פריטים לא נמכרים" value="יורדת" trend="up" trendValue="-3%" subtitle="שיפור" />
            </div>
            <div className="chart-card">
              <div className="chart-title">מגמות לאורך זמן</div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={saleComparisonChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,12%,89%)" />
                  <XAxis dataKey="sale" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="revenue" stroke="hsl(220,35%,18%)" strokeWidth={2} name="הכנסות" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="sold" stroke="hsl(38,65%,52%)" strokeWidth={2} name="נמכרו" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>

      <DrillDownDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title={drawerData?.name || ""}>
        {drawerData && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="kpi-card"><div className="kpi-value">{drawerData.lots}</div><div className="kpi-label">פריטים</div></div>
              <div className="kpi-card"><div className="kpi-value">{drawerData.sold}</div><div className="kpi-label">נמכרו</div></div>
              <div className="kpi-card"><div className="kpi-value">${drawerData.revenue.toLocaleString()}</div><div className="kpi-label">הכנסות</div></div>
              <div className="kpi-card"><div className="kpi-value">{drawerData.winners}</div><div className="kpi-label">זוכים</div></div>
            </div>
            <div>
              <h4 className="font-display font-semibold mb-2">פרטי מכירה</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">תאריך</span><span>{drawerData.date}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">מציעים</span><span>{drawerData.bidders}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">נרשמים חדשים</span><span>{drawerData.newReg}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">שיעור מכירה</span><span>{Math.round(drawerData.sold/drawerData.lots*100)}%</span></div>
              </div>
            </div>
          </div>
        )}
      </DrillDownDrawer>

      {/* Churn drill-down drawer */}
      <PremiumDrawer
        open={churnDrawerOpen}
        onClose={() => setChurnDrawerOpen(false)}
        title={churnDrawerData ? `לקוחות שלא חזרו מהמכירה הקודמת — מכירה ${churnDrawerData.saleNumber}` : ""}
      >
        {churnDrawerData && (
          <>
            <div className="px-7 py-5 border-b border-border">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-secondary/60 p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{churnDrawerData.prevSale}</div>
                  <div className="text-xs text-muted-foreground mt-1">מכירה קודמת</div>
                </div>
                <div className="rounded-xl bg-secondary/60 p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{churnDrawerData.prevInvolved}</div>
                  <div className="text-xs text-muted-foreground mt-1">מעורבים במכירה הקודמת</div>
                </div>
                <div className="rounded-xl bg-secondary/60 p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{churnDrawerData.notReturned}</div>
                  <div className="text-xs text-muted-foreground mt-1">לקוחות שלא חזרו</div>
                </div>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-240px)]">
              <div className="px-7 py-5">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-right text-xs font-semibold text-muted-foreground">שם לקוח</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-muted-foreground">אימייל</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-muted-foreground">בידים</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-muted-foreground">סוג מעורבות</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-muted-foreground">לוטים</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-muted-foreground">ביד מקסימלי</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-muted-foreground">זכה?</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-muted-foreground">ביד ראשון במותג</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {churnDrawerData.customers.map((customer, idx) => (
                      <TableRow key={idx} className="cursor-pointer hover:bg-accent/50 transition-colors">
                        <TableCell className="font-medium text-sm">{customer.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{customer.email}</TableCell>
                        <TableCell className="text-sm tabular-nums">{customer.bidsInPrev}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            customer.involvementType === "גם וגם"
                              ? "bg-primary/10 text-primary"
                              : customer.involvementType === "לייב"
                              ? "bg-accent text-accent-foreground"
                              : "bg-secondary text-secondary-foreground"
                          }`}>
                            {customer.involvementType}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">{customer.lotsInvolved}</TableCell>
                        <TableCell className="text-sm tabular-nums font-medium">{customer.maxBidAmount}</TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium ${customer.wonInPrev ? "text-green-600" : "text-muted-foreground"}`}>
                            {customer.wonInPrev ? "כן" : "לא"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground tabular-nums">{customer.firstBidEver}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </>
        )}
      </PremiumDrawer>

      {/* Involved & Winners drill-down drawer */}
      <PremiumDrawer
        open={involvedDrawerOpen}
        onClose={() => setInvolvedDrawerOpen(false)}
        title={involvedDrawerData ? `מעורבים וזוכים — מכירה ${involvedDrawerData.saleNumber}` : ""}
      >
        {involvedDrawerData && (
          <>
            <div className="px-7 py-5 border-b border-border">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-secondary/60 p-4 text-center">
                  <div className="text-2xl font-bold text-foreground">{involvedDrawerData.involved}</div>
                  <div className="text-xs text-muted-foreground mt-1">מעורבים במכירה</div>
                </div>
                <div className="rounded-xl bg-secondary/60 p-4 text-center">
                  <div className="text-2xl font-bold" style={{ color: "hsl(38, 65%, 52%)" }}>{involvedDrawerData.winners}</div>
                  <div className="text-xs text-muted-foreground mt-1">זוכים במכירה</div>
                </div>
              </div>
            </div>

            <ScrollArea className="h-[calc(100vh-240px)]">
              <div className="px-7 py-5">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-right text-xs font-semibold text-muted-foreground">שם לקוח</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-muted-foreground">אימייל</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-muted-foreground">סטטוס</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-muted-foreground">בידים</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-muted-foreground">סוג מעורבות</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-muted-foreground">לוטים</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-muted-foreground">ביד מקסימלי</TableHead>
                      <TableHead className="text-right text-xs font-semibold text-muted-foreground">ביד ראשון במותג</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {involvedDrawerData.customers.map((customer, idx) => (
                      <TableRow key={idx} className="cursor-pointer hover:bg-accent/50 transition-colors">
                        <TableCell className="font-medium text-sm">{customer.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{customer.email}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            customer.status === "זוכה"
                              ? "text-foreground"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                          style={customer.status === "זוכה" ? { backgroundColor: "hsl(38, 65%, 52%, 0.15)", color: "hsl(38, 65%, 40%)" } : {}}
                          >
                            {customer.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">{customer.bids}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            customer.involvementType === "גם וגם"
                              ? "bg-primary/10 text-primary"
                              : customer.involvementType === "לייב"
                              ? "bg-accent text-accent-foreground"
                              : "bg-secondary text-secondary-foreground"
                          }`}>
                            {customer.involvementType}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm tabular-nums">{customer.lotsInvolved}</TableCell>
                        <TableCell className="text-sm tabular-nums font-medium">{customer.maxBidAmount}</TableCell>
                        <TableCell className="text-sm text-muted-foreground tabular-nums">{customer.firstBidEver}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          </>
        )}
      </PremiumDrawer>
    </div>
  );
}
