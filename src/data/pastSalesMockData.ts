// ─── Mock data matching expected fact_customer_auction_activity structure ───
// One row per customer per auction — used until Supabase permissions are resolved

export interface CustomerAuctionRow {
  customer_id: string;
  full_name: string;
  email: string;
  auction_name: string;
  auction_number: number;
  brand: string;
  bid_count: number;
  max_bid: number;
  lots_involved: number;
  involvement_type: "early" | "live" | "both";
  is_winner: boolean;
  win_count: number;
  total_win_value: number;
  first_bid_at_brand: string; // ISO date
}

export interface CustomerBrandRow {
  customer_id: string;
  full_name: string;
  email: string;
  brand: string;
  first_bid_at: string;
  last_bid_at: string;
  max_bid_ever: number;
  total_wins: number;
  total_win_value: number;
  days_since_last_bid: number;
  auctions_involved_count: number;
}

// ─── Genazym customers across 5 auctions ───
const genazymCustomers: CustomerAuctionRow[] = [
  // מכירה #47
  { customer_id: "C001", full_name: "אברהם גולדשטיין", email: "a.gold@mail.com", auction_name: "מכירה #47", auction_number: 47, brand: "genazym", bid_count: 18, max_bid: 22000, lots_involved: 8, involvement_type: "both", is_winner: true, win_count: 3, total_win_value: 45000, first_bid_at_brand: "2019-03-15" },
  { customer_id: "C003", full_name: "יצחק לוי", email: "y.levi@mail.com", auction_name: "מכירה #47", auction_number: 47, brand: "genazym", bid_count: 25, max_bid: 35000, lots_involved: 12, involvement_type: "both", is_winner: true, win_count: 5, total_win_value: 82000, first_bid_at_brand: "2018-06-20" },
  { customer_id: "C005", full_name: "שלמה רוזנברג", email: "s.rosen@mail.com", auction_name: "מכירה #47", auction_number: 47, brand: "genazym", bid_count: 32, max_bid: 48000, lots_involved: 15, involvement_type: "early", is_winner: true, win_count: 7, total_win_value: 125000, first_bid_at_brand: "2017-11-10" },
  { customer_id: "C007", full_name: "נתן שטרן", email: "n.stern@mail.com", auction_name: "מכירה #47", auction_number: 47, brand: "genazym", bid_count: 14, max_bid: 18000, lots_involved: 6, involvement_type: "live", is_winner: true, win_count: 2, total_win_value: 28000, first_bid_at_brand: "2020-01-22" },
  { customer_id: "C009", full_name: "מנחם פינקל", email: "m.finkel@mail.com", auction_name: "מכירה #47", auction_number: 47, brand: "genazym", bid_count: 8, max_bid: 9500, lots_involved: 4, involvement_type: "early", is_winner: false, win_count: 0, total_win_value: 0, first_bid_at_brand: "2021-05-18" },
  { customer_id: "C011", full_name: "יוסף קליין", email: "y.klein@mail.com", auction_name: "מכירה #47", auction_number: 47, brand: "genazym", bid_count: 6, max_bid: 7200, lots_involved: 3, involvement_type: "early", is_winner: false, win_count: 0, total_win_value: 0, first_bid_at_brand: "2022-09-05" },
  { customer_id: "C013", full_name: "אריה ברגמן", email: "a.berg@mail.com", auction_name: "מכירה #47", auction_number: 47, brand: "genazym", bid_count: 11, max_bid: 15000, lots_involved: 5, involvement_type: "both", is_winner: true, win_count: 2, total_win_value: 22000, first_bid_at_brand: "2019-08-12" },
  { customer_id: "C015", full_name: "דניאל הורוביץ", email: "d.horo@mail.com", auction_name: "מכירה #47", auction_number: 47, brand: "genazym", bid_count: 4, max_bid: 5500, lots_involved: 2, involvement_type: "live", is_winner: false, win_count: 0, total_win_value: 0, first_bid_at_brand: "2023-02-14" },

  // מכירה #46
  { customer_id: "C001", full_name: "אברהם גולדשטיין", email: "a.gold@mail.com", auction_name: "מכירה #46", auction_number: 46, brand: "genazym", bid_count: 15, max_bid: 19000, lots_involved: 7, involvement_type: "both", is_winner: true, win_count: 2, total_win_value: 32000, first_bid_at_brand: "2019-03-15" },
  { customer_id: "C002", full_name: "משה כהן", email: "m.cohen@mail.com", auction_name: "מכירה #46", auction_number: 46, brand: "genazym", bid_count: 10, max_bid: 12000, lots_involved: 5, involvement_type: "early", is_winner: true, win_count: 1, total_win_value: 12000, first_bid_at_brand: "2020-04-10" },
  { customer_id: "C003", full_name: "יצחק לוי", email: "y.levi@mail.com", auction_name: "מכירה #46", auction_number: 46, brand: "genazym", bid_count: 22, max_bid: 30000, lots_involved: 10, involvement_type: "both", is_winner: true, win_count: 4, total_win_value: 68000, first_bid_at_brand: "2018-06-20" },
  { customer_id: "C005", full_name: "שלמה רוזנברג", email: "s.rosen@mail.com", auction_name: "מכירה #46", auction_number: 46, brand: "genazym", bid_count: 28, max_bid: 42000, lots_involved: 13, involvement_type: "both", is_winner: true, win_count: 6, total_win_value: 110000, first_bid_at_brand: "2017-11-10" },
  { customer_id: "C004", full_name: "דוד פרידמן", email: "d.fried@mail.com", auction_name: "מכירה #46", auction_number: 46, brand: "genazym", bid_count: 5, max_bid: 6800, lots_involved: 3, involvement_type: "live", is_winner: false, win_count: 0, total_win_value: 0, first_bid_at_brand: "2021-12-01" },
  { customer_id: "C007", full_name: "נתן שטרן", email: "n.stern@mail.com", auction_name: "מכירה #46", auction_number: 46, brand: "genazym", bid_count: 12, max_bid: 16000, lots_involved: 5, involvement_type: "live", is_winner: true, win_count: 1, total_win_value: 16000, first_bid_at_brand: "2020-01-22" },
  { customer_id: "C009", full_name: "מנחם פינקל", email: "m.finkel@mail.com", auction_name: "מכירה #46", auction_number: 46, brand: "genazym", bid_count: 7, max_bid: 8500, lots_involved: 3, involvement_type: "early", is_winner: false, win_count: 0, total_win_value: 0, first_bid_at_brand: "2021-05-18" },

  // מכירה #45
  { customer_id: "C001", full_name: "אברהם גולדשטיין", email: "a.gold@mail.com", auction_name: "מכירה #45", auction_number: 45, brand: "genazym", bid_count: 20, max_bid: 25000, lots_involved: 9, involvement_type: "both", is_winner: true, win_count: 4, total_win_value: 55000, first_bid_at_brand: "2019-03-15" },
  { customer_id: "C003", full_name: "יצחק לוי", email: "y.levi@mail.com", auction_name: "מכירה #45", auction_number: 45, brand: "genazym", bid_count: 28, max_bid: 38000, lots_involved: 14, involvement_type: "both", is_winner: true, win_count: 6, total_win_value: 95000, first_bid_at_brand: "2018-06-20" },
  { customer_id: "C005", full_name: "שלמה רוזנברג", email: "s.rosen@mail.com", auction_name: "מכירה #45", auction_number: 45, brand: "genazym", bid_count: 35, max_bid: 52000, lots_involved: 16, involvement_type: "early", is_winner: true, win_count: 8, total_win_value: 140000, first_bid_at_brand: "2017-11-10" },
  { customer_id: "C002", full_name: "משה כהן", email: "m.cohen@mail.com", auction_name: "מכירה #45", auction_number: 45, brand: "genazym", bid_count: 12, max_bid: 14000, lots_involved: 6, involvement_type: "early", is_winner: true, win_count: 2, total_win_value: 24000, first_bid_at_brand: "2020-04-10" },
  { customer_id: "C006", full_name: "חיים ויסמן", email: "h.weiss@mail.com", auction_name: "מכירה #45", auction_number: 45, brand: "genazym", bid_count: 9, max_bid: 11000, lots_involved: 4, involvement_type: "live", is_winner: true, win_count: 1, total_win_value: 11000, first_bid_at_brand: "2019-10-05" },
  { customer_id: "C004", full_name: "דוד פרידמן", email: "d.fried@mail.com", auction_name: "מכירה #45", auction_number: 45, brand: "genazym", bid_count: 6, max_bid: 7500, lots_involved: 3, involvement_type: "live", is_winner: false, win_count: 0, total_win_value: 0, first_bid_at_brand: "2021-12-01" },
  { customer_id: "C007", full_name: "נתן שטרן", email: "n.stern@mail.com", auction_name: "מכירה #45", auction_number: 45, brand: "genazym", bid_count: 16, max_bid: 20000, lots_involved: 7, involvement_type: "both", is_winner: true, win_count: 3, total_win_value: 35000, first_bid_at_brand: "2020-01-22" },
  { customer_id: "C008", full_name: "אליהו ברגר", email: "e.berger@mail.com", auction_name: "מכירה #45", auction_number: 45, brand: "genazym", bid_count: 4, max_bid: 5000, lots_involved: 2, involvement_type: "early", is_winner: false, win_count: 0, total_win_value: 0, first_bid_at_brand: "2022-07-15" },
  { customer_id: "C010", full_name: "בנימין שפירא", email: "b.shapira@mail.com", auction_name: "מכירה #45", auction_number: 45, brand: "genazym", bid_count: 3, max_bid: 4200, lots_involved: 2, involvement_type: "early", is_winner: false, win_count: 0, total_win_value: 0, first_bid_at_brand: "2023-01-08" },

  // מכירה #44
  { customer_id: "C001", full_name: "אברהם גולדשטיין", email: "a.gold@mail.com", auction_name: "מכירה #44", auction_number: 44, brand: "genazym", bid_count: 16, max_bid: 21000, lots_involved: 7, involvement_type: "both", is_winner: true, win_count: 3, total_win_value: 42000, first_bid_at_brand: "2019-03-15" },
  { customer_id: "C003", full_name: "יצחק לוי", email: "y.levi@mail.com", auction_name: "מכירה #44", auction_number: 44, brand: "genazym", bid_count: 20, max_bid: 28000, lots_involved: 9, involvement_type: "both", is_winner: true, win_count: 4, total_win_value: 62000, first_bid_at_brand: "2018-06-20" },
  { customer_id: "C005", full_name: "שלמה רוזנברג", email: "s.rosen@mail.com", auction_name: "מכירה #44", auction_number: 44, brand: "genazym", bid_count: 30, max_bid: 45000, lots_involved: 14, involvement_type: "early", is_winner: true, win_count: 6, total_win_value: 115000, first_bid_at_brand: "2017-11-10" },
  { customer_id: "C002", full_name: "משה כהן", email: "m.cohen@mail.com", auction_name: "מכירה #44", auction_number: 44, brand: "genazym", bid_count: 8, max_bid: 10000, lots_involved: 4, involvement_type: "early", is_winner: true, win_count: 1, total_win_value: 10000, first_bid_at_brand: "2020-04-10" },
  { customer_id: "C006", full_name: "חיים ויסמן", email: "h.weiss@mail.com", auction_name: "מכירה #44", auction_number: 44, brand: "genazym", bid_count: 7, max_bid: 9000, lots_involved: 3, involvement_type: "live", is_winner: false, win_count: 0, total_win_value: 0, first_bid_at_brand: "2019-10-05" },
  { customer_id: "C011", full_name: "יוסף קליין", email: "y.klein@mail.com", auction_name: "מכירה #44", auction_number: 44, brand: "genazym", bid_count: 5, max_bid: 6500, lots_involved: 2, involvement_type: "early", is_winner: false, win_count: 0, total_win_value: 0, first_bid_at_brand: "2022-09-05" },

  // מכירה #43
  { customer_id: "C001", full_name: "אברהם גולדשטיין", email: "a.gold@mail.com", auction_name: "מכירה #43", auction_number: 43, brand: "genazym", bid_count: 14, max_bid: 18000, lots_involved: 6, involvement_type: "both", is_winner: true, win_count: 2, total_win_value: 30000, first_bid_at_brand: "2019-03-15" },
  { customer_id: "C003", full_name: "יצחק לוי", email: "y.levi@mail.com", auction_name: "מכירה #43", auction_number: 43, brand: "genazym", bid_count: 18, max_bid: 26000, lots_involved: 8, involvement_type: "both", is_winner: true, win_count: 3, total_win_value: 52000, first_bid_at_brand: "2018-06-20" },
  { customer_id: "C005", full_name: "שלמה רוזנברג", email: "s.rosen@mail.com", auction_name: "מכירה #43", auction_number: 43, brand: "genazym", bid_count: 26, max_bid: 40000, lots_involved: 12, involvement_type: "early", is_winner: true, win_count: 5, total_win_value: 98000, first_bid_at_brand: "2017-11-10" },
  { customer_id: "C004", full_name: "דוד פרידמן", email: "d.fried@mail.com", auction_name: "מכירה #43", auction_number: 43, brand: "genazym", bid_count: 4, max_bid: 5500, lots_involved: 2, involvement_type: "live", is_winner: false, win_count: 0, total_win_value: 0, first_bid_at_brand: "2021-12-01" },
  { customer_id: "C007", full_name: "נתן שטרן", email: "n.stern@mail.com", auction_name: "מכירה #43", auction_number: 43, brand: "genazym", bid_count: 10, max_bid: 14000, lots_involved: 5, involvement_type: "live", is_winner: true, win_count: 1, total_win_value: 14000, first_bid_at_brand: "2020-01-22" },
  { customer_id: "C008", full_name: "אליהו ברגר", email: "e.berger@mail.com", auction_name: "מכירה #43", auction_number: 43, brand: "genazym", bid_count: 3, max_bid: 4000, lots_involved: 2, involvement_type: "early", is_winner: false, win_count: 0, total_win_value: 0, first_bid_at_brand: "2022-07-15" },
  { customer_id: "C012", full_name: "רפאל דיאמנט", email: "r.diam@mail.com", auction_name: "מכירה #43", auction_number: 43, brand: "genazym", bid_count: 6, max_bid: 8000, lots_involved: 3, involvement_type: "both", is_winner: true, win_count: 1, total_win_value: 8000, first_bid_at_brand: "2021-03-20" },
];

