export interface BookRecord {
  id: string;
  lotNumber: number;
  title: string;
  descriptionHe: string;
  descriptionEn: string;
  author: string;
  year: string;
  origin: string;
  brand: string;
  saleNumber: number;
  saleName: string;
  openingPrice: number;
  finalPrice: number | null;
  sold: boolean;
  tags: string[];
  communities: string[];
  uniqueness: string[];
  bidsCount: number;
  involvedCustomers: number;
  winnerName: string | null;
  winnerId: string | null;
  bookIdBidspirit?: string;
}

export interface BookBidder {
  bookId: string;
  customerId: string;
  customerName: string;
  bidType: "early" | "live" | "winner";
  bidsOnBook: number;
  maxBid: number;
  lastActivityDate: string;
  won: boolean;
  previousSalesInvolved: string[];
}

export const booksDatabase: BookRecord[] = [
  {
    id: "B001", lotNumber: 12, title: "כתב יד על קלף - תהלים עם פירוש", 
    descriptionHe: "כתב יד מרשים על קלף עם פירוש ייחודי לספר תהלים, כולל איורים מזרחיים נדירים. מאה ה-15.",
    descriptionEn: "Impressive vellum manuscript with unique commentary on Psalms, featuring rare oriental illustrations. 15th century.",
    author: "לא ידוע", year: 1480, origin: "תימן", brand: "גנזים", saleNumber: 48, saleName: "מכירה #48",
    openingPrice: 8000, finalPrice: null, sold: false,
    tags: ["קלף", "תהלים", "מזרחי", "איורים", "כתב יד"],
    communities: ["תימן", "מזרח"], uniqueness: ["כתב יד מקורי", "איורים נדירים"],
    bidsCount: 5, involvedCustomers: 4, winnerName: null, winnerId: null,
  },
  {
    id: "B002", lotNumber: 34, title: "הגדה של פסח מאוירת - אמסטרדם 1695",
    descriptionHe: "הגדה נדירה עם חריטות נחושת מקוריות. אחד מהעותקים הבודדים ששרדו בשלמות.",
    descriptionEn: "Rare Haggadah with original copper engravings. One of the few surviving complete copies.",
    author: "אברהם בר יעקב", year: 1695, origin: "הולנד", brand: "גנזים", saleNumber: 48, saleName: "מכירה #48",
    openingPrice: 15000, finalPrice: null, sold: false,
    tags: ["הגדה", "אמסטרדם", "איורי נחושת", "נדיר"],
    communities: ["אשכנז", "הולנד"], uniqueness: ["חריטות מקוריות", "שלמות מלאה"],
    bidsCount: 8, involvedCustomers: 6, winnerName: null, winnerId: null,
  },
  {
    id: "B003", lotNumber: 45, title: "ספר נועם אלימלך - מהדורה ראשונה",
    descriptionHe: "מהדורה ראשונה של הספר הקדוש נועם אלימלך, לבוב תקמ\"ז. מצב טוב מאוד, עם הגהות בכתב יד.",
    descriptionEn: "First edition of the holy book Noam Elimelech, Lvov 1787. Very good condition with handwritten glosses.",
    author: "ר' אלימלך מליז'ענסק", year: 1787, origin: "פולין", brand: "גנזים", saleNumber: 48, saleName: "מכירה #48",
    openingPrice: 20000, finalPrice: null, sold: false,
    tags: ["חסידות", "מהדורה ראשונה", "נדיר מאוד", "הגהות"],
    communities: ["חסידות", "גליציה"], uniqueness: ["מהדורה ראשונה", "הגהות בכתב יד"],
    bidsCount: 12, involvedCustomers: 8, winnerName: null, winnerId: null,
  },
  {
    id: "B004", lotNumber: 78, title: "שולחן ערוך - דפוס ראשון, ונציה 1565",
    descriptionHe: "דפוס ראשון של השולחן ערוך, ונציה שכ\"ה. פריט מוזיאלי ביותר.",
    descriptionEn: "First edition of the Shulchan Aruch, Venice 1565. Museum-quality item.",
    author: "ר' יוסף קארו", year: 1565, origin: "איטליה", brand: "גנזים", saleNumber: 48, saleName: "מכירה #48",
    openingPrice: 30000, finalPrice: null, sold: false,
    tags: ["הלכה", "ונציה", "דפוס ראשון", "מוזיאלי"],
    communities: ["ספרד", "איטליה"], uniqueness: ["דפוס ראשון", "פריט מוזיאלי"],
    bidsCount: 3, involvedCustomers: 3, winnerName: null, winnerId: null,
  },
  {
    id: "B005", lotNumber: 91, title: "אוסף דפוסי סלאוויטא וזיטאמיר",
    descriptionHe: "אוסף של 12 כרכים מדפוסי סלאוויטא וזיטאמיר. כולל פריטים נדירים ביותר.",
    descriptionEn: "Collection of 12 volumes from Slavita and Zhitomir presses. Includes extremely rare items.",
    author: "שפירא", year: 1820, origin: "אוקראינה", brand: "גנזים", saleNumber: 48, saleName: "מכירה #48",
    openingPrice: 5000, finalPrice: null, sold: false,
    tags: ["סלאוויטא", "זיטאמיר", "חסידות", "אוסף"],
    communities: ["חסידות", "אוקראינה"], uniqueness: ["אוסף שלם", "דפוס סלאוויטא"],
    bidsCount: 2, involvedCustomers: 2, winnerName: null, winnerId: null,
  },
  {
    id: "B006", lotNumber: 102, title: "תלמוד בבלי - דפוס בומברג",
    descriptionHe: "כרך מדפוס בומברג הנודע, ונציה. מצב משומר היטב.",
    descriptionEn: "Volume from the renowned Bomberg press, Venice. Well-preserved condition.",
    author: "דניאל בומברג", year: 1523, origin: "איטליה", brand: "גנזים", saleNumber: 48, saleName: "מכירה #48",
    openingPrice: 12000, finalPrice: null, sold: false,
    tags: ["תלמוד", "בומברג", "ונציה", "דפוס מוקדם"],
    communities: ["אשכנז", "איטליה"], uniqueness: ["דפוס בומברג", "שימור מצוין"],
    bidsCount: 6, involvedCustomers: 5, winnerName: null, winnerId: null,
  },
  // Past sold books - Sale #47
  {
    id: "B007", lotNumber: 15, title: "סידור עם כוונות האר\"י - דפוס ראשון",
    descriptionHe: "סידור עם כוונות האר\"י הקדוש, דפוס ראשון. פריט נדיר ביותר עם הערות בשולי הדף.",
    descriptionEn: "Prayer book with Kabbalistic intentions of the Arizal, first edition. Extremely rare with marginal notes.",
    author: "ר' חיים ויטאל", year: 1620, origin: "טורקיה", brand: "גנזים", saleNumber: 47, saleName: "מכירה #47",
    openingPrice: 25000, finalPrice: 42000, sold: true,
    tags: ["קבלה", "סידור", "דפוס ראשון", "האר\"י"],
    communities: ["ספרד", "קבלה"], uniqueness: ["דפוס ראשון", "הערות שוליים"],
    bidsCount: 18, involvedCustomers: 11, winnerName: "שלמה רוזנברג", winnerId: "C005",
  },
  {
    id: "B008", lotNumber: 28, title: "ספר הזוהר - מנטובה 1558",
    descriptionHe: "מהדורה מוקדמת של ספר הזוהר, דפוס מנטובה. שלם בכל חלקיו.",
    descriptionEn: "Early edition of the Zohar, Mantua press. Complete in all parts.",
    author: "ר' שמעון בר יוחאי", year: 1558, origin: "איטליה", brand: "גנזים", saleNumber: 47, saleName: "מכירה #47",
    openingPrice: 18000, finalPrice: 31000, sold: true,
    tags: ["קבלה", "זוהר", "מנטובה", "שלם"],
    communities: ["ספרד", "קבלה", "איטליה"], uniqueness: ["מהדורה מוקדמת", "שלמות"],
    bidsCount: 14, involvedCustomers: 9, winnerName: "יצחק לוי", winnerId: "C003",
  },
  {
    id: "B009", lotNumber: 52, title: "מגילת אסתר על קלף - כתב יד מאויר",
    descriptionHe: "מגילת אסתר מאוירת על קלף, עם ציורים מרהיבים בצבעי זהב ותכלת. איטליה, המאה ה-18.",
    descriptionEn: "Illustrated Esther scroll on parchment, with stunning gold and azure paintings. Italy, 18th century.",
    author: "לא ידוע", year: 1740, origin: "איטליה", brand: "גנזים", saleNumber: 47, saleName: "מכירה #47",
    openingPrice: 10000, finalPrice: 16500, sold: true,
    tags: ["מגילה", "כתב יד", "איורים", "קלף", "זהב"],
    communities: ["איטליה", "ספרד"], uniqueness: ["איורי זהב", "מגילה שלמה"],
    bidsCount: 9, involvedCustomers: 7, winnerName: "נתן שטרן", winnerId: "C007",
  },
  {
    id: "B010", lotNumber: 8, title: "חומש עם רש\"י - דפוס שונצינו",
    descriptionHe: "חומש עם פירוש רש\"י מדפוס שונצינו. אחד הדפוסים העבריים המוקדמים ביותר.",
    descriptionEn: "Pentateuch with Rashi commentary from Soncino press. One of the earliest Hebrew prints.",
    author: "שלמה שונצינו", year: 1490, origin: "איטליה", brand: "זיידי", saleNumber: 35, saleName: "מכירה #35",
    openingPrice: 35000, finalPrice: 58000, sold: true,
    tags: ["חומש", "רש\"י", "שונצינו", "אינקונבולה"],
    communities: ["אשכנז", "איטליה"], uniqueness: ["אינקונבולה", "דפוס שונצינו"],
    bidsCount: 22, involvedCustomers: 14, winnerName: "אברהם גולדשטיין", winnerId: "C001",
  },
  {
    id: "B011", lotNumber: 63, title: "ספר חובות הלבבות - דפוס נאפולי",
    descriptionHe: "דפוס מוקדם של ספר חובות הלבבות, נאפולי. פריט ביבליוגרפי חשוב.",
    descriptionEn: "Early edition of Chovot HaLevavot, Naples. Important bibliographic item.",
    author: "ר' בחיי אבן פקודה", year: 1489, origin: "איטליה", brand: "זיידי", saleNumber: 35, saleName: "מכירה #35",
    openingPrice: 22000, finalPrice: 28000, sold: true,
    tags: ["מוסר", "אינקונבולה", "נאפולי", "ביבליוגרפי"],
    communities: ["ספרד"], uniqueness: ["אינקונבולה", "דפוס נאפולי"],
    bidsCount: 7, involvedCustomers: 5, winnerName: "חיים ויסמן", winnerId: "C006",
  },
  {
    id: "B012", lotNumber: 21, title: "תשובות הרמב\"ם - כתב יד",
    descriptionHe: "כתב יד של תשובות הרמב\"ם, כתיבה מזרחית. מאה ה-14 לערך.",
    descriptionEn: "Manuscript of Maimonides' Responsa, Oriental script. Circa 14th century.",
    author: "רמב\"ם", year: 1350, origin: "מצרים", brand: "גנזים", saleNumber: 46, saleName: "מכירה #46",
    openingPrice: 40000, finalPrice: 72000, sold: true,
    tags: ["כתב יד", "רמב\"ם", "תשובות", "מזרחי"],
    communities: ["מזרח", "מצרים"], uniqueness: ["כתב יד עתיק", "רמב\"ם"],
    bidsCount: 25, involvedCustomers: 15, winnerName: "שלמה רוזנברג", winnerId: "C005",
  },
  {
    id: "B013", lotNumber: 5, title: "ספר התניא - מהדורה ראשונה",
    descriptionHe: "מהדורה ראשונה של ספר התניא, סלאוויטא תקנ\"ז. נדיר ביותר.",
    descriptionEn: "First edition of the Tanya, Slavita 1797. Extremely rare.",
    author: "ר' שניאור זלמן מלאדי", year: 1797, origin: "אוקראינה", brand: "גנזים", saleNumber: 46, saleName: "מכירה #46",
    openingPrice: 50000, finalPrice: 95000, sold: true,
    tags: ["חסידות חב\"ד", "מהדורה ראשונה", "סלאוויטא", "נדיר"],
    communities: ["חב\"ד", "חסידות"], uniqueness: ["מהדורה ראשונה", "פריט מוזיאלי"],
    bidsCount: 30, involvedCustomers: 18, winnerName: "יצחק לוי", winnerId: "C003",
  },
  {
    id: "B014", lotNumber: 37, title: "הגדה של פסח - פראג 1526",
    descriptionHe: "הגדה נדירה מדפוס פראג. אחת ההגדות המודפסות הראשונות.",
    descriptionEn: "Rare Haggadah from Prague press. One of the earliest printed Haggadahs.",
    author: "גרשום כהן", year: 1526, origin: "צ'כיה", brand: "גנזים", saleNumber: 45, saleName: "מכירה #45",
    openingPrice: 60000, finalPrice: null, sold: false,
    tags: ["הגדה", "פראג", "דפוס מוקדם", "נדיר מאוד"],
    communities: ["אשכנז", "בוהמיה"], uniqueness: ["מהדפוסים הראשונים", "נדירות קיצונית"],
    bidsCount: 15, involvedCustomers: 10, winnerName: null, winnerId: null,
  },
];

