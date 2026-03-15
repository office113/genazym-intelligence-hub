import { useState, useMemo } from "react";
import { booksDatabase, type BookRecord } from "@/data/booksData";

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

export function useBookSearch() {
  const [filters, setFilters] = useState<BookFilters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);

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
    return booksDatabase.filter(book => {
      // Smart search across all text fields
      if (filters.smartSearch) {
        const q = filters.smartSearch.toLowerCase();
        const searchable = [
          book.title, book.descriptionHe, book.descriptionEn,
          book.author, ...book.tags, ...book.communities,
          ...book.uniqueness, book.origin, book.brand, book.saleName,
        ].join(" ").toLowerCase();
        if (!searchable.includes(q)) return false;
      }

      // Free text English
      if (filters.freeTextEn) {
        const q = filters.freeTextEn.toLowerCase();
        if (!book.descriptionEn.toLowerCase().includes(q) && !book.title.toLowerCase().includes(q)) return false;
      }

      // Free text Hebrew
      if (filters.freeTextHe) {
        const q = filters.freeTextHe;
        const heFields = [book.title, book.descriptionHe, book.author, ...book.tags, ...book.communities].join(" ");
        if (!heFields.includes(q)) return false;
      }

      // Price filter
      if (filters.priceFrom || filters.priceTo) {
        const price = filters.priceField === "final" ? (book.finalPrice ?? book.openingPrice) : book.openingPrice;
        if (filters.priceFrom && price < Number(filters.priceFrom)) return false;
        if (filters.priceTo && price > Number(filters.priceTo)) return false;
      }

      // Year filter
      if (filters.yearFrom && book.year < Number(filters.yearFrom)) return false;
      if (filters.yearTo && book.year > Number(filters.yearTo)) return false;

      // Sale number
      if (filters.saleNumber && book.saleNumber !== Number(filters.saleNumber)) return false;

      // Brand
      if (filters.brand && book.brand !== filters.brand) return false;

      // Tags (match any)
      if (filters.tags.length > 0) {
        const bookAllTags = [...book.tags, ...book.communities, ...book.uniqueness].map(t => t.toLowerCase());
        if (!filters.tags.some(ft => bookAllTags.some(bt => bt.includes(ft.toLowerCase())))) return false;
      }

      // Author
      if (filters.author && !book.author.includes(filters.author)) return false;

      return true;
    });
  }, [filters]);

  // Collect all unique tags for filter suggestions
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    booksDatabase.forEach(b => {
      b.tags.forEach(t => tagSet.add(t));
      b.communities.forEach(t => tagSet.add(t));
      b.uniqueness.forEach(t => tagSet.add(t));
    });
    return Array.from(tagSet);
  }, []);

  const allAuthors = useMemo(() => {
    return Array.from(new Set(booksDatabase.map(b => b.author)));
  }, []);

  const allBrands = useMemo(() => {
    return Array.from(new Set(booksDatabase.map(b => b.brand)));
  }, []);

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
  };
}
