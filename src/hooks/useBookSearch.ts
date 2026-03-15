import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { BookRecord } from "@/data/booksData";

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
  const tags: string[] = [
    row.tag_category,
    row.tag_community,
    row.tag_origin,
    row.tag_year,
  ].filter(Boolean);

  return {
    id: row.id ?? `${row.lot_index}-${row.auction_name}`,
    lotNumber: row.lot_index ?? 0,
    title: row.book_name ?? "",
    descriptionHe: row.text_hebrew ?? "",
    descriptionEn: "",
    author: row.author_hebrew ?? "",
    year: row.tag_year ? Number(row.tag_year) : 0,
    origin: row.tag_origin ?? "",
    brand: row.brand ?? "",
    saleNumber: 0,
    saleName: row.auction_name ?? "",
    openingPrice: row.opening_price ?? 0,
    finalPrice: row.sold_price ?? null,
    sold: row.sold_flag === true || row.sold_flag === "true",
    tags,
    communities: [],
    uniqueness: [],
    bidsCount: 0,
    involvedCustomers: row.unique_bidders_count ?? 0,
    winnerName: row.winner_name ?? null,
    winnerId: null,
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
    async function fetchBooks() {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from("fact_book_auction_summary")
        .select("*");
      if (cancelled) return;
      if (err) {
        setError(err.message);
        setBooks([]);
      } else {
        setBooks((data ?? []).map(mapRow));
      }
      setLoading(false);
    }
    fetchBooks();
    return () => { cancelled = true; };
  }, []);

  const updateFilter = <K extends keyof BookFilters>(key: K, value: BookFilters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }));
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
    return books.filter(book => {
      if (filters.smartSearch) {
        const q = filters.smartSearch.toLowerCase();
        const searchable = [
          book.title, book.descriptionHe, book.descriptionEn,
          book.author, ...book.tags, ...book.communities,
          ...book.uniqueness, book.origin, book.brand, book.saleName,
        ].join(" ").toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      if (filters.freeTextEn) {
        const q = filters.freeTextEn.toLowerCase();
        if (!book.descriptionEn.toLowerCase().includes(q) && !book.title.toLowerCase().includes(q)) return false;
      }

      if (filters.freeTextHe) {
        const q = filters.freeTextHe;
        const heFields = [book.title, book.descriptionHe, book.author, ...book.tags, ...book.communities].join(" ");
        if (!heFields.includes(q)) return false;
      }

      if (filters.priceFrom || filters.priceTo) {
        const price = filters.priceField === "final" ? (book.finalPrice ?? book.openingPrice) : book.openingPrice;
        if (filters.priceFrom && price < Number(filters.priceFrom)) return false;
        if (filters.priceTo && price > Number(filters.priceTo)) return false;
      }

      if (filters.yearFrom && book.year < Number(filters.yearFrom)) return false;
      if (filters.yearTo && book.year > Number(filters.yearTo)) return false;

      if (filters.saleNumber && book.saleNumber !== Number(filters.saleNumber)) return false;

      if (filters.brand && book.brand !== filters.brand) return false;

      if (filters.tags.length > 0) {
        const bookAllTags = [...book.tags, ...book.communities, ...book.uniqueness].map(t => t.toLowerCase());
        if (!filters.tags.some(ft => bookAllTags.some(bt => bt.includes(ft.toLowerCase())))) return false;
      }

      if (filters.author && !book.author.includes(filters.author)) return false;

      return true;
    });
  }, [filters, books]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    books.forEach(b => {
      b.tags.forEach(t => tagSet.add(t));
      b.communities.forEach(t => tagSet.add(t));
      b.uniqueness.forEach(t => tagSet.add(t));
    });
    return Array.from(tagSet);
  }, [books]);

  const allAuthors = useMemo(() => {
    return Array.from(new Set(books.map(b => b.author).filter(Boolean)));
  }, [books]);

  const allBrands = useMemo(() => {
    return Array.from(new Set(books.map(b => b.brand).filter(Boolean)));
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