export const bookBidders: BookBidder[] = [
  // B003 - נועם אלימלך
  { bookId: "B003", customerId: "C001", customerName: "אברהם גולדשטיין", bidType: "early", bidsOnBook: 3, maxBid: 22000, lastActivityDate: "2024-12-14 14:23", won: false, previousSalesInvolved: ["מכירה #47", "מכירה #46", "מכירה #44"] },
  { bookId: "B003", customerId: "C005", customerName: "שלמה רוזנברג", bidType: "early", bidsOnBook: 2, maxBid: 24000, lastActivityDate: "2024-12-13 18:30", won: false, previousSalesInvolved: ["מכירה #47", "מכירה #46", "מכירה #45"] },
  { bookId: "B003", customerId: "C003", customerName: "יצחק לוי", bidType: "live", bidsOnBook: 4, maxBid: 28000, lastActivityDate: "2024-12-14 16:00", won: false, previousSalesInvolved: ["מכירה #47", "מכירה #45"] },
  { bookId: "B003", customerId: "C007", customerName: "נתן שטרן", bidType: "early", bidsOnBook: 1, maxBid: 20500, lastActivityDate: "2024-12-12 09:15", won: false, previousSalesInvolved: ["מכירה #47", "מכירה #46"] },
  { bookId: "B003", customerId: "C004", customerName: "דוד פרידמן", bidType: "live", bidsOnBook: 2, maxBid: 21000, lastActivityDate: "2024-12-14 15:45", won: false, previousSalesInvolved: ["מכירה #47"] },
  // B002 - הגדה אמסטרדם
  { bookId: "B002", customerId: "C007", customerName: "נתן שטרן", bidType: "early", bidsOnBook: 3, maxBid: 19000, lastActivityDate: "2024-12-13 22:10", won: false, previousSalesInvolved: ["מכירה #47", "מכירה #46"] },
  { bookId: "B002", customerId: "C001", customerName: "אברהם גולדשטיין", bidType: "live", bidsOnBook: 2, maxBid: 17500, lastActivityDate: "2024-12-14 11:00", won: false, previousSalesInvolved: ["מכירה #47", "מכירה #46", "מכירה #44"] },
  { bookId: "B002", customerId: "C006", customerName: "חיים ויסמן", bidType: "early", bidsOnBook: 1, maxBid: 15500, lastActivityDate: "2024-12-12 14:20", won: false, previousSalesInvolved: ["מכירה #47"] },
  // B007 - סידור - sold
  { bookId: "B007", customerId: "C005", customerName: "שלמה רוזנברג", bidType: "winner", bidsOnBook: 5, maxBid: 42000, lastActivityDate: "2024-12-10 20:00", won: true, previousSalesInvolved: ["מכירה #46", "מכירה #45"] },
  { bookId: "B007", customerId: "C003", customerName: "יצחק לוי", bidType: "live", bidsOnBook: 4, maxBid: 40000, lastActivityDate: "2024-12-10 19:55", won: false, previousSalesInvolved: ["מכירה #46", "מכירה #45"] },
  { bookId: "B007", customerId: "C001", customerName: "אברהם גולדשטיין", bidType: "early", bidsOnBook: 2, maxBid: 30000, lastActivityDate: "2024-12-08 12:00", won: false, previousSalesInvolved: ["מכירה #46", "מכירה #44"] },
  // B008 - זוהר
  { bookId: "B008", customerId: "C003", customerName: "יצחק לוי", bidType: "winner", bidsOnBook: 6, maxBid: 31000, lastActivityDate: "2024-12-10 19:30", won: true, previousSalesInvolved: ["מכירה #46", "מכירה #45"] },
  { bookId: "B008", customerId: "C005", customerName: "שלמה רוזנברג", bidType: "live", bidsOnBook: 3, maxBid: 29000, lastActivityDate: "2024-12-10 19:25", won: false, previousSalesInvolved: ["מכירה #46", "מכירה #45"] },
  // B012 - רמב"ם
  { bookId: "B012", customerId: "C005", customerName: "שלמה רוזנברג", bidType: "winner", bidsOnBook: 8, maxBid: 72000, lastActivityDate: "2024-10-15 21:00", won: true, previousSalesInvolved: ["מכירה #45", "מכירה #44"] },
  { bookId: "B012", customerId: "C003", customerName: "יצחק לוי", bidType: "live", bidsOnBook: 5, maxBid: 68000, lastActivityDate: "2024-10-15 20:50", won: false, previousSalesInvolved: ["מכירה #45"] },
  { bookId: "B012", customerId: "C001", customerName: "אברהם גולדשטיין", bidType: "early", bidsOnBook: 3, maxBid: 50000, lastActivityDate: "2024-10-12 10:00", won: false, previousSalesInvolved: ["מכירה #45", "מכירה #44"] },
  // B013 - תניא
  { bookId: "B013", customerId: "C003", customerName: "יצחק לוי", bidType: "winner", bidsOnBook: 10, maxBid: 95000, lastActivityDate: "2024-10-15 22:00", won: true, previousSalesInvolved: ["מכירה #45"] },
  { bookId: "B013", customerId: "C005", customerName: "שלמה רוזנברג", bidType: "live", bidsOnBook: 7, maxBid: 90000, lastActivityDate: "2024-10-15 21:55", won: false, previousSalesInvolved: ["מכירה #45", "מכירה #44"] },
  { bookId: "B013", customerId: "C004", customerName: "דוד פרידמן", bidType: "early", bidsOnBook: 2, maxBid: 55000, lastActivityDate: "2024-10-10 14:00", won: false, previousSalesInvolved: ["מכירה #45"] },
  // B001 - כתב יד תהלים
  { bookId: "B001", customerId: "C005", customerName: "שלמה רוזנברג", bidType: "early", bidsOnBook: 2, maxBid: 10500, lastActivityDate: "2024-12-14 09:45", won: false, previousSalesInvolved: ["מכירה #47", "מכירה #46"] },
  { bookId: "B001", customerId: "C002", customerName: "משה כהן", bidType: "early", bidsOnBook: 1, maxBid: 8500, lastActivityDate: "2024-12-13 16:00", won: false, previousSalesInvolved: ["מכירה #47"] },
  // B004 - שולחן ערוך
  { bookId: "B004", customerId: "C003", customerName: "יצחק לוי", bidType: "early", bidsOnBook: 1, maxBid: 32000, lastActivityDate: "2024-12-11 11:30", won: false, previousSalesInvolved: ["מכירה #47", "מכירה #45"] },
  { bookId: "B004", customerId: "C006", customerName: "חיים ויסמן", bidType: "early", bidsOnBook: 1, maxBid: 30500, lastActivityDate: "2024-12-12 09:00", won: false, previousSalesInvolved: ["מכירה #47"] },
];
