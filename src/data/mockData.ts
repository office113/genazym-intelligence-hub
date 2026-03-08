export const pastSalesData = [
  { id: "S001", name: "מכירה #47", date: "2024-12-15", lots: 320, sold: 285, unsold: 35, revenue: 2850000, winners: 142, bidders: 298, newReg: 45 },
  { id: "S002", name: "מכירה #46", date: "2024-10-20", lots: 280, sold: 240, unsold: 40, revenue: 2100000, winners: 128, bidders: 265, newReg: 38 },
  { id: "S003", name: "מכירה #45", date: "2024-08-10", lots: 350, sold: 310, unsold: 40, revenue: 3200000, winners: 165, bidders: 340, newReg: 52 },
  { id: "S004", name: "מכירה #44", date: "2024-06-05", lots: 290, sold: 255, unsold: 35, revenue: 2400000, winners: 135, bidders: 280, newReg: 41 },
  { id: "S005", name: "מכירה #43", date: "2024-04-18", lots: 310, sold: 270, unsold: 40, revenue: 2650000, winners: 148, bidders: 310, newReg: 48 },
];

export const currentSaleDX = [
  { day: "D-14", current: 12, avg: 18, label: "הצעות" },
  { day: "D-12", current: 28, avg: 35, label: "הצעות" },
  { day: "D-10", current: 55, avg: 58, label: "הצעות" },
  { day: "D-8", current: 82, avg: 90, label: "הצעות" },
  { day: "D-6", current: 125, avg: 130, label: "הצעות" },
  { day: "D-4", current: 180, avg: 195, label: "הצעות" },
  { day: "D-2", current: 245, avg: 280, label: "הצעות" },
  { day: "D-0", current: 0, avg: 420, label: "הצעות" },
];

export const missingCustomers = [
  { id: "C001", name: "אברהם גולדשטיין", lastSale: "מכירה #46", avgBids: 12, usualDX: "D-10", status: "לא פעיל", phone: "050-1234567", totalSpend: 185000 },
  { id: "C002", name: "משה כהן", lastSale: "מכירה #47", avgBids: 8, usualDX: "D-8", status: "לא פעיל", phone: "052-7654321", totalSpend: 92000 },
  { id: "C003", name: "יצחק לוי", lastSale: "מכירה #45", avgBids: 15, usualDX: "D-12", status: "לא פעיל", phone: "054-9876543", totalSpend: 340000 },
  { id: "C004", name: "דוד פרידמן", lastSale: "מכירה #47", avgBids: 6, usualDX: "D-6", status: "לא פעיל", phone: "053-1112233", totalSpend: 55000 },
  { id: "C005", name: "שלמה רוזנברג", lastSale: "מכירה #46", avgBids: 20, usualDX: "D-14", status: "לא פעיל", phone: "058-4445566", totalSpend: 520000 },
];

export const customers = [
  { id: "C001", name: "אברהם גולדשטיין", city: "ירושלים", totalBids: 145, totalWins: 42, totalSpend: 185000, lastActive: "2024-12-10", segment: "VIP", interests: ["חסידות", "קבלה"] },
  { id: "C002", name: "משה כהן", city: "בני ברק", totalBids: 89, totalWins: 28, totalSpend: 92000, lastActive: "2024-12-14", segment: "פעיל", interests: ["הלכה", "גמרא"] },
  { id: "C003", name: "יצחק לוי", city: "לייקווד", totalBids: 210, totalWins: 65, totalSpend: 340000, lastActive: "2024-11-20", segment: "VIP", interests: ["כתבי יד", "דפוסים ראשונים"] },
  { id: "C004", name: "דוד פרידמן", city: "אנטוורפן", totalBids: 45, totalWins: 12, totalSpend: 55000, lastActive: "2024-12-13", segment: "רגיל", interests: ["חסידות חב\"ד"] },
  { id: "C005", name: "שלמה רוזנברג", city: "ניו יורק", totalBids: 320, totalWins: 98, totalSpend: 520000, lastActive: "2024-11-25", segment: "VIP", interests: ["כתבי יד", "חסידות", "קבלה"] },
  { id: "C006", name: "חיים ויסמן", city: "לונדון", totalBids: 67, totalWins: 18, totalSpend: 78000, lastActive: "2024-12-12", segment: "פעיל", interests: ["ביבליוגרפיה", "דפוסים ישנים"] },
  { id: "C007", name: "נתן שטרן", city: "ירושלים", totalBids: 156, totalWins: 55, totalSpend: 290000, lastActive: "2024-12-08", segment: "VIP", interests: ["הגדות", "איורים"] },
  { id: "C008", name: "אליהו ברגר", city: "מונסי", totalBids: 34, totalWins: 8, totalSpend: 42000, lastActive: "2024-10-15", segment: "רגיל", interests: ["גמרא", "ראשונים"] },
];

