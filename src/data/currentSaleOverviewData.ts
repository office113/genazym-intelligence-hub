// Mock snapshot data: each sale has daily D-X snapshots
export interface SaleSnapshot {
  saleId: string;
  saleName: string;
  brand: "גנזים" | "זיידי";
  saleDate: string;
  totalLots: number;
  dx: number; // D-30 to D-0
  earlyBids: number;
  uniqueBidders: number;
  lotsWithBids: number;
  lotsBidPct: number; // percentage
  guaranteedPrice: number;
  newRegistrants28d: number;
  newBidders: number;
  newBiddersFromOtherBrand: number;
}

export interface DrillDownCustomer {
  name: string;
  email: string;
  firstBidDate: string;
  maxHistoricalBid: string;
  totalWins: number;
  lastActiveSale: string;
  registrationDate?: string;
  activeInOtherBrand?: boolean;
  // For uniqueBidders drill-down
  engagementType?: "מוקדם" | "לייב" | "גם וגם";
  bidsCount?: number;
  lotsWithBidCount?: number;
  maxBidAmount?: string;
  wonAtEnd?: boolean;
  // For newBiddersFromOtherBrand drill-down
  otherBrandName?: string;
  firstActivityOtherBrand?: string;
  maxBidOtherBrand?: string;
  winsOtherBrand?: number;
}

// Helper to generate realistic cumulative snapshot data
function generateSnapshots(
  saleId: string,
  saleName: string,
  brand: "גנזים" | "זיידי",
  saleDate: string,
  totalLots: number,
  finalBids: number,
  finalBidders: number,
  finalLotsWithBids: number,
  finalGuaranteed: number,
  finalNewReg: number,
  finalNewBidders: number,
  finalNewFromOther: number,
): SaleSnapshot[] {
  const snapshots: SaleSnapshot[] = [];
  for (let dx = 30; dx >= 0; dx--) {
    const progress = 1 - dx / 30;
    // Use an S-curve for realistic accumulation
    const sCurve = 1 / (1 + Math.exp(-8 * (progress - 0.6)));
    const noise = 0.95 + Math.random() * 0.1;
    
    const earlyBids = Math.round(finalBids * sCurve * noise);
    const uniqueBidders = Math.round(finalBidders * sCurve * noise);
    const lotsWithBids = Math.round(finalLotsWithBids * sCurve * noise);
    const guaranteedPrice = Math.round(finalGuaranteed * sCurve * noise);
    const newReg = Math.round(finalNewReg * Math.min(1, progress * 1.2) * noise);
    const newBidders = Math.round(finalNewBidders * sCurve * noise);
    const newFromOther = Math.round(finalNewFromOther * sCurve * noise);

    snapshots.push({
      saleId,
      saleName,
      brand,
      saleDate,
      totalLots,
      dx,
      earlyBids,
      uniqueBidders,
      lotsWithBids,
      lotsBidPct: totalLots > 0 ? Math.round((lotsWithBids / totalLots) * 100) : 0,
      guaranteedPrice,
      newRegistrants28d: newReg,
      newBidders,
      newBiddersFromOtherBrand: newFromOther,
    });
  }
  return snapshots;
}

export const allSaleSnapshots: SaleSnapshot[] = [
  // ── גנזים sales (consecutive: #42 through #48) ──
  ...generateSnapshots("G048", "מכירה #48", "גנזים", "2025-03-25", 310, 420, 185, 248, 1850000, 52, 38, 12),
  ...generateSnapshots("G047", "מכירה #47", "גנזים", "2024-12-15", 320, 510, 198, 272, 2120000, 45, 35, 10),
  ...generateSnapshots("G046", "מכירה #46", "גנזים", "2024-08-10", 350, 580, 225, 298, 2450000, 52, 42, 15),
  ...generateSnapshots("G045", "מכירה #45", "גנזים", "2024-04-18", 290, 465, 178, 235, 1780000, 48, 32, 11),
  ...generateSnapshots("G044", "מכירה #44", "גנזים", "2023-12-05", 280, 440, 168, 225, 1650000, 42, 30, 9),
  ...generateSnapshots("G043", "מכירה #43", "גנזים", "2023-08-20", 260, 395, 155, 210, 1520000, 38, 26, 8),
  // Hidden predecessor for color comparison
  ...generateSnapshots("G042", "מכירה #42", "גנזים", "2023-04-25", 245, 360, 142, 196, 1410000, 34, 22, 7),

  // ── זיידי sales (consecutive: #29 through #35) ──
  ...generateSnapshots("Z035", "מכירה #35", "זיידי", "2025-04-10", 190, 295, 118, 155, 710000, 40, 30, 9),
  ...generateSnapshots("Z034", "מכירה #34", "זיידי", "2024-10-20", 180, 285, 112, 148, 680000, 38, 28, 8),
  ...generateSnapshots("Z033", "מכירה #33", "זיידי", "2024-06-05", 160, 240, 98, 128, 520000, 34, 22, 6),
  ...generateSnapshots("Z032", "מכירה #32", "זיידי", "2024-02-12", 150, 210, 88, 118, 480000, 30, 20, 5),
  ...generateSnapshots("Z031", "מכירה #31", "זיידי", "2023-10-15", 140, 195, 82, 108, 420000, 28, 18, 4),
  ...generateSnapshots("Z030", "מכירה #30", "זיידי", "2023-06-18", 132, 176, 76, 99, 398000, 24, 16, 4),
  // Hidden predecessor for color comparison
  ...generateSnapshots("Z029", "מכירה #29", "זיידי", "2023-02-10", 125, 160, 70, 92, 365000, 20, 14, 3),
];