// ─── Zaidy customers across 5 auctions ───
const zaidyCustomers: CustomerAuctionRow[] = [
  { customer_id: "C101", full_name: "ישראל ברוך", email: "i.baruch@mail.com", auction_name: "מכירה #47", auction_number: 47, brand: "zaidy", bid_count: 12, max_bid: 8500, lots_involved: 5, involvement_type: "both", is_winner: true, win_count: 2, total_win_value: 14000, first_bid_at_brand: "2020-02-15" },
  { customer_id: "C102", full_name: "עמוס גרינברג", email: "a.green@mail.com", auction_name: "מכירה #47", auction_number: 47, brand: "zaidy", bid_count: 8, max_bid: 6200, lots_involved: 3, involvement_type: "early", is_winner: true, win_count: 1, total_win_value: 6200, first_bid_at_brand: "2021-04-10" },
  { customer_id: "C103", full_name: "צבי הירש", email: "z.hirsh@mail.com", auction_name: "מכירה #47", auction_number: 47, brand: "zaidy", bid_count: 15, max_bid: 12000, lots_involved: 7, involvement_type: "both", is_winner: true, win_count: 3, total_win_value: 25000, first_bid_at_brand: "2019-08-22" },
  { customer_id: "C104", full_name: "שמעון פרלמן", email: "s.perl@mail.com", auction_name: "מכירה #47", auction_number: 47, brand: "zaidy", bid_count: 5, max_bid: 4800, lots_involved: 2, involvement_type: "live", is_winner: false, win_count: 0, total_win_value: 0, first_bid_at_brand: "2022-06-18" },
  { customer_id: "C105", full_name: "אהרון וייס", email: "a.weiss@mail.com", auction_name: "מכירה #47", auction_number: 47, brand: "zaidy", bid_count: 9, max_bid: 7000, lots_involved: 4, involvement_type: "early", is_winner: true, win_count: 1, total_win_value: 7000, first_bid_at_brand: "2020-11-30" },

  { customer_id: "C101", full_name: "ישראל ברוך", email: "i.baruch@mail.com", auction_name: "מכירה #46", auction_number: 46, brand: "zaidy", bid_count: 10, max_bid: 7800, lots_involved: 4, involvement_type: "both", is_winner: true, win_count: 1, total_win_value: 7800, first_bid_at_brand: "2020-02-15" },
  { customer_id: "C103", full_name: "צבי הירש", email: "z.hirsh@mail.com", auction_name: "מכירה #46", auction_number: 46, brand: "zaidy", bid_count: 13, max_bid: 10500, lots_involved: 6, involvement_type: "both", is_winner: true, win_count: 2, total_win_value: 18000, first_bid_at_brand: "2019-08-22" },
  { customer_id: "C106", full_name: "יעקב מלר", email: "y.maller@mail.com", auction_name: "מכירה #46", auction_number: 46, brand: "zaidy", bid_count: 7, max_bid: 5500, lots_involved: 3, involvement_type: "early", is_winner: false, win_count: 0, total_win_value: 0, first_bid_at_brand: "2021-09-12" },
  { customer_id: "C104", full_name: "שמעון פרלמן", email: "s.perl@mail.com", auction_name: "מכירה #46", auction_number: 46, brand: "zaidy", bid_count: 4, max_bid: 4200, lots_involved: 2, involvement_type: "live", is_winner: false, win_count: 0, total_win_value: 0, first_bid_at_brand: "2022-06-18" },

  { customer_id: "C101", full_name: "ישראל ברוך", email: "i.baruch@mail.com", auction_name: "מכירה #45", auction_number: 45, brand: "zaidy", bid_count: 14, max_bid: 9200, lots_involved: 6, involvement_type: "both", is_winner: true, win_count: 3, total_win_value: 20000, first_bid_at_brand: "2020-02-15" },
  { customer_id: "C102", full_name: "עמוס גרינברג", email: "a.green@mail.com", auction_name: "מכירה #45", auction_number: 45, brand: "zaidy", bid_count: 10, max_bid: 7500, lots_involved: 4, involvement_type: "early", is_winner: true, win_count: 2, total_win_value: 12000, first_bid_at_brand: "2021-04-10" },
  { customer_id: "C103", full_name: "צבי הירש", email: "z.hirsh@mail.com", auction_name: "מכירה #45", auction_number: 45, brand: "zaidy", bid_count: 18, max_bid: 15000, lots_involved: 8, involvement_type: "both", is_winner: true, win_count: 4, total_win_value: 35000, first_bid_at_brand: "2019-08-22" },
  { customer_id: "C105", full_name: "אהרון וייס", email: "a.weiss@mail.com", auction_name: "מכירה #45", auction_number: 45, brand: "zaidy", bid_count: 8, max_bid: 6000, lots_involved: 3, involvement_type: "early", is_winner: true, win_count: 1, total_win_value: 6000, first_bid_at_brand: "2020-11-30" },
  { customer_id: "C106", full_name: "יעקב מלר", email: "y.maller@mail.com", auction_name: "מכירה #45", auction_number: 45, brand: "zaidy", bid_count: 6, max_bid: 4800, lots_involved: 2, involvement_type: "early", is_winner: false, win_count: 0, total_win_value: 0, first_bid_at_brand: "2021-09-12" },

  { customer_id: "C101", full_name: "ישראל ברוך", email: "i.baruch@mail.com", auction_name: "מכירה #44", auction_number: 44, brand: "zaidy", bid_count: 11, max_bid: 8000, lots_involved: 5, involvement_type: "both", is_winner: true, win_count: 2, total_win_value: 13000, first_bid_at_brand: "2020-02-15" },
  { customer_id: "C103", full_name: "צבי הירש", email: "z.hirsh@mail.com", auction_name: "מכירה #44", auction_number: 44, brand: "zaidy", bid_count: 14, max_bid: 11000, lots_involved: 6, involvement_type: "both", is_winner: true, win_count: 3, total_win_value: 22000, first_bid_at_brand: "2019-08-22" },
  { customer_id: "C105", full_name: "אהרון וייס", email: "a.weiss@mail.com", auction_name: "מכירה #44", auction_number: 44, brand: "zaidy", bid_count: 7, max_bid: 5500, lots_involved: 3, involvement_type: "early", is_winner: false, win_count: 0, total_win_value: 0, first_bid_at_brand: "2020-11-30" },

  { customer_id: "C101", full_name: "ישראל ברוך", email: "i.baruch@mail.com", auction_name: "מכירה #43", auction_number: 43, brand: "zaidy", bid_count: 9, max_bid: 7200, lots_involved: 4, involvement_type: "both", is_winner: true, win_count: 1, total_win_value: 7200, first_bid_at_brand: "2020-02-15" },
  { customer_id: "C102", full_name: "עמוס גרינברג", email: "a.green@mail.com", auction_name: "מכירה #43", auction_number: 43, brand: "zaidy", bid_count: 6, max_bid: 5000, lots_involved: 3, involvement_type: "early", is_winner: true, win_count: 1, total_win_value: 5000, first_bid_at_brand: "2021-04-10" },
  { customer_id: "C103", full_name: "צבי הירש", email: "z.hirsh@mail.com", auction_name: "מכירה #43", auction_number: 43, brand: "zaidy", bid_count: 12, max_bid: 9500, lots_involved: 5, involvement_type: "both", is_winner: true, win_count: 2, total_win_value: 16000, first_bid_at_brand: "2019-08-22" },
  { customer_id: "C107", full_name: "גדליה שוורץ", email: "g.schwartz@mail.com", auction_name: "מכירה #43", auction_number: 43, brand: "zaidy", bid_count: 4, max_bid: 3500, lots_involved: 2, involvement_type: "live", is_winner: false, win_count: 0, total_win_value: 0, first_bid_at_brand: "2022-03-25" },
];

