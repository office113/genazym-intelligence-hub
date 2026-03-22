import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useStatusThresholds, StatusThresholds } from "@/contexts/StatusThresholdsContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Crown, Zap, Sprout, Star } from "lucide-react";

interface StatusRulesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StatusRulesModal({ open, onOpenChange }: StatusRulesModalProps) {
  const { thresholds, setThresholds } = useStatusThresholds();
  const [draft, setDraft] = useState<StatusThresholds>(thresholds);

  useEffect(() => {
    if (open) setDraft(thresholds);
  }, [open, thresholds]);

  const update = (key: keyof StatusThresholds, val: string) => {
    setDraft(prev => ({ ...prev, [key]: Number(val) || 0 }));
  };

  const handleSave = () => {
    setThresholds(draft);
    onOpenChange(false);
  };

  const cards: {
    title: string;
    icon: typeof Crown;
    color: string;
    bg: string;
    fields: { label: string; key: keyof StatusThresholds; prefix?: string; suffix?: string }[];
    description: string;
  }[] = [
    {
      title: "VIP",
      icon: Crown,
      color: "hsl(var(--gold-dark, 45 80% 40%))",
      bg: "hsl(var(--accent) / 0.08)",
      description: "לקוחות עם הוצאות גבוהות או השתתפות רבה במכירות",
      fields: [
        { label: "סף הוצאות ($)", key: "vipSpend", prefix: "$" },
        { label: "או מספר מכירות ≥", key: "vipAuctions" },
      ],
    },
    {
      title: "פעיל",
      icon: Zap,
      color: "hsl(var(--primary))",
      bg: "hsl(var(--primary) / 0.06)",
      description: "לקוחות עם פעילות סדירה במכירות",
      fields: [
        { label: "מספר מכירות מינימלי", key: "activeMin" },
        { label: "מספר מכירות מקסימלי", key: "activeMax" },
      ],
    },
    {
      title: "מתחיל",
      icon: Sprout,
      color: "hsl(220, 45%, 40%)",
      bg: "hsl(220, 40%, 95%)",
      description: "לקוחות חדשים עם מעט היסטוריה",
      fields: [
        { label: "מספר מכירות מינימלי", key: "beginnerMin" },
        { label: "מספר מכירות מקסימלי", key: "beginnerMax" },
      ],
    },
    {
      title: "חדש",
      icon: Star,
      color: "hsl(200, 45%, 35%)",
      bg: "hsl(200, 40%, 95%)",
      description: "לקוחות ללא היסטוריית רכישות (0 מכירות)",
      fields: [],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg">כללי סיווג לקוחות</DialogTitle>
          <DialogDescription>הגדר את התנאים לכל סטטוס. השינויים יחולו מיידית בכל הדוחות.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl border p-4 space-y-3"
              style={{ background: card.bg, borderColor: "hsl(var(--border))" }}
            >
              <div className="flex items-center gap-2">
                <card.icon className="w-5 h-5" style={{ color: card.color }} />
                <span className="font-semibold text-sm" style={{ color: card.color }}>
                  {card.title}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">{card.description}</p>

              {card.fields.length > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  {card.fields.map((f) => (
                    <div key={f.key}>
                      <label className="text-[11px] text-muted-foreground block mb-1">{f.label}</label>
                      <div className="relative">
                        {f.prefix && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                            {f.prefix}
                          </span>
                        )}
                        <Input
                          type="number"
                          value={draft[f.key]}
                          onChange={(e) => update(f.key, e.target.value)}
                          className={`h-8 text-xs ${f.prefix ? "pr-7" : ""}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {card.fields.length === 0 && (
                <div className="text-xs rounded-lg border p-2 bg-background/60" style={{ borderColor: "hsl(var(--border))" }}>
                  לקוחות עם 0 מכירות מסווגים אוטומטית כ"חדש"
                </div>
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={handleSave}>שמור שינויים</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