export const currentSaleId = "G048";

export const salesList = [
  // גנזים (consecutive #42–#48)
  { id: "G048", name: "מכירה #48", brand: "גנזים" as const, date: "2025-03-25", isCurrent: true },
  { id: "G047", name: "מכירה #47", brand: "גנזים" as const, date: "2024-12-15", isCurrent: false },
  { id: "G046", name: "מכירה #46", brand: "גנזים" as const, date: "2024-08-10", isCurrent: false },
  { id: "G045", name: "מכירה #45", brand: "גנזים" as const, date: "2024-04-18", isCurrent: false },
  { id: "G044", name: "מכירה #44", brand: "גנזים" as const, date: "2023-12-05", isCurrent: false },
  { id: "G043", name: "מכירה #43", brand: "גנזים" as const, date: "2023-08-20", isCurrent: false },
  { id: "G042", name: "מכירה #42", brand: "גנזים" as const, date: "2023-04-25", isCurrent: false },
  // זיידי (consecutive #29–#35)
  { id: "Z035", name: "מכירה #35", brand: "זיידי" as const, date: "2025-04-10", isCurrent: true },
  { id: "Z034", name: "מכירה #34", brand: "זיידי" as const, date: "2024-10-20", isCurrent: false },
  { id: "Z033", name: "מכירה #33", brand: "זיידי" as const, date: "2024-06-05", isCurrent: false },
  { id: "Z032", name: "מכירה #32", brand: "זיידי" as const, date: "2024-02-12", isCurrent: false },
  { id: "Z031", name: "מכירה #31", brand: "זיידי" as const, date: "2023-10-15", isCurrent: false },
  { id: "Z030", name: "מכירה #30", brand: "זיידי" as const, date: "2023-06-18", isCurrent: false },
  { id: "Z029", name: "מכירה #29", brand: "זיידי" as const, date: "2023-02-10", isCurrent: false },
];

