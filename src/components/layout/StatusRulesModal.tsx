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
import { Crown, Zap, Sprout, Star, ArrowDown } from "lucide-react";

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

  const tiers: {
    title: string;
    icon: typeof Crown;
    color: string;
    bg: string;
    spendKey: keyof StatusThresholds;
    auctionsKey: keyof StatusThresholds;
    description: string;
    editable: boolean;
  }[] = [
    {
      title: "VIP",
      icon: Crown,
      color: "hsl(var(--gold-dark, 45 80% 40%))",
      bg: "hsl(var(--accent) / 0.08)",
      spendKey: "vipSpend",
      auctionsKey: "vipAuctions",
      description: "דרג עליון — לקוחות עם הוצאות גבוהות או השתתפות רבה",
      editable: true,
    },
    {
      title: "פעיל",
      icon: Zap,
      color: "hsl(var(--primary))",
      bg: "hsl(var(--primary) / 0.06)",
      spendKey: "activeSpend",
      auctionsKey: "activeAuctions",
      description: "דרג ביניים — לקוחות עם פעילות סדירה",
      editable: true,
    },
    {
      title: "מתחיל",
      icon: Sprout,
      color: "hsl(220, 45%, 40%)",
      bg: "hsl(220, 40%, 95%)",
      spendKey: "beginnerSpend",
      auctionsKey: "beginnerAuctions",
      description: "דרג כניסה — כל לקוח שהשתתף לפחות פעם אחת",
      editable: true,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg">כללי סיווג לקוחות</DialogTitle>
          <DialogDescription>
            הסיווג מבוסס על פעילות מצטברת בשני המותגים (Genazym + Zaidy). הבדיקה מתבצעת מלמעלה למטה — הלקוח מקבל את הדרג הגבוה ביותר שהוא עומד בו.
          </DialogDescription>
        </DialogHeader>

        {/* Header row */}
        <div className="grid grid-cols-[1fr_1fr] gap-3 px-14 text-[11px] font-medium text-muted-foreground">
          <span>סף הוצאות מצטבר ($)</span>
          <span>מספר מכירות שהשתתף בהן</span>
        </div>

        <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
          {tiers.map((tier, idx) => (
            <div key={tier.title}>
              <div
                className="rounded-xl border p-4 space-y-3"
                style={{ background: tier.bg, borderColor: "hsl(var(--border))" }}
              >
                <div className="flex items-center gap-2">
                  <tier.icon className="w-5 h-5" style={{ color: tier.color }} />
                  <span className="font-semibold text-sm" style={{ color: tier.color }}>
                    {tier.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground mr-auto">
                    {tier.description}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Spend */}
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">
                      סף הוצאות מצטבר ($)
                    </label>
                    <div className="relative">
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
                      <Input
                        type="number"
                        value={draft[tier.spendKey]}
                        onChange={(e) => update(tier.spendKey, e.target.value)}
                        className="h-8 text-xs pr-7"
                      />
                    </div>
                  </div>
                  {/* Auctions */}
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-1">
                      מספר מכירות שהשתתף בהן
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">≥</span>
                      <Input
                        type="number"
                        value={draft[tier.auctionsKey]}
                        onChange={(e) => update(tier.auctionsKey, e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-muted-foreground/70">
                  תנאי: הוצאות ≥ ${draft[tier.spendKey].toLocaleString()} <strong>או</strong> מכירות ≥ {draft[tier.auctionsKey]}
                </div>
              </div>

              {/* Arrow between tiers */}
              {idx < tiers.length - 1 && (
                <div className="flex justify-center py-1">
                  <ArrowDown className="w-4 h-4 text-muted-foreground/40" />
                </div>
              )}
            </div>
          ))}

          {/* New — static */}
          <div className="flex justify-center py-1">
            <ArrowDown className="w-4 h-4 text-muted-foreground/40" />
          </div>
          <div
            className="rounded-xl border p-4 space-y-2"
            style={{ background: "hsl(200, 40%, 95%)", borderColor: "hsl(var(--border))" }}
          >
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5" style={{ color: "hsl(200, 45%, 35%)" }} />
              <span className="font-semibold text-sm" style={{ color: "hsl(200, 45%, 35%)" }}>
                חדש
              </span>
            </div>
            <div className="text-xs rounded-lg border p-2 bg-background/60" style={{ borderColor: "hsl(var(--border))" }}>
              ברירת מחדל — לקוחות עם 0 מכירות ו-$0 הוצאות
            </div>
          </div>
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
