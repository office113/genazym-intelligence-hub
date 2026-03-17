import { useState, useMemo } from "react";
import SubNav from "@/components/layout/SubNav";
import KPICard from "@/components/dashboard/KPICard";
import DrillDownDrawer from "@/components/dashboard/DrillDownDrawer";
import { usePastSales, SaleRow, YearlyData } from "@/hooks/usePastSales";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Area, AreaChart, Cell, LabelList } from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { X, Search } from "lucide-react";

const tabs = [
  { key: "overview", label: "סקירה" },
  { key: "trends", label: "מגמות" },
  { key: "retention", label: "נטישה ושימור" },
];

const upliftData = [
  { lot: "פריט 12", opening: 5000, final: 12000 },
  { lot: "פריט 34", opening: 15000, final: 28000 },
  { lot: "פריט 45", opening: 20000, final: 42000 },
  { lot: "פריט 78", opening: 30000, final: 48000 },
  { lot: "פריט 91", opening: 5000, final: 7500 },
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
  lotsWon?: number;
  totalWinAmount?: string;
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
      { name: "אברהם כהן", email: "a.cohen@email.com", status: "זוכה", bids: 12, involvementType: "גם וגם", lotsInvolved: 8, maxBidAmount: "$4,200", firstBidEver: "2021-03-15", lotsWon: 3, totalWinAmount: "$9,800" },
      { name: "יצחק לוי", email: "y.levi@email.com", status: "מעורב", bids: 5, involvementType: "לייב", lotsInvolved: 3, maxBidAmount: "$1,800", firstBidEver: "2022-07-20" },
      { name: "משה גולדברג", email: "m.goldberg@email.com", status: "זוכה", bids: 8, involvementType: "מוקדם", lotsInvolved: 6, maxBidAmount: "$3,500", firstBidEver: "2020-11-02", lotsWon: 2, totalWinAmount: "$5,600" },
      { name: "דוד שוורץ", email: "d.schwartz@email.com", status: "מעורב", bids: 3, involvementType: "לייב", lotsInvolved: 2, maxBidAmount: "$950", firstBidEver: "2023-01-10" },
    ],
  },
  {
    sale: "#44", saleNumber: 44, involved: 165, winners: 54,
    customers: [
      { name: "שמואל פרידמן", email: "s.friedman@email.com", status: "זוכה", bids: 15, involvementType: "גם וגם", lotsInvolved: 10, maxBidAmount: "$7,800", firstBidEver: "2019-06-22", lotsWon: 5, totalWinAmount: "$18,200" },
      { name: "יעקב רוזנברג", email: "y.rosenberg@email.com", status: "מעורב", bids: 7, involvementType: "מוקדם", lotsInvolved: 5, maxBidAmount: "$2,600", firstBidEver: "2021-09-14" },
      { name: "חיים ויסברג", email: "c.weisberg@email.com", status: "זוכה", bids: 10, involvementType: "גם וגם", lotsInvolved: 7, maxBidAmount: "$5,100", firstBidEver: "2020-02-28", lotsWon: 3, totalWinAmount: "$11,400" },
    ],
  },
  {
    sale: "#45", saleNumber: 45, involved: 210, winners: 78,
    customers: [
      { name: "נחום שטיין", email: "n.stein@email.com", status: "מעורב", bids: 4, involvementType: "לייב", lotsInvolved: 3, maxBidAmount: "$1,200", firstBidEver: "2022-12-05" },
      { name: "אליהו קליין", email: "e.klein@email.com", status: "זוכה", bids: 6, involvementType: "גם וגם", lotsInvolved: 4, maxBidAmount: "$3,200", firstBidEver: "2021-05-18", lotsWon: 2, totalWinAmount: "$6,100" },
      { name: "ברוך הלפרין", email: "b.halperin@email.com", status: "מעורב", bids: 9, involvementType: "מוקדם", lotsInvolved: 6, maxBidAmount: "$4,800", firstBidEver: "2020-08-11" },
    ],
  },
  {
    sale: "#46", saleNumber: 46, involved: 155, winners: 48,
    customers: [
      { name: "מנחם פלדמן", email: "m.feldman@email.com", status: "זוכה", bids: 11, involvementType: "לייב", lotsInvolved: 8, maxBidAmount: "$6,400", firstBidEver: "2019-12-30", lotsWon: 4, totalWinAmount: "$15,800" },
      { name: "צבי הורוביץ", email: "z.horowitz@email.com", status: "מעורב", bids: 3, involvementType: "מוקדם", lotsInvolved: 2, maxBidAmount: "$800", firstBidEver: "2023-04-07" },
    ],
  },
  {
    sale: "#47", saleNumber: 47, involved: 195, winners: 71,
    customers: [
      { name: "שלמה גרינפלד", email: "s.greenfeld@email.com", status: "זוכה", bids: 7, involvementType: "גם וגם", lotsInvolved: 5, maxBidAmount: "$3,900", firstBidEver: "2021-01-25", lotsWon: 2, totalWinAmount: "$7,200" },
      { name: "יוסף ברגר", email: "y.berger@email.com", status: "מעורב", bids: 2, involvementType: "לייב", lotsInvolved: 1, maxBidAmount: "$550", firstBidEver: "2023-08-19" },
    ],
  },
];

const zaidiInvolvedData: InvolvedBarData[] = [
  {
    sale: "#43", saleNumber: 43, involved: 95, winners: 32,
    customers: [
      { name: "רפאל מזרחי", email: "r.mizrachi@email.com", status: "מעורב", bids: 4, involvementType: "לייב", lotsInvolved: 3, maxBidAmount: "$1,100", firstBidEver: "2022-04-12" },
      { name: "עמוס בן דוד", email: "a.bendavid@email.com", status: "זוכה", bids: 8, involvementType: "גם וגם", lotsInvolved: 5, maxBidAmount: "$2,800", firstBidEver: "2021-10-03", lotsWon: 2, totalWinAmount: "$4,600" },
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
      { name: "גד שמעוני", email: "g.shimoni@email.com", status: "זוכה", bids: 5, involvementType: "גם וגם", lotsInvolved: 3, maxBidAmount: "$1,500", firstBidEver: "2021-07-29", lotsWon: 1, totalWinAmount: "$1,500" },
    ],
  },
  {
    sale: "#46", saleNumber: 46, involved: 78, winners: 24,
    customers: [
      { name: "אריה כץ", email: "a.katz@email.com", status: "זוכה", bids: 9, involvementType: "לייב", lotsInvolved: 6, maxBidAmount: "$3,400", firstBidEver: "2020-05-14", lotsWon: 3, totalWinAmount: "$8,100" },
      { name: "פנחס נחמן", email: "p.nachman@email.com", status: "מעורב", bids: 3, involvementType: "מוקדם", lotsInvolved: 2, maxBidAmount: "$720", firstBidEver: "2023-03-21" },
    ],
  },
  {
    sale: "#47", saleNumber: 47, involved: 91, winners: 30,
    customers: [
      { name: "רפאל מזרחי", email: "r.mizrachi@email.com", status: "זוכה", bids: 7, involvementType: "לייב", lotsInvolved: 4, maxBidAmount: "$2,200", firstBidEver: "2022-04-12", lotsWon: 2, totalWinAmount: "$3,800" },
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

// Investigation bottom-sheet panel
function InvestigationPanel({ open, onClose, title, subtitle, children }: { open: boolean; onClose: () => void; title: string; subtitle?: string; children: React.ReactNode }) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-foreground/60 backdrop-blur-[5px] animate-fade-in"
        onClick={onClose}
      />
      <div
        className="fixed z-50 flex flex-col bg-card rounded-t-2xl shadow-2xl border border-border/60 animate-in slide-in-from-bottom duration-500"
        style={{
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(90vw, 1400px)",
          height: "85vh",
        }}
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-10 py-6 border-b border-border/60 shrink-0 rounded-t-2xl" style={{ background: "linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--secondary) / 0.3) 100%)" }}>
          <div className="space-y-1">
            <h2 className="font-display font-bold text-xl tracking-tight">{title}</h2>
            {subtitle && <p className="text-[13px] text-muted-foreground tracking-wide">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-secondary/60 hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {children}
        </div>
      </div>
    </>
  );
}

// ========== Retention Tab ==========

interface RetentionCustomer {
  id: string;
  name: string;
  email: string;
  salesWithoutInvolvement: number;
  maxHistoricalBid: number;
  totalHistoricalWins: number;
  winCount: number;
  salesInvolved: number;
  lastActiveSale: string;
  isReturning: boolean;
  inLatestSale: boolean;
  everWon: boolean;
  firstBidDate: string;
  bidspiritId: string;
}

// Mock data removed — retention customers are now computed from real activity data

type SortField = "salesWithoutInvolvement" | "maxHistoricalBid" | "totalHistoricalWins" | "salesInvolved";
type SortDir = "asc" | "desc";