// Drill-down mock customers
export const drillDownCustomers: Record<string, DrillDownCustomer[]> = {
  uniqueBidders: [
    { name: "אברהם גולדשטיין", email: "a.gold@email.com", firstBidDate: "2021-03-15", maxHistoricalBid: "$22,000", totalWins: 42, lastActiveSale: "מכירה #48", registrationDate: "2021-01-10", engagementType: "גם וגם", bidsCount: 14, lotsWithBidCount: 8, maxBidAmount: "$6,200", wonAtEnd: true },
    { name: "משה כהן", email: "m.cohen@email.com", firstBidDate: "2022-07-20", maxHistoricalBid: "$8,500", totalWins: 28, lastActiveSale: "מכירה #48", registrationDate: "2022-06-01", engagementType: "מוקדם", bidsCount: 7, lotsWithBidCount: 5, maxBidAmount: "$3,800", wonAtEnd: false },
    { name: "יצחק לוי", email: "y.levi@email.com", firstBidDate: "2020-11-02", maxHistoricalBid: "$35,000", totalWins: 65, lastActiveSale: "מכירה #47", registrationDate: "2020-10-15", engagementType: "לייב", bidsCount: 22, lotsWithBidCount: 12, maxBidAmount: "$12,500", wonAtEnd: true },
    { name: "דוד פרידמן", email: "d.friedman@email.com", firstBidDate: "2023-01-10", maxHistoricalBid: "$4,200", totalWins: 12, lastActiveSale: "מכירה #48", registrationDate: "2022-12-20", engagementType: "מוקדם", bidsCount: 3, lotsWithBidCount: 2, maxBidAmount: "$2,100", wonAtEnd: false },
    { name: "שלמה רוזנברג", email: "s.rosen@email.com", firstBidDate: "2019-06-22", maxHistoricalBid: "$48,000", totalWins: 98, lastActiveSale: "מכירה #47", registrationDate: "2019-05-01", engagementType: "גם וגם", bidsCount: 31, lotsWithBidCount: 18, maxBidAmount: "$15,000", wonAtEnd: true },
    { name: "חיים ויסמן", email: "c.weisman@email.com", firstBidDate: "2021-05-18", maxHistoricalBid: "$12,000", totalWins: 18, lastActiveSale: "מכירה #48", registrationDate: "2021-04-02", engagementType: "לייב", bidsCount: 9, lotsWithBidCount: 6, maxBidAmount: "$4,500", wonAtEnd: true },
    { name: "נתן שטרן", email: "n.stern@email.com", firstBidDate: "2020-08-11", maxHistoricalBid: "$18,500", totalWins: 55, lastActiveSale: "מכירה #48", registrationDate: "2020-07-20", engagementType: "מוקדם", bidsCount: 11, lotsWithBidCount: 7, maxBidAmount: "$5,800", wonAtEnd: false },
  ],
  lotsWithBids: [
    { name: "ספר נועם אלימלך - מהדורה ראשונה", email: "", firstBidDate: "D-18", maxHistoricalBid: "$22,000", totalWins: 12, lastActiveSale: "מכירה #48" },
    { name: "כתב יד על קלף - תהלים עם פירוש", email: "", firstBidDate: "D-15", maxHistoricalBid: "$10,500", totalWins: 5, lastActiveSale: "מכירה #48" },
    { name: "הגדה של פסח מאוירת - אמסטרדם 1695", email: "", firstBidDate: "D-12", maxHistoricalBid: "$28,000", totalWins: 8, lastActiveSale: "מכירה #48" },
    { name: "שולחן ערוך - דפוס ראשון, ונציה 1565", email: "", firstBidDate: "D-8", maxHistoricalBid: "$35,000", totalWins: 3, lastActiveSale: "מכירה #48" },
  ],
  newBidders: [
    { name: "רפאל דיאמנט", email: "r.diamant@email.com", firstBidDate: "2025-03-08", maxHistoricalBid: "$3,200", totalWins: 0, lastActiveSale: "מכירה #48", registrationDate: "2025-02-28", activeInOtherBrand: false, bidsCount: 4, lotsWithBidCount: 3, maxBidAmount: "$3,200" },
    { name: "עמנואל בלוך", email: "e.bloch@email.com", firstBidDate: "2025-03-12", maxHistoricalBid: "$1,800", totalWins: 0, lastActiveSale: "מכירה #48", registrationDate: "2025-03-01", activeInOtherBrand: true, bidsCount: 2, lotsWithBidCount: 2, maxBidAmount: "$1,800" },
    { name: "יונתן שפירא", email: "y.shapira@email.com", firstBidDate: "2025-03-05", maxHistoricalBid: "$5,500", totalWins: 0, lastActiveSale: "מכירה #48", registrationDate: "2025-02-25", activeInOtherBrand: false, bidsCount: 6, lotsWithBidCount: 4, maxBidAmount: "$5,500" },
    { name: "אהרון קופרמן", email: "a.kuperman@email.com", firstBidDate: "2025-03-10", maxHistoricalBid: "$2,400", totalWins: 0, lastActiveSale: "מכירה #48", registrationDate: "2025-03-02", activeInOtherBrand: true, bidsCount: 3, lotsWithBidCount: 2, maxBidAmount: "$2,400" },
    { name: "בנימין הרשקוביץ", email: "b.hersh@email.com", firstBidDate: "2025-03-14", maxHistoricalBid: "$4,100", totalWins: 0, lastActiveSale: "מכירה #48", registrationDate: "2025-03-05", activeInOtherBrand: false, bidsCount: 5, lotsWithBidCount: 3, maxBidAmount: "$4,100" },
  ],
  newBiddersFromOtherBrand: [
    { name: "עמנואל בלוך", email: "e.bloch@email.com", firstBidDate: "2025-03-12", maxHistoricalBid: "$1,800", totalWins: 0, lastActiveSale: "מכירה #48", registrationDate: "2025-03-01", activeInOtherBrand: true, otherBrandName: "זיידי", firstActivityOtherBrand: "2024-08-15", maxBidOtherBrand: "$4,200", winsOtherBrand: 3 },
    { name: "אהרון קופרמן", email: "a.kuperman@email.com", firstBidDate: "2025-03-10", maxHistoricalBid: "$2,400", totalWins: 0, lastActiveSale: "מכירה #48", registrationDate: "2025-03-02", activeInOtherBrand: true, otherBrandName: "זיידי", firstActivityOtherBrand: "2024-05-20", maxBidOtherBrand: "$6,800", winsOtherBrand: 7 },
    { name: "מנחם פלדמן", email: "m.feldman@email.com", firstBidDate: "2025-03-06", maxHistoricalBid: "$3,500", totalWins: 0, lastActiveSale: "מכירה #48", registrationDate: "2025-02-20", activeInOtherBrand: true, otherBrandName: "זיידי", firstActivityOtherBrand: "2023-11-10", maxBidOtherBrand: "$8,500", winsOtherBrand: 12 },
  ],
};
