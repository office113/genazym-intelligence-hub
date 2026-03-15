import { Search, Filter, X, ChevronDown, Tag } from "lucide-react";
import { useBookSearch, type BookFilters } from "@/hooks/useBookSearch";

interface BookSearchFiltersProps {
  filters: ReturnType<typeof useBookSearch>["filters"];
  updateFilter: ReturnType<typeof useBookSearch>["updateFilter"];
  resetFilters: ReturnType<typeof useBookSearch>["resetFilters"];
  showFilters: boolean;
  setShowFilters: (v: boolean) => void;
  activeFilterCount: number;
  resultCount: number;
  allTags: string[];
  allAuthors: string[];
  allBrands: string[];
}

export default function BookSearchFilters({
  filters, updateFilter, resetFilters, showFilters, setShowFilters,
  activeFilterCount, resultCount, allTags, allAuthors, allBrands,
}: BookSearchFiltersProps) {
  const toggleTag = (tag: string) => {
    const current = filters.tags;
    updateFilter("tags", current.includes(tag) ? current.filter(t => t !== tag) : [...current, tag]);
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Smart Search Bar */}
      <div className="chart-card !p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
            <input
              type="text"
              value={filters.smartSearch}
              onChange={e => updateFilter("smartSearch", e.target.value)}
              placeholder="חיפוש חכם — שם ספר, מחבר, תיאור, תגית, קהילה, ייחודיות..."
              className="w-full pr-11 pl-4 py-3 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all"
              style={{ fontFamily: "var(--font-body)" }}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg border transition-colors ${
              showFilters || activeFilterCount > 0
                ? "border-accent/50 text-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-secondary"
            }`}
            style={activeFilterCount > 0 ? { background: "hsl(var(--accent) / 0.08)" } : {}}
          >
            <Filter className="w-4 h-4" />
            מסננים
            {activeFilterCount > 0 && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full text-white" style={{ background: "hsl(var(--accent))" }}>
                {activeFilterCount}
              </span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Quick examples */}
        <div className="flex gap-2 flex-wrap mt-3">
          <span className="text-xs text-muted-foreground ml-1 mt-0.5">דוגמאות:</span>
          {["חסידות", "כתב יד", "ונציה", "דפוס ראשון", "ר' אלימלך", "קבלה"].map(q => (
            <button key={q} onClick={() => updateFilter("smartSearch", q)} className="filter-chip text-xs">{q}</button>
          ))}
        </div>
      </div>

      {/* Structured Filters */}
      {showFilters && (
        <div className="chart-card !p-5 space-y-5 animate-fade-in">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold font-display">מסננים מתקדמים</h3>
            {activeFilterCount > 0 && (
              <button onClick={resetFilters} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <X className="w-3 h-3" /> נקה הכל
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Free text Hebrew */}
            <FilterField label="מלל חופשי עברית">
              <input type="text" value={filters.freeTextHe} onChange={e => updateFilter("freeTextHe", e.target.value)}
                placeholder="חיפוש בטקסט עברי..." className="filter-input" />
            </FilterField>

            {/* Free text English */}
            <FilterField label="מלל חופשי אנגלית">
              <input type="text" dir="ltr" value={filters.freeTextEn} onChange={e => updateFilter("freeTextEn", e.target.value)}
                placeholder="Search English text..." className="filter-input text-left" />
            </FilterField>

            {/* Author */}
            <FilterField label="מחבר">
              <select value={filters.author} onChange={e => updateFilter("author", e.target.value)} className="filter-input">
                <option value="">כל המחברים</option>
                {allAuthors.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </FilterField>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {/* Price type */}
            <FilterField label="סוג מחיר">
              <select value={filters.priceField} onChange={e => updateFilter("priceField", e.target.value as "opening" | "final")} className="filter-input">
                <option value="opening">מחיר פתיחה</option>
                <option value="final">מחיר סופי</option>
              </select>
            </FilterField>

            {/* Price from */}
            <FilterField label="ממחיר ($)">
              <input type="number" value={filters.priceFrom} onChange={e => updateFilter("priceFrom", e.target.value)}
                placeholder="0" className="filter-input" dir="ltr" />
            </FilterField>

            {/* Price to */}
            <FilterField label="עד מחיר ($)">
              <input type="number" value={filters.priceTo} onChange={e => updateFilter("priceTo", e.target.value)}
                placeholder="∞" className="filter-input" dir="ltr" />
            </FilterField>

            {/* Sale number */}
            <FilterField label="מספר מכירה">
              <input type="number" value={filters.saleNumber} onChange={e => updateFilter("saleNumber", e.target.value)}
                placeholder="למשל 48" className="filter-input" dir="ltr" />
            </FilterField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Year range */}
            <FilterField label="שנת הוצאה — מ">
              <input type="number" value={filters.yearFrom} onChange={e => updateFilter("yearFrom", e.target.value)}
                placeholder="1400" className="filter-input" dir="ltr" />
            </FilterField>
            <FilterField label="שנת הוצאה — עד">
              <input type="number" value={filters.yearTo} onChange={e => updateFilter("yearTo", e.target.value)}
                placeholder="2025" className="filter-input" dir="ltr" />
            </FilterField>

            {/* Brand */}
            <FilterField label="מותג">
              <select value={filters.brand} onChange={e => updateFilter("brand", e.target.value)} className="filter-input">
                <option value="">כל המותגים</option>
                {allBrands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </FilterField>
          </div>

          {/* Tags */}
          <div>
            <div className="text-xs font-medium text-muted-foreground mb-2">תגיות / קהילות / ייחודיות</div>
            <div className="flex gap-1.5 flex-wrap">
              {allTags.slice(0, 24).map(tag => (
                <button key={tag} onClick={() => toggleTag(tag)}
                  className={`filter-chip text-xs ${filters.tags.includes(tag) ? "filter-chip-active" : ""}`}>
                  <Tag className="w-2.5 h-2.5" />{tag}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-muted-foreground">{resultCount} תוצאות</div>
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}