// Common drill-down table for KPI and row drill-downs
function RetentionDrillDownTable({ customers, kpiIndex, brand }: { customers: RetentionCustomer[]; kpiIndex?: number; brand?: Brand }) {
  const isKpi1 = kpiIndex === 0;
  const idLabel = brand === "zaidy" ? "מזהה זיידי" : "מזהה גנזים";
  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-sm" dir="rtl">
        <thead className="sticky top-0 z-10 bg-card border-b-2 border-border/50">
          <tr>
            <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">שם לקוח</th>
            {isKpi1 && <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">{idLabel}</th>}
            <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">מקסימום ביד<br />היסטורי</th>
            <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">תאריך ביד<br />ראשון</th>
            {isKpi1 && <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">מכירות</th>}
            {isKpi1 && <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">זכיות</th>}
            {!isKpi1 && <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">מס׳ זכיות<br />היסטורי</th>}
            <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">מכירה אחרונה<br />שהיה מעורב בה</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((c, idx) => (
            <tr key={c.id} className={`transition-colors hover:bg-accent/8 ${idx % 2 === 1 ? "bg-secondary/15" : ""}`}>
              <td className="px-5 py-3 font-medium text-[13px] whitespace-nowrap">{c.name}</td>
              {isKpi1 && <td className="px-5 py-3 text-[13px] text-muted-foreground tabular-nums whitespace-nowrap">{c.bidspiritId || "—"}</td>}
              <td className="px-5 py-3 text-[13px] tabular-nums font-semibold">${c.maxHistoricalBid.toLocaleString()}</td>
              <td className="px-5 py-3 text-[13px] text-muted-foreground tabular-nums whitespace-nowrap">{c.firstBidDate}</td>
              {isKpi1 && <td className="px-5 py-3 text-[13px] tabular-nums text-center">{c.salesInvolved}</td>}
              {isKpi1 && <td className="px-5 py-3 text-[13px] tabular-nums text-center">{c.winCount > 0 ? c.winCount : "—"}</td>}
              {!isKpi1 && <td className="px-5 py-3 text-[13px] tabular-nums text-center">{c.totalHistoricalWins > 0 ? `$${c.totalHistoricalWins.toLocaleString()}` : "—"}</td>}
              <td className="px-5 py-3 text-[13px] text-muted-foreground whitespace-nowrap">{c.lastActiveSale}</td>
            </tr>
          ))}
          {customers.length === 0 && (
            <tr><td colSpan={isKpi1 ? 7 : 5} className="px-5 py-10 text-center text-muted-foreground text-sm">לא נמצאו לקוחות</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function RetentionTab({ brand, brandLabel, rawActivityData, rawAuctionsData, rawRegsData }: { brand: Brand; brandLabel: string; rawActivityData: any[]; rawAuctionsData: any[]; rawRegsData: any[] }) {
  // Compute retention data from real activity data
  const { customers: allCustomers, latestSale } = useMemo(() => {
    if (!rawActivityData.length || !rawAuctionsData.length) return { customers: [] as RetentionCustomer[], latestSale: "—" };

    // Get sorted auction names by date (most recent last)
    const auctionsByDate = [...rawAuctionsData]
      .sort((a, b) => new Date(a.auction_date).getTime() - new Date(b.auction_date).getTime());
    const sortedAuctionNames = auctionsByDate.map(a => a.auction_name);
    const latestAuctionName = sortedAuctionNames[sortedAuctionNames.length - 1];
    const latestSaleLabel = `מכירה ${latestAuctionName}`;

    // Build email -> auction participation map
    const emailAuctions: Record<string, Set<string>> = {};
    const emailName: Record<string, string> = {};
    const emailMaxBid: Record<string, number> = {};
    const emailTotalWins: Record<string, number> = {};
    const emailWinCount: Record<string, number> = {};
    const emailEverWon: Record<string, boolean> = {};
    const emailFirstDate: Record<string, string> = {};

    // Build email -> bidspirit_id map from registrations
    const emailBidspiritId: Record<string, string> = {};
    rawRegsData.forEach((r: any) => {
      const email = (r.email || "").trim().toLowerCase();
      if (email && r.bidspirit_id) emailBidspiritId[email] = r.bidspirit_id;
    });

    rawActivityData.forEach((r: any) => {
      const email = r.email;
      if (!email) return;
      if (!emailAuctions[email]) {
        emailAuctions[email] = new Set();
        emailName[email] = r.full_name || email;
        emailMaxBid[email] = 0;
        emailTotalWins[email] = 0;
        emailWinCount[email] = 0;
        emailEverWon[email] = false;
        emailFirstDate[email] = "";
      }
      if (r.auction_name) emailAuctions[email].add(r.auction_name);
      emailMaxBid[email] = Math.max(emailMaxBid[email], r.max_bid || 0);
      if (r.was_winner) {
        emailTotalWins[email] += (r.max_bid || 0);
        emailWinCount[email] = (emailWinCount[email] || 0) + 1;
        emailEverWon[email] = true;
      }
      const d = r.auction_date || "";
      if (d && (!emailFirstDate[email] || d < emailFirstDate[email])) {
        emailFirstDate[email] = d;
      }
    });

    // Emails in the latest auction
    const latestAuctionEmails = new Set(
      rawActivityData.filter((r: any) => r.auction_name === latestAuctionName).map((r: any) => r.email)
    );

    // The 3 sales before the latest (for returning customer logic)
    const last3SaleNames = sortedAuctionNames.slice(-4, -1); // 3 sales before latest
    const last3Set = new Set(last3SaleNames);
    const priorToLast3Names = new Set(sortedAuctionNames.slice(0, -4)); // all sales before those 3

    // Build retention customers: ALL customers who ever bid
    const customers: RetentionCustomer[] = [];
    for (const email of Object.keys(emailAuctions)) {
      const inLatest = latestAuctionEmails.has(email);
      const auctions = emailAuctions[email];
      const salesInvolved = auctions.size;

      // Calculate consecutive recent sales without involvement (from newest backwards)
      let salesWithoutInvolvement = 0;
      if (!inLatest) {
        for (let i = sortedAuctionNames.length - 1; i >= 0; i--) {
          if (auctions.has(sortedAuctionNames[i])) break;
          salesWithoutInvolvement++;
        }
      }

      // Find last active sale
      let lastActiveSale = "";
      for (let i = sortedAuctionNames.length - 1; i >= 0; i--) {
        if (auctions.has(sortedAuctionNames[i])) {
          lastActiveSale = `מכירה ${sortedAuctionNames[i]}`;
          break;
        }
      }

      // isReturning: active in the latest sale, NOT active in any of the last 3 sales,
      // but had at least one activity record prior to those 3
      const inAnyLast3 = last3SaleNames.some(s => auctions.has(s));
      const hadPriorActivity = [...auctions].some(a => priorToLast3Names.has(a));
      const isReturning = inLatest && !inAnyLast3 && hadPriorActivity;

      const emailLower = email.toLowerCase();
      customers.push({
        id: `ret-${email}`,
        name: emailName[email],
        email,
        salesWithoutInvolvement,
        maxHistoricalBid: emailMaxBid[email],
        totalHistoricalWins: emailTotalWins[email],
        winCount: emailWinCount[email] || 0,
        salesInvolved,
        lastActiveSale,
        isReturning,
        inLatestSale: inLatest,
        everWon: emailEverWon[email],
        firstBidDate: emailFirstDate[email] ? emailFirstDate[email].slice(0, 10) : "",
        bidspiritId: emailBidspiritId[emailLower] || "",
      });
    }

    // Sort by maxHistoricalBid descending by default
    customers.sort((a, b) => b.maxHistoricalBid - a.maxHistoricalBid);

    return { customers, latestSale: latestSaleLabel };
  }, [rawActivityData, rawAuctionsData, rawRegsData]);

  const [search, setSearch] = useState("");
  const [minMaxBid, setMinMaxBid] = useState("");
  const [minTotalWins, setMinTotalWins] = useState("");
  const [minSalesInvolved, setMinSalesInvolved] = useState("");
  const [minSalesWithout, setMinSalesWithout] = useState("");
  const [everWonFilter, setEverWonFilter] = useState<"all" | "yes" | "no">("all");
  const [sortField, setSortField] = useState<SortField>("maxHistoricalBid");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [kpiPanelOpen, setKpiPanelOpen] = useState(false);
  const [kpiPanelIndex, setKpiPanelIndex] = useState<number | null>(null);
  const [customerPanelOpen, setCustomerPanelOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<RetentionCustomer | null>(null);

  const significantWinnerThreshold = brand === "genazym" ? 20000 : 10000;
  const highBidAbsentThreshold = brand === "genazym" ? 50000 : 10000;

  // Only show customers NOT involved in latest sale for the churn table
  const baseCustomers = useMemo(() => allCustomers.filter(c => !c.inLatestSale), [allCustomers]);

  const kpi1Customers = useMemo(() => allCustomers.filter(c => c.salesWithoutInvolvement >= 3 && c.totalHistoricalWins > significantWinnerThreshold), [allCustomers, significantWinnerThreshold]);
  const kpi2Customers = useMemo(() => allCustomers.filter(c => c.isReturning), [allCustomers]);
  const kpi3Customers = useMemo(() => allCustomers.filter(c => c.maxHistoricalBid > highBidAbsentThreshold && c.salesWithoutInvolvement >= 2), [allCustomers, highBidAbsentThreshold]);
  const kpi4Customers = useMemo(() => allCustomers.filter(c => c.maxHistoricalBid > 10000 && !c.everWon), [allCustomers]);

  const kpiConfigs = [
    { title: "זוכים משמעותיים שנעלמו", customers: kpi1Customers, desc: `לא מעורבים ב-3 מכירות אחרונות, סך זכיות מעל $${significantWinnerThreshold.toLocaleString()}` },
    { title: "לקוחות שחזרו", customers: kpi2Customers, desc: "חזרו למכירה האחרונה לאחר היעדרות של 3 מכירות" },
    { title: "בעלי ביד גבוה שנעדרים", customers: kpi3Customers, desc: `ביד מקסימלי מעל $${highBidAbsentThreshold.toLocaleString()}, לא פעילים ב-2 מכירות אחרונות` },
    { title: "לקוחות עם ביד גבוה ללא זכייה", customers: kpi4Customers, desc: "ביד מקסימלי מעל $10,000 ומעולם לא זכו בפריט" },
  ];

  const filtered = useMemo(() => {
    let result = baseCustomers.filter(c => {
      if (search && !c.name.includes(search)) return false;
      if (minMaxBid && c.maxHistoricalBid < Number(minMaxBid)) return false;
      if (minTotalWins && c.totalHistoricalWins < Number(minTotalWins)) return false;
      if (minSalesInvolved && c.salesInvolved < Number(minSalesInvolved)) return false;
      if (minSalesWithout && c.salesWithoutInvolvement < Number(minSalesWithout)) return false;
      if (everWonFilter === "yes" && !c.everWon) return false;
      if (everWonFilter === "no" && c.everWon) return false;
      return true;
    });
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      return sortDir === "desc" ? (bVal as number) - (aVal as number) : (aVal as number) - (bVal as number);
    });
    return result;
  }, [baseCustomers, search, minMaxBid, minTotalWins, minSalesInvolved, minSalesWithout, everWonFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortField(field); setSortDir("desc"); }
  };

  const sortIcon = (field: SortField) => sortField === field ? (sortDir === "desc" ? " ↓" : " ↑") : "";

  const handleKpiClick = (index: number) => {
    setKpiPanelIndex(index);
    setKpiPanelOpen(true);
  };

  const handleRowClick = (customer: RetentionCustomer) => {
    setSelectedCustomer(customer);
    setCustomerPanelOpen(true);
  };

  return (
    <>
      <div className="mb-6 flex items-center gap-3">
        <span className="text-sm text-muted-foreground">מכירת ייחוס:</span>
        <span className="text-sm font-semibold text-foreground">{latestSale}</span>
        <span className="text-xs text-muted-foreground mr-2">({brandLabel})</span>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {kpiConfigs.map((kpi, i) => (
          <div key={i} className="kpi-card cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleKpiClick(i)}>
            <div className="kpi-value">{kpi.customers.length}</div>
            <div className="kpi-label">{kpi.title}</div>
            <div className="text-[11px] text-muted-foreground mt-1.5 opacity-70 leading-relaxed">{kpi.desc}</div>
          </div>
        ))}
      </div>

      <div className="chart-card">
        <div className="chart-title mb-0">לקוחות לניתוח שימור</div>
        <p className="text-xs text-muted-foreground mb-5">הטבלה מציגה רק לקוחות שאי פעם הגישו ביד במותג זה, ולא היו מעורבים במכירת הייחוס האחרונה.</p>

        <div className="flex flex-wrap items-end gap-3 mb-5 pb-5 border-b border-border/40" dir="rtl">
          <div className="relative flex-shrink-0" style={{ minWidth: 180 }}>
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <input type="text" placeholder="חיפוש שם לקוח" value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pr-9 pl-3 py-2 rounded-lg bg-secondary/40 border border-border/50 text-[12px] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground font-medium">מינימום מקסימום ביד היסטורי</label>
            <input type="number" placeholder="$" value={minMaxBid} onChange={e => setMinMaxBid(e.target.value)}
              className="w-24 px-3 py-2 rounded-lg bg-secondary/40 border border-border/50 text-[12px] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors tabular-nums" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground font-medium">מינימום סך זכיות היסטורי</label>
            <input type="number" placeholder="$" value={minTotalWins} onChange={e => setMinTotalWins(e.target.value)}
              className="w-24 px-3 py-2 rounded-lg bg-secondary/40 border border-border/50 text-[12px] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors tabular-nums" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground font-medium">מינימום מכירות מעורב</label>
            <input type="number" placeholder="#" value={minSalesInvolved} onChange={e => setMinSalesInvolved(e.target.value)}
              className="w-20 px-3 py-2 rounded-lg bg-secondary/40 border border-border/50 text-[12px] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors tabular-nums" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground font-medium">מס׳ מכירות אחרונות ברצף ללא מעורבות (מינ׳)</label>
            <input type="number" placeholder="#" value={minSalesWithout} onChange={e => setMinSalesWithout(e.target.value)}
              className="w-20 px-3 py-2 rounded-lg bg-secondary/40 border border-border/50 text-[12px] placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors tabular-nums" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] text-muted-foreground font-medium">זכה אי פעם</label>
            <div className="flex items-center gap-0.5 bg-secondary/40 rounded-lg p-0.5 border border-border/40">
              {(["all", "yes", "no"] as const).map(v => (
                <button key={v} onClick={() => setEverWonFilter(v)}
                  className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-all ${everWonFilter === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                  {v === "all" ? "הכל" : v === "yes" ? "כן" : "לא"}
                </button>
              ))}
            </div>
          </div>
          <span className="text-[12px] text-muted-foreground mr-auto self-end pb-2">{filtered.length} לקוחות</span>
        </div>

        <div className="overflow-auto max-h-[520px]">
          <table className="w-full text-sm" dir="rtl">
            <thead className="sticky top-0 z-10 bg-card border-b-2 border-border/50">
              <tr>
                <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">שם לקוח</th>
                <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45] cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort("salesWithoutInvolvement")}>
                  מס׳ מכירות אחרונות<br />ברצף ללא מעורבות{sortIcon("salesWithoutInvolvement")}
                </th>
                <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45] cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort("maxHistoricalBid")}>
                  מקסימום ביד<br />היסטורי{sortIcon("maxHistoricalBid")}
                </th>
                <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45] cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort("totalHistoricalWins")}>
                  סך זכיות<br />היסטורי{sortIcon("totalHistoricalWins")}
                </th>
                <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45] cursor-pointer hover:text-foreground select-none" onClick={() => toggleSort("salesInvolved")}>
                  מס׳ מכירות שבהן<br />היה מעורב{sortIcon("salesInvolved")}
                </th>
                <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">מכירה אחרונה<br />שבה היה פעיל</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, idx) => (
                <tr key={c.id} className={`cursor-pointer transition-colors hover:bg-accent/8 ${idx % 2 === 1 ? "bg-secondary/15" : ""}`} onClick={() => handleRowClick(c)}>
                  <td className="px-5 py-3 font-medium text-[13px] whitespace-nowrap">{c.name}</td>
                  <td className="px-5 py-3 text-[13px] tabular-nums text-center">
                    <span className={c.salesWithoutInvolvement >= 3 ? "text-destructive font-semibold" : ""}>{c.salesWithoutInvolvement}</span>
                  </td>
                  <td className="px-5 py-3 text-[13px] tabular-nums font-semibold">${c.maxHistoricalBid.toLocaleString()}</td>
                  <td className="px-5 py-3 text-[13px] tabular-nums">{c.totalHistoricalWins > 0 ? `$${c.totalHistoricalWins.toLocaleString()}` : "—"}</td>
                  <td className="px-5 py-3 text-[13px] tabular-nums text-center">{c.salesInvolved}</td>
                  <td className="px-5 py-3 text-[13px] text-muted-foreground whitespace-nowrap">{c.lastActiveSale}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-muted-foreground text-sm">לא נמצאו לקוחות בהתאם לסינון</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* KPI drill-down panel */}
      <InvestigationPanel
        open={kpiPanelOpen}
        onClose={() => setKpiPanelOpen(false)}
        title={kpiPanelIndex !== null ? kpiConfigs[kpiPanelIndex].title : ""}
        subtitle={kpiPanelIndex !== null ? `${latestSale} | ${brandLabel} | ${kpiConfigs[kpiPanelIndex].customers.length} לקוחות` : ""}
      >
        {kpiPanelIndex !== null && (
          <>
            <div className="px-10 py-5 border-b border-border/40 shrink-0">
              <div className="grid grid-cols-2 gap-5 max-w-md">
                <div className="rounded-xl border border-border/50 bg-secondary/30 p-5 text-center">
                  <div className="text-2xl font-bold text-primary tracking-tight">{kpiConfigs[kpiPanelIndex].customers.length}</div>
                  <div className="text-[11px] text-muted-foreground mt-2 font-medium">לקוחות</div>
                </div>
                <div className="rounded-xl border border-border/50 bg-secondary/30 p-5 text-center">
                  <div className="text-[11px] text-muted-foreground leading-relaxed">{kpiConfigs[kpiPanelIndex].desc}</div>
                </div>
              </div>
            </div>
            <RetentionDrillDownTable customers={kpiConfigs[kpiPanelIndex].customers} />
          </>
        )}
      </InvestigationPanel>

      {/* Customer row drill-down panel */}
      <InvestigationPanel
        open={customerPanelOpen}
        onClose={() => setCustomerPanelOpen(false)}
        title={selectedCustomer?.name || ""}
        subtitle={selectedCustomer ? `${latestSale} | ${brandLabel}` : ""}
      >
        {selectedCustomer && (
          <>
            <div className="px-10 py-5 border-b border-border/40 shrink-0">
              <div className="grid grid-cols-4 gap-4">
                <div className="rounded-xl border border-border/50 bg-secondary/30 p-4 text-center">
                  <div className="text-lg font-bold text-foreground tracking-tight">${selectedCustomer.maxHistoricalBid.toLocaleString()}</div>
                  <div className="text-[11px] text-muted-foreground mt-1.5 font-medium">מקסימום ביד היסטורי</div>
                </div>
                <div className="rounded-xl border border-border/50 bg-secondary/30 p-4 text-center">
                  <div className="text-lg font-bold text-foreground tracking-tight">{selectedCustomer.totalHistoricalWins > 0 ? `$${selectedCustomer.totalHistoricalWins.toLocaleString()}` : "—"}</div>
                  <div className="text-[11px] text-muted-foreground mt-1.5 font-medium">סך זכיות היסטורי</div>
                </div>
                <div className="rounded-xl border border-border/50 bg-secondary/30 p-4 text-center">
                  <div className="text-lg font-bold text-foreground tracking-tight">{selectedCustomer.salesInvolved}</div>
                  <div className="text-[11px] text-muted-foreground mt-1.5 font-medium">מכירות מעורב</div>
                </div>
                <div className="rounded-xl border border-border/50 bg-secondary/30 p-4 text-center">
                  <div className={`text-lg font-bold tracking-tight ${selectedCustomer.salesWithoutInvolvement >= 3 ? "text-destructive" : "text-foreground"}`}>{selectedCustomer.salesWithoutInvolvement}</div>
                  <div className="text-[11px] text-muted-foreground mt-1.5 font-medium">מכירות ברצף ללא מעורבות</div>
                </div>
              </div>
            </div>
            <RetentionDrillDownTable customers={[selectedCustomer]} />
          </>
        )}
      </InvestigationPanel>
    </>
  );
}
// ========== Yearly Trends Table ==========