export const targetingRecommendations = [
  { id: "T001", customerId: "C001", customerName: "אברהם גולדשטיין", lotId: "L045", lotTitle: "ספר נועם אלימלך - מהדורה ראשונה", matchType: "ai" as const, confidence: 92, signals: ["הצעה נכשלת על אותו ספר במכירה #44", "רכישות חוזרות בקטגוריית חסידות", "טווח מחירים מתאים"], suggestedAction: "שיחה טלפונית" },
  { id: "T002", customerId: "C005", customerName: "שלמה רוזנברג", lotId: "L012", lotTitle: "כתב יד על קלף - תהלים עם פירוש", matchType: "rule" as const, confidence: 88, signals: ["3 רכישות קודמות של כתבי יד", "הצעה ממוצעת מעל $10,000", "מעקב אחר קטגוריה זו"], suggestedAction: "אימייל מותאם" },
  { id: "T003", customerId: "C003", customerName: "יצחק לוי", lotId: "L078", lotTitle: "דפוס ראשון - שולחן ערוך, ונציה 1565", matchType: "ai" as const, confidence: 95, signals: ["התמחות בדפוסים ראשונים", "ביקור חוזר בדף הפריט", "התאמה סמנטית גבוהה לתיאור"], suggestedAction: "שיחה טלפונית" },
  { id: "T004", customerId: "C007", customerName: "נתן שטרן", lotId: "L034", lotTitle: "הגדה של פסח מאוירת - אמסטרדם 1695", matchType: "ai" as const, confidence: 85, signals: ["אספן הגדות פעיל", "רכישה של 8 הגדות בעבר", "עניין באיורים היסטוריים"], suggestedAction: "הודעת וואטסאפ" },
  { id: "T005", customerId: "C006", customerName: "חיים ויסמן", lotId: "L091", lotTitle: "אוסף דפוסי סלאוויטא וזיטאמיר", matchType: "rule" as const, confidence: 78, signals: ["מומחה ביבליוגרפיה", "רכישות קודמות מדפוסי סלאוויטא"], suggestedAction: "אימייל מותאם" },
];

export const books = [
  { id: "L012", title: "כתב יד על קלף - תהלים עם פירוש", category: "כתבי יד", estimate: "$8,000-12,000", sale: "מכירה #48", bids: 5, watchers: 18, aiTags: ["קלף", "תהלים", "מזרחי", "איורים"] },
  { id: "L034", title: "הגדה של פסח מאוירת - אמסטרדם 1695", category: "הגדות", estimate: "$15,000-25,000", sale: "מכירה #48", bids: 8, watchers: 32, aiTags: ["הגדה", "אמסטרדם", "איורי נחושת", "נדיר"] },
  { id: "L045", title: "ספר נועם אלימלך - מהדורה ראשונה", category: "חסידות", estimate: "$20,000-35,000", sale: "מכירה #48", bids: 12, watchers: 45, aiTags: ["חסידות", "ר' אלימלך מליז'ענסק", "מהדורה ראשונה", "נדיר מאוד"] },
  { id: "L078", title: "שולחן ערוך - דפוס ראשון, ונציה 1565", category: "דפוסים ראשונים", estimate: "$30,000-50,000", sale: "מכירה #48", bids: 3, watchers: 28, aiTags: ["הלכה", "ר' יוסף קארו", "ונציה", "דפוס ראשון"] },
  { id: "L091", title: "אוסף דפוסי סלאוויטא וזיטאמיר", category: "דפוסים ישנים", estimate: "$5,000-8,000", sale: "מכירה #48", bids: 2, watchers: 14, aiTags: ["סלאוויטא", "זיטאמיר", "חסידות", "אוסף"] },
  { id: "L102", title: "תלמוד בבלי - דפוס בומברג", category: "גמרא", estimate: "$12,000-18,000", sale: "מכירה #48", bids: 6, watchers: 22, aiTags: ["תלמוד", "בומברג", "ונציה", "דפוס מוקדם"] },
];

