import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useStatusThresholds,
  StatusRule,
  RuleCondition,
  RuleParameter,
  RuleOperator,
  ConditionConnector,
  PARAMETER_LABELS,
  OPERATOR_LABELS,
} from "@/contexts/StatusThresholdsContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Crown, Zap, Sprout, Star, Plus, Trash2, ArrowDown } from "lucide-react";

interface StatusRulesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const uid = () => Math.random().toString(36).slice(2, 8);

const STATUS_META: Record<string, { icon: typeof Crown; color: string; bg: string }> = {
  vip: { icon: Crown, color: "hsl(var(--gold-dark, 45 80% 40%))", bg: "hsl(var(--accent) / 0.08)" },
  active: { icon: Zap, color: "hsl(var(--primary))", bg: "hsl(var(--primary) / 0.06)" },
  beginner: { icon: Sprout, color: "hsl(220, 45%, 40%)", bg: "hsl(220, 40%, 95%)" },
};

export default function StatusRulesModal({ open, onOpenChange }: StatusRulesModalProps) {
  const { rules, setRules } = useStatusThresholds();
  const [draft, setDraft] = useState<StatusRule[]>(rules);

  useEffect(() => {
    if (open) setDraft(JSON.parse(JSON.stringify(rules)));
  }, [open, rules]);

  const handleSave = () => {
    setRules(draft);
    onOpenChange(false);
  };

  const updateRule = (ruleIdx: number, updater: (r: StatusRule) => StatusRule) => {
    setDraft(prev => prev.map((r, i) => (i === ruleIdx ? updater({ ...r }) : r)));
  };

  const addCondition = (ruleIdx: number) => {
    updateRule(ruleIdx, r => ({
      ...r,
      conditions: [...r.conditions, { id: uid(), parameter: "totalWins" as RuleParameter, operator: ">=" as RuleOperator, value: 0 }],
    }));
  };

  const removeCondition = (ruleIdx: number, condId: string) => {
    updateRule(ruleIdx, r => ({
      ...r,
      conditions: r.conditions.filter(c => c.id !== condId),
    }));
  };

  const updateCondition = (ruleIdx: number, condId: string, patch: Partial<RuleCondition>) => {
    updateRule(ruleIdx, r => ({
      ...r,
      conditions: r.conditions.map(c => (c.id === condId ? { ...c, ...patch } : c)),
    }));
  };

  const toggleConnector = (ruleIdx: number) => {
    updateRule(ruleIdx, r => ({
      ...r,
      connector: r.connector === "OR" ? "AND" : "OR",
    }));
  };

  const paramOptions = Object.entries(PARAMETER_LABELS) as [RuleParameter, string][];
  const opOptions = Object.entries(OPERATOR_LABELS) as [RuleOperator, string][];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-lg">מנוע כללי סיווג לקוחות</DialogTitle>
          <DialogDescription>
            הגדר תנאים דינמיים לכל דרג. החישוב מבוסס על פעילות מצטברת בשני המותגים (Genazym + Zaidy). הבדיקה מתבצעת מלמעלה למטה.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 overflow-y-auto flex-1 pr-1">
          {draft.map((rule, ruleIdx) => {
            const meta = STATUS_META[rule.key] || STATUS_META.beginner;
            const Icon = meta.icon;

            return (
              <div key={rule.key}>
                <div
                  className="rounded-xl border p-4 space-y-3"
                  style={{ background: meta.bg, borderColor: "hsl(var(--border))" }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5" style={{ color: meta.color }} />
                    <span className="font-semibold text-sm" style={{ color: meta.color }}>
                      {rule.label}
                    </span>
                  </div>

                  {/* Conditions */}
                  <div className="space-y-2">
                    {rule.conditions.map((cond, condIdx) => (
                      <div key={cond.id}>
                        {/* Connector toggle between conditions */}
                        {condIdx > 0 && (
                          <div className="flex justify-center py-1">
                            <button
                              onClick={() => toggleConnector(ruleIdx)}
                              className="text-[10px] font-bold px-3 py-0.5 rounded-full border transition-colors"
                              style={{
                                borderColor: meta.color,
                                color: meta.color,
                                background: "hsl(var(--background) / 0.8)",
                              }}
                            >
                              {rule.connector === "OR" ? "או" : "וגם"}
                            </button>
                          </div>
                        )}

                        {/* Condition row */}
                        <div className="flex items-center gap-2 bg-background/60 rounded-lg border p-2" style={{ borderColor: "hsl(var(--border))" }}>
                          {/* Parameter */}
                          <Select
                            value={cond.parameter}
                            onValueChange={(v) => updateCondition(ruleIdx, cond.id, { parameter: v as RuleParameter })}
                          >
                            <SelectTrigger className="h-8 text-xs w-[160px] flex-shrink-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {paramOptions.map(([val, label]) => (
                                <SelectItem key={val} value={val} className="text-xs">{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {/* Operator */}
                          <Select
                            value={cond.operator}
                            onValueChange={(v) => updateCondition(ruleIdx, cond.id, { operator: v as RuleOperator })}
                          >
                            <SelectTrigger className="h-8 text-xs w-[60px] flex-shrink-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {opOptions.map(([val, label]) => (
                                <SelectItem key={val} value={val} className="text-xs">{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {/* Value */}
                          <Input
                            type="number"
                            value={cond.value}
                            onChange={(e) => updateCondition(ruleIdx, cond.id, { value: Number(e.target.value) || 0 })}
                            className="h-8 text-xs flex-1"
                          />

                          {/* Delete */}
                          <button
                            onClick={() => removeCondition(ruleIdx, cond.id)}
                            className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add condition */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => addCondition(ruleIdx)}
                    className="h-7 text-xs gap-1"
                    style={{ color: meta.color }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    הוסף תנאי
                  </Button>
                </div>

                {/* Arrow between tiers */}
                {ruleIdx < draft.length - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowDown className="w-4 h-4 text-muted-foreground/40" />
                  </div>
                )}
              </div>
            );
          })}

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
              ברירת מחדל — לקוחות שלא עמדו באף תנאי מהדרגות שלמעלה
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ביטול
          </Button>
          <Button onClick={handleSave}>שמור שינויים</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