export const MOCK_CUSTOMER_AUCTION_DATA: CustomerAuctionRow[] = [
  ...genazymCustomers,
  ...zaidyCustomers,
];

export const MOCK_CUSTOMER_BRAND_DATA: CustomerBrandRow[] = [
  { customer_id: "C001", full_name: "אברהם גולדשטיין", email: "a.gold@mail.com", brand: "genazym", first_bid_at: "2019-03-15", last_bid_at: "2024-12-10", max_bid_ever: 25000, total_wins: 14, total_win_value: 204000, days_since_last_bid: 95, auctions_involved_count: 5 },
  { customer_id: "C003", full_name: "יצחק לוי", email: "y.levi@mail.com", brand: "genazym", first_bid_at: "2018-06-20", last_bid_at: "2024-12-14", max_bid_ever: 38000, total_wins: 22, total_win_value: 359000, days_since_last_bid: 91, auctions_involved_count: 5 },
  { customer_id: "C005", full_name: "שלמה רוזנברג", email: "s.rosen@mail.com", brand: "genazym", first_bid_at: "2017-11-10", last_bid_at: "2024-12-14", max_bid_ever: 52000, total_wins: 32, total_win_value: 588000, days_since_last_bid: 91, auctions_involved_count: 5 },
];

export const INVOLVEMENT_LABELS: Record<string, string> = {
  early: "מוקדם",
  live: "חי",
  both: "גם וגם",
};
