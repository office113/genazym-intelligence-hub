import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface BookFilters {
  smartSearch: string;
  freeTextEn: string;
  freeTextHe: string;
  priceField: "opening" | "final";
  priceFrom: string;
  priceTo: string;
  yearFrom: string;
  yearTo: string;
  saleNumber: string;
  brand: string;
  tags: string[];
  author: string;
}

export interface BookRecord {
  id: string;
  title: string;
  saleName: string;
  saleNumber: number;
  brand: string;
  author: string;
  year: string;
  openingPrice: number;
  finalPrice: number | null;
  sold: boolean;
  tags: string[];
  communities: string[];
  uniqueness: string[];
  origin: string;
  involvedCustomers: number;
  winnerName: string | null;
  winnerEmail: string | null;
  winnerType: string | null;
  lotNumber: string;
  descriptionHe: string;
  descriptionEn: string;
  bidsCount: number;
  earlyBidsCount: number;
  liveBidsCount: number;
  maxBid: number | null;
  upliftPct: number | null;
  siteLink: string | null;
  bookIdBidspirit: string;
}

const defaultFilters: BookFilters = {
  smartSearch: "",
  freeTextEn: "",
  freeTextHe: "",
  priceField: "opening",
  priceFrom: "",
  priceTo: "",
  yearFrom: "",
  yearTo: "",
  saleNumber: "",
  brand: "",
  tags: [],
  author: "",
};

function mapRow(row: any): BookRecord {
  const tags: string[] = [row.tag_category, row.tag_community, row.tag_origin, row.tag_uniqueness].filter(Boolean);

  return {
    id: String(row.book_id_bidspirit ?? row.id),
    bookIdBidspirit: row.book_id_bidspirit ?? "",
    title: row.book_name ?? row.head_hebrew ?? "",
    saleName: row.auction_name ?? "",
    saleNumber: Number(String(row.auction_name ?? "").replace(/\D/g, "")) || 0,
    brand: row.brand ?? "",
    author: row.author_hebrew ?? row.author_english ?? "",
    year: row.tag_year ?? "",
    openingPrice: Number(row.opening_price) || 0,
    finalPrice: row.sold_price != null ? Number(row.sold_price) : null,
    sold: row.sold_flag === true,
    tags,
    communities: [],
    uniqueness: [],
    origin: row.tag_origin ?? "",
    involvedCustomers: Number(row.unique_bidders_count) || 0,
    winnerName: row.winner_name ?? null,
    winnerEmail: row.winner_email ?? null,
    winnerType: row.winner_type ?? null,
    lotNumber: row.lot_index ?? "",
    descriptionHe: row.text_hebrew ?? "",
    descriptionEn: row.text_english ?? "",
    bidsCount: Number(row.total_bids) || 0,
    earlyBidsCount: Number(row.early_bids_count) || 0,
    liveBidsCount: Number(row.live_bids_count) || 0,
    maxBid: row.max_bid != null ? Number(row.max_bid) : null,
    upliftPct: row.uplift_pct != null ? Number(row.uplift_pct) : null,
    siteLink: row.site_link ?? null,
  };
}

export function useBookSearch() {
  const [filters, setFilters] = useState<BookFilters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [books, setBooks] = useState<BookRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchAllBooks() {
      setLoading(true);
      setError(null);

      const PAGE_SIZE = 1000;
      let allData: any[] = [];
      let from = 0;
      let hasMore = true;

      while (hasMore) {
        const { data, error: err } = await supabase
          .from("fact_book_auction_summary")
          .select("*")
          .range(from, from + PAGE_SIZE - 1);

        if (cancelled) return;

        if (err) {
          setError(err.message);
          setLoading(false);
          return;
        }

        allData = [...allData, ...(data ?? [])];
        hasMore = (data ?? []).length === PAGE_SIZE;
        from += PAGE_SIZE;
      }

      if (!cancelled) {
        setBooks(allData.map(mapRow));
        setLoading(false);
      }
    }

    fetchAllBooks();
    return () => {
      cancelled = true;
    };
  }, []);

  const updateFilter = <K extends keyof BookFilters>(key: K, value: BookFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => setFilters(defaultFilters);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.freeTextEn) count++;
    if (filters.freeTextHe) count++;
    if (filters.priceFrom || filters.priceTo) count++;
    if (filters.yearFrom || filters.yearTo) count++;
    if (filters.saleNumber) count++;
    if (filters.brand) count++;
    if (filters.tags.length > 0) count++;
    if (filters.author) count++;
    return count;
  }, [filters]);

  const results = useMemo(() => {
    return books.filter((book) => {
      if (filters.smartSearch) {
        const q = filters.smartSearch.toLowerCase();
        const searchable = [
          book.title,
          book.descriptionHe,
          book.descriptionEn,
          book.author,
          ...book.tags,
          book.origin,
          book.brand,
          book.saleName,
        ]
          .join(" ")
          .toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      if (filters.freeTextEn) {
        const q = filters.freeTextEn.toLowerCase();
        if (!book.descriptionEn.toLowerCase().includes(q) && !book.title.toLowerCase().includes(q)) return false;
      }

      if (filters.freeTextHe) {
        const q = filters.freeTextHe;
        const heFields = [book.title, book.descriptionHe, book.author, ...book.tags].join(" ");
        if (!heFields.includes(q)) return false;
      }

      if (filters.priceFrom || filters.priceTo) {
        const price = filters.priceField === "final" ? (book.finalPrice ?? book.openingPrice) : book.openingPrice;
        if (filters.priceFrom && price < Number(filters.priceFrom)) return false;
        if (filters.priceTo && price > Number(filters.priceTo)) return false;
      }

      if (filters.yearFrom && Number(book.year) < Number(filters.yearFrom)) return false;
      if (filters.yearTo && Number(book.year) > Number(filters.yearTo)) return false;

      if (filters.saleNumber && book.saleNumber !== Number(filters.saleNumber)) return false;

      if (filters.brand && book.brand !== filters.brand) return false;

      if (filters.tags.length > 0) {
        const bookAllTags = book.tags.map((t) => t.toLowerCase());
        if (!filters.tags.some((ft) => bookAllTags.some((bt) => bt.includes(ft.toLowerCase())))) return false;
      }

      if (filters.author && !book.author.includes(filters.author)) return false;

      return true;
    });
  }, [filters, books]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    books.forEach((b) =>
      b.tags.forEach((t) => {
        if (t) tagSet.add(t);
      }),
    );
    return Array.from(tagSet).sort();
  }, [books]);

  const allAuthors = useMemo(() => {
    return Array.from(new Set(books.map((b) => b.author).filter(Boolean))).sort();
  }, [books]);

  const allBrands = useMemo(() => {
    return Array.from(new Set(books.map((b) => b.brand).filter(Boolean))).sort();
  }, [books]);

  return {
    filters,
    updateFilter,
    resetFilters,
    showFilters,
    setShowFilters,
    activeFilterCount,
    results,
    allTags,
    allAuthors,
    allBrands,
    loading,
    error,
  };
}