export const consignors = [
  { id: "CON01", name: "עזבון הרב שלום אדלר", lots: 45, sold: 38, revenue: 420000, avgPrice: 11053, activeSales: 2 },
  { id: "CON02", name: "אוסף פרטי - מ. שפירא", lots: 28, sold: 25, revenue: 310000, avgPrice: 12400, activeSales: 1 },
  { id: "CON03", name: "ספריית בית המדרש - לונדון", lots: 62, sold: 50, revenue: 580000, avgPrice: 11600, activeSales: 3 },
  { id: "CON04", name: "אוסף כהנא", lots: 15, sold: 12, revenue: 180000, avgPrice: 15000, activeSales: 1 },
];

export const events = [
  { id: "E001", type: "bid", customer: "אברהם גולדשטיין", lot: "ספר נועם אלימלך", sale: "מכירה #48", timestamp: "2024-12-14 14:23", details: "הצעה $22,000" },
  { id: "E002", type: "registration", customer: "יעקב מלר", lot: null, sale: "מכירה #48", timestamp: "2024-12-14 13:15", details: "הרשמה חדשה" },
  { id: "E003", type: "watch", customer: "משה כהן", lot: "הגדה של פסח מאוירת", sale: "מכירה #48", timestamp: "2024-12-14 12:45", details: "הוסיף למעקב" },
  { id: "E004", type: "bid", customer: "יצחק לוי", lot: "שולחן ערוך - דפוס ראשון", sale: "מכירה #48", timestamp: "2024-12-14 11:30", details: "הצעה $35,000" },
  { id: "E005", type: "view", customer: "דוד פרידמן", lot: "ספר נועם אלימלך", sale: "מכירה #48", timestamp: "2024-12-14 10:20", details: "צפייה בדף פריט" },
  { id: "E006", type: "bid", customer: "שלמה רוזנברג", lot: "כתב יד על קלף - תהלים", sale: "מכירה #48", timestamp: "2024-12-14 09:45", details: "הצעה $10,500" },
  { id: "E007", type: "outbid", customer: "נתן שטרן", lot: "הגדה של פסח מאוירת", sale: "מכירה #48", timestamp: "2024-12-13 22:10", details: "הוצע מחיר גבוה יותר" },
  { id: "E008", type: "registration", customer: "רפאל דיאמנט", lot: null, sale: "מכירה #48", timestamp: "2024-12-13 20:30", details: "הרשמה חדשה" },
];

export const registrationFunnel = [
  { stage: "נרשמו", count: 485, pct: 100 },
  { stage: "צפו בקטלוג", count: 380, pct: 78 },
  { stage: "הוסיפו למעקב", count: 210, pct: 43 },
  { stage: "הציעו הצעה", count: 145, pct: 30 },
  { stage: "זכו בפריט", count: 68, pct: 14 },
];

export const saleComparisonChart = [
  { sale: "#43", revenue: 2650, lots: 310, sold: 270 },
  { sale: "#44", revenue: 2400, lots: 290, sold: 255 },
  { sale: "#45", revenue: 3200, lots: 350, sold: 310 },
  { sale: "#46", revenue: 2100, lots: 280, sold: 240 },
  { sale: "#47", revenue: 2850, lots: 320, sold: 285 },
];