type TrendsBrandFilter = "genazym" | "zaidy" | "both";

// YearlyData type is imported from usePastSales




const currentYear = new Date().getFullYear();

// Mock drill-down data for new registrants and churned customers per year/brand
interface TrendsDrillDownCustomer {
  id: string;
  name: string;
  registrationDate?: string;
  firstBidDate: string;
  maxHistoricalBid: number;
  totalHistoricalWins: number;
  lastActiveSale: string;
}

const trendsDrillDownData: Record<string, Record<number, TrendsDrillDownCustomer[]>> = {
  genazym_registrants: {
    2021: [
      { id: "TR01", name: "אברהם כהן", registrationDate: "2021-02-10", firstBidDate: "2021-03-15", maxHistoricalBid: 4200, totalHistoricalWins: 9800, lastActiveSale: "מכירה #47" },
      { id: "TR02", name: "יצחק לוי", registrationDate: "2021-06-22", firstBidDate: "2021-07-20", maxHistoricalBid: 1800, totalHistoricalWins: 0, lastActiveSale: "מכירה #45" },
      { id: "TR03", name: "יעקב רוזנברג", registrationDate: "2021-08-05", firstBidDate: "2021-09-14", maxHistoricalBid: 2600, totalHistoricalWins: 0, lastActiveSale: "מכירה #44" },
    ],
    2022: [
      { id: "TR04", name: "דוד שוורץ", registrationDate: "2022-01-03", firstBidDate: "2022-01-10", maxHistoricalBid: 950, totalHistoricalWins: 0, lastActiveSale: "מכירה #43" },
      { id: "TR05", name: "נחום שטיין", registrationDate: "2022-11-18", firstBidDate: "2022-12-05", maxHistoricalBid: 1200, totalHistoricalWins: 0, lastActiveSale: "מכירה #45" },
    ],
    2023: [
      { id: "TR06", name: "צבי הורוביץ", registrationDate: "2023-03-28", firstBidDate: "2023-04-07", maxHistoricalBid: 800, totalHistoricalWins: 0, lastActiveSale: "מכירה #46" },
      { id: "TR07", name: "יוסף ברגר", registrationDate: "2023-08-01", firstBidDate: "2023-08-19", maxHistoricalBid: 550, totalHistoricalWins: 0, lastActiveSale: "מכירה #47" },
    ],
    2024: [
      { id: "TR08", name: "אהרון וייס", registrationDate: "2024-01-15", firstBidDate: "2024-02-20", maxHistoricalBid: 3200, totalHistoricalWins: 6400, lastActiveSale: "מכירה #47" },
      { id: "TR09", name: "בנימין הלל", registrationDate: "2024-05-10", firstBidDate: "2024-06-02", maxHistoricalBid: 1500, totalHistoricalWins: 0, lastActiveSale: "מכירה #46" },
      { id: "TR10", name: "גרשון מאיר", registrationDate: "2024-09-22", firstBidDate: "2024-10-15", maxHistoricalBid: 4800, totalHistoricalWins: 8200, lastActiveSale: "מכירה #47" },
    ],
    2025: [
      { id: "TR11", name: "הלל שפירא", registrationDate: "2025-02-14", firstBidDate: "2025-03-01", maxHistoricalBid: 2100, totalHistoricalWins: 0, lastActiveSale: "מכירה #47" },
      { id: "TR12", name: "זבולון קרמר", registrationDate: "2025-06-30", firstBidDate: "2025-07-18", maxHistoricalBid: 1800, totalHistoricalWins: 3200, lastActiveSale: "מכירה #47" },
    ],
    2026: [
      { id: "TR13", name: "טוביה אלקנה", registrationDate: "2026-01-20", firstBidDate: "2026-02-05", maxHistoricalBid: 900, totalHistoricalWins: 0, lastActiveSale: "מכירה #48" },
    ],
  },
  genazym_churned: {
    2022: [
      { id: "TC01", name: "משה גולדברג", firstBidDate: "2020-11-02", maxHistoricalBid: 3500, totalHistoricalWins: 5600, lastActiveSale: "מכירה #43" },
      { id: "TC02", name: "שמואל פרידמן", firstBidDate: "2019-06-22", maxHistoricalBid: 7800, totalHistoricalWins: 18200, lastActiveSale: "מכירה #43" },
    ],
    2023: [
      { id: "TC03", name: "יעקב רוזנברג", firstBidDate: "2021-09-14", maxHistoricalBid: 2600, totalHistoricalWins: 0, lastActiveSale: "מכירה #44" },
      { id: "TC04", name: "חיים ויסברג", firstBidDate: "2020-02-28", maxHistoricalBid: 5100, totalHistoricalWins: 11400, lastActiveSale: "מכירה #44" },
      { id: "TC05", name: "דוד שוורץ", firstBidDate: "2023-01-10", maxHistoricalBid: 950, totalHistoricalWins: 0, lastActiveSale: "מכירה #44" },
    ],
    2024: [
      { id: "TC06", name: "אליהו קליין", firstBidDate: "2021-05-18", maxHistoricalBid: 3200, totalHistoricalWins: 6100, lastActiveSale: "מכירה #45" },
      { id: "TC07", name: "ברוך הלפרין", firstBidDate: "2020-08-11", maxHistoricalBid: 4800, totalHistoricalWins: 0, lastActiveSale: "מכירה #45" },
    ],
    2025: [
      { id: "TC08", name: "מנחם פלדמן", firstBidDate: "2019-12-30", maxHistoricalBid: 6400, totalHistoricalWins: 15800, lastActiveSale: "מכירה #46" },
      { id: "TC09", name: "צבי הורוביץ", firstBidDate: "2023-04-07", maxHistoricalBid: 800, totalHistoricalWins: 0, lastActiveSale: "מכירה #46" },
      { id: "TC10", name: "נחום שטיין", firstBidDate: "2022-12-05", maxHistoricalBid: 1200, totalHistoricalWins: 0, lastActiveSale: "מכירה #45" },
    ],
    2026: [
      { id: "TC11", name: "שלמה גרינפלד", firstBidDate: "2021-01-25", maxHistoricalBid: 3900, totalHistoricalWins: 7200, lastActiveSale: "מכירה #47" },
      { id: "TC12", name: "יוסף ברגר", firstBidDate: "2023-08-19", maxHistoricalBid: 550, totalHistoricalWins: 0, lastActiveSale: "מכירה #47" },
      { id: "TC13", name: "אברהם כהן", firstBidDate: "2021-03-15", maxHistoricalBid: 4200, totalHistoricalWins: 9800, lastActiveSale: "מכירה #47" },
    ],
  },
  zaidy_registrants: {
    2021: [
      { id: "ZTR01", name: "עמוס בן דוד", registrationDate: "2021-09-15", firstBidDate: "2021-10-03", maxHistoricalBid: 2800, totalHistoricalWins: 4600, lastActiveSale: "מכירה #44" },
    ],
    2022: [
      { id: "ZTR02", name: "רפאל מזרחי", registrationDate: "2022-03-20", firstBidDate: "2022-04-12", maxHistoricalBid: 2200, totalHistoricalWins: 3800, lastActiveSale: "מכירה #47" },
      { id: "ZTR03", name: "נתן אזולאי", registrationDate: "2022-01-05", firstBidDate: "2022-01-17", maxHistoricalBid: 1900, totalHistoricalWins: 0, lastActiveSale: "מכירה #45" },
    ],
    2023: [
      { id: "ZTR04", name: "פנחס נחמן", registrationDate: "2023-03-10", firstBidDate: "2023-03-21", maxHistoricalBid: 720, totalHistoricalWins: 0, lastActiveSale: "מכירה #46" },
    ],
    2024: [
      { id: "ZTR05", name: "יהודה אלבז", registrationDate: "2024-04-02", firstBidDate: "2024-04-18", maxHistoricalBid: 14000, totalHistoricalWins: 0, lastActiveSale: "מכירה #46" },
    ],
    2025: [
      { id: "ZTR06", name: "בנימין שרף", registrationDate: "2025-02-28", firstBidDate: "2025-03-09", maxHistoricalBid: 11000, totalHistoricalWins: 24000, lastActiveSale: "מכירה #45" },
    ],
    2026: [
      { id: "ZTR07", name: "שמעון דהן", registrationDate: "2026-01-08", firstBidDate: "2026-01-22", maxHistoricalBid: 1400, totalHistoricalWins: 0, lastActiveSale: "מכירה #48" },
    ],
  },
  zaidy_churned: {
    2022: [
      { id: "ZTC01", name: "עמוס בן דוד", firstBidDate: "2021-10-03", maxHistoricalBid: 2800, totalHistoricalWins: 4600, lastActiveSale: "מכירה #43" },
    ],
    2023: [
      { id: "ZTC02", name: "נתן אזולאי", firstBidDate: "2022-01-17", maxHistoricalBid: 1900, totalHistoricalWins: 0, lastActiveSale: "מכירה #44" },
    ],
    2024: [
      { id: "ZTC03", name: "גד שמעוני", firstBidDate: "2021-07-29", maxHistoricalBid: 1500, totalHistoricalWins: 1500, lastActiveSale: "מכירה #45" },
    ],
    2025: [
      { id: "ZTC04", name: "אריה כץ", firstBidDate: "2020-05-14", maxHistoricalBid: 3400, totalHistoricalWins: 8100, lastActiveSale: "מכירה #46" },
      { id: "ZTC05", name: "פנחס נחמן", firstBidDate: "2023-03-21", maxHistoricalBid: 720, totalHistoricalWins: 0, lastActiveSale: "מכירה #46" },
    ],
    2026: [
      { id: "ZTC06", name: "רפאל מזרחי", firstBidDate: "2022-04-12", maxHistoricalBid: 2200, totalHistoricalWins: 3800, lastActiveSale: "מכירה #47" },
      { id: "ZTC07", name: "יהודה אלבז", firstBidDate: "2024-04-18", maxHistoricalBid: 14000, totalHistoricalWins: 0, lastActiveSale: "מכירה #46" },
    ],
  },
  genazym_newInvolved: {
    2021: [
      { id: "NI01", name: "אברהם כהן", firstBidDate: "2021-03-15", maxHistoricalBid: 4200, totalHistoricalWins: 9800, lastActiveSale: "מכירה #47" },
      { id: "NI02", name: "יצחק לוי", firstBidDate: "2021-07-20", maxHistoricalBid: 1800, totalHistoricalWins: 0, lastActiveSale: "מכירה #45" },
      { id: "NI03", name: "אליהו קליין", firstBidDate: "2021-05-18", maxHistoricalBid: 3200, totalHistoricalWins: 6100, lastActiveSale: "מכירה #45" },
    ],
    2022: [
      { id: "NI04", name: "דוד שוורץ", firstBidDate: "2022-01-10", maxHistoricalBid: 950, totalHistoricalWins: 0, lastActiveSale: "מכירה #43" },
      { id: "NI05", name: "נחום שטיין", firstBidDate: "2022-12-05", maxHistoricalBid: 1200, totalHistoricalWins: 0, lastActiveSale: "מכירה #45" },
      { id: "NI06", name: "חיים ויסברג", firstBidDate: "2022-02-28", maxHistoricalBid: 5100, totalHistoricalWins: 11400, lastActiveSale: "מכירה #44" },
    ],
    2023: [
      { id: "NI07", name: "צבי הורוביץ", firstBidDate: "2023-04-07", maxHistoricalBid: 800, totalHistoricalWins: 0, lastActiveSale: "מכירה #46" },
      { id: "NI08", name: "יוסף ברגר", firstBidDate: "2023-08-19", maxHistoricalBid: 550, totalHistoricalWins: 0, lastActiveSale: "מכירה #47" },
    ],
    2024: [
      { id: "NI09", name: "אהרון וייס", firstBidDate: "2024-02-20", maxHistoricalBid: 3200, totalHistoricalWins: 6400, lastActiveSale: "מכירה #47" },
      { id: "NI10", name: "גרשון מאיר", firstBidDate: "2024-10-15", maxHistoricalBid: 4800, totalHistoricalWins: 8200, lastActiveSale: "מכירה #47" },
      { id: "NI11", name: "בנימין הלל", firstBidDate: "2024-06-02", maxHistoricalBid: 1500, totalHistoricalWins: 0, lastActiveSale: "מכירה #46" },
    ],
    2025: [
      { id: "NI12", name: "הלל שפירא", firstBidDate: "2025-03-01", maxHistoricalBid: 2100, totalHistoricalWins: 0, lastActiveSale: "מכירה #47" },
      { id: "NI13", name: "זבולון קרמר", firstBidDate: "2025-07-18", maxHistoricalBid: 1800, totalHistoricalWins: 3200, lastActiveSale: "מכירה #47" },
    ],
    2026: [
      { id: "NI14", name: "טוביה אלקנה", firstBidDate: "2026-02-05", maxHistoricalBid: 900, totalHistoricalWins: 0, lastActiveSale: "מכירה #48" },
    ],
  },
  zaidy_newInvolved: {
    2021: [
      { id: "ZNI01", name: "עמוס בן דוד", firstBidDate: "2021-10-03", maxHistoricalBid: 2800, totalHistoricalWins: 4600, lastActiveSale: "מכירה #44" },
    ],
    2022: [
      { id: "ZNI02", name: "רפאל מזרחי", firstBidDate: "2022-04-12", maxHistoricalBid: 2200, totalHistoricalWins: 3800, lastActiveSale: "מכירה #47" },
      { id: "ZNI03", name: "נתן אזולאי", firstBidDate: "2022-01-17", maxHistoricalBid: 1900, totalHistoricalWins: 0, lastActiveSale: "מכירה #45" },
    ],
    2023: [
      { id: "ZNI04", name: "פנחס נחמן", firstBidDate: "2023-03-21", maxHistoricalBid: 720, totalHistoricalWins: 0, lastActiveSale: "מכירה #46" },
    ],
    2024: [
      { id: "ZNI05", name: "יהודה אלבז", firstBidDate: "2024-04-18", maxHistoricalBid: 14000, totalHistoricalWins: 0, lastActiveSale: "מכירה #46" },
    ],
    2025: [
      { id: "ZNI06", name: "בנימין שרף", firstBidDate: "2025-03-09", maxHistoricalBid: 11000, totalHistoricalWins: 24000, lastActiveSale: "מכירה #45" },
    ],
    2026: [
      { id: "ZNI07", name: "שמעון דהן", firstBidDate: "2026-01-22", maxHistoricalBid: 1400, totalHistoricalWins: 0, lastActiveSale: "מכירה #48" },
    ],
  },
};

