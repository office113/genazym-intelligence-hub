import { useState } from "react";
import SubNav from "@/components/layout/SubNav";
import BookSearchFilters from "@/components/books/BookSearchFilters";
import BookDrillDown from "@/components/books/BookDrillDown";
import { useBookSearch } from "@/hooks/useBookSearch";
import { type BookRecord } from "@/data/booksData";
import { Tag, Award, DollarSign, ArrowUpDown, BookOpen, Eye } from "lucide-react";

const tabs = [
  { key: "search", label: "חיפוש חכם" },
  { key: "gallery", label: "תצוגת ספרים" },
];

export default function Books() {
  const [activeTab, setActiveTab] = useState("search");
  const [selectedBook, setSelectedBook] = useState<BookRecord | null>(null);
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const search = useBookSearch();

  const openBook = (book: BookRecord) => {

    setSelectedBook(book);
    setDrillDownOpen(true);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const sorted = [...search.results].sort((a, b) => {
    if (!sortKey) return 0;
    const dir = sortAsc ? 1 : -1;
    switch (sortKey) {
      case "title": return a.title.localeCompare(b.title) * dir;
      case "sale": return (a.saleNumber - b.saleNumber) * dir;
      case "year": return (a.year - b.year) * dir;
      case "opening": return (a.openingPrice - b.openingPrice) * dir;
      case "final": return ((a.finalPrice ?? 0) - (b.finalPrice ?? 0)) * dir;
      default: return 0;
    }
  });

  const SortHeader = ({ label, field }: { label: string; field: string }) => (
    <th className="cursor-pointer select-none" onClick={() => handleSort(field)}>
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown className="w-3 h-3 opacity-40" />
      </span>
    </th>
  );

  return (
    <div className="min-h-screen">
      <SubNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} title="ספרים" />
      <div className="p-8 animate-fade-in">
        {search.loading && (
          <div className="text-center py-16 text-muted-foreground">טוען נתונים...</div>
        )}
        {search.error && (
          <div className="text-center py-16 text-destructive">
            <p className="font-semibold mb-1">שגיאה בטעינת נתונים</p>
            <p className="text-sm">{search.error}</p>
          </div>
        )}
        {!search.loading && !search.error && (
          <>
        {/* Shared Search & Filters */}
        <BookSearchFilters
          filters={search.filters}
          updateFilter={search.updateFilter}
          resetFilters={search.resetFilters}
          showFilters={search.showFilters}
          setShowFilters={search.setShowFilters}
          activeFilterCount={search.activeFilterCount}
          resultCount={search.results.length}
          allTags={search.allTags}
          allAuthors={search.allAuthors}
          allBrands={search.allBrands}
        />

        {/* Tab 1: Table View */}
        {activeTab === "search" && (
          <div className="chart-card p-0 overflow-hidden">
            <table className="data-table">
              <thead>
                <tr style={{ background: "hsl(var(--secondary) / 0.5)" }}>
                  <SortHeader label="שם הספר / לוט" field="title" />
                  <SortHeader label="מכירה" field="sale" />
                  <th>מותג</th>
                  <th>מחבר</th>
                  <SortHeader label="שנת הוצאה" field="year" />
                  <SortHeader label="מחיר פתיחה" field="opening" />
                  <SortHeader label="מחיר סופי" field="final" />
                  <th>תגיות</th>
                  <th>סטטוס</th>
                </tr>
              </thead>
              <tbody>
                {sorted.length === 0 ? (
                  <tr><td colSpan={9} className="text-center text-muted-foreground py-12">לא נמצאו תוצאות</td></tr>
                ) : sorted.map(book => (
                  <tr key={book.id} onClick={() => openBook(book)}>
                    <td className="font-semibold max-w-[220px]">
                      <div className="truncate">{book.title}</div>
                    </td>
                    <td className="text-muted-foreground">{book.saleName}</td>
                    <td>
                      <span className="filter-chip text-xs py-0.5">{book.brand}</span>
                    </td>
                    <td className="text-sm text-muted-foreground">{book.author}</td>
                    <td dir="ltr" className="text-center">{book.year}</td>
                    <td dir="ltr" className="font-medium">${book.openingPrice.toLocaleString()}</td>
                    <td dir="ltr" className="font-medium">
                      {book.finalPrice ? (
                        <span style={{ color: "hsl(var(--success))" }}>${book.finalPrice.toLocaleString()}</span>
                      ) : "—"}
                    </td>
                    <td>
                      <div className="flex gap-1 flex-wrap max-w-[160px]">
                        {book.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="badge-ai text-xs"><Tag className="w-2 h-2" />{tag}</span>
                        ))}
                        {book.tags.length > 2 && (
                          <span className="text-xs text-muted-foreground">+{book.tags.length - 2}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${book.sold ? "" : ""}`}
                        style={book.sold
                          ? { background: "hsl(var(--success) / 0.12)", color: "hsl(var(--success))" }
                          : { background: "hsl(var(--warning) / 0.12)", color: "hsl(var(--warning))" }
                        }>
                        {book.sold ? "נמכר" : "פתוח"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Card/Gallery View */}
        {activeTab === "gallery" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {sorted.length === 0 ? (
              <div className="col-span-2 text-center text-muted-foreground py-16">לא נמצאו תוצאות</div>
            ) : sorted.map(book => (
              <div key={book.id} className="action-card flex gap-5" onClick={() => openBook(book)}>
                {/* Icon */}
                <div className="w-20 h-24 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "hsl(var(--primary) / 0.06)" }}>
                  <BookOpen className="w-8 h-8" style={{ color: "hsl(var(--primary) / 0.35)" }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <h3 className="font-display font-bold text-sm leading-snug">{book.title}</h3>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full flex-shrink-0`}
                      style={book.sold
                        ? { background: "hsl(var(--success) / 0.12)", color: "hsl(var(--success))" }
                        : { background: "hsl(var(--warning) / 0.12)", color: "hsl(var(--warning))" }
                      }>
                      {book.sold ? "נמכר" : "פתוח"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                    <span className="filter-chip text-xs py-0.5">{book.brand}</span>
                    <span>{book.saleName}</span>
                    <span>לוט #{book.lotNumber}</span>
                  </div>

                  {/* Description snippet */}
                  <p className="text-xs text-muted-foreground leading-relaxed mb-2.5 line-clamp-2">
                    {book.descriptionHe}
                  </p>

                  {/* Price & stats row */}
                  <div className="flex items-center gap-4 text-xs mb-2">
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground">פתיחה:</span>
                      <strong>${book.openingPrice.toLocaleString()}</strong>
                    </span>
                    {book.finalPrice && (
                      <span className="flex items-center gap-1">
                        <Award className="w-3 h-3" style={{ color: "hsl(var(--success))" }} />
                        <span className="text-muted-foreground">סופי:</span>
                        <strong style={{ color: "hsl(var(--success))" }}>${book.finalPrice.toLocaleString()}</strong>
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Eye className="w-3 h-3" /> {book.involvedCustomers} מעורבים
                    </span>
                    {book.winnerName && (
                      <span className="text-xs">
                        זוכה: <strong style={{ color: "hsl(var(--accent))" }}>{book.winnerName}</strong>
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  <div className="flex gap-1.5 flex-wrap">
                    {book.tags.slice(0, 4).map(tag => (
                      <span key={tag} className="badge-ai text-xs"><Tag className="w-2 h-2" />{tag}</span>
                    ))}
                    {book.tags.length > 4 && (
                      <span className="text-xs text-muted-foreground">+{book.tags.length - 4}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Drill-down bottom sheet */}
      <BookDrillDown book={selectedBook} open={drillDownOpen} onClose={() => setDrillDownOpen(false)} />
    </div>
  );
}
