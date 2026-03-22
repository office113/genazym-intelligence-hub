import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Filter, X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface CustomerFilters {
  genazymId: string;
  zaidyId: string;
  maxBidMin: string;
  maxBidMax: string;
  totalWinsMin: string;
  totalWinsMax: string;
  classifications: string[];
  countries: string[];
  continents: string[];
}

export const defaultCustomerFilters: CustomerFilters = {
  genazymId: "",
  zaidyId: "",
  maxBidMin: "",
  maxBidMax: "",
  totalWinsMin: "",
  totalWinsMax: "",
  classifications: [],
  countries: [],
  continents: [],
};

interface Props {
  filters: CustomerFilters;
  onApply: (f: CustomerFilters) => void;
  onClear: () => void;
}

export default function CustomerAdvancedFilters({ filters, onApply, onClear }: Props) {
  const [local, setLocal] = useState<CustomerFilters>(filters);
  const [expanded, setExpanded] = useState(false);
  const [countryOptions, setCountryOptions] = useState<string[]>([]);
  const [classificationOptions, setClassificationOptions] = useState<string[]>([]);
  const [continentOptions, setContinentOptions] = useState<string[]>([]);
  const [countrySearch, setCountrySearch] = useState("");
  const [classSearch, setClassSearch] = useState("");
  const [continentSearch, setContinentSearch] = useState("");

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [countriesRes, classRes] = await Promise.all([
          supabase.from("customers").select("country").not("country", "is", null).limit(5000),
          supabase.from("customers").select("purchasing_power").not("purchasing_power", "is", null).limit(5000),
        ]);

        const uniqueCountries = [...new Set((countriesRes.data || []).map((r: any) => r.country).filter(Boolean))].sort();
        const uniqueClass = [...new Set((classRes.data || []).map((r: any) => r.purchasing_power).filter(Boolean))].sort();

        setCountryOptions(uniqueCountries as string[]);
        setClassificationOptions(uniqueClass as string[]);

        // continent may not exist — fetch separately to avoid crashing
        const continentRes = await supabase.from("customers").select("continent").not("continent", "is", null).limit(5000);
        if (continentRes.data) {
          const uniqueContinents = [...new Set(continentRes.data.map((r: any) => r.continent).filter(Boolean))].sort();
          setContinentOptions(uniqueContinents as string[]);
        }
      } catch (e) {
        console.error("Failed to fetch filter options:", e);
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    setLocal(filters);
  }, [filters]);

  const set = (key: keyof CustomerFilters, val: any) => setLocal(prev => ({ ...prev, [key]: val }));

  const toggleMulti = (key: "classifications" | "countries" | "continents", val: string) => {
    setLocal(prev => {
      const arr = prev[key] as string[];
      return { ...prev, [key]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] };
    });
  };

  const hasActiveFilters = local.genazymId || local.zaidyId || local.maxBidMin || local.maxBidMax ||
    local.totalWinsMin || local.totalWinsMax || local.classifications.length > 0 ||
    local.countries.length > 0 || local.continents.length > 0;

  const activeCount = [
    local.genazymId, local.zaidyId, local.maxBidMin || local.maxBidMax,
    local.totalWinsMin || local.totalWinsMax,
    local.classifications.length > 0 ? "x" : "",
    local.countries.length > 0 ? "x" : "",
    local.continents.length > 0 ? "x" : "",
  ].filter(Boolean).length;

  return (
    <div className="chart-card mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors w-full"
      >
        <Filter className="w-4 h-4" />
        <span>סינון מתקדם</span>
        {activeCount > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-primary text-primary-foreground">
            {activeCount}
          </span>
        )}
        <svg className={`w-4 h-4 mr-auto transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4">
          {/* Row 1: IDs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">מזהה גנזים</label>
              <Input
                type="number"
                placeholder="Genazym ID"
                value={local.genazymId}
                onChange={e => set("genazymId", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">מזהה זיידי</label>
              <Input
                type="number"
                placeholder="Zaidy ID"
                value={local.zaidyId}
                onChange={e => set("zaidyId", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">מקסימום ביד (מינ׳)</label>
              <Input
                type="number"
                placeholder="מינימום $"
                value={local.maxBidMin}
                onChange={e => set("maxBidMin", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">מקסימום ביד (מקס׳)</label>
              <Input
                type="number"
                placeholder="מקסימום $"
                value={local.maxBidMax}
                onChange={e => set("maxBidMax", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Row 2: Ranges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">סה״כ זכיות (מינ׳)</label>
              <Input
                type="number"
                placeholder="מינימום $"
                value={local.totalWinsMin}
                onChange={e => set("totalWinsMin", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">סה״כ זכיות (מקס׳)</label>
              <Input
                type="number"
                placeholder="מקסימום $"
                value={local.totalWinsMax}
                onChange={e => set("totalWinsMax", e.target.value)}
                className="h-9 text-sm"
              />
            </div>
          </div>

          {/* Row 3: Multi-select dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Classification */}
            <MultiSelectDropdown
              label="סיווג לקוח"
              options={classificationOptions}
              selected={local.classifications}
              onToggle={val => toggleMulti("classifications", val)}
              searchValue={classSearch}
              onSearchChange={setClassSearch}
            />

            {/* Country */}
            <MultiSelectDropdown
              label="מדינה"
              options={countryOptions}
              selected={local.countries}
              onToggle={val => toggleMulti("countries", val)}
              searchValue={countrySearch}
              onSearchChange={setCountrySearch}
            />

            {/* Continent */}
            <MultiSelectDropdown
              label="יבשת"
              options={continentOptions}
              selected={local.continents}
              onToggle={val => toggleMulti("continents", val)}
              searchValue={continentSearch}
              onSearchChange={setContinentSearch}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Button size="sm" onClick={() => onApply(local)} className="gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              סנן
            </Button>
            <Button size="sm" variant="outline" onClick={() => { onClear(); setLocal(defaultCustomerFilters); }} className="gap-1.5">
              <X className="w-3.5 h-3.5" />
              נקה סינונים
            </Button>
            {hasActiveFilters && (
              <span className="text-xs text-muted-foreground mr-2">
                {activeCount} סננים פעילים
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MultiSelectDropdown({
  label, options, selected, onToggle, searchValue, onSearchChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
  searchValue: string;
  onSearchChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const filtered = options.filter(o => o.toLowerCase().includes(searchValue.toLowerCase()));

  return (
    <div className="relative">
      <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full h-9 px-3 text-sm border border-input rounded-md bg-background hover:bg-accent/50 transition-colors"
      >
        <span className="truncate text-right">
          {selected.length > 0 ? `${selected.length} נבחרו` : "בחר..."}
        </span>
        <svg className={`w-4 h-4 transition-transform flex-shrink-0 ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {selected.slice(0, 3).map(s => (
            <span key={s} className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded bg-primary/10 text-primary">
              {s}
              <X className="w-2.5 h-2.5 cursor-pointer" onClick={() => onToggle(s)} />
            </span>
          ))}
          {selected.length > 3 && (
            <span className="text-[10px] text-muted-foreground">+{selected.length - 3}</span>
          )}
        </div>
      )}

      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-52 overflow-hidden">
          <div className="p-1.5 border-b border-border">
            <div className="relative">
              <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <input
                type="text"
                value={searchValue}
                onChange={e => onSearchChange(e.target.value)}
                placeholder="חיפוש..."
                className="w-full pr-7 pl-2 py-1 text-xs border border-input rounded bg-background focus:outline-none"
                onClick={e => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="overflow-y-auto max-h-40 p-1">
            {filtered.length === 0 && (
              <div className="text-xs text-muted-foreground text-center py-2">לא נמצאו תוצאות</div>
            )}
            {filtered.map(opt => (
              <button
                key={opt}
                onClick={() => onToggle(opt)}
                className={`flex items-center gap-2 w-full px-2 py-1 text-xs text-right rounded hover:bg-accent/50 transition-colors ${
                  selected.includes(opt) ? "bg-primary/10 text-primary font-medium" : ""
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded border flex-shrink-0 flex items-center justify-center ${
                  selected.includes(opt) ? "bg-primary border-primary" : "border-input"
                }`}>
                  {selected.includes(opt) && (
                    <svg className="w-2.5 h-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