function getDrillDownCustomers(brandFilter: TrendsBrandFilter, type: "registrants" | "churned" | "newInvolved", year: number): TrendsDrillDownCustomer[] {
  if (brandFilter === "both") {
    const gKey = `genazym_${type}`;
    const zKey = `zaidy_${type}`;
    const gCustomers = trendsDrillDownData[gKey]?.[year] || [];
    const zCustomers = trendsDrillDownData[zKey]?.[year] || [];
    const seen = new Set<string>();
    const combined: TrendsDrillDownCustomer[] = [];
    for (const c of [...gCustomers, ...zCustomers]) {
      if (!seen.has(c.name)) { seen.add(c.name); combined.push(c); }
    }
    return combined;
  }
  const key = `${brandFilter === "genazym" ? "genazym" : "zaidy"}_${type}`;
  return trendsDrillDownData[key]?.[year] || [];
}

function TrendsTab({ yearlyTrendsData, rawActivityData, rawRegsData, rawAuctionsData, brand }: { yearlyTrendsData: YearlyData[]; rawActivityData: any[]; rawRegsData: any[]; rawAuctionsData: any[]; brand: Brand }) {
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [drillDownType, setDrillDownType] = useState<"registrants" | "churned" | "newInvolved">("registrants");
  const [drillDownYear, setDrillDownYear] = useState<number>(currentYear);

  const yearlyData = yearlyTrendsData;

  // Build auction-year lookup
  const auctionYearMap = useMemo(() => {
    const map: Record<string, number> = {};
    rawAuctionsData.forEach((a: any) => {
      map[a.auction_name] = new Date(a.auction_date).getFullYear();
    });
    return map;
  }, [rawAuctionsData]);

  // Build earliest year per email
  const earliestYearByEmail = useMemo(() => {
    const map: Record<string, number> = {};
    rawActivityData.forEach((r: any) => {
      const year = auctionYearMap[r.auction_name];
      if (year === undefined) return;
      if (map[r.email] === undefined || year < map[r.email]) map[r.email] = year;
    });
    return map;
  }, [rawActivityData, auctionYearMap]);

  const drillDownCustomers = useMemo(() => {
    const year = drillDownYear;

    if (drillDownType === "registrants") {
      return rawRegsData
        .filter((r: any) => {
          const regDate = new Date(r.join_date || r.created_at);
          return regDate.getFullYear() === year;
        })
        .map((r: any, i: number) => {
          // Try to find activity rows for this registrant to enrich data
          const actRows = rawActivityData.filter((a: any) => a.email === r.email);
          const firstBid = actRows.length > 0
            ? actRows.reduce((earliest: string, a: any) => {
                const d = a.auction_date || "";
                return d && (!earliest || d < earliest) ? d : earliest;
              }, "")
            : "";
          // Sum max_bid only for rows where was_winner is true
          let totalWins = 0;
          actRows.forEach((a: any) => {
            if (a.was_winner) {
              totalWins += (a.max_bid || 0);
            }
          });
          const latest = actRows.length > 0 ? actRows.reduce((best: any, a: any) => {
            const y = auctionYearMap[a.auction_name] || 0;
            return y > (auctionYearMap[best?.auction_name] || 0) ? a : best;
          }, actRows[0]) : null;
          return {
            id: r.id || `reg-${i}`,
            name: r.full_name || r.email || "—",
            email: r.email || "",
            phone: r.phone || "",
            registrationDate: (r.join_date || r.created_at || "").slice(0, 10),
            firstBidDate: firstBid ? firstBid.slice(0, 10) : "",
            maxHistoricalBid: actRows.length > 0 ? Math.max(...actRows.map((a: any) => a.max_bid || 0)) : 0,
            totalHistoricalWins: totalWins,
            lastActiveSale: latest ? `מכירה ${latest.auction_name}` : "",
          };
        });
    }

    // Get auction names for the target year
    const yearAuctionNames = new Set(
      rawAuctionsData
        .filter((a: any) => new Date(a.auction_date).getFullYear() === year)
        .map((a: any) => a.auction_name)
    );
    const yearEmails = new Set(
      rawActivityData.filter((r: any) => yearAuctionNames.has(r.auction_name)).map((r: any) => r.email)
    );

    if (drillDownType === "newInvolved") {
      // Emails whose earliest year is this year
      const emails = [...yearEmails].filter(email => earliestYearByEmail[email] === year);
      return emails.map((email, i) => {
        const rows = rawActivityData.filter((r: any) => r.email === email);
        const latest = rows.reduce((best: any, r: any) => {
          const y = auctionYearMap[r.auction_name] || 0;
          return y > (auctionYearMap[best?.auction_name] || 0) ? r : best;
        }, rows[0]);
        // First bid date: use first_bid_at or earliest auction_date
        const firstBid = rows.reduce((earliest: string, r: any) => {
          const d = r.auction_date || "";
          return d && (!earliest || d < earliest) ? d : earliest;
        }, "");
        // Sum max_bid only for rows where was_winner is true
        let totalWins = 0;
        rows.forEach((r: any) => {
          if (r.was_winner) {
            totalWins += (r.max_bid || 0);
          }
        });
        return {
          id: `ni-${i}`,
          name: rows[0]?.full_name || email,
          firstBidDate: firstBid ? firstBid.slice(0, 10) : "",
          maxHistoricalBid: Math.max(...rows.map((r: any) => r.max_bid || 0)),
          totalHistoricalWins: totalWins,
          lastActiveSale: latest ? `מכירה ${latest.auction_name}` : "",
        };
      });
    }

    if (drillDownType === "churned") {
      // Emails in previous year but not in this year
      const allYears = [...new Set(rawAuctionsData.map((a: any) => new Date(a.auction_date).getFullYear()))].sort();
      const yearIdx = allYears.indexOf(year);
      if (yearIdx <= 0) return [];
      const prevYear = allYears[yearIdx - 1];
      const prevAuctionNames = new Set(
        rawAuctionsData.filter((a: any) => new Date(a.auction_date).getFullYear() === prevYear).map((a: any) => a.auction_name)
      );
      const prevEmails = new Set(
        rawActivityData.filter((r: any) => prevAuctionNames.has(r.auction_name)).map((r: any) => r.email)
      );
      const churnedEmails = [...prevEmails].filter(email => !yearEmails.has(email));
      return churnedEmails.map((email, i) => {
        const rows = rawActivityData.filter((r: any) => r.email === email);
        const latest = rows.reduce((best: any, r: any) => {
          const y = auctionYearMap[r.auction_name] || 0;
          return y > (auctionYearMap[best?.auction_name] || 0) ? r : best;
        }, rows[0]);
        const firstBid = rows.reduce((earliest: string, r: any) => {
          const d = r.auction_date || "";
          return d && (!earliest || d < earliest) ? d : earliest;
        }, "");
        let totalWins = 0;
        rows.forEach((r: any) => {
          if (r.was_winner) {
            totalWins += (r.max_bid || 0);
          }
        });
        return {
          id: `ch-${i}`,
          name: rows[0]?.full_name || email,
          firstBidDate: firstBid ? firstBid.slice(0, 10) : "",
          maxHistoricalBid: Math.max(...rows.map((r: any) => r.max_bid || 0)),
          totalHistoricalWins: totalWins,
          lastActiveSale: latest ? `מכירה ${latest.auction_name}` : "",
        };
      });
    }

    return [];
  }, [drillDownType, drillDownYear, rawActivityData, rawRegsData, rawAuctionsData, auctionYearMap, earliestYearByEmail]);

  const metricRows: { label: string; key: keyof YearlyData; format: (v: number) => string; drillType?: "registrants" | "churned" | "newInvolved"; reversed?: boolean }[] = [
    { label: "מס׳ מכירות בשנה", key: "salesCount", format: v => v.toLocaleString() },
    { label: "סך כספי המכירות בשנה", key: "totalRevenue", format: v => `$${v.toLocaleString()}` },
    { label: "סך לקוחות מעורבים", key: "uniqueInvolved", format: v => v.toLocaleString() },
    { label: "סך לקוחות זוכים", key: "uniqueWinners", format: v => v.toLocaleString() },
    { label: "מחיר ממוצע לפריט", key: "avgPricePerItem", format: v => `$${v.toLocaleString()}` },
    { label: "מחיר חציוני", key: "medianPrice", format: v => `$${v.toLocaleString()}` },
    { label: "מס׳ ספרים שנמכרו", key: "booksSold", format: v => v.toLocaleString() },
    { label: "מס׳ מעורבים חדשים", key: "newInvolved", format: v => v.toLocaleString(), drillType: "newInvolved" },
    { label: "מס׳ נרשמים חדשים", key: "newRegistrants", format: v => v.toLocaleString(), drillType: "registrants" },
    { label: "מס׳ נוטשים השנה", key: "churned", format: v => v === 0 ? "—" : v.toLocaleString(), drillType: "churned", reversed: true },
  ];

  const getTrendColor = (metric: typeof metricRows[number], yearIdx: number) => {
    if (yearIdx === 0) return undefined;
    const curr = yearlyData[yearIdx][metric.key] as number;
    const prev = yearlyData[yearIdx - 1][metric.key] as number;
    if (curr === prev || curr === 0 || prev === 0) return undefined;
    const improved = curr > prev;
    if (metric.reversed) return improved ? "hsl(0, 72%, 51%)" : "hsl(142, 71%, 40%)";
    return improved ? "hsl(142, 71%, 40%)" : "hsl(0, 72%, 51%)";
  };

  const handleCellClick = (drillType: "registrants" | "churned" | "newInvolved", year: number, value: number) => {
    if (value === 0) return;
    setDrillDownType(drillType);
    setDrillDownYear(year);
    setDrillDownOpen(true);
  };

  const drillDownTitles: Record<string, string> = { registrants: "נרשמים חדשים", churned: "נוטשים", newInvolved: "מעורבים חדשים" };

  return (
    <>
      
      <div className="chart-card">
        <div className="flex items-center justify-between mb-6" dir="rtl">
          <div>
            <div className="chart-title mb-0">מגמות שנתיות</div>
            <p className="text-xs text-muted-foreground mt-1">6 שנים אחרונות כולל השנה הנוכחית</p>
          </div>
        </div>

        {/* Matrix table */}
        <div className="overflow-auto" dir="rtl">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-border/50">
                <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 min-w-[180px] bg-card sticky right-0 z-10" />
                {yearlyData.map(yd => (
                  <th
                    key={yd.year}
                    className={`text-center text-[13px] font-bold px-5 py-3.5 min-w-[120px] ${
                      yd.year === currentYear
                        ? "text-primary"
                        : "text-foreground"
                    }`}
                  >
                    <span className="tabular-nums">{yd.year}</span>
                    {yd.year === currentYear && (
                      <span className="block text-[9px] font-medium text-primary/70 mt-0.5">שנה נוכחית</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metricRows.map((metric, rowIdx) => (
                <tr
                  key={metric.key}
                  className={`transition-colors hover:bg-accent/8 ${rowIdx % 2 === 1 ? "bg-secondary/15" : ""} border-b border-border/20`}
                >
                  <td className="text-right text-[12px] font-semibold text-muted-foreground px-5 py-3.5 whitespace-nowrap bg-card sticky right-0 z-10 border-l border-border/30">
                    {metric.label}
                  </td>
                  {yearlyData.map((yd, yearIdx) => {
                    const value = yd[metric.key] as number;
                    const isDrillable = !!metric.drillType && value > 0;
                    const trendColor = getTrendColor(metric, yearIdx);
                    return (
                      <td
                        key={yd.year}
                        onClick={isDrillable ? () => handleCellClick(metric.drillType!, yd.year, value) : undefined}
                        className={`text-center text-[13px] tabular-nums px-5 py-3.5 transition-all ${
                          !isDrillable
                            ? `cursor-default ${yd.year === currentYear ? "font-semibold" : ""}`
                            : "cursor-pointer"
                        }`}
                      >
                        {isDrillable ? (
                          <span
                            className="inline-block font-semibold rounded-md px-2 py-0.5 transition-all"
                            style={{
                              color: trendColor || "hsl(var(--accent))",
                              background: "hsl(var(--accent) / 0.08)",
                            }}
                            onMouseEnter={e => {
                              (e.target as HTMLElement).style.background = "hsl(var(--accent) / 0.18)";
                              (e.target as HTMLElement).style.textDecoration = "underline";
                              (e.target as HTMLElement).style.textUnderlineOffset = "3px";
                            }}
                            onMouseLeave={e => {
                              (e.target as HTMLElement).style.background = "hsl(var(--accent) / 0.08)";
                              (e.target as HTMLElement).style.textDecoration = "none";
                            }}
                          >
                            {metric.format(value)}
                          </span>
                        ) : (
                          <span style={{ color: trendColor || (yd.year === currentYear ? "hsl(var(--foreground))" : "hsl(var(--foreground) / 0.85)") }}>
                            {metric.format(value)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drill-down panel */}
      <InvestigationPanel
        open={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        title={`${drillDownTitles[drillDownType]} — ${drillDownYear}`}
        subtitle={`${drillDownCustomers.length} לקוחות`}
      >
        <div className="px-10 py-5 border-b border-border/40 shrink-0">
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-xl border border-border/50 bg-secondary/30 p-4 text-center">
              <div className="text-lg font-bold text-foreground tracking-tight">{drillDownCustomers.length}</div>
              <div className="text-[11px] text-muted-foreground mt-1.5 font-medium">{drillDownTitles[drillDownType]}</div>
            </div>
            <div className="rounded-xl border border-border/50 bg-secondary/30 p-4 text-center">
              <div className="text-lg font-bold text-foreground tracking-tight">
                {drillDownCustomers.length > 0
                  ? `$${Math.max(...drillDownCustomers.map(c => c.maxHistoricalBid)).toLocaleString()}`
                  : "—"}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1.5 font-medium">ביד מקסימלי גבוה ביותר</div>
            </div>
            <div className="rounded-xl border border-border/50 bg-secondary/30 p-4 text-center">
              <div className="text-lg font-bold text-foreground tracking-tight">
                {drillDownCustomers.filter(c => c.totalHistoricalWins > 0).length}
              </div>
              <div className="text-[11px] text-muted-foreground mt-1.5 font-medium">עם זכיות היסטוריות</div>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-auto">
          <table className="w-full text-sm" dir="rtl">
            <thead className="sticky top-0 z-10 bg-card border-b-2 border-border/50">
              <tr>
                <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">שם לקוח</th>
                {drillDownType === "registrants" && (
                  <>
                    <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">אימייל</th>
                    <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">טלפון</th>
                    <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">תאריך הרשמה</th>
                  </>
                )}
                <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">תאריך ביד<br />ראשון</th>
                <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">מקסימום ביד<br />היסטורי</th>
                <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">מס׳ זכיות<br />היסטורי</th>
                <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">מכירה אחרונה<br />שהיה מעורב בה</th>
              </tr>
            </thead>
            <tbody>
              {drillDownCustomers.map((c, idx) => (
                <tr key={c.id} className={`transition-colors hover:bg-accent/8 ${idx % 2 === 1 ? "bg-secondary/15" : ""}`}>
                  <td className="px-5 py-3 font-medium text-[13px] whitespace-nowrap">{c.name}</td>
                  {drillDownType === "registrants" && (
                    <>
                      <td className="px-5 py-3 text-[13px] text-muted-foreground whitespace-nowrap">{c.email || "—"}</td>
                      <td className="px-5 py-3 text-[13px] text-muted-foreground whitespace-nowrap">{c.phone || "—"}</td>
                      <td className="px-5 py-3 text-[13px] text-muted-foreground tabular-nums whitespace-nowrap">{c.registrationDate || "—"}</td>
                    </>
                  )}
                  <td className="px-5 py-3 text-[13px] text-muted-foreground tabular-nums whitespace-nowrap">{c.firstBidDate}</td>
                  <td className="px-5 py-3 text-[13px] tabular-nums font-semibold">${c.maxHistoricalBid.toLocaleString()}</td>
                  <td className="px-5 py-3 text-[13px] tabular-nums text-center">{c.totalHistoricalWins > 0 ? `$${c.totalHistoricalWins.toLocaleString()}` : "—"}</td>
                  <td className="px-5 py-3 text-[13px] text-muted-foreground whitespace-nowrap">{c.lastActiveSale}</td>
                </tr>
              ))}
              {drillDownCustomers.length === 0 && (
                <tr><td colSpan={drillDownType === "registrants" ? 8 : 5} className="px-5 py-10 text-center text-muted-foreground text-sm">לא נמצאו לקוחות</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </InvestigationPanel>
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
  const [involvedDrawerType, setInvolvedDrawerType] = useState<"involved" | "winners">("involved");
  const [hoveredChurnBar, setHoveredChurnBar] = useState<number | null>(null);
  const [churnSearch, setChurnSearch] = useState("");
  const [churnFilter, setChurnFilter] = useState<string>("all");
  const [involvedSearch, setInvolvedSearch] = useState("");
  const [involvedFilter, setInvolvedFilter] = useState<string>("all");

  const { pastSalesData, involvedData, churnData, yearlyTrendsData, rawActivityData, rawRegsData, rawAuctionsData, kpis, loading, error } = usePastSales(brand);
  const brandLabel = brand === "genazym" ? "גנזים" : "זיידי";

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
    setInvolvedDrawerType("involved");
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
        {loading && activeTab === "overview" && (
          <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">טוען נתונים…</div>
        )}
        {error && activeTab === "overview" && (
          <div className="flex items-center justify-center py-20 text-destructive text-sm">שגיאה בטעינת נתונים: {error}</div>
        )}
        {activeTab === "overview" && !loading && !error && (
          <>
            <div className="grid grid-cols-4 gap-4 mb-8">
              <KPICard label="מחיר פתיחה ממוצע לפריט" value={kpis.avgOpeningPrice} subtitle="ממוצע מחיר פתיחה בכל המכירות" />
              <KPICard label="פער ממוצע בסך המכירה" value={kpis.avgUplift} subtitle="בין סך הפתיחה לסך הסגירה" />
              <KPICard label="מעורבים ייחודיים במותג" value={kpis.uniqueInvolved} subtitle="לקוחות שהציעו לפחות פעם אחת" />
              <KPICard label="ממוצע מעורבים למכירה" value={kpis.avgInvolvedPerSale} subtitle="ממוצע מציעים ייחודיים למכירה" />
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              {/* RIGHT in RTL (first in DOM) = Involved & Winners */}
              <div className="chart-card">
                <div className="chart-title">מעורבים וזוכים בכל מכירה</div>
                <p className="text-xs text-muted-foreground mb-3 px-1">מספר לקוחות מעורבים וזוכים ייחודיים בכל מכירה</p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={involvedData} margin={{ top: 20, right: 20, left: 45, bottom: 0 }} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="sale" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} width={45} tickMargin={8} />
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
                        name === "מעורבים" ? "מעורבים" : "זוכים",
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

              {/* LEFT in RTL (second in DOM) = Churn */}
              <div className="chart-card">
                <div className="chart-title">לא חזרו מהמכירה הקודמת</div>
                <p className="text-xs text-muted-foreground mb-3 px-1">מספר לקוחות שהיו מעורבים במכירה הקודמת ולא חזרו</p>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={churnData} margin={{ top: 20, right: 20, left: 45, bottom: 0 }} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="sale" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} width={45} tickMargin={8} />
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

        {activeTab === "retention" && (
          <RetentionTab brand={brand} brandLabel={brandLabel} rawActivityData={rawActivityData} rawAuctionsData={rawAuctionsData} />
        )}


        {activeTab === "trends" && (
          <TrendsTab yearlyTrendsData={yearlyTrendsData} rawActivityData={rawActivityData} rawRegsData={rawRegsData} rawAuctionsData={rawAuctionsData} brand={brand} />
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

      {/* Churn investigation panel */}
      <InvestigationPanel
        open={churnDrawerOpen}
        onClose={() => { setChurnDrawerOpen(false); setChurnSearch(""); setChurnFilter("all"); }}
        title="לא חזרו מהמכירה הקודמת"
        subtitle={churnDrawerData ? `מכירה נוכחית: ${churnDrawerData.saleNumber} | מכירה קודמת: ${churnDrawerData.saleNumber - 1} | מותג: ${brandLabel}` : ""}
      >
        {churnDrawerData && (() => {
          const filtered = churnDrawerData.customers.filter(c => {
            const matchSearch = !churnSearch || c.name.includes(churnSearch) || c.email.toLowerCase().includes(churnSearch.toLowerCase());
            const matchFilter = churnFilter === "all" || c.involvementType === churnFilter;
            return matchSearch && matchFilter;
          });
          return (
            <>
              {/* Summary cards */}
              <div className="px-10 py-6 border-b border-border/40 shrink-0">
                <div className="grid grid-cols-3 gap-5">
                  <div className="rounded-xl border border-border/50 bg-secondary/30 p-5 text-center">
                    <div className="text-2xl font-bold text-foreground tracking-tight">{churnDrawerData.prevSale}</div>
                    <div className="text-[11px] text-muted-foreground mt-2 font-medium">מכירה קודמת</div>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-secondary/30 p-5 text-center">
                    <div className="text-2xl font-bold text-foreground tracking-tight">{churnDrawerData.prevInvolved}</div>
                    <div className="text-[11px] text-muted-foreground mt-2 font-medium">מעורבים במכירה הקודמת</div>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-secondary/30 p-5 text-center">
                    <div className="text-2xl font-bold text-primary tracking-tight">{churnDrawerData.notReturned}</div>
                    <div className="text-[11px] text-muted-foreground mt-2 font-medium">לקוחות שלא חזרו</div>
                  </div>
                </div>
              </div>

              {/* Search + filter bar */}
              <div className="px-10 py-4 flex items-center gap-4 border-b border-border/30 shrink-0">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="חיפוש לפי שם או אימייל..."
                    value={churnSearch}
                    onChange={e => setChurnSearch(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 rounded-lg bg-secondary/40 border border-border/50 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-secondary/40 rounded-lg p-0.5 border border-border/40">
                  {["all", "מוקדם", "לייב", "גם וגם"].map(f => (
                    <button
                      key={f}
                      onClick={() => setChurnFilter(f)}
                      className={`px-3.5 py-1.5 text-[12px] font-medium rounded-md transition-all ${
                        churnFilter === f
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f === "all" ? "הכל" : f}
                    </button>
                  ))}
                </div>
                <span className="text-[12px] text-muted-foreground mr-auto">{filtered.length} לקוחות</span>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm" dir="rtl">
                  <thead className="sticky top-0 z-10 bg-card border-b-2 border-border/50">
                    <tr>
                      <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">שם לקוח</th>
                      <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">אימייל</th>
                      <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">מס׳ בידים<br />במכירה הקודמת</th>
                      <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">סוג מעורבות<br />במכירה הקודמת</th>
                      <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">מס׳ לוטים שבהם היה<br />מעורב במכירה הקודמת</th>
                      <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">ביד מקסימלי<br />במכירה הקודמת</th>
                      <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">זכה במכירה<br />הקודמת</th>
                      <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">ביד ראשון<br />במותג</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((customer, idx) => (
                      <tr key={idx} className={`cursor-pointer transition-colors hover:bg-accent/30 ${idx % 2 === 1 ? "bg-secondary/15" : ""}`}>
                        <td className="px-5 py-3 font-medium text-[13px] whitespace-nowrap">{customer.name}</td>
                        <td className="px-5 py-3 text-[13px] text-muted-foreground whitespace-nowrap">{customer.email}</td>
                        <td className="px-5 py-3 text-[13px] tabular-nums text-center">{customer.bidsInPrev}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            customer.involvementType === "גם וגם"
                              ? "bg-primary/10 text-primary"
                              : customer.involvementType === "לייב"
                              ? "bg-accent text-accent-foreground"
                              : "bg-secondary text-secondary-foreground"
                          }`}>
                            {customer.involvementType}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[13px] tabular-nums text-center">{customer.lotsInvolved}</td>
                        <td className="px-5 py-3 text-[13px] tabular-nums font-semibold">{customer.maxBidAmount}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${customer.wonInPrev ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground"}`}>
                            {customer.wonInPrev ? "כן" : "לא"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-[13px] text-muted-foreground tabular-nums whitespace-nowrap">{customer.firstBidEver}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          );
        })()}
      </InvestigationPanel>

      {/* Involved & Winners investigation panel */}
      <InvestigationPanel
        open={involvedDrawerOpen}
        onClose={() => { setInvolvedDrawerOpen(false); setInvolvedSearch(""); setInvolvedFilter("all"); }}
        title={involvedDrawerData ? `מעורבים וזוכים — מכירה ${involvedDrawerData.saleNumber}` : ""}
        subtitle={involvedDrawerData ? `מותג: ${brandLabel}` : ""}
      >
        {involvedDrawerData && (() => {
          const baseCustomers = involvedDrawerType === "winners"
            ? involvedDrawerData.customers.filter(c => c.status === "זוכה")
            : involvedDrawerData.customers;
          const filtered = baseCustomers.filter(c => {
            const matchSearch = !involvedSearch || c.name.includes(involvedSearch) || c.email.toLowerCase().includes(involvedSearch.toLowerCase());
            const matchFilter = involvedFilter === "all" || c.involvementType === involvedFilter;
            return matchSearch && matchFilter;
          });
          return (
            <>
              {/* Segmented toggle + summary */}
              <div className="px-10 py-6 border-b border-border/40 shrink-0 space-y-5">
                <div className="inline-flex items-center bg-secondary/50 rounded-lg p-1 border border-border/40">
                  <button
                    onClick={() => setInvolvedDrawerType("involved")}
                    className={`px-7 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
                      involvedDrawerType === "involved"
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    מעורבים
                  </button>
                  <button
                    onClick={() => setInvolvedDrawerType("winners")}
                    className={`px-7 py-2 text-sm font-semibold rounded-md transition-all duration-200 ${
                      involvedDrawerType === "winners"
                        ? "shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    style={involvedDrawerType === "winners" ? { backgroundColor: "hsl(38, 65%, 52%)", color: "white" } : {}}
                  >
                    זוכים
                  </button>
                </div>

                {involvedDrawerType === "involved" ? (
                  <div className="grid grid-cols-3 gap-5">
                    <div className="rounded-xl border border-border/50 bg-secondary/30 p-5 text-center">
                      <div className="text-2xl font-bold text-foreground tracking-tight">{involvedDrawerData.involved}</div>
                      <div className="text-[11px] text-muted-foreground mt-2 font-medium">מעורבים במכירה</div>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-secondary/30 p-5 text-center">
                      <div className="text-2xl font-bold tracking-tight" style={{ color: "hsl(38, 65%, 52%)" }}>{involvedDrawerData.winners}</div>
                      <div className="text-[11px] text-muted-foreground mt-2 font-medium">זוכים במכירה</div>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-secondary/30 p-5 text-center">
                      <div className="text-2xl font-bold text-foreground tracking-tight">{involvedDrawerData.involved - involvedDrawerData.winners}</div>
                      <div className="text-[11px] text-muted-foreground mt-2 font-medium">לא זכו</div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-5 max-w-md">
                    <div className="rounded-xl border border-border/50 bg-secondary/30 p-5 text-center">
                      <div className="text-2xl font-bold tracking-tight" style={{ color: "hsl(38, 65%, 52%)" }}>{involvedDrawerData.winners}</div>
                      <div className="text-[11px] text-muted-foreground mt-2 font-medium">זוכים במכירה</div>
                    </div>
                    <div className="rounded-xl border border-border/50 bg-secondary/30 p-5 text-center">
                      <div className="text-2xl font-bold text-foreground tracking-tight">{involvedDrawerData.customers.filter(c => c.status === "זוכה").reduce((sum, c) => sum + (c.lotsWon ?? 0), 0)}</div>
                      <div className="text-[11px] text-muted-foreground mt-2 font-medium">לוטים שנזכו</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Search + filter bar */}
              <div className="px-10 py-4 flex items-center gap-4 border-b border-border/30 shrink-0">
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="חיפוש לפי שם או אימייל..."
                    value={involvedSearch}
                    onChange={e => setInvolvedSearch(e.target.value)}
                    className="w-full pr-10 pl-4 py-2 rounded-lg bg-secondary/40 border border-border/50 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
                  />
                </div>
                <div className="flex items-center gap-1.5 bg-secondary/40 rounded-lg p-0.5 border border-border/40">
                  {["all", "מוקדם", "לייב", "גם וגם"].map(f => (
                    <button
                      key={f}
                      onClick={() => setInvolvedFilter(f)}
                      className={`px-3.5 py-1.5 text-[12px] font-medium rounded-md transition-all ${
                        involvedFilter === f
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {f === "all" ? "הכל" : f}
                    </button>
                  ))}
                </div>
                <span className="text-[12px] text-muted-foreground mr-auto">{filtered.length} לקוחות</span>
              </div>

              {/* Table */}
              <div className="flex-1 overflow-auto">
                {involvedDrawerType === "winners" ? (
                  <table className="w-full text-sm" dir="rtl">
                    <thead className="sticky top-0 z-10 bg-card border-b-2 border-border/50">
                      <tr>
                        <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">שם לקוח</th>
                        <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">אימייל</th>
                        <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">לוטים<br />שזכה</th>
                        <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">סכום זכייה<br />כולל</th>
                        <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">מס׳ בידים<br />במכירה זו</th>
                        <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">סוג מעורבות<br />במכירה זו</th>
                        <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">ביד ראשון<br />במותג</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((customer, idx) => (
                        <tr key={idx} className={`cursor-pointer transition-colors hover:bg-accent/30 ${idx % 2 === 1 ? "bg-secondary/15" : ""}`}>
                          <td className="px-5 py-3 font-medium text-[13px] whitespace-nowrap">{customer.name}</td>
                          <td className="px-5 py-3 text-[13px] text-muted-foreground whitespace-nowrap">{customer.email}</td>
                          <td className="px-5 py-3 text-[13px] tabular-nums text-center">{customer.lotsWon ?? "—"}</td>
                          <td className="px-5 py-3 text-[13px] tabular-nums font-semibold">{customer.totalWinAmount ?? "—"}</td>
                          <td className="px-5 py-3 text-[13px] tabular-nums text-center">{customer.bids}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              customer.involvementType === "גם וגם"
                                ? "bg-primary/10 text-primary"
                                : customer.involvementType === "לייב"
                                ? "bg-accent text-accent-foreground"
                                : "bg-secondary text-secondary-foreground"
                            }`}>
                              {customer.involvementType}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-[13px] text-muted-foreground tabular-nums whitespace-nowrap">{customer.firstBidEver}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <table className="w-full text-sm" dir="rtl">
                    <thead className="sticky top-0 z-10 bg-card border-b-2 border-border/50">
                      <tr>
                        <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">שם לקוח</th>
                        <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">אימייל</th>
                        <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">מס׳ בידים<br />במכירה זו</th>
                        <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">סוג מעורבות<br />במכירה זו</th>
                        <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">מס׳ לוטים שבהם<br />היה מעורב במכירה זו</th>
                        <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">ביד מקסימלי<br />במכירה זו</th>
                        <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">זכה<br />במכירה זו</th>
                        <th className="text-right text-[11px] font-bold text-muted-foreground px-5 py-3.5 leading-[1.45]">ביד ראשון<br />במותג</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((customer, idx) => (
                        <tr key={idx} className={`cursor-pointer transition-colors hover:bg-accent/30 ${idx % 2 === 1 ? "bg-secondary/15" : ""}`}>
                          <td className="px-5 py-3 font-medium text-[13px] whitespace-nowrap">{customer.name}</td>
                          <td className="px-5 py-3 text-[13px] text-muted-foreground whitespace-nowrap">{customer.email}</td>
                          <td className="px-5 py-3 text-[13px] tabular-nums text-center">{customer.bids}</td>
                          <td className="px-5 py-3">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                              customer.involvementType === "גם וגם"
                                ? "bg-primary/10 text-primary"
                                : customer.involvementType === "לייב"
                                ? "bg-accent text-accent-foreground"
                                : "bg-secondary text-secondary-foreground"
                            }`}>
                              {customer.involvementType}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-[13px] tabular-nums text-center">{customer.lotsInvolved}</td>
                          <td className="px-5 py-3 text-[13px] tabular-nums font-semibold">{customer.maxBidAmount}</td>
                          <td className="px-5 py-3 text-center">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${customer.status === "זוכה" ? "bg-green-100 text-green-700" : "bg-secondary text-muted-foreground"}`}>
                              {customer.status === "זוכה" ? "כן" : "לא"}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-[13px] text-muted-foreground tabular-nums whitespace-nowrap">{customer.firstBidEver}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          );
        })()}
      </InvestigationPanel>
    </div>
  );
}
